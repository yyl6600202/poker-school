/* =========================================================
   德扑教室 · 数学工具
   1) 底池赔率  2) 补牌换算  3) 诈唬盈亏平衡  4) 胜率模拟器
   ========================================================= */
(function () {
  "use strict";

  const $ = function (id) { return document.getElementById(id); };
  const fmt = function (n, d) { return (Math.round(n * Math.pow(10, d || 0)) / Math.pow(10, d || 0)).toFixed(d || 0); };

  /* ---------------- 1. 底池赔率 ---------------- */
  function initPot() {
    const pot = $("potIn"), bet = $("betIn");
    if (!pot || !bet) return;
    function update() {
      const P = +pot.value, B = +bet.value;
      const need = B / (P + 2 * B);
      const finalPot = P + 2 * B;
      $("potVal").textContent = P;
      $("betVal").textContent = B;
      $("potOdds").textContent = fmt(need * 100, 1) + "%";
      $("oddsBar").style.width = Math.min(100, need * 100) + "%";
      $("potNote").innerHTML =
        "你跟注 " + B + "，最终底池 " + finalPot + "。<br>算式：<b>" + B + " ÷ " + finalPot + " = " + fmt(need * 100, 1) + "%</b>。" +
        "只要你的胜率高于这个数，跟注就是正 EV；低于它，跟注就在给对手送钱。" +
        (B === Math.round(P / 2) ? '<br><span style="color:var(--green)">这是最常见的 1/2 池下注：需要 25% 胜率。</span>' : "") +
        (B === P ? '<br><span style="color:var(--green)">满池下注：需要 33.3% 胜率。</span>' : "");
    }
    pot.addEventListener("input", update);
    bet.addEventListener("input", update);
    update();
  }

  /* ---------------- 2. 补牌 ---------------- */
  function initOuts() {
    const outs = $("outsIn"), street = $("streetIn");
    if (!outs) return;
    function update() {
      const o = +outs.value;
      const isFlop = street.value === "flop";
      let exact;
      if (isFlop) {
        const total = (47 * 46) / 2;
        const miss = ((47 - o) * (46 - o)) / 2;
        exact = 1 - miss / total;
      } else {
        exact = o / 46;
      }
      const rule = isFlop
        ? Math.min(4 * o - Math.max(0, o - 9), 100)
        : 2 * o;

      $("outsVal").textContent = o;
      $("outsPct").textContent = fmt(exact * 100, 1) + "%";
      $("outsBar").style.width = Math.min(100, exact * 100) + "%";
      $("outsNote").innerHTML = isFlop
        ? "还剩两张牌要发。<b>2/4 法则估算：" + rule + "%</b>（补牌超过 9 张时要减一点）。" +
          "实际值 " + fmt(exact * 100, 1) + "% 更准，桌上的心算用估算就够。" +
          (o <= 9 ? "" : '<br><span style="color:var(--green)">补牌很多时，说明你可以更激进地加注而不是跟注。</span>')
        : "只剩一张牌。<b>心算：×2 ≈ " + rule + "%</b>，实际值 " + fmt(exact * 100, 1) + "%。" +
          "转牌圈的听牌价格明显变贵，因为只剩一次机会。";
    }
    outs.addEventListener("input", update);
    street.addEventListener("change", update);
    update();
  }

  /* ---------------- 3. 诈唬盈亏平衡 ---------------- */
  function initFold() {
    const pot = $("fpIn"), bet = $("fbIn");
    if (!pot) return;
    function update() {
      const P = +pot.value, B = +bet.value;
      const need = B / (P + B);
      $("fpVal").textContent = P;
      $("fbVal").textContent = B;
      $("foldPct").textContent = fmt(need * 100, 1) + "%";
      $("foldBar").style.width = Math.min(100, need * 100) + "%";
      $("foldNote").innerHTML =
        "你下注 " + B + " 去赢 " + P + "。如果对手弃牌，你净赚 " + P + "；如果他跟注，你亏 " + B + "。<br>" +
        "盈亏平衡点：<b>" + B + " ÷ (" + P + " + " + B + ") = " + fmt(need * 100, 1) + "%</b>。" +
        "对手弃牌率高于这个数，诈唬就赚钱。" +
        (B === P ? '<br><span style="color:var(--green)">满池诈唬需要对手一半的时候弃牌——大多数对手都弃不到这么频繁。</span>' : "");
    }
    pot.addEventListener("input", update);
    bet.addEventListener("input", update);
    update();
  }

  /* ---------------- 4. 七张牌牌力评估 ---------------- */
  const RANK_VAL = { A: 14, K: 13, Q: 12, J: 11, T: 10, "9": 9, "8": 8, "7": 7, "6": 6, "5": 5, "4": 4, "3": 3, "2": 2 };
  const SUIT_IDX = { s: 0, h: 1, d: 2, c: 3 };
  const SUIT_LABEL = { s: "s", h: "h", d: "d", c: "c" };

  function idOf(str) {
    const r = RANK_VAL[str.slice(0, -1)];
    const s = SUIT_IDX[str.slice(-1)];
    if (!r || s === undefined) return -1;
    return (r - 2) * 4 + s;
  }

  const rc = new Int8Array(15);
  const sc = new Int8Array(4);
  const sr = [new Int8Array(15), new Int8Array(15), new Int8Array(15), new Int8Array(15)];
  const present = new Uint8Array(15);
  const flushPresent = new Uint8Array(15);

  function straightHigh(p) {
    for (let h = 14; h >= 5; h--) {
      if (p[h] && p[h - 1] && p[h - 2] && p[h - 3] && p[h - 4]) return h;
    }
    return 0;
  }

  function scoreOf(cat, ks) {
    let v = cat;
    for (let i = 0; i < 5; i++) v = v * 15 + (ks[i] || 0);
    return v;
  }

  function eval7(ids) {
    rc.fill(0); sc.fill(0);
    for (let k = 0; k < 4; k++) sr[k].fill(0);
    for (let i = 0; i < 7; i++) {
      const id = ids[i], r = (id >> 2) + 2, s = id & 3;
      rc[r]++; sc[s]++; sr[s][r]++;
    }

    let quad = 0;
    const trips = [], pairs = [];
    for (let r = 14; r >= 2; r--) {
      if (rc[r] === 4) quad = r;
      else if (rc[r] === 3) trips.push(r);
      else if (rc[r] === 2) pairs.push(r);
    }

    let flushSuit = -1;
    for (let s = 0; s < 4; s++) if (sc[s] >= 5) { flushSuit = s; break; }

    present.fill(0);
    for (let r = 14; r >= 2; r--) {
      if (rc[r] > 0) { present[r] = 1; if (r === 14) present[1] = 1; }
    }
    const st = straightHigh(present);

    if (flushSuit >= 0) {
      flushPresent.fill(0);
      for (let r = 14; r >= 2; r--) {
        if (sr[flushSuit][r] > 0) { flushPresent[r] = 1; if (r === 14) flushPresent[1] = 1; }
      }
      const sf = straightHigh(flushPresent);
      if (sf) return scoreOf(8, [sf]);
    }
    if (quad) {
      let kick = 0;
      for (let r = 14; r >= 2; r--) if (r !== quad && rc[r] > 0) { kick = r; break; }
      return scoreOf(7, [quad, kick]);
    }
    if (trips.length && (trips.length > 1 || pairs.length)) {
      const t = trips[0];
      const p = trips.length > 1 ? trips[1] : pairs[0];
      return scoreOf(6, [t, p]);
    }
    if (flushSuit >= 0) {
      const ks = [];
      for (let r = 14; r >= 2 && ks.length < 5; r--) if (sr[flushSuit][r] > 0) ks.push(r);
      return scoreOf(5, ks);
    }
    if (st) return scoreOf(4, [st]);
    if (trips.length) {
      const ks = [];
      for (let r = 14; r >= 2 && ks.length < 2; r--) if (r !== trips[0] && rc[r] > 0) ks.push(r);
      return scoreOf(3, [trips[0]].concat(ks));
    }
    if (pairs.length >= 2) {
      const p1 = pairs[0], p2 = pairs[1];
      let kick = 0;
      for (let r = 14; r >= 2; r--) if (r !== p1 && r !== p2 && rc[r] > 0) { kick = r; break; }
      return scoreOf(2, [p1, p2, kick]);
    }
    if (pairs.length === 1) {
      const ks = [];
      for (let r = 14; r >= 2 && ks.length < 3; r--) if (r !== pairs[0] && rc[r] > 0) ks.push(r);
      return scoreOf(1, [pairs[0]].concat(ks));
    }
    const ks = [];
    for (let r = 14; r >= 2 && ks.length < 5; r--) if (rc[r] > 0) ks.push(r);
    return scoreOf(0, ks);
  }

  const CAT_NAME = ["高牌", "一对", "两对", "三条", "顺子", "同花", "葫芦", "四条", "同花顺"];

  /* ---------------- 5. 胜率模拟器 ---------------- */
  function initEquity() {
    const deckHost = $("deck");
    if (!deckHost) return;

    const RANKS = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];
    const SUITS = ["s", "h", "d", "c"];
    const slots = [null, null, null, null];
    const labels = ["我方 1", "我方 2", "对方 1", "对方 2"];

    // 牌堆
    deckHost.innerHTML = "";
    const cells = [];
    SUITS.forEach(function (suit) {
      RANKS.forEach(function (rank) {
        const code = rank + suit;
        const b = document.createElement("button");
        b.type = "button";
        b.className = "pick " + (SUIT_IDX[suit] === 1 || SUIT_IDX[suit] === 2 ? "r" : "b");
        b.dataset.card = code;
        b.textContent = rank + window.PS.suits[suit];
        b.addEventListener("click", function () { pick(code); });
        deckHost.appendChild(b);
        cells.push(b);
      });
    });

    function nextEmpty() {
      for (let i = 0; i < 4; i++) if (!slots[i]) return i;
      return -1;
    }

    function pick(code) {
      if (slots.indexOf(code) >= 0) return;
      const i = nextEmpty();
      if (i < 0) {
        $("eqNote").textContent = "已经选满四张了，点上面的牌位可以清掉重选。";
        return;
      }
      slots[i] = code;
      render();
    }

    function render() {
      // 牌位
      const host = $("slots");
      host.innerHTML = slots.map(function (c, i) {
        const isRed = c && (c.slice(-1) === "h" || c.slice(-1) === "d");
        const inner = c
          ? '<span class="mini filled' + (isRed ? " red" : "") + '">' + (c.slice(0, -1) === "T" ? "10" : c.slice(0, -1)) + window.PS.suits[c.slice(-1)] + "</span>"
          : '<span class="mini">空</span>';
        return '<span class="slot" data-slot="' + i + '" role="button" tabindex="0" style="cursor:pointer">' +
          (i === 0 ? "<b>我方</b> " : i === 2 ? "<b>对方</b> " : "") + inner + "</span>";
      }).join("");

      host.querySelectorAll("[data-slot]").forEach(function (el) {
        el.addEventListener("click", function () {
          slots[+el.dataset.slot] = null;
          render();
        });
      });

      // 牌堆状态
      cells.forEach(function (b) {
        const used = slots.indexOf(b.dataset.card) >= 0;
        b.classList.toggle("used", used);
        b.classList.toggle("on", used);
      });

      const full = slots.every(Boolean);
      $("simBtn").disabled = !full;
      $("simBtn").style.opacity = full ? "1" : ".45";
      if (!full) {
        $("eqNote").textContent = "已选 " + slots.filter(Boolean).length + "/4 张——选满后点“开始模拟”。";
      }
    }

    function randomFill() {
      const all = [];
      RANKS.forEach(function (r) { SUITS.forEach(function (s) { all.push(r + s); }); });
      for (let i = all.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const t = all[i]; all[i] = all[j]; all[j] = t;
      }
      for (let i = 0; i < 4; i++) slots[i] = all[i];
      render();
    }

    function simulate(hero, villain, iters) {
      const known = {};
      hero.concat(villain).forEach(function (c) { known[c] = 1; });
      const deck = [];
      for (let id = 0; id < 52; id++) {
        const code = RANKS[id >> 2] + SUITS[id & 3];
        if (!known[code]) deck.push(id);
      }
      const len = deck.length;
      const h7 = new Int32Array(7), v7 = new Int32Array(7);
      h7[5] = hero[0]; h7[6] = hero[1];
      v7[5] = villain[0]; v7[6] = villain[1];

      let win = 0, tie = 0, lose = 0;
      for (let it = 0; it < iters; it++) {
        for (let k = 0; k < 5; k++) {
          const j = k + Math.floor(Math.random() * (len - k));
          const t = deck[k]; deck[k] = deck[j]; deck[j] = t;
        }
        for (let k = 0; k < 5; k++) {
          const c = deck[k];
          h7[k] = c; v7[k] = c;
        }
        const a = eval7(h7), b = eval7(v7);
        if (a > b) win++; else if (a < b) lose++; else tie++;
      }
      return { win: win, tie: tie, lose: lose };
    }

    function run() {
      const hero = [idOf(slots[0]), idOf(slots[1])];
      const villain = [idOf(slots[2]), idOf(slots[3])];
      const iters = 12000;
      $("eqNote").textContent = "正在模拟 " + iters.toLocaleString() + " 次发牌…";
      $("simBtn").disabled = true;

      setTimeout(function () {
        const board = null; // 翻前对抗
        const r = simulate(hero, villain, iters);
        const W = (r.win / iters) * 100;
        const T = (r.tie / iters) * 100;
        const L = (r.lose / iters) * 100;

        $("eqWin").style.width = W + "%";
        $("eqTie").style.width = T + "%";
        $("eqLose").style.width = L + "%";
        $("eqWinTxt").textContent = fmt(W, 1) + "%";
        $("eqTieTxt").textContent = fmt(T, 1) + "%";
        $("eqLoseTxt").textContent = fmt(L, 1) + "%";

        const diff = W - L;
        let verdict;
        if (Math.abs(diff) < 3) verdict = "基本五五开，属于典型的“翻硬币”局面。";
        else if (diff > 0) verdict = "我方领先约 " + fmt(Math.abs(diff), 1) + " 个百分点。";
        else verdict = "对方领先约 " + fmt(Math.abs(diff), 1) + " 个百分点。";

        $("eqNote").innerHTML =
          "模拟 " + iters.toLocaleString() + " 次发牌（误差约 ±0.5%）。" + verdict +
          '<br><span style="color:var(--green)">注意：胜率高不等于应该入池。</span>' +
          "翻前 22 对 AKs 只有微弱优势，但 AKs 在翻后更容易打——位置、可玩性和翻后实现率，比“谁现在领先”更重要。";

        $("simBtn").disabled = false;
      }, 30);
    }

    $("simBtn").addEventListener("click", run);
    $("randBtn").addEventListener("click", function () { randomFill(); });
    $("clearBtn").addEventListener("click", function () {
      for (let i = 0; i < 4; i++) slots[i] = null;
      render();
    });
    document.querySelectorAll("[data-preset]").forEach(function (b) {
      b.addEventListener("click", function () {
        const parts = b.dataset.preset.split("|");
        const h = parts[0].split(" "), v = parts[1].split(" ");
        slots[0] = h[0]; slots[1] = h[1]; slots[2] = v[0]; slots[3] = v[1];
        render();
      });
    });

    // 默认给一组示例
    slots[0] = "As"; slots[1] = "Ah"; slots[2] = "Ks"; slots[3] = "Kh";
    render();
  }

  document.addEventListener("DOMContentLoaded", function () {
    initPot();
    initOuts();
    initFold();
    if (window.PS) initEquity();
  });

  // 暴露给测试 / 其他页面复用
  window.PokerMath = { eval7: eval7, idOf: idOf, scoreOf: scoreOf, CAT_NAME: CAT_NAME, RANK_VAL: RANK_VAL };
})();
