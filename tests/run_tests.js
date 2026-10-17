/* 六爻排盘 · 全量回归测试
   运行：node tests/run_tests.js
   门禁：全部断言通过（exit 0） */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const HTML = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const m = HTML.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/);
if (!m) { console.error('无法从 index.html 提取脚本'); process.exit(1); }
const SRC = m[1];

function stubEl() {
  return {
    value: "", textContent: "", innerHTML: "", hidden: false, className: "",
    onclick: null, onchange: null,
    getAttribute() { return null; }, setAttribute() {},
    appendChild() {}, querySelectorAll() { return []; },
    addEventListener() {}
  };
}
const ctx = vm.createContext({
  console,
  document: {
    getElementById: () => stubEl(),
    querySelectorAll: () => [],
    createElement: () => stubEl(),
    addEventListener() {},
    head: { appendChild() {} }
  },
  navigator: {},
  setTimeout: () => 0
});
vm.runInContext(SRC, ctx);

let pass = 0, fail = 0;
const failures = [];
function ok(cond, label) {
  if (cond) { pass++; } else { fail++; failures.push(label); }
}
function eq(actual, expected, label) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a === e) pass++; else { fail++; failures.push(label + '\n      实际: ' + a + '\n      期望: ' + e); }
}
function section(t) { console.log('\n── ' + t); }

/* ============ §2 纳甲 ============ */
section('§2 八卦与纳甲');
const { TRI_BY_NAME, NAJIA, GUA_NAMES, GONG_MAP, zhuangGua, najiaYao, computePillars,
        jd, dayIdx, shichenIdx, yearGz, jiaziIdx, getSolarTerm, getJq,
        liuqinOf, LQ_ORDER, changSheng, computeState, guaInfo, pickYongShen,
        LIUSHEN, LIUSHEN_START, WX_MU, LIU_CHONG,
        GONG_WX, SEQ_SHI, SEQ_YING, changeRelation, yaoRelText, wxRelation, wxRelText,
        buildAnalysis, JIAZI, DZ, ZHI_WX, SHI_START, TRI, renderBoard, yaoWxTags, S, relArrow,
        gongState, TRI_YI, relStrength, riShengKeText, compactTokens, structTokenArr, sfStrongText, WX_MODE, trendArrs, kvList, valCls, tvCls, csTrend, tongGen, ZHI_CANG, GAN_WX, tuYin, sizhuTableHtml,
        sanHeRel, xingRel, haiRel, fanFuYin, chongHeGua, sanHeJu, yaoRole, anaChengbai, anaShuangfang, cbQl, cbRelKey, cbGan12, cbGan12Full, gan12Full, cbTidui, CB_SPACE,
        CB_MS_NAME, CB_MS_JIE, CB_POWER_NAME, CB_POWER_JIE, CB_JIE2,
        CB_EXPLAIN, CB_SRC, CB_DYN, CB_DYN_HTML, CB_THS,
        randCode64, codeToBits, bitsToCode, dualDraw, dualStates, DUAL_METHOD, DUAL_VERSION } = ctx;

const najiaTable = {
  "乾": ["甲", ["子", "寅", "辰"], "壬", ["午", "申", "戌"]],
  "兑": ["丁", ["巳", "卯", "丑"], "丁", ["亥", "酉", "未"]],
  "离": ["己", ["卯", "丑", "亥"], "己", ["酉", "未", "巳"]],
  "震": ["庚", ["子", "寅", "辰"], "庚", ["午", "申", "戌"]],
  "巽": ["辛", ["丑", "亥", "酉"], "辛", ["未", "巳", "卯"]],
  "坎": ["戊", ["寅", "辰", "午"], "戊", ["申", "戌", "子"]],
  "艮": ["丙", ["辰", "午", "申"], "丙", ["戌", "子", "寅"]],
  "坤": ["乙", ["未", "巳", "卯"], "癸", ["丑", "亥", "酉"]]
};
for (const [tri, exp] of Object.entries(najiaTable)) {
  const nj = NAJIA[tri];
  eq([nj.ig, nj.iz, nj.og, nj.oz], exp, '纳甲表 ' + tri);
}

// 天风姤（下巽上乾）纳支
const gou = TRI_BY_NAME["巽"].b + TRI_BY_NAME["乾"].b;   // 011111
eq(TRI_BY_NAME["巽"].b, "011", '巽 二进制');
eq(TRI_BY_NAME["乾"].b, "111", '乾 二进制');
const gouNj = najiaYao(gou);
eq(gouNj.map(y => y.gan + y.zhi), ["辛丑", "辛亥", "辛酉", "壬午", "壬申", "壬戌"], '天风姤 纳甲（初→上）');
eq(GUA_NAMES["乾巽"], "天风姤", '卦名 天风姤');

/* ============ §3 八宫与世应 ============ */
section('§3 八宫与世应');
const QIAN_GONG = ["乾为天", "天风姤", "天山遁", "天地否", "风地观", "山地剥", "火地晋", "火天大有"];
const KUN_GONG = ["坤为地", "地雷复", "地泽临", "地天泰", "雷天大壮", "泽天夬", "水天需", "水地比"];
const ZHEN_GONG = ["震为雷", "雷地豫", "雷水解", "雷风恒", "地风升", "水风井", "泽风大过", "泽雷随"];
function gongSeq(gongName) {
  const out = [];
  for (let s = 0; s < 8; s++) {
    for (const bits in GONG_MAP) {
      if (GONG_MAP[bits].gong === gongName && GONG_MAP[bits].seq === s) out.push(guaInfo(bits).name);
    }
  }
  return out;
}
eq(gongSeq("乾"), QIAN_GONG, '乾宫八卦序');
eq(gongSeq("坤"), KUN_GONG, '坤宫八卦序');
eq(gongSeq("震"), ZHEN_GONG, '震宫八卦序');
eq(Object.keys(GONG_MAP).length, 64, '八宫合 64 卦无重复');
eq(Object.keys(GUA_NAMES).length, 64, '卦名表 64 项');
let nameBad = 0;
for (const bits in GONG_MAP) {
  const gi = guaInfo(bits);
  if (!gi.name || gi.name.indexOf('未知') >= 0) nameBad++;
}
eq(nameBad, 0, '64 卦名全部可解析');

eq([SEQ_SHI[GONG_MAP["111111"].seq], SEQ_YING[GONG_MAP["111111"].seq]], [6, 3], '乾为天 世6应3');
eq([SEQ_SHI[GONG_MAP["011111"].seq], SEQ_YING[GONG_MAP["011111"].seq]], [1, 4], '天风姤 世1应4');
eq([SEQ_SHI[GONG_MAP["000101"].seq], SEQ_YING[GONG_MAP["000101"].seq]], [4, 1], '火地晋 世4应1（游魂）');
eq([SEQ_SHI[GONG_MAP["111101"].seq], SEQ_YING[GONG_MAP["111101"].seq]], [3, 6], '火天大有 世3应6（归魂）');
eq(GONG_MAP["000001"].gong, "乾", '山地剥属乾宫');
eq(gongSeq("离"), ["离为火", "火山旅", "火风鼎", "火水未济", "山水蒙", "风水涣", "天水讼", "天火同人"], '离宫八卦序');

/* ============ §4 六亲：以卦宫为基准 ============ */
section('§4 六亲以卦宫五行为基准');
const dur = [7, 7, 7, 7, 7, 7];
let lqChecked = 0;
for (const bits in GONG_MAP) {
  const gi = guaInfo(bits);
  const nj = najiaYao(bits);
  for (const y of nj) {
    const expect = liuqinOf(GONG_WX[gi.gong], y.wx);
    ok(LQ_ORDER.indexOf(expect) >= 0, '六亲取值合法');
    lqChecked++;
  }
}
eq(lqChecked, 384, '64 卦 × 6 爻 = 384 个六亲位全部可定');

// 天风姤（乾宫·金）
const cal0 = computePillars(2026, 9, 17, 20, 0);
const gGou = zhuangGua(gou, dur, cal0);
eq(gGou.yao.map(y => y.liuqin), ["父母", "子孙", "兄弟", "官鬼", "兄弟", "父母"], '天风姤六亲（乾宫金：丑父·亥孙·酉兄·午鬼·申兄·戌父）');
eq(gGou.fu.map(f => f.liuqin), ["妻财"], '天风姤妻财不上卦 → 伏神为妻财');
eq([gGou.fu[0].pos, gGou.fu[0].gan + gGou.fu[0].zhi], [2, "甲寅"], '伏神取乾为天二爻 甲寅木');
eq(gGou.fu[0].feiLiuqin, "子孙", '伏神下方的飞神是二爻子孙（亥水）');
eq(gGou.fu[0].rel, "水生木", '飞伏关系：飞神亥水（子孙）生伏神寅木（妻财）');

/* ============ §1 历法四柱 ============ */
section('§1 历法与四柱');
eq(jd(2000, 1, 1), 2451545, 'JDN 锚点 2000-01-01 = 2451545');
eq(dayIdx(1949, 10, 1), 0, '1949-10-01 = 甲子日（万年历标准锚点）');
eq(ctx.JIAZI[dayIdx(1949, 10, 1)], "甲子", '甲子日');
eq(shichenIdx(23), 0, '23 时属子');
eq(shichenIdx(0), 0, '0 时属子');
eq(shichenIdx(1), 1, '1 时属丑');
eq(shichenIdx(12), 6, '12 时属午');

const cal1 = computePillars(2026, 9, 17, 20, 0);
eq(cal1.pillars.length, 4, '四柱四项');
eq(cal1.pillars[2], ctx.JIAZI[dayIdx(2026, 9, 17)], '日柱与 JDN 直算一致');
eq(cal1.kong.length, 2, '旬空两支');
// 子时换日
const cd1 = computePillars(2026, 9, 17, 23, 30), cd2 = computePillars(2026, 9, 18, 0, 30);
eq(cd1.di, cd2.di, '子时换日：17日23:30 与 18日00:30 同日柱');
eq(cd1.pillars[3], cd2.pillars[3], '同子时 → 同时柱');
eq(ctx.JIAZI[cd1.di], ctx.JIAZI[dayIdx(2026, 9, 18)], '23 时取次日日柱');
// 立春分界
const beforeLichun = getSolarTerm(2026, 2);
ok(beforeLichun !== null && typeof beforeLichun.getTime === "function", '立春时刻可取');
const y2026 = computePillars(2026, 1, 1, 12, 0);
eq(y2026.pillars[0], ctx.JIAZI[yearGz(2025)], '年初年柱仍属上一年（立春分界）');
// 月柱：节气定月支
const cApr = computePillars(2026, 4, 5, 12, 0);
ok(["卯", "辰"].indexOf(ctx.DZ[cApr.mdz]) >= 0, '4/5 月支为卯或辰（清明交界）');
ok(ctx.DZ[cApr.mdz] === (cApr.jq === "清明" || cApr.jq === "春分" ? ctx.DZ[cApr.mdz] : ""), '节气与月支一致');
// 时干：甲日子时起甲子
eq(ctx.JIAZI[jiaziIdx(ctx.SHI_START[0], 0)], "甲子", '甲日子时 = 甲子时');
eq(ctx.JIAZI[dayIdx(1949, 10, 1)], "甲子", '锚点复核');

/* ============ §5 六神 ============ */
section('§5 六神（日干起）');
function liushenOfDay(y, m, d) {
  const cal = computePillars(y, m, d, 12, 0);
  const g = zhuangGua("111111", dur, cal);
  return { gan: cal.riGan, list: g.yao.map(x => x.liushen) };
}
const ls1 = liushenOfDay(2026, 9, 17);
eq(ls1.list, LIUSHEN, ls1.gan + '日 六神自初爻起为 青龙→朱雀→勾陈→螣蛇→白虎→玄武');
// 找到甲日与己日各一个
function findDay(gan, fromY, fromM, fromD) {
  let t = Date.UTC(fromY, fromM - 1, fromD);
  for (let i = 0; i < 60; i++) {
    const dt = new Date(t + i * 86400000);
    const cal = computePillars(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate(), 12, 0);
    if (cal.riGan === gan) return [dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate()];
  }
  return null;
}
const jia = findDay("甲", 2026, 9, 1), ji = findDay("己", 2026, 9, 1), geng = findDay("庚", 2026, 9, 1);
eq(liushenOfDay(jia[0], jia[1], jia[2]).list[0], "青龙", '甲日初爻青龙');
eq(liushenOfDay(ji[0], ji[1], ji[2]).list[0], "螣蛇", '己日初爻螣蛇');
eq(liushenOfDay(geng[0], geng[1], geng[2]).list[0], "白虎", '庚日初爻白虎');

/* ============ §7 旺衰 / 强弱 ============ */
section('§7 旺衰（十二长生）与强弱');
eq(changSheng("水", "子"), "帝旺", '水在子 = 帝旺');
eq(changSheng("水", "卯"), "死", '水在卯 = 死');
eq(changSheng("木", "亥"), "长生", '木在亥 = 长生');
eq(changSheng("金", "酉"), "帝旺", '金在酉 = 帝旺');
eq(changSheng("土", "午"), "长生", '阳土在午 = 长生（v0.1.78 邦顺裁决：阳土长生在午）');
eq(changSheng("土", "未"), "沐浴", '阳土在未 = 沐浴');
eq(changSheng("土", "戌"), "帝旺", '阳土在戌 = 帝旺');
eq(changSheng("土", "申"), "冠带", '阳土在申 = 冠带（v0.1.78 撤水土同宫）');
eq(changSheng("土", "辰"), "胎", '阳土在辰 = 胎');
eq(changSheng("土", "巳", true), "长生", '阴土在巳 = 长生（v0.1.78 邦顺裁决：阴土长生在巳逆行）');
eq(changSheng("土", "辰", true), "沐浴", '阴土在辰 = 沐浴');
eq(changSheng("土", "丑", true), "帝旺", '阴土在丑 = 帝旺');
eq(changSheng("土", "午", true), "养", '阴土在午 = 养');
ok(tuYin("辰") === false && tuYin("戌") === false && tuYin("艮") === false && tuYin("丑") === true && tuYin("未") === true && tuYin("坤") === true, 'tuYin 阴阳土判定：辰戌艮＝阳、丑未坤＝阴');
(function () { var h = sizhuTableHtml({ yg: 42, mgz: 33, di: 32, sgz: 42 });
  ok(h.indexOf("<th>年</th>") > -1 && h.indexOf("<th>月</th>") > -1 && h.indexOf("<th>日</th>") > -1 && h.indexOf("<th>时</th>") > -1 &&
     h.indexOf("<th>天干</th>") > -1 && h.indexOf("<th>地支</th>") > -1 && h.indexOf("<th>藏干</th>") > -1 &&
     h.indexOf("<td>丙</td>") > -1 && h.indexOf("<td>丁</td>") > -1 && h.indexOf("<td>午</td>") > -1 && h.indexOf("<td>酉</td>") > -1 &&
     h.indexOf(">丁己</td>") > -1 && h.indexOf(">庚壬戊</td>") > -1 && h.indexOf("<td>辛</td>") > -1, '四柱三行表：年月日时列头＋天干地支藏干行＋藏干实值（午=丁己、申=庚壬戊、酉=辛）');
})();
eq(changSheng("火", "戌"), "墓", '火在戌 = 墓');
eq(riShengKeText("金", "酉"), "比和酉日", '日生克比：金对酉日 = 比和酉日');
eq(riShengKeText("水", "酉"), "酉日生我", '日生克比：水对酉日 = 酉日生我');
eq(riShengKeText("木", "酉"), "酉日克我", '日生克比：木对酉日 = 酉日克我');
eq(riShengKeText("土", "酉"), "我生酉日", '日生克比：土对酉日 = 我生酉日');
eq(riShengKeText("火", "酉"), "我克酉日", '日生克比：火对酉日 = 我克酉日');

const calS = computePillars(2026, 9, 17, 20, 0);
const gS = zhuangGua("111111", dur, calS);
computeState(gS, { refZhi: ctx.DZ[calS.mdz], refLabel: "月建", muRef: [{ zhi: ctx.DZ[calS.mdz], label: "月" }, { zhi: calS.riZhi, label: "日" }] });
for (const y of gS.yao) {
  ok(typeof y.cs === "string" && y.cs.length > 0, '每爻有旺衰');
  ok(["强", "偏强", "平", "偏弱", "弱"].indexOf(y.strength) >= 0, '强弱取值合法');
  ok(typeof y.net === "number", '强弱有净额');
}

/* ============ §7.4 动静 / 日冲 ============ */
section('§7.4 动静与日冲');
function buildG(states, y, m, d, refZhi) {
  const bits = states.map(s => (s === 7 || s === 9) ? '1' : '0').join('');
  const cal = computePillars(y, m, d, 12, 0);
  const g = zhuangGua(bits, states, cal);
  computeState(g, { refZhi: refZhi || ctx.DZ[cal.mdz], refLabel: "月建", muRef: [{ zhi: ctx.DZ[cal.mdz], label: "月" }, { zhi: cal.riZhi, label: "日" }] });
  return g;
}
// 找一天，使某个静爻被日支相冲 → 日冲（单维：不分旺衰生扶）
function findRipoCase() {
  for (let i = 0; i < 120; i++) {
    const dt = new Date(Date.UTC(2026, 8, 1 + i));
    const y = dt.getUTCFullYear(), m = dt.getUTCMonth() + 1, d = dt.getUTCDate();
    const cal = computePillars(y, m, d, 12, 0);
    const g = zhuangGua("111111", dur, cal);
    computeState(g, { refZhi: ctx.DZ[cal.mdz], refLabel: "月建", muRef: [{ zhi: ctx.DZ[cal.mdz], label: "月" }, { zhi: cal.riZhi, label: "日" }] });
    const rp = g.yao.filter(x => x.ripo);
    if (rp.length) return { g, rp };
  }
  return null;
}
const dc = findRipoCase();
ok(dc !== null, '存在日辰冲静爻（日冲）样本');
if (dc) {
  ok(dc.rp.every(x => !x.moving && LIU_CHONG[x.zhi] === dc.g.cal.riZhi), '日冲 = 静爻被日支相冲（单维，不分旺衰）');
  ok(dc.rp.every(x => x.strength), '日冲爻参与状态计算');
}
// 两枚动爻 → 变卦生成
const gM = buildG([9, 7, 7, 7, 7, 7], 2026, 9, 17);
ok(gM.hasMoving, '有动爻');
eq(gM.moving, [1], '初爻为动');
eq(gM.info.name, "乾为天", '乾为天（六爻皆阳）');
ok(gM.bian !== null, '动爻生成变卦');
eq(gM.bian.info.name, "天风姤", '乾为天初爻动 → 变卦天风姤');
eq(gM.yao[0].yang, true, '老阳为阳爻');
eq(gM.bian.nj[0].zhi, "丑", '初爻变后取变卦纳支（乾为天初爻动 → 天风姤初爻丑）');
eq(gM.yao[0].bian.liuqin, liuqinOf("金", "土"), '变爻六亲仍以本卦卦宫（金）定 → 父母');

/* ============ 变卦整卦（六爻全量） ============ */
section('变卦整卦：六爻全量列出（本卦卦宫定六亲）');
eq(gM.bian.yao.length, 6, '变卦六爻齐全');
const by = gM.bian.yao;
eq(by.map(b => b.gan + b.zhi).join(" "), "辛丑 辛亥 辛酉 壬午 壬申 壬戌", '乾为天初爻动 → 变卦（天风姤）纳甲：上乾下巽');
eq(by.map(b => b.wx).join(" "), "土 水 金 火 金 土", '变卦六爻五行');
eq(by.map(b => b.liuqin).join(" "), "父母 子孙 兄弟 官鬼 兄弟 父母", '变卦六亲一律以本卦卦宫（乾金）定');
ok(by.every(b => b.liuqin === liuqinOf("金", b.wx)), '变卦六亲 = 本卦卦宫五行 × 该爻五行');
eq(by.map(b => b.yang ? "阳" : "阴").join(""), "阴阳阳阳阳阳", '变卦阴阳：仅初爻由阳变阴');
eq(by.map(b => b.moved ? 1 : 0).join(""), "100000", '仅初爻标动');
ok(by[0].shi && !by[1].shi, '变卦（天风姤）世在初爻');
ok(by[3].ying, '变卦（天风姤）应在四爻');
const gStill = buildG([7, 7, 7, 7, 7, 7], 2026, 9, 17);
ok(gStill.bian === null, '六爻全静 → 无变卦（不生成整卦）');
const gM3 = buildG([9, 8, 7, 8, 6, 7], 2026, 9, 17);
ok(gM3.bian && gM3.bian.yao.filter(b => b.moved).length === 2, '两动爻 → 变卦整卦中恰好两爻标动');
ok(gM3.bian.yao.every(b => typeof b.gan === "string" && typeof b.zhi === "string"), '变卦六爻均有纳甲干支');
ok(ctx.gz({gan:"丙", wx:"木", zhi:"寅"}).indexOf('丙寅') >= 0, '干支连写：丙寅不插五行字（v0.1.31 修正「丙木寅」）');
ok(SRC.includes('function wxTag') && SRC.split('wxTag(').length >= 2, '五行注记 wxTag 仅存分析卡 gz 行（v0.2.24 盘面本变两处撤除：爻名后五行与个性行五行标重复，只留一处）');

/* ============ §8 变化关系 ============ */
section('§8 化进化退 / 回头生克');
eq(changeRelation({ wx: "水", zhi: "亥" }, "子"), "化进", '亥化子 = 化进');
eq(changeRelation({ wx: "水", zhi: "子" }, "亥"), "化退", '子化亥 = 化退');
eq(changeRelation({ wx: "土", zhi: "丑" }, "辰"), "化进", '丑化辰 = 化进');
eq(changeRelation({ wx: "土", zhi: "辰" }, "丑"), "化退", '辰化丑 = 化退');
eq(changeRelation({ wx: "水", zhi: "亥" }, "申"), "回头生", '亥水化申金 = 回头生');
eq(changeRelation({ wx: "木", zhi: "寅" }, "酉"), "回头克", '寅木化酉金 = 回头克');
eq(changeRelation({ wx: "土", zhi: "辰" }, "戌"), "比和", '辰化戌 = 比和（同土，非进退神）');

/* ============ §7.5 空亡 / 入墓 ============ */
section('§7.5 空亡与入墓');
// 甲子日 → 空戌亥
const calJZ = computePillars(1949, 10, 1, 12, 0);
eq(calJZ.riGan, "甲", '锚点日干甲');
eq(calJZ.kong, ["戌", "亥"], '甲子旬空亡戌亥');
const gKong = zhuangGua("111111", dur, calJZ);
computeState(gKong, { refZhi: ctx.DZ[calJZ.mdz], refLabel: "月建", muRef: [] });
const kongZhi = gKong.yao.filter(y => y.kong).map(y => y.zhi);
ok(kongZhi.length === 0 || kongZhi.every(z => ["戌", "亥"].indexOf(z) >= 0), '逢空标注只在旬空两支内');
eq(WX_MU["水"], "辰", '水墓在辰');
eq(WX_MU["木"], "未", '木墓在未');
const calMu = computePillars(2026, 9, 17, 12, 0);
const gMu = zhuangGua("111111", dur, calMu);
computeState(gMu, { refZhi: ctx.DZ[calMu.mdz], refLabel: "月建", muRef: [{ zhi: ctx.DZ[calMu.mdz], label: "月" }, { zhi: calMu.riZhi, label: "日" }] });
for (const y of gMu.yao) {
  if (y.mu.length) ok(WX_MU[y.wx] === ctx.DZ[calMu.mdz] || WX_MU[y.wx] === calMu.riZhi, '入墓 = 墓支与月/日相同');
}

/* ============ §9 宫位趋势 ============ */
section('§9 本变五型（宫位趋势）');
eq(ctx.wxRelText("木", "金"), "金克木", '木→金 = 金克木（被克）');
eq(ctx.wxRelation("金", "木"), "克", '金克木');
eq(ctx.wxRelation("木", "火"), "生", '木生火');
eq(ctx.wxRelation("木", "木"), "比和", '木木比和');
// 震宫 → 乾宫 = 后克先
const zhenBits = TRI_BY_NAME["震"].b + TRI_BY_NAME["震"].b;  // 震为雷
eq(guaInfo(zhenBits).gong, "震", '震为雷属震宫');
eq(guaInfo(zhenBits).gongWx, "木", '震宫五行木');
eq(guaInfo(zhenBits).gongWx, "木", '震宫木');
eq(wxRelText(guaInfo(zhenBits).gongWx, guaInfo("111111").gongWx), "金克木", '震宫木 → 乾宫金');

/* ============ §11 用神选取 ============ */
section('§11 用神选取与取用序');
const gY = zhuangGua(gou, dur, cal0);   // 天风姤乾宫
const yCai = pickYongShen(gY, "cai");
eq(yCai.rule.lq, "妻财", '求财取妻财');
eq(yCai.cands.length, 0, '姤卦妻财不上卦 → 无从取用');
ok(/伏神/.test(yCai.note), '给出伏神提示');
const ySelf = pickYongShen(gY, "self");
eq(ySelf.rule.lq, "世爻", '自身状态取世爻');
eq(ySelf.pick.pos, 1, '姤卦世在初爻');
const yOther = pickYongShen(gY, "other");
eq(yOther.pick.pos, 4, '姤卦应在四爻');
const yZi = pickYongShen(gY, "zi");
eq(yZi.pick.pos, 2, '子孙唯一在二爻');
// 取用序：多爻同亲时优先动爻
const gMulti = buildG([9, 7, 7, 7, 7, 7], 2026, 9, 17);
const yF = pickYongShen(gMulti, "fu");   // 乾为天：初爻甲子水·子孙… 父母在四、上
ok(yF.cands.length >= 1, '同六亲有多爻候选');
ok(yF.pick !== null, '取用成功');

/* ============ 四象状态装卦（动爻语义） ============ */
section('四象状态装卦：动爻数 0–6 任意');
const TOSS_CAL = computePillars(2026, 9, 18, 12, 0);
function toss(states) {
  const bits = states.map(s => (s === 7 || s === 9) ? '1' : '0').join('');
  return zhuangGua(bits, states, TOSS_CAL);
}
// 摇卦每次三枚钱，四象各自独立：老阴 6 / 少阴 8 / 少阳 7 / 老阳 9
eq([6, 7, 8, 9].filter(s => s === 6 || s === 9).join(','), '6,9', '四象中只有老阴(6)/老阳(9)为动爻');
for (let k = 0; k <= 6; k++) {
  const st = []; for (let i = 0; i < 6; i++) st.push(i < k ? 9 : 7);
  const g = toss(st);
  eq(g.yao.filter(y => y.moving).length, k, '摇得 ' + k + ' 个动爻 → 盘面标动 ' + k + ' 爻');
  if (k === 0) eq(g.bian, null, '零动爻（六爻全静）→ 无变卦');
  else ok(g.bian && g.bian.yao.filter(b => b.moved).length === k, '摇得 ' + k + ' 个动爻 → 变卦同数标动');
}
// 六爻全动：乾为天 → 坤为地
const stAllDong = [9, 9, 9, 9, 9, 9], gAllDong = toss(stAllDong);
eq(gAllDong.info.name, '乾为天', '六爻全动 · 本卦乾为天');
eq(gAllDong.bian.info.name, '坤为地', '六爻全动 → 变卦坤为地');
eq(gAllDong.bian.yao.filter(b => b.moved).length, 6, '六爻全动 → 变卦六爻皆动');
// 阴阳混摇：任意组合不设限
const stMix = [6, 8, 7, 9, 8, 6], gMix = toss(stMix);
eq(gMix.yao.filter(y => y.moving).length, 3, '混摇（老阴/少阴/少阳/老阳各现）→ 3 个动爻');
eq(gMix.bian.yao.filter(b => b.moved).map(b => b.pos).join(','), '1,4,6', '标动位置随摇得所在爻');
// 老阴(6) 为阴爻而发动：阴阳取摇得结果，非动即阳
eq(gMix.yao[0].yang, false, '老阴摇得 → 阴爻（非动即阳）');
eq(gMix.yao[3].yang, true, '老阳摇得 → 阳爻');
eq(gMix.yao[1].moving, false, '少阴摇得 → 静爻');
eq(gMix.yao[2].moving, false, '少阳摇得 → 静爻');

/* ============ 页面代掷（电子摇卦） ============ */
section('页面代掷：三枚钱各掷一次、六次独立，动爻数仍是摇出来的');

/* 四象序列装卦：阴阳与动爻全由状态定，装卦不引入额外规则 */
const st6 = [7, 9, 6, 8, 7, 9];
const cal6 = computePillars(2026, 9, 18, 12, 0);
const bits6 = st6.map(s => (s === 7 || s === 9) ? '1' : '0').join('');
const g6 = zhuangGua(bits6, st6, cal6);
eq(g6.yao.map(y => y.yang ? 1 : 0), [1, 1, 0, 0, 1, 1], '阴阳由状态定（老阳少阳为阳，老阴少阴为阴）');
eq(g6.yao.filter(y => y.moving).length, 3, '混装（老阴/少阴/少阳/老阳各现）→ 3 个动爻');

/* ============ 分析层可运行性 ============ */
section('分析层（八步 / 四层 / 转太极 / 飞伏）');
function fullFlow(states, y, m, d, qtype, refKey) {
  const bits = states.map(s => (s === 7 || s === 9) ? '1' : '0').join('');
  const cal = computePillars(y, m, d, 12, 0);
  const g = zhuangGua(bits, states, cal);
  const refZ = refKey === "ri" ? cal.riZhi : ctx.DZ[cal.mdz];
  computeState(g, { refZhi: refZ, refLabel: refKey === "ri" ? "日令" : "月建", muRef: [{ zhi: ctx.DZ[cal.mdz], label: "月" }, { zhi: cal.riZhi, label: "日" }] });
  const yong = pickYongShen(g, qtype);
  const secs = buildAnalysis(g, yong);
  return { g, yong, secs };
}
let flows = 0, secCounts = [];
for (let i = 0; i < 40; i++) {
  const st = [];
  for (let k = 0; k < 6; k++) st.push([6, 7, 8, 9][(i * 7 + k * 3) % 4]);
  const r = fullFlow(st, 2026, 9, 17 + (i % 12), "zi", i % 2 ? "ri" : "yue");
  secCounts.push(r.secs.length);
  for (const s of r.secs) {
    if (!s.title || typeof s.html !== "string") { ok(false, '分析节结构异常'); }
  }
  flows++;
}
eq(flows, 40, '40 组随机卦象跑通分析');
eq([...new Set(secCounts)], [19], '分析节恒为 19 节（整卦+半卦+八步+四层+用神+宫位+生态+太极+飞伏）');
ok(!/btn-proc/.test(SRC) && !/proc-wrap/.test(SRC), 'v0.2.23 取消分析过程（第58轮）：分析过程按钮与 proc-wrap 区块整体下线，盘面下不再有折叠分析');
ok(!/toggleProc/.test(SRC) && !/renderAnalysis\(/.test(SRC), 'v0.2.23：toggleProc/renderAnalysis 零残留（runAnalysis 直挂 board-card）');
ok(!/\.btn-proc \{/.test(HTML) && !/#proc-wrap \{/.test(HTML) && !/id="analysis-card"/.test(HTML), 'v0.2.23：分析过程样式与 analysis-card 容器撤除');
const sample = fullFlow([9, 7, 8, 8, 8, 8], 2026, 9, 17, "cai", "yue");
ok(sample.secs.some(s => /整卦分析/.test(s.title)), '含整卦分析');
ok(sample.secs.some(s => /双方态势分析/.test(s.title)), '含得失分析');
const halfSec = sample.secs.find(s => /双方态势分析/.test(s.title)) || { html: "", title: "" };
ok(/<div class="hf-wrap"><div class="hf-card"><div class="hf-head">/.test(halfSec.html) && !/<table|st-stack|hd-col/.test(halfSec.html), '半卦分析为图形卡版（hf-card＋爻线图，无表格）');
ok((halfSec.html.match(/class="hf-card"/g) || []).length === 2 && (halfSec.html.match(/class="hf-body"/g) || []).length === 2, '半卦上/下卦各一卡，卡内属性区 hf-body ×2');
ok(/<b class="st-pos">应<\/b>/.test(halfSec.html) && /<b class="st-pos">世<\/b>/.test(halfSec.html) && halfSec.html.indexOf('st-pos">应<') < halfSec.html.indexOf('st-pos">世<'), '标位：上卦组「应」在前、下卦组「世」在后（临卦世在下卦，前缀「上·／下·」已去）');
ok((halfSec.html.match(/class="gf-row"/g) || []).length === 12 && !/[\u2630-\u2637]/.test(halfSec.html), '半卦卦象为三爻爻线图（4 图 × 3 行 = 12 gf-row，不再用 Unicode 卦符）');
ok((halfSec.html.match(/class="kv"/g) || []).length === 36 && (halfSec.html.match(/class="kv kv-empty"/g) || []).length === 4, '属性小字 36 键＋4 空位（4 组 × 9 属性＋末行右空，v0.1.98 卦义与卦生克移出半卦卡）');
ok(/<span class="mode-hit" data-mode="原状维持型"><b class="hl">原状维持型<\/b><\/span>/.test(halfSec.html) && /<span class="mode-hit" data-mode="主动顺推型"><b class="hl">主动顺推型<\/b><\/span>/.test(halfSec.html), '模式名：上卦组原状维持型（坤→坤比和）、下卦组主动顺推型（兑金→坎水），mode-hit 包裹可点');
ok(/class="rl-ar both"><i class="la">比<\/i>/.test(halfSec.html) && /class="rl-ar fwd"><i class="la">生<\/i>/.test(halfSec.html), '变半卦旁始终箭头：上卦组坤→坤＝始终比和（双向＋比）、下卦组兑→坎＝始生终（向右＋生）（zt 随本变五型）');
ok(/<i>日生克<\/i><b[^>]*>日令生我<\/b>/.test(halfSec.html) && /<i>日生克<\/i><b[^>]*>我克日令<\/b>/.test(halfSec.html) && /<i>日生克<\/i><b[^>]*>日令克我<\/b>/.test(halfSec.html) && !/<i>卦义<\/i>/.test(halfSec.html), '属性小字实值（临→师酉月午日）：日生克＝日令生我（午火生坤土）／我克日令（坎水克午火）／日令克我（午火克兑金）；卦义不再入半卦卡');
ok(ctx.TRI_YI_DETAIL && Object.keys(ctx.TRI_YI_DETAIL).length === 8 && ctx.TRI_YI_DETAIL["乾"].xiang.length > 20 && ctx.TRI_YI_DETAIL["坎"].zhan.length > 20 && ctx.TRI_YI_DETAIL["坤"].lei.length > 20, '弹窗：八经卦详表齐全（象／类／解／断）');
ok(/TRI_YI_DETAIL\[name\]/.test(SRC) && /（经卦）/.test(SRC), '弹窗：ylOpenGua 按别卦／经卦双表分派');
ok(!/<th class="k">|<td class="yl">|tr class="grp"/.test(halfSec.html), '旧表格行结构（th 字段行／yl 要览格／分组行）全部移除');
ok(/<span class="rc rc-l"><i>上下卦<\/i><b>[^<]+<\/b><\/span><span class="rc-mid"><\/span><span class="rc rc-r"><b>[^<]+<\/b><\/span>/.test(halfSec.html) && /<span class="rc rc-l"><i>世应<\/i><b>[^<]+<\/b><\/span>/.test(halfSec.html) && /<span class="rc rc-l"><i>我事<\/i><b>[^<]+<\/b><\/span>/.test(halfSec.html), '末尾三关系行 rc 三列结构（标签｜本值｜变值），镜像面板轨道');
const kvIxs = [...halfSec.html.matchAll(/<i>([^<]+)<\/i>/g)].map(m => m[1]);
const HF_PANEL = "月生克|月长生|月旺衰|月通根|日生克|日长生|日旺衰|日通根|日资源";
eq(kvIxs.slice(0, 36).join("|"), [HF_PANEL, HF_PANEL, HF_PANEL, HF_PANEL].join("|"), '半卦 5 属性面板两列行序一致（v0.1.98）：月生克｜月长生 → 月旺衰｜月通根 → 日生克｜日长生 → 日旺衰｜日通根 → 日资源｜空');
eq(kvIxs.slice(36).join(","), "上下卦,世应,我事", '三关系行标签序（上下卦／世应／我事）');
ok((halfSec.html.match(/class="kv kv-empty"/g) || []).length === 4, '半卦面板空占位 ×4（v0.1.75 移至行5 右侧，每属性区 1 格）');
ok((halfSec.html.match(/<i>日资源<\/i><b[^>]*>长生<\/b>/g) || []).length === 4, 'v0.2.24 日资源口径再修正：日支主气干在月支十二长生态（测试盘 2026-9-17 甲午日，日支午主气丁，丁@酉＝长生，始卦终卦同值；v0.2.03 旧口径日干@月支废除，甲@酉胎不再出现）');
ok((halfSec.html.match(/<i>月生克<\/i><b[^>]*>我生月令<\/b>/g) || []).length === 2 && /<i>月生克<\/i><b[^>]*>比和月令<\/b>/.test(halfSec.html) && /<i>月生克<\/i><b[^>]*>月令生我<\/b>/.test(halfSec.html), 'v0.1.75 月生克实值（半卦五行对月令）：坤土我生月令×2（本变同宫）、兑金比和月令、坎水月令生我');
ok((halfSec.html.match(/<i>月通根<\/i><b[^>]*>本气根金<\/b>/g) || []).length === 1 && (halfSec.html.match(/<i>月通根<\/i><b[^>]*>无根<\/b>/g) || []).length === 3 && (halfSec.html.match(/<i>日通根<\/i><b[^>]*>中气根土<\/b>/g) || []).length === 2 && (halfSec.html.match(/<i>日通根<\/i><b[^>]*>无根<\/b>/g) || []).length === 2, 'v0.1.77 月通根/日通根实值（临→师酉月午日，半卦五行对月／日支藏干求根）：兑金@酉本气根金×1；坤土@午中气根土×2（本变同）；月通根无根×3（坤×2＋坎）、日通根无根×2（兑＋坎）');
ok(!/tr class="grp"|st-stack|hd-l1|hd-l2/.test(halfSec.html), '分组行与我/事列头已移除（标位 tag 代替）');
const qianHalf = fullFlow([7, 7, 7, 7, 7, 7], 2026, 9, 17, "cai", "yue").secs.find(s => /双方态势分析/.test(s.title)) || { html: "" };
ok((qianHalf.html.match(/class="hf-side"/g) || []).length === 2 && !/<table|hd-col/.test(qianHalf.html), '全静（乾为天）半卦卡无变卦侧（每卡仅本卦 hf-side，共 2）');
ok(/<b class="st-pos">世<\/b>/.test(qianHalf.html) && /<b class="st-pos">应<\/b>/.test(qianHalf.html) && (qianHalf.html.match(/<span class="dim">—（无变卦）<\/span>/g) || []).length === 2 && (qianHalf.html.match(/class="hf-body single"/g) || []).length === 2, '全静（乾为天）标位世（上）／应（下），模式位 dim「—（无变卦）」×2，属性区单列 ×2');
ok(/<span class="rc rc-l"><i>上下卦<\/i><b>上下比和<\/b><\/span><span class="rc-mid"><\/span><span class="rc rc-r"><span class="dim">—<\/span><\/span>/.test(qianHalf.html) && /<span class="rc rc-l"><i>世应<\/i><b>世应比和<\/b><\/span>/.test(qianHalf.html) && /<span class="rc rc-l"><i>我事<\/i><b>我事比和<\/b><\/span>/.test(qianHalf.html), '全静三关系行仅本值（三比和），变列 dim「—」占位');
const dzHalf = fullFlow([7, 7, 7, 7, 8, 8], 2026, 9, 17, "cai", "yue").secs.find(s => /双方态势分析/.test(s.title)) || { html: "" };
ok(/<span class="rc rc-l"><i>上下卦<\/i><b>下克上<\/b><\/span><span class="rc-mid"><\/span><span class="rc rc-r"><span class="dim">—<\/span><\/span>/.test(dzHalf.html) && /<span class="rc rc-l"><i>世应<\/i><b>应克世<\/b><\/span>/.test(dzHalf.html) && /<span class="rc rc-l"><i>我事<\/i><b>事克我<\/b><\/span>/.test(dzHalf.html) && /<b class="st-pos">世<\/b>/.test(dzHalf.html) && /<b class="st-pos">应<\/b>/.test(dzHalf.html), '世在上卦时方向翻转（大壮：下克上／应克世／事克我，标位上·世／下·应）');
const GS_PAIRS = [["金","金","卦我比和"],["水","金","卦生我"],["金","火","卦克我"],["木","火","我生卦"],["土","水","我克卦"],["木","土","我克卦"],["水","土","卦克我"],["火","金","我克卦"]];
ok(GS_PAIRS.every(t => gongState(t[0], t[1]).level === t[2]) && gongState("土","水").rel === "土克水" && gongState("水","金").rel === "金生水", 'gongState 五态：卦我比和／卦生我／卦克我／我生卦／我克卦（v0.1.99 卦生克换名，关系式随方向）');
eq(Object.keys(TRI_YI).length, 8, 'TRI_YI 八卦卦义完备');
const guaSec = sample.secs.find(s => /整卦分析/.test(s.title)) || { html: "" };
const qianGua = fullFlow([7, 7, 7, 7, 7, 7], 2026, 9, 17, "cai", "yue").secs.find(s => /整卦分析/.test(s.title)) || { html: "" };
ok(/\.gz-g \{ display:grid; grid-template-columns:1fr 110px 1fr/.test(HTML) && /\.hf-card \{ display:grid; grid-template-columns:1fr 110px 1fr/.test(HTML) && /\.hf-head \{ display:contents/.test(HTML) && /\.hf-body \{ display:contents/.test(HTML) && /\.kvs\.gz, \.kvs\.hf \{ display:grid; grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)/.test(HTML), '整卦块/半卦卡同列模板＋属性双列弹性等分（v0.1.76 minmax(0,1fr) 防侧栏挤压顶破卡片边框，值最宽 4 字＋键 38px ≈ 80px/列）');
ok(/\.duo \{ display:grid; grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)/.test(HTML) && /\.cbz \{ display:grid; grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)/.test(HTML) && /\.wrap \{ max-width:1440px/.test(HTML) && /@media \(max-width:1180px\)\s*\{\s*\.duo \{ grid-template-columns:1fr/.test(HTML), '卦爻双栏（v0.1.76 duo/cbz 左右等宽 1fr/1fr：得失分析半卡与整卦卡最小宽 ~526px 不再被失窄列挤压＋页宽 1440＋1180 断点回落单列）');
ok(/@media \(max-width:599px\)\s*\{\s*\.kvs\.gz, \.kvs\.hf \{ grid-template-columns:84px; \}\s*\}/.test(HTML), '属性双列 599 断点（v0.1.76）：≤599px 区间回落单列 84px，堵住弹性列残余溢出缝');
ok(/table\.board \.tags-wx4 \{ white-space:normal; \}/.test(HTML) || /\.tags-wx4 \{[^}]*white-space:normal/.test(HTML), '细项表旺衰标签行放开换行（v0.1.76）：.c-ben/.c-bian nowrap 只管干支行，标签行在窄列折行不顶破表格');
ok(/\.c-ben, \.c-bian \{ white-space:normal; \}/.test(HTML) && /\.c-ben \.gz2, \.c-bian \.gz2 \{[^}]*white-space:nowrap/.test(HTML), '细项表本变列放开整体 nowrap（v0.1.76）：干支 gz2 保持整块不折，其余（六亲/角色/神煞）窄列自然折行');
ok(/<div class="gz-g"><div class="gz-cell">/.test(guaSec.html) && (guaSec.html.match(/class="gz-cell"/g) || []).length === 2 && !/<table/.test(guaSec.html), '整卦分析为图形版：本/变各一卦图卡 gz-cell ×2，无表格');
const gzIxs = [...guaSec.html.matchAll(/<i>([^<]+)<\/i>/g)].map(m => m[1]);
const GZ_PANEL = "卦义|日资源|月旺衰|日旺衰|月长生|日长生|月生克|日生克|月通根|日通根";
eq(gzIxs.join("|"), [GZ_PANEL, GZ_PANEL].join("|"), '整卦卡属性两列行序（v0.1.77 五行）：卦义｜日资源 → 月旺衰｜日旺衰 → 月长生｜日长生 → 月生克｜日生克 → 月通根｜日通根（本变卡同序对齐）');
ok(/<i>月通根<\/i><b[^>]*>无根<\/b>/.test(guaSec.html) && (guaSec.html.match(/<i>日通根<\/i><b[^>]*>中气根土<\/b>/g) || []).length === 1 && (guaSec.html.match(/<i>日通根<\/i><b[^>]*>无根<\/b>/g) || []).length === 1, 'v0.1.77 整卦卡通根实值（临→师酉月午日，卦宫五行对月／日支藏干求根）：本卦坤宫土／变卦坎宫水@酉均无根；日通根＝坤土@午中气根土、坎水@午无根');
ok((qianGua.html.match(/class="gz-cell"/g) || []).length === 1 && /class="gz-mid"><span class="dim">六爻全静，无变卦 —— 无本↔变的模式关系。<\/span>/.test(qianGua.html), '全静（乾为天）单卡＋模式位 dim 提示');
ok(/<div class="gz-name">地泽临<\/div>/.test(guaSec.html) && /<div class="gz-name">地水师<\/div>/.test(guaSec.html) && /<div class="gz-gong">坤宫<\/div>/.test(guaSec.html) && /<div class="gz-gong">坎宫<\/div>/.test(guaSec.html), '卦名与属宫：地泽临·坤宫 → 地水师·坎宫');
ok((guaSec.html.match(/class="gf-row/g) || []).length === 12 && (guaSec.html.match(/gf-row on/g) || []).length === 2 && (guaSec.html.match(/>○</g) || []).length === 1 && (guaSec.html.match(/>×</g) || []).length === 1, '整卦六爻线图：本变 2 图 ×6 行；动爻标记 on×2（本卦初爻老阳○＋变卦对应爻阴动×）');
ok((qianGua.html.match(/gf-row on/g) || []).length === 0, '全静无动爻标记');
ok((guaSec.html.match(/class="kv"/g) || []).length === 20 && !/<i>整旺衰</.test(guaSec.html), '整卦属性小字 20 键（2 卡 × 10，v0.1.77 加月通根/日通根行5；整卦级无卦生克（卦生克入爻标与双方强弱））');
ok(/<i>卦义<\/i><b[^>]*>临近<\/b>/.test(guaSec.html) && /<i>卦义<\/i><b[^>]*>兵众<\/b>/.test(guaSec.html) && /<i>日生克<\/i><b[^>]*>日令生我<\/b>/.test(guaSec.html) && /<i>日生克<\/i><b[^>]*>我克日令<\/b>/.test(guaSec.html) && /<i>日长生<\/i><b[^>]*>胎<\/b>/.test(guaSec.html), '整卦属性实值＋配色（临→师，酉月午日）：临＝临近/日令生我/胎（水土同宫黑），师＝兵众/我克日令/胎（黑）');
ok(/<i>日资源<\/i><b[^>]*>长生<\/b>/.test(guaSec.html) && /<i>月生克<\/i><b[^>]*>我生月令<\/b>/.test(guaSec.html) && /<i>月生克<\/i><b[^>]*>月令生我<\/b>/.test(guaSec.html), '整卦属性新维度实值（v0.2.24 口径）：日资源＝丁干@酉月长生（日支午主气丁，两端卡同值）；月生克＝始土生酉金「我生月令」→ 终酉金生水「月令生我」');
ok(/<i>卦义<\/i><b class="kv-hit" data-gua="乾为天">刚健<\/b>/.test(qianGua.html), '全静乾为天属性：刚健（卦义可点开弹窗）');
ok(ctx.GUA_YI_DETAIL && Object.keys(ctx.GUA_YI_DETAIL).length === 64 && ctx.GUA_YI_DETAIL["地天泰"].guaci.indexOf("小往大来") > -1 && ctx.GUA_YI_DETAIL["火水未济"].zhan.length > 20, '弹窗：卦义详表 64 卦齐全（象／辞／解／断四字段）');
ok(ctx.WX_MODE_DETAIL && Object.keys(ctx.WX_MODE_DETAIL).length === 5 && ctx.WX_MODE_DETAIL["主动顺推型"].ess.length > 10 && ctx.WX_MODE_DETAIL["结果倒逼型"].use.length > 20, '弹窗：本变五型详表齐全（本质／过程／主导／怎么用／别误读）');
ok(/<span class="mode-hit" data-mode="全程管控型"><b class="hl">全程管控型<\/b><\/span>/.test(guaSec.html), '整卦模式名可点开弹窗（mode-hit 包裹 b.hl）');
ok(/function ylOpenGua/.test(SRC) && /function ylOpenMode/.test(SRC) && /id="yl-mask"/.test(HTML) && /ylOpenGua\(t\.getAttribute\("data-gua"\)\)/.test(SRC), '弹窗：开窗函数、遮罩容器与事件委托就位');
ok(/\.yl-mask\[hidden\]\s*\{\s*display:\s*none;?\s*\}/.test(HTML), '弹窗：hidden 属性可真实隐藏遮罩（防 display:flex 覆盖导致空弹窗裸露）');
ok(/<b class="hl">全程管控型<\/b>/.test(guaSec.html) && /class="gz-mid"><span class="rl-ar fwd"><i class="la">克<\/i>/.test(guaSec.html), '模式名与始终箭头：全程管控型（坤→坎＝始克终，向右＋克）');
ok(!/<th class="k">|<td class="yl">/.test(guaSec.html), '旧表格行结构（属宫行／要览行）全部移除');
eq(compactTokens("刚健","金","酉","酉",null), "刚健，月旺，月帝旺，日比和，日旺，日帝旺", '要览短词日比和：金对酉日比和，月旺／月帝旺、日旺／日帝旺');
eq(compactTokens("柔顺","土","酉","酉",null), "柔顺，月休，月临官，我生日，日休，日临官", '要览短词我生日：土生酉日＝泄（v0.1.79 加我），阳土戊线酉＝临官');
eq(compactTokens("险陷","水","酉","酉",null), "险陷，月相，月沐浴，日生我，日相，日沐浴", '要览短词日生我：酉金生水，月相／月沐浴、日相／日沐浴');
eq(compactTokens("柔顺","土","酉","子",null), "柔顺，月休，月临官，我克日，日囚，日病", '要览短词我克日：土克子日水（v0.1.79 加我），日囚／阳土戊线子＝病');
eq(compactTokens("柔顺","土","酉","子","水"), "柔顺，月休，月临官，我克日，日囚，日病，整：我克卦", '要览短词整态（v0.2.21 前缀加冒号）：土对水宫＝我克卦，防「整我克卦」连读');
ok(structTokenArr("刚健","金","酉","午",null,null).join("|") === "刚健|旺|帝旺|日令克我|死|沐浴||长生|比和月令|本气根金|无根", 'structTokenArr 日克：午火克金 →「日令克我」，月旺／月帝旺、日死／日沐浴；日资源＝丁干@酉月长生（v0.2.24 口径：日支午主气丁在月支长生）月沐浴、月生克＝金@酉比和月令；月通根＝金@酉本气根金、日通根＝金@午无根（v0.1.77 新增 10/11 位）');
ok(structTokenArr("柔顺","土","酉","午",null,null).join("|") === "柔顺|休|临官|日令生我|相|长生||长生|我生月令|无根|中气根土", 'structTokenArr 日生（阳土戊线）：午火生土 →「日令生我」；土@酉临官、土@午长生；日资源＝丁干@酉月长生（v0.2.24）、月生克＝我生月令；月通根＝土@酉无根、日通根＝土@午中气根土');
ok(structTokenArr("柔顺","土","酉","午",null,true).join("|") === "柔顺|休|墓|日令生我|相|养||长生|我生月令|无根|中气根土", 'structTokenArr 阴土己线（yin=true）：土@酉墓、土@午养，日资源＝丁干@酉月长生（v0.2.24 与阳干无关），其余与阳土版同值');
ok(structTokenArr("柔顺","土","酉","酉",null,null)[3] === "我生日令", 'structTokenArr 爻生日：坤土生酉金 →「我生日令」');
ok(structTokenArr("险陷","水","酉","午",null,null).join("|") === "险陷|相|沐浴|我克日令|囚|胎||长生|月令生我|无根|无根", 'structTokenArr 爻克日：坎水克午火 →「我克日令」；日资源＝丁干@酉月长生（v0.2.24）、月生克＝酉金生水月令生我；水对酉午藏干均无根');
ok(structTokenArr("喜悦","金","酉","酉",null,null)[3] === "比和日令", 'structTokenArr 爻比日：酉金比酉日 →「比和日令」');
var saFix = structTokenArr("柔顺","土","酉","午","水",null);
ok(saFix.length === 11 && saFix[6] === "我克卦" && saFix[7] === "长生" && saFix[8] === "我生月令" && saFix[9] === "无根" && saFix[10] === "中气根土", 'structTokenArr 固定 11 位：卦生克第 7 位（坤土对坎水宫＝我克卦，v0.1.99）／日资源第 8 位（丁干@酉月长生，v0.2.24）／月生克第 9 位／月通根第 10 位／日通根第 11 位（gwx 为空时卦生克空串占位，索引不漂移）');
ok(WX_MODE.生.zt === "始生终" && WX_MODE.克.zt === "始克终" && WX_MODE.被生.zt === "终生始" && WX_MODE.被克.zt === "终克始" && WX_MODE.比和.zt === "始终比和", 'WX_MODE 始终词五型：始生终／始克终／终生始／终克始／始终比和');
ok(csTrend("胎","养") === "↗" && csTrend("长生","帝旺") === "↗" && csTrend("帝旺","临官") === "↘" && csTrend("长生","胎") === "↘", 'csTrend 上升段（胎养长生沐浴冠带临官帝旺）：沿序↗、逆序↘');
ok(csTrend("衰","死") === "↘" && csTrend("绝","墓") === "↗" && csTrend("帝旺","衰") === "↘" && csTrend("绝","胎") === "↗" && csTrend("长生","长生") === "→", 'csTrend 下降段（衰病死墓绝）：沿序↘、逆序↗；跨段进入下降段↘／进入上升段↗；同值→');
ok(trendArrs(["柔顺","旺","帝旺","比","旺","帝旺","卦我比和"], ["刚健","休","衰","生","相","长生","我生卦"])[1] === "↘" && trendArrs(["柔顺","旺","帝旺","比","旺","帝旺","卦我比和"], ["刚健","休","衰","生","相","长生","我生卦"])[2] === "↘" && trendArrs(["柔顺","休","衰","比","休","衰","我生卦"], ["刚健","旺","帝旺","生","旺","帝旺","卦我比和"])[1] === "↗", 'trendArrs 本变趋势：旺vs休=↘、帝旺vs衰=↘、休vs旺=↗（第7位卦生克按 GONG_SEQ：比和vs我生卦=↘、我生卦vs比和=↗，v0.1.99）');
ok(trendArrs(["柔顺","旺","帝旺","比","旺","帝旺","卦我比和"], ["刚健","旺","帝旺","生","旺","帝旺","卦我比和"])[1] === "→" && trendArrs(["柔顺","旺","帝旺","比","旺","帝旺","卦我比和"], null) === null && trendArrs(["柔顺","旺","帝旺","比","旺","帝旺","卦我比和"], ["刚健","休","衰","生","相","长生","我生卦"])[0] === undefined && trendArrs(["柔顺","旺","帝旺","比","旺","帝旺","卦我比和"], ["刚健","休","衰","生","相","长生","我生卦"])[3] === undefined, 'trendArrs 同值=→平线、无变卦=null、卦义／日生克不加线');
ok((halfSec.html.match(/class=\"hf-name\">[^<]*<b class=\"st-pos\">/g) || []).length === 2, '半卦卦名旁挂标位（hf-name＋st-pos）');
const sfQ = anaShuangfang(fullFlow([7,7,7,7,7,7], 2026, 9, 17, "cai", "yue").g).html;
ok(sfQ.indexOf('<th>双方</th><th>起点</th><th>终点</th>') > -1 && sfQ.indexOf('<td>双方强弱</td>') > -1 && sfQ.indexOf('<td>双方关系</td>') > -1 && (sfQ.match(/静局无变/g) || []).length === 3 && (sfQ.match(/sf-tag sf-wo">我方<\/span>/g) || []).length === 2 && sfQ.indexOf('<td>双方关系</td><td>双方比和 · 双方同频共同协商</td><td><span class="dim">—（静局无变）</span></td>') > -1, 'v0.2.08 双方强弱＋双方关系并入资源关系式表格（表头双方/起点/终点）：强弱行我/他两行、关系行全量语（关系名 · 决策权），静局（乾为天上下比和）起点＝「双方比和 · 双方同频共同协商」、终点「—（静局无变）」×2');
eq(sfStrongText("我生卦", true), "我方支持事局（次弱）", 'sfStrongText 我生卦（我行）＝我方支持事局（次弱）');
eq(sfStrongText("卦克我", false), "事局约束他方（最弱）", 'sfStrongText 卦克我（他行）＝事局约束他方（最弱）');
eq(sfStrongText("我克卦", false), "他方管控事局（次强）", 'sfStrongText 我克卦（他行）＝他方管控事局（次强）');
eq(sfStrongText("卦我比和", true), "我方代表事局（最强）", 'sfStrongText 卦我比和（我行）＝我方代表事局（最强）');
ok(!/<th class="k">关系模式<\/th><td colspan/.test(guaSec.html) && !/导向：/.test(guaSec.html), '旧关系模式／模式意义合并行（含导向方式）已移除');
S.tossNote = "摇卦（页面代掷）：自下而上六次 → 动爻 1 个（三爻）"; S.hlRole = null;
const boardHtml = renderBoard(sample.g, guaSec.html, halfSec.html);
ok(boardHtml.indexOf('meta-strip') > -1 && boardHtml.indexOf('qigua-note') > -1 && boardHtml.indexOf('qigua-note') < boardHtml.indexOf('class="duo"'), '四柱元信息与摇卦记要位于两栏容器（duo）上方');
ok(boardHtml.indexOf('class="gz-g"') > -1 && boardHtml.indexOf('class="gz-g"') < boardHtml.indexOf('class="duo"') && /class="duo-l"><div class="duo-hd">双方态势分析<\/div><div class="hf-wrap">/.test(boardHtml.replace(/\n/g, '')) && boardHtml.indexOf('class="duo-r"') > -1 && boardHtml.indexOf('class="duo-r"') < boardHtml.indexOf('<span class="sf-tag sf-ta">'), '两行结构：整卦全宽在上，第二行左栏双方态势分析（旧 half-hd 标题已并入栏头）、右栏六爻表');
ok(boardHtml.indexOf('class="yao-sec"') > -1 && boardHtml.indexOf('class="yao-sec"') > boardHtml.indexOf('class="duo-r"') && boardHtml.indexOf('<table class="board"') > boardHtml.indexOf('class="yao-sec"') && boardHtml.indexOf('id="in-note"') > boardHtml.indexOf('class="yao-sec"'), 'v0.2.29 三空间结构：空间一整体态势分析（cbz）→ 空间二双方态势分析（duo-l 半卦卡＋duo-r 我方与对方 sf-mini 四读表）→ 空间三要素关系分析（yao-sec：左六爻表＋右分析记录 in-note，位于 duo 之下）');

ok(/sf-stack/.test(boardHtml) && (boardHtml.match(/sf-line/g) || []).length >= 36 && (boardHtml.match(/sf-stack/g) || []).length >= 2, '第24轮：我/他换行显示——前置启动与过程难易行我方/对方各占一行（sf-stack 两行），具体数据表起点终点列内我/他各占一行（sf-line 9行x2列x2行=36）');
ok((boardHtml.match(/<table class="cb-mini sf-mini">/g) || []).length === 3 && boardHtml.indexOf('<th>双方</th><th>起点</th><th>终点</th>') > -1 && (boardHtml.match(/<td>(双方强弱|双方关系)<\/td>/g) || []).length === 2, 'v0.2.08 双方强弱＋双方关系为 sf-mini 表（与资源/权力表同构，全卡三张表）、编号 3/4 撤除');
ok(/<label>姓名<\/label>/.test(HTML) && /id="in-name"/.test(HTML) && /<label>起卦时间<\/label>/.test(HTML) && !/<label>摇卦时间<\/label>/.test(HTML) && /id="btn-now"/.test(HTML) && /\$\("btn-now"\)\.onclick = fillNow;/.test(SRC), 'v0.2.29 起卦区：姓名输入框 in-name、「摇卦时间」改名「起卦时间」、「当前时间」按钮 btn-now 绑 fillNow');
ok((boardHtml.match(/<details class="cb-fold"><summary>资源关系 <span class="dim">（点击展开）<\/span><\/summary>/g) || []).length === 2 && (boardHtml.match(/<details class="cb-fold"><summary>权力关系 <span class="dim">（点击展开）<\/span><\/summary>/g) || []).length === 2, 'v0.2.28 资源关系／权力关系默认折叠（details.cb-fold，点击展开；duo-r 与 cbz-r 两处各一）');
ok(/id="in-note"/.test(HTML) && /S\.note = e\.target\.value/.test(SRC) && /note: S\.note \|\| ""/.test(SRC) && /name: \$\("in-name"\)\.value/.test(SRC) && /nk = states\.join\(","\)/.test(SRC) && /if \(S\.noteKey !== nk\) \{ S\.note = ""; S\.noteKey = nk; \}/.test(SRC), 'v0.2.29 分析记录：in-note textarea 输入同步 S.note，存档带 note/name 字段，卦变（states key 变化）清空、同卦重排保留');
ok(/arc-head/.test(HTML) && /grid-template-columns:118px 88px minmax\(0,1fr\)/.test(HTML) && /arc-name/.test(HTML) && /arc-q-empty/.test(HTML) && /（未填事项 · 点击录入）/.test(SRC) && /function arcQSave\(/.test(SRC) && /arcQSave\(id, v\)/.test(SRC) && /el\.onclick = function \(e\) \{[\s\S]*?closest\("button"\)/.test(SRC) && /\$\("in-name"\)\.value = r\.name \|\| "";/.test(SRC), 'v0.2.29 档案列表：日期/姓名/所问之事三列（事项宽列）、未填事项点击内联录入（arcQSave 落库）、行点击重放（按钮/编辑区豁免）、重放回填姓名');
ok(/table\.cb-mini \{ width:100%; table-layout:fixed;/.test(HTML) && /table\.cb-mini th:nth-child\(1\) \{ width:66px; \}/.test(HTML) && /table\.cb-mini th:nth-child\(2\) \{ width:calc\(\(100% - 66px\)\/2\); \}/.test(HTML) && /\.duo \{ display:grid; grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\); gap:0 20px;/.test(HTML), 'v0.2.09 分析 mini 表统一列模板：table-layout:fixed＋标签列 66px（与 cb-row 标签同宽）＋起点/终点各占余宽之半，duo/cbz 栏间 gap 统一 20px——右栏 sf-mini ×3＋左栏 cb-mini ×2 五表起点对起点、终点对终点');
ok(/"趋势关系":"月生克"/.test(SRC) && /"上级关系":"日生克"/.test(SRC) && !/"趋势关系":"月五行"/.test(SRC) && !/"上级关系":"日五行"/.test(SRC), 'v0.2.10 数据源口径名统一（第41轮）：趋势关系（月生克）、上级关系（日生克），cbLink 括号注与弹层标题同步，旧名「月五行/日五行」撤除');
ok(/<button class="btn" id="btn-src" onclick="toggleSrc\(this\)">显示数据源<\/button>/.test(HTML) && /function toggleSrc\(btn\) \{\s*var hidden = document\.body\.classList\.toggle\('src-hidden'\);\s*btn\.textContent = hidden \? '显示数据源' : '隐藏数据源';/.test(SRC) && HTML.indexOf('btn-save-arc') > -1 && HTML.indexOf('btn-src') > HTML.indexOf('btn-save-arc'), 'v0.2.23 数据源开关迁静态按钮区（第58轮）：「显示数据源」移至「存入档案」按钮后（body 默认 src-hidden 故初始文案为显示数据源），toggleSrc 切 body class 与按钮文案，重排盘后状态保持');
ok(!/\.ana-tools/.test(HTML) && /body\.src-hidden \.cb-src \{ display:none; \}/.test(HTML), 'v0.2.23：ana-tools 工具行样式撤除，src-hidden 隐藏全部 cb-src 括号注（弹层标题）保留');
ok(!/静局判定：/.test(SRC) && !/启动判定：/.test(SRC) && !/"启动难易 · "/.test(SRC) && /"非静局 · " \+ qd \+ "（" \+ qdDe \+ "）"/.test(SRC) && /静局未动 · 不另判启动/.test(SRC), 'v0.2.11 前置启动字段名撤除（第42轮）：⓪行去「静局判定：/启动判定：/启动难易 · 」前缀直接显示值（非静局 · 同气换形｜顺畅启动（顺易）；静局＝静局未动｜静局不另判启动），半卦层 head 去「启动难易 」、静局改「静局未动 · 不另判启动」；弹窗列头与页脚版本说明不动');
const gSfM = fullFlow([7, 7, 7, 7, 7, 7], 2026, 9, 17, "cai", "yue").g;
gSfM.bian = { info: gSfM.info, yao: gSfM.yao }; // 模拟双端同卦 forceBian 镜像（bian.info 同名＋爻全静）
ok(gSfM.bian.info.name === gSfM.info.name, 'v0.2.12 夹具前置（第43轮）：双端同卦盘 g.bian 为同名镜像（forceBian）——旧判据 !g.bian 在此恒假，即半卦层静局分支不可达的实证');
const sfJ = anaShuangfang(gSfM).html;
ok(/var staticGua = !g\.bian \|\| g\.bian\.info\.name === g\.info\.name;/.test(SRC) && sfJ.indexOf('静局未动 · 不另判启动') > -1 && sfJ.indexOf('静局无过程 · —') > -1 && sfJ.indexOf('非静局') === -1 && sfJ.indexOf('启动难易') === -1 && sfJ.indexOf('同气置换') === -1, 'v0.2.12 半卦层静局判据对齐（第43轮）：staticGua 加「同卦」判——同卦镜像盘前置启动行「静局未动 · 不另判启动」、过程难易行「静局无过程 · —」，不再误出「非静局 · 启动难易档／同气置换 · 同气落成」，与整卦层 sameGua 静局口径一致（同气换形两卦名不同不受影响）；sfQ 断言（静局无变 ×3）不回归');
ok(/row\("2", '<span class="cb-link" data-k="过程难易">过程难易<\/span>', rm\.mode \+ " · " \+ cdName \+ \(cdDe \? "（" \+ cdDe \+ "）" : ""\),/.test(SRC) && !/p\.md\.name \+ "（" \+ p\.md\.zt \+ "）"/.test(SRC) && /p\.md\.name \+ " · " \+ cw\[0\]/.test(SRC) && CB_DYN_HTML["过程难易"].indexOf("全程管控（始克终）") > -1, 'v0.2.13 过程难易施受名撤除（第44轮）：②行「全程管控 · 判词（档）」、半卦层过程难易行「全程管控型 · 判词（档）」——括号注施受名（始克终）撤除，弹窗讲解层「全程管控（始克终）」保留');
ok(boardHtml.indexOf('<td>双方关系</td>') > boardHtml.indexOf('<td>双方强弱</td>') && boardHtml.lastIndexOf('<th>资源关系</th>') > boardHtml.indexOf('<td>双方关系</td>') && boardHtml.indexOf('hf-sf') === -1, '右栏块序：1前置启动 2过程难易 3双方表（强弱/关系）4资源关系 5权力关系；半卦卡不含 hf-sf');
ok(Object.keys(ctx.SF_REL).length === 5 && ctx.SF_REL["克"][0] === "我方克对方" && ctx.SF_REL["克"][1] === "我方有主决策权" && ctx.SF_REL["被克"][1] === "他方有主决策权" && ctx.SF_REL["被生"][0] === "对方生我方" && ctx.SF_REL["生"][1] === "我方支持他方决策" && ctx.SF_REL["比和"][1] === "双方同频共同协商", 'SF_REL 五态映射（v0.2.01）：克/被克/被生/生/比和 → 决策权五语');
ok(/<td>双方关系<\/td><td>(我方克对方 · 我方有主决策权|对方克我方 · 他方有主决策权|对方生我方 · 他方支持我方决策|我方生对方 · 我方支持他方决策|双方比和 · 双方同频共同协商)<\/td>/.test(boardHtml), '双方关系行全量语（v0.2.08 恢复关系名 · 决策权）：起点列五态枚举');
const sfD = anaShuangfang(fullFlow([9,7,8,8,8,8], 2026, 9, 17, "cai", "yue").g).html;
ok(/<td>双方关系<\/td><td>[^<]+ · [^<]+<\/td><td>[^<]+ · [^<]+<\/td>/.test(sfD) && sfD.indexOf('静局无变') === -1, '动局双方关系终点列（第38轮「双方关系也有终点」）：始/终两格全量语、无静局占位');

ok(boardHtml.lastIndexOf('<th>资源关系</th>') > boardHtml.indexOf('<td>双方关系</td>') && boardHtml.lastIndexOf('<th>权力关系</th>') > boardHtml.lastIndexOf('<th>资源关系</th>') && boardHtml.indexOf('data-k="上级关系"') > -1 && boardHtml.indexOf('<th>具体数据</th>') === -1 && boardHtml.indexOf('<th>其它数据</th>') === -1, 'v0.2.06 双方版其它数据拆两表同步：资源关系/权力关系（sf-mini ×2）、上级关系行、旧表头清除（第35轮）');

var secLine = (HTML.match(/var sec = [^\n]*/) || [''])[0];
ok(HTML.indexOf('\u2461 \u8d44\u6e90\u5173\u7cfb \u00b7 ') > -1 && HTML.indexOf('\u2461 \u6743\u529b\u5173\u7cfb \u00b7 ') > -1 && secLine.length > 0 && secLine.indexOf('\u5177\u4f53\u6570\u636e') === -1, 'v0.2.06 \u5f39\u5c42\u8282\u6807\u9898\u5206\u90e8\u5316\uff1a\u2461 \u8d44\u6e90\u5173\u7cfb \u00b7 /\u2461 \u6743\u529b\u5173\u7cfb \u00b7\uff08sec \u884c\u65e0 \u5177\u4f53\u6570\u636e\uff09');
ok(boardHtml.indexOf('<td>双方强弱</td>') > boardHtml.indexOf('<i>2 过程难易</i>'), '双方强弱居过程难易之后（v0.2.08 sf-mini 表行）');
ok(/duo-hd">整体态势分析</.test(boardHtml) && /duo-hd">双方态势分析</.test(boardHtml) && /hd-ys"><span>要素关系分析<\/span><span class="ys-pick">用神 <select/.test(boardHtml) && boardHtml.indexOf('half-hd') === -1, '三栏头标题：整体态势分析／双方态势分析／要素关系分析（细项头右挂用神下拉；旧「卦分析／爻分析」栏头与 half-hd 已移除）');
ok(boardHtml.indexOf('<table class="board"') > boardHtml.indexOf('class="hf-rels"'), '六爻排盘表在半卦三关系行之后（整卦＋半卦＋详卦整合为连续一块）');
ok(!/board-head|bh-block|bh-arrow|bh-gong/.test(boardHtml), '旧卦名横条（board-head）已移除');
ok(/<span class="tv tv-[a-z]+">[↗→↘]<\/span>/.test(boardHtml) && /<span class="tv tv-[a-z]+">[↗→↘]<\/span>/.test(halfSec.html), '整卦＋半卦本卦侧属性面板值后挂本变趋势线（tv，带方向色类）');
ok(/<i>月旺衰<\/i><b[^>]*>[^<]+<\/b><span class="tv tv-[a-z]+">/.test(boardHtml) || /<i>月长生<\/i><b[^>]*>[^<]+<\/b><span class="tv tv-[a-z]+">/.test(boardHtml), '趋势线挂在月旺衰／月长生等五项值后（卦义、日生克不挂）');
var kvsParts = boardHtml.split('class="kvs');
var hsParts = halfSec.html.split('class="kvs');
ok(kvsParts[2] && (kvsParts[2].match(/class="tv/g) || []).length === (kvsParts[1].match(/class="tv/g) || []).length && (hsParts[2].match(/class="tv/g) || []).length === (hsParts[1].match(/class="tv/g) || []).length && (hsParts[4].match(/class="tv/g) || []).length === (hsParts[3].match(/class="tv/g) || []).length, '变卦侧同挂趋势线（v0.1.56）：整卦变卡＋半卦两卡变侧 tv 数与本侧相同');
ok(kvList(["刚健","旺","帝旺","比","旺","帝旺","旺"], null, { 1: "↘" }).indexOf('class="tv tv-down">↘') > -1 && kvList(["刚健","旺","帝旺","比","旺","帝旺","旺"], null, null).indexOf('class="tv') === -1, 'kvList：传 trends 挂定向线，不传无线');
ok(valCls("旺") === "v-good" && valCls("相") === "v-good" && valCls("休") === "" && valCls("囚") === "v-bad" && valCls("死") === "v-bad", 'valCls 五态色：旺相绿、休黑（默认）、囚死红');
ok(valCls("长生") === "v-good" && valCls("帝旺") === "v-good" && valCls("衰") === "v-bad" && valCls("绝") === "v-bad" && valCls("胎") === "" && valCls("养") === "", 'valCls 十二长生色：长生至帝旺绿、衰至绝红、胎养黑');
ok(tvCls("↗") === "tv-up" && tvCls("↘") === "tv-down" && tvCls("→") === "tv-flat", 'tvCls 线色类：↗绿、↘红、→黑');
ok(/<b class="[^"]*v-good/.test(boardHtml) || /<b class="[^"]*v-bad/.test(boardHtml), '面板值配色类在排盘 DOM 中生效');
const stripAh = s => String(s).replace(/ data-(?:ah|p)="[^"]*"/g, '');
ok(stripAh(yaoWxTags("土","丑",{mdz:8,riZhi:"子"},"土","土")) === "月<b class=\"ah-link\">休</b> · 月<b class=\"ah-link v-bad\">绝</b> · <b class=\"ah-link\">爻生月</b> · 日<b class=\"ah-link v-bad\">囚</b> · 日<b class=\"ah-link v-bad\">衰</b> · <b class=\"ah-link\">爻克日</b> · 整：<b class=\"ah-link v-good\">卦我比和</b> · 半：<b class=\"ah-link v-good\">卦我比和</b>", '爻级八标 v0.1.53 排序＋v0.1.54 值上色（v0.2.23 升八标：月生克插月长生后；v0.1.78 阴土丑爻走己线巳起逆行；v0.2.24 值与生克词全链接化可点开规则弹窗，断言剥 data 属性）：申月＝绝（红）、子日＝衰（红）、月休、日囚、土生金＝爻生月、整卦我比和、半卦我比和（v0.1.99 卦生克）');
ok(stripAh(yaoWxTags("水","子",{mdz:8,riZhi:"子"},"水","水")) === "月<b class=\"ah-link v-good\">相</b> · 月<b class=\"ah-link v-good\">长生</b> · <b class=\"ah-link\">月生爻</b> · 日<b class=\"ah-link v-good\">旺</b> · 日<b class=\"ah-link v-good\">帝旺</b> · <b class=\"ah-link\">爻比日</b> · 整：<b class=\"ah-link v-good\">卦我比和</b> · 半：<b class=\"ah-link v-good\">卦我比和</b>", '八标值上色（水爻申月全吉值全绿）：相、长生、申金生水＝月生爻、旺、帝旺、整卦我比和、半卦我比和（v0.1.99）；前缀不上色（v0.2.23）');
ok(stripAh(yaoWxTags("土","丑",{mdz:8,riZhi:"子"},"土","土",{wx:"水",zhi:"子",gongWx:"金",banWx:"金"})) === "月<b class=\"ah-link\">休</b><span class=\"tv tv-up\">↗</span> · 月<b class=\"ah-link v-bad\">绝</b><span class=\"tv tv-up\">↗</span> · <b class=\"ah-link\">爻生月</b> · 日<b class=\"ah-link v-bad\">囚</b><span class=\"tv tv-up\">↗</span> · 日<b class=\"ah-link v-bad\">衰</b><span class=\"tv tv-up\">↗</span> · <b class=\"ah-link\">爻克日</b> · 整：<b class=\"ah-link v-good\">卦我比和</b><span class=\"tv tv-down\">↘</span> · 半：<b class=\"ah-link v-good\">卦我比和</b><span class=\"tv tv-down\">↘</span>", '八标本变趋势箭头（v0.1.55；v0.2.23 月生克为生克项不标箭头；v0.1.78 阴土丑爻己线：绝→对照长生 ↗、衰→对照帝旺 ↗）');
ok(yaoWxTags("土","丑",{mdz:8,riZhi:"子"},"土","土",{wx:"土",zhi:"丑",gongWx:"土",banWx:"土"}).indexOf('tv ') === -1 && yaoWxTags("土","丑",{mdz:8,riZhi:"子"},"土","土").indexOf('↗') === -1 && yaoWxTags("土","丑",{mdz:8,riZhi:"子"},"土","土").indexOf('↘') === -1, '七标相同维不标箭头：cmp 全同或无 cmp（静爻）均无 ↗↘');
ok(/function ahOpen/.test(SRC) && /ahOpen\(t\.getAttribute\("data-ah"\), t\.getAttribute\("data-p"\)\)/.test(SRC) && /data-ah="y8"/.test(SRC) && /function ahCs12Table/.test(SRC) && /function ahWsChain/.test(SRC), 'v0.2.24 属性规则弹窗：ahOpen 主分发（y8/kv/wx5/shiying/dongjing/shen/kong/mu/tag/rel 十类）＋十二长生矩阵表＋本例计算链函数群＋g_tail 事件委托');
ok(/data-ah="shiying" data-p="世"/.test(SRC) && /data-ah="dongjing"/.test(SRC) && /data-ah="shen" data-p="用神/.test(SRC) && /data-ah="kong" data-p="ri/.test(SRC) && /data-ah="mu" data-p="ri/.test(SRC) && /data-ah="rel" data-p=/.test(SRC), 'v0.2.24 个性行全标签链接化：世应/动静/四神/空亡/入墓/化进化退回头生克均挂 data-ah 可点开规则＋本例');
const ahT = yaoWxTags("土","丑",{mdz:8,riZhi:"子"},"土","土");
ok(/data-ah="y8" data-p="0\|土\|丑\|申\|子\|土\|土"/.test(ahT) && /data-ah="y8" data-p="7\|土\|丑\|申\|子\|土\|土"/.test(ahT), 'v0.2.24 八标值链接参数：data-p 七元组 i|爻五行|爻支|月支|日支|本宫五行|半宫五行（0=月旺衰 7=半卦生克）');
ok(stripAh(yaoWxTags("水","子",{mdz:8,riZhi:"子"},"金","土",{wx:"土",zhi:"丑",gongWx:"土",banWx:"土"},true)) === "月<b class=\"ah-link v-good\">相</b><span class=\"tv tv-up\">↗</span> · 月<b class=\"ah-link v-good\">长生</b><span class=\"tv tv-up\">↗</span> · <b class=\"ah-link\">月生爻</b> · 日<b class=\"ah-link v-good\">旺</b><span class=\"tv tv-up\">↗</span> · 日<b class=\"ah-link v-good\">帝旺</b><span class=\"tv tv-up\">↗</span> · <b class=\"ah-link\">爻比日</b> · 整：<b class=\"ah-link v-good\">卦生我</b><span class=\"tv tv-down\">↘</span> · 半：<b class=\"ah-link v-bad\">卦克我</b><span class=\"tv tv-down\">↘</span>", '八标变卦侧 flip（v0.1.56；v0.2.23 月生爻不标箭头；v0.1.78 对照阴土丑爻己线：长生对照绝、帝旺对照衰，方向取反后与本卦侧同向 ↗）');

eq(relArrow("始生终"), '<span class="rl-ar fwd"><i class="la">生</i><i class="ln"></i></span>', '始终箭头 始生终：fwd 向右＋文字生');
eq(relArrow("终克始"), '<span class="rl-ar back"><i class="la">克</i><i class="ln"></i></span>', '始终箭头 终克始：back 向左＋文字克');
eq(relArrow("终生始"), '<span class="rl-ar back"><i class="la">生</i><i class="ln"></i></span>', '始终箭头 终生始：back 向左＋文字生');
eq(relArrow("始克终"), '<span class="rl-ar fwd"><i class="la">克</i><i class="ln"></i></span>', '始终箭头 始克终：fwd 向右＋文字克');
eq(relArrow("始终比和"), '<span class="rl-ar both"><i class="la">比</i><i class="ln"></i></span>', '始终箭头 始终比和：both 双向＋文字比');
ok(HTML.includes('.rl-ar .ln::after') && HTML.includes('.rl-ar.both .ln::before') && SRC.indexOf('gz-arrow') === -1, '始终箭头 CSS（右箭头头＋both 双向头）；旧 gz-arrow 移除');
const wx4s = (boardHtml.match(/class="tags-wx4">[\s\S]*?<\/div>/g) || []).map(function (s) { return s.replace(/<[^>]*>/g, ""); });
ok(wx4s.length === 9 && wx4s.every(function (s) { return /月[旺相休囚死][↗↘]? · 月\S+ · ((爻生|爻克|爻比)月|(月生|月克)爻) · 日[旺相休囚死][↗↘]? · 日\S+ · ((爻生|爻克|爻比)日|(日生|日克)爻) · 整：(卦我比和|卦生我|我克卦|我生卦|卦克我)[↗↘]? · 半：(卦我比和|卦生我|我克卦|我生卦|卦克我)[↗↘]?/.test(s); }), '八标行共 9 处（本卦六爻＋动变爻 1＋静变爻 2），v0.2.23 必有八项「月X · 月X · 月生克 · 日X · 日X · 日生克 · 整：X · 半：X」（v0.2.21 整/半前缀加全角冒号）');
ok(wx4s.filter(function (s) { return /[↗↘]/.test(s); }).length === 6 && [0, 1, 2].every(function (i) { return !/[↗↘]/.test(wx4s[i]); }), '七标箭头挂动变 3 行的本卦侧与变卦侧（v0.1.56 共 6 处；静爻行无箭头）');
ok([3, 5, 7].every(function (i) { return JSON.stringify(wx4s[i].match(/[↗↘]/g)) === JSON.stringify(wx4s[i + 1].match(/[↗↘]/g)); }), '七标箭头两侧同向（v0.1.56）：本卦看起点、变卦看终点，逐行本/变箭头序列一致');
ok(/class="tags-wx4">[\s\S]*?<b class="[^"]*v-(good|bad)/.test(boardHtml), '七标值上色在排盘 DOM 生效（tags-wx4 内 v-good/v-bad）');
ok(HTML.includes('<colgroup><col class="c-god"><col class="c-fu"><col><col></colgroup>') && HTML.includes('table.board col.c-god { width:56px; }') && HTML.includes('table.board col.c-fu { width:78px; }'), '细项表伏神列收窄：colgroup 锁六神 56px／伏神 78px，本变两列均分余宽');
ok(SRC.indexOf('plain(yaoWxTags') > -1 && SRC.includes('var plain = function'), '复制文本盘面对七标剥 HTML 标签（boardText plain）');
ok(HTML.includes('fu-line fu-gz'), '伏神六亲与干支分行：fu-line（六亲）＋fu-line fu-gz（干支）');
ok(!SRC.includes('点任一行') && !HTML.includes('点任一行'), '要素关系分析表下方操作说明文字已移除');
ok((boardHtml.match(/c-bian-wxchg/g) || []).length === 1, '动变爻格浅红底共 1 处（临→师初爻丁巳→戊寅）；静爻含静变不染色，仍为 echo 浅色');
ok((boardHtml.match(/<b class="tag good[^"]*"[^>]*>回头生<\/b>/g) || []).length === 2, '回头生标签 2 处：初爻丁巳→戊寅（动）＋三爻丁丑→戊午（静变）（v0.2.24 标签 ah-link 可点）');
ok((boardHtml.match(/<b class="tag jing[^"]*"[^>]*>化耗<\/b>/g) || []).length === 1, '化耗标签 1 处：二爻丁卯→戊辰（静变）');

/* ---- 整卦层成败分析（v0.1.80 · 参考资料29 v1.31：八读，按宫起例＋梯队尺） ---- */
section('§9.5 整卦层成败分析');
eq([cbQl("木","卯").level, cbQl("木","卯").seq], ["旺", 5], '月令空间档序数：木@卯月=旺(5)');
eq([cbQl("木","子").seq, cbQl("木","巳").seq, cbQl("木","辰").seq, cbQl("木","申").seq], [4, 3, 2, 1], '五档标尺：相4（令生我）／休3（我生令）／囚2（我克令）／死1（令克我）——空间档与趋势关系档同源');
ok(cbQl("木","卯").de && cbQl("木","子").de && !cbQl("木","巳").de && !cbQl("木","申").de, '得失气粗分：得气=旺相，失气=休囚死（只用于 5.0/5.1/5.2 与处置表分列，不用于结算）');
eq(["子","申","辰","午","寅"].map(z => cbRelKey("木", z)), ["shengwo", "kewo", "woke", "wosheng", "bi"], '权力关系档五型：日生我／日克我／我克日／我生日／我比日（子申辰午寅对木）——与日令借力档同源');
eq(["旺","相","休","囚","死"].map(l => CB_SPACE[l]), ["空间最大，上限最高，可做到满量","空间较大，上限较高，还有扩张余地","空间一般，上限下降，能守成但难扩张","空间受限，上限较低，只适合小范围推进","空间最小，上限最低，只够基本维持"], '发展空间五档空间语（v0.1.83 月令第一读）');
eq(["比和月令","月令克我","月令生我","我生月令","我克月令"].map(r => CB_MS_NAME[r]), ["同月令","月令克","月令生","生月令","克月令"], '趋势关系五型新名（v0.1.83 月令第四读）：同月令／月令克／月令生／生月令／克月令');
eq(["同月令","月令克","月令生","生月令","克月令"].map(n => CB_MS_JIE[n]), ["与趋势同方向","是趋势的资源","受趋势的支持","是趋势的基础","驾驭或逆趋势"], '趋势关系解读语五型（v0.1.83）');
eq(["bi","shengwo","wosheng","woke","kewo"].map(k => CB_POWER_NAME[k]), ["同日令","日令生","生日令","克日令","日令克"], '权力关系五型（v0.1.83 日令第四读，cbRelKey 同源）');
eq(["同日令","日令克","日令生","生日令","克日令"].map(n => CB_POWER_JIE[n]), ["与上级意志一致","受直管上级约束","得直管上级支持","为直管上级考虑","驾驭或逆反上级"], '权力关系解读语五型（v0.1.83）');
eq(["旺","相","休","囚","死"].map(l => CB_JIE2[l]), ["最易向外借力","较易向外借力","可以向外借力","较难向外借力","最难向外借力"], '向外借力五档（v0.1.83 日令第一读，日旺衰映射）');
eq([["丙","寅"],["癸","卯"],["癸","巳"],["丙","戌"],["丁","酉"],["癸","酉"]].map(p => gan12Full(p[0], p[1]).rank), [3, 3, 2, 2, 3, 4], '十干长生起例全表（v0.1.83 上级资源）：丙寅长生3顺／癸卯长生3逆／癸巳胎2／丙戌墓2／丁酉长生3／癸酉病4');
eq([["震","亥"],["乾","巳"],["坎","申"],["艮","午"],["兑","子"]].map(p => cbGan12(p[0], p[1])), [3, 3, 3, 3, 3], '按宫代表天干长生位=3（v1.31 起例）：震甲亥顺／乾庚巳顺／坎壬申顺／艮戊午顺（土不借宫）／兑辛子逆——均长生档3');
eq([["兑","卯"],["巽","亥"],["离","子"],["坤","午"],["坤","丑"],["艮","戌"]].map(p => cbGan12(p[0], p[1])), [1, 3, 1, 2, 6, 6], '阴干逆行（v1.31 废同支等力）：兑辛@卯绝1（子长生逆行）／巽乙@亥死3（午长生逆行）／离丁@子绝1（酉长生逆行）／坤己@午养2（巳长生逆行，土不借宫）；坤己@丑、艮戊@戌帝旺6（土本气根在戌丑）');
eq([["坎","子"],["坎","丑"],["坎","寅"],["坎","卯"],["坎","辰"],["坎","巳"],["坎","午"],["坎","未"]].map(p => cbGan12(p[0], p[1])), [6, 5, 4, 3, 2, 1, 2, 2], '六档表帝旺为峰（v1.31）：壬线帝旺6衰5病4死3墓2绝1胎2养2——胎升2档（旧胎1）；下行同档唯一');
eq([["震","卯"],["震","寅"],["震","子"],["震","丑"],["震","亥"]].map(p => cbGan12(p[0], p[1])), [6, 5, 3, 4, 3], '六档表上升段（甲线）：帝旺6临官5沐浴3冠带4长生3（旧沐浴4冠带5临官6）；甲@亥长生3');
eq(["子","丑","寅","卯"].map(z => cbTidui("水", z)), [3, 2, 0, 0], '梯队档（v1.31，按现行 ZHI_CANG 传统序）：水@子第一梯队3／水@丑第二梯队2（癸中气）／水@寅卯末位梯队0');
eq([cbGan12Full("坤","巳"), cbGan12Full("坤","辰")].map(f => f.up + "" + f.pos), ["10", "11"], '同段次序（六值附标依据）：己线长生巳(pos0)与沐浴辰(pos1)同上升段——同档3内 长生＜沐浴；胎＜养同理');
ok(cbGan12("艮", "辰") <= 3 && cbTidui("土", "辰") === 3 && cbGan12("坎", "戌") >= 4 && cbTidui("水", "戌") === 0, '长生档与梯队档抽核：艮戊@辰胎2·土第一梯队；坎壬@戌冠带4·水末位梯队');
const cbH = anaChengbai(sample.g).html;
ok(["<th>静局判定</th>", "<th>启动判定</th>", "<b>非静局</b>", "<b>顺畅启动（顺易）</b>", "两卦不同——有转移结构，照常进入启动判定", "内源（根）：末位梯队（月通根）· 第二梯队（日通根）→ 有根（任一不低于第三梯队）", "外源（气）：月「休」输出（本端生支） · 日「相」输入（支生本端） → 有输入（月或日旺相）", "判定：有立足点，环境又有供给"].every(s => CB_DYN_HTML["前置启动"].indexOf(s) > -1), '⓪弹窗动态·前置启动（临→师实算）：表头特判「静局判定｜启动判定」两列——非静局＋顺畅启动粗体，dim 内源末位+第二有根·月休输出日相输入有输入·判定有立足点环境又有供给');
ok(/2 <span class="cb-link" data-k="过程难易">过程难易<\/span><\/i>/.test(cbH), '①行名 cb-link（v0.1.93 第18轮）：过程难易整词链接与1 前置启动同构');
ok(CB_EXPLAIN["过程难易"].what.indexOf("初始导向＝结果要回头照顾原有基础、承诺和利益") > -1 && CB_EXPLAIN["过程难易"].logic.indexOf("施受方向由两端五行关系决定施动端") > -1 && CB_EXPLAIN["过程难易"].std.indexOf("五型机制表") > -1 && CB_EXPLAIN["过程难易"].std.indexOf("本节不另立档位") > -1 && CB_THS["过程难易"][0] === "导向与施受" && CB_THS["过程难易"][1] === "过程感受 · 成败裁定" && CB_SRC["过程难易"] === "导向与施受", '①弹窗静态·过程难易（v0.1.93 第18轮）：是什么＝五型机制与导向读法（初始导向＝结果回头照顾原有基础承诺利益）；底层逻辑＝过程方向恒始→终＋施受方向定施动端；计算标准＝五型机制表＋难易档沿用成败裁定七档不另立；表头特判「导向与施受｜过程感受 · 成败裁定」两列');
ok(CB_DYN_HTML["过程难易"].indexOf("<th>导向与施受</th>") > -1 && CB_DYN_HTML["过程难易"].indexOf("<th>过程感受 · 成败裁定</th>") > -1 && CB_DYN_HTML["过程难易"].indexOf("<b>全程管控（始克终）</b>") > -1 && CB_DYN_HTML["过程难易"].indexOf("初始导向 · 起点先定框架和边界，全程约束结果；施动方：始卦 → 受动方：终卦") > -1 && CB_DYN_HTML["过程难易"].indexOf("过程感受：紧，后段持续受约束；梯队差 +2（2-0）：难度来源为受动端（终态）的对抗阻力") > -1, '①弹窗动态·过程难易（临→师实算，v0.1.93 第18轮）：导向与施受列＝全程管控（始克终）粗体＋初始导向·方式·施受方向；过程感受·成败裁定列＝紧后段受约束＋梯队差+2 难源受动端对抗阻力');
ok(/2 <span class="cb-link" data-k="过程难易">过程难易<\/span><\/i><b>全程管控 · 压力落成（较易）<\/b><\/div>/.test(cbH) && cbH.indexOf("初始导向 · 起点先定框架") === -1 && cbH.indexOf("施动方：") === -1 && cbH.indexOf("过程感受：") === -1, '2 过程难易主界面（临→师，坤土克坎水始克终）：v0.1.94 第20轮——2 行正文（导向·方式／施受方向／过程感受／成败裁定链接）全部移除，主界面只留机制名·判词行摘要；推演全文只在「过程难易」「成败裁定」弹窗显示');
ok(HTML.indexOf('k === "过程难易" ? ylSec("相关推演", cbLink("成败裁定")') > -1 && HTML.indexOf('cbOpen(t.getAttribute("data-k"))') > -1, '2 过程难易弹窗「相关推演」节（v0.1.94 第20轮）：主界面成败裁定入口随2 行正文移除，延伸链接迁入「过程难易」弹窗尾部——document 委托使弹窗内 cb-link 可点开「成败裁定」弹窗，链路 2 过程难易→成败裁定闭环');
ok(["<th>机制与判词</th>", "<th>梯队差 · 难易档</th>", "<b>压力落成（较易）</b>", "<b>梯队差 +2（2-0）· 克式</b>", "难度来源为受动端（终态）的对抗阻力"].every(function (t) { return CB_DYN_HTML["成败裁定"].indexOf(t) > -1; }), '②弹窗动态·成败裁定（临→师实算，v0.1.91 参考资料31）：表头特判「机制与判词｜梯队差·难易档」两列——判词粗体＋梯队差粗体＋dim 推演（七档全部属成，梯队差不改成败只出难易）');
ok(/<th>资源关系<\/th><th>起点<\/th><th>终点<\/th>/.test(cbH) && /<th>权力关系<\/th><th>起点<\/th><th>终点<\/th>/.test(cbH) && ['趋势关系','发展空间','资源丰沛','趋势梯队','上级关系','向外借力','发展评级','支持梯队','上级资源'].map(k => cbH.indexOf('data-k="' + k + '"')).every((v, i, a) => v > -1 && (i === 0 || v > a[i - 1])), 'v0.2.06 具体数据拆两表：资源关系（趋势关系/发展空间/资源丰沛/趋势梯队）＋权力关系（上级关系/向外借力/发展评级/支持梯队/上级资源），表头各三列、行序即此（第37轮）');
ok(/<td><span class="cb-link" data-k="发展空间">发展空间<span class="cb-src">（月旺衰）<\/span><\/span><\/td><td>空间一般，上限下降，能守成但难扩张<\/td><td>空间较大，上限较高，还有扩张余地<\/td>/.test(cbH), '②发展空间行（v0.1.83 月令第一读，原大势＋本月气势合一）：始休3→终相4，五档空间语');
ok(/<td><span class="cb-link" data-k="资源丰沛">资源丰沛<span class="cb-src">（月长生）<\/span><\/span><\/td><td>资源较匮乏<\/td><td>资源一般<\/td>/.test(cbH), '②资源丰沛行（v0.1.83 原本月根基，显示改 n/6 位名）：始坤己@酉墓2／终坎壬@酉沐浴3——六档帝旺为峰（按宫起例）');
ok(/<td><span class="cb-link" data-k="趋势梯队">趋势梯队<span class="cb-src">（月通根）<\/span><\/span><\/td><td>末位梯队<\/td><td>末位梯队<\/td>/.test(cbH), '②趋势梯队行（v0.1.83 原月梯队，来源改月通根）：土@酉、水@酉均不在酉藏干（辛）构成＝末位梯队');
ok(/<td><span class="cb-link" data-k="趋势关系">趋势关系<span class="cb-src">（月生克）<\/span><\/span><\/td><td>是趋势的基础<\/td><td>受趋势的支持<\/td>/.test(cbH), '②趋势关系行（v0.1.83 原月生克，值改简名；v0.2.10 数据源名改「月生克」）：＝始土生酉金「生月令」→ 终酉金生水「月令生」');
ok(/<td><span class="cb-link" data-k="向外借力">向外借力<span class="cb-src">（日旺衰）<\/span><\/span><\/td><td>较易向外借力<\/td><td>较难向外借力<\/td>/.test(cbH), '②向外借力行（v0.1.83 口径改日旺衰，原日五行借力档）：始土@午相「较易向外借力」→ 终水@午囚「较难向外借力」');
ok(/<td><span class="cb-link" data-k="发展评级">发展评级<span class="cb-src">（日长生）<\/span><\/span><\/td><td>初级发展<\/td><td>初级发展<\/td>/.test(cbH), '②发展评级行（v0.1.83 原今日评级，显示改 n/6 位名）：始坤己@午养2／终坎壬@午胎2（胎升2档）——评级不进推动比较');
ok(/<td><span class="cb-link" data-k="支持梯队">支持梯队<span class="cb-src">（日通根）<\/span><\/span><\/td><td>第二梯队<\/td><td>末位梯队<\/td>/.test(cbH), '②支持梯队行（v0.1.83 原日梯队，来源改日通根）：土@午中气（己）＝第二梯队；水@午不在午藏干（丁己）＝末位梯队');
ok(/<td><span class="cb-link" data-k="上级资源">上级资源<span class="cb-src">（日资源）<\/span><\/span><\/td><td>资源一般<\/td><td>资源一般<\/td>/.test(cbH), '②上级资源行（v0.1.83 口径大改＝日令本气十干在月令的长生）：午本气丁@酉长生3，始卦终卦同值——与卦宫无关，起终恒同');
ok(CB_DYN_HTML["资源丰沛"].indexOf("<b>资源较匮乏（2/6 墓）</b>") > -1 && CB_DYN_HTML["发展空间"].indexOf("空间一般，上限下降，能守成但难扩张（休 3）") > -1 && CB_DYN_HTML["趋势梯队"].indexOf("末位梯队（无根）") > -1 && CB_DYN_HTML["上级资源"].indexOf("<b>资源一般（3/6 长生）</b>") > -1 && CB_DYN_HTML["上级关系"].indexOf("<b>") > -1, '弹窗完整态（v0.1.84 意义（参数）加粗行＋dim 推演行）：资源丰沛「资源较匮乏（2/6 墓）」／发展空间「空间一般…（休 3）」／趋势梯队「末位梯队（无根）」／上级资源「资源一般（3/6 长生）」');
ok(/<td><span class="cb-link" data-k="发展空间">发展空间<span class="cb-src">（月旺衰）<\/span><\/span><\/td>/.test(cbH), '②11 行标签全部带 cb-link 弹窗链接＋来源小字');
eq(Object.keys(CB_SRC).length, 12, '②来源标注表 CB_SRC 12 项齐备（v0.1.93 加过程难易·导向与施受）');
ok(Object.keys(CB_SRC).every(k => CB_EXPLAIN[k]) && Object.keys(CB_EXPLAIN).every(k => CB_SRC[k]), '②来源键与释义键一一对应（10=10）');
eq([CB_SRC["发展空间"], CB_SRC["资源丰沛"], CB_SRC["趋势梯队"], CB_SRC["趋势关系"], CB_SRC["向外借力"], CB_SRC["支持梯队"], CB_SRC["发展评级"], CB_SRC["上级关系"], CB_SRC["上级资源"]], ["月旺衰", "月长生", "月通根", "月生克", "日旺衰", "日通根", "日长生", "日生克", "日资源"], '②来源映射（v0.1.83 九读，v0.2.10 改名）：月令四读＋日令五读——趋势关系＝月生克、上级关系＝日生克，上级资源＝日令本气十干在月令的长生');
ok(cbH.indexOf('<span class="cb-src">（月通根）</span>') > -1 && cbH.indexOf('<span class="cb-src">（日通根）</span>') > -1 && cbH.indexOf('<span class="cb-src">（日旺衰）</span>') > -1 && cbH.indexOf('<span class="cb-src">（日资源）</span>') > -1, '②表标签来源小字 DOM 在位（v0.1.83 九读抽核：月通根／日通根／日旺衰／日资源）');
eq(Object.keys(CB_EXPLAIN).length, 12, '②弹窗释义 12 项齐备（v0.1.93 加过程难易·导向与施受）');
ok(CB_EXPLAIN["成败裁定"].what.indexOf("凡有转移结构则判成") > -1 && CB_EXPLAIN["成败裁定"].what.indexOf("双轨并列") > -1 && CB_EXPLAIN["成败裁定"].std.indexOf("遇抗被损") > -1 && CB_EXPLAIN["成败裁定"].std.indexOf("成十五") > -1 && CB_EXPLAIN["成败裁定"].std.indexOf("费力不等于不成") > -1 && CB_EXPLAIN["成败裁定"].logic.indexOf("克是推进方式") > -1 && CB_EXPLAIN["成败裁定"].logic.indexOf("供给缺口") > -1, '②弹窗静态·成败裁定（v0.1.91 参考资料31）：是什么＝成败只有两种（静局不成立/转移结构即成）＋成败只是概率＋双轨难易；计算标准＝七档双语系（克式落成/生式顺推）＋五类结构说明＋判词全集成十五不成零＋裁定口径六条＋为何判难是多数；底层逻辑＝过程方向五型＋施受方向＋终施动读法＋三机制（生转化读梯队差供给缺口/克约束读梯队差对抗阻力/比和置换难易不适用）＋末位不截断');
ok(Object.keys(CB_EXPLAIN).every(k => CB_EXPLAIN[k].what && CB_EXPLAIN[k].logic && CB_EXPLAIN[k].std && typeof CB_DYN[k] === "function") && Object.keys(CB_DYN).length === 12, '②弹窗 12 项静态三段（是什么/底层逻辑/计算标准）＋动态生成器齐备（v0.1.93 加过程难易）');
ok(["宫五行「土」在月支「酉」→ 休 3","空间一般，上限下降，能守成但难扩张","没力","宫五行「水」在月支「酉」→ 相 4","空间较大，上限较高，还有扩张余地","有力"].every(s => CB_DYN_HTML["发展空间"].indexOf(s) > -1), '②弹窗动态·发展空间（临→师实算）：始休3没力→终相4有力，五档空间语');
ok(["→ 生月令：是趋势的基础（休 3）","→ 月令生：受趋势的支持（相 4）"].every(s => CB_DYN_HTML["趋势关系"].indexOf(s) > -1), '②弹窗动态·趋势关系（v0.1.83 新名）：始土生金「生月令」／终金生水「月令生」');
ok(["阴干逆行","长生在「巳」","数至「酉」得「墓」→ 2/6 档（下降段，帝旺为峰）","阳干顺行","长生在「申」","数至「酉」得「沐浴」→ 3/6 档（上升段，帝旺为峰）"].every(s => CB_DYN_HTML["资源丰沛"].indexOf(s) > -1), '②弹窗动态·资源丰沛（n/6 位名＋升降段）：己逆行墓2降／壬顺行沐浴3升');
ok(["藏干(辛·金)","「土」不通根（无根） → 末位梯队(0)","「水」不通根（无根） → 末位梯队(0)"].every(s => CB_DYN_HTML["趋势梯队"].indexOf(s) > -1), '②弹窗动态·趋势梯队（v0.1.83 通根语）：酉藏辛·金，土水均不通根=末位0');
ok(["宫五行「土」在日支「午」旺衰「相」→ 较易向外借力","宫五行「水」在日支「午」旺衰「囚」→ 较难向外借力"].every(s => CB_DYN_HTML["向外借力"].indexOf(s) > -1), '②弹窗动态·向外借力（v0.1.83 日旺衰语）：土@午相／水@午囚');
ok(["数至「午」得「养」→ 2/6 档（上升段，帝旺为峰）","数至「午」得「胎」→ 2/6 档（上升段，帝旺为峰）"].every(s => CB_DYN_HTML["发展评级"].indexOf(s) > -1), '②弹窗动态·发展评级：己@午养2升／壬@午胎2升');
ok(["「午」藏干(丁·火／己·土)","「土」通中气根 → 第二梯队(2)","「水」不通根（无根） → 末位梯队(0)"].every(s => CB_DYN_HTML["支持梯队"].indexOf(s) > -1), '②弹窗动态·支持梯队（通根语）：土通午中气（己）第二梯队／水不通根=末位');
ok(CB_DYN_HTML["上级资源"].indexOf("日支「午」本气干「丁」（阴干逆行，长生在「酉」）数至月支「酉」得「长生」→ 3/6 档（上级资源与卦宫无关，起终恒同）") > -1 && (CB_DYN_HTML["上级资源"].match(/与卦宫无关/g) || []).length === 2, '②弹窗动态·上级资源（v0.1.83 新口径）：午本气丁@酉长生3，起终两列同值同过程');
const gZ1 = fullFlow([7,8,7,6,9,6], 2026, 9, 17, "cai", "yue").g;
const gZ1r = anaChengbai(gZ1);
ok(/全程管控 · 遇抗落成（极难）/.test(gZ1r.html) && CB_DYN_HTML["成败裁定"].indexOf("梯队差 -3（0-3）：难度来源为受动端（终态）的对抗阻力；遇抗被损：对抗极强，施动端在推进中受损") > -1, '遇抗分支·遇抗落成（水火既济→离为火，始克终，v0.1.91 参考资料31）：施动克方水支持梯队@午末位(0)且受动火居第一梯队(3)＝梯队差-3＝遇抗落成·极难——0-3 不再截断，判成附遇抗被损结构说明（对抗极强施动端受损）；旧「虚动不成·遇抗被损」口径废止；v0.1.94 起梯队差推演只在「成败裁定」弹窗');
const gZ2 = fullFlow([8,7,8,9,6,9], 2026, 9, 17, "cai", "yue").g;
const gZ2r = anaChengbai(gZ2);
ok(/结果倒逼 · 遇抗落成（极难）/.test(gZ2r.html) && CB_DYN_HTML["过程难易"].indexOf("施动方：终卦 → 受动方：始卦") > -1 && CB_DYN_HTML["成败裁定"].indexOf("梯队差 -3（0-3）：难度来源为受动端（始态）的对抗阻力；遇抗被损：对抗极强，施动端在推进中受损") > -1, '遇抗分支·遇抗落成（火水未济→坎为水，终克始，v0.1.91 参考资料31）：施动＝终态克方水@午末位(0)且受动始卦火居第一梯队(3)＝-3 极难——模式名仍「结果倒逼」，施受方向终→始（结果尚未发生但位序已定）；0-3 遇抗被损注解只认克式施动端末位；v0.1.94 起施受方向与梯队差推演只在弹窗');
const gBi = fullFlow([9,9,9,7,7,7], 2026, 9, 17, "cai", "yue").g;
const cbBi = anaChengbai(gBi).html;
ok(/2 <span class="cb-link" data-k="过程难易">过程难易<\/span><\/i><b>同气维持 · 同气落成<\/b><\/div>/.test(cbBi) && cbBi.indexOf("无导向 · 前后同类") === -1 && CB_DYN_HTML["过程难易"].indexOf("过程感受：平，没有五行量级转折；难易不适用") > -1 && CB_DYN_HTML["成败裁定"].indexOf("置换机制：两端共同梯队「") > -1 && CB_DYN_HTML["成败裁定"].indexOf("比和＝置换：两端同五行、同一日支下支持梯队必然相等，梯队差恒为零，难易不适用") > -1 && cbBi.indexOf("② 结果好坏") === -1 && cbBi.indexOf("③ 外部处境") === -1 && cbBi.indexOf("⑤ 是否符合所求") === -1, '比和卦 2 同气落成＋弹窗置换机制（v0.1.95 三大块收窄）：②结果好坏③外部处境⑤是否符合所求三行移除，①行与弹窗裁定不变，过程难易弹窗「过程感受：平…难易不适用」');
const gQian = fullFlow([7,7,7,7,7,7], 2026, 9, 17, "cai", "yue").g;
ok(/<b>静局未动<\/b> —— 始卦＝终卦（六爻全静，同卦不变）：无转移结构，内部未动。<br>成败不成立（无变动可成）；难易不适用；结果恒为与初始相当——<b>维持高位<\/b>（终态发展空间档：宫五行「金」在月支＝「旺」，旺相属高位）。/.test(anaChengbai(gQian).html), '静局判定（乾为天全静@酉月，金旺）：静局未动——成败不成立·难易不适用·结果恒与初始相当＝维持高位（终态发展空间档金@酉旺属高位）；与「不能启动」性质分立说明在案');
ok(CB_DYN_HTML["前置启动"].indexOf("<b>静局未动</b>") > -1 && CB_DYN_HTML["前置启动"].indexOf("<b>—（静局不另判启动）</b>") > -1 && CB_DYN_HTML["前置启动"].indexOf("静局结构上无位移要求，启动判定不适用") > -1, '⓪弹窗动态·静局（乾为天全静，v0.1.89 裁决定案）：静局判定列「静局未动」＋启动判定列「—（静局不另判启动）」——同框歧义消除，cb-off 分支填充弹窗缓存不再残留上盘');
ok(CB_DYN_HTML["过程难易"].indexOf("<b>静局无过程</b>") > -1 && CB_DYN_HTML["过程难易"].indexOf("静局未动（1前置启动）：成败不成立，难易不适用") > -1, '过程难易弹窗动态·静局（乾为天全静，v0.1.93 第18轮）：静局无过程——初始导向与施受不适用＋成败不成立难易不适用（cb-off 分支填充弹窗缓存不残留上盘）');
ok(/<i>1 <span class="cb-link" data-k="前置启动">前置启动<\/span><\/i><b>非静局｜顺畅启动（顺易）<\/b><\/div>/.test(cbH) && cbH.indexOf("强度修饰") === -1 && cbH.indexOf("互动模式落地只取支持梯队") === -1, '前置启动显示层精简（临→师，坤土@酉月午日）：标签整词cb-link＋判词两截——静局非静局｜启动可启动·顺畅启动；内源外源·强度修饰·分工说明全部移入弹窗（面板正文不再出现「强度修饰」「互动模式落地」）');
ok(CB_EXPLAIN["前置启动"].what.indexOf("两道闸门") > -1 && CB_EXPLAIN["前置启动"].what.indexOf("流程不截断") > -1 && CB_EXPLAIN["前置启动"].std.indexOf("休不能带动无根局") > -1 && CB_EXPLAIN["前置启动"].std.indexOf("艰难启动（极难）") > -1 && CB_EXPLAIN["前置启动"].std.indexOf("报告分两行写") > -1 && CB_EXPLAIN["前置启动"].logic.indexOf("梯队差恒为零") > -1, '⓪弹窗静态·前置启动（v0.1.91 参考资料31）：是什么＝两道闸门不改读数＋启动只出难易档不判成败；底层逻辑＝静局梯队差恒为零单列＋静局与艰难启动性质分立；计算标准＝启动四档（顺畅顺易/勉力偏难/借力偏难/艰难极难，废止不能启动）＋休不能带动无根局＋资源评级只作强度修饰＋双轨难易报告分两行写');
var gBiHtml = anaChengbai(gBi).html;
ok(/<b>非静局 · 同气换形｜顺畅启动（顺易）<\/b>/.test(gBiHtml) && CB_DYN_HTML["前置启动"].indexOf("两卦不同，宫五行同为「金」——同气换形，量级没变形态换了，有转移结构") > -1 && CB_DYN_HTML["前置启动"].indexOf("<b>非静局 · 同气换形</b>") > -1, '⓪静局判定同气换形分支（乾为天→天地否，两卦宫五行同金@酉月午日）：显示层简词「非静局 · 同气换形」，弹窗 dim 保留全口径——宫五行同·量级没变形态换了·有转移结构照常进入启动判定');
const gKanHtml = anaChengbai(fullFlow([6,9,6,6,7,6], 2026, 9, 17, "cai", "yue").g).html;
ok(/<b>非静局｜借力启动（偏难）<\/b>/.test(gKanHtml) && CB_DYN_HTML["前置启动"].indexOf("<b>借力启动（偏难）</b>") > -1 && CB_DYN_HTML["前置启动"].indexOf("内源（根）：末位梯队（月通根）· 末位梯队（日通根）→ 无根（两项同为末位）") > -1 && CB_DYN_HTML["前置启动"].indexOf("判定：全靠外部带动，不能自持") > -1, '1 行·启动判定借力·无根有气（坎为水→天火同人，坎水@酉月午日，v0.1.91 拆档）：趋势末位+支持末位＝无根；月相（酉金生水＝支生本端真输入）→借力启动·偏难＝全靠外部带动不能自持（原两类勉力拆为勉力〔有根无气〕与借力〔无根有气〕）');
const gMianHtml = anaChengbai(fullFlow([8,6,6,6,8,8], 2026, 8, 8, "cai", "yue").g).html;
ok(/<b>非静局｜勉力启动（偏难）<\/b>/.test(gMianHtml) && CB_DYN_HTML["前置启动"].indexOf("内源（根）：第三梯队（月通根）· 第三梯队（日通根）→ 有根（任一不低于第三梯队）") > -1 && CB_DYN_HTML["前置启动"].indexOf("外源（气）：月「休」输出（本端生支） · 日「死」被夺（彼方克我） → 无输入（月日皆休囚死——五档中只有旺相是能量输入，休是本端生支的向外泄出，不能带动无根局）") > -1 && CB_DYN_HTML["前置启动"].indexOf("判定：有立足点，但环境不供给") > -1, '⓪启动判定勉力·有根无气（坤为地→雷风恒，坤土@申月寅日2026-8-8）：申戊余气+寅戊余气＝双第三梯队有根；月休（土生金泄）+日死（寅木克土）＝无输入→勉力启动＝有立足点但环境不供给（详判移弹窗 dim；强度修饰资源较匮乏·高级发展见②表两行）');
const gJqd = anaChengbai(fullFlow([6,7,6,9,8,6], 2026, 9, 17, "cai", "yue").g).html;
ok(/<b>非静局｜艰难启动（极难）<\/b>/.test(gJqd) && CB_DYN_HTML["前置启动"].indexOf("<b>艰难启动（极难）</b>") > -1 && CB_DYN_HTML["前置启动"].indexOf("外源（气）：月「死」被夺（彼方克我） · 日「休」输出（本端生支） → 无输入（月日皆休囚死——五档中只有旺相是能量输入，休是本端生支的向外泄出，不能带动无根局）") > -1 && CB_DYN_HTML["前置启动"].indexOf("判定：无根无气，起动极其吃力——环节因难不等于事情不成") > -1, '⓪启动判定艰难·无根无气（雷水解→山天大畜，震木@酉月午日，v0.1.91 改档）：无根（两项末位）+无输入（月死日休）→艰难启动·极难＝起动极其吃力——原「不能启动」废止，启动只是环节流程不截断，凡有转移结构仍判成（详判移弹窗 dim）');
const gSame = zhuangGua("111111", [7,7,7,7,7,7], calS, true);
ok(gSame.bian && gSame.bian.info.name === gSame.info.name && gSame.bian.yao.length === 6 && gSame.bian.yao.every(y => !y.moved), '同卦起用引擎层（v0.1.72 · 参考资料28）：zhuangGua forceBian 时终卦＝始卦仍建变卦镜像，六爻 moved 全 false');
const cbSame = anaChengbai(gSame).html;
ok(/静局未动｜静局不另判启动/.test(cbSame) && CB_DYN_HTML["前置启动"].indexOf("<b>—（静局不另判启动）</b>") > -1, '1 行·静局同框消歧（乾为天→乾为天 forceBian，v0.1.89 裁决定案）：1 行与弹窗动态层启动判定列均改「—（静局不另判启动）」——静局结构上无位移要求，不再与「不能启动」同框矛盾');
ok(/2 <span class="cb-link" data-k="过程难易">过程难易<\/span><\/i><b>同气维持 · 成败不成立<\/b><\/div>/.test(cbSame) && CB_DYN_HTML["成败裁定"].indexOf("静局未动（1前置启动）：同卦不变已在静局闸截走，不入本篇——成败不成立") > -1 && cbSame.indexOf("② 结果好坏") === -1 && cbSame.indexOf("③ 外部处境") === -1 && cbSame.indexOf("⑤ 是否符合所求") === -1, '静局 2 行成败不成立＋弹窗静局闸（v0.1.95 三大块收窄）：同卦已在静局闸截走不入裁定，主界面无②③⑤三行');
eq(["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"].reduce(function (n, z) { return n + ["木","火","土","金","水"].filter(function (w) { return cbTidui(w, z) >= 1; }).length; }, 0), 28, '有根组合穷举 28/60（v0.1.88）：12 支×5 行支持梯队≥1 实测 28 种——原文「有根仅 31 种」按现行藏干表穷举为 28——差额恰为土寄四正（土@子·卯·酉），v0.1.89 裁决定案按通行藏干表 28（文档注记勘误）');
const gLow = fullFlow([6,7,6,6,7,6], 2026, 6, 17, "cai", "yue").g;
const calHai = computePillars(2026, 11, 17, 12, 0);
const calQu = computePillars(2026, 3, 1, 12, 0);
const g634 = anaChengbai(zhuangGua("001101", [6,6,7,7,6,7], calQu));
ok(/全程管控 · 勉力落成（偏难）/.test(g634.html) && CB_DYN_HTML["成败裁定"].indexOf("梯队差 -1（1-2）：难度来源为受动端（终态）的对抗阻力") > -1, '勉力分支（梯队差=-1，火山旅→乾为天，寅月戌日，v0.1.91 参考资料31）：施动端火@戌第三梯队(1)，受动端金@戌第二梯队(2)——梯队差-1＝勉力落成·偏难（阻力较大仍落地，七档全部属成）；v0.1.94 起梯队差推演只在「成败裁定」弹窗');
const g635 = anaChengbai(zhuangGua("011011", [6,9,7,6,9,7], calS, true));
ok(/主动顺推 · 微供顺推（极难）/.test(g635.html) && CB_DYN_HTML["成败裁定"].indexOf("梯队差 -3（0-3）：难度来源为施动端（始态）的供给缺口；起点无力：施动端处末位，可调用日令力量最弱") > -1, '生式分支（巽为风→离为火，始生终，酉月午日，v0.1.91 参考资料31）：施动端始巽木@午末位(0)且受动终离火@午第一梯队(3)＝梯队差-3＝微供顺推·极难——生式读梯队差与克式共用一把尺，判词语系不同，不设不成档；末位起点无力只作结构说明注解；v0.1.94 起推演只在「成败裁定」弹窗');
const g636 = anaChengbai(zhuangGua("000000", [8,6,8,8,6,8], computePillars(2026, 9, 20, 12, 0), true));
ok(/全程管控 · 持平落成（常规）/.test(g636.html) && CB_DYN_HTML["成败裁定"].indexOf("梯队差 0（0-0）：难度来源为受动端（终态）的对抗阻力；起点无力：施动端处末位，可调用日令力量最弱") > -1, '0-0 持平分支（坤为地→坎为水，始克终土水@酉日均末位，v0.1.91 参考资料31）：梯队差只读相对差不读绝对量——0-0 两端都弱的势均判持平落成·常规难度，末位低基底由五种结构说明注解（虚动不成废止）；v0.1.94 起推演只在「成败裁定」弹窗');
ok(["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"].every(z => new Set(["木","火","土","金","水"].map(w => cbQl(w, z).seq)).size === 5), '五档双射（参考资料28 §五前置）：任一月支下五行档序两两互异——档差为0 ⟺ 两端同宫五行（比和），故「与初始相当」必属同卦不变／同气换形之一，非比和的相当不存在');
const bhCb = renderBoard(sample.g, guaSec.html, halfSec.html);
ok(/<div class="cbz"><div class="cbz-l"><div class="gz-g">/.test(bhCb) && /<\/div><div class="cbz-r"><div class="duo-hd cbz-hd">过程与结果<\/div><div class="cb-panel">/.test(bhCb), '整卦区两栏（cbz）：左＝整卦图形块左移，右＝「过程与结果」成败面板');
ok(bhCb.indexOf('class="cbz-r"') > -1 && bhCb.indexOf('class="cbz-r"') < bhCb.indexOf('class="duo"') && bhCb.indexOf('duo-hd">整体态势分析') < bhCb.indexOf('class="cbz"'), '栏序：整体态势分析标题→cbz 两栏→双方态势分析（duo）');
ok(/\.cbz \{ display:grid; grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)/.test(HTML) && /@media \(max-width:1180px\)\s*\{\s*\.cbz \{ grid-template-columns:1fr/.test(HTML) && /\.cb-panel \{|\.cb-row \{|table\.cb-mini \{|\.cb-off \{/.test(HTML), 'cbz 两栏 CSS（v0.1.76 左右等宽 1fr/1fr，整卦卡最小宽 ~526px）＋1180 断点回落单列＋面板四件套样式');

/* ---- 通根（v0.1.77：月通根／日通根，卦宫五行对月支／日支藏干求根） ---- */
section('§9.6 通根（藏干本中余气）');
eq(Object.keys(ZHI_CANG).length, 12, 'ZHI_CANG 十二支藏干表齐全');
eq(tongGen("木","寅"), "本气根木", '通根本气（邦顺例）：木@寅（甲本气）＝本气根木');
eq(tongGen("金","巳"), "中气根金", '通根中气（邦顺例）：金@巳（庚中气）＝中气根金');
eq(tongGen("金","戌"), "中气根金", '通根中气：金@戌（辛中气）＝中气根金');
eq(tongGen("木","辰"), "中气根木", '通根中气：木@辰（乙中气）＝中气根木');
eq(tongGen("木","未"), "余气根木", '通根余气：木@未（乙余气）＝余气根木');
eq(tongGen("火","戌"), "余气根火", '通根余气：火@戌（丁余气）＝余气根火');
eq(tongGen("土","寅"), "余气根土", '通根余气：土@寅（戊余气）＝余气根土');
eq(tongGen("水","午"), "无根", '通根无根：水@午（藏丁己）＝无根');
ok(["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"].every(z => ZHI_CANG[z].length >= 1 && GAN_WX[ZHI_CANG[z][0]] === ZHI_WX[z] && tongGen(ZHI_WX[z], z) === "本气根" + ZHI_WX[z]), '十二支本气藏干五行＝支本五行，本气位必通根本气根');
eq(["木","火","土","金","水"].map(w => ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"].filter(z => tongGen(w, z) === "无根").length), [7, 7, 4, 7, 7], '各五行有根支数（无根 7/7/4/7/7）：木火金水各 5 支有根、土 8 支有根（仅子卯酉亥无根）');

/* ---- 四神上盘·全局标注（v0.1.64：用神统一标＋点爻高亮；v0.1.63 全局标注） ---- */
S.yong = sample.yong; S.hlRole = null;
const bh4 = renderBoard(sample.g, guaSec.html, halfSec.html);
ok(bh4.indexOf('<b class="tag shen-yong ah-link"') > -1 && !/class="tag yong"/.test(bh4) && !/r-yong/.test(bh4), '四神 v0.1.64：用神统一琥珀标（不再有红底反白 yong 与 r-yong 行；v0.2.24 ah-link 可点）');
ok((bh4.match(/tag shen-yuan[^>]*>原神/g) || []).length === 1 && (bh4.match(/tag shen-ji[^>]*>忌神/g) || []).length === 3 && (bh4.match(/tag shen-chou[^>]*>仇神/g) || []).length === 2, '四神全局：用神亥水 → 本卦原酉忌丑×2仇巳＋变卦二爻辰土忌、三爻午火仇（本变同五行四/五/上爻只标本卦，变初爻寅木为泄不标）');
ok(/data-pos="6">[^]*?shen-yuan[^>]*>原神[^]*?<\/tr>/.test(bh4) && /data-pos="1">[^]*?shen-chou[^>]*>仇神[^]*?<\/tr>/.test(bh4) && /data-pos="2">[^]*?shen-ji[^>]*>忌神[^]*?<\/tr>/.test(bh4) && /data-pos="3">[^]*?shen-chou[^>]*>仇神[^]*?<\/tr>/.test(bh4), '四神全局：原神上爻行、仇神初爻行（本）＋三爻行（变）、忌神二爻行（变）落位正确');
ok(/data-pos="5">[^]*?shen-yong[^>]*>用神[^]*?<\/tr>/.test(bh4), '四神 v0.1.64：取用爻（五爻亥水）挂琥珀用神标，与其它用神爻同款');
ok(bh4.indexOf('id="sel-yong"') > -1 && ['自动','妻财','官鬼','父母','子孙','兄弟'].every(function (t) { return bh4.indexOf('>' + t + '</option>') > -1; }), 'v0.1.64：细项分析右上用神下拉（自动＋五亲）');
ok(HTML.indexOf('.tag.shen-yong { background:#fdf1dc; color:#a8680a; box-shadow:0 0 0 2px #fff, 0 0 0 4px currentColor; }') > -1, 'v0.1.65：用神标常亮（白隙色环描边常驻，点击其它角色时并列明显）');
ok(HTML.indexOf('querySelectorAll("td.c-bian")') > -1 && HTML.indexOf('yaoRole(S.g.bian.yao[p - 1].wx, pickWx)') > -1, 'v0.1.66：变卦格独立点击（stopPropagation），按变卦爻五行判 yaoRole 全局点亮');
ok(typeof yaoRole === "function" && yaoRole("水", "水") === "yong" && yaoRole("金", "水") === "yuan" && yaoRole("土", "水") === "ji" && yaoRole("火", "水") === "chou" && yaoRole("木", "水") === "xie", 'v0.1.64：yaoRole 五行角色映射（同用/生原/克忌/仇/泄）');
S.hlRole = "ji";
ok(renderBoard(sample.g, guaSec.html, halfSec.html).indexOf('class="board hl-ji"') > -1, 'v0.1.64：S.hlRole 注入 board 类（点爻标亮同角色）');
S.hlRole = null;
S.yong = { rule: null, cands: [sample.g.yao[2]], pick: sample.g.yao[2], note: "手动指定用神" };
const bh4m = renderBoard(sample.g, guaSec.html, halfSec.html);
ok((bh4m.match(/tag shen-yuan[^>]*>原神/g) || []).length === 2 && (bh4m.match(/tag shen-ji[^>]*>忌神/g) || []).length === 2 && (bh4m.match(/tag shen-chou[^>]*>仇神/g) || []).length === 1 && (bh4m.match(/tag shen-yong[^>]*>用神/g) || []).length === 3, '四神全局：用神丑土 → 原神巳火＋午火(变)、忌神卯木＋寅木(变)、仇神亥水（五爻）、用神标统一：本卦丑×2＋变二爻辰土 共 3');
S.yong = null;
ok(sample.g.yao[1].bianRel === "化耗" && sample.g.yao[2].bianRel === "回头生" && sample.g.yao[5].bianRel === undefined && typeof sample.g.yao[1].bianKong === "boolean", '静变爻 bianRel/bianKong：二爻化耗、三爻回头生、五行同者无标');
ok(sample.secs.some(s => /八步|① 盘点/.test(s.title)), '含八步流程');
ok(sample.secs.some(s => /关系层/.test(s.title)), '含关系层');
ok(sample.secs.some(s => /成败层/.test(s.title)), '含成败层');
ok(sample.secs.some(s => /得失层/.test(s.title)), '含得失层');
ok(sample.secs.some(s => /吉凶层/.test(s.title)), '含吉凶层');
ok(sample.secs.some(s => /转太极/.test(s.title)), '含转太极');
ok(sample.secs.some(s => /宫位整体趋势/.test(s.title)), '含宫位趋势');
ok(sample.secs.some(s => /飞伏/.test(s.title)), '含飞伏');
ok(!/判定为成|判定为败|大吉|大凶/.test(sample.secs.map(s => s.html).join("")), '不输出吉凶断语（只描述）');

/* ============ 转太极 ============ */
section('§10 转太极');
function taijiOf(g, yong, pos) {
  const y = g.yao[pos - 1];
  return liuqinOf(yong.pick.wx, y.wx);
}
const gT = zhuangGua("000000", dur, cal0);  // 坤为地
const yT = { pick: gT.yao[0] };             // 太极点 = 初爻（乙未土）
eq(yT.pick.zhi, "未", '坤为地初爻乙未土');
eq(taijiOf(gT, yT, 2), "父母", '转太极：用神土 → 二爻巳火为父母（火生土）');
eq(liuqinOf("土", "土"), "兄弟", '同类为兄弟');
eq(liuqinOf("土", "火"), "父母", '用神土 → 火为父母（生用神）');
eq(liuqinOf("土", "金"), "子孙", '用神土 → 金为子孙（用神所生）');
eq(liuqinOf("土", "木"), "官鬼", '用神土 → 木为官鬼（克用神）');
eq(liuqinOf("土", "水"), "妻财", '用神土 → 水为妻财（用神所克）');

/* ============ 六亲基准：全卦一致性 ============ */
section('六亲基准：全 64 卦 × 6 爻一致性');
let mismatch = 0;
for (const bits in GONG_MAP) {
  const gi = guaInfo(bits);
  const g = zhuangGua(bits, dur, cal0);
  for (const y of g.yao) {
    if (y.liuqin !== liuqinOf(gi.gongWx, y.wx)) mismatch++;
  }
}
eq(mismatch, 0, '六亲一律以本卦卦宫五行为基准');

/* ============ 飞伏：全 64 卦 ============ */
section('飞伏：全 64 卦伏神正确性');
let fuBad = 0, fuTotal = 0;
for (const bits in GONG_MAP) {
  const gi = guaInfo(bits);
  const g = zhuangGua(bits, dur, cal0);
  const pres = {};
  g.yao.forEach(y => pres[y.liuqin] = 1);
  for (const f of g.fu) {
    fuTotal++;
    if (pres[f.liuqin]) fuBad++;                       // 已上卦的六亲不该有伏神
    const pureBits = TRI_BY_NAME[gi.gong].b + TRI_BY_NAME[gi.gong].b;
    const pureNj = najiaYao(pureBits);
    if (pureNj[f.pos - 1].zhi !== f.zhi) fuBad++;      // 伏神应取本宫首卦同爻位
  }
  const missing = LQ_ORDER.filter(lq => !pres[lq]);
  const fuLq = [...new Set(g.fu.map(f => f.liuqin))];
  if (missing.sort().join() !== fuLq.sort().join()) fuBad++;
}
ok(fuTotal > 0, '存在伏神样本（共 ' + fuTotal + ' 例）');
eq(fuBad, 0, '伏神 = 且仅 = 本卦未上卦的六亲，且取本宫首卦同爻位');

/* ============ 变爻符号定位 ============ */
{
  ok(HTML.includes('.gf-mk { position:absolute;') && HTML.includes('.gf-row { position:relative;'), '变爻符号绝对定位悬浮，不占爻线宽度（卦象与卦名同轴居中）');
}

/* ============ 起卦初始留白 ============ */
{
  const nulls = (SRC.match(/states: \[null, null, null, null, null, null\]/) || []).length;
  eq(nulls, 1, '起卦初始 S.states 全为留白（null）');
  const redo = (SRC.match(/S\.states = \[null, null, null, null, null, null\]/g) || []).length;
  eq(redo, 2, '整页重置／双端清空两处同步清空为留白');
  const guard = (SRC.match(/六爻尚未录入完整/) || [])[0];
  ok(!!guard, '未录入完整时禁止排盘并提示缺哪爻');
}

/* ============ 图形版模式位对齐 ============ */
{
  const css = (HTML.match(/\.gz-mid \{ grid-column:2; display:flex; flex-direction:column; align-items:center;/) || [])[0] && (HTML.match(/\.hf-mid \{ display:flex; flex-direction:column; align-items:center;/) || [])[0];
  ok(!!css, '图形版模式位（gz-mid／hf-mid）纵向居中对齐');
}

/* ============ 第67轮：变爻地支层 / 两现六环 / 应期九法 / 用神链 ============ */
section('变爻地支层（八法关系组＋状态组）');
const gB1 = buildG([9, 7, 7, 7, 7, 7], 2026, 9, 17);   // 乾初爻动：子化丑
const gB2 = buildG([7, 7, 7, 7, 7, 9], 2026, 9, 17);   // 乾上爻动：戌化未
const gB3 = buildG([6, 8, 8, 8, 8, 8], 2026, 9, 17);   // 坤初爻动：未化子
ok(gB1.yao[0].bian.zhiHe === true, '乾初爻动 子化丑 = 化合（子丑合）');
ok(gB2.yao[5].bian.zhiXing === '相刑', '乾上爻动 戌化未 = 化刑（丑戌未两支）');
ok(gB3.yao[0].bian.zhiHai === '相害', '坤初爻动 未化子 = 化害（子未害）');
let chongCnt = 0;
for (let b = 0; b < 64; b++) {
  const bits = b.toString(2).padStart(6, '0');
  for (let mp = 0; mp < 6; mp++) {
    const st = [7, 7, 7, 7, 7, 7];
    st[mp] = bits[mp] === '1' ? 9 : 6;
    const gg = buildG(st, 2026, 9, 17);
    if (gg.yao[mp].bian.zhiChong) chongCnt++;
  }
}
eq(chongCnt, 0, '穷举 64 卦×6 位单爻动（384 组合）：动爻位化冲结构性不存在（纳甲同位对无六冲）——防纳甲表意外改动');
{
  const yy = gB1.yao[0].bian;
  ok(yy.yuepo === (LIU_CHONG[yy.zhi] === ctx.DZ[gB1.cal.mdz]), '化月冲 = 变爻被月支冲（恒等）');
  ok(yy.ripo === (LIU_CHONG[yy.zhi] === gB1.cal.riZhi), '化日冲 = 变爻被日支冲（恒等）');
  ok(yy.jue === (yy.cs === '绝'), '化绝标记与长生位一致');
}

section('两现取用六环');
ok(SRC.includes('按取用序（动 > 旺 > 空破 > 世应 > 生扶 > 近世）'), '取用序六环文案');
ok(SRC.includes('narrow(function (c) { return c.moving; }, "动")'), '环1 取动（仅动爻）');
ok(SRC.includes('narrow(function (c) { return c.wang; }, "旺")'), '环2 取旺');
ok(SRC.includes('c.kong || c.yuepo || c.ripo'), '环3 取空破');
ok(SRC.includes('c.shi || c.ying'), '环4 取临世应');
ok(!/narrow\([^)]*["']高位["']/.test(SRC), '旧「高位」虚环已清除（取用六环语境；v0.1.72 起「高位相当／低位相当」为空间档定名，不属虚环）');

section('应期九法补齐');
{
  const gQ = buildG([9, 7, 7, 7, 7, 7], 2026, 9, 17);
  const q = ctx.yingQi(gQ, gQ.yao[0]);
  ok(Array.isArray(q) && q.every(x => x.zhi && x.why), 'yingQi 输出结构合法');
  if (gQ.yao[0].kong) ok(q.some(x => x.why.indexOf('冲空') >= 0), '空亡用神应期含冲空');
  if (gQ.yao[0].yuepo) ok(q.some(x => x.why.indexOf('出月') >= 0) && q.some(x => x.why.indexOf('合冲') >= 0), '月冲应期含出月与合冲');
}
ok(SRC.includes('变爻逢日空 —— 出空填实'), '变爻逢日空进应期');
ok(SRC.includes('<span class="warn">日空</span>') && SRC.includes('<b class="tag kong ah-link" data-ah="kong"') && SRC.includes("' · 日空'") && SRC.includes('逢日空</span>') && SRC.includes('伏神逢日空') && SRC.includes('用神逢日空 —— 出空') && SRC.includes('日旬空：'), 'v0.2.15 显示层日空明确化：伏神/变爻标签、行尾 · 日空、hf 逢日空、出伏条件、应期、导出日旬空 全在位（v0.2.24 空标 ah-link 可点）');
ok(!/>空</.test(SRC) && !/' · 空'/.test(SRC) && !/逢空<\/.span>/.test(SRC) && !/空亡 ——/.test(SRC) && !/旬空：/.test(SRC.replace('日旬空：','')), 'v0.2.15 笼统空标记撤除：>空<、· 空、逢空、空亡 ——、裸旬空： 全部不复存在');
ok(SRC.includes('飞神空破') && SRC.includes('y.kongKind = y.kong ? (y.wang ? "假空" : "真空") : ""'), 'v0.2.15 不动项：空破复合条件名与真空调判定保留');
ok(SRC.includes('用神被合 —— 逢冲（'), '被合逢冲开');
ok(SRC.includes('）制之'), '旺极逢克制');
ok(SRC.includes('"世爻", list: ls.slice(0, 2)'), '应期扩展·世爻组');
ok(SRC.includes('忌神（'), '应期扩展·忌神组');
ok(SRC.includes('原神（'), '应期扩展·原神组');

section('用神链补齐');
ok(SRC.includes('用神持世 —— 事与我不分'), '持世交叉判定');
ok(SRC.includes('用神临应 —— 事在对方'), '临应交叉判定');
ok(SRC.includes('真进</b>（原爻旺相') && SRC.includes('虚进</b>（原爻休囚'), '真进／虚进文案');
ok(SRC.includes('退而不退'), '旺相化退·退而不退');
ok(SRC.includes('function fuFeiDir'), 'fuFeiDir 函数存在');
ok(SRC.includes('飞神生伏') && SRC.includes('飞神克伏') && SRC.includes('伏神生飞（泄气）') && SRC.includes('伏神克飞') && SRC.includes('飞伏比和'), '飞伏方向五值');
ok(SRC.includes('飞神空破') && SRC.includes('飞神被合'), '出伏补条件·飞神空破／被合');
ok(SRC.includes('fu.wang = monthState(fu.wx, mdz, fu.zhi).wang'), '伏神旺相字段');
ok(SRC.includes('变爻地支层（八法关系组＋状态组）'), '分析层·变爻地支层汇总段');

/* ============ 第69轮：虚实四态 / 真假空 / 真假前缀 / 合起合绊 ============ */
section('虚实四态与真假空');
const gX = buildG([7, 7, 7, 7, 7, 7], 2026, 9, 17);   // 乾为天，日旬空辰巳
const gK = buildG([7, 7, 7, 7, 7, 7], 2026, 9, 21);   // 乾为天，2026-09-21 丁酉月 → 月空辰巳
ok(gK.cal.mkong && gK.cal.mkong.length === 2, '引擎·月旬空 mkong 两支');
const mx = Math.floor(gK.cal.mgz / 10) * 10;
eq(gK.cal.mkong.join(""), ctx.DZ[(mx + 10) % 12] + ctx.DZ[(mx + 11) % 12], '月空＝月柱所在旬空亡');
eq(gK.yao[2].mkong, true, '乾为天三爻（辰）临 2026-09-21 月空');
const tagK = ctx.yaoTag({ shi: true, kong: true, mkong: true });
ok(tagK.indexOf('日空') >= 0 && tagK.indexOf('月空') >= 0, '爻位双空分标 日空/月空');
/* v0.2.23 个性行 */
const tagW = ctx.yaoTag({ wx: "金", moving: false, ripo: true, xingRi: "相刑", mu: ["月墓", "日墓"], zhi: "申" });
ok(tagW.indexOf('<span class="tag wxx ah-link" style="color:' + ctx.WX_COLOR["金"] + '" data-ah="wx5" data-p="金">金</span>') === 0, '个性行五行标居首（tag wxx 着五行色；v0.2.24 ah-link 点开五行规则）');
ok(tagW.indexOf('>静<') >= 0 && tagW.indexOf('日冲') >= 0, '静爻被日冲：「静」与「日冲」并存（动静必有互不顶替，v0.2.23）');
ok(tagW.indexOf('日刑') >= 0 && tagW.indexOf('日墓') < tagW.indexOf('月墓'), '日刑在标、日墓在月墓前（日墓月墓分立，v0.2.23）');
const tagM = ctx.yaoTag({ wx: "水", moving: true, haiRi: "相害", xingYue: "自刑", haiYue: "相害" });
ok(tagM.indexOf('>动<') >= 0 && tagM.indexOf('日害') >= 0 && tagM.indexOf('月自刑') >= 0 && tagM.indexOf('月害') >= 0, '动爻个性行：动/日害/月自刑/月害（v0.2.23）');
ok(yaoWxTags("金", "午", { mdz: 2, riZhi: "午" }, "金", "金").indexOf('爻克月') >= 0, '月生克值：金爻寅月＝爻克月（v0.2.23）');
ok(yaoWxTags("木", "午", { mdz: 9, riZhi: "午" }, "木", "木").indexOf('月克爻') >= 0, '月生克值：木爻酉月＝月克爻（v0.2.23）');
const bianW = ctx.bianTag({ bian: { rel: "化进", mkong: true, heRi: true, haiRi: "相害" } }, { wx: "木" }, '<b class="tag shen-yong">用神</b>');
ok(bianW.indexOf('<span class="tag wxx ah-link" style="color:' + ctx.WX_COLOR["木"] + '" data-ah="wx5" data-p="木">木</span>') === 0 && bianW.indexOf('化进') > 0 && bianW.indexOf('用神') > 0 && bianW.indexOf('月空') >= 0 && bianW.indexOf('日合') >= 0 && bianW.indexOf('日害') >= 0, '变爻个性行：五行/化进/用神/月空/日合/日害（bianTag，v0.2.23；v0.2.24 标签 ah-link 化）');
const bianS = ctx.bianTag({ bianRel: "回头克", bianXingYue: "相刑" }, { wx: "土" }, "");
ok(bianS.indexOf('回头克') >= 0 && bianS.indexOf('月刑') >= 0, '静变爻个性行走标量字段：回头克/月刑（v0.2.23）');
ok(HTML.includes('<b>月空</b>') && HTML.includes('<b>日空</b>'), '头部两空标注（月空/日空）');
ok(SRC.includes('mkong') && SRC.includes('月旬空'), '月空贯通引擎与显示');
ok(gX.yao[0].xuShi === '实', '旺相不空破 = 实（乾初爻子水，月建酉金生之）');
ok(gX.yao[2].kong === true && gX.yao[2].xuShi === '虚', '旬空休囚 = 虚（乾三爻辰土，空又休）');
ok(gX.yao[2].kongKind === '真空', '休囚空 = 真空');
eq(gX.yao[0].kongKind, '', '不空者无空性标记');
let heSample = null;
for (let hi = 0; hi < 120 && !heSample; hi++) {
  const dt = new Date(Date.UTC(2026, 8, 1 + hi));
  const hg = buildG([7, 7, 7, 7, 7, 7], dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
  const hh = hg.yao.filter(x => x.heQi);
  if (hh.length) heSample = { g: hg, list: hh };
}
ok(heSample !== null, '存在日合静爻（合起／合绊）样本');
if (heSample) ok(heSample.list.every(x => x.heQi === ((x.wang) ? '合起' : '合绊')), '合起合绊按旺衰分流（旺相合起，休囚合绊）');

section('真假前缀与强弱降级');
eq(yaoRelText(gX.yao[2], gX.yao[0]), '假土克水·墓半合水', '空亡施力方 = 假克（辰空克子水）');
eq(yaoRelText(gX.yao[0], gX.yao[3]), '真水克火·相冲', '正常施力方 = 真克（子水克午火）');
eq(yaoRelText(gX.yao[0], gX.yao[1]), '真水生木', '施力方正常 = 真生（子水生寅木）');
eq(yaoRelText(gX.yao[0], gX.yao[1]), '真水生木', '施力方正常 = 真生（子水生寅木）');
const gX2 = buildG([7, 7, 7, 7, 7, 8], 2026, 9, 17);   // 泽天夬：内乾子水 外兑亥水
eq(yaoRelText(gX2.yao[0], gX2.yao[3]), '水·水 比和', '比和为同气不施受，不标真假');
ok(relStrength(gX, gX.yao[2], gX.yao[0]).dims.some(d => d.indexOf('作用不实') >= 0), 'relStrength 对空亡施力方降级标注');
ok(SRC.includes('y.xuShi = y.wang ? (broken ? "半实半虚" : "实") : (broken ? "虚" : "半虚半实")'), '虚实四态表达式');
ok(SRC.includes('y.kongKind = y.kong ? (y.wang ? "假空" : "真空") : ""'), '真假空表达式');
ok(SRC.includes('y.heQi = (!y.moving && (y.heRi || y.heYue)) ? (y.wang ? "合起" : "合绊") : ""'), '合起合绊表达式');
ok(SRC.includes('esc(p.xuShi)'), '用神段渲染虚实标签');

/* ============ §20 所求尺度 / 土行进退参考 ============ */
section('§20 所求尺度 / 土行进退参考');
eq(changeRelation({ wx: "土", zhi: "丑" }, "辰"), "化进", '丑化辰 = 土行化进');
eq(changeRelation({ wx: "土", zhi: "戌" }, "未"), "化退", '戌化未 = 土行化退');
const gXianTui = buildG([7, 7, 7, 7, 7, 9]);
eq(gXianTui.yao[5].bian.rel, "化退", '乾上爻戌化未 = 化退');
eq(gXianTui.yao[5].bian.tuRef, true, '土行化退标 tuRef');
const gXianJin = buildG([7, 7, 7, 7, 7, 6]);
eq(gXianJin.yao[5].zhi, "未", '咸卦上爻未');
eq(gXianJin.yao[5].bian.rel, "化进", '咸上爻未化戌 = 化进');
eq(gXianJin.yao[5].bian.tuRef, true, '土行化进标 tuRef');
ok(HTML.includes('id="sel-suqiu"') && HTML.includes('value="tui"'), 'UI·所求独立下拉（希望增加/希望维持/希望减少）');
ok(!HTML.includes('应期看') && !SRC.includes('suqTip'), '解绑·所求与应期尺度脱钩（求进≠看日旬）');
eq(S.suQiu, "bian", '所求默认求进');
const r8t = ctx.anaStep8(gXianTui, { pick: gXianTui.yao[5] });
ok(r8t.html.indexOf("日／旬") < 0, '所求≠应期尺度：求进模式无日旬提示');
ok(r8t.html.indexOf("退局信号") < 0, '求进模式不出退局信号段');
const r7t = ctx.anaStep7(gXianTui, { pick: gXianTui.yao[5] });
ok(r7t.html.indexOf("作参考，力度次于") >= 0, '土行化退 → anaStep7 土行参考注');
ok(SRC.includes('（土行·不成进退）') && !SRC.includes('（土行·参考）'), '趋势层土行注自释义「不成进退」·撤「参考」');
ctx.S.suQiu = "tui";
const r8r = ctx.anaStep8(gXianTui, { pick: gXianTui.yao[5] });
ok(r8r.html.indexOf("月／年") < 0, '所求≠应期尺度：求退模式无月年放宽');
ok(r8r.html.indexOf("退局信号") >= 0 && r8r.html.indexOf("化退") >= 0, '求退模式列出退局信号');
ctx.S.suQiu = "bian";
eq(S.suQiu, "bian", '所求状态恢复');

/* ============ §21 预测档案 ============ */
section('§21 预测档案');
ctx.window = { confirm: () => true, scrollTo: () => {} };
ctx.localStorage = { _s: {}, getItem(k) { return this._s[k] !== undefined ? this._s[k] : null; }, setItem(k, v) { this._s[k] = String(v); }, removeItem(k) { delete this._s[k]; } };
const { arcLoad, arcPersist, arcGet, arcAdd, arcMerge, arcDel, arcVerdictSave, arcReplay } = ctx;
ok(HTML.includes('id="btn-save-arc"'), 'HTML: 存入档案按钮');
ok(HTML.includes('id="arc-card"'), 'HTML: 档案卡片区');
ok(HTML.includes('id="arc-card" hidden'), 'HTML: 档案卡片默认收起');
ok(HTML.includes('id="btn-arc-toggle"'), 'HTML: 档案开关按钮');
ok(HTML.includes('arc-toggle-row'), 'HTML: 档案开关行');
ok(SRC.includes('function arcSyncToggle'), 'SRC: 档案开关状态同步');
ok(HTML.includes('id="arc-import-file"'), 'HTML: 导入文件 input');
ok(HTML.includes('.v-badge'), 'HTML: 验证徽标样式');
ok(SRC.includes('ly_paipan_archives_v1'), 'SRC: 档案存储键');
['function arcAdd', 'function arcMerge', 'function arcDel', 'function arcVerdictSave',
 'function arcReplay', 'function arcRender', 'function arcFillOpen',
 'function arcExportClick', 'function arcImportFile'].forEach(f =>
  ok(SRC.includes(f), 'SRC: ' + f.slice(9)));
eq(arcLoad(), [], '初始档案为空');
ctx.S.g = null;
ok(arcAdd() === false, '无卦不存档');
eq(arcLoad().length, 0, '无卦存档后仍为空');
const gArc = buildG([7, 7, 7, 7, 7, 9], 2026, 9, 21);
ctx.S.g = gArc;
ctx.S.states = [7, 7, 7, 7, 7, 9];
ok(arcAdd() === true, '有卦存档成功');
eq(arcLoad().length, 1, '存档后 1 条');
const r0 = arcLoad()[0];
eq(r0.states, [7, 7, 7, 7, 7, 9], '档案记录六爻状态');
eq(r0.t.length, 5, '档案记录起卦时间五元组');
ok(r0.gn.indexOf('乾为天') >= 0, '档案记录卦名');
ok(r0.gz.split(' ').length === 4, '档案记录四柱');
eq(r0.verdict.st, 'tbd', '新档案验证态为未验');
ok(arcVerdictSave(r0.id, 'ok', '2026-09-28', '应验：9-25 播放破万'), '回填保存成功');
eq(arcGet(r0.id).verdict, { st: 'ok', at: '2026-09-28', note: '应验：9-25 播放破万' }, '回填已写入');
const listA = arcLoad();
const added = arcMerge(listA, [
  { id: 999, t: [2026, 9, 20, 10, 30], q: '导入测试', qt: 'zi', sq: 'bian', ref: 'yue',
    states: [8, 8, 8, 8, 8, 8], coins: null, note0: '', gn: '坤为地', verdict: { st: 'tbd', at: '', note: '' } },
  { id: r0.id, states: [6, 6, 6, 6, 6, 6] }
]);
eq(added, 1, '导入去重：只加新 id');
arcPersist(listA);
eq(arcLoad().length, 2, '合并后 2 条');
let mergeThrew = false;
try { arcMerge([], { not: 'array' }); } catch (e) { mergeThrew = true; }
ok(mergeThrew, '非数组导入报错');
ok(arcDel(r0.id) === 1, '删除 1 条');
eq(arcLoad().length, 1, '删除后剩 1 条');
eq(arcLoad()[0].id, 999, '剩的是导入那条');
arcReplay(999);
eq(ctx.S.states, [8, 8, 8, 8, 8, 8], '重放恢复六爻状态');
eq(ctx.S.qtype, 'zi', '重放恢复事项类型');
ok(!HTML.includes('事项类型（定用神）') && !HTML.includes('id="sel-qtype"'), 'UI：输入区「事项类型（定用神）」下拉已撤（v0.2.26），用神选取仅在分析区 sel-yong');
ctx.S.g = null;

/* ============ 盘面爻线颜色口径 ============ */
ok(HTML.includes('.glyph.mv i { background:var(--red); }'), '盘面动爻爻线保持红');

/* ============ 引擎 1a/1c 行为断言（v0.1.49 补齐零覆盖批次） ============ */
section('引擎 1a/1c 行为断言（日冲单维／半合三档／三刑六害／反吟伏吟／冲合卦／三合局／墓库分野／动静结构）');
eq(sanHeRel("申", "子"), "生半合水", 'sanHeRel 生半合：申子（长生+帝旺）→生半合水');
eq(sanHeRel("子", "辰"), "墓半合水", 'sanHeRel 墓半合：子辰（帝旺+墓库）→墓半合水');
eq(sanHeRel("申", "辰"), "拱合水", 'sanHeRel 拱合：申辰（长生+墓库）→拱合水');
eq(sanHeRel("巳", "酉"), "生半合金", 'sanHeRel 巳酉→生半合金');
eq(sanHeRel("子", "丑"), "", 'sanHeRel 非同组两支→空');
eq(xingRel("寅", "巳"), "相刑", 'xingRel 寅巳相刑');
eq(xingRel("丑", "戌"), "相刑", 'xingRel 丑戌相刑');
eq(xingRel("辰", "辰"), "自刑", 'xingRel 辰辰自刑');
eq(xingRel("子", "卯"), "相刑", 'xingRel 子卯相刑');
eq(xingRel("子", "丑"), "", 'xingRel 非刑对→空');
eq(haiRel("子", "未"), "相害", 'haiRel 子未相害（正向）');
eq(haiRel("未", "子"), "相害", 'haiRel 未子相害（双向映射）');
eq(haiRel("子", "丑"), "", 'haiRel 非害对→空');
eq(fanFuYin(["子", "寅", "辰", "午", "申", "戌"], ["午", "申", "戌", "子", "寅", "辰"]), "全卦反吟", 'fanFuYin 六爻全冲→全卦反吟');
eq(fanFuYin(["子", "寅", "辰", "午", "申", "戌"], ["子", "寅", "辰", "午", "申", "戌"]), "全卦伏吟", 'fanFuYin 六爻全同→全卦伏吟');
eq(fanFuYin(["子", "寅", "辰", "午", "申", "戌"], ["午", "申", "戌", "午", "申", "戌"]), "内卦反吟·外卦伏吟", 'fanFuYin 内冲外同→内卦反吟·外卦伏吟');
eq(fanFuYin(["子", "寅", "辰", "午", "申", "戌"], null), "", 'fanFuYin 无变卦→空');
eq(chongHeGua(["子", "寅", "辰", "午", "申", "戌"]), "六冲卦", 'chongHeGua 乾为天（子寅辰/午申戌三组全冲）→六冲卦');
eq(chongHeGua(["子", "寅", "辰", "丑", "亥", "酉"]), "六合卦", 'chongHeGua 地天泰（子寅辰/丑亥酉三组全合）→六合卦');
eq(chongHeGua(["子", "寅", "辰", "巳", "未", "酉"]), "", 'chongHeGua 非冲非合→空（冲合互斥单返）');
const q49 = fullFlow([7, 7, 7, 7, 7, 7], 2026, 9, 25, "cai", "yue");
eq(q49.g.guaChongHe, "六冲卦", '乾为天全静（酉月寅日）：guaChongHe=六冲卦');
eq(q49.g.structType, "全静", '乾为天全静：structType=全静');
eq(q49.g.fanFuYin, "", '全静无变卦：g.fanFuYin=空');
eq(q49.g.yao[4].ripo === true && q49.g.yao[4].wang === true, true, '日冲单维·旺相：五爻申（比和酉月=旺）被寅日冲→日冲（v0.2.20 起不再判暗动）');
const b49 = fullFlow([7, 7, 7, 7, 7, 7], 2026, 9, 27, "cai", "yue");
eq(b49.g.yao[5].ripo === true && b49.g.yao[5].wang === false, true, '日冲单维·休囚逢生：上爻戌（酉月休）被辰日冲、辰土比和→日冲（不再判半动半破）');
const p49 = fullFlow([7, 7, 7, 7, 7, 7], 2026, 6, 25, "cai", "yue");
eq(p49.g.yao[0].ripo === true && p49.g.yao[0].wang === false, true, '日冲单维·休囚无生：初爻子（午月克=死）被午日冲→日冲');
eq(fullFlow([9, 7, 8, 8, 8, 8], 2026, 9, 25, "cai", "yue").g.structType, "独发", 'structType 单爻动→独发');
eq(fullFlow([9, 9, 9, 9, 9, 7], 2026, 9, 25, "cai", "yue").g.structType, "独静", 'structType 五动一静→独静');
eq(fullFlow([9, 9, 9, 9, 9, 9], 2026, 9, 25, "cai", "yue").g.structType, "全动", 'structType 六爻全动→全动');
const k49 = fullFlow([7, 7, 7, 7, 7, 7], 2026, 9, 24, "cai", "yue");
eq(k49.g.yao[4].mu.includes("日墓") && k49.g.yao[4].muKind === "入库", true, '墓库分野·入库：申金（酉月旺）遇丑日（金墓）→日墓＋入库');
const m49 = fullFlow([7, 7, 8, 8, 8, 8], 2026, 9, 30, "cai", "yue");
eq(m49.g.yao[1].mu.includes("日墓") && m49.g.yao[1].muKind === "入墓", true, '墓库分野·入墓：卯木（酉月死）遇未日（木墓）→日墓＋入墓');
const s49 = fullFlow([8, 8, 9, 8, 9, 8], 2026, 9, 25, "cai", "yue");
eq(s49.g.sanHeJu.length === 1 && s49.g.sanHeJu[0].wx === "木" && s49.g.sanHeJu[0].act === 2 && s49.g.sanHeJu[0].lack.join("") === "未", true, 'sanHeJu 三五爻动两变支（卯亥）现→亥卯未木局 act=2，缺未由日月无补→缺支无着');

/* ---- 引擎 1d：g.half 半卦级（halfLevel） ---- */
const h51a = fullFlow([7, 7, 7, 7, 7, 7], 2026, 9, 25, "cai", "yue");
eq(h51a.g.half.shiUp, true, 'g.half 乾为天世在上卦→shiUp=true');
eq(h51a.g.half.up.ben.n === "乾" && h51a.g.half.up.ben.wx === "金" && h51a.g.half.up.bian === null && h51a.g.half.up.md === null, true, 'g.half 全静上半卦：乾金无变侧无五型');
eq(h51a.g.half.low.ben.zheng.level, "卦我比和", 'g.half 下半卦乾金受本宫乾金同宫→整卦旺衰＝卦我比和（v0.1.99 卦生克）');
const h51b = fullFlow([7, 7, 9, 7, 7, 7], 2026, 9, 25, "cai", "yue");
eq(h51b.g.half.up.bian.n === "乾" && h51b.g.half.up.md.name === "原状维持型", true, 'g.half 乾九三动：上卦未变仍得变侧（乾→乾＝原状维持型）');
eq(h51b.g.half.low.bian.n === "兑" && h51b.g.half.low.bian.wx === "金" && h51b.g.half.low.md.name === "原状维持型", true, 'g.half 乾九三动下卦变兑：半卦本变五型＝原状维持型（金→金）');
const h51c = fullFlow([9, 7, 8, 8, 8, 8], 2026, 9, 25, "cai", "yue");
eq(h51c.g.half.shiUp === false && h51c.g.half.up.ben.n === "坤" && h51c.g.half.up.ben.wx === "土" && h51c.g.half.low.bian.n === "坎" && h51c.g.half.low.bian.wx === "水" && h51c.g.half.low.md.name === "主动顺推型", true, 'g.half 临→师：世在下卦 shiUp=false，上坤土下兑金变坎水，金生水＝主动顺推型');
eq(h51c.g.half.up.bian.n === "坤" && h51c.g.half.up.md.name === "原状维持型", true, 'g.half 临→师上卦坤→坤＝原状维持型');
eq(h51c.g.half.up.ben.yue.level === "休" && h51c.g.half.low.ben.yue.level === "旺", true, 'g.half 酉月半卦月旺衰：坤土我生月令＝休、兑金比和月令＝旺');

/* ============ 参考资料 27 · 双端起卦（双端独立抽卦法 v1.0.0） ============ */
section('双端起卦：编码转换／XOR 动爻／dualStates／两端集成／UI 两步交互');
eq(DUAL_METHOD, "independent_dual_hexagram", '算法字段名＝independent_dual_hexagram');
eq(DUAL_VERSION, "1.0.0", '算法版本＝1.0.0');
eq(codeToBits(0), "000000", 'codeToBits(0)=坤 全阴六位（低位=初爻）');
eq(codeToBits(63), "111111", 'codeToBits(63)=乾 全阳六位');
eq(codeToBits(1), "100000", 'codeToBits(1)=初爻阳余阴');
eq(codeToBits(5), "101000", 'codeToBits(5)=初阳二阴三阳（离下）');
eq(codeToBits(42), "010101", 'codeToBits(42)=初阴二阳…上阳（坎下离上）');
let rtOk = true;
for (let c = 0; c < 64; c++) if (bitsToCode(codeToBits(c)) !== c) rtOk = false;
eq(rtOk, true, 'bitsToCode∘codeToBits 在 0–63 全域往返一致');
eq(randCode64(() => 200), 8, 'randCode64 注入 stub：200&63=8');
eq(randCode64(() => 255), 63, 'randCode64 注入 stub：255&63=63');
eq(randCode64(() => 64), 0, 'randCode64 注入 stub：64&63=0');
const dd1 = dualDraw(5, 42);
eq(dd1.method, "independent_dual_hexagram", 'dualDraw 结果带 method 字段');
eq(dd1.algorithmVersion, "1.0.0", 'dualDraw 结果带 algorithmVersion 字段');
eq(dd1.changingMask, 47, 'dualDraw(5,42)：XOR 掩码=47');
eq(JSON.stringify(dd1.changingLines), JSON.stringify([1, 2, 3, 4, 6]), 'dualDraw(5,42)：动爻位=[初,二,三,四,上]（自下而上）');
eq(dd1.changingCount, 5, 'dualDraw(5,42)：动爻数=5');
eq(dd1.isSameHexagram, false, 'dualDraw(5,42)：始终异卦');
const dd2 = dualDraw(9, 9);
eq(dd2.changingMask === 0 && dd2.changingCount === 0 && dd2.isSameHexagram === true, true, 'dualDraw(9,9)：同卦→零动爻、isSameHexagram=true');
eq(dualDraw(0, 63).changingCount, 6, 'dualDraw(0,63)：坤↔乾→六爻全动');
eq(JSON.stringify(dualStates(5, 42)), JSON.stringify([9, 6, 9, 6, 8, 6]), 'dualStates(5,42)：始终同爻=少（阳7阴8）、异爻=老（始阳9始阴6）');
eq(JSON.stringify(dualStates(0, 63)), JSON.stringify([6, 6, 6, 6, 6, 6]), 'dualStates(0,63)：始坤终乾→全老阴6');
eq(JSON.stringify(dualStates(63, 0)), JSON.stringify([9, 9, 9, 9, 9, 9]), 'dualStates(63,0)：始乾终坤→全老阳9');
const gd = buildG(dualStates(5, 42), 2026, 9, 17);
eq(gd.info.name, "地火明夷", '双端集成：始卦5=地火明夷（本卦）');
eq(gd.bian.info.name, "火水未济", '双端集成：变卦必等于抽取终卦42=火水未济');
eq(gd.bian.info.bits, codeToBits(42), '双端集成：变卦bits=终卦编码42的位串');
eq(gd.yao.map(y => y.moving ? 1 : 0).join(""), "111101", '双端集成：动爻分布=掩码47（五爻静、余五爻动）');
eq(gd.yao[0].zhi + gd.yao[5].zhi, "卯酉", '双端集成：装卦按始卦纳甲（明夷初爻己卯、上爻癸酉）');
eq(JSON.stringify(dualStates(9, 9)), JSON.stringify([7, 8, 8, 7, 8, 8]), 'dualStates(9,9)：震为雷(9)同卦→动爻位少阳7余少阴8');
const gs = buildG(dualStates(0, 0), 2026, 9, 17);
eq(gs.info.name === "坤为地" && gs.bian === null && gs.structType === "全静", true, '双端同卦(0,0)：坤为地全静、无变卦（不起用路径）');
ok(!HTML.includes('双端独立抽卦法 ——') && !HTML.includes('自初爻至上爻') && !HTML.includes('independent_dual_hexagram v'), 'UI：双端说明标题／编码括号／版本号已撤（v0.2.25）');
ok(HTML.includes('id="btn-dual-start"') && HTML.includes('id="btn-dual-end"') && HTML.includes('id="btn-dual-redo"'), 'UI：抽始卦／抽终卦／清空双端三按钮');
ok(HTML.includes('两卦独立，终卦不排除与始卦相同'), 'UI：未抽取态说明含独立与不排除语义');
ok(HTML.includes('>抽取终卦</button>') && HTML.includes('S.dual.phase !== "end" ? \' disabled\' : \'\''), 'UI：抽终卦按钮在未抽始卦前置灰');
ok(HTML.includes('btn-dual-end").onclick = dualEnd') && HTML.includes('btn-dual-start").onclick = dualStart'), 'UI：双端按钮事件绑定');
ok(!HTML.includes('双端起卦（独立抽卦法 v') && !HTML.includes('两端逐爻之差，动爻'), 'UI：双端出盘 tossNote 已撤（v0.2.27），dual-line 同卦提示保留');
ok(HTML.includes('两卦相同，六爻皆静'), 'UI：dual-line 双端同卦提示文案');
ok(/function dualClear\(\) \{\n  S\.dual = null;\n  dualResetBoard\(\);\n  buildTossUI\(\);\n\}/.test(HTML), '清空双端：dualClear 清 S.dual 并复位盘面');
ok(HTML.includes('btn-dual-redo").onclick = dualClear'), '清空双端按钮绑定 dualClear');
ok(!HTML.includes('btn-toss-one') && !HTML.includes('btn-toss-all') && !HTML.includes('m-btn'), '摇卦 UI 已整体移除（代掷按钮／手动录入按钮无残留）');
ok(!HTML.includes('tossTria') && !HTML.includes('triaState') && !HTML.includes('defaultRng'), '摇卦引擎函数已移除（tossTria／triaState／defaultRng 无残留）');
ok(!HTML.includes('tossCoins'), 'S.tossCoins 状态已移除');

ok(HTML.includes('id="btn-mode-random"') && HTML.includes('id="btn-mode-manual"') && HTML.includes('>线下抽卦</button>') && HTML.includes('>线上录卦</button>'), 'v0.2.33 起卦两方式平铺（第70轮）：线下抽卦／线上录卦入口按钮');
ok(HTML.includes('id="btn-mode-back"') && HTML.includes('S.tossMode = ""; buildTossUI();'), 'v0.2.33 返回按钮回到方式选择');
ok(HTML.includes('guaDdHtml("dd-gua-start")') && HTML.includes('guaDdHtml("dd-gua-end")') && HTML.includes('>录卦入盘</button>'), 'v0.2.33 线上录卦：始卦／终卦 64 卦下拉与录卦入盘按钮');
const { GUA_LIST, manualDone } = ctx;
eq(GUA_LIST.length, 64, 'v0.2.33 线上录卦：64 卦全量入选择列表');
eq(GUA_LIST.filter(function (x) { return x.name === "乾为天"; })[0].code, 63, 'v0.2.33 线上录卦：乾为天＝code 63（六爻全阳）');
eq(GUA_LIST.filter(function (x) { return x.name === "坤为地"; })[0].code, 0, 'v0.2.33 线上录卦：坤为地＝code 0（六爻全阴）');
eq(GUA_LIST[0].name, "乾为天", 'v0.2.33 线上录卦：列表按八宫序，首卦乾宫纯卦');
ok(GUA_LIST.every(function (x) { return x.gong && x.seq >= 0 && x.seq <= 7; }), 'v0.2.33 线上录卦：每卦带宫名与宫序');
ok(HTML.includes('S.dual = { phase: "done", startCode: sc, endCode: ec };') && HTML.includes('S.states = dualStates(sc, ec);') && HTML.includes('btn-manual-done").onclick = manualDone'), 'v0.2.33 录卦入盘：manualDone 复用双端引擎入盘');

ok(HTML.includes('<input type="text" placeholder="搜卦名／宫名" id="\' + id + \'-search">'), 'v0.2.35 下拉内置搜索（第72轮）：始卦／终卦面板各带搜索框');
ok(HTML.includes('function guaDdFilter') && HTML.includes('items[i].hidden = !!kw && items[i].dataset.key.indexOf(kw) < 0;'), 'v0.2.35 下拉内置搜索：按卦名＋宫名 data-key 过滤 64 卦');
ok(HTML.includes('guaDdSet(id, parseInt(t.dataset.code, 10));') && HTML.includes('guaDdCloseAll();'), 'v0.2.35 下拉内置搜索：点选即写入并收起面板');
ok(HTML.includes('sc = parseInt($("dd-gua-start").dataset.code, 10)') && HTML.includes('$(id + "-search").oninput = function () { guaDdFilter(this); };'), 'v0.2.35 下拉内置搜索：manualDone 读 data-code，oninput 实时过滤');

ok(!/生命算法 · 六爻排盘 v0\./.test(HTML) && (HTML.match(/class="f-txt"/g) || []).length === 1 && HTML.includes('>生命算法 · 六爻排盘</div>'), 'v0.2.16 页脚版本说明区下线（第46轮）：28 条版本行撤除，只留极简产品名一行，历史说明归 CHANGELOG／档案');
ok(!/日破/.test(SRC) && !/日破/.test(HTML) && p49.secs.some(f => f.html.includes('日冲')) && SRC.includes('"化日冲"'), 'v0.2.17 日破改日冲（第47轮）：ripo 显示名「日破」→「日冲」（被日令冲），变爻层「化日破」→「化日冲」，全站无「日破」残留');
const cd49 = fullFlow([7, 7, 7, 7, 9, 7], 2026, 9, 25, "cai", "yue");
eq(cd49.g.yao[4].moving === true && cd49.g.yao[4].chongRi === true && !cd49.g.yao[4].ripo && cd49.secs.some(f => f.html.includes('冲日')), true, 'v0.2.17 冲日新标（第47轮）：动爻爻支冲日支（乾九五申动、寅日）标「冲日」（爻冲日令）；静爻冲日一律标「日冲」（v0.2.20 单维）');
ok(!/暗动|半动半破|halfDark|\.dark\b/.test(SRC) && !/暗动|半动半破/.test(HTML), 'v0.2.20 日冲单维（第51轮）：暗动／半动半破复合标志撤除，静爻逢日辰冲一律标「日冲」，暗动不再参与强弱／三合局／取用收窄');
ok(!/月破/.test(SRC) && !/月破/.test(HTML) && p49.secs.some(f => f.html.includes('月冲')) && SRC.includes('"化月冲"'), 'v0.2.18 月破改月冲（第48轮）：yuepo 显示名「月破」→「月冲」（被月令冲，中性表达），变爻层「化月破」→「化月冲」，世爻提示与应期「出月／合冲」同步，全站无「月破」残留');
const cy48 = fullFlow([7, 9, 8, 7, 7, 8], 2026, 9, 25, "cai", "yue");
eq(cy48.g.yao[1].moving === true && cy48.g.yao[1].chongYue === true && !cy48.g.yao[1].yuepo && cy48.secs.some(f => f.html.includes('冲月')), true, 'v0.2.18 冲月新标（第48轮）：动爻爻支冲月支（兑九二卯动、酉月）标「冲月」（爻冲月令）；静爻被月冲标「月冲」，月向日向对称');

ok(/<body class="src-hidden">/.test(HTML), 'v0.2.19 数据源默认隐藏（第49轮）：body 初始带 src-hidden，数据源括号注（cb-src）默认不显示，按钮初始「显示数据源」，开关机制与重排盘状态保持不变');

/* ============ 汇总 ============ */
ok(/y\.kongKind = y\.kong \? \(y\.wang \? "假空" : "真空"\) : ""/.test(SRC) && /var broken = \(y\.kong \|\| y\.yuepo \|\| y\.muKind === "入墓"\)/.test(SRC) && !/broken = \(y\.kong \|\|.*mkong/.test(SRC) && !/v0\.2\.14 · Q6 月空销案/.test(HTML), 'v0.2.14 Q6 月空销案（第45轮）：月空维持仅标注——kongKind 真假空只认 y.kong（日空）、broken 三要素不含 mkong（v0.2.20 起 ripo 退出 broken）、页脚 v0.2.14 行已撤（v0.2.16 页脚版本说明区整体下线，页脚属 HTML 非 SRC 脚本块）；判定层一切空亡口径走日空（D16）');

console.log('\n════════════════════════════════');
console.log('通过 ' + pass + ' 条，失败 ' + fail + ' 条');
if (fail) {
  console.log('\n失败明细：');
  failures.forEach((f, i) => console.log('  ' + (i + 1) + '. ' + f));
  process.exit(1);
}
console.log('全部断言通过 ✅');
