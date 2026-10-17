/* ===== 六爻排盘 · 分析层 v0.1.3（对应 docs/ALGORITHM.md §9–§14）=====
   原则：只做客观描述与链路检查，不下吉凶断语（生克中性 §A5）。 */

function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function wxSpan(wx) { return '<span class="wx" style="color:' + WX_COLOR[wx] + '">' + wx + '</span>'; }
function wxTag(wx) { return '<span class="wx" style="color:' + WX_COLOR[wx] + ';font-size:.78em"> ' + wx + '</span>'; }
function gz(y) {
  return '<span class="gz">' + esc(y.gan) + esc(y.zhi) + wxTag(y.wx) + '</span>';
}
function posName(p) { return ["初", "二", "三", "四", "五", "上"][p - 1] + "爻"; }
/* 卦符：Unicode U+4DC0 起按文王序，与 GUA_YI 的书写顺序一致 */
function guaSym(name) {
  var ks = Object.keys(GUA_YI), i = ks.indexOf(name);
  return i < 0 ? "" : String.fromCharCode(0x4DC0 + i);
}
/* 爻个性行（v0.2.23 第55轮邦顺口径）：五行，应世，动静，原用仇忌神（shenHtml 由 f_ui 传入），日空，月空，日墓，月墓，日刑冲合害破，月刑冲合害破；
   动静必有（静爻被日冲同时标「静」＋破位「日冲」，不再互斥顶替）；破＝静爻被冲（v0.2.20 单维），标签维持「日冲／月冲」 */
function yaoTag(y, shenHtml) {
  var t = [];
  t.push('<span class="tag wxx ah-link" style="color:' + WX_COLOR[y.wx] + '" data-ah="wx5" data-p="' + y.wx + '">' + y.wx + '</span>');
  if (y.shi) t.push('<b class="tag shi ah-link" data-ah="shiying" data-p="世">世</b>');
  if (y.ying) t.push('<b class="tag ying ah-link" data-ah="shiying" data-p="应">应</b>');
  if (y.moving) t.push('<b class="tag dong ah-link" data-ah="dongjing" data-p="1">动</b>');
  else t.push('<span class="tag jing ah-link" data-ah="dongjing" data-p="0">静</span>');
  if (shenHtml) t.push(shenHtml);
  if (y.kong) t.push('<b class="tag kong ah-link" data-ah="kong" data-p="ri|' + y.zhi + '">日空</b>');
  if (y.mkong) t.push('<b class="tag kong mkong ah-link" data-ah="kong" data-p="yue|' + y.zhi + '">月空</b>');
  var mu = y.mu || [];
  if (mu.indexOf("日墓") >= 0) t.push('<b class="tag mu ah-link" data-ah="mu" data-p="ri|' + y.wx + '|' + y.zhi + '">日墓</b>');
  if (mu.indexOf("月墓") >= 0) t.push('<b class="tag mu ah-link" data-ah="mu" data-p="yue|' + y.wx + '|' + y.zhi + '">月墓</b>');
  if (y.xingRi) t.push('<span class="tag ah-link" data-ah="tag" data-p="xing|ri|' + y.zhi + '">' + (y.xingRi === "自刑" ? "日自刑" : "日刑") + '</span>');
  if (y.ripo) t.push('<b class="tag po ah-link" data-ah="tag" data-p="chong|ri|' + y.zhi + '">日冲</b>');
  else if (y.chongRi && y.moving) t.push('<span class="tag ah-link" data-ah="tag" data-p="chong|ri|' + y.zhi + '">冲日</span>');
  if (y.heRi) t.push('<span class="tag ah-link" data-ah="tag" data-p="he|ri|' + y.zhi + '">日合</span>');
  if (y.haiRi) t.push('<span class="tag ah-link" data-ah="tag" data-p="hai|ri|' + y.zhi + '">日害</span>');
  if (y.xingYue) t.push('<span class="tag ah-link" data-ah="tag" data-p="xing|yue|' + y.zhi + '">' + (y.xingYue === "自刑" ? "月自刑" : "月刑") + '</span>');
  if (y.yuepo) t.push('<b class="tag po ah-link" data-ah="tag" data-p="chong|yue|' + y.zhi + '">月冲</b>');
  else if (y.chongYue && y.moving) t.push('<span class="tag ah-link" data-ah="tag" data-p="chong|yue|' + y.zhi + '">冲月</span>');
  if (y.heYue) t.push('<span class="tag ah-link" data-ah="tag" data-p="he|yue|' + y.zhi + '">月合</span>');
  if (y.haiYue) t.push('<span class="tag ah-link" data-ah="tag" data-p="hai|yue|' + y.zhi + '">月害</span>');
  return t.join(" ");
}

/* 变爻个性行（v0.2.23 第55轮邦顺口径）：五行，化进化退／回头生克／化泄化耗／比和，原用仇忌神（shenHtml 由 f_ui 传入），日空，月空，日刑冲合害破，月刑冲合害破；
   动变取 y.bian.*，静变取 y.bianXxx 标量（第55轮 d_engine 同步补齐） */
function bianTag(y, bl, shenHtml) {
  var b = y.bian;
  var rel = b ? b.rel : y.bianRel;
  var kong = b ? b.kong : y.bianKong, mkong = b ? b.mkong : y.bianMkong;
  var ripo = b ? b.ripo : y.bianRipo, yuepo = b ? b.yuepo : y.bianYuepo;
  var heRi = b ? b.heRi : y.bianHeRi, heYue = b ? b.heYue : y.bianHeYue;
  var xingRi = b ? b.xingRi : y.bianXingRi, haiRi = b ? b.haiRi : y.bianHaiRi;
  var xingYue = b ? b.xingYue : y.bianXingYue, haiYue = b ? b.haiYue : y.bianHaiYue;
  var t = [];
  t.push('<span class="tag wxx ah-link" style="color:' + WX_COLOR[bl.wx] + '" data-ah="wx5" data-p="' + bl.wx + '">' + bl.wx + '</span>');
  if (rel) t.push('<b class="tag ' + relCls(rel) + ' ah-link" data-ah="rel" data-p="' + rel + '|' + y.zhi + '|' + bl.zhi + '">' + rel + '</b>');
  if (shenHtml) t.push(shenHtml);
  if (kong) t.push('<b class="tag kong ah-link" data-ah="kong" data-p="ri|' + bl.zhi + '">日空</b>');
  if (mkong) t.push('<b class="tag kong mkong ah-link" data-ah="kong" data-p="yue|' + bl.zhi + '">月空</b>');
  if (xingRi) t.push('<span class="tag ah-link" data-ah="tag" data-p="xing|ri|' + bl.zhi + '">' + (xingRi === "自刑" ? "日自刑" : "日刑") + '</span>');
  if (ripo) t.push('<b class="tag po ah-link" data-ah="tag" data-p="chong|ri|' + bl.zhi + '">日冲</b>');
  if (heRi) t.push('<span class="tag ah-link" data-ah="tag" data-p="he|ri|' + bl.zhi + '">日合</span>');
  if (haiRi) t.push('<span class="tag ah-link" data-ah="tag" data-p="hai|ri|' + bl.zhi + '">日害</span>');
  if (xingYue) t.push('<span class="tag ah-link" data-ah="tag" data-p="xing|yue|' + bl.zhi + '">' + (xingYue === "自刑" ? "月自刑" : "月刑") + '</span>');
  if (yuepo) t.push('<b class="tag po ah-link" data-ah="tag" data-p="chong|yue|' + bl.zhi + '">月冲</b>');
  if (heYue) t.push('<span class="tag ah-link" data-ah="tag" data-p="he|yue|' + bl.zhi + '">月合</span>');
  if (haiYue) t.push('<span class="tag ah-link" data-ah="tag" data-p="hai|yue|' + bl.zhi + '">月害</span>');
  return t.join(" ");
}

/* 爻级八标（v0.1.53 排序：先月、再日、最后卦；v0.1.54 配色；v0.1.55 本变趋势箭头；v0.2.21 整/半前缀加全角冒号防连读；v0.2.23 升八标＝月生克插入月长生后，「爻比日」归口径名「日生克」值措辞不变）——
   月旺衰 · 月长生 · 月生克 · 日旺衰 · 日长生 · 日生克 · 整卦生克 · 半卦生克（第55轮邦顺必有八项口径）；
   值上旺衰/长生配色（v0.1.54，同半卦属性面板 valCls 口径），前缀与生克项不上色；
   cmp＝对照变卦爻 {wx,zhi,gongWx,banWx} 时值后标本变趋势箭头（v0.1.55，得失区 trendArrs 同款口径，逐维独立，相同不标，生克项不标）；
   flip＝自身是变卦爻（v0.1.56）——对照传本卦爻，方向取反后与本卦侧同向：本卦看起点、变卦看终点 */
function yaoWxTags(wx, zhi, cal, gongWx, banWx, cmp, flip) {
  var m = monthState(wx, DZ[cal.mdz], zhi).level;
  var gw = gongState(wx, gongWx).level;
  var bs = gongState(wx, banWx).level;
  var mq = ahMqOf(wx, DZ[cal.mdz]);
  var d = ahDqOf(wx, cal.riZhi);
  var mc = changSheng(wx, DZ[cal.mdz], tuYin(zhi)), rl = monthState(wx, cal.riZhi, null).level, rc = changSheng(wx, cal.riZhi, tuYin(zhi));
  var tr = flip ? function (t) { return (t === "↗") ? "↘" : (t === "↘") ? "↗" : t; } : function (t) { return t; };
  var tv = ["", "", "", "", "", "", ""];
  if (cmp) {
    var wt = function (a, b, seq) { if (a === b) return ""; seq = seq || WANG_SEQ; return (seq.indexOf(a) < seq.indexOf(b)) ? "↘" : "↗"; };
    tv[0] = tr(wt(m, monthState(cmp.wx, DZ[cal.mdz], cmp.zhi).level));
    var cmc = changSheng(cmp.wx, DZ[cal.mdz], tuYin(cmp.zhi));
    tv[1] = (mc === cmc) ? "" : tr(csTrend(mc, cmc));
    tv[3] = tr(wt(rl, monthState(cmp.wx, cal.riZhi, null).level));
    var crc = changSheng(cmp.wx, cal.riZhi, tuYin(cmp.zhi));
    tv[4] = (rc === crc) ? "" : tr(csTrend(rc, crc));
    tv[5] = tr(wt(gw, gongState(cmp.wx, cmp.gongWx).level, GONG_SEQ));
    tv[6] = tr(wt(bs, gongState(cmp.wx, cmp.banWx).level, GONG_SEQ));
  }
  function cv(v, t, i) {
    var c = valCls(v);
    return '<b class="ah-link' + (c ? ' ' + c : '') + '" data-ah="y8" data-p="' + [i, wx, zhi, DZ[cal.mdz], cal.riZhi, gongWx, banWx].join("|") + '">' + v + '</b>' + (t ? '<span class="tv ' + tvCls(t) + '">' + t + '</span>' : '');
  }
  function cvv(v, i) { return '<b class="ah-link" data-ah="y8" data-p="' + [i, wx, zhi, DZ[cal.mdz], cal.riZhi, gongWx, banWx].join("|") + '">' + v + '</b>'; }
  return "月" + cv(m, tv[0], 0) + " · 月" + cv(mc, tv[1], 1) + " · " + cvv(mq, 2) + " · 日" + cv(rl, tv[3], 3) + " · 日" + cv(rc, tv[4], 4) + " · " + cvv(d, 5) + " · 整：" + cv(gw, tv[5], 6) + " · 半：" + cv(bs, tv[6], 7);
}

/* ---------- 属性规则弹窗（v0.2.24）：爻标签／八标值／面板 KV 点击 → 参考规则表＋本例计算过程 ----------
   入口统一 ahOpen(kind, p)，p 竖线分隔；月支日支从 S.g.cal 现取，弹窗内不落盘任何状态 ---------- */
function ahCsLine(wx, zhi, yin) {
  var gan = (wx === "土") ? (yin ? "己" : "戊") : WX_YANG_GAN[wx];
  return { gan: gan, yin: CB_REP_CS[gan][1] < 0, start: CB_REP_CS[gan][0], f: gan12Full(gan, zhi) };
}
function ahCs12Table(hiGan, hiZhi) {
  var gans = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  var h = '<table class="ah-tb"><tr><th>支＼干</th>';
  for (var i = 0; i < 10; i++) h += '<th>' + gans[i] + '</th>';
  h += '</tr>';
  for (var z = 0; z < 12; z++) {
    h += '<tr><th>' + DZ[z] + '</th>';
    for (var g2 = 0; g2 < 10; g2++) h += '<td' + ((gans[g2] === hiGan && DZ[z] === hiZhi) ? ' class="ah-hi"' : '') + '>' + gan12Full(gans[g2], DZ[z]).name + '</td>';
    h += '</tr>';
  }
  return h + '</table><p class="p dim">十干长生起例（阳顺阴逆，土分阴阳）：甲亥·丙寅·戊午·庚巳·壬申顺行；乙午·丁酉·己巳·辛子·癸卯逆行。金水木火一律以五行对应阳干顺行（v0.1.78 口径：土按主体分阴阳走戊／己线）。</p>';
}
function ahWsTable() {
  return '<table class="ah-tb ah-tb2"><tr><th>档</th><th>判定</th><th>意义</th></tr>' +
    '<tr><td><b>旺</b></td><td>同五行，或临月建／日建</td><td>得令，当令者最强</td></tr>' +
    '<tr><td><b>相</b></td><td>令生我</td><td>受生扶，次强</td></tr>' +
    '<tr><td><b>休</b></td><td>我生令</td><td>向外付出，转弱</td></tr>' +
    '<tr><td><b>囚</b></td><td>我克令</td><td>逆势顶撞，损耗</td></tr>' +
    '<tr><td><b>死</b></td><td>令克我</td><td>被令压制，最弱</td></tr></table>';
}
function ahSkTable() {
  return '<table class="ah-tb ah-tb2"><tr><th>相生环</th><td>木→火→土→金→水→木</td></tr>' +
    '<tr><th>相克环</th><td>木→土→水→火→金→木</td></tr></table>' +
    '<p class="p dim">读法：A→B＝A 生（克）B；同五行＝比和，无生克。</p>';
}
function ahGkTable() {
  return '<table class="ah-tb ah-tb2"><tr><th>五态</th><th>判定</th><th>强弱档</th></tr>' +
    '<tr><td>卦我比和</td><td>爻五行＝卦宫五行</td><td>最强</td></tr>' +
    '<tr><td>卦生我</td><td>卦宫五行生爻五行</td><td>三强</td></tr>' +
    '<tr><td>我克卦</td><td>爻五行克卦宫五行</td><td>次强</td></tr>' +
    '<tr><td>我生卦</td><td>爻五行生卦宫五行</td><td>次弱</td></tr>' +
    '<tr><td>卦克我</td><td>卦宫五行克爻五行</td><td>最弱</td></tr></table>';
}
function ahWsChain(wx, zhi, yzhi) {
  var mw = ZHI_WX[zhi], why;
  if (yzhi === zhi) why = "爻支「" + yzhi + "」正临" + (zhi === DZ[S.g.cal.mdz] ? "月" : "日") + "建（临令者旺）";
  else if (mw === wx) why = "爻五行「" + wx + "」＝令五行「" + mw + "」（比和得令）";
  else if (WX_SHENG[mw] === wx) why = "令「" + mw + "」生爻「" + wx + "」（受生扶）";
  else if (WX_SHENG[wx] === mw) why = "爻「" + wx + "」生令「" + mw + "」（向外付出）";
  else if (WX_KE[wx] === mw) why = "爻「" + wx + "」克令「" + mw + "」（逆势顶撞）";
  else why = "令「" + mw + "」克爻「" + wx + "」（被压制）";
  return "爻五行「" + wx + "」对「" + zhi + "」（" + mw + "）：" + why + " → <b>" + monthState(wx, zhi, yzhi || null).level + "</b>";
}
function ahCsChain(wx, zhi, yin) {
  var m = ahCsLine(wx, zhi, yin);
  return "「" + wx + "」" + (wx === "土" ? "土分阴阳（此处按" + (yin ? "阴土" : "阳土") + "）" : "以阳干取线") + "→ 取「" + m.gan + "」（" + (m.yin ? "阴干逆行" : "阳干顺行") + "，长生在「" + m.start + "」）数至「" + zhi + "」→ <b>" + m.f.name + "</b>（" + m.f.rank + "/6 档，" + (m.f.up ? "上升段" : "下降段") + "）";
}
function ahSkChain(wx, ow, who) {
  var r;
  if (wx === ow) r = "比和（同五行，无生克）";
  else if (WX_SHENG[wx] === ow) r = "爻「" + wx + "」生" + who + "「" + ow + "」";
  else if (WX_KE[wx] === ow) r = "爻「" + wx + "」克" + who + "「" + ow + "」";
  else if (WX_SHENG[ow] === wx) r = who + "「" + ow + "」生爻「" + wx + "」";
  else r = who + "「" + ow + "」克爻「" + wx + "」";
  return "爻五行「" + wx + "」vs " + who + "支五行「" + ow + "」：" + r;
}
function ahGkChain(wx, gwx, what) {
  if (!gwx) return "（整卦卡此行空：卦生克以半卦为对象，见半卦卡）";
  var gs = gongState(wx, gwx);
  return what + "五行「" + gwx + "」vs 爻五行「" + wx + "」：" + gs.rel + " → <b>" + gs.level + "</b>（" + SF_STRONG[gs.level] + "）";
}
function ahTgChain(wx, zhi) {
  return "「" + zhi + "」藏干（" + ZHI_CANG[zhi].map(function (g) { return g + "·" + GAN_WX[g]; }).join("／") + "）→ 「" + wx + "」查表得 <b>" + tongGen(wx, zhi) + "</b>" + (tongGen(wx, zhi) === "无根" ? "（支中无此五行）" : "");
}
function ahKongChain(which, yzhi) {
  var isRi = which === "ri";
  var gz0 = isRi ? S.g.cal.pillars[2] : S.g.cal.pillars[1];
  var dx = JIAZI.indexOf(gz0);
  var x2 = dx - (dx % 10);
  var kk = [DZ[(x2 + 10) % 12], DZ[(x2 + 11) % 12]];
  var hit = kk.indexOf(yzhi) >= 0;
  return (isRi ? "日柱" : "月柱") + "「" + gz0 + "」属「" + JIAZI[x2] + "」旬 → 旬空「" + kk.join("、") + "」；爻支「" + yzhi + "」" + (hit ? "＝旬空之支 → <b>" + (isRi ? "日空" : "月空") + "</b>" : "不在旬空 → 不标空");
}
function ahMuChain(which, wx, yzhi) {
  var mz = WX_MU[wx], ref = which === "ri" ? S.g.cal.riZhi : DZ[S.g.cal.mdz];
  var hit = (mz === ref);
  return "「" + wx + "」五行墓库在「" + mz + "」（金墓丑·木墓未·火墓戌·水墓辰·土墓辰）；" + (which === "ri" ? "日支" : "月支") + "「" + ref + "」" + (hit ? "＝墓库之支 → <b>" + (which === "ri" ? "日墓" : "月墓") + "</b>" : "≠墓库 → 不标墓") + "（旺相入库／休囚入墓，见 y.muKind）";
}
function ahRelChain(rel, yzhi, bzhi) {
  var bw = ZHI_WX[bzhi], ow = ZHI_WX[yzhi], why;
  if (rel === "化进") why = "同五行（" + ow + "）且「" + yzhi + "」→「" + bzhi + "」沿地支顺序前进（进神表：" + Object.keys(JIN_SHEN).map(function (k) { return k + "→" + JIN_SHEN[k]; }).join(" ") + "）";
  else if (rel === "化退") why = "同五行且「" + yzhi + "」→「" + bzhi + "」沿地支顺序后退（退神表：" + Object.keys(TUI_SHEN).map(function (k) { return k + "→" + TUI_SHEN[k]; }).join(" ") + "）";
  else if (rel === "比和") why = "变爻五行「" + bw + "」＝本爻五行「" + ow + "」，非进退（" + yzhi + "→" + bzhi + " 不在进退神表）";
  else if (rel === "回头生") why = "变爻「" + bw + "」生本爻「" + ow + "」（生我者回头生）";
  else if (rel === "回头克") why = "变爻「" + bw + "」克本爻「" + ow + "」（克我者回头克）";
  else if (rel === "化泄") why = "本爻「" + ow + "」生变爻「" + bw + "」（我生者为泄）";
  else why = "本爻「" + ow + "」克变爻「" + bw + "」（我克者为耗）";
  return "本爻「" + yzhi + "」（" + ow + "）→ 变爻「" + bzhi + "」（" + bw + "）：" + why + " → <b>" + rel + "</b>" + ((rel === "化进" || rel === "化退") && ow === "土" ? "（土行·不成进退，参考级）" : "");
}
function ahTagChain(kind, yzhi, ozhi) {
  var tables = {
    chong: '<table class="ah-tb ah-tb2"><tr><th>六冲</th><td>子午 · 丑未 · 寅申 · 卯酉 · 辰戌 · 巳亥</td></tr><tr><th>含义</th><td>对冲，散／动；静爻被冲＝破位标「日冲／月冲」，动爻冲令＝「冲日／冲月」</td></tr></table>',
    he: '<table class="ah-tb ah-tb2"><tr><th>六合</th><td>子丑 · 寅亥 · 卯戌 · 辰酉 · 巳申 · 午未</td></tr><tr><th>含义</th><td>合绊／合起：日合静爻，旺相＝合起（激活）、休囚＝合绊（牵制）</td></tr></table>',
    xing: '<table class="ah-tb ah-tb2"><tr><th>三刑</th><td>寅巳申（恃势）· 丑戌未（无恩）</td></tr><tr><th>互刑</th><td>子卯（无礼）</td></tr><tr><th>自刑</th><td>辰午酉亥（支见同支）</td></tr></table>',
    hai: '<table class="ah-tb ah-tb2"><tr><th>六害</th><td>子未 · 丑午 · 寅巳 · 卯辰 · 申亥 · 酉戌</td></tr><tr><th>含义</th><td>相害＝相合之支被冲所伤，暗损</td></tr></table>'
  };
  var names = { chong: "冲", he: "合", xing: "刑", hai: "害" };
  var who = ozhi === DZ[S.g.cal.mdz] ? "月支" : "日支";
  var hit = "";
  if (kind === "chong") hit = LIU_CHONG[yzhi] === ozhi;
  else if (kind === "he") hit = LIU_HE[yzhi] === ozhi;
  else if (kind === "hai") hit = LIU_HAI[yzhi] === ozhi;
  else hit = !!xingRel(yzhi, ozhi);
  var dsc = "爻支「" + yzhi + "」vs " + who + "「" + ozhi + "」：" + yzhi + names[kind] + ozhi + (["chong", "he", "hai"].indexOf(kind) >= 0 ? "（查表" + (hit ? "命中" : "不中") + "）" : "（查刑组" + (hit ? "命中" : "不中") + "）") + " → <b>" + (hit ? (xingRel(yzhi, ozhi) || names[kind]) : "不标") + "</b>";
  return tables[kind] + '<p class="p">' + dsc + '</p>';
}
function ahMqOf(wx, zhi) {
  var mw = ZHI_WX[zhi];
  if (mw === wx) return "爻比月";
  if (WX_SHENG[wx] === mw) return "爻生月";
  if (WX_KE[wx] === mw) return "爻克月";
  if (WX_SHENG[mw] === wx) return "月生爻";
  return "月克爻";
}
function ahDqOf(wx, zhi) {
  var rw = ZHI_WX[zhi];
  if (rw === wx) return "爻比日";
  if (WX_SHENG[wx] === rw) return "爻生日";
  if (WX_KE[wx] === rw) return "爻克日";
  if (WX_SHENG[rw] === wx) return "日生爻";
  return "日克爻";
}
function ahRqtOf(wx, zhi) {
  var rw = ZHI_WX[zhi];
  if (rw === wx) return "比和日令";
  if (WX_SHENG[rw] === wx) return "日令生我";
  if (WX_KE[rw] === wx) return "日令克我";
  if (WX_SHENG[wx] === rw) return "我生日令";
  return "我克日令";
}
function ahOpen(kind, p) {
  var a = (p || "").split("|");
  var cal = S.g ? S.g.cal : null;
  var mzh = cal ? DZ[cal.mdz] : "", rzh = cal ? cal.riZhi : "";
  var title = "", rule = "", chain = "";
  if (kind === "y8") {
    var i = +a[0], wx = a[1], zhi = a[2];
    title = "八标 · " + ["月旺衰", "月长生", "月令生克", "日旺衰", "日长生", "日令生克", "整卦生克", "半卦生克"][i];
    if (i === 0) { rule = ahWsTable(); chain = ahWsChain(wx, mzh, zhi); }
    else if (i === 1) { rule = ahCs12Table(ahCsLine(wx, mzh, tuYin(zhi)).gan, mzh); chain = ahCsChain(wx, mzh, tuYin(zhi)); }
    else if (i === 2) { rule = ahSkTable(); chain = ahSkChain(wx, ZHI_WX[mzh], "月") + " → <b>" + ahMqOf(wx, mzh) + "</b>"; }
    else if (i === 3) { rule = ahWsTable(); chain = ahWsChain(wx, rzh, null); }
    else if (i === 4) { rule = ahCs12Table(ahCsLine(wx, rzh, tuYin(zhi)).gan, rzh); chain = ahCsChain(wx, rzh, tuYin(zhi)); }
    else if (i === 5) { rule = ahSkTable(); chain = ahSkChain(wx, ZHI_WX[rzh], "日") + " → <b>" + ahDqOf(wx, rzh) + "</b>"; }
    else if (i === 6) { rule = ahGkTable(); chain = ahGkChain(wx, a[5], "整卦"); }
    else { rule = ahGkTable(); chain = ahGkChain(wx, a[6], "半卦"); }
  } else if (kind === "kv") {
    var ki = +a[0], kwx = a[1], kmzh = a[2], krzh = a[3], kyin = a[4] === "1", kgwx = a[5] || null;
    var kn = KV_KEYS[ki];
    title = "属性面板 · " + kn;
    if (kn === "月旺衰") { rule = ahWsTable(); chain = ahWsChain(kwx, kmzh, null); }
    else if (kn === "月长生") { rule = ahCs12Table(ahCsLine(kwx, kmzh, kyin).gan, kmzh); chain = ahCsChain(kwx, kmzh, kyin); }
    else if (kn === "日生克") { rule = ahSkTable(); chain = ahSkChain(kwx, ZHI_WX[krzh], "日") + " → <b>" + ahRqtOf(kwx, krzh) + "</b>"; }
    else if (kn === "日旺衰") { rule = ahWsTable(); chain = ahWsChain(kwx, krzh, null); }
    else if (kn === "日长生") { rule = ahCs12Table(ahCsLine(kwx, krzh, kyin).gan, krzh); chain = ahCsChain(kwx, krzh, kyin); }
    else if (kn === "卦生克") { rule = ahGkTable(); chain = ahGkChain(kwx, kgwx, "半卦所属整卦"); }
    else if (kn === "日资源") {
      var zgan = ZHI_CANG[krzh][0];
      rule = ahCs12Table(zgan, kmzh);
      chain = "日支「" + krzh + "」主气藏干「" + zgan + "」（" + GAN_WX[zgan] + "）在月支「" + kmzh + "」的十二长生态 → <b>" + gan12Full(zgan, kmzh).name + "</b>（v0.2.24 口径：日干改日支主气；与②表「上级资源」同源）";
    }
    else if (kn === "月生克") { rule = ahSkTable(); chain = ahSkChain(kwx, ZHI_WX[kmzh], "月") + " → <b>" + (kwx === ZHI_WX[kmzh] ? "比和月令" : monthState(kwx, kmzh, null).rel) + "</b>"; }
    else {
      rule = '<table class="ah-tb ah-tb2"><tr><th>梯队</th><th>判定</th></tr><tr><td>本气根（3）</td><td>支中藏干与本五行同，且处第一位</td></tr><tr><td>中气根（2）</td><td>藏干处第二位</td></tr><tr><td>余气根（1）</td><td>藏干处第三位</td></tr><tr><td>无根（0）</td><td>支中无此五行</td></tr></table>';
      chain = ahTgChain(kwx, kn === "月通根" ? kmzh : krzh);
    }
  } else if (kind === "wx5") {
    title = "五行 · " + a[0];
    rule = ahSkTable();
    chain = "本爻（本方）五行「" + a[0] + "」——生我者／我生者／克我者／我克者见上表；爻级生克关系全部基于此判定。";
  } else if (kind === "shiying") {
    title = a[0] === "应" ? "应爻" : "世爻";
    rule = '<table class="ah-tb ah-tb2"><tr><th>安放</th><td>京房八宫：六世卦自初爻起数至第 n 爻安世，隔二爻安应（世与应隔两位，阴阳位对应）</td></tr><tr><th>含义</th><td>世＝我方（求测人自己），应＝他方（对方／所测之事的环境）</td></tr></table>';
    chain = "本卦「" + (S.g ? S.g.info.name : "") + "」（" + (S.g ? S.g.info.seqName : "") + "）→ 世在第" + (S.g ? SEQ_SHI[S.g.info.seq] : "") + "爻、应在第" + (S.g ? SEQ_YING[S.g.info.seq] : "") + "爻。";
  } else if (kind === "dongjing") {
    title = a[0] === "1" ? "动爻" : "静爻";
    rule = '<table class="ah-tb ah-tb2"><tr><th>动</th><td>摇得老阳（9 · ○）或老阴（6 · ×）——物极必反，此爻将变，是事情的驱动力</td></tr><tr><th>静</th><td>摇得少阳（7）或少阴（8）——状态稳定，不参与变化</td></tr></table>';
    chain = a[0] === "1" ? "此爻摇得老阳／老阴 → 标「动」，在变卦有对应变爻。" : "此爻摇得少阳／少阴 → 标「静」；静爻被日冲时「静」与「日冲」并存（v0.2.23 起不互斥）。";
  } else if (kind === "shen") {
    var role = a[0], ywx = a[1], pk = a[2];
    title = "六亲角色 · " + role;
    rule = '<table class="ah-tb ah-tb2"><tr><th>用神</th><td>所求之事对应的六亲（随所问切换）</td></tr><tr><th>原神</th><td>生用神者——用神的资源</td></tr><tr><th>忌神</th><td>克用神者——用神的阻力</td></tr><tr><th>仇神</th><td>生忌神者——助纣为虐</td></tr></table>';
    chain = "取用五行「" + pk + "」：本爻「" + ywx + "」" + (ywx === pk ? "＝用神五行 → <b>用神</b>" : WX_SHENG[ywx] === pk ? "生用神「" + pk + "」 → <b>原神</b>" : WX_KE[ywx] === pk ? "克用神「" + pk + "」 → <b>忌神</b>" : WX_SHENG[WX_KE[pk]] === ywx || WX_SHENG[ywx] === WX_KE[pk] ? "生忌神 → <b>仇神</b>" : "与用神无生克线 → 不标") + "（同五行多爻全标，静爻也挂；角色基准随取用即时重排）。";
  } else if (kind === "kong") {
    title = a[0] === "yue" ? "月空（月令旬空）" : "日空（旬空）";
    rule = '<table class="ah-tb ah-tb2"><tr><th>旬空规则</th><td>以干支柱所在旬定：甲子旬（戌亥空）· 甲戌旬（申酉空）· 甲申旬（午未空）· 甲午旬（辰巳空）· 甲辰旬（寅卯空）· 甲寅旬（子丑空）——旬内十干所缺两支即空</td></tr><tr><th>真假空</th><td>旺相空＝假空（待出空填实）；休囚空＝真空</td></tr></table>';
    chain = ahKongChain(a[0], a[1]);
  } else if (kind === "mu") {
    title = a[0] === "yue" ? "月墓" : "日墓";
    rule = '<table class="ah-tb ah-tb2"><tr><th>墓库表</th><td>金墓丑 · 木墓未 · 火墓戌 · 水墓辰 · 土墓辰（水土同宫）</td></tr><tr><th>入库／入墓</th><td>爻旺相逢墓＝入库（收存待用）；休囚逢墓＝入墓（埋没无力）</td></tr></table>';
    chain = ahMuChain(a[0], a[1], a[2]);
  } else if (kind === "tag") {
    var tk = a[0], tw = a[1];
    var tn2 = { chong: tw === "yue" ? "月冲／冲月" : "日冲／冲日", he: tw === "yue" ? "月合" : "日合", xing: tw === "yue" ? "月刑" : "日刑", hai: tw === "yue" ? "月害" : "日害" };
    title = tn2[tk];
    body = ahTagChain(tk, a[2], tw === "yue" ? mzh : rzh);
  } else if (kind === "rel") {
    title = "动变关系 · " + a[0];
    rule = '<table class="ah-tb ah-tb2"><tr><th>同五行</th><td>化进（沿支序前进）／化退（后退）／比和（不在进退表）</td></tr><tr><th>异五行</th><td>回头生（变生本）／回头克（变克本）／化泄（本生变）／化耗（本克变）</td></tr><tr><th>土行特例</th><td>丑辰未戌四墓库库换库不成气序，化进化退作参考（力度次于木火金水）</td></tr></table>';
    chain = ahRelChain(a[0], a[1], a[2]);
  }
  if (!title) return;
  $("yl-title").textContent = title;
  $("yl-body").innerHTML =
    (rule ? ylSec("参考规则", rule) : "") +
    (kind === "tag" ? body : ylSec("本例计算", chain));
  $("yl-mask").hidden = false;
}

/* ---------- 宏观：宫位趋势（本变五型，§3.12 / §3.13） ---------- */
function anaGong(g) {
  var a = g.info;
  if (!g.bian) {
    return {
      title: "宫位整体趋势",
      html: '<p class="p">本卦 ' + esc(a.name) + '（' + esc(a.gong) + '宫·' + wxSpan(a.gongWx) +
        '），<b>无变卦</b> —— 六爻全静，事情没有内在驱动力，成不成完全取决于外力（月日流转）。</p>' +
        '<p class="p dim">八步③：六爻全静时，动爻这一格是空的；趋势只能由月建日令的移步来推动。</p>'
    };
  }
  var b = g.bian.info, rel = wxRelation(a.gongWx, b.gongWx), mode = WX_MODE[rel];
  return {
    title: "宫位整体趋势 · 本变五型",
    html: '<p class="p">本卦 ' + esc(a.name) + '（' + esc(a.gong) + '宫 ' + wxSpan(a.gongWx) + '）→ 变卦 ' + esc(b.name) +
      '（' + esc(b.gong) + '宫 ' + wxSpan(b.gongWx) + '）＝ <b>' + esc(wxRelText(a.gongWx, b.gongWx)) + '</b>，属 <b class="hl">' + esc(mode.name) + '</b>' +
      (mode.dao !== "—" ? '（' + esc(mode.dao) + ' · ' + esc(mode.way) + '）' : '') + '。</p>' +
      '<p class="p dim">口径提醒：「克」在本体系读作<b>定调</b>（谁对最终面貌的塑造力更强），不读作压制或消解。模式意义见「整体态势分析」。</p>'
  };
}

/* ---------- 用神定位 ---------- */
function anaYong(g, yong) {
  var r = yong.rule;
  var h = '<p class="p">所问之事：' + esc(r.label) + ' → 用神取 <b>' + esc(r.lq) + '</b>。</p>';
  if (!yong.pick) {
    return { title: "用神定位", html: h + '<p class="p warn">本卦中「' + esc(r.lq) + '」不上卦 —— 属伏神，需看飞伏与出伏条件（见 §飞伏）。</p>' };
  }
  var p = yong.pick;
  h += '<p class="p">取用：<b>' + (p.shi ? "世爻" : p.ying ? "应爻" : posName(p.pos)) + ' ' + esc(p.liuqin) + '</b> ' + gz(p) +
    '（' + esc(p.cs) + ' · ' + esc(p.strength) + ' · ' + esc(p.xuShi) + (p.kongKind ? ' · ' + esc(p.kongKind) : '') + (p.heQi ? ' · ' + esc(p.heQi) : '') + '）' + (yong.note ? '<span class="dim">　' + esc(yong.note) + '</span>' : '') + '</p>';
  if (p.shi && r.lq !== "世爻") h += '<p class="p hl">用神持世 —— 事与我不分，事在我手。</p>';
  if (p.ying && r.lq !== "应爻") h += '<p class="p">用神临应 —— 事在对方／事情本身。</p>';
  if (yong.cands.length > 1) {
    h += '<p class="p dim">同六亲候选：' + yong.cands.map(function (c) {
      return posName(c.pos) + " " + c.gan + c.zhi + (c.shi ? "(世)" : c.ying ? "(应)" : "") + (c.moving ? "(动)" : "");
    }).join("、") + '</p>';
  }
  h += '<p class="p dim">改用神：直接点盘面任一行（再点一次取消），八步分析会跟着重算。</p>';
  return { title: "用神定位", html: h };
}

/* ---------- 八步断事流程 ---------- */
function anaStep1(g, yong) {
  var cal = g.cal, y = g.yao;
  var shi = null, ying = null;
  for (var k = 0; k < 6; k++) { if (y[k].shi) shi = y[k]; if (y[k].ying) ying = y[k]; }
  var pres = {};
  for (var k2 = 0; k2 < 6; k2++) pres[y[k2].liuqin] = (pres[y[k2].liuqin] || 0) + 1;
  var rows = LQ_ORDER.map(function (lq) {
    var n = pres[lq] || 0;
    if (n) return '<tr><td>' + esc(lq) + '</td><td class="ok">到位 ×' + n + '</td><td class="dim">' + esc(LQ_ROLE[lq]) + '</td></tr>';
    var fu = g.fu.filter(function (f) { return f.liuqin === lq; });
    var fTxt = fu.length ? '伏于 ' + fu.map(function (f) { return posName(f.pos) + "（" + f.feiLiuqin + "）"; }).join("、") : '—';
    return '<tr><td>' + esc(lq) + '</td><td class="warn">不上卦 · ' + esc(fTxt) + '</td><td class="dim">' + esc(LQ_ROLE[lq]) + '</td></tr>';
  }).join("");
  return {
    title: "① 盘点元素 —— 棋盘上有什么棋子",
    html:
      '<p class="p"><b>天时</b>（你控制不了）　年 ' + esc(cal.pillars[0]) + '　月 ' + esc(cal.pillars[1]) + '　日 ' + esc(cal.pillars[2]) +
      '　时 ' + esc(cal.pillars[3]) + '　｜　节气 ' + esc(cal.jq) + '　月建 ' + wxSpan(ZHI_WX[DZ[cal.mdz]]) + esc(DZ[cal.mdz]) +
      '　日令 ' + wxSpan(ZHI_WX[cal.riZhi]) + esc(cal.riZhi) + '　｜　月旬空 ' + esc(cal.mkong[0] + cal.mkong[1]) + '　日旬空 ' + esc(cal.kong[0] + cal.kong[1]) + '</p>' +
      '<p class="p"><b>人事</b>　世爻 ' + posName(shi.pos) + ' ' + shi.gan + shi.zhi + '·' + shi.liuqin +
      '　｜　应爻 ' + posName(ying.pos) + ' ' + ying.gan + ying.zhi + '·' + ying.liuqin + '</p>' +
      (yong.pick ? '<p class="p"><b>标的</b>　用神 ' + posName(yong.pick.pos) + ' ' + yong.pick.gan + yong.pick.zhi + '·' + yong.pick.liuqin + '</p>' : '') +
      '<table class="tbl"><thead><tr><th>六亲</th><th>本卦状态</th><th>生态角色</th></tr></thead><tbody>' + rows + '</tbody></table>'
  };
}
function anaStep2(g) {
  var rows = g.yao.slice().reverse().map(function (y) {
    return '<tr><td>' + posName(y.pos) + '</td><td>' + gz(y) + '</td><td>' + esc(y.liuqin) + '</td><td>' + yaoTag(y) +
      '</td><td>' + esc(y.cs) + '</td><td>' + esc(y.strength) + '</td></tr>';
  }).join("");
  return {
    title: "② 评估起点 —— 给每个元素称重",
    html: '<p class="p dim">旺衰看时令（十二长生，参照：' + esc(g.refLabel) + ' ' + esc(g.refZhi) + '），强弱看局面（日令 + 动爻合力），两者独立。</p>' +
      '<table class="tbl"><thead><tr><th>爻位</th><th>纳甲</th><th>六亲</th><th>状态</th><th>旺衰（' + esc(g.refLabel) + ' ' + wxSpan(ZHI_WX[g.refZhi]) + esc(g.refZhi) + '）</th><th>强弱</th></tr></thead><tbody>' + rows + '</tbody></table>'
  };
}
function anaStep3(g) {
  if (!g.hasMoving) {
    return { title: "③ 看谁动了 —— 哪个维度在变", html: '<p class="p warn">六爻全静 —— 事情没有内在驱动力，成不成完全取决于外力（月建日令的流转）。</p>' };
  }
  var items = g.moving.map(function (p) {
    var y = g.yao[p - 1];
    return '<li>' + posName(p) + ' <b>' + esc(y.liuqin) + '</b> ' + gz(y) + ' → 变为 ' + gz(y.bian) + '（' + esc(y.bian.rel) + '）' +
      '<div class="dim">该维度在变：' + esc(LQ_DIM_MEANING[y.liuqin]) + '</div></li>';
  }).join("");
  return { title: "③ 看谁动了 —— 哪个维度在变", html: '<ul class="ul">' + items + '</ul>' };
}
function anaStep4(g, yong) {
  if (!g.hasMoving) return { title: "④ 评估变化 —— 变化的力量与方向", html: '<p class="p dim">无动爻，本步无内容。</p>' };
  var shi = null, ying = null;
  for (var k = 0; k < 6; k++) { if (g.yao[k].shi) shi = g.yao[k]; if (g.yao[k].ying) ying = g.yao[k]; }
  var items = g.moving.map(function (p) {
    var y = g.yao[p - 1], lines = [];
    lines.push('动爻自身：' + esc(y.cs) + ' · ' + esc(y.strength) + '（净 ' + y.net + '）');
    lines.push('本爻 → 变爻：' + esc(y.bian.rel) + '（' + y.zhi + ' → ' + y.bian.zhi + '）');
    var tgt = [];
    if (yong.pick && yong.pick.pos !== y.pos) tgt.push(['用神', yong.pick]);
    if (shi && shi.pos !== y.pos) tgt.push(['世爻', shi]);
    if (ying && ying.pos !== y.pos) tgt.push(['应爻', ying]);
    for (var i = 0; i < tgt.length; i++) {
      lines.push('动爻 → ' + tgt[i][0] + '（' + posName(tgt[i][1].pos) + ' ' + tgt[i][1].liuqin + '）：' + esc(yaoRelText(y, tgt[i][1])));
    }
    return '<li>' + posName(p) + ' ' + esc(y.liuqin) + ' ' + gz(y) + '<ul class="ul sub"><li>' + lines.join('</li><li>') + '</li></ul></li>';
  }).join("");
  return { title: "④ 评估变化 —— 变化的力量与方向", html: '<ul class="ul">' + items + '</ul>' };
}
function anaStep5(g, yong) {
  if (!g.hasMoving) return { title: "⑤ 看连锁反应 —— 系统被怎么搅动", html: '<p class="p dim">无动爻，本步无内容。</p>' };
  var tally = {}, logs = [];
  for (var m = 0; m < g.moving.length; m++) {
    var o = g.yao[g.moving[m] - 1], acts = [];
    for (var k = 0; k < 6; k++) {
      var t = g.yao[k];
      if (t.pos === o.pos) continue;
      var sheng = (WX_SHENG[o.wx] === t.wx), ke = (WX_KE[o.wx] === t.wx);
      var chong = (LIU_CHONG[o.zhi] === t.zhi), he = (LIU_HE[o.zhi] === t.zhi);
      if (sheng || ke || chong || he) {
        var act = sheng ? "生" : ke ? "克" : "";
        acts.push(posName(t.pos) + " " + t.liuqin + "：" + (act ? "被" + act : "") + (chong ? "·相冲" : "") + (he ? "·相合" : ""));
        if (sheng) tally[t.pos] = (tally[t.pos] || 0) + 1;
      }
    }
    logs.push('<li>' + posName(o.pos) + ' ' + esc(o.liuqin) + '（' + esc(o.wx) + '）' + (acts.length ? '：' + esc(acts.join("；")) : '：不直接生克其他爻') + '</li>');
  }
  var flow = [];
  for (var p in tally) {
    var yy = g.yao[p - 1];
    flow.push(posName(p) + " " + yy.liuqin + (yy.shi ? "（世）" : yy.ying ? "（应）" : "") + " 得生 ×" + tally[p]);
  }
  var flowTxt = flow.length ? '能量最终流向：<b>' + esc(flow.join("、")) + '</b>。' : '动爻没有把能量生给任何一方 —— 力量在本爻与变爻之间自我消耗（或转为克/冲）。';
  return {
    title: "⑤ 看连锁反应 —— 系统被怎么搅动",
    html: '<ul class="ul">' + logs + '</ul><p class="p">' + flowTxt + '</p>' +
      '<p class="p dim">静爻不主动发力，但可被动爻作用（§3.6）：上表只列被动受影响的一方。</p>'
  };
}
function anaStep6(g, yong) {
  if (!g.hasMoving) return { title: "⑥ 看终态 —— 变卦中用神长什么样", html: '<p class="p dim">无变卦。事之终态看月日流转，不看变卦。</p>' };
  var h = '';
  if (yong.pick && yong.pick.moving) {
    var b = yong.pick.bian;
    h += '<p class="p">用神是动爻：' + gz(yong.pick) + ' → ' + gz(b) + '（' + esc(b.rel) + '），终态 ' + esc(b.cs) + '，六亲仍以本卦卦宫定为 <b>' + esc(b.liuqin) + '</b>。' +
      (b.kong ? '<span class="warn">变爻逢日空</span>' : '') + (b.mu.length ? '<span class="warn">变爻' + esc(b.mu.join("/")) + '</span>' : '') + '</p>';
  } else if (yong.pick) {
    h += '<p class="p warn">用神不动（静爻）—— 用神没参与化进化退，终态由外力（月日与动爻）决定，不看变卦。</p>';
  }
  var rows = g.moving.map(function (p) {
    var y = g.yao[p - 1], b = y.bian;
    return '<tr><td>' + posName(p) + '</td><td>' + esc(y.liuqin) + '</td><td>' + gz(y) + '</td><td>' + gz(b) + '</td><td>' + esc(b.rel) + '</td><td>' + esc(b.cs) + '</td><td>' + esc(b.liuqin) + '</td></tr>';
  }).join("");
  h += '<table class="tbl"><thead><tr><th>动爻</th><th>本卦六亲</th><th>本卦</th><th>变爻</th><th>关系</th><th>变爻旺衰</th><th>变爻六亲</th></tr></thead><tbody>' + rows + '</tbody></table>';
  h += '<p class="p dim">变爻六亲以<b>本卦卦宫</b>为基准（身份不变），但五行能量取变后新支（能量可换）。</p>';
  var zhiNotes = [];
  for (var zn = 0; zn < g.moving.length; zn++) {
    var zy = g.yao[g.moving[zn] - 1], zb = zy.bian, tags = [];
    if (zb.zhiChong) tags.push("化冲（" + zy.zhi + "冲" + zb.zhi + "）");
    if (zb.zhiHe) tags.push("化合（" + zy.zhi + "合" + zb.zhi + "）");
    if (zb.zhiXing) tags.push(zb.zhiXing === "自刑" ? "化刑·自刑（" + zb.zhi + "）" : "化刑（" + zy.zhi + "刑" + zb.zhi + "）");
    if (zb.zhiHai) tags.push("化害（" + zy.zhi + "害" + zb.zhi + "）");
    if (zb.yuepo) tags.push("化月冲");
    if (zb.ripo) tags.push("化日冲");
    if (zb.jue) tags.push("化绝");
    if (tags.length) zhiNotes.push(posName(zy.pos) + "：" + tags.join("、"));
  }
  if (zhiNotes.length) h += '<p class="p">变爻地支层（八法关系组＋状态组）：<b>' + zhiNotes.join("；") + '</b>。</p>';
  return { title: "⑥ 看终态 —— 变卦中用神长什么样", html: h };
}
function anaStep7(g, yong) {
  var h = '';
  if (yong.pick) {
    var y = yong.pick, dir;
    if (!y.moving) dir = '用神不动 —— 能量方向由外力决定，本卦到变卦无自我推进。';
    else {
      var up = (y.bian.csLevel > y.csLevel) || (y.bian.rel === "化进" || y.bian.rel === "回头生");
      var down = (y.bian.csLevel < y.csLevel) || (y.bian.rel === "化退" || y.bian.rel === "回头克");
      if (up) dir = '用神能量从本卦到变卦<b>往上走</b>（' + y.cs + ' → ' + y.bian.cs + '，' + y.bian.rel + '）—— 底盘在增强，趋势向成。';
      else if (down) dir = '用神能量从本卦到变卦<b>往下走</b>（' + y.cs + ' → ' + y.bian.cs + '，' + y.bian.rel + '）—— 底盘在削弱，趋势向败。';
      else dir = '用神能量在本卦与变卦之间基本持平（' + y.cs + ' → ' + y.bian.cs + '，' + y.bian.rel + '）—— 趋势不明朗，看外力补刀。';
    }
    h += '<p class="p">' + dir + '</p>';
    if (y.moving && y.bian.jinReal !== undefined) h += '<p class="p dim">' + (y.bian.jinReal ? "化进为<b>真进</b>（原爻旺相，势头正盛）。" : "化进为<b>虚进</b>（原爻休囚，想进进不了）。") + (y.bian.tuRef ? "土行进退（丑辰未戌）无旺相支撑，作参考，力度次于木火金水。" : "") + '</p>';
    if (y.moving && y.bian.tuiReal !== undefined) h += '<p class="p dim">' + (y.bian.tuiReal ? "化退而原爻旺相 —— <b>退而不退</b>，或以退为进。" : "化退为<b>真退</b>（原爻休囚，势头真衰）。") + (y.bian.tuRef ? "土行进退（丑辰未戌）无旺相支撑，作参考，力度次于木火金水。" : "") + '</p>';
  }
  h += '<p class="p dim">化进化退只是快速启发式（§3.7），五个边界条件需逐条核对：化进但入墓 / 旺极反衰 / 退即所愿 / 用神不动 / 事成≠我好。</p>';
  h += '<p class="p"><b>成败 = 趋势 × 落点</b>：趋势定方向（本步），落点定时间（第⑧步）。</p>';
  return { title: "⑦ 定趋势 —— 往上走还是往下走", html: h };
}
function anaStep8(g, yong) {
  if (!yong.pick) return { title: "⑧ 定应期 —— 什么时候落地", html: '<p class="p dim">用神不上卦，先定伏神再论应期。</p>' };
  var list = yingQi(g, yong.pick);
  var suq = (typeof S !== "undefined" && S.suQiu) || "bian";
  var items = list.map(function (x) { return '<li><b>' + esc(x.zhi) + '</b>　' + esc(x.why) + '</li>'; }).join("");
  var extra = [];
  var shi = null;
  for (var k = 0; k < 6; k++) if (g.yao[k].shi) shi = g.yao[k];
  if (shi && shi !== yong.pick) {
    var ls = yingQi(g, shi);
    if (ls.length) extra.push({ tag: "世爻", list: ls.slice(0, 2) });
  }
  var ji = null, yuan = null;
  for (var i = 0; i < 6; i++) {
    var yy = g.yao[i];
    if (yy === yong.pick || !yy.moving) continue;
    if (!ji && WX_KE[yy.wx] === yong.pick.wx) ji = yy;
    if (!yuan && WX_SHENG[yy.wx] === yong.pick.wx) yuan = yy;
  }
  if (ji) { var lj = yingQi(g, ji); if (lj.length) extra.push({ tag: "忌神（" + ji.liuqin + "·" + posName(ji.pos) + "）", list: lj.slice(0, 2) }); }
  if (yuan) { var ly = yingQi(g, yuan); if (ly.length) extra.push({ tag: "原神（" + yuan.liuqin + "·" + posName(yuan.pos) + "）", list: ly.slice(0, 2) }); }
  var h = '<ul class="ul">' + items + '</ul>';
  if (suq === "tui") {
    var tuiSig = [];
    if (g.fanFuYin) tuiSig.push(g.fanFuYin);
    for (var t1 = 0; t1 < 6; t1++) { var t2 = g.yao[t1]; if ((t2.bian && t2.bian.rel === "化退") || t2.bianRel === "化退") tuiSig.push(posName(t2.pos) + t2.liuqin + "化退"); }
    if (tuiSig.length) h += '<p class="p dim"><b>退局信号</b>：' + esc(tuiSig.join("、")) + '。</p>';
  }
  for (var e2 = 0; e2 < extra.length; e2++) {
    h += '<p class="p dim"><b>' + esc(extra[e2].tag) + '应期</b>：' + extra[e2].list.map(function (x) { return '<b>' + esc(x.zhi) + '</b>' + esc(x.why); }).join("；") + '</p>';
  }
  return {
    title: "⑧ 定应期 —— 什么时候落地",
    html: h +
      '<p class="p dim">应期为候选方向，非确定日期：月日走到该支（或该支当令）即为触发点。世／忌／原各列前两条作参照。</p>'
  };
}

/* ---------- 四层判断框架（§3.2）---------- */
function anaL1(g, yong) {
  var rows = [], shi = null, ying = null, k;
  for (k = 0; k < 6; k++) { if (g.yao[k].shi) shi = g.yao[k]; if (g.yao[k].ying) ying = g.yao[k]; }
  rows.push(['世 ↔ 应', posName(shi.pos) + shi.liuqin + ' ' + shi.zhi, posName(ying.pos) + ying.liuqin + ' ' + ying.zhi, yaoRelText(ying, shi), relStrength(g, ying, shi).label]);
  for (var m = 0; m < g.moving.length; m++) {
    var o = g.yao[g.moving[m] - 1];
    if (yong.pick && yong.pick.pos !== o.pos) rows.push(['动爻 → 用神', posName(o.pos) + o.liuqin, posName(yong.pick.pos) + yong.pick.liuqin, yaoRelText(o, yong.pick), relStrength(g, o, yong.pick).label]);
    if (shi.pos !== o.pos) rows.push(['动爻 → 世', posName(o.pos) + o.liuqin, '世 ' + shi.liuqin, yaoRelText(o, shi), relStrength(g, o, shi).label]);
    rows.push(['动爻 → 变爻', posName(o.pos) + o.zhi, o.bian.zhi, o.bian.rel + (o.bian.tuRef ? "（土行·不成进退）" : ""), '—']);
  }
  var mz = DZ[g.cal.mdz], rz = g.cal.riZhi;
  if (yong.pick) {
    rows.push(['月建 → 用神', '月建 ' + mz, posName(yong.pick.pos) + yong.pick.zhi, wxRelText(ZHI_WX[mz], yong.pick.wx), '—']);
    rows.push(['日令 → 用神', '日令 ' + rz, posName(yong.pick.pos) + yong.pick.zhi, wxRelText(ZHI_WX[rz], yong.pick.wx), '—']);
  }
  var html = '<table class="tbl"><thead><tr><th>关系对</th><th>施力方</th><th>受力方</th><th>作用（含合冲）</th><th>力度</th></tr></thead><tbody>' +
    rows.map(function (r) { return '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td><td>' + esc(r[2]) + '</td><td>' + esc(r[3]) + '</td><td>' + esc(r[4]) + '</td></tr>'; }).join("") +
    '</tbody></table>';
  html += '<p class="p dim">本层只做客观描述 —— 谁和谁在发生什么。好坏留给后面三层，且由你自己判断。</p>';
  return { title: "① 关系层 —— 各方在发生什么互动（中性描述）", html: html };
}
function anaL2(g, yong) {
  var shi = null, ying = null, k;
  for (k = 0; k < 6; k++) { if (g.yao[k].shi) shi = g.yao[k]; if (g.yao[k].ying) ying = g.yao[k]; }
  function mark(ok, weak) { return ok ? '<b class="ok">到位</b>' : (weak ? '<b class="warn">偏弱</b>' : '<b class="bad">缺位</b>'); }
  var rows = [];
  if (yong.pick) {
    var y = yong.pick;
    var ok = (y.csLevel >= 1) && !y.kong;
    rows.push(['① 用神', esc(y.liuqin) + ' ' + posName(y.pos) + ' ' + y.zhi, y.cs + ' · ' + y.strength + (y.kong ? ' · 日空' : '') + (y.mu.length ? ' · ' + y.mu.join("/") : ''), mark(ok, y.csLevel === 0)]);
  } else rows.push(['① 用神', '该六亲不上卦', '伏神待出 —— 该维度是隐性力量', mark(false, true)]);
  var shiOk = (shi.csLevel >= 1) && !shi.kong && shi.strength !== "弱";
  rows.push(['② 世爻（我能不能接住）', esc(shi.liuqin) + ' ' + posName(shi.pos) + ' ' + shi.zhi, shi.cs + ' · ' + shi.strength + (shi.kong ? ' · 日空' : ''), mark(shiOk, shi.csLevel === 0 || shi.strength === "偏弱")]);
  var yingOk = (ying.csLevel >= 1) && !ying.kong && ying.strength !== "弱";
  rows.push(['③ 应爻（外部允不允许）', esc(ying.liuqin) + ' ' + posName(ying.pos) + ' ' + ying.zhi, ying.cs + ' · ' + ying.strength + (ying.kong ? ' · 日空' : ''), mark(yingOk, ying.csLevel === 0 || ying.strength === "偏弱")]);
  if (g.moving.length) {
    var txt = g.moving.map(function (p) { var y2 = g.yao[p - 1]; return posName(p) + y2.liuqin + '(' + y2.zhi + '→' + y2.bian.zhi + ' ' + y2.bian.rel + ')'; }).join('；');
    var good = g.moving.filter(function (p) { return g.yao[p - 1].bian.rel === "化进" || g.yao[p - 1].bian.rel === "回头生"; }).length;
    rows.push(['④ 动爻（变数推向哪）', txt, good ? (good + ' 个动爻向增强方向') : '动爻未向增强方向', good ? mark(true, false) : mark(false, true)]);
  } else rows.push(['④ 动爻', '六爻全静', '无内在驱动力，全看外力', '<b class="warn">无驱动</b>']);
  var pres = {}, missing = [];
  for (k = 0; k < 6; k++) pres[g.yao[k].liuqin] = (pres[g.yao[k].liuqin] || 0) + 1;
  LQ_ORDER.forEach(function (lq) { if (!pres[lq]) missing.push(lq); });
  rows.push(['⑤ 六亲生态', missing.length ? ('不上卦：' + missing.join('、')) : '五亲俱全', missing.length ? '缺口维度需伏神/待时补齐' : '各维度都有角色在场', missing.length ? mark(false, true) : mark(true, false)]);
  var html = '<table class="tbl"><thead><tr><th>检查项</th><th>对象</th><th>事实</th><th>标注</th></tr></thead><tbody>' +
    rows.map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td><td>' + r[2] + '</td><td>' + r[3] + '</td></tr>'; }).join("") +
    '</tbody></table>' +
    '<p class="p dim">本层只做链路五项的事实检查：哪一环到位、哪一环偏弱、哪一环缺位。' +
    '<b>不输出「成 / 不成」的机器判定</b> —— 链路通不通，由你结合提问语境来裁。</p>';
  return { title: "② 成败层 —— 成事链路五项检查（事实标注）", html: html };
}
function anaL3(g) {
  var shi = null, k;
  for (k = 0; k < 6; k++) if (g.yao[k].shi) shi = g.yao[k];
  var h = '<p class="p">世爻终态：' + gz(shi) + '（' + esc(shi.liuqin) + '）　旺衰 ' + esc(shi.cs) + ' · 强弱 ' + esc(shi.strength) + '（净 ' + shi.net + '）' +
    (shi.kong ? '　<span class="warn">逢日空</span>' : '') + (shi.mu.length ? '　<span class="warn">' + esc(shi.mu.join("/")) + '</span>' : '') + (shi.yuepo ? '　<span class="warn">月冲</span>' : '') + '</p>';
  if (shi.bian) h += '<p class="p">世爻动变：' + gz(shi.bian) + '（' + esc(shi.bian.rel) + '，终态 ' + esc(shi.bian.cs) + '）</p>';
  h += '<p class="p">受生受克清单：' + (shi.strongNotes.length ? esc(shi.strongNotes.join("；")) : "无动爻/日令作用") + '</p>';
  h += '<p class="p dim">本层只回答「事情做完之后我的状态是变好还是变差」的事实素材；赚还是亏，由你判断。</p>';
  return { title: "③ 得失层 —— 世爻终态（结算单素材）", html: h };
}
function anaL4(g) {
  var shi = null, k;
  for (k = 0; k < 6; k++) if (g.yao[k].shi) shi = g.yao[k];
  var items = [];
  items.push('持世六亲：<b>' + esc(shi.liuqin) + '</b> —— ' + esc(LQ_ROLE[shi.liuqin]));
  items.push('持世六神：<b>' + esc(shi.liushen) + '</b>（' + esc(LIUSHEN_NOTE[shi.liushen]) + '）' + (shi.liushen === "白虎" || shi.liushen === "螣蛇" ? ' <span class="warn">—— 体系判为凶煞位</span>' : ''));
  if (shi.kong) items.push('世爻逢日空 —— 底气虚、事无着落（待出空）');
  if (shi.yuepo) items.push('世爻月冲 —— 根基被月令冲');
  if (shi.mu.length) items.push('世爻' + shi.mu.join("/") + ' —— 气数被锁，待冲开');
  if (shi.bian) items.push('世爻动化 ' + shi.bian.rel + ' → 终态 ' + shi.bian.cs + '（' + shi.bian.zhi + '）');
  items.push('本卦宫 ' + g.info.gong + '（' + g.info.gongWx + '）→ 变卦宫 ' + (g.bian ? g.bian.info.gong + '（' + g.bian.info.gongWx + '）' : '无（六爻全静）'));
  return {
    title: "④ 吉凶层 —— 这件事在人生大图上留下的痕迹",
    html: '<ul class="ul">' + items.map(function (t) { return '<li>' + t + '</li>'; }).join("") + '</ul>' +
      '<p class="p dim">本层只摆事实（世爻位置、六神、空破墓、宫位走向）。这一笔是好是坏，属于你的命运判断，软件不代劳。</p>'
  };
}

/* ---------- 六亲生态（转太极）---------- */
function anaEco(g, yong) {
  if (!yong.pick) {
    return { title: "六亲生态 —— 五种角色各够不够", html: '<p class="p dim">用神不上卦，生态表以伏神所在爻位为准（见飞伏节）。</p>' };
  }
  var base = yong.pick.wx, pres = {}, k;
  for (k = 0; k < 6; k++) pres[g.yao[k].liuqin] = (pres[g.yao[k].liuqin] || 0) + 1;
  var rows = LQ_ORDER.map(function (lq) {
    var n = pres[lq] || 0;
    var status = n ? '到位 ×' + n : (g.fu.filter(function (f) { return f.liuqin === lq; }).length ? '<span class="warn">伏藏</span>' : '<span class="bad">缺位</span>');
    return '<tr><td>' + esc(lq) + '</td><td class="dim">' + esc(LQ_ROLE[lq]) + '</td><td>' + status + '</td></tr>';
  }).join("");
  return {
    title: "六亲生态 —— 五种角色各够不够",
    html: '<table class="tbl"><thead><tr><th>六亲</th><th>对这件事的生态角色</th><th>本卦到位情况</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<p class="p dim">不是「谁帮我谁害我」，而是「每个维度够不够」（§3.2 成败层⑤）。缺位的维度即短板或隐患。</p>'
  };
}

/* ---------- 转太极（§10）---------- */
function anaTaiji(g, yong) {
  if (!yong.pick) return { title: "转太极 —— 以用神为太极点看事情内部结构", html: '<p class="p dim">用神不上卦，暂不转太极。</p>' };
  var base = yong.pick.wx;
  var rows = g.yao.slice().reverse().map(function (y) {
    var lq = (y.pos === yong.pick.pos) ? '（太极点）' : liuqinOf(base, y.wx);
    return '<tr><td>' + posName(y.pos) + '</td><td>' + gz(y) + '</td><td>' + esc(y.liuqin) + '</td><td><b>' + esc(lq) + '</b></td><td class="dim">' + (lq === '（太极点）' ? '用神本身 —— 这件事的主体' : esc(TAIJI_ROLE[lq])) + '</td></tr>';
  }).join("");
  var brows = g.moving.map(function (p) {
    var y = g.yao[p - 1];
    return '<tr><td>' + posName(p) + '变</td><td>' + gz(y.bian) + '</td><td>' + esc(y.bian.liuqin) + '（本宫）</td><td><b>' + esc(liuqinOf(base, y.bian.wx)) + '</b></td><td class="dim">' + esc(TAIJI_ROLE[liuqinOf(base, y.bian.wx)]) + '</td></tr>';
  }).join("");
  return {
    title: "转太极 —— 以用神为太极点看事情内部结构",
    html: '<p class="p">太极点：用神 <b>' + esc(yong.pick.liuqin) + '</b> ' + gz(yong.pick) + '（' + esc(yong.pick.wx) + '）。下表把每一爻的五行重新挂到用神名下。</p>' +
      '<table class="tbl"><thead><tr><th>爻位</th><th>纳甲</th><th>本卦六亲（卦宫视角）</th><th>转太极后</th><th>生态角色</th></tr></thead><tbody>' + rows + brows + '</tbody></table>' +
      '<p class="p dim">两轮结合才算完整：世爻视角答「这件事在我的人生里怎么样」，用神视角答「这件事自身品质如何」。</p>'
  };
}

/* ---------- 飞伏 ---------- */
function fuFeiDir(fwx, fewx) {
  if (fwx === fewx) return "飞伏比和";
  if (WX_SHENG[fewx] === fwx) return "飞神生伏";
  if (WX_KE[fewx] === fwx) return "飞神克伏";
  if (WX_SHENG[fwx] === fewx) return "伏神生飞（泄气）";
  return "伏神克飞";
}
function anaFu(g) {
  if (!g.fu.length) return { title: "飞伏 —— 六亲不上卦的处理", html: '<p class="p ok">本卦五亲俱全，无伏神。</p>' };
  var items = g.fu.map(function (f) {
    var cond = [];
    if (LIU_CHONG[f.feiZhi] === f.zhi) cond.push("伏冲飞神");
    if (g.cal.riZhi === f.zhi || DZ[g.cal.mdz] === f.zhi) cond.push("值伏神地支（月日临之）");
    if (WX_SHENG[ZHI_WX[g.cal.riZhi]] === f.wx || WX_SHENG[ZHI_WX[DZ[g.cal.mdz]]] === f.wx) cond.push("月日生扶");
    var fei = g.yao[f.pos - 1];
    if (fei.kong || fei.yuepo || fei.ripo) cond.push("飞神空破");
    if (fei.heRi || fei.heYue) cond.push("飞神被合");
    if (f.wang) cond.push("伏神旺相");
    return '<li><b>' + esc(f.liuqin) + '</b> 伏于 ' + posName(f.pos) + '（' + f.gan + f.zhi + '）之下' +
      '<div class="dim">飞神：' + esc(f.feiGan) + esc(f.feiZhi) + '·' + esc(f.feiLiuqin) + '　飞伏关系：' + esc(fuFeiDir(f.wx, f.feiWx)) +
      (f.kong ? '　<span class="warn">伏神逢日空</span>' : '') + '　旺衰：' + esc(f.cs) + '</div>' +
      '<div class="dim">出伏条件：' + (cond.length ? esc(cond.join("；")) : '伏冲飞神 / 值伏神地支 / 月日生扶 / 飞神空破 / 飞神被合 / 伏神旺相（当前均未触发）') + '</div></li>';
  }).join("");
  return {
    title: "飞伏 —— 六亲不上卦的处理",
    html: '<ul class="ul">' + items + '</ul>' +
      '<p class="p dim">伏藏不等于没有，而是「还没上场，需要被调出来」（§3.8）。</p>'
  };
}

/* ---------- 要览短词串：卦义，月态，月长生，日生克，日旺衰，日长生（，整态；v0.2.21 整态前缀加冒号）---------- */
function compactTokenArr(yi, wx, mzh, rzh, gwx, yin) {
  var rw = ZHI_WX[rzh];
  var rqt = (rw === wx) ? "日比和" : (WX_SHENG[rw] === wx) ? "日生我" : (WX_KE[rw] === wx) ? "日克我" : (WX_SHENG[wx] === rw) ? "我生日" : "我克日";
  var t = [yi, "月" + monthState(wx, mzh, null).level, "月" + changSheng(wx, mzh, yin), rqt,
    "日" + monthState(wx, rzh, null).level, "日" + changSheng(wx, rzh, yin)];
  if (gwx) t.push("整：" + gongState(wx, gwx).level);
  return t;
}
function compactTokens(yi, wx, mzh, rzh, gwx, yin) { return compactTokenArr(yi, wx, mzh, rzh, gwx, yin).join("，"); }

/* ---------- 图形版：属性小字键值（值不带「月/日/整」前缀，键标注属性名）---------- */
var KV_KEYS = ["卦义", "月旺衰", "月长生", "日生克", "日旺衰", "日长生", "卦生克", "日资源", "月生克", "月通根", "日通根"];
function structTokenArr(yi, wx, mzh, rzh, gwx, yin) {
  var rw = ZHI_WX[rzh];
  var rqt = (rw === wx) ? "比和日令" : (WX_SHENG[rw] === wx) ? "日令生我" : (WX_KE[rw] === wx) ? "日令克我" : (WX_SHENG[wx] === rw) ? "我生日令" : "我克日令";
  var ms = monthState(wx, mzh, null);
  return [yi, ms.level, changSheng(wx, mzh, yin), rqt,
    monthState(wx, rzh, null).level, changSheng(wx, rzh, yin),
    gwx ? gongState(wx, gwx).level : "",
    gan12Full(ZHI_CANG[rzh][0], mzh).name, ms.rel,
    tongGen(wx, mzh), tongGen(wx, rzh)];
}
/* 两列面板行序（DOM 序＝grid 行优先）：整卦 5 行（v0.1.77）＝卦义｜日资源 / 月旺衰｜日旺衰 / 月长生｜日长生 / 月生克｜日生克 / 月通根｜日通根，
   其中日资源＝日支主气干在月支十二长生态（v0.2.24 口径修正：日干→日支主气，如午日取丁；与②表「上级资源」同口径，始卦终卦同值），通根＝卦宫五行对月支／日支藏干求根；
/* 半卦 5 行（v0.1.98 邦顺格式）＝月令组 月生克｜月长生 / 月旺衰｜月通根，日令组 日生克｜日长生 / 日旺衰｜日通根，行5 日资源｜空 */
var KV_LAYOUT = { gz: [0, 7, 1, 4, 2, 5, 8, 3, 9, 10], hf: [8, 2, 1, 9, 3, 5, 4, 10, 7, -1] };
function kvList(arr, mode, trends, yiName, ctx) {
  var order = mode ? KV_LAYOUT[mode] : arr.map(function (_, i) { return i; });
  var h = '<div class="kvs' + (mode ? ' ' + mode : '') + '">';
  order.forEach(function (ix) {
    if (ix < 0 || ix >= arr.length) { h += '<div class="kv kv-empty">&nbsp;</div>'; return; }
    var tv = (trends && trends[ix]) ? '<span class="tv ' + tvCls(trends[ix]) + '">' + trends[ix] + '</span>' : '';
    var vc = valCls(arr[ix]);
    var attrs = '';
    if (ix === 0 && yiName) attrs = ' class="kv-hit' + (vc ? ' ' + vc : '') + '" data-gua="' + esc(yiName) + '"';
    else if (ctx && arr[ix]) attrs = ' class="ah-link' + (vc ? ' ' + vc : '') + '" data-ah="kv" data-p="' + [ix, ctx.wx, ctx.mzh, ctx.rzh, ctx.yin ? 1 : 0, ctx.gwx || ""].join("|") + '"';
    else if (vc) attrs = ' class="' + vc + '"';
    h += '<div class="kv"><i>' + KV_KEYS[ix] + '</i><b' + attrs + '>' + esc(arr[ix]) + '</b>' + tv + '</div>';
  });
  return h + '</div>';
}
/* 旺衰配色（v0.1.46）：五态旺相绿／休黑／囚死红；十二长生至帝旺绿／衰至绝红／胎养黑 */
function valCls(v) {
  if (v === "旺" || v === "相" || v === "卦我比和" || v === "卦生我" || v === "我克卦") return "v-good";
  if (v === "囚" || v === "死" || v === "我生卦" || v === "卦克我") return "v-bad";
  var ci = CHANGSHENG.indexOf(v);
  if (ci > -1) return (ci <= 4) ? "v-good" : (ci <= 9) ? "v-bad" : "";
  return "";
}
function tvCls(t) { return (t === "↗") ? "tv-up" : (t === "↘") ? "tv-down" : "tv-flat"; }
/* 本变旺衰趋势线：五项值后标 ↗升／↘降／→平（长生链两段方向，v0.1.47） */
var WANG_SEQ = ["旺", "相", "休", "囚", "死"];
var GONG_SEQ = ["卦我比和", "卦生我", "我克卦", "我生卦", "卦克我"];
var CS_UP = ["胎", "养", "长生", "沐浴", "冠带", "临官", "帝旺"];
var CS_DOWN = ["衰", "病", "死", "墓", "绝"];
var TREND_IDX = [1, 2, 4, 5, 6];
function csTrend(b, i) {
  if (b === i) return "→";
  var ub = CS_UP.indexOf(b), ui = CS_UP.indexOf(i), db = CS_DOWN.indexOf(b), di = CS_DOWN.indexOf(i);
  if (ub > -1 && ui > -1) return (ui > ub) ? "↗" : "↘";
  if (db > -1 && di > -1) return (di > db) ? "↘" : "↗";
  return (ui > -1) ? "↗" : "↘";
}
function trendArrs(ben, bian) {
  if (!bian) return null;
  return TREND_IDX.reduce(function (m, i) {
    if (ben[i] == null || bian[i] == null) return m;
    if (i === 2 || i === 5) {
      var inU = function (v) { return CS_UP.indexOf(v) > -1 || CS_DOWN.indexOf(v) > -1; };
      if (!inU(ben[i]) || !inU(bian[i])) return m;
      m[i] = csTrend(ben[i], bian[i]);
      return m;
    }
    var seq = (i === 6) ? GONG_SEQ : WANG_SEQ;
    var a = seq.indexOf(ben[i]), b = seq.indexOf(bian[i]);
    if (a < 0 || b < 0) return m;
    m[i] = (a === b) ? "→" : (a < b) ? "↘" : "↗";
    return m;
  }, {});
}
/* ---------- 始终关系箭头：始＝左（本）终＝右（变），线中上方标生／克／比 ---------- */
function relArrow(zt) {
  if (!zt) return "";
  var dir = (zt === "始终比和") ? "both" : (zt.charAt(0) === "始") ? "fwd" : "back";
  var v = (zt === "始终比和") ? "比" : zt.charAt(1);
  return '<span class="rl-ar ' + dir + '"><i class="la">' + v + '</i><i class="ln"></i></span>';
}

/* ---------- 爻线图：bits 自下而上（true=阳），marks 对应位动爻 ---------- */
function guaFig(bits, marks) {
  var rows = [];
  for (var i = bits.length - 1; i >= 0; i--) {
    var on = marks && marks[i];
    rows.push('<span class="gf-row' + (on ? ' on' : '') + '"><i class="gf-y ' + (bits[i] ? 'yang' : 'yin') + '"></i><em class="gf-mk">' + (on ? (bits[i] ? '○' : '×') : '') + '</em></span>');
  }
  return '<span class="gf">' + rows.join("") + '</span>';
}

/* ---------- 整卦分析（图形版）：本卦六爻图卡 → 模式 → 变卦图卡，卡下属性小字 ---------- */
function anaGuaStruct(g) {
  var a = g.info, b = g.bian ? g.bian.info : null;
  var mode = b ? WX_MODE[wxRelation(a.gongWx, b.gongWx)] : null;
  var mzh = DZ[g.cal.mdz], rzh = g.cal.riZhi;
  function gzCell(info, bits, marks, toks, trends, yiName, ctx) {
    return '<div class="gz-cell">' + guaFig(bits, marks) +
      '<div class="gz-name">' + esc(info.name) + '</div>' +
      '<div class="gz-gong">' + esc(info.gong) + '宫</div>' +
      kvList(toks, 'gz', trends, yiName, ctx) + '</div>';
  }
  var benMarks = g.yao.map(function (y) { return y.moving; });
  var benToks = structTokenArr(GUA_YI[a.name] || "—", a.gongWx, mzh, rzh, null, tuYin(a.gong));
  var bianToks = b ? structTokenArr(GUA_YI[b.name] || "—", b.gongWx, mzh, rzh, null, tuYin(b.gong)) : null;
  var gzT = trendArrs(benToks, bianToks);
  var h = '<div class="gz-g">' + gzCell(a, g.yao.map(function (y) { return y.yang; }), benMarks, benToks, gzT, a.name, { wx: a.gongWx, mzh: mzh, rzh: rzh, yin: tuYin(a.gong), gwx: null });
  if (b) {
    h += '<div class="gz-mid">' + relArrow(mode.zt) + '<span class="mode-hit" data-mode="' + esc(mode.name) + '"><b class="hl">' + esc(mode.name) + '</b></span></div>';
    h += gzCell(b, g.bian.yao.map(function (y) { return y.yang; }), benMarks, bianToks, gzT, b.name, { wx: b.gongWx, mzh: mzh, rzh: rzh, yin: tuYin(b.gong), gwx: a.gongWx });
  } else {
    h += '<div class="gz-mid"><span class="dim">六爻全静，无变卦 —— 无本↔变的模式关系。</span></div>';
  }
  h += '</div>';
  return { title: "整卦分析 · " + a.name + (b ? " → " + b.name : "（本卦）"), html: h };
}

/* ---------- 半卦分析：本 / 变 各分上、下卦（表格）---------- */
function halfUpDownText(up, low, shiUp) {
  var wu = GONG_WX[up.n], wl = GONG_WX[low.n];
  var rel = wxRelation(wu, wl);
  if (rel === "比和") return { up: "上下比和", shi: "世应比和", wo: "我事比和" };
  var upToDown = (rel === "生" || rel === "克");
  var v = (rel === "生" || rel === "被生") ? "生" : "克";
  var meFirst = (shiUp === upToDown);
  return { up: (upToDown ? "上" + v + "下" : "下" + v + "上"),
    shi: (meFirst ? "世" + v + "应" : "应" + v + "世"),
    wo: (meFirst ? "我" + v + "事" : "事" + v + "我") };
}
/* ---------- 双方强弱（v0.1.99）：我方/他方半卦五行受事局（始卦宫）五行生克 → 卦生克五态意义语＋强弱档 ---------- */
var SF_STRONG = { "卦我比和": "最强", "卦生我": "三强", "我克卦": "次强", "我生卦": "次弱", "卦克我": "最弱" };
var SF_REL = {
  "克": ["我方克对方", "我方有主决策权"],
  "被克": ["对方克我方", "他方有主决策权"],
  "被生": ["对方生我方", "他方支持我方决策"],
  "生": ["我方生对方", "我方支持他方决策"],
  "比和": ["双方比和", "双方同频共同协商"]
};
function sfStrongText(lv, isWo) {
  var m = {
    "卦生我": isWo ? "事局支持我" : "事局支持他方",
    "我生卦": isWo ? "我方支持事局" : "他方支持事局",
    "卦克我": isWo ? "事局约束我" : "事局约束他方",
    "我克卦": isWo ? "我方管控事局" : "他方管控事局",
    "卦我比和": isWo ? "我方代表事局" : "他方代表事局"
  };
  return m[lv] + "（" + SF_STRONG[lv] + "）";
}
/* ---------- 半卦分析（图形版）：上/下卦各一卡（本变三爻图＋标位＋模式＋始终词＋双列属性小字），末尾三关系行；数据取 g.half（引擎 halfLevel） ---------- */
function anaHalfStruct(g) {
  var a = g.info, b = g.bian ? g.bian.info : null;
  var H = g.half, shiUp = H.shiUp;
  var ru = shiUp ? "世" : "应", rl = shiUp ? "应" : "世";
  var mzh = DZ[g.cal.mdz], rzh = g.cal.riZhi;
  function triBits(n) { return TRI_BY_NAME[n].b.split("").map(function (c) { return c === "1"; }); }
  function hfCard(tag, p) {
    var bt = structTokenArr(TRI_YI[p.ben.n] || "—", p.ben.wx, mzh, rzh, a.gongWx, tuYin(p.ben.n));
    var wt = p.bian ? structTokenArr(TRI_YI[p.bian.n] || "—", p.bian.wx, mzh, rzh, b.gongWx, tuYin(p.bian.n)) : null;
    var T = trendArrs(bt, wt);
    var h = '<div class="hf-card"><div class="hf-head">';
    h += '<span class="hf-side">' + guaFig(triBits(p.ben.n), null) + '<span class="hf-name">' + esc(p.ben.n) +
      (tag ? '<b class="st-pos">' + esc(tag) + '</b>' : '') + '</span></span>';
    h += '<span class="hf-mid">' + (p.md ? '<span class="mode-hit" data-mode="' + esc(p.md.name) + '"><b class="hl">' + esc(p.md.name) + '</b></span>' + relArrow(p.md.zt)
      : '<span class="dim">—（无变卦）</span>') + '</span>';
    if (p.bian) h += '<span class="hf-side">' + guaFig(triBits(p.bian.n), null) + '<span class="hf-name">' + esc(p.bian.n) + '</span></span>';
    h += '</div><div class="hf-body' + (p.bian ? '' : ' single') + '">' +
      kvList(bt, 'hf', T, p.ben.n, { wx: p.ben.wx, mzh: mzh, rzh: rzh, yin: tuYin(p.ben.n), gwx: a.gongWx }) +
      (p.bian ? kvList(wt, 'hf', T, p.bian.n, { wx: p.bian.wx, mzh: mzh, rzh: rzh, yin: tuYin(p.bian.n), gwx: b.gongWx }) : '') + '</div></div>';
    return h;
  }
  var h = '<div class="hf-wrap">' + hfCard(ru, H.up) + hfCard(rl, H.low);
  var r1 = halfUpDownText({ n: H.up.ben.n }, { n: H.low.ben.n }, shiUp),
      r2 = b ? halfUpDownText({ n: H.up.bian.n }, { n: H.low.bian.n }, shiUp) : null;
  function relRow(label, ben, bian) {
    return '<div class="hf-rel"><span class="rc rc-l"><i>' + label + '</i><b>' + ben + '</b></span>' +
      '<span class="rc-mid"></span>' +
      '<span class="rc rc-r">' + (bian ? '<b>' + bian + '</b>' : '<span class="dim">—</span>') + '</span></div>';
  }
  h += '<div class="hf-rels">';
  h += relRow("上下卦", r1.up, r2 && r2.up);
  h += relRow("世应", r1.shi, r2 && r2.shi);
  h += relRow("我事", r1.wo, r2 && r2.wo);
  h += '</div>';
  h += '</div>';
  return { title: "双方态势分析", html: h };
}

/* ---------- 半卦层双方态势分析（第 23 轮：我方/对方 × 三大块，九读算法与整卦同源，端＝半卦五行） ---------- */
function anaShuangfang(g) {
  var H = g.half, mzh = DZ[g.cal.mdz], rzh = g.cal.riZhi;
  var wo = H.shiUp ? H.up : H.low, ta = H.shiUp ? H.low : H.up;
  var staticGua = !g.bian || g.bian.info.name === g.info.name; // 同卦时引擎仍建变卦镜像，但按体系口径＝静局未动
  function reads(p) {
    var ben = p.ben, bian = p.bian || p.ben;
    return {
      q0: cbQl(ben.wx, mzh), q1: cbQl(bian.wx, mzh),
      f0: cbGan12Full(ben.n, mzh), f1: cbGan12Full(bian.n, mzh),
      f0r: cbGan12Full(ben.n, rzh), f1r: cbGan12Full(bian.n, rzh),
      t0: cbTidui(ben.wx, mzh), t1: cbTidui(bian.wx, mzh),
      s0: cbTidui(ben.wx, rzh), s1: cbTidui(bian.wx, rzh),
      ms0: monthState(ben.wx, mzh, null), ms1: monthState(bian.wx, mzh, null),
      mi0: monthState(ben.wx, rzh, null), mi1: monthState(bian.wx, rzh, null),
      r0: cbRelKey(ben.wx, rzh), r1: cbRelKey(bian.wx, rzh),
      zyF: gan12Full(ZHI_CANG[rzh][0], mzh)
    };
  }
  var Rw = reads(wo), Rt = reads(ta);
  function sideHead(p, R) {
    if (staticGua) return { head: "静局未动 · 不另判启动", pro: "静局无过程 · —" };
    var hasRoot = (R.t0 >= 1 || R.s0 >= 1), qiIn = R.q0.de || (R.mi0.level === "旺" || R.mi0.level === "相");
    var qd = hasRoot && qiIn ? "顺畅启动" : hasRoot ? "勉力启动" : qiIn ? "借力启动" : "艰难启动";
    var qdDe = hasRoot && qiIn ? "顺易" : (hasRoot || qiIn) ? "偏难" : "极难";
    var head = "非静局 · " + qd + "（" + qdDe + "）";
    var rel = wxRelation(p.ben.wx, p.bian.wx), pro;
    if (rel === "比和") { pro = "同气置换 · 同气落成（难易不适用）"; }
    else {
      var isKe = rel === "克" || rel === "被克";
      var shou = (rel === "生" || rel === "克") ? "始" : "终";
      var cdShi = shou === "始" ? R.s0 : R.s1, cdShou = shou === "始" ? R.s1 : R.s0;
      var df = cdShi - cdShou;
      var cw = (isKe ? CB_KE7 : CB_SH7)[df + 3];
      pro = p.md.name + " · " + cw[0] + "（" + cw[1] + "）";
    }
    return { head: head, pro: pro };
  }
  var Hw = sideHead(wo, Rw), Ht = sideHead(ta, Rt);
  function sfRow(i, label, woTxt, taTxt) {
    return '<div class="cb-row"><i>' + i + ' ' + label + '</i><div class="sf-stack"><b><span class="sf-tag sf-wo">我方</span>' + woTxt + '</b><span><span class="sf-tag sf-ta">对方</span>' + taTxt + '</span></div></div>';
  }
  function miniRel(label, s0, s1) {
    return '<tr><td>' + label + '</td><td>' + s0 + '</td><td>' + s1 + '</td></tr>';
  }
  function mini4(label, w0, w1, t0, t1) {
    return '<tr><td>' + label + '</td><td><div class="sf-line"><span class="sf-tag sf-wo">我</span>' + w0 + '</div><div class="sf-line"><span class="sf-tag sf-ta">他</span>' + t0 + '</div></td><td><div class="sf-line"><span class="sf-tag sf-wo">我</span>' + w1 + '</div><div class="sf-line"><span class="sf-tag sf-ta">他</span>' + t1 + '</div></td></tr>';
  }
  var h = '<div class="cb-panel">';
  h += sfRow("1", "前置启动", Hw.head, Ht.head);
  h += sfRow("2", "过程难易", Hw.pro, Ht.pro);
  var A = g.info, B = g.bian ? g.bian.info : null;
  function sfEnd(p, isWo) {
    if (!B || !p.bian) return '<span class="dim">—（静局无变）</span>';
    return sfStrongText(gongState(p.bian.wx, B.gongWx).level, isWo);
  }
  h += '<table class="cb-mini sf-mini"><thead><tr><th>双方</th><th>起点</th><th>终点</th></tr></thead><tbody>';
  h += mini4("双方强弱", sfStrongText(gongState(wo.ben.wx, A.gongWx).level, true), sfEnd(wo, true), sfStrongText(gongState(ta.ben.wx, A.gongWx).level, false), sfEnd(ta, false));
  var sfr0 = SF_REL[wxRelation(wo.ben.wx, ta.ben.wx)];
  var sfrE = (B && wo.bian && ta.bian) ? SF_REL[wxRelation(wo.bian.wx, ta.bian.wx)] : null;
  h += miniRel("双方关系", sfr0[0] + " · " + sfr0[1], sfrE ? sfrE[0] + " · " + sfrE[1] : '<span class="dim">—（静局无变）</span>');
  h += '</tbody></table>';
  h += '<details class="cb-fold"><summary>资源关系 <span class="dim">（点击展开）</span></summary><table class="cb-mini sf-mini"><thead><tr><th>资源关系</th><th>起点</th><th>终点</th></tr></thead><tbody>';
  h += mini4(cbLink("趋势关系"), CB_MS_JIE[CB_MS_NAME[Rw.ms0.rel]], CB_MS_JIE[CB_MS_NAME[Rw.ms1.rel]], CB_MS_JIE[CB_MS_NAME[Rt.ms0.rel]], CB_MS_JIE[CB_MS_NAME[Rt.ms1.rel]]);
  h += mini4(cbLink("发展空间"), CB_SPACE[Rw.q0.level], CB_SPACE[Rw.q1.level], CB_SPACE[Rt.q0.level], CB_SPACE[Rt.q1.level]);
  h += mini4(cbLink("资源丰沛"), cbRsMean(Rw.f0.rank), cbRsMean(Rw.f1.rank), cbRsMean(Rt.f0.rank), cbRsMean(Rt.f1.rank));
  h += mini4(cbLink("趋势梯队"), CB_TI_NAME[Rw.t0], CB_TI_NAME[Rw.t1], CB_TI_NAME[Rt.t0], CB_TI_NAME[Rt.t1]);
  h += '</tbody></table></details>';
  h += '<details class="cb-fold"><summary>权力关系 <span class="dim">（点击展开）</span></summary><table class="cb-mini sf-mini"><thead><tr><th>权力关系</th><th>起点</th><th>终点</th></tr></thead><tbody>';
  h += mini4(cbLink("上级关系"), CB_POWER_JIE[CB_POWER_NAME[Rw.r0]], CB_POWER_JIE[CB_POWER_NAME[Rw.r1]], CB_POWER_JIE[CB_POWER_NAME[Rt.r0]], CB_POWER_JIE[CB_POWER_NAME[Rt.r1]]);
  h += mini4(cbLink("向外借力"), CB_JIE2[Rw.mi0.level], CB_JIE2[Rw.mi1.level], CB_JIE2[Rt.mi0.level], CB_JIE2[Rt.mi1.level]);
  h += mini4(cbLink("发展评级"), cbGradeMean(Rw.f0r.rank), cbGradeMean(Rw.f1r.rank), cbGradeMean(Rt.f0r.rank), cbGradeMean(Rt.f1r.rank));
  h += mini4(cbLink("支持梯队"), CB_TI_NAME[Rw.s0], CB_TI_NAME[Rw.s1], CB_TI_NAME[Rt.s0], CB_TI_NAME[Rt.s1]);
  h += mini4(cbLink("上级资源"), cbRsMean(Rw.zyF.rank), cbRsMean(Rw.zyF.rank), cbRsMean(Rt.zyF.rank), cbRsMean(Rt.zyF.rank));
  h += '</tbody></table></details>';
  h += '</div>';
  return { title: "双方态势 · 我方与对方", html: h };
}

/* ---------- 整卦层整体态势分析（参考资料 29 · v1.31 九读＝月令四读＋日令五读）----------
   月令四读：发展空间（月旺衰，monthState 档序＋空间语）、资源丰沛（月长生，cbGan12@月支「n/6 位名」）、
   趋势梯队（月通根，cbTidui@月支）、趋势关系（月五行，monthState rel 五型＋解读语）；
   日令五读：向外借力（日旺衰，monthState@日支→借力语）、支持梯队（日通根，cbTidui@日支）、
   发展评级（日长生，cbGan12@日支「n/6 位名」）、权力关系（日五行，cbRelKey→权力语）、
   上级资源（日资源，日支本气干 gan12Full@月支，与卦宫无关起终恒同）。
   十二长生肖例十干全表阳顺阴逆（甲亥丙寅戊午庚巳壬申顺；乙午丁酉己巳辛子癸卯逆），宫线按代表干（土不借宫），
   废「整卦层无阴阳同支等力」；六档表帝旺为峰（绝1胎2养2长生3沐浴3死3冠带4病4临官5衰5帝旺6墓2）。
   评级档（十二长生）只作制度定级，不进裁定比较；②成败裁定（参考资料 31 · 前置与成败难易）：施受方向由五行关系定
   （始生终·始克终施动＝始，终生始·终克始施动＝终，比和无），三机制生转化读梯队差（难度来源施动端供给缺口）／
   克约束读梯队差（难度来源受动端对抗阻力）／比和置换难易不适用；梯队差＝施动端支持梯队－受动端支持梯队，
   七档克式生式双语系（＋3压迫／宽供·＋2压力／足供·＋1顺畅／稳供·0持平／平供·－1勉力／紧供·－2艰难／乏供·－3遇抗落成／微供顺推，全部属成）；
   末位五子型降格结构说明（起点无力·倒逼无力·反哺无源·虚成无托·遇抗被损）只作判词注解不判成败；
   判词全集成十五不成零非成非败一（废止虚动不成·受阻难成·反抗难成·不能启动）；启动判定改环节只出难易四档
   （顺畅顺易·勉力偏难·借力偏难·艰难极难）流程不截断；静局时启动判定列不输出（改「—（静局不另判启动）」——静局结构上无位移要求，v0.1.89 裁决定案）。
   前置启动（1 两道闸门，不改四项读数取法）：静局判定——始卦＝终卦（六爻全静）为静局未动（成败不成立·难易不适用·
   结果恒与初始相当，按终态发展空间档注维持高位／低位），同气换形（宫五行同）照常进入；启动判定（取起点端）——
   内源根＝趋势梯队·支持梯队任一≥第三梯队为有根，外源气＝月旺衰·日旺衰旺相为输入，有根有气＝顺畅启动、
   有根无气或无根有气＝勉力启动、无根无气＝不能启动；资源丰沛·发展评级不进门槛只作强度修饰；模式落地仍只取支持梯队。
   不看空破冲合（属爻级/地支层）。 */
var CB_QL = { 旺:5, 相:4, 休:3, 囚:2, 死:1 };
var CB_SPACE = { 旺:"空间最大，上限最高，可做到满量", 相:"空间较大，上限较高，还有扩张余地", 休:"空间一般，上限下降，能守成但难扩张", 囚:"空间受限，上限较低，只适合小范围推进", 死:"空间最小，上限最低，只够基本维持" };
var CB_RANK12 = { 绝:1, 胎:2, 养:2, 长生:3, 沐浴:3, 冠带:4, 临官:5, 帝旺:6, 衰:5, 病:4, 死:3, 墓:2 };
var CB_CS_SEQ = ["长生","沐浴","冠带","临官","帝旺","衰","病","死","墓","绝","胎","养"];
var CB_CS_POS = { 长生:0, 沐浴:1, 冠带:2, 临官:3, 帝旺:4, 衰:5, 病:6, 死:7, 墓:8, 绝:9, 胎:10, 养:11 };
var CB_CS_UP = { 长生:1, 沐浴:1, 冠带:1, 临官:1, 帝旺:0, 衰:0, 病:0, 死:0, 墓:0, 胎:1, 养:1, 绝:0 };
var CB_REP = { 乾:"庚", 兑:"辛", 震:"甲", 巽:"乙", 坎:"壬", 离:"丁", 艮:"戊", 坤:"己" };
var CB_REP_CS = { 甲:["亥",1], 丙:["寅",1], 戊:["午",1], 庚:["巳",1], 壬:["申",1], 乙:["午",-1], 丁:["酉",-1], 己:["巳",-1], 辛:["子",-1], 癸:["卯",-1] };
var CB_TI_NAME = { 3:"第一梯队", 2:"第二梯队", 1:"第三梯队", 0:"末位梯队" };
var CB_JIE2 = { 旺:"最易向外借力", 相:"较易向外借力", 休:"可以向外借力", 囚:"较难向外借力", 死:"最难向外借力" };
var CB_MS_NAME = { 比和月令:"同月令", 月令克我:"月令克", 月令生我:"月令生", 我生月令:"生月令", 我克月令:"克月令" };
var CB_MS_JIE = { 同月令:"与趋势同方向", 月令克:"是趋势的资源", 月令生:"受趋势的支持", 生月令:"是趋势的基础", 克月令:"驾驭或逆趋势" };
var CB_POWER_NAME = { bi:"同日令", kewo:"日令克", shengwo:"日令生", wosheng:"生日令", woke:"克日令" };
var CB_POWER_JIE = { 同日令:"与上级意志一致", 日令克:"受直管上级约束", 日令生:"得直管上级支持", 生日令:"为直管上级考虑", 克日令:"驾驭或逆反上级" };
var CB_TI_ROOT = { 3:"本气根", 2:"中气根", 1:"余气根", 0:"无根" };
function cbRsMean(r) { return r >= 5 ? "资源最丰沛" : r >= 3 ? "资源一般" : "资源较匮乏"; }
function cbGradeMean(r) { return r >= 5 ? "高级发展" : r >= 3 ? "中级发展" : "初级发展"; }
/* ---------- ②表 9 项标签释义（点击弹窗）：静态 CB_EXPLAIN ＋ 动态 CB_DYN（本卦实算链） ---------- */
var CB_EXPLAIN = {
  "成败裁定": { what: "成败与难易的裁定（参考资料 31）。成败只有两种输出：静局未动则成败不成立；凡有转移结构则判成——本体系不输出不成档，环节因难不等于事情不成。成败只是概率，不是绝对，此限定适用于成败、好坏、难易三维全部判词。落成只表示模式执行成立，不表示结果优于初始；成败是过程判断，只裁模式落地：不借终态成色（好坏）、不借难易、不借意愿——三者互不改写。推进难易只由两端的「支持梯队（日令通根）」之差裁定——月令与两端的关系只说明发展空间、资源丰沛、趋势梯队与趋势关系，不参与裁定；向外借力、发展评级、权力关系和上级资源也不参加。启动难易与推进难易双轨并列：启动问的是起步费不费力，推进问的是主体过程费不费力，各自输出，不取较难者、不折算总档、互不改写。",
    logic: "两层方向分开：过程方向恒为始→终，不可逆，不参与裁定；施受方向由两端五行关系决定施动端（始生终·始克终施动＝始，终生始·终克始施动＝终，比和无），因此不得用「主动方」指称施动端。终为施动端时的读法：梯队读的是本端宫五行在日支气构成中的位序，属结构性读数，与时间先后无关——「终态支持梯队处末位」＝该结果所属之气在当下支持体系（日支）中没有位置；这与「结果尚未发生」不矛盾。三种推进机制：生＝转化（施动端把自身量转给受动端，量级发生转移；读梯队差，难度来源为施动端的供给缺口；受生不改变受动端自身的梯队）；克＝约束（量级不转移，受动端被限定边界；读梯队差，难度来源为受动端的对抗阻力）；比和＝置换（同一气内部重组，量级不变只换形；两端梯队必然相等，梯队差恒为零，难易不适用，只输出同气落成）。克是推进方式：不论所求为建成、受控还是终止，克只表示以管理约束手段实现，正差也不折算为「成而失用」。施动端处末位不再截断模式落地：末位仍有主体，只是可调用的日令力量最弱；开局极差而仍能做成是常见情形。",
    std: "梯队差＝施动端支持梯队－受动端支持梯队，共七档，克式与生式共用一把尺、判词语系不同：＋3 压迫落成／宽供顺推（顺易）·＋2 压力落成／足供顺推（较易）·＋1 顺畅落成／稳供顺推（略易）·0 持平落成／平供顺推（常规，含 0-0 两端都弱的势均——只读相对差不读绝对量）·－1 勉力落成／紧供顺推（偏难）·－2 艰难落成／乏供顺推（艰难）·－3 遇抗落成（附施动端受损）／微供顺推（极难）。七档全部属成：难到极难也是落成。比和判同气落成，难易不适用。施动端处末位时按五种结构说明加注难度来源，不改变成败与难易档：起点无力（始施动且始态末位）·倒逼无力（终克始且终态末位）·反哺无源（终生始且终态末位）·虚成无托（比和共同梯队末位）·遇抗被损（克式施动端末位而受动端第一梯队 0-3，对抗极强施动端受损）。判词全集：成十五（克式七＋生式七＋比和一），不成零，非成非败一（成败不成立〔静局〕）。已废止判词：虚动不成、受阻难成、反抗难成、不能启动——前三者的事实分别改归结构说明、－2 艰难落成、－3 遇抗落成，「不能启动」改为启动难易档的艰难启动（极难）。裁定口径六条：①只衡量难度不衡量投入，不设零阻档，＋3 也只是顺易；②难度来源分式（克式受动端对抗阻力、生式施动端供给缺口）；③只读相对差不读绝对量；④不叠加不二次修正，梯队差只输出难易一次；⑤成败只是概率不是绝对；⑥启动难易与推进难易并列不合成。术语限定：压迫落成只指当前查询域失去有效抵抗，不指现实死亡毁灭；遇抗被损不指克制方向倒转，只指施动端施克失败并因受动端强力抵抗而受损；落成不指结果成色优于初始。为何判难是多数：穷举 60 种地支×五行组合有根共 28 种不足一半，两端都立在前列更是少数——梯队差天然偏向零与负值，常规及偏难以下占多数，顺易是少数；启动一轨同理偏难极难居多。结构使然：事情本就大多要费力，但费力不等于不成。" },
  "前置启动": { what: "四项判断之前先过两道闸门：静局判定与启动判定。两道闸门只回答「这件事有没有动、动不动起来」，不改写四项判断中任何读数的取法与档位；启动判定只出难易档不判成败——凡有转移结构即判成，流程不截断（v0.1.91）。",
    logic: "静局＝始卦与终卦同为一卦，无转移结构，内部未动（两端宫五行同为一行，梯队差恒为零，无判断意义，故单列不并入比和）。静局未动与「艰难启动」性质不同：前者未发生位移成败不成立，后者有位移结构判成只是起动极难。启动＝本端在当前查询域有没有可动用的立足点：内源（根）看两项梯队——趋势梯队（月通根）·支持梯队（日通根），任一不低于第三梯队＝有根，两项同为末位＝无根；外源（气）看两项旺衰——发展空间（月旺衰）·向外借力（日旺衰），旺相为输入、休为输出、囚为耗损、死为被夺。启动是整个过程的第一个环节，只输出启动难易档。",
    std: "静局：始卦＝终卦（六爻全静）＝静局未动——输出三件：成败不成立（无变动可成）、难易不适用、结果恒与初始相当并按终态发展空间档注维持高位（旺相）／低位（休囚死）；同气换形（宫五行同）非静局，照常进入启动判定。启动四档（都是启动，只差费力程度）：有根＋月或日旺相＝顺畅启动（顺易，有立足点环境又有供给）·有根＋月日皆休囚死＝勉力启动（偏难，有立足点但环境不供给）·无根＋月或日旺相＝借力启动（偏难，全靠外部带动不能自持）·无根＋月日皆休囚死＝艰难启动（极难，起动极其吃力）。原「不能启动」改为艰难启动（极难），原两类勉力启动拆为勉力（有根无气）与借力（无根有气）——废止「不能启动即判不成」与「启动关即成败分界」。休不能带动无根局：五档中只有旺相是能量输入，休是本端生支的向外泄出，无根无储备又只出不进无从起动，休只能支撑有根局。资源丰沛·发展评级不进门槛，只作启动后的强度修饰。启动难易与推进难易双轨并列不合成，报告分两行写。" },
  "过程难易": { what: "过程难易回答「从起点到结果这段路走成什么样、走起来费不费力」，路由两卦五行关系一次定五型机制：始生终＝主动顺推（结果导向）·始克终＝全程管控（初始导向）·终生始＝反哺受限（初始导向）·终克始＝结果倒逼（结果导向）·比和＝同气维持（无导向）。导向读的是过程中谁照顾谁：初始导向＝结果要回头照顾原有基础、承诺和利益；结果导向＝为了形成结果，起点主动投入或打破原有基础和限制。难易档由成败裁定的支持梯队七档给出，本节只显示不重算。",
    logic: "过程方向恒为始→终，不可逆；施受方向由两端五行关系决定施动端（始生终·始克终施动＝始，终生始·终克始施动＝终，比和无施受）。初始导向出现在终态回头照顾始态的结构里（终生始反哺、始克终管控）：结果不能只顾自己长，要回头照顾原有基础、承诺和利益，过程感受是受限、需要照顾旧账；结果导向出现在始态向终态投入的结构里（始生终主动投入、终克始倒逼）：起点主动消耗或被打破，过程感受是顺但有消耗、或被动由结果定调。五型机制＋梯队七档合成①行输出，机制名与判词都随五行关系切换。",
    std: "五型机制表：始生终＝主动顺推·结果导向·起点主动投入，让结果形成·施动＝始·感受「顺，但起点有消耗」；始克终＝全程管控·初始导向·起点先定框架和边界，全程约束结果·施动＝始·感受「紧，后段持续受约束」；终生始＝反哺受限·初始导向·结果要回头照顾原有基础、承诺和利益·施动＝终·感受「受限，需要照顾旧账」；终克始＝结果倒逼·结果导向·为了形成结果，起点必须打破原有基础和限制·施动＝终·感受「被动，由结果反向定调」；比和＝同气维持·无导向·前后同类，没有施动方与受动方·感受「平，没有五行量级转折」。难易档沿用成败裁定七档（支持梯队差，克式与生式共用一把尺、判词语系不同），本节不另立档位；静局无过程，不入本节。" },
  "发展空间": { what: "宫五行在月令旺衰五档的空间读数：旺5（空间最大，上限最高，可做到满量）／相4（空间较大，上限较高，还有扩张余地）／休3（空间一般，上限下降，能守成但难扩张）／囚2（空间受限，上限较低，只适合小范围推进）／死1（空间最小，上限最低，只够基本维持）。月令第一读，回答「这个月我的发展空间有多大」。",
    logic: "月支五行对宫五行的生克唯一定档，旺衰与空间同源一次出两读：得令生扶＝旺相（空间大），向外付出＝休，逆势顶撞＝囚，被令压制＝死。档序用于起点终点两项的幅度比较；有力＝旺相，没力＝休囚死。",
    std: "monthState 判定序：宫五行＝月支五行（或临月建）→旺5；月支生宫→相4；宫生月支→休3；宫克月支→囚2；月支克宫→死1。有力＝旺或相。" },
  "资源丰沛": { what: "卦宫代表天干在月支上的十二长生档位，六档标尺（帝旺为峰），显示「n/6 位名」——一共 6 档，目前在第 n 档。月令第二读，回答「月令给我的资源有多厚」。",
    logic: "八宫各有一代表天干（乾庚·兑辛·震甲·巽乙·坎壬·离丁·艮戊·坤己）。干在十二支上起十二长生：阳干顺行、阴干逆行，从长生位数到月支得位名，位名折 1–6 档。宫不直接查表，经由代表干取得（按宫起例）。",
    std: "起例：庚长生在巳顺行；辛在子逆行；甲在亥顺；乙在午逆；壬在申顺；丁在酉逆；戊在午顺；己在巳逆（土不借宫）。六档表（帝旺为峰）：帝旺6；临官5、衰5；冠带4、病4；长生3、沐浴3、死3；胎2、养2、墓2；绝1。上升段与下降段同档不同位（如2档上升＝胎养、下降＝墓）。意义：5–6 档＝资源最丰沛；3–4 档＝资源一般；1–2 档＝资源较匮乏。" },
  "趋势梯队": { what: "宫五行在月支的通根梯队：本气根＝第一梯队(3)、中气根＝第二梯队(2)、余气根＝第三梯队(1)、无根＝末位梯队(0)。月令第三读，回答「我在月令地盘上站哪个势力位」。",
    logic: "月支藏干是这块地盘上的势力分布，我的五行通根越靠前（本气根），月令里「自己人」越厚。梯队表由藏干表程序化派生（本气3／中气2／余气1），藏干按现行传统通用序。",
    std: "查 ZHI_TI[月支][宫五行]（＝藏干位序）。例：酉藏辛（金＝本气根·第一梯队）；午藏丁己（火本气根、土中气根）；丑藏己癸辛。不通根（支中无此五行）＝无根·末位梯队 0。" },
  "趋势关系": { what: "宫五行与月令五行的关系五型及解读：同月令＝与趋势同方向；月令克＝是趋势的资源；月令生＝受趋势的支持；生月令＝是趋势的基础；克月令＝驾驭或逆趋势。月令第四读，是月令一路读数的源头事实。",
    logic: "与「发展空间」同一判定的关系层读数——空间给档位与大小语，趋势关系给关系名与解读语。看它一眼就知道空间档是怎么来的：同而旺、生我而相、我生而休、我克而囚、克我而死。",
    std: "判定序：宫五行＝月支五行→同月令（旺5）；月支生宫→月令生（相4，受趋势的支持）；宫生月支→生月令（休3，是趋势的基础）；宫克月支→克月令（囚2，驾驭或逆趋势）；月支克宫→月令克（死1，是趋势的资源）。" },
  "向外借力": { what: "宫五行在日令旺衰五档的借力读数：旺＝最易向外借力；相＝较易向外借力；休＝可以向外借力；囚＝较难向外借力；死＝最难向外借力。日令第一读，回答「今天的地盘上，我要调动外部资源有多容易」。",
    logic: "借力看宫五行在日支的旺衰（与「发展空间」同一套 monthState 判定序，支换日支）：得日令生扶＝旺相（地盘助力厚，好借），向外付出＝休（可借但要付），逆势顶撞＝囚（通道窄），被令压制＝死（最难借）。",
    std: "monthState（日支版）判定序：宫五行＝日支五行（或临日建）→旺（最易向外借力）；日支生宫→相（较易向外借力）；宫生日支→休（可以向外借力）；宫克日支→囚（较难向外借力）；日支克宫→死（最难向外借力）。" },
  "支持梯队": { what: "宫五行在日支的通根梯队：本气根＝第一梯队(3)、中气根＝第二梯队(2)、余气根＝第三梯队(1)、无根＝末位梯队(0)。日令第二读，回答「今天的地盘上我站在哪个势力位」。",
    logic: "同「趋势梯队」的逻辑，支换日支：今天我的五行通根哪个势力位。它在推动判断里作两端比较尺。",
    std: "查 ZHI_TI[日支][宫五行]，本气3／中气2／余气1／不通根（无根）0。" },
  "发展评级": { what: "卦宫代表天干在日支上的十二长生档位（六档，帝旺为峰），显示「n/6 位名」——日令第三读，回答「今天我站在生命周期的哪一档」。",
    logic: "与「资源丰沛」同一套按宫起例＋六档表，支换日支。评级只作制度定级，不进推动比较——推动比的是支持梯队档（见「支持梯队」）。",
    std: "同「资源丰沛」：代表干（乾庚兑辛震甲巽乙坎壬离丁艮戊坤己）按阳顺阴逆从长生位数至日支，六档表折 1–6 档，附位名与升降段。意义：1–2 档＝初级发展；3–4 档＝中级发展；5–6 档＝高级发展。" },
  "上级关系": { what: "宫五行与日令五行的关系五型及权力解读：同日令＝与上级意志一致；日令克＝受直管上级约束；日令生＝得直管上级支持；生日令＝为直管上级考虑；克日令＝驾驭或逆反上级。日令第四读。",
    logic: "与「向外借力」同看日令，但读的是权力语言而非难易语言：日令如直管上级，同我＝意志一致，克我＝受约束，生我＝被支持，我生＝在为上级付出，我克＝反向驾驭或逆反。",
    std: "判定序：宫五行＝日支五行→同日令；日支生宫→日令生（得直管上级支持）；宫生日支→生日令（为直管上级考虑）；宫克日支→克日令（驾驭或逆反上级）；日支克宫→日令克（受直管上级约束）。" },
  "上级资源": { what: "日令本气十干在月令上的十二长生档位（六档，显示「n/6 位名」）——直管上级手中的资源在这个月环境里的厚薄。日令第五读。",
    logic: "取日支本气藏干对应的天干（子癸·丑己·寅甲·卯乙·辰戊·巳丙·午丁·未己·申庚·酉辛·戌戊·亥壬），查它在月支的十二长生：档高＝上级资源在月令环境里扎根厚、给得出支持；档低＝上级自顾不暇、可给的支持薄。与卦宫无关，起点终点两列恒同值。",
    std: "十干长生起例（阳顺阴逆，土分阴阳不借宫）：甲长生亥顺、丙寅顺、戊午顺、庚巳顺、壬申顺；乙午逆、丁酉逆、己巳逆、辛子逆、癸卯逆。六档表同「资源丰沛」。意义：5–6 档＝资源最丰沛；3–4 档＝资源一般；1–2 档＝资源较匮乏。" },
};
function cbSpaceLine(w, z) { var r = monthState(w, z, null);
  return "宫五行「" + w + "」在月支「" + z + "」→ " + r.level + " " + CB_QL[r.level] + "：" + CB_SPACE[r.level] + "（" + ((r.level === "旺" || r.level === "相") ? "有力" : "没力") + "）"; }
function cbGan12Line(gong, z) { var f = cbGan12Full(gong, z), rep = CB_REP[gong], s = CB_REP_CS[rep];
  return "宫「" + gong + "」代表干「" + rep + "」（" + (s[1] > 0 ? "阳干顺行" : "阴干逆行") + "，长生在「" + s[0] + "」）数至「" + z + "」得「" + f.name + "」→ " + f.rank + "/6 档（" + (f.up ? "上升段" : "下降段") + "，帝旺为峰）"; }
function cbTiLine(w, z) { var t = cbTidui(w, z);
  return "「" + z + "」藏干(" + ZHI_CANG[z].map(function (g) { return g + "·" + GAN_WX[g]; }).join("／") + ")，「" + w + "」" + (t === 0 ? "不通根（无根）" : "通" + (t === 3 ? "本气" : t === 2 ? "中气" : "余气") + "根") + " → " + CB_TI_NAME[t] + "(" + t + ")"; }
function cbMsRelLine(w, z) { var r = monthState(w, z, null), nm = CB_MS_NAME[r.rel];
  return "宫五行「" + w + "」vs 月支五行「" + ZHI_WX[z] + "」→ " + nm + "：" + CB_MS_JIE[nm] + "（" + r.level + " " + CB_QL[r.level] + "）"; }
function cbJie2Line(w, z) { var r = monthState(w, z, null);
  return "宫五行「" + w + "」在日支「" + z + "」旺衰「" + r.level + "」→ " + CB_JIE2[r.level]; }
function cbPowLine(w, z) { var k = cbRelKey(w, z), nm = CB_POWER_NAME[k];
  return "宫五行「" + w + "」vs 日支五行「" + ZHI_WX[z] + "」→ " + nm + "：" + CB_POWER_JIE[nm]; }
function gan12Full(gan, zhi) { var s = CB_REP_CS[gan];
  var nm = CB_CS_SEQ[((DZ.indexOf(zhi) - DZ.indexOf(s[0])) * s[1] + 120) % 12];
  return { name: nm, rank: CB_RANK12[nm], pos: CB_CS_POS[nm], up: CB_CS_UP[nm] }; }
function cbGan12Full(gong, zhi) { return gan12Full(CB_REP[gong], zhi); }
function cbZyLine(rzh, mzh) { var gan = ZHI_CANG[rzh][0], s = CB_REP_CS[gan], f = gan12Full(gan, mzh);
  return "日支「" + rzh + "」本气干「" + gan + "」（" + (s[1] > 0 ? "阳干顺行" : "阴干逆行") + "，长生在「" + s[0] + "」）数至月支「" + mzh + "」得「" + f.name + "」→ " + f.rank + "/6 档（上级资源与卦宫无关，起终恒同）"; }
var CB_DYN = {
  "成败裁定": function (C) {
    if (C.sameGua) return { a: "静局未动（1前置启动）：同卦不变已在静局闸截走，不入本篇——成败不成立", b: "无转移结构，内部未动；两卦不同而宫五行同（同气换形）才入比和裁定" };
    if (C.rel === "比和") return { a: "置换机制：两端共同梯队「" + CB_TI_NAME[C.cdShi] + "」——形态置换完成，量级恒与初始相当" + (C.cdShi === 0 ? "；虚成无托：共同梯队处末位，低基底推进" : ""), b: "比和＝置换：两端同五行、同一日支下支持梯队必然相等，梯队差恒为零，难易不适用" };
    if (!C.shou || C.shou === "无") return { a: "—", b: "—" };
    var df = C.cdShi - C.cdShou, isKe = C.rel === "克" || C.rel === "被克";
    var cw = (isKe ? CB_KE7 : CB_SH7)[df + 3];
    var nm = { "生": "始生终", "克": "始克终", "被生": "终生始", "被克": "终克始" }[C.rel];
    var note = C.cdShi === 0 ? "；" + (isKe && C.cdShou === 3 ? "遇抗被损：对抗极强，施动端在推进中受损" : (C.shou === "始" ? "起点无力" : isKe ? "倒逼无力" : "反哺无源") + "：施动端处末位，可调用日令力量最弱") : "";
    return { a: (isKe ? "克式" : "生式") + "（" + nm + "）：施动端（" + C.shou + "态）梯队「" + CB_TI_NAME[C.cdShi] + "」——判「" + cw[0] + "」（推进难易" + cw[1] + "）", b: "梯队差 " + (df > 0 ? "+" + df : df) + "（" + C.cdShi + "-" + C.cdShou + "）：难度来源为" + (isKe ? "受动端（" + (C.shou === "始" ? "终" : "始") + "态）的对抗阻力" : "施动端（" + C.shou + "态）的供给缺口") + note };
  },
  "前置启动": function (C) {
    var st = C.sameGua ? "始卦＝终卦（六爻全静，同卦不变）——无转移结构，内部未动" : (C.rel === "比和" ? "两卦不同，宫五行同为「" + C.wa + "」——同气换形，量级没变形态换了，有转移结构" : "两卦不同——有转移结构，照常进入启动判定");
    var rootTxt = "内源（根）：" + CB_TI_NAME[C.tA] + "（月通根）· " + CB_TI_NAME[C.sA] + "（日通根）→ " + (C.hasRoot ? "有根（任一不低于第三梯队）" : "无根（两项同为末位）");
    var gasTxt = "外源（气）：月「" + C.qA.level + "」" + CB_QGAS[C.qA.level] + " · 日「" + C.msAi.level + "」" + CB_QGAS[C.msAi.level] + " → " + (C.qiIn ? "有输入（月或日旺相）" : "无输入（月日皆休囚死——五档中只有旺相是能量输入，休是本端生支的向外泄出，不能带动无根局）");
    var why = C.qd === "顺畅启动" ? "有立足点，环境又有供给" : C.qd === "勉力启动" ? "有立足点，但环境不供给" : C.qd === "借力启动" ? "全靠外部带动，不能自持" : "无根无气，起动极其吃力——环节因难不等于事情不成";
    return { a: st, b: rootTxt + "；" + gasTxt + "；判定：" + why };
  },
  "过程难易": function (C) {
    var rm = C.rm, shouTxt = rm.shou === "无" ? "" : "；施动方：" + rm.shou + "卦 → 受动方：" + (rm.shou === "始" ? "终" : "始") + "卦";
    var dfTxt = "难易不适用";
    if (!C.sameGua && C.rel !== "比和") {
      var df = C.cdShi - C.cdShou, isKe = C.rel === "克" || C.rel === "被克";
      dfTxt = "梯队差 " + (df > 0 ? "+" + df : df) + "（" + C.cdShi + "-" + C.cdShou + "）：难度来源为" + (isKe ? "受动端（" + (rm.shou === "始" ? "终" : "始") + "态）的对抗阻力" : "施动端（" + rm.shou + "态）的供给缺口");
    }
    return { a: rm.dao + " · " + rm.way + shouTxt, b: "过程感受：" + rm.feel + "；" + dfTxt };
  },
  "发展空间": function (C) { return { a: cbSpaceLine(C.wa, C.mzh), b: cbSpaceLine(C.wb, C.mzh) }; },
  "资源丰沛": function (C) { return { a: cbGan12Line(C.ga, C.mzh), b: cbGan12Line(C.gb, C.mzh) }; },
  "趋势梯队": function (C) { return { a: cbTiLine(C.wa, C.mzh), b: cbTiLine(C.wb, C.mzh) }; },
  "趋势关系": function (C) { return { a: cbMsRelLine(C.wa, C.mzh), b: cbMsRelLine(C.wb, C.mzh) }; },
  "向外借力": function (C) { return { a: cbJie2Line(C.wa, C.rzh), b: cbJie2Line(C.wb, C.rzh) }; },
  "支持梯队": function (C) { return { a: cbTiLine(C.wa, C.rzh), b: cbTiLine(C.wb, C.rzh) }; },
  "发展评级": function (C) { return { a: cbGan12Line(C.ga, C.rzh), b: cbGan12Line(C.gb, C.rzh) }; },
  "上级关系": function (C) { return { a: cbPowLine(C.wa, C.rzh), b: cbPowLine(C.wb, C.rzh) }; },
  "上级资源": function (C) { return { a: cbZyLine(C.rzh, C.mzh), b: cbZyLine(C.rzh, C.mzh) }; }
};
var CB_DYN_HTML = {};
var CB_VAL = {
  "成败裁定": function (C) {
    if (C.sameGua) return { a: "成败不成立", b: "静局未动 · 同卦不变不入本篇" };
    if (C.rel === "比和") return { a: "同气落成" + (C.cdShi === 0 ? " · 虚成无托" : ""), b: "共同梯队「" + CB_TI_NAME[C.cdShi] + "」· 难易不适用" };
    if (!C.shou || C.shou === "无") return { a: "—", b: "—" };
    var df = C.cdShi - C.cdShou, isKe = C.rel === "克" || C.rel === "被克";
    var cw = (isKe ? CB_KE7 : CB_SH7)[df + 3];
    return { a: cw[0] + "（" + cw[1] + "）", b: "梯队差 " + (df > 0 ? "+" + df : df) + "（" + C.cdShi + "-" + C.cdShou + "）· " + (isKe ? "克式" : "生式") + (C.cdShi === 0 ? " · 末位注解" : "") };
  },
  "前置启动": function (C) { return { a: C.sameGua ? "静局未动" : (C.rel === "比和" ? "非静局 · 同气换形" : "非静局"), b: C.sameGua ? "—（静局不另判启动）" : C.qd + "（" + C.qdDe + "）" }; },
  "过程难易": function (C) { var rm = C.rm;
    return { a: rm.mode + "（" + rm.name + "）", b: C.sameGua ? "成败不成立" : (C.rel === "比和" ? "同气落成" : (C.cdDe ? C.cdName + "（" + C.cdDe + "）" : C.cdName)) }; },
  "发展空间": function (C) { return { a: CB_SPACE[C.qA.level] + "（" + C.qA.level + " " + C.qA.seq + "）", b: CB_SPACE[C.qB.level] + "（" + C.qB.level + " " + C.qB.seq + "）" }; },
  "资源丰沛": function (C) { return { a: cbRsMean(C.fA.rank) + "（" + C.fA.rank + "/6 " + C.fA.name + "）", b: cbRsMean(C.fB.rank) + "（" + C.fB.rank + "/6 " + C.fB.name + "）" }; },
  "趋势梯队": function (C) { return { a: CB_TI_NAME[C.tA] + "（" + CB_TI_ROOT[C.tA] + "）", b: CB_TI_NAME[C.tB] + "（" + CB_TI_ROOT[C.tB] + "）" }; },
  "趋势关系": function (C) { var na = CB_MS_NAME[C.msA.rel], nb = CB_MS_NAME[C.msB.rel];
    return { a: CB_MS_JIE[na] + "（" + na + "）", b: CB_MS_JIE[nb] + "（" + nb + "）" }; },
  "向外借力": function (C) { return { a: CB_JIE2[C.msAi.level] + "（" + C.msAi.level + "）", b: CB_JIE2[C.msBi.level] + "（" + C.msBi.level + "）" }; },
  "支持梯队": function (C) { return { a: CB_TI_NAME[C.sA] + "（" + CB_TI_ROOT[C.sA] + "）", b: CB_TI_NAME[C.sB] + "（" + CB_TI_ROOT[C.sB] + "）" }; },
  "发展评级": function (C) { return { a: cbGradeMean(C.fAr.rank) + "（" + C.fAr.rank + "/6 " + C.fAr.name + "）", b: cbGradeMean(C.fBr.rank) + "（" + C.fBr.rank + "/6 " + C.fBr.name + "）" }; },
  "上级关系": function (C) { var na = CB_POWER_NAME[C.rA], nb = CB_POWER_NAME[C.rB];
    return { a: CB_POWER_JIE[na] + "（" + na + "）", b: CB_POWER_JIE[nb] + "（" + nb + "）" }; },
  "上级资源": function (C) { var s = cbRsMean(C.zyF.rank) + "（" + C.zyF.rank + "/6 " + C.zyF.name + "）"; return { a: s, b: s }; }
};
var CB_KE7 = [["遇抗落成","极难"],["艰难落成","艰难"],["勉力落成","偏难"],["持平落成","常规"],["顺畅落成","略易"],["压力落成","较易"],["压迫落成","顺易"]];
var CB_SH7 = [["微供顺推","极难"],["乏供顺推","艰难"],["紧供顺推","偏难"],["平供顺推","常规"],["稳供顺推","略易"],["足供顺推","较易"],["宽供顺推","顺易"]];
var CB_QGAS = { "旺": "输入（同五行自给）", "相": "输入（支生本端）", "休": "输出（本端生支）", "囚": "耗损（我克彼方）", "死": "被夺（彼方克我）" };
var CB_THS = { "前置启动": ["静局判定", "启动判定"], "过程难易": ["导向与施受", "过程感受 · 成败裁定"], "成败裁定": ["机制与判词", "梯队差 · 难易档"] };
var CB_SRC = { "成败裁定":"支持梯队", "前置启动":"静局与启动", "过程难易":"导向与施受", "发展空间":"月旺衰", "资源丰沛":"月长生", "趋势梯队":"月通根", "趋势关系":"月生克", "向外借力":"日旺衰", "支持梯队":"日通根", "发展评级":"日长生", "上级关系":"日生克", "上级资源":"日资源" };
function cbLink(k) { return '<span class="cb-link" data-k="' + k + '">' + k + '<span class="cb-src">（' + CB_SRC[k] + '）</span></span>'; }
function cbDynFill(C) { for (var k in CB_DYN) { var d = CB_DYN[k](C), v = CB_VAL[k] ? CB_VAL[k](C) : null;
  var ths = CB_THS[k] || ["起点", "终点"];
  CB_DYN_HTML[k] = '<table class="cb-dyn"><tbody>' +
    '<tr><th>' + ths[0] + '</th><td>' + (v ? '<b>' + v.a + '</b><br><span class="dim">' + d.a + '</span>' : d.a) + '</td></tr>' +
    '<tr><th>' + ths[1] + '</th><td>' + (v ? '<b>' + v.b + '</b><br><span class="dim">' + d.b + '</span>' : d.b) + '</td></tr>' +
    '</tbody></table>'; } }
function cbQl(wx, mzh) { var lv = monthState(wx, mzh, null).level; return { level: lv, seq: CB_QL[lv], de: (lv === "旺" || lv === "相") }; }
function cbRelKey(wx, rzh) { var rw = ZHI_WX[rzh];
  if (rw === wx) return "bi"; if (WX_SHENG[rw] === wx) return "shengwo"; if (WX_KE[rw] === wx) return "kewo";
  if (WX_SHENG[wx] === rw) return "wosheng"; return "woke"; }
function cbGan12(gong, zhi) { return cbGan12Full(gong, zhi).rank; }
function cbTidui(wx, zhi) { var o = ZHI_TI[zhi]; return (o && o[wx]) || 0; }
function anaChengbai(g) {
  var b = g.bian ? g.bian.info : null;
  var mzh = DZ[g.cal.mdz], rzh = g.cal.riZhi, rg = g.cal.riGan;
  if (!b) { var a0 = g.info, q0 = cbQl(a0.gongWx, mzh);
    CB_DYN_HTML["前置启动"] = '<table class="cb-dyn"><tbody><tr><th>静局判定</th><td><b>静局未动</b><br><span class="dim">始卦＝终卦（六爻全静）——无转移结构，内部未动</span></td></tr><tr><th>启动判定</th><td><b>—（静局不另判启动）</b><br><span class="dim">静局结构上无位移要求，启动判定不适用</span></td></tr></tbody></table>';
    CB_DYN_HTML["过程难易"] = '<table class="cb-dyn"><tbody><tr><th>导向与施受</th><td><b>静局无过程</b><br><span class="dim">始卦＝终卦，无位移即无过程——初始导向与施受方向不适用</span></td></tr><tr><th>过程感受 · 成败裁定</th><td><b>—</b><br><span class="dim">静局未动（1前置启动）：成败不成立，难易不适用</span></td></tr></tbody></table>';
    return { title: "整体态势分析 · 过程与结果", html:
    '<div class="cb-off"><b>静局未动</b> —— 始卦＝终卦（六爻全静，同卦不变）：无转移结构，内部未动。' +
    '<br>成败不成立（无变动可成）；难易不适用；结果恒为与初始相当——<b>' + (q0.de ? "维持高位" : "维持低位") + '</b>' +
    '（终态发展空间档：宫五行「' + a0.gongWx + '」在月支＝「' + q0.level + '」，' + (q0.de ? "旺相属高位" : "休囚死属低位") + '）。' +
    '<span class="dim">静局未动与「艰难启动」性质不同：前者是未发生位移，成败不成立；后者有位移结构，判成，只是起动极难。静局时两端宫五行同为一行，梯队差恒为零，无判断意义，故静局单列、不并入比和处理。</span></div>' }; }
  var a = g.info;
  var qA = cbQl(a.gongWx, mzh), qB = cbQl(b.gongWx, mzh);
  var fA = cbGan12Full(a.gong, mzh), fB = cbGan12Full(b.gong, mzh);
  var rsA = fA.rank, rsB = fB.rank;
  var rA = cbRelKey(a.gongWx, rzh), rB = cbRelKey(b.gongWx, rzh);
  var fAr = cbGan12Full(a.gong, rzh), fBr = cbGan12Full(b.gong, rzh);
  var r12A = fAr.rank, r12B = fBr.rank;
  var tA = cbTidui(a.gongWx, mzh), tB = cbTidui(b.gongWx, mzh);
  var sA = cbTidui(a.gongWx, rzh), sB = cbTidui(b.gongWx, rzh);
  var rel = wxRelation(a.gongWx, b.gongWx), mode = WX_MODE[rel];
  var sameGua = b.name === a.name;
  var isKe = (rel === "克" || rel === "被克");
  function row(i, label, main, sub, note) {
    return '<div class="cb-row"><i>' + i + ' ' + label + '</i><b>' + main + '</b>' +
      (sub ? '<span>' + sub + '</span>' : '') + (note ? '<em>' + note + '</em>' : '') + '</div>';
  }
  function mini(label, l, r) { return '<tr><td>' + label + '</td><td>' + l + '</td><td>' + r + '</td></tr>'; }
  var msA = monthState(a.gongWx, mzh, null), msB = monthState(b.gongWx, mzh, null);
  var msAi = monthState(a.gongWx, rzh, null), msBi = monthState(b.gongWx, rzh, null);
  var zyF = gan12Full(ZHI_CANG[rzh][0], mzh);
  var hasRoot = (tA >= 1 || sA >= 1);
  var qiIn = qA.de || (msAi.level === "旺" || msAi.level === "相");
  var qd = hasRoot && qiIn ? "顺畅启动" : hasRoot ? "勉力启动" : qiIn ? "借力启动" : "艰难启动";
  var qdDe = hasRoot && qiIn ? "顺易" : (hasRoot || qiIn) ? "偏难" : "极难";
  var relMeta = {
    "生": { name: "始生终", mode: "主动顺推", dao: "结果导向", way: "起点主动投入，让结果形成", shou: "始", feel: "顺，但起点有消耗" },
    "克": { name: "始克终", mode: "全程管控", dao: "初始导向", way: "起点先定框架和边界，全程约束结果", shou: "始", feel: "紧，后段持续受约束" },
    "被生": { name: "终生始", mode: "反哺受限", dao: "初始导向", way: "结果要回头照顾原有基础、承诺和利益", shou: "终", feel: "受限，需要照顾旧账" },
    "被克": { name: "终克始", mode: "结果倒逼", dao: "结果导向", way: "为了形成结果，起点必须打破原有基础和限制", shou: "终", feel: "被动，由结果反向定调" },
    "比和": { name: "始终比和", mode: "同气维持", dao: "无导向", way: "前后同类，没有施动方与受动方", shou: "无", feel: "平，没有五行量级转折" }
  };
  var rm = relMeta[rel];
  var cdShi = rm.shou === "始" ? sA : sB, cdShou = rm.shou === "始" ? sB : sA;
  var cdName, cdDe = "";
  if (sameGua) { cdName = "成败不成立"; }
  else if (rel === "比和") {
    cdName = "同气落成";
  } else {
    var df = cdShi - cdShou;
    var cw = (isKe ? CB_KE7 : CB_SH7)[df + 3];
    cdName = cw[0]; cdDe = cw[1];
  }
  cbDynFill({ ga: a.gong, wa: a.gongWx, gb: b.gong, wb: b.gongWx, mzh: mzh, rzh: rzh, qA: qA, qB: qB, fA: fA, fB: fB, fAr: fAr, fBr: fBr, sA: sA, sB: sB, tA: tA, tB: tB, rA: rA, rB: rB, msA: msA, msB: msB, msAi: msAi, msBi: msBi, zyF: zyF, sameGua: sameGua, rel: rel, qd: qd, qdDe: qdDe, hasRoot: hasRoot, qiIn: qiIn, shou: rm.shou, cdShi: cdShi, cdShou: cdShou, cdName: cdName, cdDe: cdDe, rm: rm });
  var h = '<div class="cb-panel">';
  h += row("1", '<span class="cb-link" data-k="前置启动">前置启动</span>',
    (sameGua ? "静局未动" : (rel === "比和" ? "非静局 · 同气换形" : "非静局")) + "｜" + (sameGua ? "静局不另判启动" : qd + "（" + qdDe + "）"),
    "", "");
  h += row("2", '<span class="cb-link" data-k="过程难易">过程难易</span>', rm.mode + " · " + cdName + (cdDe ? "（" + cdDe + "）" : ""),
    "", "");
  h += '<details class="cb-fold"><summary>资源关系 <span class="dim">（点击展开）</span></summary><table class="cb-mini"><thead><tr><th>资源关系</th><th>起点</th><th>终点</th></tr></thead><tbody>';
  h += mini(cbLink("趋势关系"), CB_MS_JIE[CB_MS_NAME[msA.rel]], CB_MS_JIE[CB_MS_NAME[msB.rel]]);
  h += mini(cbLink("发展空间"), CB_SPACE[qA.level], CB_SPACE[qB.level]);
  h += mini(cbLink("资源丰沛"), cbRsMean(rsA), cbRsMean(rsB));
  h += mini(cbLink("趋势梯队"), CB_TI_NAME[tA], CB_TI_NAME[tB]);
  h += '</tbody></table></details>';
  h += '<details class="cb-fold"><summary>权力关系 <span class="dim">（点击展开）</span></summary><table class="cb-mini"><thead><tr><th>权力关系</th><th>起点</th><th>终点</th></tr></thead><tbody>';
  h += mini(cbLink("上级关系"), CB_POWER_JIE[CB_POWER_NAME[rA]], CB_POWER_JIE[CB_POWER_NAME[rB]]);
  h += mini(cbLink("向外借力"), CB_JIE2[msAi.level], CB_JIE2[msBi.level]);
  h += mini(cbLink("发展评级"), cbGradeMean(r12A), cbGradeMean(r12B));
  h += mini(cbLink("支持梯队"), CB_TI_NAME[sA], CB_TI_NAME[sB]);
  h += mini(cbLink("上级资源"), cbRsMean(zyF.rank), cbRsMean(zyF.rank));
  h += '</tbody></table></details>';
  h += '</div>';
  return { title: "整体态势分析 · 过程与结果", html: h };
}

/* ---------- 汇总 ---------- */
function buildAnalysis(g, yong, state) {
  var secs = [];
  secs.push(anaGuaStruct(g));
  secs.push(anaHalfStruct(g));
  secs.push(anaYong(g, yong));
  secs.push(anaGong(g));
  secs.push(anaStep1(g, yong));
  secs.push(anaStep2(g));
  secs.push(anaStep3(g));
  secs.push(anaStep4(g, yong));
  secs.push(anaStep5(g, yong));
  secs.push(anaStep6(g, yong));
  secs.push(anaStep7(g, yong));
  secs.push(anaStep8(g, yong));
  secs.push(anaL1(g, yong));
  secs.push(anaL2(g, yong));
  secs.push(anaL3(g));
  secs.push(anaL4(g));
  secs.push(anaEco(g, yong));
  secs.push(anaTaiji(g, yong));
  secs.push(anaFu(g));
  return secs;
}
