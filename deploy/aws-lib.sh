#!/usr/bin/env bash
# Helpers shared by the GitHub Actions deploy workflows. Source this file.
# Requires the AWS CLI v2 with credentials already configured.

# instance_for_host <hostname> -> prints the running EC2 instance id whose
# public IPv4 is what the hostname resolves to.
instance_for_host() {
  local host=$1 ip id
  ip=$(getent ahostsv4 "$host" | awk '{print $1; exit}')
  [ -n "$ip" ] || { echo "::error::$host does not resolve" >&2; return 1; }
  id=$(aws ec2 describe-instances \
        --filters "Name=ip-address,Values=$ip" "Name=instance-state-name,Values=running" \
        --query 'Reservations[].Instances[].InstanceId' --output text)
  [ -n "$id" ] && [ "$id" != None ] || { echo "::error::No running EC2 instance has public IP $ip ($host)" >&2; return 1; }
  echo "$id"
}

# require_ssm_online <instance-id>
require_ssm_online() {
  local st
  st=$(aws ssm describe-instance-information --filters "Key=InstanceIds,Values=$1" \
        --query 'InstanceInformationList[0].PingStatus' --output text 2>/dev/null || true)
  if [ "$st" != Online ]; then
    echo "::error::Instance $1 is not reachable through Systems Manager (status: ${st:-none}). Attach an IAM role with AmazonSSMManagedInstanceCore to the instance (EC2 > Actions > Security > Modify IAM role) and wait a few minutes." >&2
    return 1
  fi
}

# ssm_run <instance-id> <comment> <script-file> [timeout-seconds]
# Runs the script as root on the instance, streams nothing (SSM has no
# streaming) but prints the full stdout/stderr at the end and returns the
# script's exit status.
ssm_run() {
  local id=$1 comment=$2 script=$3 timeout=${4:-2400} cmd status start
  local params
  params=$(jq -n --rawfile s "$script" --arg t "$timeout" '{commands: ($s | split("\n")), executionTimeout: [$t]}')
  cmd=$(aws ssm send-command --instance-ids "$id" --document-name AWS-RunShellScript \
          --comment "$comment" --timeout-seconds 600 --parameters "$params" \
          --query 'Command.CommandId' --output text)
  echo "SSM command $cmd on $id: $comment"
  start=$(date +%s)
  while :; do
    status=$(aws ssm get-command-invocation --command-id "$cmd" --instance-id "$id" --query Status --output text 2>/dev/null || echo Pending)
    case "$status" in
      Pending|InProgress|Delayed) ;;
      *) break ;;
    esac
    [ $(( $(date +%s) - start )) -lt $(( timeout + 120 )) ] || { echo "::error::Timed out waiting for SSM command $cmd" >&2; status=TimedOut; break; }
    sleep 10
  done
  aws ssm get-command-invocation --command-id "$cmd" --instance-id "$id" --query StandardOutputContent --output text
  local err; err=$(aws ssm get-command-invocation --command-id "$cmd" --instance-id "$id" --query StandardErrorContent --output text)
  [ -n "$err" ] && [ "$err" != None ] && { echo "--- stderr ---"; echo "$err"; }
  echo "--- status: $status ---"
  [ "$status" = Success ]
}

# deploy_bucket -> prints the name of the per-account deploy bucket, creating it on first use.
deploy_bucket() {
  local acct region b
  acct=$(aws sts get-caller-identity --query Account --output text)
  region=${AWS_REGION:-ap-southeast-2}
  b="incardible-deploy-$acct"
  if ! aws s3api head-bucket --bucket "$b" 2>/dev/null; then
    echo "Creating deploy bucket $b" >&2
    aws s3api create-bucket --bucket "$b" --region "$region" --create-bucket-configuration "LocationConstraint=$region" >/dev/null
    aws s3api put-public-access-block --bucket "$b" --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
    aws s3api put-bucket-lifecycle-configuration --bucket "$b" --lifecycle-configuration '{"Rules":[{"ID":"expire-releases","Status":"Enabled","Filter":{"Prefix":"releases/"},"Expiration":{"Days":14}}]}'
  fi
  echo "$b"
}

# ar_distribution -> prints "<distribution-id> <bucket> <prefix>" for the
# CloudFront distribution serving $AR_HOST (default ar.incardible.com.au).
ar_distribution() {
  local host=${AR_HOST:-ar.incardible.com.au} row id origin opath bucket
  row=$(aws cloudfront list-distributions --query "DistributionList.Items[?contains(Aliases.Items || \`[]\`, '$host')] | [0].[Id, Origins.Items[0].DomainName, Origins.Items[0].OriginPath]" --output text)
  read -r id origin opath <<<"$row"
  [ -n "$id" ] && [ "$id" != None ] || { echo "::error::No CloudFront distribution has the alias $host" >&2; return 1; }
  bucket=${origin%%.s3*}
  [ "$bucket" != "$origin" ] || { echo "::error::Origin $origin of distribution $id is not an S3 bucket" >&2; return 1; }
  [ "$opath" = None ] && opath=""
  echo "$id $bucket ${opath#/}"
}
