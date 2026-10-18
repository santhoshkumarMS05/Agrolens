"""
Seed script: Ingest 200 Rice Reproductive stage images into training_queue and training_pool/pending
for end-to-end active learning and ConvNeXt-Tiny stage retraining testing on cloud EC2.
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

SEED_DIR = BASE / "seed_data" / "rice_reproductive"
PENDING_DIR = BASE / "training_pool" / "pending"
PENDING_DIR.mkdir(parents=True, exist_ok=True)

PROPOSED_CLASS = "Rice · Reproductive Phase"
CROP_NAME = "Rice"

def seed():
    if not SEED_DIR.exists():
        print(f"[error] Seed directory not found: {SEED_DIR}")
        return

    img_files = (
        list(SEED_DIR.glob("*.jpg"))
        + list(SEED_DIR.glob("*.jpeg"))
        + list(SEED_DIR.glob("*.png"))
        + list(SEED_DIR.glob("*.JPG"))
    )

    if not img_files:
        print(f"[warn] No image files found in {SEED_DIR}")
        return

    print(f"Found {len(img_files)} images in {SEED_DIR}. Connecting to database...")
    conn = psycopg.connect(DATABASE_URL)
    with conn.cursor() as cur:
        # Check existing count for this class
        cur.execute(
            "SELECT COUNT(*) FROM training_queue WHERE proposed_class = %s",
            (PROPOSED_CLASS,)
        )
        existing_count = cur.fetchone()[0]
        if existing_count >= 150:
            print(f"[info] Already {existing_count} items in training_queue for '{PROPOSED_CLASS}'. Skipping re-seed.")
            conn.close()
            return

        inserted = 0
        for idx, src_img in enumerate(img_files, start=1):
            file_name = f"stage_seed_{uuid.uuid4().hex[:10]}_{src_img.name}"
            dest_path = PENDING_DIR / file_name
            shutil.copy(str(src_img), str(dest_path))

            cur.execute("""
                INSERT INTO training_queue (
                    image_name, image_path, proposed_class, crop, confidence, crop_score, source, status, notes
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, 'pending', %s)
            """, (
                file_name,
                f"pending/{file_name}",
                PROPOSED_CLASS,
                CROP_NAME,
                94.5,
                99.0,
                "nova_lite",
                f"Amazon Nova Lite Teacher Model: Plant panicle emergence, booting phase, floral spikelets ({idx}/200)."
            ))
            inserted += 1

        conn.commit()
    conn.close()
    print(f"[SUCCESS] Ingested {inserted} Rice Reproductive stage images into training_queue and {PENDING_DIR}.")

if __name__ == "__main__":
    seed()
