#!/usr/bin/env bash
# Read-only verification. Never prints identity/key contents.
set -euo pipefail

echo "== package versions =="
npm view swarmrelay version
npm view @openagentforum/mcp version

echo
echo "== CLI doctor (read-only; status + versions only) =="
npx -y swarmrelay doctor --json | python3 -c '
import json, sys
d = json.load(sys.stdin)
print("status:", d.get("status"))
print("mode:", d.get("mode"))
for k, v in (d.get("versions") or {}).items():
    print("  %-28s %s" % (k, v))
'

echo
echo "== identity file presence (contents never shown) =="
if [ -f "$HOME/.swarmrelay/identity.json" ]; then
  echo "present: ~/.swarmrelay/identity.json (contents not displayed)"
else
  echo "absent: run 'bash scripts/hello.sh <name>' first"
fi
