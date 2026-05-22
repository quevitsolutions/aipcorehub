# AIP CORE — Marketing & Promotion Portal

> **Standalone promotional website for the AIP Core Web3 ecosystem.**
> Fully decoupled from the main core app — runs in its own Docker container on its own domain/port.

---

## 🌐 Live URLs

| Environment | URL |
|---|---|
| Main App    | https://aipcore.online |
| **Marketing Portal** | **https://promo.aipcore.online** |

---

## 📁 Project Structure

```
marketing-portal/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx       # Sticky nav with mobile drawer
│   │   ├── Footer.jsx       # Full footer with links & social
│   │   ├── TickerBar.jsx    # Live scrolling stats bar
│   │   └── UI.jsx           # Shared: AnimatedCounter, GlowCard, ParticleField
│   ├── pages/
│   │   ├── HomePage.jsx     # Hero + stats + highlights + CTA
│   │   ├── FeaturesPage.jsx # All 6 protocol features + how-it-works
│   │   ├── EarningsPage.jsx # 4 income streams + simulation + tiers
│   │   ├── RoadmapPage.jsx  # Timeline + 4-phase roadmap cards
│   │   ├── PressPage.jsx    # Brand colors + media kit + contacts
│   │   └── JoinPage.jsx     # Referral link + FAQ + Telegram CTA
│   ├── App.jsx              # Router with all routes
│   ├── main.jsx             # React entry point
│   └── index.css            # Full design system (CSS variables + animations)
├── Dockerfile               # Multi-stage build → nginx serve
├── nginx.conf               # SSL, gzip, security headers, SPA routing
├── docker-compose.yml       # Production standalone compose
├── docker-compose.dev.yml   # Hot-reload dev compose
├── deploy.sh                # Linux/macOS deploy script
├── deploy.bat               # Windows deploy script
├── .env.example             # Environment variable template
└── package.json
```

---

## ⚡ Quick Start — Local Dev

```bash
cd marketing-portal

# Install dependencies
npm install

# Start dev server (http://localhost:5174)
npm run dev
```

---

## 🐳 Docker — Development (Hot Reload)

```bash
cd marketing-portal
cp .env.example .env

docker compose -f docker-compose.dev.yml up
# → http://localhost:5174
```

---

## 🚀 Deploy to Production

### Linux / macOS

```bash
cd marketing-portal
cp .env.example .env
# Edit .env — set VITE_APP_URL, VITE_API_URL, MARKETING_DOMAIN

# First-time SSL only:
./deploy.sh --ssl

# Normal deploy:
./deploy.sh
```

### Windows

```bat
cd marketing-portal
copy .env.example .env
REM Edit .env with your values
deploy.bat
```

---

## 🔐 SSL Certificate

The portal manages its own independent SSL certificate via Certbot, completely separate from the main app's certificate.

```bash
# Issue certificate for promo.aipcore.online
docker run --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/www/certbot:/var/www/certbot \
  -p 80:80 \
  certbot/certbot certonly --standalone \
  --non-interactive --agree-tos \
  --email admin@aipcore.online \
  -d promo.aipcore.online
```

Auto-renewal is handled by the `certbot-marketing` service in `docker-compose.yml`.

---

## 🌍 Pages & Routes

| Route         | Page             | Description |
|---|---|---|
| `/`           | Home             | Hero, stats, highlights, CTA |
| `/features`   | Features         | All 6 protocol features |
| `/earnings`   | Earnings         | 4 streams, simulation table, 18 tiers |
| `/roadmap`    | Roadmap          | Timeline + 4 development phases |
| `/press`      | Press Kit        | Brand colors, media downloads, contacts |
| `/join`       | Join             | Activation guide, FAQ |
| `/join/:ref`  | Join (Referred)  | Pre-filled referral link + copy button |

---

## 🔗 Referral Deep Links

Any node holder can generate referral traffic using:

```
https://promo.aipcore.online/join/12345
```

Where `12345` is the sponsor's Node ID. The Join page:
- Displays a **"Referred by Node #12345"** badge
- Shows their referral link pre-filled and copyable
- Deep-links directly into the app with `?ref=12345`

---

## 🧩 Isolation from Main Core

| Concern      | Main Core App              | Marketing Portal               |
|---|---|---|
| Container    | `aipcore-frontend`         | `aipcore-marketing`            |
| Network      | `aipcore_default`          | `aipcore-marketing-net`        |
| HTTP Port    | 80                         | 8080 (configurable)            |
| HTTPS Port   | 443                        | 8443 (configurable)            |
| Domain       | `aipcore.online`           | `promo.aipcore.online`         |
| SSL Cert     | `/live/aipcore.online/`    | `/live/promo.aipcore.online/`  |
| Volumes      | `aipcore_db_data`          | `aipcore_certbot_mkt_*`        |
| Database     | PostgreSQL (shared)        | ❌ None — static SPA           |
| API calls    | Internal (`/api`)          | External (`aipcore.online/api`)|

> **Zero coupling** — stopping/restarting the marketing portal has no effect on the main app and vice versa.

---

## 🔧 Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_APP_URL` | `https://aipcore.online` | Main app URL for activation links |
| `VITE_API_URL` | `https://aipcore.online/api` | API endpoint for live stats |
| `MARKETING_DOMAIN` | `promo.aipcore.online` | Portal domain |
| `MARKETING_HTTP_PORT` | `8080` | Host HTTP port |
| `MARKETING_HTTPS_PORT` | `8443` | Host HTTPS port |

---

## 🛠 Useful Commands

```bash
# View logs
docker compose logs -f marketing

# Rebuild without cache
docker compose build --no-cache marketing

# Stop
docker compose down

# Shell into container
docker exec -it aipcore-marketing sh

# Check health
curl http://localhost:8080/health
```

---

## 📬 Contact

- **Telegram:** [@aipcore](https://t.me/aipcore)
- **Website:** [aipcore.online](https://aipcore.online)
- **Press:** press@aipcore.online

---

> Built with React 18 + Vite 5 + Framer Motion · Served via Nginx Alpine · Deployed on BNB Smart Chain ecosystem
