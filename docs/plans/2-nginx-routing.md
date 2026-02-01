# Feature 2: nginx Reverse Proxy Routing

## Overview

Add nginx as a reverse proxy in `splitter-compose.yaml` so that when exposed via ngrok, both the frontend and backend API are accessible through a single entry point. Nginx routes `/api/*` to the backend and everything else to the frontend.

```
Internet/ngrok → nginx:80
                  ├── /api/*  → backend:7272
                  └── /*      → frontend:7273
```

## Changes (all in parent repo: `/Users/rolandv/repositories/expense-splitter/`)

### 1. Fix `nginx.conf` — proxy_pass bug + add headers

**File:** `nginx.conf`

**Bug:** Current `proxy_pass http://backend:7272/` has a trailing slash, which strips the `/api/` prefix. But the backend expects routes under `/api` (confirmed in `Routing.kt` line 27: `route("/api")`).

**Fix:** Remove trailing slash so `/api/transactions/2025/1` is forwarded as-is to `backend:7272/api/transactions/2025/1`.

```nginx
events {}

http {
    server {
        listen 80;

        location /api/ {
            proxy_pass http://backend:7272;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location / {
            proxy_pass http://frontend:7273;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### 2. Add nginx service to `splitter-compose.yaml` + update ngrok target + set frontend build arg

**File:** `splitter-compose.yaml`

Changes:
- Add `nginx` service using `nginx:alpine` image, mounting `nginx.conf`
- Change ngrok command from `http frontend:7273` to `http nginx:80`
- Add `args: NEXT_PUBLIC_API_URL: /api` to frontend build so API calls use relative paths (same-origin through nginx)
- Update `depends_on` chain: ngrok → nginx → backend + frontend

### 3. Clean up `infrastructure/` directory

Delete the duplicate `infrastructure/ngnix.conf` (typo in name) and the empty `infrastructure/nginx.conf/` directory to avoid confusion.

## What does NOT change

- **Frontend source code** — `transaction-service.ts` already uses `process.env.NEXT_PUBLIC_API_URL` correctly; setting it to `/api` makes `fetch('/api/transactions/...')` work through nginx
- **Frontend `docker-compose.yml`** — Standalone dev setup remains untouched (uses Dockerfile default of `http://localhost:7272/api`)
- **Frontend `Dockerfile`** — Default build arg stays as-is for standalone use
- **Backend code** — Routes already under `/api` prefix, no changes needed

## Verification

1. From `/Users/rolandv/repositories/expense-splitter/`, run:
   ```bash
   docker compose -f splitter-compose.yaml build
   docker compose -f splitter-compose.yaml up -d
   ```
2. Verify nginx routes frontend: `curl http://localhost` should return HTML
3. Verify nginx routes API: `curl http://localhost/api/` should return "Expense Splitter API is running!"
4. Verify API data: `curl http://localhost/api/transactions/2025/1` should return JSON
5. Check ngrok dashboard at `http://localhost:4040` for the public URL
6. Access the public URL in a browser — the app should load and fetch transaction data through `/api`
