#!/usr/bin/env bash
# Builds the Bot server, the client web export and the desktop app, makes sure the Electron
# binary is installed, then runs the Playwright smoke: GET /health and the Electron shell.
set -euo pipefail
cd "$(dirname "$0")/../.."
p=scripts/project/pnpm.sh
$p --filter "@waw/bot-server..." run build
$p --filter @waw/bot-client run build
$p --filter @waw/bot-desktop run build
$p --filter @waw/bot-desktop exec install-electron
exec $p --filter @waw/e2e run e2e
