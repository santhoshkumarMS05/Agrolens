"""
Lightweight seeder to populate realistic pending active learning images in training_queue
and backend/training_pool/pending/ for immediate live testing and inspection in the Admin Dashboard.
"""
import os
import shutil
import uuid
from pathlib import Path
import psycopg
from dotenv import load_dotenv

BASE = Path(__file__).resolve().parent
load_dotenv(BASE / ".env")

DB_NAME = os.getenv("DB_NAME", "agrolens")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

DATASET_ROOT = Path(r"D:\Farm AI Dataset Final\Combined")
PENDING_DIR = BASE / "training_pool" / "pending"
PENDING_DIR.mkdir(parents=True, exist_ok=True)

# Sample candidates to seed
CANDIDATES = [
    {
        "folder": "Brownspot rice",
        "proposed_class": "Rice · Brown Spot",
        "crop": "Rice",
        "confidence": 91.4,
        "crop_score": 98.6,
        "source": "nova_lite",
        "notes": "Nova Lite Teacher Model: Distinct oval brown lesions with yellow halo on upper leaf blade."
    },
    {
        "folder": "Bacterialblight Cotton",
        "proposed_class": "Cotton · Bacterial Blight",
        "crop": "Cotton",
        "confidence": 89.2,
        "crop_score": 97.4,
        "source": "nova_lite",
        "notes": "Nova Lite Teacher Model: Angular water-soaked lesions bounded by veinlets visible across leaf lamina."
    },
    {
        "folder": "Commonrust corn",
        "proposed_class": "Corn · Common Rust",
        "crop": "Corn",
        "confidence": 93.8,
        "crop_score": 99.1,
        "source": "nova_lite",
        "notes": "Nova Lite Teacher Model: Golden-brown to cinnamon powdery pustules scattered along both leaf surfaces."
    },
    {
        "folder": "Earlyleafspot Groundnut",
        "proposed_class": "Groundnut · Early Leaf Spot",
        "crop": "Groundnut",
        "confidence": 88.7,
        "crop_score": 96.8,
        "source": "nova_lite",
        "notes": "Nova Lite Teacher Model: Sub-circular necrotic spots with prominent chlorotic halo on adaxial foliage."
    },
    {
        "folder": "Brownrust Sugarcane",
        "proposed_class": "Sugarcane · Brown Rust",
        "crop": "Sugarcane",
        "confidence": 90.5,
        "crop_score": 98.2,
        "source": "nova_lite",
        "notes": "Nova Lite Teacher Model: Elongated reddish-brown foliar lesions parallel to midrib."
    },
    {
        "folder": "Anthracnose Redrot Sorghum",
        "proposed_class": "Sorghum · Anthracnose",
        "crop": "Sorghum",
        "confidence": 76.4,
        "crop_score": 95.0,
        "source": "farmer_report",
        "notes": "Farmer flagged: Model predicted healthy foliage, but suspicious circular reddish lesions observed near leaf margin."
    },
    {
        "folder": "Bacterialblight rice",
        "proposed_class": "Rice · Bacterial Blight",
        "crop": "Rice",
        "confidence": 94.2,
        "crop_score": 99.5,
        "source": "model_high_confidence",
        "notes": "Student model high-confidence prediction (94.2%) queued for routine active learning validation."
    }
]

def seed():
    conn = psycopg.connect(DATABASE_URL)
    seeded_count = 0
    with conn.cursor() as cur:
        for c in CANDIDATES:
            src_dir = DATASET_ROOT / c["folder"]
            if not src_dir.exists():
                print(f"[skip] Folder not found: {src_dir}")
                continue
            
            # Pick first jpg/png
            img_files = list(src_dir.glob("*.jpg")) + list(src_dir.glob("*.png")) + list(src_dir.glob("*.jpeg"))
            if not img_files:
                continue
            
            src_img = img_files[0]
            file_name = f"seed_{uuid.uuid4().hex[:8]}_{src_img.name}"
            dest_path = PENDING_DIR / file_name
            shutil.copy(str(src_img), str(dest_path))

            cur.execute("""
                INSERT INTO training_queue (
                    image_name, image_path, proposed_class, crop, confidence, crop_score, source, status, notes
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, 'pending', %s)
            """, (
                file_name,
                f"pending/{file_name}",
                c["proposed_class"],
                c["crop"],
                c["confidence"],
                c["crop_score"],
                c["source"],
                c["notes"]
            ))
            seeded_count += 1
            print(f"Seeded: {c['proposed_class']} ({c['source']}) -> {file_name}")

    conn.commit()
    conn.close()
    print(f"\n[DONE] Successfully seeded {seeded_count} candidate items into pending review queue.")

if __name__ == "__main__":
    seed()
