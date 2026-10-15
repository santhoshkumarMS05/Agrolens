#!/bin/bash
set -e

cat << 'EOF' > /tmp/nginx_default.conf
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name 13.126.46.242.nip.io _;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl default_server;
    listen [::]:443 ssl default_server;
    server_name 13.126.46.242.nip.io _;

    ssl_certificate /etc/letsencrypt/live/13.126.46.242.nip.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/13.126.46.242.nip.io/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    client_max_body_size 60M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_read_timeout 180s;
        proxy_connect_timeout 180s;
    }
}
EOF

sudo cp /tmp/nginx_default.conf /etc/nginx/sites-available/default
sudo nginx -t
sudo systemctl reload nginx
echo "NGINX_RELOAD_SUCCESS"
