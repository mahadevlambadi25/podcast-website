# Podcast on the Contabo VPS (82.197.69.44)

This server is shared with other live apps (Frappe/ERPNext, HRMS). Never edit their nginx files or stop their services.

| Piece | Where |
|---|---|
| Code + `.env.production` (secrets, chmod 600) | `/opt/podcast` |
| Containers (compose project `podcast`) | `postgres`, `app` (127.0.0.1:3100), `cron` (publishes scheduled episodes every 10 min) |
| Host nginx site | `/etc/nginx/sites-available/podcast` (source: `deploy/nginx-podcast.conf`, HTTPS added by certbot) |
| Test URL | https://podcast-82-197-69-44.sslip.io |
| Backups (nightly 03:30, 14 days) | `/var/backups/podcast`, log `/var/log/podcast-backup.log` |

All commands below run on the server in `/opt/podcast`.

```sh
C="docker compose -f docker-compose.prod.yml --env-file .env.production"
$C ps                 # status
$C logs -f app        # app logs
$C restart app        # restart
```

## Updating the site

From your PC, in the project folder:

```sh
git ls-files -z -co --exclude-standard | tar --null -czf - -T - | ssh root@82.197.69.44 "tar -xzf - -C /opt/podcast"
ssh root@82.197.69.44 "cd /opt/podcast && docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build"
```

## Going live on theuncharted.show (only after approval)

1. At Spaceship DNS: set `A theuncharted.show → 82.197.69.44` and change `www` from the AWS ALB CNAME to `A 82.197.69.44`.
2. Once DNS resolves to the server, add `theuncharted.show www.theuncharted.show` to `server_name` in `/etc/nginx/sites-available/podcast`, then `nginx -t && systemctl reload nginx`.
3. `certbot --nginx --redirect -d theuncharted.show -d www.theuncharted.show`
4. Set `NEXT_PUBLIC_SITE_URL=https://theuncharted.show` in `.env.production` and rebuild (`up -d --build`).

## Restore from backup

```sh
$C exec -T postgres pg_restore -U unchartered -d unchartered --clean --if-exists --no-owner < /var/backups/podcast/db_<stamp>.dump
$C exec -T app tar -xzf - -C /var/data/media < /var/backups/podcast/media_<stamp>.tar.gz
```

Copy `/var/backups/podcast` off the server regularly. A backup that only lives on the VPS is lost with the VPS.
