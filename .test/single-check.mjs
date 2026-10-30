// 单文件版的集成检查（jsdom）
import { JSDOM, VirtualConsole } from "jsdom";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log("  [FAIL] " + m); } else console.log("  [ok] " + m); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const errors = [];
const vc = new VirtualConsole();
vc.on("jsdomError", (e) => errors.push(String(e.message || e)));

const dom = await JSDOM.fromFile(join(ROOT, "poker-school-single.html"), {
  runScripts: "dangerously",
  resources: "usable",
  pretendToBeVisual: true,
  virtualConsole: vc,
});
dom.window.scrollTo = () => {};
await new Promise((res) => (dom.window.document.readyState === "complete" ? res() : dom.window.addEventListener("load", res)));
await sleep(150);
const doc = dom.window.document;

console.log("\n[单文件：结构]");
const ids = ["home", "basics", "ranges", "postflop", "math", "quiz"];
ok(ids.every((i) => doc.getElementById(i)), "六个章节都在: " + ids.join(" / "));

// 重复 id 检查
const all = [...doc.querySelectorAll("[id]")].map((el) => el.id);
const dup = all.filter((id, i) => all.indexOf(id) !== i);
ok(dup.length === 0, "没有重复 id" + (dup.length ? "（重复: " + [...new Set(dup)].join(",") + "）" : ""));

// 锚点可达
const badAnchors = [...doc.querySelectorAll('a[href^="#"]')]
  .map((a) => a.getAttribute("href").slice(1))
  .filter((id) => id && !doc.getElementById(id));
ok(badAnchors.length === 0, "所有页内锚点都能落地" + (badAnchors.length ? "（坏链: " + [...new Set(badAnchors)].join(",") + "）" : ""));

console.log("\n[单文件：交互]");
ok(doc.querySelectorAll("#rangeGrid .range-cell").length === 169, "起手牌矩阵 169 格");
ok(doc.querySelectorAll("#deck .pick").length === 52, "牌堆选择器 52 张");
ok(doc.querySelectorAll(".float-card").length === 4, "首屏漂浮卡片");
const cards = [...doc.querySelectorAll("[data-cards]")];
ok(cards.length > 20 && cards.every((c) => c.querySelectorAll(".pc, .pc-lg").length > 0), `所有 [data-cards] 已渲染（${cards.length} 组）`);
ok(doc.querySelectorAll(".static-only").length === 0, "脚本运行后静态提示已移除");
ok(doc.querySelectorAll("#posTable tr").length === 7, "位置表 7 行");

// 测验
const opts = doc.querySelectorAll(".opt");
ok(opts.length === 4, "测验已渲染第一题");
opts[0].dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
ok(doc.querySelector("#explain").classList.contains("show"), "答题后出现解析");
doc.querySelector("#nextBtn").dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
ok(/第 2 \/ 16 题/.test(doc.querySelector(".quiz-top").textContent), "可以翻到下一题");

// 计算器
const bet = doc.querySelector("#betIn");
bet.value = "100";
bet.dispatchEvent(new dom.window.Event("input"));
ok(doc.querySelector("#potOdds").textContent === "33.3%", "底池赔率计算器在单文件里可用");

ok(errors.length === 0, "无脚本错误" + (errors.length ? ": " + errors[0] : ""));

console.log("\n[单文件：无脚本降级]");
const staticDom = await JSDOM.fromFile(join(ROOT, "poker-school-single.html"), {
  runScripts: "outside-only",
  resources: "usable",
});
const sdoc = staticDom.window.document;
ok(sdoc.querySelectorAll(".nav-static a").length === 6, "导航是静态 HTML，不依赖脚本");
ok(sdoc.querySelectorAll(".static-only").length >= 4, "交互组件处有“需要 JavaScript”的提示");
ok(sdoc.querySelectorAll(".pc").length === 0, "（脚本禁用时牌面本来就不渲染，属于预期）");
ok(sdoc.querySelector("#quizApp").textContent.includes("JavaScript"), "测验区有降级说明");

console.log(fail === 0 ? "\n单文件版检查全部通过" : `\n${fail} 项失败`);
process.exit(fail ? 1 : 0);
