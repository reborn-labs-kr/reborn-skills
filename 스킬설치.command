#!/usr/bin/env bash
# macOS 더블클릭 진입점. Finder 에서 두 번 누르면 터미널이 열리고 아래가 실행됩니다.
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo
  echo "  Node.js 가 필요합니다. https://nodejs.org 에서 LTS 를 받아 설치해 주세요."
  echo "  설치 후 이 창을 닫고 다시 두 번 누르시면 됩니다."
  echo
  read -r -p "  엔터를 누르면 창이 닫힙니다. " _ </dev/tty || true
  exit 1
fi
node install.mjs "$@"
echo
read -r -p "  엔터를 누르면 창이 닫힙니다. " _ </dev/tty || true
