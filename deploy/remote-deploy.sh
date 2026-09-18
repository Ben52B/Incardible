#!/usr/bin/env bash
# Deploys one Incardible app on the server it runs on. Invoked by the "Deploy"
# GitHub Actions workflow through AWS Systems Manager (runs as root).
#
#   APP=api|website|admin  RELEASE_URL=<presigned tgz>  SHA=<git sha>
#   [APP_DIR=/path/to/app] [PM2_NAME=name] [DRY_RUN=1]  bash remote-deploy.sh
#
# What it never touches: .env files, public/uploads, public/music, the legacy
# Unity editor in greetings-card/public/editor, anything outside the app dir
# except ../packages/incardible-ar and ../tools/target-compiler (shared code
# the API and website import by relative path).
set -euo pipefail

APP=${APP:?APP is required (api|website|admin)}
RELEASE_URL=${RELEASE_URL:-}
SHA=${SHA:-unknown}
APP_DIR=${APP_DIR:-}
PM2_NAME=${PM2_NAME:-}
DRY_RUN=${DRY_RUN:-0}

log()  { printf '\n==> %s\n' "$*"; }
die()  { printf '\n!!! %s\n' "$*" >&2; exit 1; }

case "$APP" in
  api)     SUBDIR=greetings-card-apis;  PKG_NAME=greetings-card;              NEEDS_PM2=1 ;;
  website) SUBDIR=greetings-card;       PKG_NAME=greetings-card-website;      NEEDS_PM2=1 ;;
  admin)   SUBDIR=greetings-card-admin; PKG_NAME='Greeting Cards Admin Panel'; NEEDS_PM2=0 ;;
  *) die "Unknown APP '$APP'" ;;
esac

pkg_name() { node -e 'try{console.log(require(process.argv[1]).name||"")}catch(e){console.log("")}' "$1" 2>/dev/null; }
users() { echo root; ls -1 /home 2>/dev/null || true; }
as_user() { local u=$1; shift; sudo -u "$u" -H bash -lc "$*"; }

# ---------------------------------------------------------------- preflight
log "Preflight ($APP, release $SHA)"
for t in curl tar node; do command -v "$t" >/dev/null || die "$t is not installed"; done

# Find the app directory: PM2 process cwd first, then a filesystem scan.
declare -a CANDIDATES=()
if [ -z "$APP_DIR" ]; then
  for u in $(users); do
    out=$(as_user "$u" 'command -v pm2 >/dev/null 2>&1 && pm2 jlist 2>/dev/null' 2>/dev/null || true)
    [ -n "$out" ] && [ "$out" != "[]" ] || continue
    while read -r cwd; do
      [ -n "$cwd" ] && [ -f "$cwd/package.json" ] && [ "$(pkg_name "$cwd/package.json")" = "$PKG_NAME" ] && CANDIDATES+=("$cwd")
    done < <(echo "$out" | node -e 'for (const p of JSON.parse(require("fs").readFileSync(0,"utf8"))) console.log(p.pm2_env.pm_cwd)' 2>/dev/null)
  done
  if [ ${#CANDIDATES[@]} -eq 0 ]; then
    while read -r f; do
      [ "$(pkg_name "$f")" = "$PKG_NAME" ] && CANDIDATES+=("$(dirname "$f")")
    done < <(find /home /var/www /opt /srv /root -maxdepth 4 -name package.json -not -path '*/node_modules/*' -not -path '*/.incardible-*' 2>/dev/null)
  fi
  mapfile -t CANDIDATES < <(printf '%s\n' ${CANDIDATES[@]+"${CANDIDATES[@]}"} | awk 'NF' | sort -u)
  [ ${#CANDIDATES[@]} -eq 1 ] || die "Could not pick the $APP directory automatically (candidates: ${CANDIDATES[*]:-none}). Set the ${APP^^}_APP_DIR repository variable."
  APP_DIR=${CANDIDATES[0]}
fi
[ -d "$APP_DIR" ] || die "APP_DIR $APP_DIR does not exist"
[ "$(pkg_name "$APP_DIR/package.json")" = "$PKG_NAME" ] || die "$APP_DIR/package.json is not '$PKG_NAME' (got '$(pkg_name "$APP_DIR/package.json")')"
OWNER=$(stat -c %U "$APP_DIR")
PARENT=$(dirname "$APP_DIR")
echo "app dir : $APP_DIR (owner $OWNER)"

NODE_MAJOR=$(as_user "$OWNER" 'node -v' 2>/dev/null | sed 's/^v//; s/\..*//')
[ "${NODE_MAJOR:-0}" -ge 18 ] || die "Node $NODE_MAJOR as $OWNER is too old; the API needs Node 18+ (20 recommended)."
echo "node    : v$(as_user "$OWNER" 'node -v' | sed 's/^v//')  npm $(as_user "$OWNER" 'npm -v')"

# Find the PM2 process serving this directory.
if [ -z "$PM2_NAME" ] && as_user "$OWNER" 'command -v pm2' >/dev/null 2>&1; then
  PM2_NAME=$(as_user "$OWNER" 'pm2 jlist 2>/dev/null' | node -e '
    const dir=process.argv[1]; const l=JSON.parse(require("fs").readFileSync(0,"utf8")||"[]");
    const m=l.filter(p=>p.pm2_env.pm_cwd===dir || (p.pm2_env.pm_exec_path||"").startsWith(dir+"/"));
    console.log([...new Set(m.map(p=>p.name))].join(","));' "$APP_DIR" 2>/dev/null || true)
fi
if [ "$NEEDS_PM2" = 1 ]; then
  [ -n "$PM2_NAME" ] || die "No PM2 process found for $APP_DIR. Set the ${APP^^}_PM2_NAME repository variable."
  case "$PM2_NAME" in *,*) die "Several PM2 processes use $APP_DIR ($PM2_NAME); set ${APP^^}_PM2_NAME." ;; esac
fi
echo "pm2     : ${PM2_NAME:-none (static site)}"

MEM_MB=$(awk '/MemTotal/{print int($2/1024)}' /proc/meminfo)
SWAP_MB=$(awk '/SwapTotal/{print int($2/1024)}' /proc/meminfo)
FREE_DISK_MB=$(df -Pm "$APP_DIR" | awk 'NR==2{print $4}')
echo "memory  : ${MEM_MB} MB RAM, ${SWAP_MB} MB swap, ${FREE_DISK_MB} MB free disk"
[ "$FREE_DISK_MB" -ge 1500 ] || die "Less than 1.5 GB free on the disk holding $APP_DIR; clean up before deploying."

if [ "$DRY_RUN" = 1 ]; then
  log "Dry run: nothing changed."
  exit 0
fi
[ -n "$RELEASE_URL" ] || die "RELEASE_URL is required"

# ------------------------------------------------------------------ fetch
WORK=/tmp/incardible-release-$APP-$$
trap 'rm -rf "$WORK"' EXIT
mkdir -p "$WORK"
log "Downloading release"
curl -fsSL --retry 3 -o "$WORK/release.tgz" "$RELEASE_URL"
tar -xzf "$WORK/release.tgz" -C "$WORK" "$SUBDIR" packages/incardible-ar tools/target-compiler deploy
[ -f "$WORK/$SUBDIR/package.json" ] || die "Release archive does not contain $SUBDIR"
echo "release : $(du -sh "$WORK/$SUBDIR" | cut -f1) for $SUBDIR"

# ----------------------------------------------------------------- backup
BACKUPS=$PARENT/.incardible-backups
mkdir -p "$BACKUPS"
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
log "Backing up $APP_DIR to $BACKUPS/$APP-$STAMP.tgz (code and config only)"
tar -czf "$BACKUPS/$APP-$STAMP.tgz" -C "$PARENT" \
  --exclude="$(basename "$APP_DIR")/node_modules" --exclude="$(basename "$APP_DIR")/.next" \
  --exclude="$(basename "$APP_DIR")/out" --exclude="$(basename "$APP_DIR")/public/uploads" \
  --exclude="$(basename "$APP_DIR")/public/music" --exclude="$(basename "$APP_DIR")/public/editor" \
  "$(basename "$APP_DIR")"
ls -1t "$BACKUPS"/"$APP"-*.tgz 2>/dev/null | tail -n +4 | xargs -r rm -f

# ------------------------------------------------------------------- swap
if [ "$APP" != api ] && [ "$MEM_MB" -lt 2000 ] && [ "$SWAP_MB" -lt 1000 ] && [ ! -f /swapfile ]; then
  log "Adding a 2 GB swap file so next build cannot run out of memory"
  fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048 status=none
  chmod 600 /swapfile && mkswap /swapfile >/dev/null && swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# ------------------------------------------------------------------- sync
sync_tree() { # src dst  (mirror, keeping server-only data)
  local src=$1 dst=$2
  mkdir -p "$dst"
  if command -v rsync >/dev/null; then
    rsync -a --delete \
      --exclude node_modules --exclude '.env' --exclude '.env.*' --exclude .next --exclude out \
      --exclude public/uploads --exclude public/music --exclude public/editor --exclude .git \
      --exclude '.incardible-*' "$src/" "$dst/"
  else
    (cd "$src" && tar -cf - --exclude=node_modules --exclude='.env*' --exclude=public/uploads --exclude=public/music --exclude=public/editor .) | (cd "$dst" && tar -xf -)
  fi
  chown -R "$OWNER:$(id -gn "$OWNER")" "$dst"
}
log "Installing files"
sync_tree "$WORK/$SUBDIR" "$APP_DIR"
if [ "$APP" != admin ]; then
  sync_tree "$WORK/packages/incardible-ar" "$PARENT/packages/incardible-ar"
fi
if [ "$APP" = api ]; then
  sync_tree "$WORK/tools/target-compiler" "$PARENT/tools/target-compiler"
fi
echo "$SHA $STAMP" > "$APP_DIR/.deployed-release"; chown "$OWNER" "$APP_DIR/.deployed-release"

# ---------------------------------------------------------- install+build
export NPM_CONFIG_FUND=false NPM_CONFIG_AUDIT=false NPM_CONFIG_LOGLEVEL=error
log "Installing dependencies and building as $OWNER"
case "$APP" in
  api)
    as_user "$OWNER" "cd '$APP_DIR' && npm ci --omit=dev && node --check app.js"
    as_user "$OWNER" "cd '$PARENT/tools/target-compiler' && npm ci && node compile.mjs --check"
    ;;
  website)
    as_user "$OWNER" "cd '$APP_DIR' && npm ci && NEXT_TELEMETRY_DISABLED=1 NODE_OPTIONS=--max-old-space-size=1536 npm run build"
    ;;
  admin)
    as_user "$OWNER" "cd '$APP_DIR' && npm ci && NEXT_TELEMETRY_DISABLED=1 NODE_OPTIONS=--max-old-space-size=1536 npm run build"
    [ -f "$APP_DIR/out/index.html" ] || die "Admin build produced no out/index.html"
    ;;
esac

# ---------------------------------------------------------------- restart
if [ -n "$PM2_NAME" ]; then
  log "Reloading PM2 process $PM2_NAME"
  as_user "$OWNER" "pm2 reload '$PM2_NAME' --update-env || pm2 restart '$PM2_NAME' --update-env"
  as_user "$OWNER" "pm2 save" >/dev/null 2>&1 || true
fi

# ----------------------------------------------------------------- health
port_from_env() { grep -hoE '^PORT=[0-9]+' "$APP_DIR/.env" "$APP_DIR/.env.local" "$APP_DIR/.env.production" 2>/dev/null | head -1 | cut -d= -f2; }
port_from_pm2() { # the port the PM2 process actually listens on
  [ -n "$PM2_NAME" ] || return 0
  local pid; pid=$(as_user "$OWNER" "pm2 pid '$PM2_NAME'" 2>/dev/null | tr -d '[:space:]')
  [[ "$pid" =~ ^[0-9]+$ ]] || return 0
  sleep 2
  (ss -ltnpH 2>/dev/null || true) | grep -E "pid=$pid," | grep -oE ':[0-9]+ ' | head -1 | tr -d ': '
}
app_port() { local p; p=$(port_from_pm2); [ -n "$p" ] || p=$(port_from_env); echo "${p:-$1}"; }
check() { # url  expected-regex
  local i; for i in $(seq 1 20); do
    code=$(curl -s -o /dev/null -m 5 -w '%{http_code}' "$1" || true)
    [[ "$code" =~ $2 ]] && { echo "healthy: $1 -> $code"; return 0; }
    sleep 3
  done
  echo "unhealthy: $1 -> ${code:-no response}"; return 1
}
log "Health check"
case "$APP" in
  api)     check "http://127.0.0.1:$(app_port 5000)/health" '^200$' ;;
  website) check "http://127.0.0.1:$(app_port 3000)/" '^(200|30[0-9])$' ;;
  admin)   echo "static export at $APP_DIR/out ($(find "$APP_DIR/out" -type f | wc -l) files)" ;;
esac
log "Deployed $APP $SHA"
