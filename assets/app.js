/* =========================================================
   德扑教室 · 共享脚本
   顶栏 / 页脚注入、扑克牌渲染、滚动进场
   ========================================================= */
(function () {
  "use strict";

  const NAV = [
    { id: "index", href: "index.html", label: "首页" },
    { id: "basics", href: "basics.html", label: "规则与牌型" },
    { id: "ranges", href: "ranges.html", label: "位置与起手牌" },
    { id: "postflop", href: "postflop.html", label: "翻后打法" },
    { id: "math", href: "math.html", label: "数学与赔率" },
    { id: "quiz", href: "quiz.html", label: "练习场" },
  ];

  const SUIT_GLYPH = { s: "♠", h: "♥", d: "♦", c: "♣", "♠": "♠", "♥": "♥", "♦": "♦", "♣": "♣" };
  const RED = { h: true, "♥": true, d: true, "♦": true };

  function parseCard(code) {
    if (!code) return null;
    const s = String(code).trim();
    if (s.length < 2) return null;
    const rank = s.slice(0, -1).toUpperCase();
    const suit = s.slice(-1).toLowerCase();
    return { rank: rank === "10" ? "T" : rank, suit };
  }

  function cardHTML(code, size) {
    const c = parseCard(code);
    if (!c) return "";
    const red = RED[c.suit] ? " red" : "";
    const g = SUIT_GLYPH[c.suit] || c.suit;
    const label = c.rank === "T" ? "10" : c.rank;
    if (size === "lg") {
      return '<span class="pc-lg' + red + '">' +
        '<span class="corner">' + label + '<span class="s">' + g + "</span></span>" +
        '<span class="pip">' + g + "</span>" +
        '<span class="corner bl">' + label + '<span class="s">' + g + "</span></span></span>";
    }
    return '<span class="pc' + red + '">' + label + '<span class="s">' + g + "</span></span>";
  }

  function renderCards(root) {
    (root || document).querySelectorAll("[data-cards]").forEach(function (el) {
      const size = el.dataset.size || "";
      el.classList.add("cards");
      el.innerHTML = el.dataset.cards
        .split(/[\s,]+/)
        .filter(Boolean)
        .map(function (c) { return cardHTML(c, size); })
        .join("");
    });
  }

  function buildHeader() {
    const host = document.getElementById("site-header");
    if (!host) return;
    const page = document.body.dataset.page || "";
    const links = NAV.map(function (n) {
      return '<a href="' + n.href + '" data-nav="' + n.id + '"' +
        (n.id === page ? ' class="active" aria-current="page"' : "") +
        ">" + n.label + "</a>";
    }).join("");
    host.className = "site-header";
    host.innerHTML =
      '<div class="wrap nav">' +
        '<a class="brand" href="index.html">' +
          '<span class="brand-mark" aria-hidden="true">♠</span>' +
          '<span><span class="brand-name">德扑教室</span>' +
          '<span class="brand-sub">Poker School</span></span>' +
        "</a>" +
        '<nav class="nav-links" id="navLinks" aria-label="主导航">' + links + "</nav>" +
        '<a class="btn btn-sm nav-cta" href="quiz.html">开始练习</a>' +
        '<button class="nav-toggle" id="navToggle" aria-label="展开导航" aria-expanded="false" aria-controls="navLinks">☰</button>' +
      "</div>";
    const btn = document.getElementById("navToggle");
    const linksEl = document.getElementById("navLinks");
    if (btn && linksEl) {
      btn.addEventListener("click", function () {
        const open = linksEl.classList.toggle("open");
        btn.setAttribute("aria-expanded", String(open));
        btn.textContent = open ? "✕" : "☰";
      });
    }
  }

  function buildFooter() {
    const host = document.getElementById("site-footer");
    if (!host) return;
    host.className = "site-footer";
    host.innerHTML =
      '<div class="wrap">' +
        '<div class="foot-grid">' +
          '<div class="foot-about">' +
            '<a class="brand" href="index.html" style="margin-bottom:14px">' +
              '<span class="brand-mark" aria-hidden="true">♠</span>' +
              '<span><span class="brand-name">德扑教室</span>' +
              '<span class="brand-sub">Poker School</span></span>' +
            "</a>" +
            "<p>把德州扑克拆成可以练习的小块：先搞清楚规则，再建立范围，最后用数学和纪律做决策。适合完全零基础到刚开始打低级别的玩家。</p>" +
          "</div>" +
          "<div><h4>学习路径</h4>" +
            '<a href="basics.html">规则与牌型</a>' +
            '<a href="ranges.html">位置与起手牌</a>' +
            '<a href="postflop.html">翻后打法</a>' +
            '<a href="math.html">数学与赔率</a>' +
          "</div>" +
          "<div><h4>工具</h4>" +
            '<a href="ranges.html#matrix">起手牌矩阵</a>' +
            '<a href="math.html#equity">胜率模拟器</a>' +
            '<a href="math.html#pot">底池赔率计算器</a>' +
            '<a href="postflop.html#texture">牌面结构速查</a>' +
          "</div>" +
          "<div><h4>开始</h4>" +
            '<a href="index.html">首页</a>' +
            '<a href="quiz.html">决策测验</a>' +
            '<a href="poker-school-single.html">单文件版</a>' +
          "</div>" +
        "</div>" +
        '<div class="foot-bottom">' +
          "<span>© " + new Date().getFullYear() + " 德扑教室 · 教学演示项目</span>" +
          "<span>起手牌范围为教学近似值，非 GTO 精确解 · 请遵守当地法律法规，理性游戏</span>" +
        "</div>" +
      "</div>";
  }

  function setupReveal() {
    const items = document.querySelectorAll(".reveal");
    if (!items.length) return;
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach(function (el, i) {
      el.style.animationDelay = Math.min(i % 6, 5) * 60 + "ms";
      io.observe(el);
    });

    // 保险丝：若 3 秒后首屏仍没有任何内容被放出来，直接全部显示
    setTimeout(function () {
      if (!document.querySelector(".reveal.in")) {
        items.forEach(function (el) { el.classList.add("in"); });
      }
    }, 3000);
  }

  // 数字滚动（用于首页统计）
  function countUp() {
    document.querySelectorAll("[data-count]").forEach(function (el) {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || "";
      const dec = (el.dataset.dec | 0);
      const start = parseFloat(String(el.textContent).replace(/[^\d.]/g, "")) || 0;
      const dur = 900;
      const t0 = performance.now();
      function step(t) {
        const p = Math.min(1, (t - t0) / dur);
        const e = 1 - Math.pow(1 - p, 3);
        el.textContent = (start + (target - start) * e).toFixed(dec) + suffix;
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = target.toFixed(dec) + suffix;
      }
      requestAnimationFrame(step);
    });
  }

  window.PS = {
    parseCard: parseCard,
    cardHTML: cardHTML,
    renderCards: renderCards,
    suits: SUIT_GLYPH,
    isRed: function (s) { return !!RED[s]; },
  };

  document.addEventListener("DOMContentLoaded", function () {
    setupReveal();
    safe(buildHeader);
    safe(buildFooter);
    safe(function () { renderCards(document); });
    safe(function () {
      // 脚本正常运行 → 去掉"需要 JavaScript"的静态提示
      document.querySelectorAll(".static-only").forEach(function (el) { el.remove(); });
    });
    safe(countUp);
  });

  function safe(fn) {
    try {
      fn();
    } catch (err) {
      if (window.console) console.error("[poker-school]", err);
      document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
    }
  }
})();
