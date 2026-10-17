/* ===== 六爻排盘 · 引擎层 v0.1.3（对应 docs/ALGORITHM.md §1–§9、§11）===== */

/* ---------- 历法原语（与八字/奇门同源） ---------- */
var MONTH_START = { 0:2, 5:2, 1:4, 6:4, 2:6, 7:6, 3:8, 8:8, 4:0, 9:0 };
var SHI_START   = { 0:0, 5:0, 1:2, 6:2, 2:4, 7:4, 3:6, 8:6, 4:8, 9:8 };
var S_TERM_NAME = ['小寒','大寒','立春','雨水','惊蛰','春分','清明','谷雨','立夏','小满','芒种','夏至',
                   '小暑','大暑','立秋','处暑','白露','秋分','寒露','霜降','立冬','小雪','大雪','冬至'];
var JQ_MDZ = { 立春:2, 雨水:2, 惊蛰:3, 春分:3, 清明:4, 谷雨:4, 立夏:5, 小满:5, 芒种:6, 夏至:6,
               小暑:7, 大暑:7, 立秋:8, 处暑:8, 白露:9, 秋分:9, 寒露:10, 霜降:10, 立冬:11, 小雪:11,
               大雪:0, 冬至:0, 小寒:1, 大寒:1 };

function jd(y, m, d) {
  var a = Math.floor((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}
function dayIdx(y, m, d) { return ((jd(y, m, d) + 49) % 60 + 60) % 60; }
function shichenIdx(h) { return Math.floor((h + 1) / 2) % 12; }
function yearGz(y) { return ((y - 4) % 60 + 60) % 60; }
function monthTg(ygIdx, mdz) { return ((MONTH_START[((ygIdx % 10) + 10) % 10] + mdz - 2) % 10 + 10) % 10; }
function shiTg(di, sc) { return ((SHI_START[((di % 10) + 10) % 10] + sc) % 10 + 10) % 10; }
function jiaziIdx(tg, dz) { for (var k = 0; k < 60; k++) if (k % 10 === tg && k % 12 === dz) return k; return -1; }

function getSolarTerm(y, n) {
  // n: 0=小寒 … 23=冬至；返回 Date（UTC 字段 = 北京钟表时间）
  var idx = (y - 1000) * 24 + n, packed = SOLAR_TERMS[idx];
  if (packed === undefined) return null;
  var days = Math.trunc(packed / 86400), secs = packed % 86400;
  if (secs < 0) { secs += 86400; days -= 1; }
  return new Date(Date.UTC(2000, 0, 1) + days * 86400000 + secs * 1000 - 288e5);
}
function getJq(y, m, d, h, mi) {
  var t = Date.UTC(y, m - 1, d, h || 0, mi || 0), name = '冬至', lastT = -Infinity;
  for (var yy = y - 1; yy <= y; yy++) {
    for (var i = 0; i < 24; i++) {
      var st = getSolarTerm(yy, i);
      if (st && t >= st.getTime() && st.getTime() >= lastT) { name = S_TERM_NAME[i]; lastT = st.getTime(); }
    }
  }
  return name;
}

/* 四柱：年（立春分界）、月（节气）、日（子时换日）、时 */
function computePillars(y, m, d, h, mi) {
  h = h || 0; mi = mi || 0;
  var sc = shichenIdx(h);
  var di = dayIdx(y, m, (h >= 23) ? d + 1 : d);
  var lichun = getSolarTerm(y, 2);
  var cur = Date.UTC(y, m - 1, d, h, mi);
  var yy = (lichun && cur < lichun.getTime()) ? y - 1 : y;
  var yg = yearGz(yy);
  var jq = getJq(y, m, d, h, mi);
  var mdz = JQ_MDZ[jq];
  var mtg = monthTg(yg, mdz);
  var mgz = jiaziIdx(mtg, mdz);
  var stg = shiTg(di, sc);
  var sgz = jiaziIdx(stg, sc);
  var xun = Math.floor(di / 10) * 10;
  var kong = [DZ[(xun + 10) % 12], DZ[(xun + 11) % 12]];
  var mxun = Math.floor(mgz / 10) * 10;
  var mkong = [DZ[(mxun + 10) % 12], DZ[(mxun + 11) % 12]];
  return {
    y: yy, m: m, d: d, h: h, mi: mi, sc: sc, jq: jq,
    yg: yg, yz: yg % 12, mgz: mgz, mdz: mdz, di: di, riGan: TG[di % 10], riZhi: DZ[di % 12],
    stg: stg, sgz: sgz, kong: kong, mkong: mkong,
    pillars: [JIAZI[yg], JIAZI[mgz], JIAZI[di], JIAZI[sgz]]
  };
}

/* 十二长生（§7.1）：金水木火以五行取阳干顺行；土分阴阳（v0.1.78 邦顺裁决）——
   阳土（艮宫·辰戌）走戊线：长生在午顺行（未沐浴、戌帝旺）；阴土（坤宫·丑未）走己线：长生在巳逆行（辰沐浴、丑帝旺）；
   yin 由调用方按主体定：支/宫名/卦名过 tuYin（坤·丑·未＝阴） */
function tuYin(n) { return n === "坤" || n === "丑" || n === "未"; }
function changSheng(wx, zhi, yin) {
  var start, dir = 1;
  if (wx === "土") {
    if (yin) { start = DZ.indexOf("巳"); dir = -1; }
    else start = DZ.indexOf("午");
  } else start = DZ.indexOf(GAN_CS_START[WX_YANG_GAN[wx]]);
  var i = ((DZ.indexOf(zhi) - start) * dir + 120) % 12;
  return CHANGSHENG[i];
}

/* 月令生克 → 旺相休囚死（与十二长生双轨并行；冲突时以本口径为准） */
function monthState(wx, mdz, yzhi) {
  var mw = ZHI_WX[mdz];
  if (yzhi === mdz) return { rel: "临月建", level: "旺", wang: true, val: 3 };
  if (mw === wx) return { rel: "比和月令", level: "旺", wang: true, val: 3 };
  if (WX_SHENG[mw] === wx) return { rel: "月令生我", level: "相", wang: true, val: 2 };
  if (WX_SHENG[wx] === mw) return { rel: "我生月令", level: "休", wang: false, val: 0 };
  if (WX_KE[wx] === mw) return { rel: "我克月令", level: "囚", wang: false, val: -1 };
  return { rel: "月令克我", level: "死", wang: false, val: -2 };
}

/* 通根：五行对支按藏干求根 —— 本气位＝本气根、中气位＝中气根、余气位＝余气根，不在＝无根 */
function tongGen(wx, zhi) {
  var kind = ["本气根", "中气根", "余气根"], cang = ZHI_CANG[zhi] || [];
  for (var i = 0; i < cang.length; i++) if (GAN_WX[cang[i]] === wx) return kind[i] + wx;
  return "无根";
}

/* 卦生克（v0.1.99，原整卦旺衰五态换名）：半卦五行受整卦（宫）五行生克——卦我比和（最强）、卦生我（三强）、我克卦（次强）、我生卦（次弱）、卦克我（最弱） */
function gongState(wx, gwx) {
  if (wx === gwx) return { rel: "同宫五行", level: "卦我比和" };
  if (WX_SHENG[gwx] === wx) return { rel: gwx + "生" + wx, level: "卦生我" };
  if (WX_KE[gwx] === wx) return { rel: gwx + "克" + wx, level: "卦克我" };
  if (WX_SHENG[wx] === gwx) return { rel: wx + "生" + gwx, level: "我生卦" };
  return { rel: wx + "克" + gwx, level: "我克卦" };
}

/* 日令生克比五型文案（v0.1.79 按月令做法加「我」）：比和＝比和X日、日生＝X日生我、日克＝X日克我、我生＝我生X日、我克＝我克X日（§A5） */
function riShengKeText(wx, rzhi) {
  var rw = ZHI_WX[rzhi];
  if (rw === wx) return "比和" + rzhi + "日";
  if (WX_SHENG[rw] === wx) return rzhi + "日生我";
  if (WX_KE[rw] === wx) return rzhi + "日克我";
  if (WX_SHENG[wx] === rw) return "我生" + rzhi + "日";
  return "我克" + rzhi + "日";
}

/* 半卦级：世应所在三爻卦的本变结构（半卦五行／本变五型／月旺衰／日旺衰／整卦旺衰），供得失分析与四层判定复用 */
function halfLevel(g) {
  var a = g.info, b = g.bian ? g.bian.info : null;
  var mzh = DZ[g.cal.mdz], rzh = g.cal.riZhi;
  function side(tri, refGwx) {
    var wx = GONG_WX[tri.n];
    var yue = monthState(wx, mzh, null);
    return { n: tri.n, wx: wx,
      yue: yue,
      ri: monthState(wx, rzh, null),
      zheng: gongState(wx, refGwx) };
  }
  function pair(tri, btri, gwx, bgwx) {
    var p = { ben: side(tri, gwx), bian: null, md: null };
    if (btri) {
      p.bian = side(btri, bgwx);
      p.md = WX_MODE[wxRelation(p.ben.wx, p.bian.wx)];
    }
    return p;
  }
  return { shiUp: SEQ_SHI[a.seq] > 3,
    up: pair(a.upper, b && b.upper, a.gongWx, b && b.gongWx),
    low: pair(a.lower, b && b.lower, a.gongWx, b && b.gongWx) };
}

/* ---------- 八卦 / 八宫 ---------- */
function flipBits(bits, idxs) {
  var a = bits.split('');
  for (var k = 0; k < idxs.length; k++) { var i = idxs[k]; a[i] = (a[i] === '1') ? '0' : '1'; }
  return a.join('');
}
var GONG_MAP = {};
(function buildGongMap() {
  for (var g = 0; g < 8; g++) {
    var pure = TRI[g], base = pure.b + pure.b, seqs = [];
    seqs[0] = base;
    seqs[1] = flipBits(base, [0]);
    seqs[2] = flipBits(base, [0, 1]);
    seqs[3] = flipBits(base, [0, 1, 2]);
    seqs[4] = flipBits(base, [0, 1, 2, 3]);
    seqs[5] = flipBits(base, [0, 1, 2, 3, 4]);
    seqs[6] = flipBits(seqs[5], [3]);
    seqs[7] = flipBits(seqs[6], [0, 1, 2]);
    for (var s = 0; s < 8; s++) GONG_MAP[seqs[s]] = { gong: pure.n, seq: s };
  }
})();

function guaInfo(bits) {
  var lower = TRI_BY_BITS[bits.slice(0, 3)], upper = TRI_BY_BITS[bits.slice(3, 6)];
  var info = GONG_MAP[bits];
  return {
    bits: bits, lower: lower, upper: upper,
    name: GUA_NAMES[upper.n + lower.n] || "（未知名）",
    gong: info.gong, gongWx: GONG_WX[info.gong], seq: info.seq, seqName: SEQ_NAME[info.seq]
  };
}

/* 某卦六爻的纳甲干支（不含六亲） */
function najiaYao(bits) {
  var lower = TRI_BY_BITS[bits.slice(0, 3)], upper = TRI_BY_BITS[bits.slice(3, 6)], out = [];
  for (var p = 1; p <= 6; p++) {
    var inner = p <= 3, tri = inner ? lower : upper, nj = NAJIA[tri.n];
    out.push({ pos: p, gan: inner ? nj.ig : nj.og, zhi: inner ? nj.iz[p - 1] : nj.oz[p - 4] });
  }
  for (var k = 0; k < 6; k++) out[k].wx = ZHI_WX[out[k].zhi];
  return out;
}

/* ---------- 装卦 ---------- */
function zhuangGua(bits, states, cal, forceBian) {
  // states: 长度 6 的数组，每项 6/7/8/9（老阴/少阳/少阴/老阳）
  var gi = guaInfo(bits);
  var nj = najiaYao(bits);
  var start = LIUSHEN_START[cal.riGan];
  var yao = [];
  for (var p = 1; p <= 6; p++) {
    var st = states[p - 1];
    yao.push({
      pos: p, gan: nj[p - 1].gan, zhi: nj[p - 1].zhi, wx: nj[p - 1].wx,
      liuqin: liuqinOf(gi.gongWx, nj[p - 1].wx),
      state: st, yang: (st === 7 || st === 9), moving: (st === 6 || st === 9),
      liushen: LIUSHEN[(start + p - 1) % 6],
      shi: (SEQ_SHI[gi.seq] === p), ying: (SEQ_YING[gi.seq] === p),
      bian: null
    });
  }
  var g = { info: gi, yao: yao, cal: cal, moving: [], hasMoving: false, bian: null };
  for (var k = 0; k < 6; k++) if (yao[k].moving) { g.moving.push(k + 1); g.hasMoving = true; }

  /* 变卦：动爻变阴阳；变爻六亲仍以本卦卦宫定（§4）
     forceBian：双端起卦终卦＝始卦（0 动爻）时仍建变卦镜像——参考资料 28 · 起用条件「两端完全相同仍然起用」，记同卦不变 */
  if (g.hasMoving || forceBian) {
    var nb = bits.split('');
    for (var i2 = 0; i2 < 6; i2++) if (yao[i2].moving) nb[i2] = (nb[i2] === '1') ? '0' : '1';
    var bb = nb.join('');
    g.bian = { info: guaInfo(bb), nj: najiaYao(bb) };
    /* 变卦六爻全量：整卦显示用（六亲仍以本卦卦宫定，§4） */
    g.bian.yao = [];
    for (var v = 0; v < 6; v++) {
      var bnj2 = g.bian.nj[v];
      g.bian.yao.push({
        pos: v + 1, gan: bnj2.gan, zhi: bnj2.zhi, wx: bnj2.wx,
        liuqin: liuqinOf(gi.gongWx, bnj2.wx),
        yang: (bb.charAt(v) === '1'), moved: yao[v].moving,
        shi: (SEQ_SHI[g.bian.info.seq] === v + 1), ying: (SEQ_YING[g.bian.info.seq] === v + 1)
      });
    }
    for (var m2 = 0; m2 < 6; m2++) {
      if (!yao[m2].moving) continue;
      var bnj = g.bian.nj[m2];
      var rel = changeRelation(yao[m2], bnj.zhi);
      yao[m2].bian = {
        gan: bnj.gan, zhi: bnj.zhi, wx: bnj.wx,
        liuqin: liuqinOf(gi.gongWx, bnj.wx), rel: rel
      };
    }
    /* 静变爻：本卦静爻而变卦对应爻五行不同者，对标动变爻标回头生克泄耗／化进化退；化空随日令旬空 */
    for (var m3 = 0; m3 < 6; m3++) {
      if (yao[m3].moving) continue;
      var bnj3 = g.bian.nj[m3];
      if (bnj3.wx === yao[m3].wx) continue;
      yao[m3].bianRel = changeRelation(yao[m3], bnj3.zhi);
      yao[m3].bianKong = (cal.kong.indexOf(bnj3.zhi) >= 0);
      yao[m3].bianMkong = (cal.mkong.indexOf(bnj3.zhi) >= 0);
      yao[m3].bianRipo = (LIU_CHONG[bnj3.zhi] === cal.riZhi);
      yao[m3].bianYuepo = (LIU_CHONG[bnj3.zhi] === DZ[cal.mdz]);
      yao[m3].bianHeRi = (LIU_HE[bnj3.zhi] === cal.riZhi);
      yao[m3].bianHeYue = (LIU_HE[bnj3.zhi] === DZ[cal.mdz]);
      yao[m3].bianXingRi = xingRel(bnj3.zhi, cal.riZhi);
      yao[m3].bianHaiRi = haiRel(bnj3.zhi, cal.riZhi);
      yao[m3].bianXingYue = xingRel(bnj3.zhi, DZ[cal.mdz]);
      yao[m3].bianHaiYue = haiRel(bnj3.zhi, DZ[cal.mdz]);
      yao[m3].bianTuRef = ((yao[m3].bianRel === "化进" || yao[m3].bianRel === "化退") && ZHI_WX[yao[m3].zhi] === "土");
    }
  }

  /* 伏神：本卦未出现的六亲，回本宫首卦同爻位取（§6） */
  var pureBits = TRI_BY_NAME[gi.gong].b + TRI_BY_NAME[gi.gong].b;
  var pureNj = najiaYao(pureBits);
  var present = {};
  for (var q = 0; q < 6; q++) present[yao[q].liuqin] = true;
  g.fu = [];
  for (var l = 0; l < LQ_ORDER.length; l++) {
    var lq = LQ_ORDER[l];
    if (present[lq]) continue;
    for (var r = 0; r < 6; r++) {
      var pLq = liuqinOf(GONG_WX[gi.gong], pureNj[r].wx);
      if (pLq !== lq) continue;
      var fei = yao[r];
      g.fu.push({
        pos: r + 1, liuqin: lq, gan: pureNj[r].gan, zhi: pureNj[r].zhi, wx: pureNj[r].wx,
        feiGan: fei.gan, feiZhi: fei.zhi, feiWx: fei.wx, feiLiuqin: fei.liuqin,
        rel: wxRelText(pureNj[r].wx, fei.wx)
      });
    }
  }
  return g;
}

function changeRelation(yao, bzhi) {
  var bw = ZHI_WX[bzhi], ow = yao.wx;
  if (bw === ow) {
    if (JIN_SHEN[yao.zhi] === bzhi) return "化进";
    if (TUI_SHEN[yao.zhi] === bzhi) return "化退";
    return "比和";
  }
  if (WX_SHENG[bw] === ow) return "回头生";
  if (WX_KE[bw] === ow) return "回头克";
  if (WX_SHENG[ow] === bw) return "化泄";
  return "化耗";
}

/* ---------- 状态层（§7） ---------- */
function computeState(g, opt) {
  var cal = g.cal, refZhi = opt.refZhi, muRef = opt.muRef || [], kong = cal.kong;
  var mdz = DZ[cal.mdz], rdz = cal.riZhi;
  g.refZhi = refZhi; g.refLabel = opt.refLabel || "月建"; g.muRef = muRef;
  // 第一遍：动静 / 空破墓 —— 必须先算完，强弱才有所依据
  for (var k = 0; k < 6; k++) {
    var y = g.yao[k];
    y.cs = changSheng(y.wx, refZhi, tuYin(y.zhi));
    y.csLevel = CS_LEVEL[y.cs];
    var ms = monthState(y.wx, mdz, y.zhi);
    y.monthRel = ms.rel; y.monthLevel = ms.level; y.wang = ms.wang; y.wangVal = ms.val;
    y.kong = (kong.indexOf(y.zhi) >= 0);
    y.mkong = (cal.mkong.indexOf(y.zhi) >= 0);
    y.mu = [];
    for (var m = 0; m < muRef.length; m++) if (WX_MU[y.wx] === muRef[m].zhi) y.mu.push(muRef[m].label + "墓");
    y.muKind = y.mu.length ? (y.wang ? "入库" : "入墓") : "";
    y.chongRi = (LIU_CHONG[y.zhi] === rdz);
    y.chongYue = (LIU_CHONG[y.zhi] === mdz);
    y.heRi = (LIU_HE[y.zhi] === rdz);
    y.heYue = (LIU_HE[y.zhi] === mdz);
    y.xingRi = xingRel(y.zhi, rdz);
    y.haiRi = haiRel(y.zhi, rdz);
    y.xingYue = xingRel(y.zhi, mdz);
    y.haiYue = haiRel(y.zhi, mdz);
    /* 日冲单维（v0.2.20）：静爻被日辰冲＝日冲，不分旺衰生扶；冲日＝爻冲日令，动爻标「冲日」 */
    y.ripo = (!y.moving && y.chongRi);
    y.yuepo = (!y.moving && y.chongYue);
    /* 虚实四态（§19）：实＝旺相且不空破墓；虚＝休囚且空破墓；半实半虚＝旺相但空破（待时）；半虚半实＝休囚但未空破（力小可用）。日冲不参与（v0.2.20 单维标志） */
    var broken = (y.kong || y.yuepo || y.muKind === "入墓");
    y.xuShi = y.wang ? (broken ? "半实半虚" : "实") : (broken ? "虚" : "半虚半实");
    /* 空分真假（§19/§20）：旺相空＝假空（待出空填实）；休囚空＝真空 */
    y.kongKind = y.kong ? (y.wang ? "假空" : "真空") : "";
    /* 日合静爻（§19 动静五类）：旺相＝合起（激活）；休囚＝合绊（牵制） */
    y.heQi = (!y.moving && (y.heRi || y.heYue)) ? (y.wang ? "合起" : "合绊") : "";
    if (y.bian) {
      y.bian.cs = changSheng(y.bian.wx, refZhi, tuYin(y.bian.zhi));
      y.bian.csLevel = CS_LEVEL[y.bian.cs];
      var bms = monthState(y.bian.wx, mdz, y.bian.zhi);
      y.bian.monthLevel = bms.level; y.bian.wang = bms.wang;
      y.bian.kong = (kong.indexOf(y.bian.zhi) >= 0);
      y.bian.mu = [];
      for (var m2 = 0; m2 < muRef.length; m2++) if (WX_MU[y.bian.wx] === muRef[m2].zhi) y.bian.mu.push(muRef[m2].label + "墓");
      y.bian.muKind = y.bian.mu.length ? (y.bian.wang ? "入库" : "入墓") : "";
      y.bian.fuYin = (y.bian.zhi === y.zhi);
      if (y.bian.rel === "化进") y.bian.jinReal = y.wang;
      if (y.bian.rel === "化退") y.bian.tuiReal = y.wang;
      y.bian.tuRef = ((y.bian.rel === "化进" || y.bian.rel === "化退") && ZHI_WX[y.zhi] === "土");
      y.bian.mkong = (cal.mkong.indexOf(y.bian.zhi) >= 0);
      y.bian.heRi = (LIU_HE[y.bian.zhi] === rdz);
      y.bian.heYue = (LIU_HE[y.bian.zhi] === mdz);
      y.bian.xingRi = xingRel(y.bian.zhi, rdz);
      y.bian.haiRi = haiRel(y.bian.zhi, rdz);
      y.bian.xingYue = xingRel(y.bian.zhi, mdz);
      y.bian.haiYue = haiRel(y.bian.zhi, mdz);
      /* 变爻地支层（八法关系组＋状态组）：化冲合刑害对原爻；化月冲化日冲对月日；化绝看长生 */
      y.bian.zhiChong = (LIU_CHONG[y.bian.zhi] === y.zhi);
      y.bian.zhiHe = (LIU_HE[y.bian.zhi] === y.zhi);
      y.bian.zhiXing = xingRel(y.bian.zhi, y.zhi);
      y.bian.zhiHai = haiRel(y.bian.zhi, y.zhi);
      y.bian.yuepo = (LIU_CHONG[y.bian.zhi] === mdz);
      y.bian.ripo = (LIU_CHONG[y.bian.zhi] === rdz);
      y.bian.jue = (y.bian.cs === "绝");
    }
  }
  // 第二遍：强弱（日令 + 动爻）
  for (var k2 = 0; k2 < 6; k2++) {
    var s = strengthOf(g, g.yao[k2]);
    g.yao[k2].net = s.net; g.yao[k2].strongNotes = s.notes; g.yao[k2].strength = strengthLabel(s.net);
  }
  for (var f = 0; f < g.fu.length; f++) {
    var fu = g.fu[f];
    fu.kong = (kong.indexOf(fu.zhi) >= 0);
    fu.cs = changSheng(fu.wx, refZhi, tuYin(fu.zhi));
    fu.csLevel = CS_LEVEL[fu.cs];
    fu.wang = monthState(fu.wx, mdz, fu.zhi).wang;
  }
  /* 卦级：反吟 / 伏吟 */
  var za = [], zb = [];
  for (var fz = 0; fz < 6; fz++) { za.push(g.yao[fz].zhi); if (g.bian) zb.push(g.bian.yao[fz].zhi); }
  g.fanFuYin = fanFuYin(za, g.bian ? zb : null);
  g.guaChongHe = chongHeGua(za);
  var mvn = g.moving.length;
  g.structType = mvn === 0 ? "全静" : mvn === 6 ? "全动" : mvn === 1 ? "独发" : mvn === 5 ? "独静" : "";
  g.sanHeJu = sanHeJu(g, cal);
  g.bianFuYin = [];
  for (var fy = 0; fy < 6; fy++) {
    if (g.yao[fy].bian && g.yao[fy].bian.fuYin) g.bianFuYin.push(g.yao[fy].pos);
  }
  g.half = halfLevel(g);
  return g;
}

function strengthOf(g, y) {
  var net = 0, notes = [];
  function apply(srcWx, label) {
    if (srcWx === y.wx) { net += 1; notes.push(label + " " + srcWx + " 同类相助"); return; }
    if (WX_SHENG[srcWx] === y.wx) { net += 1; notes.push(label + " " + srcWx + " 生我"); return; }
    if (WX_SHENG[y.wx] === srcWx) { net -= 1; notes.push(label + " " + srcWx + " 泄我"); return; }
    if (WX_KE[y.wx] === srcWx) { net -= 1; notes.push(label + " " + srcWx + " 耗我"); return; }
    net -= 2; notes.push(label + " " + srcWx + " 克我");
  }
  apply(ZHI_WX[g.cal.riZhi], "日令" + g.cal.riZhi);
  for (var k = 0; k < 6; k++) {
    var o = g.yao[k];
    if (o.pos === y.pos || !o.moving) continue;
    apply(o.wx, YAO_POS_NAME[o.pos - 1] + o.gan + o.zhi + "（动）");
  }
  return { net: net, notes: notes };
}
function strengthLabel(net) {
  if (net >= 2) return "强";
  if (net === 1) return "偏强";
  if (net === 0) return "平";
  if (net === -1) return "偏弱";
  return "弱";
}

/* ---------- 关系工具 ---------- */
var YAO_POS_NAME = ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"];

function yaoRelText(a, b) {           // a 对 b 的作用：真假前缀＋五行关系＋地支合冲刑害
  var t = wxRelText(a.wx, b.wx), ex = [];
  if (LIU_CHONG[a.zhi] === b.zhi) ex.push("相冲");
  if (LIU_HE[a.zhi] === b.zhi) ex.push("相合");
  var hz = haiRel(a.zhi, b.zhi); if (hz) ex.push(hz);
  var xz = xingRel(a.zhi, b.zhi); if (xz) ex.push(xz);
  var sh = sanHeRel(a.zhi, b.zhi); if (sh) ex.push(sh);
  /* 真假（§19）：施力方空破墓或被日合绊，作用不实 —— 看着有，实际无；比和为同气不施受，不标真假。日冲不参与（v0.2.20 单维标志） */
  var fake = (a.kong || a.yuepo || a.muKind === "入墓" || a.heQi === "合绊");
  var pre = (t.indexOf("比和") >= 0) ? "" : (fake ? "假" : "真");
  return pre + t + (ex.length ? "·" + ex.join("·") : "");
}

/* 三合两支关系：生半合（长生＋帝旺）／墓半合（帝旺＋墓库）／拱合（长生＋墓库） */
function sanHeRel(a, b) {
  if (a === b) return "";
  for (var i = 0; i < SAN_HE.length; i++) {
    var s = SAN_HE[i], ia = s.zhi.indexOf(a), ib = s.zhi.indexOf(b);
    if (ia < 0 || ib < 0) continue;
    var lo = Math.min(ia, ib), hi = Math.max(ia, ib);
    if (lo === 0 && hi === 1) return "生半合" + s.wx;
    if (lo === 1 && hi === 2) return "墓半合" + s.wx;
    if (lo === 0 && hi === 2) return "拱合" + s.wx;
  }
  return "";
}
function xingRel(a, b) {
  if (a === b) return (ZI_XING.indexOf(a) >= 0) ? "自刑" : "";
  for (var i = 0; i < SAN_XING.length; i++) {
    if (SAN_XING[i].indexOf(a) >= 0 && SAN_XING[i].indexOf(b) >= 0) return "相刑";
  }
  if ((a === "子" && b === "卯") || (a === "卯" && b === "子")) return "相刑";
  return "";
}
function haiRel(a, b) { return (LIU_HAI[a] === b) ? "相害" : ""; }

/* 反吟／伏吟：本卦与变卦对应爻位地支「全冲」为反吟、「全同」为伏吟 */
function fanFuYin(za, zb) {
  if (!zb) return "";
  var fullC = true, fullS = true, inC = true, outC = true, inS = true, outS = true;
  for (var k = 0; k < 6; k++) {
    var c = (LIU_CHONG[za[k]] === zb[k]), s = (za[k] === zb[k]);
    if (!c) fullC = false;
    if (!s) fullS = false;
    if (k < 3) { if (!c) inC = false; if (!s) inS = false; }
    else { if (!c) outC = false; if (!s) outS = false; }
  }
  var hits = [];
  if (fullC) hits.push("全卦反吟"); else if (inC) hits.push("内卦反吟"); else if (outC) hits.push("外卦反吟");
  if (fullS) hits.push("全卦伏吟"); else if (inS) hits.push("内卦伏吟"); else if (outS) hits.push("外卦伏吟");
  return hits.join("·");
}

/* 卦级：六冲卦 / 六合卦（内卦与外卦对应爻位三组全冲 / 全合；两者互斥） */
function chongHeGua(za) {
  var c = true, h = true;
  for (var k = 0; k < 3; k++) {
    if (LIU_CHONG[za[k]] !== za[k + 3]) c = false;
    if (LIU_HE[za[k]] !== za[k + 3]) h = false;
  }
  return c ? "六冲卦" : (h ? "六合卦" : "");
}

/* 三合局成局：须至少两支因动（动爻／变爻）而现，缺支由日月补全；纯静不成局 */
function sanHeJu(g, cal) {
  var out = [], mdz = DZ[cal.mdz], rdz = cal.riZhi, active = [];
  for (var k = 0; k < 6; k++) {
    var y = g.yao[k];
    if (y.moving) active.push({ zhi: y.zhi, pos: y.pos, src: "动" });
    if (y.bian) active.push({ zhi: y.bian.zhi, pos: y.pos, src: "变" });
  }
  for (var i = 0; i < SAN_HE.length; i++) {
    var s = SAN_HE[i], seen = {}, cnt = 0, srcs = [];
    for (var a = 0; a < active.length; a++) {
      var z = active[a].zhi;
      if (s.zhi.indexOf(z) >= 0 && !seen[z]) {
        seen[z] = true; cnt++;
        srcs.push(YAO_POS_NAME[active[a].pos - 1] + z + "(" + active[a].src + ")");
      }
    }
    if (cnt < 2) continue;
    var lack = [];
    for (var j = 0; j < 3; j++) if (!seen[s.zhi[j]]) lack.push(s.zhi[j]);
    var filledBy = "";
    if (lack.length) {
      var byDay = true;
      for (var L = 0; L < lack.length; L++) if (lack[L] !== mdz && lack[L] !== rdz) byDay = false;
      if (byDay) filledBy = "日月补全";
      else {
        var inStatic = false;
        for (var L2 = 0; L2 < lack.length; L2++) {
          for (var q = 0; q < 6; q++) if (g.yao[q].zhi === lack[L2]) inStatic = true;
        }
        filledBy = inStatic ? "静爻在位" : "缺支无着";
      }
    }
    out.push({ wx: s.wx, name: s.zhi.join("") + "・" + s.wx + "局", act: cnt, srcs: srcs, lack: lack, filledBy: filledBy });
  }
  return out;
}
function distLabel(a, b) { return Math.abs(a.pos - b.pos) === 1 ? "相邻" : "隔位"; }

/* 六亲关系强弱四维度（§14） */
function relStrength(g, a, b) {
  var score = 0, dims = [];
  var ax = a.csLevel >= 3 ? 2 : (a.csLevel >= 1 ? 1 : 0);
  var sOk = (a.strength === "强" || a.strength === "偏强");
  if (ax >= 2 && sOk) { score += 2; dims.push("施力方旺且强"); }
  else if (ax >= 1 || sOk) { score += 1; dims.push("施力方能量中等"); }
  else dims.push("施力方衰且弱");
  if (distLabel(a, b) === "相邻") { score += 1; dims.push("相邻"); } else dims.push("隔位");
  if (a.moving) { score += 1; dims.push("动爻"); } else dims.push("静爻");
  if (a.kong || a.yuepo || a.muKind === "入墓" || a.heQi === "合绊") { score -= 2; dims.push("施力方空破合绊·作用不实"); }
  if (LIU_CHONG[a.zhi] === b.zhi) { score += 1; dims.push("相冲"); }
  else if (LIU_HE[a.zhi] === b.zhi) { score += 1; dims.push("相合"); }
  var label = score >= 5 ? "决定性" : (score >= 4 ? "较强" : (score >= 3 ? "一般" : "微弱"));
  return { score: score, label: label, dims: dims };
}

/* ---------- 双端起卦（参考资料 27 · 0007 双端独立抽卦法 v1.0.0） ----------
   始卦、终卦分别从 0–63 独立等概率抽取（终卦不排除始卦，允许同卦与 0–6 个动爻），
   动爻＝两端编码 XOR 反推。编码：0＝阴 1＝阳，低位＝初爻。
   抽取必须 crypto 级（rng 仅测试注入），禁 Math.random 与时间戳取余。 */
var DUAL_METHOD = "independent_dual_hexagram", DUAL_VERSION = "1.0.0";
function randCode64(rng) {
  if (rng) return rng() & 63;
  var b = new Uint8Array(1);
  crypto.getRandomValues(b);
  return b[0] & 63;
}
function codeToBits(code) {
  var s = "";
  for (var i = 0; i < 6; i++) s += ((code >> i) & 1) ? "1" : "0";
  return s;
}
function bitsToCode(bits) {
  var c = 0;
  for (var i = 0; i < 6; i++) if (bits.charAt(i) === "1") c |= (1 << i);
  return c;
}
function dualDraw(startCode, endCode) {
  var mask = startCode ^ endCode, lines = [];
  for (var i = 0; i < 6; i++) if ((mask >> i) & 1) lines.push(i + 1);
  return { method: DUAL_METHOD, algorithmVersion: DUAL_VERSION,
    startCode: startCode, endCode: endCode,
    changingMask: mask, changingLines: lines, changingCount: lines.length,
    isSameHexagram: startCode === endCode };
}
/* 两端 → 六爻值：始终同爻＝少（阳7阴8），异爻＝老（始阳9始阴6）——
   老爻即动，装卦后变卦必等于抽取的终卦 */
function dualStates(startCode, endCode) {
  var sb = codeToBits(startCode), eb = codeToBits(endCode), out = [];
  for (var i = 0; i < 6; i++) {
    if (sb.charAt(i) === eb.charAt(i)) out.push(sb.charAt(i) === "1" ? 7 : 8);
    else out.push(sb.charAt(i) === "1" ? 9 : 6);
  }
  return out;
}

/* 用神选取（§11） */
function pickYongShen(g, ruleKey) {
  var rule = null;
  for (var i = 0; i < YONGSHEN_RULES.length; i++) if (YONGSHEN_RULES[i].key === ruleKey) rule = YONGSHEN_RULES[i];
  if (!rule) rule = YONGSHEN_RULES[0];
  var cands = [];
  if (rule.lq === "世爻" || rule.lq === "应爻") {
    for (var k = 0; k < 6; k++) if ((rule.lq === "世爻" ? g.yao[k].shi : g.yao[k].ying)) cands.push(g.yao[k]);
  } else {
    for (var k2 = 0; k2 < 6; k2++) if (g.yao[k2].liuqin === rule.lq) cands.push(g.yao[k2]);
  }
  if (!cands.length) return { rule: rule, cands: [], pick: null, note: "本卦中该六亲不上卦 —— 见伏神（" + rule.lq + "）" };
  /* 两现取用六环（§20）：动 > 旺 > 空破 > 临世应 > 有生扶 > 近世，逐环收窄 */
  var pickList = cands.slice(), ringHit = "";
  function narrow(f, name) {
    if (pickList.length < 2) return;
    var hit = [];
    for (var i = 0; i < pickList.length; i++) if (f(pickList[i])) hit.push(pickList[i]);
    if (hit.length >= 1 && hit.length < pickList.length) { pickList = hit; ringHit = name; }
  }
  narrow(function (c) { return c.moving; }, "动");
  narrow(function (c) { return c.wang; }, "旺");
  narrow(function (c) { return c.kong || c.yuepo || c.ripo; }, "空破");
  narrow(function (c) { return c.shi || c.ying; }, "世应");
  narrow(function (c) {
    for (var i = 0; i < g.yao.length; i++) {
      var yy = g.yao[i];
      if (yy !== c && yy.moving && WX_SHENG[yy.wx] === c.wx) return true;
    }
    return false;
  }, "生扶");
  if (pickList.length > 1) {
    var shi = null; for (var s2 = 0; s2 < 6; s2++) if (g.yao[s2].shi) shi = g.yao[s2];
    if (shi) {
      var best = pickList[0], bd = 99;
      for (var c2 = 0; c2 < pickList.length; c2++) {
        var dd = Math.abs(pickList[c2].pos - shi.pos);
        if (dd < bd) { bd = dd; best = pickList[c2]; }
      }
      pickList = [best];
    }
  }
  return {
    rule: rule, cands: cands, pick: pickList[0],
    note: cands.length > 1 ? "同六亲 " + cands.length + " 爻，按取用序（动 > 旺 > 空破 > 世应 > 生扶 > 近世）取 " + pickList[0].pos + " 爻（定于「" + (ringHit || "近世") + "」环）" : ""
  };
}

/* 应期候选（§八步⑧） */
function yingQi(g, yong) {
  var out = [];
  var mdz = DZ[g.cal.mdz];
  if (yong.bian) {
    if (yong.bian.rel === "化进") out.push({ zhi: yong.bian.zhi, why: "化进 —— 逢值（" + yong.bian.zhi + "）落地" });
    if (yong.bian.rel === "化退") out.push({ zhi: yong.zhi, why: "化退 —— 逢值（" + yong.zhi + "）为退到位的时点" });
    if (yong.bian.kong) out.push({ zhi: yong.bian.zhi, why: "变爻逢日空 —— 出空填实（" + yong.bian.zhi + "）" });
  }
  if (yong.kong) {
    out.push({ zhi: yong.zhi, why: "用神逢日空 —— 出空（过旬后逢 " + yong.zhi + "）" });
    out.push({ zhi: LIU_CHONG[yong.zhi], why: "用神逢日空 —— 冲空（" + LIU_CHONG[yong.zhi] + "）" + (yong.wang ? "则实（冲起）" : "则散（休囚）") });
  }
  if (yong.mu && yong.mu.length) out.push({ zhi: LIU_CHONG[WX_MU[yong.wx]], why: "用神入墓 —— 冲墓（" + LIU_CHONG[WX_MU[yong.wx]] + "）开库" });
  if (yong.yuepo) {
    out.push({ zhi: yong.zhi, why: "用神月冲 —— 出月（过 " + mdz + " 月）" });
    out.push({ zhi: LIU_HE[yong.zhi], why: "用神月冲 —— 合冲（逢 " + LIU_HE[yong.zhi] + "）" });
  }
  if (yong.heRi || yong.heYue) out.push({ zhi: LIU_CHONG[yong.zhi], why: "用神被合 —— 逢冲（" + LIU_CHONG[yong.zhi] + "）冲开" });
  if (yong.csLevel >= 3 || yong.strength === "强" || yong.strength === "偏强") {
    out.push({ zhi: yong.zhi, why: "用神旺相 —— 逢值（" + yong.zhi + "）应事" });
    out.push({ zhi: LIU_HE[yong.zhi], why: "用神旺相 —— 逢合（" + LIU_HE[yong.zhi] + "）应事" });
    var keWx = null;
    for (var wk in WX_KE) if (WX_KE[wk] === yong.wx) { keWx = wk; break; }
    var keZhi = [];
    for (var zi = 0; zi < DZ.length; zi++) if (ZHI_WX[DZ[zi]] === keWx) keZhi.push(DZ[zi]);
    out.push({ zhi: keZhi[0], why: "用神旺极 —— 逢 " + keZhi.join("／") + "（" + keWx + "）制之" });
  } else {
    out.push({ zhi: yong.zhi, why: "用神偏弱 —— 逢值待扶（" + yong.zhi + "）" });
    var srcWx = null;
    for (var w in WX_SHENG) if (WX_SHENG[w] === yong.wx) srcWx = w;
    if (srcWx) out.push({ zhi: srcWx === "土" ? (tuYin(yong.zhi) ? "巳" : "午") : GAN_CS_START[WX_YANG_GAN[srcWx]], why: "用神偏弱 —— 待 " + srcWx + " 旺之月/日来生" });
  }
  var seen = {}, uniq = [];
  for (var k = 0; k < out.length; k++) {
    if (!out[k].zhi || seen[out[k].zhi + "|" + out[k].why]) continue;
    seen[out[k].zhi + "|" + out[k].why] = 1; uniq.push(out[k]);
  }
  return uniq;
}
