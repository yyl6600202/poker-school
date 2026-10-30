/* =========================================================
   德扑教室 · 翻牌结构分析器
   ========================================================= */
(function () {
  "use strict";

  const RANKS = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];
  const VALUES = { A: 14, K: 13, Q: 12, J: 11, T: 10, "9": 9, "8": 8, "7": 7, "6": 6, "5": 5, "4": 4, "3": 3, "2": 2 };
  const SUITS = [["s", "♠"], ["h", "♥"], ["d", "♦"], ["c", "♣"]];

  function build() {
    const host = document.getElementById("flopPicker");
    const out = document.getElementById("flopResult");
    if (!host || !out) return;

    const state = ["As", "7d", "2c"];

    host.innerHTML = state.map(function (c, i) {
      return (
        '<div class="field" style="min-width:132px;margin:0">' +
          '<label>翻牌 ' + (i + 1) + "</label>" +
          '<div style="display:flex;gap:6px">' +
            '<select data-i="' + i + '" data-part="rank">' +
              RANKS.map(function (r) { return '<option value="' + r + '">' + r + "</option>"; }).join("") +
            "</select>" +
            '<select data-i="' + i + '" data-part="suit" style="max-width:64px">' +
              SUITS.map(function (s) { return '<option value="' + s[0] + '">' + s[1] + "</option>"; }).join("") +
            "</select>" +
          "</div>" +
        "</div>"
      );
    }).join("") + '<div id="flopPreview" style="margin-left:auto;display:flex;align-items:center;gap:8px"></div>';

    host.querySelectorAll("select").forEach(function (sel) {
      // 让下拉框显示当前选中的牌
      const cur = state[+sel.dataset.i];
      sel.value = sel.dataset.part === "rank" ? cur.slice(0, -1) : cur.slice(-1);
      sel.addEventListener("change", function () {
        const i = +sel.dataset.i;
        const part = sel.dataset.part;
        const cur = state[i];
        const rank = part === "rank" ? sel.value : cur.slice(0, -1);
        const suit = part === "suit" ? sel.value : cur.slice(-1);
        const next = rank + suit;
        // 防重复
        const dup = state.some(function (c, j) { return j !== i && c === next; });
        if (dup) {
          sel.value = part === "rank" ? cur.slice(0, -1) : cur.slice(-1);
          return;
        }
        state[i] = next;
        render();
      });
    });

    function render() {
      const preview = document.getElementById("flopPreview");
      if (preview) {
        preview.innerHTML = '<span class="cards" data-cards="' + state.join(" ") + '" data-size="lg" style="gap:6px"></span>';
        window.PS.renderCards(preview);
      }
      out.innerHTML = analyze(state);
    }

    render();
  }

  function analyze(cards) {
    const ranks = cards.map(function (c) { return c.slice(0, -1); });
    const suits = cards.map(function (c) { return c.slice(-1); });
    const vals = ranks.map(function (r) { return VALUES[r] || 10; }).sort(function (a, b) { return b - a; });

    const distinctRanks = Array.from(new Set(ranks));
    const distinctSuits = Array.from(new Set(suits));
    const paired = distinctRanks.length < 3;
    const suitCount = distinctSuits.length;
    const span = vals[0] - vals[2];
    const connected = !paired && distinctRanks.length === 3 && span <= 4;
    const semiConnected = !paired && span <= 6;

    let wet = 0;
    if (suitCount === 1) wet += 3.2;
    else if (suitCount === 2) wet += 1.3;
    if (connected) wet += 2.6;
    else if (semiConnected) wet += 1.1;
    if (paired) wet += 0.4;

    const level = wet >= 4.8 ? "非常湿润" : wet >= 2.6 ? "中等湿润" : wet >= 1.2 ? "偏干燥" : "非常干燥";
    const tone = wet >= 4.8 ? "red" : wet >= 2.6 ? "" : "green";

    const high = vals[0];
    const highLabel = high === 14 ? "A 高面" : high === 13 ? "K 高面" : high === 12 ? "Q 高面" : high >= 10 ? "中高张面" : "低张面";

    // 谁占优
    let edge;
    if (paired) {
      edge = "翻前加注者（他有更多三条与顶对，但他也怕对手的暗三条）";
    } else if (high >= 13) {
      edge = "翻前加注者，优势明显（AK、AQ、KK、QQ 都在他的范围里）";
    } else if (high >= 11) {
      edge = "翻前加注者小幅领先";
    } else if (connected && high <= 10) {
      edge = "防守方（大盲）反而更舒服——他范围里的连张和中小对子全都对上了";
    } else {
      edge = "接近均衡，谁有位置谁舒服";
    }

    // 建议尺度
    let sizing, sizingNote;
    if (paired || (wet < 1.2 && high >= 12)) {
      sizing = "1/3 池 · 高频（70% 以上）";
      sizingNote = "用整个范围小注，让对手的边缘牌便宜地弃牌。";
    } else if (wet >= 4.8) {
      sizing = "2/3 – 1 池 · 低频（30–45%）";
      sizingNote = "强牌要价值、听牌要弃牌率，中间牌力直接过牌。大注配窄范围。";
    } else if (connected) {
      sizing = "1/2 – 2/3 池 · 中频";
      sizingNote = "牌面同时利于双方，别用一个大注把弱牌全赶走。";
    } else {
      sizing = "1/2 池 · 中频";
      sizingNote = "混合策略：强牌下注、部分边缘牌过牌保护你的过牌范围。";
    }

    const tags = [
      suitCount === 1 ? '<span class="pill blue">单色面</span>'
        : suitCount === 2 ? '<span class="pill">两色面</span>'
        : '<span class="pill mute">彩虹面</span>',
      paired ? '<span class="pill">有对子</span>' : '<span class="pill mute">无对子</span>',
      connected ? '<span class="pill red">强连通</span>' : semiConnected ? '<span class="pill mute">弱连通</span>' : '<span class="pill mute">不连张</span>',
      '<span class="pill ' + tone + '">' + level + "</span>",
      '<span class="pill mute">' + highLabel + "</span>",
    ].join("");

    return (
      '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px">' + tags + "</div>" +
      '<div class="grid g3" style="gap:14px">' +
        '<div class="panel panel-flat" style="padding:16px 18px"><h3 style="font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)">谁有范围优势</h3><p style="margin:0;font-size:14px">' + edge + "</p></div>" +
        '<div class="panel panel-flat" style="padding:16px 18px"><h3 style="font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)">建议下注尺度</h3><p style="margin:0;font-size:14px"><b>' + sizing + "</b></p></div>" +
        '<div class="panel panel-flat" style="padding:16px 18px"><h3 style="font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)">执行要点</h3><p style="margin:0;font-size:14px">' + sizingNote + "</p></div>" +
      "</div>"
    );
  }

  document.addEventListener("DOMContentLoaded", build);
})();
