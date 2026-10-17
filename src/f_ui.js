/* ===== 六爻排盘 · 界面层 v0.1.3 ===== */
var S = {
  states: [null, null, null, null, null, null],
  refKey: "yue",
  qtype: "zi",
  suQiu: "bian",
  g: null,
  yong: null,
  hlRole: null,
  defaultQtype: "zi",
  tossNote: "",
  note: "",
  noteKey: null,
  dual: null
};

var POS_CN = ["初", "二", "三", "四", "五", "上"];

function dongPosList(states) {
  var out = [];
  for (var i = 0; i < 6; i++) if (states[i] === 6 || states[i] === 9) out.push(POS_CN[i]);
  return out;
}

function $(id) { return document.getElementById(id); }

/* ---------- 参照支 ---------- */
function refZhiOf(key, cal) {
  if (key === "nian") return { zhi: DZ[cal.yz], label: "年支" };
  if (key === "ri") return { zhi: cal.riZhi, label: "日令" };
  if (key === "shi") return { zhi: DZ[cal.sc], label: "时支" };
  return { zhi: DZ[cal.mdz], label: "月建" };
}

/* ---------- 爻符 ---------- */
function glyph(yang, moving) {
  return '<span class="glyph ' + (yang ? "yang" : "yin") + (moving ? " mv" : "") + '"><i></i><i></i></span>';
}

function relCls(rel) {
  if (rel === "回头生" || rel === "化进") return "good";
  if (rel === "回头克" || rel === "化退") return "bad2";
  return "jing";
}

/* ---------- 四柱表：年月日时 × 天干/地支/藏干 ---------- */
function sizhuTableHtml(cal) {
  var idx = [cal.yg, cal.mgz, cal.di, cal.sgz], lab = ["年", "月", "日", "时"], row = ["天干", "地支", "藏干"];
  var h = '<table class="sizhu"><thead><tr><th></th>';
  for (var i = 0; i < 4; i++) h += '<th>' + lab[i] + '</th>';
  h += '</tr></thead><tbody>';
  for (var r = 0; r < 3; r++) {
    h += '<tr><th>' + row[r] + '</th>';
    for (var c = 0; c < 4; c++) {
      var zhi = DZ[idx[c] % 12];
      h += '<td>' + (r === 0 ? TG[idx[c] % 10] : r === 1 ? zhi : esc(ZHI_CANG[zhi].join(""))) + '</td>';
    }
    h += '</tr>';
  }
  return h + '</tbody></table>';
}

/* ---------- 盘面（整合：元信息 → 整卦表 → 半卦分析 → 六爻表） ---------- */
function renderBoard(g, guaHtml, halfHtml) {
  var cal = g.cal;
  var h = '<div class="meta-strip">' +
    '<div class="sz-cell"><b>四柱</b>' + sizhuTableHtml(cal) + '</div>' +
    '<span><b>节气</b> ' + esc(cal.jq) + '</span>' +
    '<span><b>月建</b> ' + wxSpan(ZHI_WX[DZ[cal.mdz]]) + esc(DZ[cal.mdz]) + '</span>' +
    '<span><b>日令</b> ' + wxSpan(ZHI_WX[cal.riZhi]) + esc(cal.riZhi) + '</span>' +
    '<span><b>月空</b> ' + esc(cal.mkong[0] + cal.mkong[1]) + '</span>' +
    '<span><b>日空</b> ' + esc(cal.kong[0] + cal.kong[1]) + '</span>' +
    '<span><b>旺衰参照</b> ' + esc(g.refLabel) + esc(g.refZhi) + '</span>' +
    '</div>';
  if (S.tossNote) h += '<div class="qigua-note">' + S.tossNote + '</div>';
  h += '<div class="duo-hd">整体态势分析</div>';
  h += '<div class="cbz"><div class="cbz-l">' + guaHtml + '</div><div class="cbz-r"><div class="duo-hd cbz-hd">过程与结果</div>' + anaChengbai(g).html + '</div></div>';
  h += '<div class="duo"><div class="duo-l"><div class="duo-hd">双方态势分析</div>' + halfHtml + '</div>';
  h += '<div class="duo-r"><div class="duo-hd">我方与对方</div>' + anaShuangfang(g).html + '</div></div>';
  h += '<div class="yao-sec"><div class="yao-l"><div class="duo-hd hd-ys"><span>要素关系分析</span><span class="ys-pick">用神 <select id="sel-yong">' + yongOptionsHtml() + '</select></span></div>';
  h += '<table class="board' + (S.hlRole ? " hl-" + S.hlRole : "") + '"><colgroup><col class="c-god"><col class="c-fu"><col><col></colgroup><thead><tr><th>六神</th><th>伏神</th><th>本卦</th><th>变卦</th></tr></thead><tbody>';
  var pickWx = (S.yong && S.yong.pick) ? S.yong.pick.wx : null;
  var shenMap = null;
  if (pickWx) {
    var jiWx = "";
    for (var se in WX_KE) if (WX_KE[se] === pickWx) jiWx = se;
    shenMap = {};
    for (var se2 in WX_SHENG) {
      if (se2 === pickWx) shenMap[se2] = '<b class="tag shen-yong ah-link" data-ah="shen" data-p="用神|' + se2 + '|' + pickWx + '">用神</b>';
      else if (WX_SHENG[se2] === pickWx) shenMap[se2] = '<b class="tag shen-yuan ah-link" data-ah="shen" data-p="原神|' + se2 + '|' + pickWx + '">原神</b>';
      else if (WX_KE[se2] === pickWx) shenMap[se2] = '<b class="tag shen-ji ah-link" data-ah="shen" data-p="忌神|' + se2 + '|' + pickWx + '">忌神</b>';
      else if (WX_SHENG[se2] === jiWx) shenMap[se2] = '<b class="tag shen-chou ah-link" data-ah="shen" data-p="仇神|' + se2 + '|' + pickWx + '">仇神</b>';
      else shenMap[se2] = "";
    }
  }
  for (var p = 6; p >= 1; p--) {
    var y = g.yao[p - 1];
    var fu = g.fu.filter(function (f) { return f.pos === p; });
    var fuTxt = fu.map(function (f) {
      return '<div class="fu-line">' + esc(f.liuqin) + '</div><div class="fu-line fu-gz">' + esc(f.gan + f.zhi) + (f.kong ? '<span class="warn">日空</span>' : '') + '</div>';
    }).join("");
      var bl0 = g.bian ? g.bian.yao[p - 1] : null;    var cmp = (bl0 && (bl0.moved || bl0.wx !== y.wx)) ? { wx: bl0.wx, zhi: bl0.zhi, gongWx: g.bian.info.gongWx, banWx: (p <= 3 ? GONG_WX[g.bian.info.lower.n] : GONG_WX[g.bian.info.upper.n]) } : null;
    h += '<tr class="' + (y.shi ? "r-shi " : "") + (y.ying ? "r-ying" : "") + '" data-pos="' + p + '">';
    h += '<td class="c-ls">' + esc(y.liushen) + '</td>';
    h += '<td class="c-fu">' + fuTxt + '</td>';
    h += '<td class="c-ben">' + glyph(y.yang, y.moving) +
      '<span class="lq">' + esc(y.liuqin) + '</span>' +
      '<span class="gz2">' + esc(y.gan) + esc(y.zhi) + '</span>' +
      '<span class="tags">' + yaoTag(y, (shenMap ? shenMap[y.wx] : '')) + '</span>' +
      '<div class="tags-wx4">' + yaoWxTags(y.wx, y.zhi, cal, g.info.gongWx, (p <= 3 ? GONG_WX[g.info.lower.n] : GONG_WX[g.info.upper.n]), cmp) + '</div></td>';
    var bl = g.bian ? g.bian.yao[p - 1] : null;
    if (bl) {
      h += '<td class="c-bian' + (bl.moved ? ' c-bian-wxchg' : ' c-bian-echo') + '">' + glyph(bl.yang, false) +
        '<span class="lq">' + esc(bl.liuqin) + '</span>' +
        '<span class="gz2">' + esc(bl.gan) + esc(bl.zhi) + '</span>' +
        ((y.bian || y.bianRel) ? '<span class="tags">' + bianTag(y, bl, (bl.wx !== y.wx && shenMap ? shenMap[bl.wx] : '')) + '</span>' : '') +
        ((bl.moved || bl.wx !== y.wx) ? '<div class="tags-wx4">' + yaoWxTags(bl.wx, bl.zhi, cal, g.bian.info.gongWx, (p <= 3 ? GONG_WX[g.bian.info.lower.n] : GONG_WX[g.bian.info.upper.n]), { wx: y.wx, zhi: y.zhi, gongWx: g.info.gongWx, banWx: (p <= 3 ? GONG_WX[g.info.lower.n] : GONG_WX[g.info.upper.n]) }, true) + '</div>' : '') + '</td>';
    } else {
      h += '<td class="c-bian"><span class="dim">—</span></td>';
    }
    h += '</tr>';
  }
  h += '</tbody></table></div>';
  h += '<div class="yao-r"><div class="duo-hd">分析记录</div><textarea id="in-note" placeholder="对本卦的分析记录——思路、判断、待验证点。随卦存入档案，重放时恢复。">' + esc(S.note || "") + '</textarea></div>';
  h += '</div>';
  return h;
}

/* ---------- 分析区 ---------- */
var YONG_OPTS = [["auto", "自动"], ["cai", "妻财"], ["guan", "官鬼"], ["fu", "父母"], ["zi", "子孙"], ["xiong", "兄弟"]];
function yongOptionsHtml() {
  var cur = "auto";
  for (var i = 0; i < YONG_OPTS.length; i++) if (YONG_OPTS[i][0] === S.qtype) cur = S.qtype;
  var h = "";
  for (var j = 0; j < YONG_OPTS.length; j++) h += '<option value="' + YONG_OPTS[j][0] + '"' + (YONG_OPTS[j][0] === cur ? " selected" : "") + '>' + YONG_OPTS[j][1] + '</option>';
  return h;
}
function syncSelYong() {
  var sel = $("sel-yong");
  if (!sel) return;
  var hit = "auto";
  for (var i = 0; i < YONG_OPTS.length; i++) if (YONG_OPTS[i][0] === S.qtype) hit = S.qtype;
  sel.value = hit;
}
function yaoRole(wx, pickWx) {
  if (!pickWx) return "";
  if (wx === pickWx) return "yong";
  if (WX_SHENG[wx] === pickWx) return "yuan";
  if (WX_KE[wx] === pickWx) return "ji";
  for (var k in WX_KE) if (WX_KE[k] === pickWx && WX_SHENG[wx] === k) return "chou";
  return "xie";
}
function toggleSrc(btn) {
  var hidden = document.body.classList.toggle('src-hidden');
  btn.textContent = hidden ? '显示数据源' : '隐藏数据源';
}

/* ---------- 复制文本盘面 ---------- */
function boardText() {
  var g = S.g, cal = g.cal, lines = [];
  var plain = function (s) { return s.replace(/<[^>]*>/g, ""); };
  lines.push("生命算法 · 六爻排盘 · " + (S.question || "（未填所问）"));
  lines.push("四柱：" + cal.pillars.join(" ") + "　节气：" + cal.jq + "　月建：" + DZ[cal.mdz] + "　日令：" + cal.riZhi + "　日旬空：" + cal.kong.join(""));
  lines.push("本卦 " + g.info.name + "（" + g.info.gong + "宫 " + g.info.gongWx + " · " + g.info.seqName + " · 世" + SEQ_SHI[g.info.seq] + "应" + SEQ_YING[g.info.seq] + "）" +
    (g.bian ? " → 变卦 " + g.bian.info.name + "（" + g.bian.info.gong + "宫）" : "（六爻全静）"));
  for (var p = 6; p >= 1; p--) {
    var y = g.yao[p - 1], fu = g.fu.filter(function (f) { return f.pos === p; });
    var t = [];
    t.push(y.liushen);
    if (fu.length) t.push("伏:" + fu.map(function (f) { return f.liuqin + f.gan + f.zhi; }).join("/"));
    t.push((y.yang ? "▅▅▅" : "▅ ▅") + " " + y.liuqin + " " + y.gan + y.zhi);
    t.push(plain(yaoWxTags(y.wx, y.zhi, cal, g.info.gongWx, (p <= 3 ? GONG_WX[g.info.lower.n] : GONG_WX[g.info.upper.n]))));
    if (y.shi) t.push("世");
    if (y.ying) t.push("应");
    t.push(y.moving ? "动(旺衰" + y.cs + "/强弱" + y.strength + ")"
      : y.ripo ? "静·日冲" : "静");
    if (y.bian) t.push("→ " + y.bian.rel + " " + y.bian.liuqin + y.bian.gan + y.bian.zhi);
    lines.push(t.join("　"));
  }
  if (g.bian) {
    var bt = [];
    for (var bp = 0; bp < 6; bp++) {
      var b = g.bian.yao[bp];
      var by = g.yao[bp];
      bt.push(POS_CN[bp] + " " + b.liuqin + b.gan + b.zhi + ((b.moved || b.wx !== by.wx) ? (b.moved ? "(动)" : "(静变·" + (by.bianRel || "") + ")") + "［" + plain(yaoWxTags(b.wx, b.zhi, cal, g.bian.info.gongWx, (bp < 3 ? GONG_WX[g.bian.info.lower.n] : GONG_WX[g.bian.info.upper.n]))) + "］" : ""));
    }
    lines.push("变卦 " + g.bian.info.name + "（" + g.bian.info.gong + "宫 " + g.bian.info.gongWx + " · " + g.bian.info.seqName + "）：" + bt.join("　"));
  }
  if (S.yong && S.yong.pick) lines.push("用神：" + S.yong.pick.liuqin + " " + S.yong.pick.pos + "爻" + S.yong.pick.gan + S.yong.pick.zhi);
  return lines.join("\n");
}

/* ---------- 主渲染 ---------- */
function runAnalysis() {
  var g = S.g;
  S.yong = pickYongShen(g, S.qtype);
  var secs = buildAnalysis(g, S.yong);
  $("board-card").innerHTML = renderBoard(g, secs[0].html, secs[1].html);
  $("board-card").hidden = false;
  bindBoardEvents();
}
function bindBoardEvents() {
  var tb = $("board-card").querySelector("table.board");
  var setHl = function (role) {
    S.hlRole = (role === "xie" || role === "" || S.hlRole === role) ? null : role;
    if (tb) tb.className = "board" + (S.hlRole ? " hl-" + S.hlRole : "");
  };
  var rows = $("board-card").querySelectorAll("tr[data-pos]");
  for (var i = 0; i < rows.length; i++) {
    (function (tr) {
      tr.onclick = function () {
        var p = parseInt(tr.getAttribute("data-pos"), 10);
        var pickWx = (S.yong && S.yong.pick) ? S.yong.pick.wx : null;
        setHl(yaoRole(S.g.yao[p - 1].wx, pickWx));
      };
    })(rows[i]);
  }
  var btds = $("board-card").querySelectorAll("td.c-bian");
  for (var j = 0; j < btds.length; j++) {
    (function (td) {
      td.onclick = function (e) {
        if (e.target.closest && e.target.closest('.ah-link, .cb-link')) return;
        e.stopPropagation();
        var tr = td.closest("tr[data-pos]");
        if (!tr || !S.g.bian) return;
        var p = parseInt(tr.getAttribute("data-pos"), 10);
        var pickWx = (S.yong && S.yong.pick) ? S.yong.pick.wx : null;
        setHl(yaoRole(S.g.bian.yao[p - 1].wx, pickWx));
      };
    })(btds[j]);
  }
  var sel = $("sel-yong");
  if (sel) sel.onchange = function () {
    S.qtype = this.value === "auto" ? S.defaultQtype : this.value;
    S.hlRole = null;
    runAnalysis();
  };
}

function computeAndShow() {
  var y = parseInt($("in-y").value, 10), m = parseInt($("in-m").value, 10), d = parseInt($("in-d").value, 10);
  var hh = parseInt($("in-h").value, 10), mi = parseInt($("in-mi").value, 10);
  if (!(y > 999 && m >= 1 && m <= 12 && d >= 1 && d <= 31 && hh >= 0 && hh <= 23 && mi >= 0 && mi <= 59)) {
    $("err").textContent = "摇卦时间填写不完整（年 1000–2100，月 1–12，日 1–31，时 0–23，分 0–59）。";
    return;
  }
  $("err").textContent = "";
  var cal = computePillars(y, m, d, hh, mi);
  var states = S.states.slice();
  for (var ci = 0; ci < 6; ci++) {
    if (states[ci] === null || states[ci] === undefined) {
      $("err").textContent = "六爻尚未录入完整（" + POS_CN[ci] + "爻未选）。";
      return;
    }
  }
  var dong = dongPosList(states);
  var dualOn = S.dual && S.dual.phase === "done" && S.dual.endCode !== null;
  if (dualOn) {
    S.tossNote = "";
  } else {
    S.tossNote = dong.length
      ? "六爻状态录入 → 动爻 " + dong.length + " 个（" + dong.join("、") + "爻）"
      : "六爻状态录入 → 六爻皆静，无变爻";
  }
  var bits = states.map(function (s) { return (s === 7 || s === 9) ? '1' : '0'; }).join('');
  var g = zhuangGua(bits, states, cal, dualOn && !dong.length);
  var ref = refZhiOf(S.refKey, cal);
  computeState(g, { refZhi: ref.zhi, refLabel: ref.label, muRef: [{ zhi: DZ[cal.mdz], label: "月" }, { zhi: cal.riZhi, label: "日" }] });
  S.g = g;
  S.question = $("in-q").value;
  var nk = states.join(",");
  if (S.noteKey !== nk) { S.note = ""; S.noteKey = nk; }
  runAnalysis();
}

/* ---------- 弹窗：卦义 / 关系模式 ---------- */
function ylSec(k, v, classic) {
  return '<div class="yl-sec"><div class="yl-k">' + k + '</div><div class="yl-v' + (classic ? ' classic' : '') + '">' + v + '</div></div>';
}
function ylOpenGua(name) {
  var d = GUA_YI_DETAIL[name];
  if (d) {
    $("yl-title").textContent = name;
    $("yl-body").innerHTML =
      ylSec("卦 象", esc(d.xiang)) +
      ylSec("卦 辞", esc(d.guaci), true) +
      ylSec("卦义直解", esc(d.yi)) +
      ylSec("占得此卦", esc(d.zhan));
  } else {
    d = TRI_YI_DETAIL[name];
    if (!d) return;
    $("yl-title").textContent = name + "（经卦）";
    $("yl-body").innerHTML =
      ylSec("卦 象", esc(d.xiang)) +
      ylSec("类 象", esc(d.lei)) +
      ylSec("卦义直解", esc(d.yi)) +
      ylSec("占得要点", esc(d.zhan));
  }
  $("yl-mask").hidden = false;
}
function ylOpenMode(name) {
  var d = WX_MODE_DETAIL[name];
  if (!d) return;
  $("yl-title").textContent = "本变五型 · " + name;
  $("yl-body").innerHTML =
    ylSec("本 质", esc(d.ess)) +
    ylSec("过程体验", esc(d.flow)) +
    ylSec("主导与流向", esc(d.who)) +
    ylSec("怎么用", esc(d.use)) +
    ylSec("别误读", esc(d.warn));
  $("yl-mask").hidden = false;
}
function cbOpen(k) {
  var d = CB_EXPLAIN[k];
  if (!d) return;
  var sec = k === "前置启动" ? "⓪ 前置启动" : k === "过程难易" ? "① 过程难易" : k === "成败裁定" ? "① 过程难易 · 成败裁定" : (k === "趋势关系" || k === "资源丰沛" || k === "发展空间" || k === "趋势梯队" ? "② 资源关系 · " : "② 权力关系 · ") + k;
  $("yl-title").textContent = sec + (CB_SRC[k] && !document.body.classList.contains("src-hidden") ? "（" + CB_SRC[k] + "）" : "");
  $("yl-body").innerHTML =
    ylSec("是什么", esc(d.what)) +
    ylSec("底层逻辑", esc(d.logic)) +
    ylSec("计算标准", esc(d.std)) +
    ylSec("本卦实算", CB_DYN_HTML[k] || '<span class="dim">未渲染</span>') +
    (k === "过程难易" ? ylSec("相关推演", cbLink("成败裁定") + "——梯队差七档推演与结构注解全文") : "");
  $("yl-mask").hidden = false;
}

/* ---------- 预测档案 ---------- */
var ARC_KEY = "ly_paipan_archives_v1";
var VERDICT_CN = { tbd: "未验", ok: "应验", no: "不应验", part: "部分应验" };

function arcLoad() {
  try { return JSON.parse(localStorage.getItem(ARC_KEY)) || []; } catch (e) { return []; }
}
function arcPersist(list) {
  try { localStorage.setItem(ARC_KEY, JSON.stringify(list)); return true; } catch (e) { return false; }
}
function arcGet(id) {
  var list = arcLoad();
  for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  return null;
}
function fmtClock(n) { return (n < 10 ? "0" : "") + n; }
function arcTimeStr(t) { return t[0] + "-" + fmtClock(t[1]) + "-" + fmtClock(t[2]) + " " + fmtClock(t[3]) + ":" + fmtClock(t[4]); }
function arcAdd() {
  if (!S.g) return false;
  var n = new Date();
  var rec = {
    id: Date.now(),
    savedAt: arcTimeStr([n.getFullYear(), n.getMonth() + 1, n.getDate(), n.getHours(), n.getMinutes()]),
    name: $("in-name").value,
    t: [parseInt($("in-y").value, 10), parseInt($("in-m").value, 10), parseInt($("in-d").value, 10),
        parseInt($("in-h").value, 10), parseInt($("in-mi").value, 10)],
    gz: S.g.cal.pillars.join(" "),
    q: $("in-q").value, qt: S.qtype, sq: S.suQiu, ref: S.refKey,
    states: S.states.slice(),
    note0: S.tossNote,
    note: S.note || "",
    gn: S.g.info.name + (S.g.bian ? " → " + S.g.bian.info.name : ""),
    verdict: { st: "tbd", at: "", note: "" }
  };
  var list = arcLoad();
  list.unshift(rec);
  return arcPersist(list);
}
function arcMerge(list, incoming) {
  if (!incoming || typeof incoming.length !== "number") throw new Error("档案格式：应为数组");
  var have = {}, added = 0;
  for (var i = 0; i < list.length; i++) have[list[i].id] = true;
  for (var j = 0; j < incoming.length; j++) {
    if (incoming[j] && incoming[j].id !== undefined && incoming[j].id !== null && !have[incoming[j].id]) {
      list.push(incoming[j]); have[incoming[j].id] = true; added++;
    }
  }
  list.sort(function (a, b) { return b.id - a.id; });
  return added;
}
function arcDel(id) {
  var list = arcLoad(), out = [];
  for (var i = 0; i < list.length; i++) if (list[i].id !== id) out.push(list[i]);
  arcPersist(out);
  return list.length - out.length;
}
function arcVerdictSave(id, st, at, note) {
  var r = arcGet(id);
  if (!r) return false;
  r.verdict = { st: st, at: at, note: note };
  var list = arcLoad();
  for (var i = 0; i < list.length; i++) if (list[i].id === id) list[i] = r;
  return arcPersist(list);
}
function arcReplay(id) {
  var r = arcGet(id);
  if (!r) return;
  $("in-name").value = r.name || "";
  $("in-y").value = r.t[0]; $("in-m").value = r.t[1]; $("in-d").value = r.t[2];
  $("in-h").value = r.t[3]; $("in-mi").value = r.t[4];
  $("in-q").value = r.q || "";
  S.qtype = r.qt || "auto"; S.hlRole = null; syncSelYong();
  $("sel-suqiu").value = r.sq; S.suQiu = r.sq;
  $("sel-ref").value = r.ref; S.refKey = r.ref;
  S.dual = null;
  S.states = r.states.slice();
  S.note = r.note || "";
  S.noteKey = r.states.join(",");
  computeAndShow();
  S.tossNote = r.note0;
  var nt = $("in-note");
  if (nt) nt.value = S.note;
  buildTossUI();
  window.scrollTo(0, 0);
}
function arcQSave(id, val) {
  var r = arcGet(id);
  if (!r) return;
  r.q = val;
  var list = arcLoad();
  for (var i = 0; i < list.length; i++) if (list[i].id === id) list[i] = r;
  arcPersist(list);
}
function arcBadge(st) { return '<b class="v-badge v-' + st + '">' + (VERDICT_CN[st] || VERDICT_CN.tbd) + '</b>'; }
function arcVSaveClick(id) {
  arcVerdictSave(id, $("arc-vt-" + id).value, $("arc-va-" + id).value, $("arc-vn-" + id).value);
}
function arcFillOpen(id) {
  var box = $("arc-fill-" + id);
  if (!box) return;
  if (!box.hidden) { box.hidden = true; return; }
  var r = arcGet(id);
  if (!r) return;
  var v = r.verdict || { st: "tbd", at: "", note: "" };
  var keys = ["tbd", "ok", "part", "no"];
  var h = '<div class="arc-fill-row"><label>结果</label><select id="arc-vt-' + id + '">';
  for (var i = 0; i < keys.length; i++) h += '<option value="' + keys[i] + '"' + (v.st === keys[i] ? " selected" : "") + '>' + VERDICT_CN[keys[i]] + '</option>';
  h += '</select><label>应期</label><input type="date" id="arc-va-' + id + '" value="' + esc(v.at || "") + '">' +
    '<input type="text" id="arc-vn-' + id + '" placeholder="实际发生了什么" value="' + esc(v.note || "") + '">' +
    '<button class="ta-btn primary" data-op="vsave" data-id="' + id + '">保存回填</button></div>';
  box.innerHTML = h;
  var sb = box.querySelector("button[data-op='vsave']");
  if (sb) sb.onclick = function () { arcVSaveClick(id); arcRender(); };
  box.hidden = false;
}
function arcExportClick() {
  var list = arcLoad();
  if (!list.length) { $("err").textContent = "档案为空，先存几条再导出。"; return; }
  var blob = new Blob([JSON.stringify(list)], { type: "application/json" });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  var n = new Date();
  a.download = "六爻预测档案_" + n.getFullYear() + fmtClock(n.getMonth() + 1) + fmtClock(n.getDate()) + ".json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
function arcImportFile() {
  var f = this.files && this.files[0];
  if (!f) return;
  var self = this;
  var fr = new FileReader();
  fr.onload = function () {
    try {
      var incoming = JSON.parse(fr.result);
      var list = arcLoad();
      var added = arcMerge(list, incoming);
      arcPersist(list);
      $("err").textContent = "导入完成，新增 " + added + " 条。";
      arcRender();
    } catch (e) { $("err").textContent = "导入失败：不是有效的档案 JSON。"; }
    self.value = "";
  };
  fr.readAsText(f);
}
function arcSyncToggle() {
  var card = $("arc-card"), btn = $("btn-arc-toggle");
  if (!card || !btn) return;
  var n = arcLoad().length;
  btn.textContent = card.hidden ? "预测档案（" + n + " 条）" : "收起预测档案";
}
function arcRender() {
  var card = $("arc-card");
  var list = arcLoad();
  var h = '<div class="qz-title">预测档案<span class="dim">　存卦例 → 事后回填验证 → 案例库自校验。档案存本机浏览器，换设备用导出／导入搬运。</span></div>';
  h += '<div class="arc-tools"><button class="ta-btn" id="btn-arc-export">导出 JSON</button>' +
    '<button class="ta-btn" id="btn-arc-import">导入 JSON</button>' +
    '<span class="dim">共 ' + list.length + ' 条</span></div>';
  if (!list.length) {
    h += '<div class="arc-empty">还没有档案。排盘后点「存入档案」即可收进这里。</div>';
  } else {
    h += '<div class="arc-head"><span class="ah-t">日期</span><span class="ah-n">姓名</span><span class="ah-q">所问之事</span></div>';
    for (var i = 0; i < list.length; i++) {
      var r = list[i];
      h += '<div class="arc-item" data-id="' + r.id + '" title="点击打开本卦">' +
        '<div class="arc-grid">' +
        '<span class="arc-time">' + arcTimeStr(r.t) + '</span>' +
        '<span class="arc-name">' + esc(r.name || "—") + '</span>' +
        '<span class="arc-q' + (r.q ? "" : " arc-q-empty") + '" data-qid="' + r.id + '" title="点击录入所问之事">' + esc(r.q || "（未填事项 · 点击录入）") + '</span>' +
        '</div>' +
        '<div class="arc-line1"><span class="arc-gn">' + esc(r.gn) + '</span>' +
        '<span class="arc-gz dim">' + esc(r.gz) + '</span>' + arcBadge(r.verdict.st) +
        (r.verdict.at || r.verdict.note ? '<span class="arc-vdim dim">验证' + (r.verdict.at ? ' ' + esc(r.verdict.at) : '') + (r.verdict.note ? '：' + esc(r.verdict.note) : '') + '</span>' : '') +
        '<span class="arc-ops"><button class="ta-btn" data-op="view" data-id="' + r.id + '">查看重放</button>' +
        '<button class="ta-btn" data-op="fill" data-id="' + r.id + '">验证回填</button>' +
        '<button class="ta-btn" data-op="del" data-id="' + r.id + '">删除</button></span></div>' +
        '<div class="arc-fill" id="arc-fill-' + r.id + '" hidden></div></div>';
    }
  }
  h += '<input type="file" id="arc-import-file" accept=".json,application/json" hidden>';
  card.innerHTML = h;
  $("btn-arc-export").onclick = arcExportClick;
  $("btn-arc-import").onclick = function () { $("arc-import-file").click(); };
  $("arc-import-file").onchange = arcImportFile;
  arcSyncToggle();
  var items = card.querySelectorAll(".arc-item");
  for (var w = 0; w < items.length; w++) {
    (function (el) {
      el.onclick = function (e) {
        if (e.target.closest("button") || e.target.closest(".arc-q") || e.target.closest(".arc-fill")) return;
        arcReplay(parseInt(el.getAttribute("data-id"), 10));
      };
    })(items[w]);
  }
  var qs = card.querySelectorAll(".arc-q");
  for (var q2 = 0; q2 < qs.length; q2++) {
    (function (sp) {
      sp.onclick = function (e) {
        e.stopPropagation();
        var id = parseInt(sp.getAttribute("data-qid"), 10), old = sp.textContent;
        var inp = document.createElement("input");
        inp.type = "text"; inp.className = "arc-q-inp"; inp.value = old === "（未填事项 · 点击录入）" ? "" : old;
        sp.textContent = ""; sp.appendChild(inp);
        inp.focus(); inp.select();
        var done = function () {
          var v = inp.value.trim();
          arcQSave(id, v);
          arcRender();
        };
        inp.onblur = done;
        inp.onkeydown = function (ev) { if (ev.key === "Enter") inp.blur(); };
        inp.onclick = function (ev) { ev.stopPropagation(); };
      };
    })(qs[q2]);
  }
  var btns = card.querySelectorAll("[data-op]");
  for (var k = 0; k < btns.length; k++) {
    (function (b) {
      b.onclick = function () {
        var id = parseInt(b.getAttribute("data-id"), 10), op = b.getAttribute("data-op");
        if (op === "view") arcReplay(id);
        else if (op === "fill") arcFillOpen(id);
        else if (op === "vsave") { arcVSaveClick(id); arcRender(); }
        else if (op === "del") {
          if (window.confirm("删除这条档案？不可恢复。")) { arcDel(id); arcRender(); }
        }
      };
    })(btns[k]);
  }
}

/* ---------- 初始化 ---------- */
function nowParts() {
  var n = new Date();
  return { y: n.getFullYear(), m: n.getMonth() + 1, d: n.getDate(), h: n.getHours(), mi: n.getMinutes() };
}
function fillNow() {
  var p = nowParts();
  $("in-y").value = p.y; $("in-m").value = p.m; $("in-d").value = p.d; $("in-h").value = p.h; $("in-mi").value = p.mi;
}
var YAO_NAME = { 6: "老阴", 8: "少阴", 7: "少阳", 9: "老阳" };

/* ---------- 双端起卦（两步：抽始卦 → 抽终卦，XOR 反推动爻后一次入盘） ---------- */
function dualResetBoard() {
  S.states = [null, null, null, null, null, null];
  S.g = null; S.yong = null; S.hlRole = null; S.tossNote = "";
  $("board-card").hidden = true; $("err").textContent = "";
}
function dualClear() {
  S.dual = null;
  dualResetBoard();
  buildTossUI();
}
function dualStart() {
  S.dual = { phase: "end", startCode: randCode64(), endCode: null };
  dualResetBoard();
  buildTossUI();
}
function dualEnd() {
  if (!S.dual || S.dual.phase !== "end") return;
  S.dual.endCode = randCode64();
  S.dual.phase = "done";
  S.states = dualStates(S.dual.startCode, S.dual.endCode);
  buildTossUI();
  computeAndShow();
}
function dualStatusHtml() {
  if (!S.dual) return "未抽取 —— 先抽始卦，再抽终卦。两卦独立，终卦不排除与始卦相同。";
  var sb = codeToBits(S.dual.startCode);
  var s = '<b>始卦＝' + esc(guaInfo(sb).name) + '</b>';
  if (S.dual.phase !== "done") return s + ' · 待抽终卦';
  var eb = codeToBits(S.dual.endCode);
  s += ' · <b>终卦＝' + esc(guaInfo(eb).name) + '</b>';
  var dd = dualDraw(S.dual.startCode, S.dual.endCode);
  if (!dd.changingCount) s += ' · 两卦相同，六爻皆静';
  return s;
}

var GUA_LIST = [];
function buildGuaList() {
  var items = [];
  for (var c = 0; c < 64; c++) {
    var gi = guaInfo(codeToBits(c));
    items.push({ code: c, name: gi.name, gong: gi.gong, seq: gi.seq });
  }
  var order = TRI.map(function (t) { return t.n; });
  items.sort(function (a, b) {
    var ga = order.indexOf(a.gong), gb = order.indexOf(b.gong);
    return ga !== gb ? ga - gb : a.seq - b.seq;
  });
  GUA_LIST = items;
}
buildGuaList();
function guaDdHtml(id) {
  var h = '<div class="gua-dd" id="' + id + '" data-code="">';
  h += '<button type="button" class="gua-dd-btn" id="' + id + '-btn">— 选卦 —</button>';
  h += '<div class="gua-dd-panel" id="' + id + '-panel" hidden>';
  h += '<input type="text" placeholder="搜卦名／宫名" id="' + id + '-search">';
  h += '<div class="gua-dd-list" id="' + id + '-list">';
  for (var i = 0; i < GUA_LIST.length; i++) {
    var it = GUA_LIST[i];
    h += '<div class="gua-dd-item" data-code="' + it.code + '" data-key="' + it.name + it.gong + '宫">' + it.name + '·' + it.gong + '宫</div>';
  }
  h += '</div></div></div>';
  return h;
}
function guaDdSet(id, code) {
  var dd = $(id);
  dd.dataset.code = code === "" ? "" : String(code);
  var it = code === "" ? null : GUA_LIST.filter(function (x) { return x.code === code; })[0];
  $(id + "-btn").textContent = it ? it.name + '·' + it.gong + '宫' : '— 选卦 —';
}
function guaDdCloseAll() {
  document.querySelectorAll(".gua-dd-panel").forEach(function (p) { p.hidden = true; });
}
function guaDdToggle(id) {
  var opening = $(id + "-panel").hidden;
  guaDdCloseAll();
  if (opening) {
    $(id + "-panel").hidden = false;
    var inp = $(id + "-search");
    inp.value = "";
    guaDdFilter(inp);
    inp.focus();
  }
}
function guaDdFilter(inp) {
  var kw = inp.value.trim();
  var items = inp.parentNode.parentNode.querySelectorAll(".gua-dd-item");
  for (var i = 0; i < items.length; i++) {
    items[i].hidden = !!kw && items[i].dataset.key.indexOf(kw) < 0;
  }
}
function manualDone() {
  var sc = parseInt($("dd-gua-start").dataset.code, 10), ec = parseInt($("dd-gua-end").dataset.code, 10);
  if (isNaN(sc) || isNaN(ec)) return;
  dualResetBoard();
  S.dual = { phase: "done", startCode: sc, endCode: ec };
  S.states = dualStates(sc, ec);
  buildTossUI();
  computeAndShow();
}
function buildTossUI() {
  var mode = S.tossMode || "";
  var h = '<div class="toss-auto dual">' +
    '<div class="ta-btns">' +
    '<button id="btn-mode-random" class="ta-btn' + (mode === "random" ? ' primary' : '') + '">线下抽卦</button>' +
    '<button id="btn-mode-manual" class="ta-btn' + (mode === "manual" ? ' primary' : '') + '">线上录卦</button>' +
    (mode ? '<button id="btn-mode-back" class="ta-btn">返回</button>' : '') +
    '</div>';
  if (!mode) {
    h += '<div class="dual-line">两种起卦法，点选其一：线下抽卦 —— 线上随机抽始卦、终卦；线上录卦 —— 从 64 卦中选始卦、终卦录入。</div>';
  } else if (mode === "random") {
    h += '<div class="ta-btns">' +
      '<button id="btn-dual-start" class="ta-btn primary">' + (S.dual ? '重抽始卦' : '抽取始卦') + '</button>' +
      '<button id="btn-dual-end" class="ta-btn primary"' + (!S.dual || S.dual.phase !== "end" ? ' disabled' : '') + '>抽取终卦</button>' +
      '<button id="btn-dual-redo" class="ta-btn"' + (!S.dual ? ' disabled' : '') + '>清空双端</button>' +
      '</div>' +
      '<div class="dual-line">' + dualStatusHtml() + '</div>';
  } else {
    var done = S.dual && S.dual.phase === "done";
    h += '<div class="ta-btns">' +
      '<label class="dim">始卦</label>' + guaDdHtml("dd-gua-start") +
      '<label class="dim">终卦</label>' + guaDdHtml("dd-gua-end") +
      '<button id="btn-manual-done" class="ta-btn primary"' + (done ? '' : ' disabled') + '>录卦入盘</button>' +
      '</div>' +
      '<div class="dual-line">' + (done ? dualStatusHtml() : '点开下拉选卦：上方搜索框按卦名／宫名过滤，点选即入。两卦独立，终卦可与始卦相同。') + '</div>';
  }
  h += '</div>';
  $("pane-toss").innerHTML = h;
  $("btn-mode-random").onclick = function () { S.tossMode = "random"; buildTossUI(); };
  $("btn-mode-manual").onclick = function () { S.tossMode = "manual"; buildTossUI(); };
  if (mode) $("btn-mode-back").onclick = function () { S.tossMode = ""; buildTossUI(); };
  if (mode === "random") {
    $("btn-dual-start").onclick = dualStart;
    $("btn-dual-end").onclick = dualEnd;
    $("btn-dual-redo").onclick = dualClear;
  }
  if (mode === "manual") {
    var sync = function () { $("btn-manual-done").disabled = !($("dd-gua-start").dataset.code && $("dd-gua-end").dataset.code); };
    ["dd-gua-start", "dd-gua-end"].forEach(function (id) {
      $(id + "-btn").onclick = function (e) { e.stopPropagation(); guaDdToggle(id); };
      $(id + "-search").oninput = function () { guaDdFilter(this); };
      $(id + "-search").onclick = function (e) { e.stopPropagation(); };
      $(id + "-list").onclick = function (e) {
        var t = e.target;
        if (!t.classList.contains("gua-dd-item")) return;
        e.stopPropagation();
        guaDdSet(id, parseInt(t.dataset.code, 10));
        guaDdCloseAll();
        sync();
      };
    });
    if (done) {
      guaDdSet("dd-gua-start", S.dual.startCode);
      guaDdSet("dd-gua-end", S.dual.endCode);
    }
    $("btn-manual-done").onclick = manualDone;
  }
}
function init() {
  S.defaultQtype = S.qtype;
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".gua-dd")) guaDdCloseAll();
  });
  fillNow();
  buildTossUI();
  $("btn-go").onclick = computeAndShow;
  $("btn-now").onclick = fillNow;
  $("btn-reset").onclick = function () {
    S.states = [null, null, null, null, null, null]; S.g = null; S.yong = null; S.hlRole = null; S.tossNote = "";
    S.dual = null; S.tossMode = "";
    fillNow(); buildTossUI();
    $("board-card").hidden = true; $("err").textContent = "";
  };
  $("btn-copy").onclick = function () {
    if (!S.g) return;
    var t = boardText();
    if (navigator.clipboard) navigator.clipboard.writeText(t);
    this.textContent = "已复制";
    var self = this;
    setTimeout(function () { self.textContent = "复制盘面"; }, 1200);
  };
  $("sel-ref").onchange = function () { S.refKey = this.value; if (S.g) { var p = S.g; computeAndShow(); } };
  $("sel-suqiu").onchange = function () { S.suQiu = this.value; if (S.g) runAnalysis(); };
  $("board-card").addEventListener("input", function (e) {
    if (e.target && e.target.id === "in-note") S.note = e.target.value;
  });
  $("btn-arc-toggle").onclick = function () {
    var card = $("arc-card");
    card.hidden = !card.hidden;
    if (!card.hidden) arcRender(); else arcSyncToggle();
  };
  $("btn-save-arc").onclick = function () {
    if (!S.g) { $("err").textContent = "先排一盘，才能存入档案。"; return; }
    var self = this;
    if (arcAdd()) {
      $("err").textContent = "";
      self.textContent = "已存入 ✓";
      setTimeout(function () { self.textContent = "存入档案"; }, 1200);
      $("arc-card").hidden = false;
      arcRender();
    } else {
      $("err").textContent = "存档失败：浏览器存储不可用（隐私模式？）。";
    }
  };
  arcRender();
  computeAndShow();
}
