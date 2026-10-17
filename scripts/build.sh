#!/bin/bash
# 六爻排盘 · 单文件构建
#   src/*.js|html  +  src/tables/*.js   →   index.html
# 用法：bash scripts/build.sh
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

OUT="index.html"
{
  cat src/a_head.html
  cat src/c_data.js
  echo ""
  echo "/* ===== 精确节气表（sxtwl 1000-2100，与八字排盘、奇门排盘同源） ===== */"
  cat src/tables/solar_terms.js
  echo ""
  cat src/d_engine.js
  echo ""
  cat src/e_analysis.js
  echo ""
  cat src/f_ui.js
  cat src/g_tail.html
} > "$OUT"

node -e "
const fs=require('fs');
const s=fs.readFileSync('$OUT','utf8');
const m=s.match(/<script>([\s\S]*)<\/script>/);
if(!m){console.error('未找到 <script> 块');process.exit(1);}
new Function(m[1]);
console.log('JS syntax OK');
"
printf 'bytes %s  md5 %s\n' "$(wc -c < "$OUT" | tr -d ' ')" "$(md5 -q "$OUT")"
