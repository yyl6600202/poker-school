// 把六个页面打包成一个自包含的 HTML：CSS / JS 全部内联，链接改成锚点。
// 用途：在没有服务器的环境里（例如应用内 HTML 预览、直接双击）一屏看完整门课。
// 运行：node build-singlefile.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const ROOT = dirname(fileURLToPath(import.meta.url));
const read = (f) => readFileSync(join(ROOT, f), "utf8");

const PAGES = [
  { file: "index.html", id: "home", nav: "首页" },
  { file: "basics.html", id: "basics", nav: "规则与牌型" },
  { file: "ranges.html", id: "ranges", nav: "位置与起手牌" },
  { file: "postflop.html", id: "postflop", nav: "翻后打法" },
  { file: "math.html", id: "math", nav: "数学与赔率" },
  { file: "quiz.html", id: "quiz", nav: "练习场" },
];

const SLUG = {
  "index.html": "home",
  "basics.html": "basics",
  "ranges.html": "ranges",
  "postflop.html": "postflop",
  "math.html": "math",
  "quiz.html": "quiz",
};

// 把站内链接改写成页内锚点
function rewriteLinks(html) {
  return html.replace(/href="(index|basics|ranges|postflop|math|quiz)\.html(#[A-Za-z0-9_-]+)?"/g, (m, file, hash) => {
    const target = hash ? hash.slice(1) : SLUG[file + ".html"];
    return `href="#${target}"`;
  });
}

function mainOf(html) {
  const m = html.match(/<main id="main">([\s\S]*?)<\/main>/);
  if (!m) throw new Error("找不到 <main>");
  return rewriteLinks(m[1]).trim();
}

const blocks = PAGES.map((p) => {
  const body = mainOf(read(p.file));
  return `  <div class="page-block" id="${p.id}">\n${body}\n  </div>`;
}).join("\n\n");

const navLinks = PAGES.map((p) => `        <a href="#${p.id}">${p.nav}</a>`).join("\n");

const css = read("assets/style.css");
const extraCss = `
/* ---- 单文件版补充 ---- */
[ id ] { scroll-margin-top: 84px; }
.page-block { border-top: 1px solid var(--line-2); }
.page-block:first-child { border-top: 0; }
.nav-static { position: static !important; flex-direction: row; flex-wrap: wrap; opacity: 1 !important;
  pointer-events: auto !important; transform: none !important; gap: 2px; }
.nav-static a { font-size: 14px; }
@media (max-width: 960px) {
  .nav-static { padding: 0 !important; background: none !important; border: 0 !important; backdrop-filter: none !important; }
  .nav-static a { padding: 5px 9px; font-size: 13px; }
}
`;

const scripts = ["assets/app.js", "assets/ranges.js", "assets/postflop.js", "assets/math.js", "assets/quiz.js"]
  .map((f) => "/* ===== " + f + " ===== */\n" + read(f))
  .join("\n\n");

const html = `<!DOCTYPE html>
<!-- ⚠ 自动生成：本文件由 build-singlefile.mjs 拼接而成，请勿直接编辑。
     改内容请编辑 index / basics / ranges / postflop / math / quiz 与 assets/ 下的源文件，再运行 node build-singlefile.mjs -->
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>德扑教室 · 完整单页版</title>
<meta name="description" content="从零学会德州扑克：规则与牌型、位置与起手牌、翻后打法、数学与赔率，配套交互矩阵、赔率计算器与决策测验。单文件版。">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%2317493a'/%3E%3Ctext x='16' y='24' font-size='20' text-anchor='middle' fill='%23c9ef63'%3E%E2%99%A0%3C/text%3E%3C/svg%3E">
<script>document.documentElement.classList.add("js")</script>
<style>
${css}
${extraCss}
</style>
</head>
<body data-page="single">
<a class="skip" href="#main">跳到正文</a>

<header class="site-header">
  <div class="wrap nav">
    <a class="brand" href="#home">
      <span class="brand-mark" aria-hidden="true">♠</span>
      <span><span class="brand-name">德扑教室</span><span class="brand-sub">Poker School</span></span>
    </a>
    <nav class="nav-links nav-static" aria-label="章节导航">
${navLinks}
    </nav>
  </div>
</header>

<main id="main">
${blocks}
</main>

<footer class="site-footer">
  <div class="wrap">
    <div class="foot-grid">
      <div class="foot-about">
        <a class="brand" href="#home" style="margin-bottom:14px">
          <span class="brand-mark" aria-hidden="true">♠</span>
          <span><span class="brand-name">德扑教室</span><span class="brand-sub">Poker School</span></span>
        </a>
        <p>把德州扑克拆成可以练习的小块：先搞清楚规则，再建立范围，最后用数学和纪律做决策。适合完全零基础到刚开始打低级别的玩家。</p>
      </div>
      <div><h4>章节</h4>
        <a href="#basics">规则与牌型</a>
        <a href="#ranges">位置与起手牌</a>
        <a href="#postflop">翻后打法</a>
        <a href="#math">数学与赔率</a>
      </div>
      <div><h4>练一练</h4>
        <a href="#quiz">决策测验</a>
        <a href="#equity">胜率模拟器</a>
        <a href="#matrix">起手牌矩阵</a>
        <a href="#texture">牌面结构速查</a>
      </div>
    </div>
    <div class="foot-bottom">
      <span>© ${new Date().getFullYear()} 德扑教室 · 单文件版</span>
      <span>起手牌范围为教学近似值，非 GTO 精确解 · 请遵守当地法律法规，理性游戏</span>
    </div>
  </div>
</footer>

<script>
${scripts}
</script>
</body>
</html>
`;

const out = join(ROOT, "poker-school-single.html");
writeFileSync(out, html, "utf8");
console.log("已生成 " + out + "（" + (Buffer.byteLength(html) / 1024).toFixed(1) + " KB）");
