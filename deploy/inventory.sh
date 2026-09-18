#!/usr/bin/env bash
# Read-only inventory of an Incardible server. Run by the "AWS inventory"
# GitHub Actions workflow through AWS Systems Manager. Prints nothing secret:
# .env files are listed by variable NAME only.
set -u
section() { printf '\n### %s\n' "$1"; }

section "Host"
hostname; uname -srm
. /etc/os-release 2>/dev/null && echo "$PRETTY_NAME"
uptime | sed 's/^ *//'
echo "Time: $(date -u +%FT%TZ)"

section "Resources"
free -m | sed -n '1,3p'
swapon --show 2>/dev/null || echo "swap: none"
df -h / | sed -n '1,2p'
nproc

section "Tooling (root PATH)"
for t in node npm pm2 nginx git rsync curl tar aws certbot; do
  printf '%-8s %s\n' "$t" "$(command -v "$t" >/dev/null 2>&1 && "$t" --version 2>&1 | head -1 || echo 'missing')"
done

section "Listening ports"
(ss -ltnp 2>/dev/null || netstat -ltnp 2>/dev/null) | awk 'NR==1 || /LISTEN/' | sed 's/  */ /g' | head -25

section "nginx"
if command -v nginx >/dev/null 2>&1; then
  nginx -T 2>/dev/null | grep -E '^\s*(server_name|listen|root|proxy_pass|location|ssl_certificate |client_max_body_size|include /etc/nginx/(sites|conf.d))' | sed 's/^\s*//' | uniq | head -80
else
  echo "nginx not installed"
  ls /etc/apache2/sites-enabled 2>/dev/null && echo "(apache present)"
fi

section "Users with a home directory"
ls -1 /home 2>/dev/null; id -un

section "PM2 processes (per user)"
for u in root $(ls -1 /home 2>/dev/null); do
  home=$(getent passwd "$u" | cut -d: -f6); [ -d "$home" ] || continue
  out=$(sudo -u "$u" -H bash -lc 'command -v pm2 >/dev/null 2>&1 && pm2 jlist 2>/dev/null' 2>/dev/null)
  [ -n "$out" ] && [ "$out" != "[]" ] || continue
  echo "-- user $u: node=$(sudo -u "$u" -H bash -lc 'node -v 2>/dev/null' 2>/dev/null) pm2=$(sudo -u "$u" -H bash -lc 'pm2 -v 2>/dev/null' 2>/dev/null)"
  echo "$out" | node -e '
    const l=JSON.parse(require("fs").readFileSync(0,"utf8"));
    for (const p of l) console.log(`   ${p.name}  status=${p.pm2_env.status}  cwd=${p.pm2_env.pm_cwd}  script=${p.pm2_env.pm_exec_path}  mode=${p.pm2_env.exec_mode}  uptime=${new Date(p.pm2_env.pm_uptime).toISOString()}  mem=${Math.round((p.monit||{}).memory/1e6)}MB`);
  ' 2>/dev/null || echo "$out" | head -c 2000
done

section "Node apps on disk (package.json name -> dir)"
find /home /var/www /opt /srv /root -maxdepth 4 -name package.json -not -path '*/node_modules/*' 2>/dev/null | while read -r f; do
  d=$(dirname "$f"); n=$(node -e 'try{console.log(require(process.argv[1]).name||"")}catch(e){console.log("?")}' "$f" 2>/dev/null)
  git=""; [ -d "$d/.git" ] && git=" git=$(git -C "$d" rev-parse --short HEAD 2>/dev/null) branch=$(git -C "$d" rev-parse --abbrev-ref HEAD 2>/dev/null) dirty=$(git -C "$d" status --porcelain 2>/dev/null | wc -l)"
  envs=""; for e in "$d"/.env "$d"/.env.local "$d"/.env.production; do [ -f "$e" ] && envs="$envs $(basename "$e")[$(grep -cE '^[A-Za-z_]+=' "$e")]"; done
  printf '%-32s %s  owner=%s%s  env:%s\n' "$n" "$d" "$(stat -c %U "$d")" "$git" "${envs:- none}"
  for e in "$d"/.env "$d"/.env.local "$d"/.env.production; do [ -f "$e" ] && echo "      $(basename "$e") vars: $(grep -oE '^[A-Za-z_][A-Za-z0-9_]*=' "$e" | tr -d '=' | tr '\n' ' ')"; done
  [ -d "$d/public/uploads" ] && echo "      uploads: $(du -sh "$d/public/uploads" 2>/dev/null | cut -f1) $(find "$d/public/uploads" -type f | wc -l) files"
  [ -d "$d/.next" ] && echo "      .next build: $(stat -c %y "$d/.next" | cut -d. -f1)"
  [ -d "$d/out" ] && echo "      out/ export: $(stat -c %y "$d/out" | cut -d. -f1)"
done

section "Cron"
for u in root $(ls -1 /home 2>/dev/null); do c=$(crontab -u "$u" -l 2>/dev/null | grep -v '^#'); [ -n "$c" ] && { echo "-- $u"; echo "$c"; }; done
ls /etc/cron.d 2>/dev/null | tr '\n' ' '; echo

section "MongoDB"
(command -v mongod >/dev/null && echo "local mongod: $(mongod --version 2>/dev/null | head -1)") || echo "no local mongod (Atlas or another host)"
systemctl is-active mongod 2>/dev/null || true

section "Security groups / firewall"
(command -v ufw >/dev/null && ufw status 2>/dev/null | head -5) || echo "ufw: n/a"

section "SSL certificates"
ls /etc/letsencrypt/live 2>/dev/null || echo "no letsencrypt dir"
