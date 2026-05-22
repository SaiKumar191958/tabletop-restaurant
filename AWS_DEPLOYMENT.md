# AWS Deployment Guide (EC2 + Docker Compose)

This guide provides step-by-step instructions to deploy the Tabletop Restaurant application (Django Backend + React Frontend) to an AWS EC2 instance using Docker Compose.

## Prerequisites
1. An AWS Account.
2. A registered domain name (optional but highly recommended for HTTPS and Google Auth).
3. API Keys ready (Google Client ID, Cloudinary, Resend, etc.).

## Step 1: Launch an EC2 Instance
1. Log in to the **AWS Management Console** and go to **EC2**.
2. Click **Launch Instance**.
3. **Name:** `tabletop-restaurant-server` (or similar).
4. **AMI:** Choose **Ubuntu 22.04 LTS** or **24.04 LTS** (64-bit x86).
5. **Instance Type:** `t3.small` or `t3.medium` is recommended (the build process for React requires at least 2GB of RAM).
6. **Key Pair:** Create a new key pair (e.g., `tabletop-key.pem`) and download it. You will need this to SSH into the server.
7. **Network Settings (Security Group):**
   - Allow **SSH traffic** from your IP.
   - Allow **HTTP traffic** from the internet (Port 80).
   - Allow **HTTPS traffic** from the internet (Port 443).
   - Allow **Custom TCP traffic** on Port 8000 (if you want to access the API directly, though Nginx can reverse proxy it later).
8. **Storage:** Allocate at least `20 GB` of gp3 storage.
9. Click **Launch Instance**.

## Step 2: Connect to your EC2 Instance
Open your terminal and SSH into the instance using the downloaded key pair:
```bash
chmod 400 tabletop-key.pem
ssh -i "tabletop-key.pem" ubuntu@<your-ec2-public-ip>
```

## Step 3: Install Docker and Git
Once inside the EC2 instance, run the following commands to install Docker and Git:
```bash
# Update packages
sudo apt-get update && sudo apt-get upgrade -y

# Install Git
sudo apt-get install -y git

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add the ubuntu user to the docker group
sudo usermod -aG docker ubuntu

# Install Docker Compose plugin
sudo apt-get install docker-compose-plugin -y
```
*Note: After adding the user to the docker group, you might need to exit the SSH session and log back in for the changes to take effect.*

## Step 4: Clone the Repository
Clone your project repository to the EC2 instance:
```bash
git clone https://github.com/YourUsername/tabletop-restaurant.git
cd tabletop-restaurant
```

## Step 5: Configure Environment Variables
Create a `.env` file in the root of the project to hold your production configuration:
```bash
nano .env
```
Paste your production environment variables (update the values accordingly):
```ini
# --- Database Configuration ---
DB_NAME=restaurant_db
DB_USER=restaurant_user
DB_PASSWORD=your_secure_db_password
DB_ROOT_PASSWORD=your_secure_root_password

# --- Backend Configuration ---
SECRET_KEY=generate_a_very_long_random_secret_key_here
DEBUG=False
# Add your public IP and domain
ALLOWED_HOSTS=localhost,127.0.0.1,backend,<your-ec2-public-ip>,api.yourdomain.com

# Important: This is the URL of your React frontend (where requests will come from)
CORS_ALLOWED_ORIGINS=http://localhost,http://<your-ec2-public-ip>,https://yourdomain.com

# --- Third-Party Services ---
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
RESEND_API_KEY=re_your_resend_api_key

# --- Frontend Configuration ---
# This is the public URL where the frontend can reach the backend API
VITE_API_URL=http://<your-ec2-public-ip>:8000/api
# Or if using a domain:
# VITE_API_URL=https://api.yourdomain.com/api
```
Save and exit (`Ctrl+O`, `Enter`, `Ctrl+X`).

## Step 6: Build and Run with Docker Compose
Run the following command to build the Docker images and start the containers in the background:
```bash
docker compose up -d --build
```
This process will take a few minutes as it needs to build the React application and install Python dependencies.

## Step 7: Verify the Deployment
To check if everything is running correctly:
```bash
docker compose ps
docker compose logs -f
```
You should now be able to access:
- **Frontend:** `http://<your-ec2-public-ip>` (Port 80)
- **Backend API:** `http://<your-ec2-public-ip>:8000/api`

## Step 8: Post-Deployment Setup (Creating Superuser & Seed Data)
To access the Django admin panel and manage your restaurant, you need to create a superuser.
```bash
# Exec into the backend container
docker compose exec backend bash

# Run migrations (should already be done by the startup script, but good to ensure)
python manage.py migrate

# Seed the database with demo categories/items (Optional)
python manage.py seed_demo

# Or create a superuser manually
python manage.py createsuperuser

# Exit the container
exit
```

## Step 9: Production Domain and SSL (Optional but Recommended)
To use Google Authentication and secure your site, you **must** use HTTPS.
We recommend putting an **Application Load Balancer (ALB)** in front of your EC2 instance or using **Cloudflare** for easy SSL termination. Alternatively, you can install `certbot` and configure Nginx directly on the EC2 instance to serve HTTPS.
