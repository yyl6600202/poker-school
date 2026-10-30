// 集成测试：用 jsdom 真正加载每个页面并执行脚本，检查渲染结果
import { JSDOM, VirtualConsole } from "jsdom";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let fail = 0;
const ok = (cond, msg) => {
  if (!cond) { fail++; console.log("  [FAIL] " + msg); } else console.log("  [ok] " + msg);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function load(page) {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", (e) => errors.push(String(e.message || e)));
  vc.on("error", (...a) => errors.push(a.join(" ")));
  const dom = await JSDOM.fromFile(join(ROOT, page), {
    runScripts: "dangerously",
    resources: "usable",
    pretendToBeVisual: true,
    virtualConsole: vc,
  });
  dom.window.scrollTo = () => {};
  await new Promise((res) => {
    if (dom.window.document.readyState === "complete") return res();
    dom.window.addEventListener("load", res);
    setTimeout(res, 3000);
  });
  await sleep(80);
  return { dom, doc: dom.window.document, win: dom.window, errors };
}

/* ---------------- 首页 ---------------- */
{
  console.log("\n[index.html]");
  const { doc, errors } = await load("index.html");
  const nav = doc.querySelectorAll("#site-header .nav-links a");
  ok(nav.length === 6, `导航 6 个链接（实际 ${nav.length}）`);
  ok(doc.querySelector("#site-header a.active")?.getAttribute("href") === "index.html", "当前页高亮 = index.html");
  ok(doc.querySelectorAll("#site-footer .foot-grid a").length > 5, "页脚链接已注入");
  ok(doc.querySelectorAll(".float-card").length === 4, "首屏 4 张漂浮卡片");
  ok(doc.querySelectorAll(".module-tile").length === 6, "6 个模块卡片");
  ok(doc.querySelectorAll(".reveal.in").length > 0, "进场动画已触发（无 IntersectionObserver 时降级）");
  ok(errors.length === 0, "无脚本错误" + (errors.length ? ": " + errors[0] : ""));
  doc.defaultView.close();
}

/* ---------------- 规则页 ---------------- */
{
  console.log("\n[basics.html]");
  const { doc, errors } = await load("basics.html");
  const cards = doc.querySelectorAll("[data-cards]");
  ok(cards.length >= 9, `牌面示例 ${cards.length} 组`);
  const empty = [...cards].filter((el) => el.querySelectorAll(".pc").length === 0);
  ok(empty.length === 0, "所有 [data-cards] 都渲染出了牌");
  ok(doc.querySelectorAll(".rank-row").length === 9, "9 种牌型");
  const reds = doc.querySelectorAll(".pc.red").length;
  ok(reds > 0, `红桃/方块显示为红色（${reds} 张）`);
  ok(errors.length === 0, "无脚本错误" + (errors.length ? ": " + errors[0] : ""));
  doc.defaultView.close();
}

/* ---------------- 起手牌矩阵 ---------------- */
{
  console.log("\n[ranges.html]");
  const { doc, win, errors } = await load("ranges.html");
  const cells = doc.querySelectorAll("#rangeGrid .range-cell");
  ok(cells.length === 169, `169 个格子（实际 ${cells.length}）`);
  const labels = new Set([...cells].map((c) => c.textContent));
  ok(labels.size === 169, "169 个手牌名不重复");
  ok(labels.has("AA") && labels.has("AKs") && labels.has("AKo") && labels.has("72o"), "命名符合 AA / AKs / AKo / 72o");
  ok(doc.querySelectorAll("#rangeTabs .tab").length === 8, "8 个标签（分级 + 7 位置）");
  ok(/AKs/.test(doc.querySelector("#handDetail").textContent), "右侧详情面板默认展示 AKs");
  ok(doc.querySelectorAll("#posTable tr").length === 7, "位置表 7 行");
  ok(doc.querySelectorAll("#comboTable tr").length === 3, "组合数表 3 行");

  // 点开一个格子
  const cell = [...cells].find((c) => c.textContent === "72o");
  cell.click();
  ok(/72o/.test(doc.querySelector("#handDetail").textContent), "点击 72o 后详情切换");
  ok(/弃牌/.test(doc.querySelector("#handDetail").textContent), "72o 显示为弃牌");

  // 切换到 BTN 看范围
  const btnTab = [...doc.querySelectorAll("#rangeTabs .tab")].find((t) => t.textContent.startsWith("BTN"));
  btnTab.click();
  ok(/BTN/.test(doc.querySelector("#rangeStat").textContent), "切换到 BTN 后统计行更新: " + doc.querySelector("#rangeStat").textContent.slice(0, 40));

  // 范围解析正确性：BTN 范围应包含 A2s，不包含 72o
  const inBtn = (hand) => {
    const pos = win.RangeData.POSITIONS.find((p) => p.key === "BTN");
    return pos.set.has(hand);
  };
  ok(inBtn("A2s") && inBtn("K8o"), "BTN 范围包含 A2s / K8o");
  ok(!inBtn("72o"), "BTN 范围不含 72o");
  ok(errors.length === 0, "无脚本错误" + (errors.length ? ": " + errors[0] : ""));
  win.close();
}

/* ---------------- 数学页 ---------------- */
{
  console.log("\n[math.html]");
  const { doc, win, errors } = await load("math.html");
  ok(doc.querySelector("#potOdds").textContent === "25.0%", "底池 100 下注 50 → 25.0%（实际 " + doc.querySelector("#potOdds").textContent + "）");
  ok(doc.querySelector("#outsPct").textContent === "35.0%", "9 张补牌翻牌圈 → 35.0%（实际 " + doc.querySelector("#outsPct").textContent + "）");
  ok(doc.querySelector("#foldPct").textContent === "50.0%", "满池诈唬 → 50.0%（实际 " + doc.querySelector("#foldPct").textContent + "）");

  // 改滑块：下注 100 → 33.3%
  const bet = doc.querySelector("#betIn");
  bet.value = "100";
  bet.dispatchEvent(new win.Event("input"));
  ok(doc.querySelector("#potOdds").textContent === "33.3%", "改成满池下注 → 33.3%（实际 " + doc.querySelector("#potOdds").textContent + "）");

  // 转牌圈 8 张补牌
  const outs = doc.querySelector("#outsIn");
  outs.value = "8";
  outs.dispatchEvent(new win.Event("input"));
  const street = doc.querySelector("#streetIn");
  street.value = "turn";
  street.dispatchEvent(new win.Event("change"));
  ok(doc.querySelector("#outsPct").textContent === "17.4%", "转牌 8 张补牌 → 17.4%（实际 " + doc.querySelector("#outsPct").textContent + "）");

  // 牌选择器
  ok(doc.querySelectorAll("#deck .pick").length === 52, "52 张牌的选择器");
  ok(doc.querySelectorAll("#slots .mini.filled").length === 4, "默认已填 4 张");
  const preset = doc.querySelector('[data-preset="As Ks|2c 2d"]');
  preset.click();
  const filled = [...doc.querySelectorAll("#slots .mini.filled")].map((m) => m.textContent);
  ok(filled.join(",") === "A♠,K♠,2♣,2♦", "预设 AKs vs 22 生效: " + filled.join(","));

  // 跑模拟
  doc.querySelector("#simBtn").click();
  await sleep(1200);
  const winTxt = doc.querySelector("#eqWinTxt").textContent;
  const w = parseFloat(winTxt);
  ok(w > 40 && w < 55, "AKs vs 22 模拟结果合理: " + winTxt + " / 对方 " + doc.querySelector("#eqLoseTxt").textContent);
  ok(errors.length === 0, "无脚本错误" + (errors.length ? ": " + errors[0] : ""));
  win.close();
}

/* ---------------- 翻后页 ---------------- */
{
  console.log("\n[postflop.html]");
  const { doc, win, errors } = await load("postflop.html");
  ok(doc.querySelectorAll("#flopPicker select").length === 6, "3 张牌 ×（点数 + 花色）下拉框");
  ok(doc.querySelectorAll("#flopPreview .pc-lg").length === 3, "牌面预览 3 张");
  const defaultText = doc.querySelector("#flopResult").textContent;
  ok(/干燥/.test(defaultText), "A♠7♦2♣ 判为干燥面");
  ok(/翻前加注者/.test(defaultText), "A 高面判定翻前加注者占优");

  // 换成单色连通面 9h 8h 5h
  const sels = [...doc.querySelectorAll("#flopPicker select")];
  const setCard = (i, rank, suit) => {
    const r = sels[i * 2], s = sels[i * 2 + 1];
    r.value = rank; r.dispatchEvent(new win.Event("change"));
    s.value = suit; s.dispatchEvent(new win.Event("change"));
  };
  setCard(0, "9", "h");
  setCard(1, "8", "h");
  setCard(2, "5", "h");
  const txt = doc.querySelector("#flopResult").textContent;
  ok(/单色面/.test(txt), "识别为单色面: " + txt.slice(0, 30).replace(/\s+/g, " "));
  ok(/湿润/.test(txt), "湿润度判定已更新");
  ok(errors.length === 0, "无脚本错误" + (errors.length ? ": " + errors[0] : ""));
  win.close();
}

/* ---------------- 练习场 ---------------- */
{
  console.log("\n[quiz.html]");
  const { doc, win, errors } = await load("quiz.html");
  const total = 16;
  ok(/第 1 \/ 16 题/.test(doc.querySelector(".quiz-top").textContent), "第一题进度显示正确");
  ok(doc.querySelectorAll(".opt").length === 4, "4 个选项");

  let correctClicks = 0;
  const positions = new Set();
  for (let i = 0; i < total; i++) {
    const opts = [...doc.querySelectorAll(".opt")];
    ok(opts.length === 4, `第 ${i + 1} 题有 4 个选项`);
    opts[0].click();
    const ex = doc.querySelector("#explain");
    ok(ex.classList.contains("show") && ex.textContent.length > 20, `第 ${i + 1} 题显示解析`);
    const now = [...doc.querySelectorAll(".opt")];
    const correctIdx = now.findIndex((o) => o.classList.contains("correct"));
    positions.add(correctIdx);
    ok(now.filter((o) => o.classList.contains("correct")).length === 1, `第 ${i + 1} 题只标一个正确项`);
    if (correctIdx === 0) correctClicks++;
    doc.querySelector("#nextBtn").click();
  }
  ok(positions.size > 1, `选项顺序已打乱（正确项出现在 ${positions.size} 个不同位置）`);
  const scoreText = doc.querySelector(".score-ring b")?.textContent || "";
  ok(/^\d+\/16$/.test(scoreText), "进入成绩页: " + scoreText);
  const score = parseInt(scoreText.split("/")[0], 10);
  ok(score === correctClicks, `得分与答对数一致（${score} = ${correctClicks}）`);
  ok(doc.querySelector("#againBtn") !== null, "有“再测一次”按钮");
  ok(errors.length === 0, "无脚本错误" + (errors.length ? ": " + errors[0] : ""));
  win.close();
}

console.log(fail === 0 ? "\n集成测试全部通过" : `\n${fail} 项失败`);
process.exit(fail ? 1 : 0);
