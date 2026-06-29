#!/usr/bin/env bash
set -euo pipefail
npm install
npm run demo
cat reports/report.md
