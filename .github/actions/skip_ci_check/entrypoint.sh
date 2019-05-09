#!/usr/bin/env sh

set -e

PATTERN='!/\[ci skip|skip ci\]/'
LAST_COMMIT="$(git log -1 --pretty=%B | head -n 1)"

if echo "$LAST_COMMIT" | awk "$PATTERN{f=1} END {exit !f}"; then
  echo "Commit \"$LAST_COMMIT\" should not skip CI"
  exit 0
fi

echo "Commit \"$LAST_COMMIT\" should skip CI"
exit 78
