"""
AgroLens — Rollback 'Earlyblight tomato' Class
1. Prunes classification layer back to the original 25 classes.
2. Updates backend and web class_names.json.
3. Re-exports clean 25-class ONNX model.
4. Cleans up training pool folders and database records.
"""
import os
import json
import shutil
from pathlib import Path
import torch
import torch.nn as nn
from torchvision import models
import psycopg
from dotenv import load_dotenv

BASE = Path(__file__).resolve().parent
WEB = (BASE.parent / "web").resolve()
load_dotenv(BASE / ".env")

DB_NAME = os.getenv("DB_NAME", "agrolens")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "6379")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

CLASSES_PATH = BASE / "class_names.json"
WEB_CLASSES_PATH = WEB / "class_names.json"
MODEL_PATH = BASE / "crop_disease_convnext_tiny_20_epoch.pth"
ONNX_PATH = WEB / "leaflet_model.onnx"
TRAINING_POOL = BASE / "training_pool"

def rollback():
    print("[1/5] Pruning class_names.json...")
    with open(CLASSES_PATH, "r", encoding="utf-8") as f:
        classes = json.load(f)

    # Remove Earlyblight tomato if present
    classes_25 = [c for c in classes if "earlyblight" not in c.lower() or "tomato" not in c.lower()]
    print(f"  Old classes: {len(classes)} -> New classes: {len(classes_25)}")

    with open(CLASSES_PATH, "w", encoding="utf-8") as f:
        json.dump(classes_25, f, indent=2)
    if WEB_CLASSES_PATH.exists():
        with open(WEB_CLASSES_PATH, "w", encoding="utf-8") as f:
            json.dump(classes_25, f, indent=2)

    print("[2/5] Pruning PyTorch checkpoint weights to 25 classes...")
    state_dict = torch.load(MODEL_PATH, map_location="cpu")
    weight_key = "classifier.2.1.weight"
    bias_key = "classifier.2.1.bias"

    if weight_key in state_dict:
        w = state_dict[weight_key]
        b = state_dict[bias_key]
        print(f"  Current classifier weight shape: {w.shape}")
        if w.shape[0] > len(classes_25):
            state_dict[weight_key] = w[:len(classes_25), :]
            state_dict[bias_key] = b[:len(classes_25)]
            print(f"  Pruned classifier weight shape: {state_dict[weight_key].shape}")
            torch.save(state_dict, str(MODEL_PATH))
            print(f"  [OK] Saved pruned checkpoint to {MODEL_PATH}")

    print("[3/5] Re-exporting clean 25-class ONNX model...")
    model = models.convnext_tiny(weights=None)
    in_features = model.classifier[2].in_features
    model.classifier[2] = nn.Sequential(
        nn.Dropout(0.3),
        nn.Linear(in_features, len(classes_25))
    )
    model.load_state_dict(state_dict)
    model.eval()

    dummy_input = torch.randn(1, 3, 224, 224)
    torch.onnx.export(
        model,
        dummy_input,
        str(ONNX_PATH),
        input_names=["input"],
        output_names=["output"],
        dynamic_axes={"input": {0: "batch_size"}, "output": {0: "batch_size"}},
        opset_version=14
    )
    print(f"  [OK] Exported 25-class ONNX to {ONNX_PATH} ({os.path.getsize(ONNX_PATH):,} bytes)")

    print("[4/5] Removing training pool approved folders & pending files...")
    # Remove earlyblight_tomato and tomato_early_blight from approved
    for folder in ["earlyblight_tomato", "tomato_early_blight"]:
        p = TRAINING_POOL / "approved" / folder
        if p.exists():
            shutil.rmtree(p, ignore_errors=True)
            print(f"  Removed folder: {p}")

    # Remove tomato_eb_*.jpg from pending
    pending_dir = TRAINING_POOL / "pending"
    if pending_dir.exists():
        count = 0
        for f in list(pending_dir.glob("tomato_eb_*.*")):
            try:
                f.unlink()
                count += 1
            except Exception:
                pass
        print(f"  Removed {count} pending tomato images.")

    print("[5/5] Cleaning database records...")
    try:
        conn = psycopg.connect(DATABASE_URL)
        with conn.cursor() as cur:
            cur.execute("""
                DELETE FROM training_queue
                WHERE proposed_class ILIKE '%earlyblight%tomato%'
                   OR proposed_class ILIKE '%tomato%early%blight%'
            """)
            deleted_q = cur.rowcount
            cur.execute("""
                DELETE FROM model_training_history
                WHERE target_class ILIKE '%earlyblight%tomato%'
                   OR target_class ILIKE '%tomato%early%blight%'
            """)
            deleted_h = cur.rowcount
        conn.commit()
        conn.close()
        print(f"  Cleaned {deleted_q} queue rows and {deleted_h} training history rows.")
    except Exception as db_err:
        print(f"  [warn] Database cleanup note: {db_err}")

    print("\n[SUCCESS] Model and Staging Queue successfully rolled back to original 25 classes!")

if __name__ == "__main__":
    rollback()
