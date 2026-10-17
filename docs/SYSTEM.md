# SYSTEM · 六爻排盘工程结构

- 版本：v0.1.33
- 运行目录：`~/.clacky/ext/local/liuyao-paipan/`（工作区经 `六爻排盘·运行` 软链进入）
- 类型：Clacky 扩展（单文件前端 + Ruby API），入口收进「生命排盘」launcher，不注册独立侧栏。

---

## 1. 目录

```
liuyao-paipan/
├── ext.yml                    扩展声明（id / version / standalone 入口）
├── index.html                 交付产物：单文件前端（src 重建，尺寸以构建输出为准）
├── api/handler.rb             扩展 API：GET /standalone 返回 index.html
├── panels/liuyao/             预留面板目录（本期走 standalone）
├── src/                       可重建源码（构建产物 = index.html）
│   ├── a_head.html            DOCTYPE + CSS + body 标记 + 页脚（极简产品名，版本说明归 CHANGELOG）
│   ├── c_data.js              常量表：干支 / 五行 / 纳甲 / 卦宫 / 六神 / 神煞 / 用神规则
│   ├── d_engine.js            引擎：历法 → 四柱（含月旬空）→ 装卦 → 状态层（虚实真假 / 合起合绊）
│   ├── e_analysis.js          分析层：整卦 / 半卦 / 用神六环 / 八步（应期九法）/ 四层 / 宫位 / 转太极 / 飞伏
│   ├── f_ui.js                界面：摇卦录入（页面代掷）/ 盘面渲染（月空日空双标）/ 所求下拉 / 预测档案 / 复制
│   ├── g_tail.html            收尾：事项下拉填充 + init()
│   └── tables/                复用资产（与 qimen-paipan 同源，字节一致）
│       └── solar_terms.js     精确节气表（365,722 B）
├── scripts/
│   ├── build.sh               src → index.html，语法校验 + 字节/md5 打印
│   └── extract-tables.sh      从 ../qimen-paipan/index.html 提取节气表
├── tests/run_tests.js         回归测试：732 条断言（vm ctx 直取引擎函数）
└── docs/                      ALGORITHM / ADR_六爻 / PRD_六爻 / SYSTEM / README / CHANGELOG
```

档案与历史版本快照在工程外层：`六爻排盘·档案/`（每版一目录 + README 索引 + 参考资料）。

## 2. 构建与验收

```bash
bash scripts/build.sh          # 拼接 src → index.html（幂等，可核对 md5）
node tests/run_tests.js        # 提交门禁：732 条断言须全绿
```

当前产物指纹：`index.html` = 480,300 B，md5 `f254074693ef9d62ad7bc04c1228993b`（v0.1.33）。

## 3. 分层与依赖方向

```
c_data.js   常量（无依赖）
d_engine.js 依赖 c_data        纯函数：输入摇卦结果/日期 → 卦象与状态对象
e_analysis  依赖 c_data,d_engine  输入卦象 → 19 节客观分析文本
f_ui.js     依赖 全部           DOM 渲染与交互（唯一持有全局状态 S）
```

分析层不反向依赖 UI；UI 是唯一有副作用的地方。

## 4. 升版收口（三处必须同步）

1. `ext.yml` → `version`
2. `CHANGELOG.md` 顶部新条目（页脚版本说明区已下线，版本记录以 CHANGELOG 为准）
3. 归档快照到 `六爻排盘·档案/vX.Y.Z_<主题>/`（src/tests/docs/scripts + 快照 index + CHANGELOG/README/ext.yml）

## 5. 与家族其他工程的关系

| 工程 | 关系 |
|---|---|
| `bazi-paipan` | launcher 卡片注册处（APPS 数组）；八字为先天结构，六爻为当下事件，共用「生命算法」品牌 |
| `qimen-paipan` | 提供精确节气表（已提取为本地 `src/tables/solar_terms.js`，字节一致，不运行时依赖） |
| `六爻排盘·档案` | 参考资料（24 篇体系文档）、重设计决策表、34 个版本快照与验证记录 |

## 6. 交互约定

- 盘面 6 行，自**上爻**（第 6 行）排至**初爻**（第 1 行）；录入区同向（上爻在最上，v0.1.24 翻转）。
- 录入初始全留白（v0.1.25），六爻未选满时「排盘」拦截提示。
- 点击任一行 = 设为用神；再点同一行 = 取消（回到按事项类型自动选）。
- 取卦只走**摇卦**（D7）：自下而上六次，每次三枚钱选「三正 / 二正一反 / 二反一正 / 三反」；
  手边无铜钱用**页面代掷**（D8），钱面逐条留痕。
- 「事项类型」定用神、「所求」定问卦重心（求进·推进／求稳·守成／求退·收尾），两输入语义分立；
  所求不影响应期（D12）。
- 「旺衰参照」可切换年/月/日/时（默认月建）。
- 预测档案（D14）：存入档案 / 查看重放 / 验证回填 / 导出导入 JSON；数据在 localStorage，需定期备份。
- 复制盘面 = 纯文本盘面（含爻级四标与静变标记）+ 全部分析节。

## 7. 小迭代闭环（单 agent）

```
改 src → 同步 tests 断言 → bash scripts/build.sh → node tests/run_tests.js
→ 浏览器 file:// 实测（断言计数 + 真实 UI）
→ 窄屏探针（python3 -m http.server + iframe，375/320，完成后 pkill）
→ 文档/ext.yml/CHANGELOG 升版 → 归档快照 → 扩展核验
```

多行 shell 一律写 `/tmp` 脚本再执行；browser 工具 act 用 `kind:"evaluate"`；
details.sec 闭合时 innerText 取不到，用 textContent。
