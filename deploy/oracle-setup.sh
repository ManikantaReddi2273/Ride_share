#!/usr/bin/env bash
# Run once on a fresh Oracle Cloud Ubuntu ARM VM
set -euo pipefail

echo "==> Updating packages"
sudo apt-get update -y
sudo apt-get upgrade -y

echo "==> Installing Docker"
sudo apt-get install -y ca-certificates curl gnupg git
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "==> Allow current user to run docker"
sudo usermod -aG docker "$USER"

echo "==> Done. Log out and SSH back in, then:"
echo "  git clone https://github.com/ManikantaReddi2273/Ride_share.git"
echo "  cd Ride_share"
echo "  cp deploy/env.example .env   # edit with Neon + secrets"
echo "  docker compose up -d --build"
