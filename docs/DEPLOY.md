# Deploying Incardible

Everything runs in AWS `ap-southeast-2` (Sydney):

| Part | Where | How it is deployed |
|---|---|---|
| Website `incardible.com.au` | EC2 server, Next.js under PM2 behind nginx | `Deploy` workflow → Systems Manager → `deploy/remote-deploy.sh` |
| API `api.incardible.com.au` | EC2 server, Express under PM2 behind nginx; uploads on its disk | same |
| Admin `admin.incardible.com.au` | EC2 server, static Next.js export served by nginx | same |
| AR viewer `ar.incardible.com.au` | S3 bucket behind CloudFront | `Deploy` workflow → `aws s3 sync` + invalidation |

Nothing deploys automatically. Merging to `main` only runs CI. Deploys are
started by hand from **Actions → Deploy → Run workflow**.

## One-time setup

1. **IAM user** `github-deploy` with the managed policies `AmazonS3FullAccess`,
   `AmazonSSMFullAccess`, `AmazonEC2ReadOnlyAccess` and `CloudFrontFullAccess`.
   Create an access key and store it in the repository:
   - Secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
   - Variable: `AWS_REGION` = `ap-southeast-2`
2. **Instance role** on each of the three servers so Systems Manager can run
   commands on them: EC2 → instance → Actions → Security → Modify IAM role →
   a role for EC2 with `AmazonSSMManagedInstanceCore` (name it
   `incardible-ec2-ssm`, reuse it for all three). No restart needed; the
   instance shows as *Online* in Systems Manager within a few minutes.
3. Run **Actions → AWS inventory**. It is read-only and prints, per server, the
   OS, Node and PM2 versions, PM2 processes and their directories, nginx sites,
   env variable *names*, upload sizes and free memory. Fix anything it flags
   (an instance not reachable through Systems Manager, Node older than 18).
4. Run **Deploy** with *dry run* ticked. Each server job prints the directory
   and PM2 process it would use and stops. If the script cannot pick them by
   itself, set the repository variables it names:
   `API_APP_DIR`, `WEBSITE_APP_DIR`, `ADMIN_APP_DIR`, `API_PM2_NAME`,
   `WEBSITE_PM2_NAME` (admin has no process). Instance lookup can be pinned
   with `EC2_INSTANCE_API`, `EC2_INSTANCE_WEBSITE`, `EC2_INSTANCE_ADMIN`; the
   viewer bucket with `AR_CF_DISTRIBUTION_ID`, `AR_BUCKET`, `AR_PREFIX`.

## What a server deploy does (`deploy/remote-deploy.sh`)

1. Finds the app directory (PM2 process cwd, then a filesystem scan) and
   checks its `package.json` name, Node ≥ 18, free disk ≥ 1.5 GB.
2. Downloads the release archive built by the workflow (a tarball of the
   repository without `node_modules`, uploads, music and the legacy Unity
   editor) through a one-hour presigned S3 URL.
3. Backs up the current code and config to `../.incardible-backups/` (last 3
   kept; excludes uploads and builds).
4. Mirrors the new code over the app directory with `rsync --delete`, never
   touching `.env*`, `public/uploads`, `public/music`, `public/editor`,
   `node_modules`, `.next`, `out`. The API and website also get the shared
   `../packages/incardible-ar`; the API gets `../tools/target-compiler`.
5. Adds a 2 GB swap file on servers with < 2 GB RAM and no swap (Next.js builds
   otherwise run out of memory on a t3.micro).
6. `npm ci` and `npm run build` as the directory's owner, `pm2 reload` with
   `--update-env`, then a local health check (`/health` for the API, `/` for
   the website, `out/index.html` for the admin). The workflow then checks the
   public URL.

Expect one to three minutes of degraded service on the website while
`next build` runs on the server; the API reload is near-instant.

### Env additions per phase

Before the first deploy add to the API `.env`: `GOOGLE_CLIENT_ID`,
`ADMIN_SETUP_KEY` (optional), `STRIPE_WEBHOOK_SECRET`, and add
`https://ar.incardible.com.au` to `CORS_OPTIONS`. Website and admin `.env`:
`NEXT_PUBLIC_AR_EXPERIENCE_LINK=https://ar.incardible.com.au`. Remove
`NEXT_PUBLIC_STRIPE_SECRET_KEY` from the website. See `docs/PHASE0-CHANGES.md`
to `docs/PHASE3-CHANGES.md` for the full lists.

### Rollback

Restore the backup: on the server, `tar -xzf ../.incardible-backups/<app>-<stamp>.tgz -C ..`,
then `npm ci`, `npm run build` (website/admin) and `pm2 reload <name>`.

## What the AR viewer deploy does

- **preview** (default): uploads `ar-viewer/dist` to `<bucket>/next/` and
  invalidates it. Test at `https://ar.incardible.com.au/next/?templateId=<id>`
  on a phone. Printed QR codes keep opening the Unity viewer.
- **live**: copies the current root objects to `<bucket>/legacy-unity/` (first
  time only), uploads the new viewer to the root, deletes the Unity files it
  replaces, invalidates `/*`. Every printed QR code now opens the new viewer.
  Rollback: `aws s3 sync s3://<bucket>/legacy-unity/ s3://<bucket>/` and
  invalidate `/*`.

`index.html` is uploaded with `Cache-Control: no-cache`, the rest with five
minutes, so a phone picks up a new release within minutes even without the
invalidation.

## Order of the first production rollout

1. API (new endpoints are backwards compatible with the current site).
2. Backfill tracking targets on the API server:
   `node scripts/compile-targets.js --paid` (see `docs/PHASE1-CHANGES.md`).
3. AR viewer in *preview*; scan a few existing cards.
4. Admin, then website.
5. AR viewer *live*.
