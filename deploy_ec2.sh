#!/bin/bash
set -e

echo "=========================================================="
echo " Starting AgroLens Automated EC2 Deployment"
echo "=========================================================="

# 1. Update system & install prerequisites
echo "[1/7] Installing System Packages (Python, PostgreSQL, Git, Nginx)..."
sudo apt-get update -y
sudo apt-get install -y python3-pip python3-venv git git-lfs nginx postgresql postgresql-contrib curl libgl1 libglib2.0-0

# Node.js 20 LTS
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 2. Configure 4GB Swap for low-RAM stability (prevents out-of-memory during PyTorch model loading)
if [ ! -f /swapfile ]; then
    echo "[2/7] Configuring 4GB Swap Space..."
    sudo fallocate -l 4G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=4096
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

# 3. Configure PostgreSQL Database
echo "[3/7] Configuring PostgreSQL Database 'agrolens'..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD '6379';" || true
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'agrolens'" | grep -q 1 || sudo -u postgres psql -c "CREATE DATABASE agrolens OWNER postgres;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE agrolens TO postgres;"

# 4. Clone / Pull Repository
echo "[4/7] Cloning AgroLens repository from GitHub..."
git lfs install
if [ -d "/home/ubuntu/Agrolens" ] && [ ! -d "/home/ubuntu/agrolens" ]; then
    mv /home/ubuntu/Agrolens /home/ubuntu/agrolens
fi

if [ -d "/home/ubuntu/agrolens" ]; then
    cd /home/ubuntu/agrolens
    git pull origin main || true
else
    cd /home/ubuntu
    git clone https://github.com/santhoshkumarMS05/Agrolens.git agrolens
    cd /home/ubuntu/agrolens
fi

cd /home/ubuntu/agrolens
git lfs pull

# 5. Build Frontend
echo "[5/7] Building Frontend..."
cd /home/ubuntu/agrolens/frontend
echo "VITE_CLERK_PUBLISHABLE_KEY=pk_test_aHVtYW5lLXRyb2xsLTU5NjIuY2xlcmsuYWNjb3VudHMuZGV2JA" > .env
npm install
npm run build

# 6. Setup Python Virtualenv & Dependencies
echo "[6/7] Setting up Python Environment..."
cd /home/ubuntu/agrolens/backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install --upgrade pip
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt

# Create backend .env
cat << 'EOF' > .env
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=agrolens
DB_USER=postgres
DB_PASSWORD=6379
PORT=8000
EOF

# 7. Configure Systemd Service for AgroLens Flask Backend
echo "[7/7] Configuring Systemd service and Nginx reverse proxy..."
sudo tee /etc/systemd/system/agrolens.service << 'EOF'
[Unit]
Description=AgroLens AI Flask Application
After=network.target postgresql.service

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/agrolens/backend
EnvironmentFile=/home/ubuntu/agrolens/backend/.env
ExecStart=/home/ubuntu/agrolens/backend/venv/bin/python app.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable agrolens
sudo systemctl restart agrolens

# Configure Nginx on Port 80
sudo tee /etc/nginx/sites-available/default << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    client_max_body_size 60M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 180s;
        proxy_connect_timeout 180s;
    }
}
EOF

sudo nginx -t
sudo systemctl restart nginx

echo "=========================================================="
echo " AgroLens Deployment Finished Successfully!"
echo " Visit: http://$(curl -s http://checkip.amazonaws.com)"
echo "=========================================================="
