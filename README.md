# 德扑教室 · Poker School

一个从零开始学德州扑克的静态教学网站。纯 HTML / CSS / JavaScript，没有构建步骤、没有依赖，双击 `index.html` 就能打开。

## 页面结构

| 文件 | 内容 |
| --- | --- |
| `index.html` | 首页：学习路径、三条基础观念、决策三问 |
| `basics.html` | 规则与牌型：牌桌结构、行动顺序、9 种牌型及概率、动作与术语 |
| `ranges.html` | 位置与起手牌：位置强弱、可交互的 169 格起手牌矩阵、组合数换算 |
| `postflop.html` | 翻后打法：牌面结构、范围优势、C-bet 尺度、听牌与半诈唬、完整示例 |
| `math.html` | 数学与赔率：底池赔率 / 补牌 / 诈唬平衡计算器 + 胜率模拟器 + 资金管理 |
| `quiz.html` | 练习场：16 道决策题，逐题解析、选项乱序、成绩与错题回顾 |

## 交互功能

- **起手牌矩阵**：169 格，可切换「强度分级」与 7 个位置的开池范围；点击任意一手牌，查看它在每个位置该加注还是弃牌，并显示组合数与占比。
- **牌面分析器**：选三张翻牌，自动判断单色 / 两色 / 彩虹、连通性、湿润度，给出范围优势与建议尺度。
- **底池赔率计算器**：拖动底池与下注额，实时算出所需胜率与算式。
- **补牌换算**：1–21 张补牌，区分翻牌圈 / 转牌圈，给出精确概率与 2/4 法则估算。
- **诈唬盈亏平衡**：算出让对手弃牌的最低频率。
- **胜率模拟器**：从 52 张牌里点选四张（我方两张、对方两张），用蒙特卡洛随机发牌 12,000 次，输出胜 / 平 / 负。牌力评估器通过 `assets/math.js` 暴露为 `window.PokerMath`。
- **练习场**：选项每次随机打乱，答题即时解析，支持键盘 1–4 作答、Enter 下一题。

## 单文件版（推荐在应用内预览 / 发给别人）

`poker-school-single.html` 把六个页面合成**一个自包含的 HTML**：CSS、JS 全部内联，站内链接改成页内锚点（`#basics`、`#math` 等）。它不需要服务器，也不依赖任何关联文件。

```bash
node build-singlefile.mjs   # 改完源文件后重新生成
```

适用场景：

- 在 DSH 右侧栏预览、或在禁用脚本的「静态 HTML 预览」里查看——正文和样式都在，交互组件会显示「需要 JavaScript」的提示。
- 直接发给别人，一个文件即可。
- 离线保存、当成本地笔记。

两个版本的取舍：单页版所有内容纵向排列（导航是锚点跳转）；多页版是六个独立页面，适合部署到静态托管。

## 本地预览

直接双击 `index.html` 即可。也可以起一个本地服务器（推荐，避免个别浏览器对 `file://` 的限制）：

```bash
node serve.mjs          # → http://127.0.0.1:5187
```

## 开发与自测（`.test/`，非站点内容）

```bash
node .test/logic-check.mjs   # 范围解析 + 牌力评估 + 翻前胜率
node .test/exact-aa.mjs      # 穷举 1,712,304 种公共牌验证 AA vs KK = 82.4%
node .test/diff.mjs          # 评估器 vs 暴力 21 组合对拍 20 万手
node .test/dom-check.mjs     # 标签闭合、id 契约、内链、CSS 类名
cd .test && node integration.mjs   # jsdom 真实加载五个页面跑交互
```

跑集成测试需要 `npm install jsdom`（已装在 `.test/node_modules`，属于开发依赖，可随时删除）：

```bash
cd .test && npm install && npm test
```

## 协作与发布

先想清楚要哪一种，两种情况的做法不一样：

**A. 只是想让别人能看**

- 最省事：把 `poker-school-single.html` 发给他，单文件、双击就开。
- 想要一个网址：拖到 Netlify Drop / Cloudflare Pages（免注册、免 Git），或者用 GitHub Pages（见下）。

**B. 想让人一起改**

提交到仓库的是**整个 `poker-school/` 目录**（六个页面 + `assets/` + 构建脚本 + README），不是单个 HTML 文件。单文件版是构建产物，谁手改谁就把改动弄丢了。

```bash
git init -b main
git add .
git commit -m "德扑教室：初始版本"
git remote add origin https://github.com/<你的账号>/poker-school.git
git push -u origin main
```

发布到 GitHub Pages：仓库 → Settings → Pages → Source 选 `Deploy from a branch`，分支 `main`、目录 `/ (root)`，保存后地址是 `https://<账号>.github.io/poker-school/`。站内全是相对路径，子目录部署不用改任何代码。

协作约定（建议）：

- 内容改动改源页面，然后 `node build-singlefile.mjs` 重新生成单文件，一起提交。
- 提 PR 前在 `.test/` 里跑一遍 `npm test`，全绿再提。
- 起手牌范围这类数据改动，顺便在 PR 描述里写清楚依据。
- 不想让构建产物进 diff 的话，把 `poker-school-single.html` 加进 `.gitignore`，改为在 Release 里挂附件。

## 数据说明

- 起手牌范围是**教学近似值**，用于建立结构感，与 GTO solver 的精确解有差异。
- 牌型出现概率按 7 张牌统计。
- 本站仅供学习与娱乐参考：请遵守所在地法律法规，理性游戏，量力而行。
