# Complete SSH Deployment Guide for Queuing System

This is a comprehensive step-by-step guide to deploy the Queuing System to a production server using SSH.

## Prerequisites

- SSH access to your server
- Domain name configured and pointing to your server
- Node.js 18+ installed (check with `node --version`)
- npm installed (check with `npm --version`)
- Root or sudo access (for PM2 global install and nginx/Apache config)

---

## Step 1: Prepare Your Local Project

### 1.1 Build the Frontend

```bash
cd frontend
npm run build
```

This creates a `dist` folder with production-ready files. Verify it exists:
```bash
ls -la frontend/dist
```

### 1.2 (Optional) Test the Build Locally

```bash
cd frontend
npm run preview
```

Visit `http://localhost:4173` to verify everything works.

---

## Step 2: Connect to Your Server via SSH

```bash
ssh username@your-server-ip
# or
ssh username@yourdomain.com
```

Replace `username` with your SSH username and `your-server-ip` with your server's IP address.

---

## Step 3: Check Server Prerequisites

### 3.1 Check Node.js Version

```bash
node --version
```

**Required:** Node.js 18 or higher. If not installed or outdated:

```bash
# Using NodeSource (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Or using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

### 3.2 Check npm

```bash
npm --version
```

### 3.3 Install PM2 Globally

```bash
sudo npm install -g pm2
```

Verify installation:
```bash
pm2 --version
```

---

## Step 4: Create Server Directory Structure

Decide where to place your application. Common locations:
- `/home/username/queing-backend` (backend)
- `/home/username/public_html` or `/var/www/html` (frontend)

### 4.1 Create Directories

```bash
# Create backend directory
mkdir -p ~/queing-backend
cd ~/queing-backend

# Create frontend directory (adjust path based on your web server)
mkdir -p ~/public_html
# OR if using Apache default:
# sudo mkdir -p /var/www/html/queing
```

---

## Step 5: Upload Files to Server

### Option A: Using SCP (Recommended for first-time deployment)

From your **local machine**, run:

```bash
# Upload backend
scp -r backend/* username@your-server-ip:~/queing-backend/

# Upload frontend build
scp -r frontend/dist/* username@your-server-ip:~/public_html/
```

### Option B: Using Git (Recommended for updates)

On your **server**:

```bash
# Install git if not available
sudo apt-get install git -y

# Clone your repository (if you have one)
cd ~
git clone https://github.com/yourusername/queing.git
cd queing

# Copy backend
cp -r backend/* ~/queing-backend/

# Copy frontend build (build locally first, then upload)
scp -r frontend/dist/* username@your-server-ip:~/public_html/
```

### Option C: Using rsync (Efficient for updates)

From your **local machine**:

```bash
# Upload backend
rsync -avz --exclude 'node_modules' --exclude 'prisma/dev.db' backend/ username@your-server-ip:~/queing-backend/

# Upload frontend build
rsync -avz frontend/dist/ username@your-server-ip:~/public_html/
```

---

## Step 6: Set Up Backend

### 6.1 Navigate to Backend Directory

```bash
cd ~/queing-backend
```

### 6.2 Install Dependencies

```bash
npm install --production
```

**Note:** If you get errors, you may need to install dev dependencies temporarily for Prisma:

```bash
npm install
```

### 6.3 Create `.env` File

```bash
nano .env
```

Add the following content (replace values as needed):

```env
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="CHANGE-THIS-TO-A-RANDOM-SECRET-KEY"
PORT=5002
NODE_ENV=production
ELEVENLABS_API_KEY="your-elevenlabs-api-key-if-using-tts"
ELEVENLABS_VOICE_ID="your-voice-id-if-using-tts"
ELEVENLABS_SPEED=0.7
```

**Generate a secure JWT_SECRET:**

```bash
openssl rand -base64 32
```

Copy the output and paste it as your `JWT_SECRET` value.

Save and exit (`Ctrl+X`, then `Y`, then `Enter`).

### 6.4 Set Up Database

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations to create database schema
npx prisma migrate deploy

# (Optional) Seed initial data (admin account, etc.)
npm run seed
```

**Important:** The seed script will create a default admin account. Check `backend/scripts/seed.js` for the default credentials and **change them immediately** after first login.

### 6.5 Create Required Directories

```bash
mkdir -p uploads/logos
mkdir -p uploads/profiles
mkdir -p uploads/sounds
mkdir -p videos
mkdir -p logs
```

### 6.6 Set File Permissions

```bash
chmod 755 uploads videos logs
chmod 644 .env
chmod 644 prisma/dev.db
```

---

## Step 7: Configure PM2

### 7.1 Create PM2 Ecosystem File

```bash
cd ~/queing-backend
nano ecosystem.config.cjs
```

Add the following (adjust paths as needed):

```javascript
module.exports = {
  apps: [
    {
      name: "queing-backend",
      script: "./server.js",
      cwd: "/home/username/queing-backend",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 5002,
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
    },
  ],
};
```

**Replace `/home/username/queing-backend` with your actual backend path.**

Save and exit.

### 7.2 Start the Application with PM2

```bash
cd ~/queing-backend
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

The `pm2 startup` command will output instructions. Follow them to enable PM2 to start on server reboot. It usually looks like:

```bash
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u username --hp /home/username
```

Copy and run the command it provides.

### 7.3 Verify PM2 Status

```bash
pm2 status
pm2 logs queing-backend
```

You should see the backend running. Press `Ctrl+C` to exit logs.

---

## Step 8: Configure Reverse Proxy

Your frontend runs on port 80/443, but the backend runs on port 5002. You need to proxy API requests.

### Option A: Using Nginx (Recommended)

#### 8.1 Install Nginx (if not installed)

```bash
sudo apt-get update
sudo apt-get install nginx -y
```

#### 8.2 Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/queing
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend (React app)
    root /home/username/public_html;
    index index.html;

    # API proxy
    location /api {
        proxy_pass http://localhost:5002/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads proxy
    location /uploads {
        proxy_pass http://localhost:5002/uploads;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Videos proxy
    location /videos {
        proxy_pass http://localhost:5002/videos;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # React Router (SPA) - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

**Replace:**
- `yourdomain.com` with your actual domain
- `/home/username/public_html` with your actual frontend path

Save and exit.

#### 8.3 Enable the Site

```bash
sudo ln -s /etc/nginx/sites-available/queing /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

### Option B: Using Apache

#### 8.1 Install Apache (if not installed)

```bash
sudo apt-get install apache2 -y
```

#### 8.2 Enable Required Modules

```bash
sudo a2enmod rewrite
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo systemctl restart apache2
```

#### 8.3 Create `.htaccess` File

Put `.htaccess` in the **document root** of your domain (the folder from which the site is served). For example if the domain points to `~/public_html/clients/kyuwing`, create or edit `.htaccess` there, not only in `~/public_html`.

```bash
cd ~/public_html   # or e.g. ~/public_html/clients/kyuwing for a per-site root
nano .htaccess
```

Add the following (use `127.0.0.1` instead of `localhost` if your host resolves localhost differently). **The opening tag must be `<IfModule` (with the `<`) — missing it can break the whole block.**

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # Proxy /api to backend (all methods: GET, POST, etc.)
    RewriteCond %{REQUEST_URI} ^/api
    RewriteRule ^api/(.*)$ http://127.0.0.1:5002/api/$1 [P,L]

    # Proxy /uploads and /videos
    RewriteCond %{REQUEST_URI} ^/uploads
    RewriteRule ^uploads/(.*)$ http://127.0.0.1:5002/uploads/$1 [P,L]
    RewriteCond %{REQUEST_URI} ^/videos
    RewriteRule ^videos/(.*)$ http://127.0.0.1:5002/videos/$1 [P,L]

    # SPA: if not a real file or directory, serve index.html
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^ index.html [L]
</IfModule>
```

Save and exit.

---

## Step 9: Set Up SSL/HTTPS

### Option A: Using Let's Encrypt (Free)

#### 9.1 Install Certbot

```bash
sudo apt-get install certbot python3-certbot-nginx -y
# OR for Apache:
# sudo apt-get install certbot python3-certbot-apache -y
```

#### 9.2 Obtain SSL Certificate

**For Nginx:**
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

**For Apache:**
```bash
sudo certbot --apache -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts. Certbot will automatically configure SSL and set up auto-renewal.

#### 9.3 Test Auto-Renewal

```bash
sudo certbot renew --dry-run
```

### Option B: Using cPanel (if available)

1. Log into cPanel
2. Go to **SSL/TLS Status**
3. Install Let's Encrypt certificate
4. Force HTTPS redirect

---

## Step 10: Configure Firewall (Optional but Recommended)

```bash
# Allow SSH (important - don't lock yourself out!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## Step 11: Testing

### 11.1 Test Backend API

```bash
curl http://localhost:5002/api/health
# OR
curl https://yourdomain.com/api/health
```

You should get a response.

### 11.2 Test Frontend

Visit `https://yourdomain.com` in your browser. You should see the login page.

### 11.3 Test Admin Login

1. Go to `https://yourdomain.com/admin/login`
2. Use the default admin credentials (from seed script)
3. **Immediately change the password** after first login

### 11.4 Test Staff Login

1. Create a staff account from the admin dashboard
2. Test staff login at `https://yourdomain.com/staff/login`

### 11.5 Test Queue Flow

1. Join queue as a client
2. Assign window as staff
3. Serve client
4. Verify monitoring page updates

---

## Step 12: Post-Deployment Checklist

- [ ] Backend is running: `pm2 status`
- [ ] Frontend loads: Visit `https://yourdomain.com`
- [ ] API works: `curl https://yourdomain.com/api/health`
- [ ] Admin login works
- [ ] Changed default admin password
- [ ] SSL certificate is active (green lock in browser)
- [ ] PM2 auto-start configured: `pm2 startup`
- [ ] Logs are accessible: `pm2 logs queing-backend`
- [ ] File permissions are correct
- [ ] `.env` file is secure (not publicly accessible)

---

## Step 13: Monitoring & Maintenance

### 13.1 Check PM2 Status

```bash
pm2 status
pm2 logs queing-backend --lines 50
```

### 13.2 Set Up Log Rotation

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 13.3 Monitor Disk Space

```bash
df -h
du -sh ~/queing-backend/prisma/dev.db
du -sh ~/queing-backend/uploads
du -sh ~/queing-backend/videos
```

### 13.4 Regular Backups

Create a backup script:

```bash
nano ~/backup-queing.sh
```

Add:

```bash
#!/bin/bash
BACKUP_DIR=~/backups
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
cp ~/queing-backend/prisma/dev.db $BACKUP_DIR/dev_$DATE.db

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz ~/queing-backend/uploads

# Backup videos
tar -czf $BACKUP_DIR/videos_$DATE.tar.gz ~/queing-backend/videos

# Keep only last 7 days
find $BACKUP_DIR -name "*.db" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

Make executable:
```bash
chmod +x ~/backup-queing.sh
```

Add to crontab (daily at 2 AM):
```bash
crontab -e
```

Add:
```
0 2 * * * /home/username/backup-queing.sh
```

---

## Redeploy from scratch (clone + local build + upload DB)

Use this path when you want a clean deploy with the repo under `public_html/clients/kyuwing`, frontend built locally, and the database uploaded instead of running `prisma migrate deploy` on the server.

### R1. Clone the repo on the server

```bash
cd ~/public_html/clients
# Remove existing site if you want a clean slate (back up first if needed)
# rm -rf kyuwing
git clone https://github.com/YOUR_USERNAME/queing.git kyuwing
cd kyuwing
```

Replace the clone URL with your actual repo URL. You now have the full repo at `~/public_html/clients/kyuwing/` (frontend and backend folders inside).

### R2. Frontend: build locally and upload

On your **local machine**:

```bash
cd frontend
npm install
npm run build
```

Then upload only the built files to the server (not the whole `frontend/` folder):

```bash
# From repo root on your machine (replace qozlgarl and server with your SSH user/host)
scp frontend/dist/index.html qozlgarl@your-server:~/public_html/clients/kyuwing/
scp -r frontend/dist/assets qozlgarl@your-server:~/public_html/clients/kyuwing/
```

So on the server, `~/public_html/clients/kyuwing/` contains at least: `index.html`, `assets/`, plus the rest of the repo (e.g. `backend/`, `frontend/` source). The site is served from that folder.

### R3. Upload the database (skip migrate on server)

On your **local machine**, upload the SQLite DB so you don’t run `prisma migrate deploy` on the server (which can overload it):

```bash
# From repo root locally
scp backend/prisma/dev.db qozlgarl@your-server:~/public_html/clients/kyuwing/backend/prisma/
```

Ensure the backend folder exists on the server (it will if you cloned the repo in R1).

### R4. Backend setup on the server

SSH into the server, then:

```bash
cd ~/public_html/clients/kyuwing/backend
npm install --production
```

If you get Prisma-related errors, run `npm install` (with dev deps), then continue.

Create `.env` (if it doesn’t exist):

```bash
nano .env
```

Contents (adjust values):

```env
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="your-secure-secret-from-openssl-rand-base64-32"
PORT=5002
NODE_ENV=production
```

Generate Prisma Client only (no migrate):

```bash
npx prisma generate
```

Create required directories:

```bash
mkdir -p uploads/logos uploads/profiles uploads/sounds videos logs
chmod 755 uploads videos logs
chmod 644 .env prisma/dev.db
```

### R5. PM2

From the repo, the app is started from the **backend** directory. If `ecosystem.config.cjs` is in the backend folder:

```bash
cd ~/public_html/clients/kyuwing/backend
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Run the command that `pm2 startup` prints so the app restarts on reboot.

If your ecosystem file uses a `cwd` path, set it to the backend path, e.g.:

```javascript
cwd: "/home/qozlgarl/public_html/clients/kyuwing/backend",
```

Check:

```bash
pm2 status
pm2 logs queing-backend
```

### R6. Reverse proxy (`.htaccess`)

The document root for the site is `~/public_html/clients/kyuwing/`. Put `.htaccess` there:

```bash
nano ~/public_html/clients/kyuwing/.htaccess
```

Use the same proxy rules as in Step 8.3 (proxy `/api`, `/uploads`, `/videos` to `http://127.0.0.1:5002`, then SPA fallback). Example:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    RewriteCond %{REQUEST_URI} ^/api
    RewriteRule ^api/(.*)$ http://127.0.0.1:5002/api/$1 [P,L]
    RewriteCond %{REQUEST_URI} ^/uploads
    RewriteRule ^uploads/(.*)$ http://127.0.0.1:5002/uploads/$1 [P,L]
    RewriteCond %{REQUEST_URI} ^/videos
    RewriteRule ^videos/(.*)$ http://127.0.0.1:5002/videos/$1 [P,L]

    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^ index.html [L]
</IfModule>
```

If the domain’s document root is actually `public_html` (so browser requests to `/api` use `public_html/.htaccess`), add the same proxy block to `~/public_html/.htaccess` as well (see troubleshooting “404 in browser but curl from server works”).

### R7. Verify

```bash
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5002/api/health
# Expect 200
curl -s -o /dev/null -w "%{http_code}" "https://kyuwing.online/api/health"
# Expect 200 (or 401 for protected routes without auth)
```

Open the site in the browser and test admin login and the Video settings tab.

---

## Troubleshooting

### Backend Not Starting

```bash
# Check PM2 logs
pm2 logs queing-backend

# Check if port is in use
sudo netstat -tulpn | grep 5002

# Restart backend
pm2 restart queing-backend

# Check Node.js version
node --version  # Should be 18+
```

### Frontend Not Loading

```bash
# Check nginx/Apache status
sudo systemctl status nginx
# OR
sudo systemctl status apache2

# Check nginx/Apache error logs
sudo tail -f /var/log/nginx/error.log
# OR
sudo tail -f /var/log/apache2/error.log

# Verify frontend files exist
ls -la ~/public_html/
```

### API Requests Failing

```bash
# Test backend directly
curl http://localhost:5002/api/health

# Check reverse proxy configuration
sudo nginx -t
# OR check Apache .htaccess syntax

# Check CORS settings in backend/server.js
```

### 404 "Cannot POST /api/..." (GET or direct curl works)

If the browser gets **404** with body `Cannot POST /api/...` but **direct** curl to the backend works (e.g. `curl -X POST http://127.0.0.1:5002/api/admin/settings/youtube-playlist` returns 401 or 2xx), the **reverse proxy** is not forwarding POST (or not forwarding to the Node app at all).

1. **Confirm backend is correct** (you already did):
   ```bash
   curl -s -o /dev/null -w "%{http_code}" -X POST http://127.0.0.1:5002/api/admin/settings/youtube-playlist -H "Content-Type: application/json" -d '{}'
   # Expect 401 (unauthorized) or 2xx — not 404
   ```

2. **Fix the proxy so all methods (GET, POST, etc.) and the full path are forwarded:**
   - **Nginx:** The `location /api { ... proxy_pass ... }` block forwards the same method and path by default. Ensure there is no other `location` that catches `/api` or strips the path. Reload: `sudo nginx -t && sudo systemctl reload nginx`.
   - **Apache / .htaccess:**  
     - Put `.htaccess` in the **document root** of the domain (e.g. if the site is served from `public_html/clients/kyuwing/`, the `.htaccess` must be in that folder, not only in `public_html/`).  
     - The proxy rule must run for all methods. The usual rule is:
       ```apache
       RewriteCond %{REQUEST_URI} ^/api/ [NC]
       RewriteRule ^api/(.*)$ http://127.0.0.1:5002/api/$1 [P,L]
       ```
       Use `127.0.0.1` if `localhost` is not reliable.  
     - If the host disallows `[P]` (proxy) in `.htaccess`, use cPanel **Reverse Proxy** or ask support to add `ProxyPass /api http://127.0.0.1:5002/api` and `ProxyPassReverse /api http://127.0.0.1:5002/api` in the vhost.

3. **Test through the public URL** (from the server or your machine):
   ```bash
   curl -s -o /dev/null -w "%{http_code}" -X POST https://kyuwing.online/api/admin/settings/youtube-playlist -H "Content-Type: application/json" -d '{}'
   ```
   You should get **401** or **2xx**, not **404**.

4. **404 in browser but curl from server works:**  
   Only if the domain’s document root is **`public_html`** (so `/api` is handled by `public_html/.htaccess`), add the same proxy rules there. If the site has been working with `.htaccess` only in a subfolder (e.g. `public_html/clients/kyuwing`), the document root is that subfolder — don’t change `public_html/.htaccess`. Look for other causes: backend not running or wrong port, CDN/cache returning old 404s, or www vs non-www using a different vhost.

5. **404 when using Cloudflare (browser) but curl from server returns 401:**  
   Browser traffic goes **Browser → Cloudflare → Origin**. Curl from the server may hit the origin **directly** (bypassing Cloudflare). If the origin treats those differently, you get 404 only for browser traffic.  
   - **SSL/TLS mode:** In Cloudflare → **SSL/TLS** → set to **Full** or **Full (strict)** so Cloudflare connects to the origin over **HTTPS**. With **Flexible**, Cloudflare connects over **HTTP**; the origin’s **HTTP** vhost may not have the same proxy/.htaccess as HTTPS, so `/api` can 404.  
   - **Bypass test:** In Cloudflare **DNS**, set the record for the domain to **DNS only** (grey cloud) temporarily. Reload the site in the browser. If 404 goes away, the issue is how Cloudflare connects to the origin; fix SSL mode or ensure the HTTP vhost has the proxy. Set the cloud back to **Proxied** (orange) after testing.

### Database Errors

```bash
# Check database file permissions
ls -la ~/queing-backend/prisma/dev.db

# Verify migrations ran
cd ~/queing-backend
npx prisma migrate status

# Check database path in .env
cat ~/queing-backend/.env | grep DATABASE_URL
```

### PM2 Not Starting on Reboot

```bash
# Re-run startup command
pm2 startup
# Follow the instructions it provides

# Or manually create systemd service
sudo nano /etc/systemd/system/queing-backend.service
```

Add:
```ini
[Unit]
Description=Queuing System Backend
After=network.target

[Service]
Type=simple
User=username
WorkingDirectory=/home/username/queing-backend
ExecStart=/usr/bin/node server.js
Restart=always
Environment=NODE_ENV=production
Environment=PORT=5002

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl enable queing-backend
sudo systemctl start queing-backend
```

---

## Quick Update/Deployment Script

Create `~/deploy.sh`:

```bash
#!/bin/bash
set -e

echo "Starting deployment..."

cd ~/queing-backend

# Pull latest code (if using git)
# git pull origin main

# Install dependencies
npm install --production

# Run database migrations
npx prisma generate
npx prisma migrate deploy

# Restart backend
pm2 restart queing-backend

echo "Deployment complete!"
pm2 status
```

Make executable:
```bash
chmod +x ~/deploy.sh
```

Run updates:
```bash
~/deploy.sh
```

---

## Security Recommendations

1. **Change default admin password** immediately after first login
2. **Use strong JWT_SECRET** (generate with `openssl rand -base64 32`)
3. **Keep `.env` file secure** (permissions 644, not publicly accessible)
4. **Enable HTTPS** (SSL certificate)
5. **Set up firewall** (UFW or iptables)
6. **Regular updates**: Keep Node.js, npm, and system packages updated
7. **Monitor logs** regularly for suspicious activity
8. **Backup regularly** (database, uploads, videos)

---

## Support

If you encounter issues:

1. Check PM2 logs: `pm2 logs queing-backend`
2. Check web server logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify environment variables: `cat ~/queing-backend/.env`
4. Test API directly: `curl http://localhost:5002/api/health`
5. Check file permissions: `ls -la ~/queing-backend`
6. Review this guide for common issues

---

## Next Steps

After successful deployment:

1. Create your first admin account (or use seeded one)
2. Create staff accounts
3. Set up windows
4. Configure categories and subcategories
5. Upload logo and branding
6. Configure TTS settings (if using)
7. Test the complete queue flow
8. Set up regular backups
9. Monitor system performance

Good luck with your deployment! 🚀
