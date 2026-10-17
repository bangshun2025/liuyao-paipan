#!/bin/bash
# 从同源的奇门排盘提取历法数据表（SOLAR_TERMS）
# 平时不需要跑；仅当奇门排盘的节气表更新时，用它同步过来。
# 用法：bash scripts/extract-tables.sh   （完成后跑 scripts/build.sh 与 tests/run_tests.js）
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/../qimen-paipan/index.html"
[ -f "$SRC" ] || { echo "找不到 $SRC"; exit 1; }

mkdir -p "$ROOT/src/tables"

# 精确节气表：var SOLAR_TERMS=[ ... ];
awk '/^var SOLAR_TERMS=\[/{f=1} f{print} f&&/^\];$/{exit}' "$SRC" > "$ROOT/src/tables/solar_terms.js"

# 农历表已随「时间起卦」下线，不再提取（取卦只用摇卦）。
wc -c "$ROOT/src/tables/solar_terms.js"
