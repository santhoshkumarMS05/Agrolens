"""
AgroLens — Continuous Learning & Transfer Learning Engine for Crop Growth Stages
================================================================================
Implements independent parameter-isolated fine-tuning and progressive class expansion
specifically for the Crop Growth Stage model (ConvNeXt-Tiny):

1. Starts at 0 local stage classes (all initial inference seamlessly handled by Nova Lite).
2. As the admin approves stage classes in the training queue (Vegetative, Reproductive, Ripening, etc.),
   this engine dynamically expands or initializes `stage_model.pth`.
3. Freezes early backbone layers to preserve ImageNet/general botanical features.
4. Updates `stage_classes.json` on each retraining run.
5. Automatically exports the updated stage model to `stage_model.onnx` (and copies to `frontend/public/stage_model.onnx`).
6. Zero conflict with the disease model (`crop_disease_convnext_tiny_20_epoch.pth`).
"""

import os
import re
import time
import json
import copy
import shutil
import threading
from pathlib import Path
from typing import Dict, Any, List, Optional

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import models, transforms
from PIL import Image

BASE_DIR = Path(__file__).resolve().parent
TRAINING_POOL_DIR = BASE_DIR / "training_pool"
STAGE_CLASSES_PATH = BASE_DIR / "stage_classes.json"
STAGE_MODEL_PATH = BASE_DIR / "stage_model.pth"
STAGE_ONNX_PATH = BASE_DIR / "stage_model.onnx"
FRONTEND_STAGE_ONNX = BASE_DIR.parent / "frontend" / "public" / "stage_model.onnx"
WEB_STAGE_ONNX = BASE_DIR.parent / "web" / "stage_model.onnx"

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

STAGE_TRAINING_STATUS: Dict[str, Any] = {
    "is_training": False,
    "target_class": None,
    "current_epoch": 0,
    "total_epochs": 0,
    "train_loss": 0.0,
    "val_accuracy": 0.0,
    "step_description": "Idle",
    "completed": False,
    "error": None,
    "history": []
}

_STAGE_TRAIN_LOCK = threading.Lock()


def get_stage_class_names() -> List[str]:
    """Load current stage class names from JSON file."""
    if STAGE_CLASSES_PATH.exists():
        try:
            with open(STAGE_CLASSES_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    return []


def save_stage_class_names(names: List[str]):
    """Save stage class names in backend, web, and frontend."""
    with open(STAGE_CLASSES_PATH, "w", encoding="utf-8") as f:
        json.dump(names, f, indent=2)

    for target_dir in [BASE_DIR.parent / "frontend" / "public", BASE_DIR.parent / "web"]:
        try:
            target_dir.mkdir(parents=True, exist_ok=True)
            with open(target_dir / "stage_classes.json", "w", encoding="utf-8") as f:
                json.dump(names, f, indent=2)
        except Exception as e:
            print(f"[warn] Failed writing stage_classes.json to {target_dir}: {e}")


def sanitize_folder_name(name: str) -> str:
    clean = re.sub(r"[^\w\s-]", "", name).strip()
    return re.sub(r"[-\s]+", "_", clean).lower()


class StageImageDataset(Dataset):
    def __init__(self, samples: List[tuple], transform=None):
        self.samples = samples  # [(path, label_idx), ...]
        self.transform = transform

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        path, label = self.samples[idx]
        try:
            img = Image.open(path).convert("RGB")
        except Exception:
            img = Image.new("RGB", (224, 224), color=(34, 139, 34))
        if self.transform:
            img = self.transform(img)
        return img, label


def get_stage_transforms():
    train_transform = transforms.Compose([
        transforms.Resize((236, 236)),
        transforms.RandomCrop(224),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomVerticalFlip(p=0.2),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.15),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    val_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    return train_transform, val_transform


def gather_stage_training_samples(target_class: str, stage_class_list: List[str]) -> tuple:
    """
    Gathers approved samples across all stage classes in the pool.
    """
    all_samples = []
    target_idx = stage_class_list.index(target_class)
    approved_base = TRAINING_POOL_DIR / "approved"

    for idx, c_name in enumerate(stage_class_list):
        folder = approved_base / sanitize_folder_name(c_name)
        if folder.exists():
            for p in folder.glob("*.*"):
                if p.suffix.lower() in [".jpg", ".jpeg", ".png", ".webp"]:
                    all_samples.append((str(p), idx))

    if not all_samples:
        raise ValueError(f"No approved stage training samples found for '{target_class}'.")

    import random
    random.seed(42)
    random.shuffle(all_samples)
    split_idx = int(0.8 * len(all_samples))
    if split_idx == len(all_samples):
        split_idx = max(1, len(all_samples) - 1)

    train_samples = all_samples[:split_idx]
    val_samples = all_samples[split_idx:] if split_idx < len(all_samples) else all_samples[:split_idx]
    return train_samples, val_samples


def build_stage_model(num_classes: int) -> nn.Module:
    """
    Constructs or adapts the ConvNeXt-Tiny stage classifier head.
    Freezes earlier convolutional stages to preserve feature extraction.
    """
    model = models.convnext_tiny(weights=models.ConvNeXt_Tiny_Weights.DEFAULT)
    in_features = model.classifier[2].in_features  # 768

    # Check if a previous stage model exists
    if STAGE_MODEL_PATH.exists():
        try:
            state_dict = torch.load(STAGE_MODEL_PATH, map_location="cpu")
            head_weight_key = "classifier.2.1.weight"
            if head_weight_key in state_dict:
                old_classes = state_dict[head_weight_key].shape[0]
                model.classifier[2] = nn.Sequential(
                    nn.Dropout(0.3),
                    nn.Linear(in_features, old_classes)
                )
                model.load_state_dict(state_dict)

                # Expand head if new class added
                if num_classes > old_classes:
                    old_linear = model.classifier[2][1]
                    new_linear = nn.Linear(in_features, num_classes)
                    with torch.no_grad():
                        new_linear.weight[:old_classes, :] = old_linear.weight.data
                        new_linear.bias[:old_classes] = old_linear.bias.data
                    model.classifier[2][1] = new_linear
            else:
                model.classifier[2] = nn.Sequential(
                    nn.Dropout(0.3),
                    nn.Linear(in_features, num_classes)
                )
        except Exception as e:
            print(f"[warn] Failed loading existing stage checkpoint: {e}")
            model.classifier[2] = nn.Sequential(
                nn.Dropout(0.3),
                nn.Linear(in_features, num_classes)
            )
    else:
        model.classifier[2] = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(in_features, num_classes)
        )

    # Freeze feature extractor stages 0 to 2
    for param in model.features[:-1].parameters():
        param.requires_grad = False

    # Unfreeze stage 3 and classifier head
    for param in model.features[-1].parameters():
        param.requires_grad = True

    for param in model.classifier.parameters():
        param.requires_grad = True

    return model.to(DEVICE)


def export_stage_onnx(model: nn.Module) -> bool:
    """Exports stage model to ONNX for offline inference."""
    try:
        model.eval().to("cpu")
        dummy_input = torch.randn(1, 3, 224, 224, device="cpu")

        # 1. Export in backend
        torch.onnx.export(
            model,
            dummy_input,
            str(STAGE_ONNX_PATH),
            input_names=["input"],
            output_names=["output"],
            dynamic_axes={"input": {0: "batch_size"}, "output": {0: "batch_size"}},
            opset_version=14
        )
        print(f"[OK] Exported stage model to {STAGE_ONNX_PATH}")

        # 2. Copy to frontend and web directories for client-side offline use
        for target in [FRONTEND_STAGE_ONNX, WEB_STAGE_ONNX]:
            try:
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(str(STAGE_ONNX_PATH), str(target))
                print(f"[OK] Copied stage ONNX to {target}")
            except Exception as e:
                print(f"[warn] Could not copy stage ONNX to {target}: {e}")

        model.to(DEVICE)
        return True
    except Exception as e:
        print(f"[error] Failed stage ONNX export: {e}")
        model.to(DEVICE)
        return False


def execute_stage_retraining(target_class: str, num_epochs: int = 5, batch_size: int = 16, user_id: Optional[int] = None):
    """Background worker executing the growth stage transfer learning loop."""
    global STAGE_TRAINING_STATUS

    with _STAGE_TRAIN_LOCK:
        try:
            STAGE_TRAINING_STATUS.update({
                "is_training": True,
                "target_class": target_class,
                "current_epoch": 0,
                "total_epochs": num_epochs,
                "train_loss": 0.0,
                "val_accuracy": 0.0,
                "step_description": "1/5: Loading Stage Class Registry...",
                "completed": False,
                "error": None,
                "history": []
            })

            # 1. Update class list
            stage_classes = get_stage_class_names()
            if target_class not in stage_classes:
                stage_classes.append(target_class)
                save_stage_class_names(stage_classes)

            # 2. Gather data
            STAGE_TRAINING_STATUS["step_description"] = f"2/5: Gathering approved training images for '{target_class}'..."
            train_samples, val_samples = gather_stage_training_samples(target_class, stage_classes)

            train_transform, val_transform = get_stage_transforms()
            train_ds = StageImageDataset(train_samples, transform=train_transform)
            val_ds = StageImageDataset(val_samples, transform=val_transform)

            train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, num_workers=0)
            val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False, num_workers=0)

            # 3. Model setup
            STAGE_TRAINING_STATUS["step_description"] = f"3/5: Building ConvNeXt-Tiny stage network ({len(stage_classes)} classes)..."
            model = build_stage_model(len(stage_classes))

            criterion = nn.CrossEntropyLoss()
            optimizer = optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=1e-4, weight_decay=1e-2)
            scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=max(1, num_epochs))

            # 4. Training loop
            best_acc = 0.0
            best_wts = copy.deepcopy(model.state_dict())
            epoch_loss = 0.0

            for epoch in range(num_epochs):
                STAGE_TRAINING_STATUS["step_description"] = f"4/5: Fine-tuning stage head (Epoch {epoch+1}/{num_epochs})..."
                model.train()
                running_loss = 0.0
                total_train = 0

                for inputs, labels in train_loader:
                    inputs = inputs.to(DEVICE)
                    labels = labels.to(DEVICE)

                    optimizer.zero_grad()
                    outputs = model(inputs)
                    loss = criterion(outputs, labels)
                    loss.backward()
                    optimizer.step()

                    running_loss += loss.item() * inputs.size(0)
                    total_train += inputs.size(0)

                scheduler.step()
                epoch_loss = running_loss / max(1, total_train)

                # Validation
                model.eval()
                correct = 0
                total_val = 0
                with torch.no_grad():
                    for inputs, labels in val_loader:
                        inputs = inputs.to(DEVICE)
                        labels = labels.to(DEVICE)
                        preds = model(inputs).argmax(dim=1)
                        correct += preds.eq(labels).sum().item()
                        total_val += inputs.size(0)

                epoch_acc = (correct / max(1, total_val)) * 100.0
                if epoch_acc >= best_acc:
                    best_acc = epoch_acc
                    best_wts = copy.deepcopy(model.state_dict())

                STAGE_TRAINING_STATUS["current_epoch"] = epoch + 1
                STAGE_TRAINING_STATUS["train_loss"] = round(epoch_loss, 4)
                STAGE_TRAINING_STATUS["val_accuracy"] = round(epoch_acc, 2)
                STAGE_TRAINING_STATUS["history"].append({
                    "epoch": epoch + 1,
                    "loss": round(epoch_loss, 4),
                    "acc": round(epoch_acc, 2)
                })
                time.sleep(0.3)

            # 5. Save best checkpoint and export ONNX
            STAGE_TRAINING_STATUS["step_description"] = "5/5: Exporting stage ONNX and reloading inference engine..."
            model.load_state_dict(best_wts)
            torch.save(model.state_dict(), str(STAGE_MODEL_PATH))

            export_stage_onnx(model)

            # Hot-reload in app.py
            try:
                from app import load_native_stage_model
                load_native_stage_model()
            except Exception as reload_err:
                print(f"[warn] Could not hot-reload stage model in app: {reload_err}")

            STAGE_TRAINING_STATUS["completed"] = True
            STAGE_TRAINING_STATUS["step_description"] = f"Stage training completed successfully! Accuracy: {best_acc:.1f}%."

        except Exception as e:
            import traceback
            traceback.print_exc()
            STAGE_TRAINING_STATUS["error"] = str(e)
            STAGE_TRAINING_STATUS["step_description"] = f"Error during stage training: {str(e)}"
        finally:
            STAGE_TRAINING_STATUS["is_training"] = False


def trigger_stage_training_async(target_class: str, num_epochs: int = 5, user_id: Optional[int] = None) -> bool:
    """Launch background thread for stage retraining."""
    if STAGE_TRAINING_STATUS["is_training"]:
        return False

    t = threading.Thread(
        target=execute_stage_retraining,
        kwargs={"target_class": target_class, "num_epochs": num_epochs, "user_id": user_id},
        daemon=True
    )
    t.start()
    return True
