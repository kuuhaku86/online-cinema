# Deployment Guide

## Prerequisites

- Linux server with Docker and docker-compose installed
- nginx installed on the host
- A domain name pointing to the server's IP
- SSH access to the server

---

## 1. Clone the repo

```bash
git clone <your-repo-url> /opt/online-cinema
cd /opt/online-cinema
```

## 2. Create environment file

```bash
cp .env.example .env
```

Edit `.env` with your values:

```bash
DOMAIN=yourdomain.com
JWT_SECRET=$(openssl rand -hex 64)
JWT_REFRESH_SECRET=$(openssl rand -hex 64)
DB_PASSWORD=$(openssl rand -base64 32)
FRONTEND_OUTPUT=/var/www/online-cinema/dist
```

## 3. Create frontend output directory

```bash
mkdir -p /var/www/online-cinema/dist
chmod 755 /var/www/online-cinema
```

## 4. Build and start Docker services

```bash
make rebuild-prod
```

## 5. Build the frontend

```bash
make build-frontend
```

## 6. Configure host nginx

```bash
# Copy the site config
cp nginx/site.conf /etc/nginx/sites-available/online-cinema

# Replace placeholder domain with yours
sed -i 's/example.com/yourdomain.com/g' /etc/nginx/sites-available/online-cinema

# Enable the site
ln -sf /etc/nginx/sites-available/online-cinema /etc/nginx/sites-enabled/

# Test and reload
nginx -t && systemctl reload nginx
```

## 7. Verify HTTP is working

Open `http://yourdomain.com` in a browser. You should see the app.
Test API: `curl http://yourdomain.com/api/` (should return a response from the backend).

## 8. Get SSL certificate with certbot

```bash
# Install certbot (pick one)
snap install --classic certbot
# or: apt install certbot

certbot certonly --webroot \
  -w /var/www/online-cinema \
  -d yourdomain.com
```

## 9. Enable HTTPS in nginx

Edit `/etc/nginx/sites-available/online-cinema`:

1. Comment out the HTTP-only server block (the first `server { listen 80; ... }` block)
2. Uncomment the HTTPS server block (remove `#` prefix from the second block)
3. Uncomment the HTTP→HTTPS redirect block at the bottom

Then:

```bash
nginx -t && systemctl reload nginx
```

## 10. Set up auto-renewal

```bash
certbot renew --dry-run

# Add cron job (runs twice a day)
echo "0 0,12 * * * root certbot renew --quiet && systemctl reload nginx" \
  | tee /etc/cron.d/certbot-renew
```

---

## Useful Makefile targets

| Command | What it does |
|---|---|
| `make up-prod` | Start all production services |
| `make down-prod` | Stop all production services |
| `make rebuild-prod` | Rebuild images and restart |
| `make build-frontend` | Build frontend and output to dist dir |
| `make logs-prod` | Tail all logs |
| `make ps-prod` | Show container status |
| `make run-migration-prod` | Run pending DB migrations |
| `make run-migration-rollback-prod` | Revert last migration |

## Updating the app

```bash
git pull
make rebuild-prod
make build-frontend
```

## Running database migrations

```bash
make run-migration-prod
```
