/* =========================================================
   德扑教室 · 练习场
   ========================================================= */
(function () {
  "use strict";

  const QUESTIONS = [
    {
      tag: "牌型",
      q: "牌面 A♠ 7♦ 7♣ K♥ 2♠。你手持 A♦ 3♦，对手手持 K♠ K♦。谁赢？",
      opts: ["你赢", "对手赢", "平局（分池）", "看谁的花色大"],
      a: 0,
      why: "你最好的五张是 A A 7 7 K（A 和 7 两对），对手是 K K 7 7 A（K 和 7 两对）。两对先比大的那对，A 大于 K，所以你赢。注意两人都用到了公共牌的那对 7。",
    },
    {
      tag: "概率",
      q: "看七张牌（两张手牌 + 五张公共牌）时，出现频率最高的牌型是？",
      opts: ["一对", "两对", "高牌", "三条"],
      a: 0,
      why: "一对约为 43.8%，两对约 23.5%，高牌约 17.4%。这也是为什么德扑里大多数摊牌是“小牌对轰”——不要因为中了顶对就以为天下无敌。",
    },
    {
      tag: "牌型",
      q: "公共牌 K♠ Q♦ J♥ T♣ 2♦，你手持 9♠ 8♥。你的牌型是？",
      opts: ["顺子，K 高", "顺子，Q 高", "两对", "什么都没有"],
      a: 0,
      why: "8 9 T J Q K 是六张连牌，取最大的五张就是 9-T-J-Q-K，K 高的顺子。这里最容易犯的错是以为 8 也用得上——五张里不需要它。",
    },
    {
      tag: "规则",
      q: "9 人桌，翻牌之后每一条街，第一个行动的人是谁？",
      opts: ["小盲位", "大盲位", "按钮位", "枪口位"],
      a: 0,
      why: "翻牌后从按钮左边第一位开始，也就是小盲先说话，按钮最后说话。翻牌前不同：大盲因为已经投注，享有最后行动权。",
    },
    {
      tag: "赔率",
      q: "底池里有 100，对手下注 50。你跟注需要的胜率大约是多少？",
      opts: ["25%", "33%", "50%", "20%"],
      a: 0,
      why: "跟注 50 去赢一个最终 200 的底池：50 ÷ 200 = 25%。只要你的胜率高于 25%，跟注就是正 EV。记住这个基准：半个底池的下注，价格是 25%。",
    },
    {
      tag: "补牌",
      q: "翻牌圈你有 9 张同花补牌，一直看到河牌，成同花的概率约为？",
      opts: ["35%", "18%", "45%", "9%"],
      a: 0,
      why: "9 张补牌、还剩两张牌：9 × 4 ≈ 36%，精确值 35.0%。如果只剩一张（转牌圈），就变成约 19.6%，所以转牌圈再追就贵多了。",
    },
    {
      tag: "补牌",
      q: "转牌圈你只有 8 张补牌（两头顺），河牌成顺子的概率约为？",
      opts: ["17%", "32%", "8%", "25%"],
      a: 0,
      why: "只剩一张牌：8 ÷ 46 ≈ 17.4%，心算用 8 × 2 = 16%。对比翻牌圈同样 8 张补牌的 31.5%，可以看到“一次机会”和“两次机会”的差距有多大。",
    },
    {
      tag: "起手牌",
      q: "同样是 KJo，下面哪个位置最应该开池加注？",
      opts: ["按钮位 BTN", "枪口位 UTG", "小盲位 SB", "前面有人加注时的大盲位"],
      a: 0,
      why: "KJo 在按钮位是可以开池的好牌（翻后永远最后行动），在枪口位则是典型的“击中也是第二好”的麻烦牌。位置不同，同一手牌的结论就完全相反。",
    },
    {
      tag: "起手牌",
      q: "按钮位能玩最宽的范围，最主要的原因是？",
      opts: ["翻牌后永远最后行动", "可以少交盲注", "起手牌运气更好", "可以先看到对手的底牌"],
      a: 0,
      why: "位置带来信息和控制权：对手先行动，你可以用下注控制底池、在对手示弱时偷池、在成牌时多拿一条街的价值。这不是运气，是结构性的优势。",
    },
    {
      tag: "术语",
      q: "“3-bet”指的是什么？",
      opts: ["对开池加注再加注", "下注底池的 3 倍", "连续三次过牌", "三个人同时跟注"],
      a: 0,
      why: "大盲算第 1 次加注，开池算第 2 次，所以对开池再加注就是 3-bet。4-bet 就是再加一次。通常 3-bet 的尺度是开池额的 3 倍左右。",
    },
    {
      tag: "翻后",
      q: "牌面 A♠ 7♦ 2♣（彩虹，很干燥）。你是翻前加注者，最合适的持续下注尺度是？",
      opts: ["1/3 池，高频（70% 以上）", "满池，高频", "几乎总是过牌", "直接全下"],
      a: 0,
      why: "干燥的高张面对翻前加注者极为有利：他范围里的 A、高对全都在，而对手的牌大多错过了这个面。用小注就能让对手的边缘牌弃牌，没必要用大注冒险。",
    },
    {
      tag: "翻后",
      q: "你在按钮位加注，大盲跟注。翻牌 9♥ 8♥ 5♠，对手过牌。哪个说法最准确？",
      opts: ["这个面对大盲更有利，你该降低下注频率", "你有巨大范围优势，应该高频小注", "无论如何都该全下", "应该一路过牌到摊牌"],
      a: 0,
      why: "9-8-5 两色的连通面正是大盲防守范围的“甜区”——连张、中小对子全都对上了，而你范围里的高张几乎什么都没击中。此时该更谨慎地过牌，用强牌和听牌混合下注。",
    },
    {
      tag: "数学",
      q: "底池 100，你下注 100 做纯诈唬。对手至少要多频繁弃牌，这一枪才不亏？",
      opts: ["50%", "33%", "25%", "75%"],
      a: 0,
      why: "盈亏平衡弃牌率 = 下注 ÷ (底池 + 下注) = 100 ÷ 200 = 50%。满池诈唬需要对手一半的时候弃牌，而大多数对手都弃不到这么频繁——所以纯诈唬别用满池。",
    },
    {
      tag: "翻后",
      q: "下面哪种情况最不该做持续下注（C-bet）？",
      opts: [
        "两个对手都跟注，面是 8♠ 7♠ 6♦，你手里纯空气",
        "单挑，A 高的干燥彩虹面，你有位置",
        "对手是紧弱型，且在翻牌过牌",
        "你击中了顶对顶踢脚",
      ],
      a: 0,
      why: "人多 + 湿润面 + 没有后门出路，是 C-bet 的三个禁区叠在一起。对手两个人里只要有一个跟注，你就得在转牌继续讲一个昂贵的故事，而且他们的范围里全是成牌与听牌。",
    },
    {
      tag: "补牌",
      q: "“我数了 9 张同花补牌，所以我有 35% 胜率”——这句话最可能错在哪？",
      opts: [
        "有些补牌可能让对手成葫芦或更大同花，有效补牌不足 9 张",
        "35% 算错了，应该是 18%",
        "同花听牌其实只有 8 张补牌",
        "翻牌圈不该考虑胜率",
      ],
      a: 0,
      why: "补牌必须“干净”才算数。牌面成对时，你的同花补牌可能正好让对手中葫芦；牌面有三张同花色时，你可能追到却是第二好的同花。这就是“反向隐含赔率”。",
    },
    {
      tag: "资金",
      q: "打 1/2 的现金局（买入 200），比较合理的资金准备是？",
      opts: ["4000–6000 以上（20–30 个买入）", "400 就够（2 个买入）", "有多少带多少", "1000 足够"],
      a: 0,
      why: "一个稳定赢家也会遇到 20 个买入级别的大幅回撤。资金不够的直接后果是：被波动逼着做错误的决定——比如不敢在领先时加注，或者为了追回损失而越打越松。",
    },
  ];

  const state = { i: 0, score: 0, wrongs: [], locked: false };

  // 每次答题都重新打乱选项顺序，避免"正确答案总在第一项"
  let session = [];

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function buildSession() {
    session = QUESTIONS.map(function (q) {
      const order = shuffle(q.opts.map(function (_, i) { return i; }));
      return {
        tag: q.tag,
        q: q.q,
        why: q.why,
        opts: order.map(function (i) { return q.opts[i]; }),
        a: order.indexOf(q.a),
      };
    });
  }

  const app = document.getElementById("quizApp");
  if (!app) return;

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function render() {
    if (state.i >= session.length) return renderDone();
    const q = session[state.i];
    const pct = (state.i / session.length) * 100;

    app.innerHTML =
      '<div class="quiz-top">' +
        "<span>第 " + (state.i + 1) + " / " + session.length + " 题 · " + q.tag + "</span>" +
        '<span class="score">得分 ' + state.score + "</span>" +
      "</div>" +
      '<div class="progress"><i style="width:' + pct + '%"></i></div>' +
      '<div class="q-card">' +
        '<div class="q-tag">' + q.tag + "</div>" +
        '<div class="q-text">' + q.q + "</div>" +
        '<div class="q-options" id="opts">' +
          q.opts.map(function (o, k) {
            return '<button class="opt" data-k="' + k + '"><span class="key">' +
              "ABCD"[k] + "</span><span>" + esc(o) + "</span></button>";
          }).join("") +
        "</div>" +
        '<div class="q-explain" id="explain"></div>' +
        '<div class="q-foot"><span class="hint">可以按键盘 1–4 作答</span>' +
          '<button class="btn btn-sm" id="nextBtn" disabled>下一题 →</button></div>' +
      "</div>";

    app.querySelectorAll(".opt").forEach(function (btn) {
      btn.addEventListener("click", function () { answer(+btn.dataset.k); });
    });
    document.getElementById("nextBtn").addEventListener("click", next);
  }

  function answer(k) {
    if (state.locked) return;
    state.locked = true;
    const q = session[state.i];
    const opts = Array.from(app.querySelectorAll(".opt"));

    opts.forEach(function (b, idx) {
      b.disabled = true;
      if (idx === q.a) b.classList.add("correct");
      else if (idx === k) b.classList.add("wrong");
    });

    const ok = k === q.a;
    if (ok) state.score++;
    else state.wrongs.push({ q: q.q, a: q.opts[q.a], why: q.why, tag: q.tag, picked: q.opts[k] });

    const ex = document.getElementById("explain");
    ex.className = "q-explain show";
    ex.innerHTML =
      "<b>" + (ok ? "答对了。" : "正确答案：" + esc(q.opts[q.a])) + "</b> " + esc(q.why);

    document.querySelector(".quiz-top .score").textContent = "得分 " + state.score;
    const nb = document.getElementById("nextBtn");
    nb.disabled = false;
    nb.textContent = state.i === session.length - 1 ? "查看成绩 →" : "下一题 →";
    nb.focus();
  }

  function next() {
    state.i++;
    state.locked = false;
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderDone() {
    const total = session.length;
    const right = state.score;
    const pct = Math.round((right / total) * 100);

    let title, desc;
    if (right >= 15) {
      title = "可以上桌了";
      desc = "规则、范围、翻后和数学都串起来了。剩下的是量的问题：多打、多复盘，把范围变成肌肉记忆。";
    } else if (right >= 12) {
      title = "结构已经有了";
      desc = "地基搭好了，但还有明显的空洞。看看下面的错题落在哪个模块，回去补那一节。";
    } else if (right >= 8) {
      title = "基础过关，策略还空着";
      desc = "该重读“位置与起手牌”和“数学与赔率”两节。新手 80% 的亏损都出在这两块，回报率最高。";
    } else {
      title = "先回去看一遍规则";
      desc = "别急，这不是智力问题，是还没建立框架。把 9 种牌型和行动顺序弄清楚，再回来测一次。";
    }

    const review = state.wrongs.length
      ? '<div class="review">' +
          '<div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:4px">错题回顾（' + state.wrongs.length + "）</div>" +
          state.wrongs.map(function (w) {
            return '<div class="review-row"><b>[' + w.tag + "] " + esc(w.q) + "</b>" +
              "你选了：" + esc(w.picked) + " · 正确答案：<span>" + esc(w.a) + "</span>" +
              '<div style="margin-top:6px;color:var(--muted)">' + esc(w.why) + "</div></div>";
          }).join("") +
        "</div>"
      : '<div class="review"><div class="review-row" style="background:rgba(201,239,99,.26);border-color:rgba(23,73,58,.3)">全对。没有错题。<span>可以试试把这 16 题讲给一个比你更新手的人听。</span></div></div>';

    app.innerHTML =
      '<div class="q-card quiz-done">' +
        '<div class="progress" style="margin-bottom:28px"><i style="width:100%"></i></div>' +
        '<div class="score-ring" style="--p:' + pct + '%"><div style="position:relative;z-index:1">' +
          "<b>" + right + "/" + total + "</b><small>正确率 " + pct + "%</small></div></div>" +
        "<h2 style='margin-bottom:8px'>" + title + "</h2>" +
        '<p style="max-width:48ch;margin:0 auto 6px">' + desc + "</p>" +
        review +
        '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:28px">' +
          '<button class="btn" id="againBtn">再测一次</button>' +
          '<a class="btn btn-ghost" href="ranges.html">回去看起手牌矩阵</a>' +
        "</div>" +
      "</div>";

    document.getElementById("againBtn").addEventListener("click", function () {
      state.i = 0; state.score = 0; state.wrongs = []; state.locked = false;
      buildSession();
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  document.addEventListener("keydown", function (e) {
    if (state.i >= session.length) return;
    if (e.key >= "1" && e.key <= "4") {
      const k = +e.key - 1;
      if (!state.locked) answer(k);
    } else if ((e.key === "Enter" || e.key === " ") && state.locked) {
      e.preventDefault();
      next();
    }
  });

  buildSession();
  render();
})();
