#!/usr/bin/env bash
set -euo pipefail

PATCH_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"
REPO_DIR="${1:-$(pwd)}"
if [[ ! -f "$REPO_DIR/index.html" || ! -f "$REPO_DIR/cloud.js" || ! -d "$REPO_DIR/supabase" ]]; then
  echo "Run this from the cloned ledger-saquib repo, or pass its path: $0 /path/to/ledger-saquib" >&2
  exit 1
fi
python3 - "$REPO_DIR" "$PATCH_DIR" <<'PY'
from pathlib import Path
import sys

repo, patch = map(Path, sys.argv[1:])
index = repo / 'index.html'
cloud = repo / 'cloud.js'
sw = repo / 'sw.js'
config = repo / 'supabase' / 'config.toml'
html = index.read_text()
cloud_text = cloud.read_text()
sw_text = sw.read_text()
config_text = config.read_text()

if 'monthly_report.js' in html or 'invokeReport' in cloud_text:
    raise SystemExit('Monthly reports already appear to be patched. No files changed.')

script_anchor = '<script src="./groq_ai_import.js"></script>'
if html.count(script_anchor) != 1:
    raise SystemExit('Could not find the AI Import script marker in index.html. No files changed.')
cloud_anchor = '  window.LedgerCloud = { invoke, get signedIn() { return Boolean(user); } };'
if cloud_text.count(cloud_anchor) != 1:
    raise SystemExit('Could not find the LedgerCloud export marker in cloud.js. No files changed.')
if "'./groq_ai_import.js'" not in sw_text or 'const CACHE =' not in sw_text:
    raise SystemExit('Could not find the service worker asset list in sw.js. No files changed.')
if '[functions.ledger-ai-import]' not in config_text:
    raise SystemExit('Could not find the AI function configuration in supabase/config.toml. No files changed.')

cloud_insert = '''  async function invokeReport(action, body = {}) {
    await freshToken();
    const response = await fetch(`${config.url}/functions/v1/monthly-report`, {
      method: 'POST',
      headers: headers({ 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }),
      body: JSON.stringify({ ...body, action })
    });
    let result = {};
    try { result = await response.json(); } catch {}
    if (!response.ok) throw new Error(result.error || `Report request failed (${response.status}).`);
    return result;
  }
'''
cloud_text = cloud_text.replace(cloud_anchor, cloud_insert + '  window.LedgerCloud = { invoke, invokeReport, get signedIn() { return Boolean(user); } };')
html = html.replace(script_anchor, script_anchor + '\n<script src="./monthly_report.js"></script>')
sw_text = sw_text.replace("daily-ledger-shell-v1", "daily-ledger-shell-v2")
sw_text = sw_text.replace("'./groq_ai_import.js'];", "'./groq_ai_import.js', './monthly_report.js'];")
config_text += '\n[functions.monthly-report]\nverify_jwt = false\n'

# Commit each updated file only after all expected markers have been checked.
index.write_text(html)
cloud.write_text(cloud_text)
sw.write_text(sw_text)
config.write_text(config_text)

for source, dest in [
    (patch / 'monthly_report.js', repo / 'monthly_report.js'),
    (patch / 'supabase' / 'schema_monthly_reports.sql', repo / 'supabase' / 'schema_monthly_reports.sql'),
    (patch / 'supabase' / 'schedule_monthly_reports.sql', repo / 'supabase' / 'schedule_monthly_reports.sql'),
    (patch / 'supabase' / 'functions' / 'monthly-report' / 'index.ts', repo / 'supabase' / 'functions' / 'monthly-report' / 'index.ts'),
    (patch / 'MONTHLY_REPORTS_SETUP.md', repo / 'MONTHLY_REPORTS_SETUP.md'),
]:
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(source.read_bytes())
print('Monthly report patch copied into:', repo)
PY
