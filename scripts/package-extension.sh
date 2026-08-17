#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
version="$(node -p "JSON.parse(require('fs').readFileSync('${project_dir}/manifest.json')).version")"
output_dir="${project_dir}/dist"
output_file="${output_dir}/email-to-pdf-v${version}.zip"

mkdir -p "${output_dir}"
rm -f "${output_file}"
cd "${project_dir}"
zip -q -r "${output_file}" manifest.json background.js app.html app.css app.js lib assets
echo "Created ${output_file}"
