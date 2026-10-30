// 静态检查：标签闭合、JS 引用的 id 是否存在、内链是否有效、CSS 类是否有定义
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (f) => readFileSync(join(ROOT, f), "utf8");

const htmls = readdirSync(ROOT).filter((f) => f.endsWith(".html"));
const css = read("assets/style.css");
const jsFiles = readdirSync(join(ROOT, "assets")).filter((f) => f.endsWith(".js"));
const jsAll = jsFiles.map((f) => read("assets/" + f)).join("\n");

let problems = 0;
const bad = (m) => { problems++; console.log("  [!] " + m); };

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);

console.log("[A] 标签闭合");
for (const f of htmls) {
  const src = read(f);
  const stack = [];
  const re = /<\/?([a-zA-Z][a-zA-Z0-9-]*)([^>]*?)(\/?)>/g;
  let m;
  while ((m = re.exec(src))) {
    const tag = m[1].toLowerCase();
    const closing = m[0].startsWith("</");
    const selfClose = m[3] === "/";
    if (VOID.has(tag) || selfClose) continue;
    if (closing) {
      const top = stack.pop();
      if (top !== tag) bad(`${f}: </${tag}> 与 <${top}> 不匹配`);
    } else {
      stack.push(tag);
    }
  }
  if (stack.length) bad(`${f}: 未闭合 ${stack.join(", ")}`);
  else console.log(`  [ok] ${f}`);
}

console.log("[B] JS 引用的 id");
for (const f of htmls) {
  const src = read(f);
  const ids = new Set([...src.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  // site-header/site-footer 只由 app.js 注入；单文件版用的是静态 header/footer
  const injected = new Set(["site-header", "site-footer", "navLinks", "navToggle", "rangeGrid", "rangeTabs", "rangeLegend", "handDetail", "rangeStat", "posTable", "comboTable", "randHand", "flopPicker", "flopPreview", "slots", "deck", "simBtn", "randBtn", "clearBtn", "opts", "explain", "nextBtn", "againBtn", "quizApp"]);
  const refs = new Set();
  for (const m of src.matchAll(/getElementById\("([^"]+)"\)/g)) refs.add(m[1]);
  for (const id of refs) if (!ids.has(id) && !injected.has(id)) bad(`${f}: 缺少 #${id}`);
  console.log(`  [ok] ${f} (${refs.size} 个直接引用)`);
}

// 交叉核对：JS 里 $(...) 引用的 id 必须在本页或注入清单里
console.log("[C] JS 文件与页面的 id 契约");
const contract = {
  "math.html": ["potIn", "betIn", "potVal", "betVal", "potOdds", "oddsBar", "potNote", "outsIn", "streetIn", "outsVal", "outsPct", "outsBar", "outsNote", "fpIn", "fbIn", "fpVal", "fbVal", "foldPct", "foldBar", "foldNote", "slots", "deck", "simBtn", "randBtn", "clearBtn", "eqWin", "eqTie", "eqLose", "eqWinTxt", "eqTieTxt", "eqLoseTxt", "eqNote"],
  "ranges.html": ["rangeGrid", "rangeTabs", "rangeLegend", "handDetail", "rangeStat", "posTable", "comboTable"],
  "postflop.html": ["flopPicker", "flopResult"],
  "quiz.html": ["quizApp"],
};
for (const [file, ids] of Object.entries(contract)) {
  const src = read(file);
  const missing = ids.filter((id) => !new RegExp(`id="${id}"`).test(src));
  if (missing.length) bad(`${file} 缺少: ${missing.join(", ")}`);
  else console.log(`  [ok] ${file} (${ids.length} 个 id 齐全)`);
}

console.log("[D] 站内链接");
const pages = new Set(htmls);
for (const f of htmls) {
  const src = read(f);
  for (const m of src.matchAll(/href="([^"#][^"]*?)"/g)) {
    const href = m[1];
    if (/^(https?:|data:|mailto:)/.test(href)) continue;
    const target = href.split("#")[0].split("?")[0];
    if (!target) continue;
    if (target.endsWith(".html") && !pages.has(target)) bad(`${f}: 断链 ${href}`);
    if (/^assets\//.test(target)) {
      try { read(target); } catch { bad(`${f}: 缺少资源 ${href}`); }
    }
  }
  for (const m of src.matchAll(/href="([^"]*?)#([\w-]+)"/g)) {
    const page = m[1] || f;
    const anchor = m[2];
    let targetSrc;
    try { targetSrc = read(page); } catch { bad(`${f}: 锚点目标 ${m[1]} 不存在`); continue; }
    if (!new RegExp(`id="${anchor}"`).test(targetSrc)) bad(`${f}: 锚点 ${m[1]}#${anchor} 不存在`);
  }
  console.log(`  [ok] ${f}`);
}

console.log("[E] CSS 类");
const usedClasses = new Set();
for (const f of htmls) {
  const src = read(f);
  for (const m of src.matchAll(/class="([^"]+)"/g)) m[1].split(/\s+/).forEach((c) => c && usedClasses.add(c));
}
const defined = new Set([...css.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]));
const missingCss = [...usedClasses].filter((c) => !defined.has(c));
if (missingCss.length) console.log("  未定义样式的类: " + missingCss.join(", "));
else console.log("  [ok] 所有 HTML 类名都有样式定义");

console.log(problems === 0 ? "\n静态检查全部通过 (0 problems)" : `\n${problems} 个问题`);
process.exit(problems ? 1 : 0);
