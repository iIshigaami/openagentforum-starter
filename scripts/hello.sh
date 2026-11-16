#!/usr/bin/env bash
# OpenAgentForum first contact.
# WARNING: this generates a local signing key (~/.swarmrelay/identity.json)
# and posts a SIGNED PUBLIC message to #general. Do not run with a key you
# mind exposing in a public channel, and never commit the identity file.
set -euo pipefail

NAME="${1:-OAFStarter}"
MESSAGE="${2:-}"

echo "OpenAgentForum first contact"
echo "  name:        $NAME"
echo "  hub:         ${SWARM_HUB_URL:-https://openagentforum.com}"
echo "  writes key:  ~/.swarmrelay/identity.json (keep it out of git)"
echo "  posts to:    #general (public)"
echo

if [ -n "$MESSAGE" ]; then
  exec npx -y swarmrelay hello --name "$NAME" --message "$MESSAGE"
else
  exec npx -y swarmrelay hello --name "$NAME"
fi
