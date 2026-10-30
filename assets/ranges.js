/* =========================================================
   德扑教室 · 起手牌数据与矩阵交互
   169 种起手牌 = 13 对子 + 78 同花 + 78 非同花 → 1326 种组合
   ========================================================= */
(function () {
  "use strict";

  const RANKS = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];
  const IDX = {};
  RANKS.forEach(function (r, i) { IDX[r] = i; });

  /* ---------- 手牌强度分档（教学近似，非 GTO 解） ---------- */
  const TIER_DEFS = [
    {
      id: 1, name: "顶级强牌", hint: "任何位置都打，目标是做大底池",
      hands: ["AA", "KK", "QQ", "JJ", "AKs", "AKo"],
    },
    {
      id: 2, name: "强牌", hint: "前中位可开池，面对加注多数继续",
      hands: ["TT", "AQs", "AJs", "KQs", "AQo"],
    },
    {
      id: 3, name: "好牌", hint: "中后位稳定开池，前位视情况",
      hands: ["99", "88", "ATs", "KJs", "QJs", "JTs", "KQo", "AJo"],
    },
    {
      id: 4, name: "可打牌", hint: "需要位置或好价格，别在不利位置硬顶",
      hands: ["77", "66", "55", "A9s", "A8s", "A7s", "KTs", "QTs", "J9s", "T9s", "98s", "87s", "76s", "65s", "54s", "ATo", "KJo", "QJo", "T9o"],
    },
    {
      id: 5, name: "边缘牌", hint: "只在大盲防守或后位偷盲时出现",
      hands: ["44", "33", "22", "A6s", "A5s", "A4s", "A3s", "A2s", "K9s", "K8s", "Q9s", "Q8s", "J8s", "T8s", "97s", "86s", "75s", "64s", "53s", "43s", "A9o", "KTo", "QTo", "JTo", "98o", "87o"],
    },
  ];
  const TIER_OF = {};
  TIER_DEFS.forEach(function (t) {
    t.hands.forEach(function (h) { TIER_OF[h] = t.id; });
  });

  /* ---------- 各位置的开池 / 防守范围 ---------- */
  const POSITIONS = [
    { key: "UTG", name: "UTG 枪口位", short: "UTG", note: "最早行动，后面还有 8 个人，只打最强的一小撮牌。", range: "77+, ATs+, KQs, AJo+, KQo" },
    { key: "MP", name: "MP 中位", short: "MP", note: "比 UTG 松一点，但依然以强牌为主，别为了参与而参与。", range: "55+, A9s+, KTs+, QJs, JTs, ATo+, KJo+" },
    { key: "HJ", name: "HJ 劫位", short: "HJ", note: "距离按钮只剩两席，可以开始增加同花连张和中小对子。", range: "22+, A7s+, K9s+, Q9s+, J9s+, T9s, 98s, A9o+, KTo+, QJo" },
    { key: "CO", name: "CO 关煞位", short: "CO", note: "只坐在按钮前面，标准偷盲位；同花 A 全部可开。", range: "22+, A2s+, K7s+, Q8s+, J8s+, T7s+, 96s+, 86s+, 76s, 65s, 54s, A8o+, K9o+, QTo+, JTo" },
    { key: "BTN", name: "BTN 按钮位", short: "BTN", note: "翻后永远最后行动，可以打最宽的范围，位置就是最大的武器。", range: "22+, A2s+, K4s+, Q6s+, J7s+, T7s+, 96s+, 85s+, 75s+, 64s+, 54s, A2o+, K8o+, Q9o+, J9o+, T9o, 98o" },
    { key: "SB", name: "SB 小盲", short: "SB", note: "翻后永远第一个行动，位置最差，宁可弃掉一些看起来不错的牌。", range: "22+, A2s+, K6s+, Q8s+, J8s+, T8s+, 97s+, 86s+, 75s+, A5o+, K9o+, QTo+, JTo" },
    { key: "BB", name: "BB 大盲防守", short: "BB", note: "已经投了 1 个盲注，价格合适，对后位偷盲要宽防守。", range: "22+, A2s+, K5s+, Q7s+, J8s+, T8s+, 97s+, 86s+, 76s, 65s, A2o+, K8o+, Q9o+, J9o+, T9o, 98o" },
  ];

  /* ---------- 范围字符串解析 ---------- */
  function handName(r, c) {
    if (r === c) return RANKS[r] + RANKS[r];
    if (c > r) return RANKS[r] + RANKS[c] + "s";
    return RANKS[c] + RANKS[r] + "o";
  }

  function expand(token) {
    const t = token.replace(/\s+/g, "");
    const m = t.match(/^([AKQJT2-9])([AKQJT2-9])([so])?([+-])?$/);
    if (!m) return [];
    const a = m[1], b = m[2], suit = m[3] || "", sign = m[4] || "";
    const ia = IDX[a], ib = IDX[b];

    if (a === b) {
      if (!sign) return [a + a];
      const out = [];
      for (let i = ia; i >= 0; i--) out.push(RANKS[i] + RANKS[i]);
      return out;
    }
    if (sign === "+") {
      // 固定大牌，踢脚从小往上加：AJs+ → AJs AQs AKs
      const out = [];
      for (let j = ib; j > ia; j--) out.push(a + RANKS[j] + suit);
      return out;
    }
    return [a + b + suit];
  }

  function parseRange(str) {
    const set = new Set();
    str.split(",").forEach(function (tok) {
      const t = tok.trim();
      if (!t) return;
      expand(t).forEach(function (h) { set.add(h); });
    });
    return set;
  }

  POSITIONS.forEach(function (p) { p.set = parseRange(p.range); });

  function combos(hand) {
    if (hand.length === 2) return 6;
    return hand[2] === "s" ? 4 : 12;
  }
  function pct(set) {
    let n = 0;
    set.forEach(function (h) { n += combos(h); });
    return (n / 1326) * 100;
  }

  /* ---------- 渲染矩阵 ---------- */
  function initMatrix() {
    const grid = document.getElementById("rangeGrid");
    if (!grid) return;

    const tabsHost = document.getElementById("rangeTabs");
    const legend = document.getElementById("rangeLegend");
    const detail = document.getElementById("handDetail");
    const statLine = document.getElementById("rangeStat");

    let mode = "tier"; // tier | 位置 key
    let selected = null;
    const cells = [];

    grid.innerHTML = "";

    // 构建 169 个格子
    for (let r = 0; r < 13; r++) {
      for (let c = 0; c < 13; c++) {
        const hand = handName(r, c);
        const el = document.createElement("button");
        el.type = "button";
        el.className = "range-cell t" + (TIER_OF[hand] || 5);
        if (hand.length === 2) el.classList.add("pair");
        el.dataset.hand = hand;
        el.textContent = hand;
        el.setAttribute("aria-label", hand);
        el.addEventListener("click", function () { select(hand); });
        grid.appendChild(el);
        cells.push(el);
      }
    }

    // 工具栏
    const tabDefs = [{ key: "tier", label: "强度分级" }].concat(
      POSITIONS.map(function (p) { return { key: p.key, label: p.short, pct: pct(p.set) }; })
    );
    tabDefs.forEach(function (d) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "tab" + (d.key === "tier" ? " active" : "");
      b.dataset.mode = d.key;
      b.innerHTML = d.label + (d.pct ? '<span class="pct">' + d.pct.toFixed(0) + "%</span>" : "");
      b.addEventListener("click", function () {
        mode = d.key;
        tabsHost.querySelectorAll(".tab").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        paint();
      });
      tabsHost.appendChild(b);
    });

    function paint() {
      const active = POSITIONS.find(function (p) { return p.key === mode; });
      cells.forEach(function (el) {
        const hand = el.dataset.hand;
        el.classList.remove("t1", "t2", "t3", "t4", "t5", "dim");
        if (active) {
          const isIn = active.set.has(hand);
          el.classList.add(isIn ? "t1" : "t5");
        } else {
          el.classList.add("t" + (TIER_OF[hand] || 5));
        }
      });
      if (statLine) {
        statLine.textContent = active
          ? active.short + " 开池范围 · " + active.set.size + "/169 种手牌 · 约占全部组合的 " + pct(active.set).toFixed(1) + "%"
          : "共 169 种起手牌，深浅代表强度分级";
      }
      paintDetail();
    }

    function select(hand) {
      selected = hand;
      cells.forEach(function (c) { c.classList.toggle("sel", c.dataset.hand === hand); });
      paintDetail();
    }

    function paintDetail() {
      if (!detail) return;
      const hand = selected || "AKs";
      const tier = TIER_DEFS.find(function (t) { return t.id === (TIER_OF[hand] || 5); });
      const kind = hand.length === 2 ? "对子" : hand[2] === "s" ? "同花" : "非同花";
      const c = combos(hand);
      const rows = POSITIONS.map(function (p) {
        const inRange = p.set.has(hand);
        return '<li><span class="pos">' + p.short + "</span>" +
          '<span class="act ' + (inRange ? "raise" : "fold") + '">' +
          (inRange ? "开池加注" : "弃牌") + "</span></li>";
      }).join("");

      detail.innerHTML =
        '<div class="hand-card">' +
          '<div class="hand-title">' + hand + "</div>" +
          '<div class="hand-sub">' + kind + " · " + c + " 种组合 · " +
            (c / 1326 * 100).toFixed(1) + "% 的手牌</div>" +
          '<div style="margin-top:14px"><span class="pill">' +
            (tier ? tier.name : "边缘") + "</span></div>" +
          '<p style="font-size:13px;color:var(--muted);margin:12px 0 0">' +
            (tier ? tier.hint : "只在最有利的位置或大盲防守时考虑。") + "</p>" +
          '<ul class="advice-list">' + rows + "</ul>" +
          '<button class="tab" id="randHand" style="margin-top:16px;width:100%;">换一手看看</button>' +
        "</div>";

      const rb = document.getElementById("randHand");
      if (rb) rb.addEventListener("click", function () {
        const r = Math.floor(Math.random() * 13);
        const cc = Math.floor(Math.random() * 13);
        select(handName(r, cc));
      });
    }

    // 图例
    if (legend) {
      legend.innerHTML = TIER_DEFS.map(function (t) {
        return '<span><i style="background:' + tierColor(t.id) + '"></i>' + t.name + "</span>";
      }).join("") + '<span><i style="background:rgba(255,255,255,.055)"></i>其余（不建议主动入池）</span>';
    }

    paint();
    select("AKs");
  }

  function tierColor(id) {
    return {
      1: "#17493a",
      2: "#3f8f6b",
      3: "#9ecfb6",
      4: "#d7e3da",
      5: "#edf0ea",
    }[id];
  }

  /* ---------- 位置速查表 ---------- */
  function initPositionTable() {
    const host = document.getElementById("posTable");
    if (!host) return;
    host.innerHTML = POSITIONS.map(function (p) {
      return "<tr><td><b>" + p.short + "</b></td>" +
        "<td class='num'>" + pct(p.set).toFixed(1) + "%</td>" +
        "<td>" + p.note + "</td></tr>";
    }).join("");
  }

  /* ---------- 手牌分类小表 ---------- */
  function initComboTable() {
    const host = document.getElementById("comboTable");
    if (!host) return;
    const data = [
      ["对子 AA–22", "13 种", "6", "78", "5.9%", "相同点数、不同花色打乱组合"],
      ["同花 AKs–32s", "78 种", "4", "312", "23.5%", "同花色，能成同花，价值更高"],
      ["非同花 AKo–32o", "78 种", "12", "936", "70.6%", "最常见，成同花要 3 张公共牌配合"],
    ];
    host.innerHTML = data.map(function (d) {
      return "<tr>" +
        "<td><b>" + d[0] + "</b></td>" +
        '<td class="num">' + d[1] + "</td>" +
        '<td class="num">' + d[2] + "</td>" +
        '<td class="num">' + d[3] + "</td>" +
        '<td class="num">' + d[4] + "</td>" +
        "<td>" + d[5] + "</td>" +
        "</tr>";
    }).join("");
  }

  document.addEventListener("DOMContentLoaded", function () {
    initMatrix();
    initPositionTable();
    initComboTable();
  });

  window.RangeData = { POSITIONS: POSITIONS, TIER_DEFS: TIER_DEFS, TIER_OF: TIER_OF, pct: pct, combos: combos, parseRange: parseRange, RANKS: RANKS };
})();
