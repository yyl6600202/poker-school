// 逻辑自测：在 Node 里跑 ranges.js / math.js 的纯逻辑部分
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const ROOT = dirname(fileURLToPath(import.meta.url));
const asset = (f) => readFileSync(join(ROOT, "..", "assets", f), "utf8");

const ctx = {
  console,
  Math,
  Set,
  Map,
  window: { addEventListener() {}, scrollTo() {} },
  document: {
    addEventListener() {},
    getElementById() { return null; },
    querySelectorAll() { return []; },
    querySelector() { return null; },
    createElement() {
      return { classList: { add() {}, toggle() {} }, style: {}, addEventListener() {}, appendChild() {} };
    },
  },
};
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(asset("ranges.js"), ctx);
vm.runInContext(asset("math.js"), ctx);

const { RangeData } = ctx.window;
const { eval7, idOf, CAT_NAME } = ctx.window.PokerMath;

let fail = 0;
const ok = (cond, msg) => {
  if (!cond) { fail++; console.log("  [FAIL] " + msg); } else console.log("  [ok] " + msg);
};

console.log("\n[1] range parsing");
ok(RangeData.POSITIONS.length === 7, "7 positions");
for (const p of RangeData.POSITIONS) {
  const pct = RangeData.pct(p.set);
  ok(pct > 4 && pct < 60, `${p.key}: ${p.set.size} hands / ${pct.toFixed(1)}%`);
}
const byKey = Object.fromEntries(RangeData.POSITIONS.map((p) => [p.key, RangeData.pct(p.set)]));
ok(byKey.UTG < byKey.BTN, "UTG tighter than BTN");
ok(byKey.MP < byKey.SB, "MP tighter than SB");
ok(RangeData.TIER_OF["AKs"] === 1 && RangeData.TIER_OF["72o"] === undefined, "tier map sane");

console.log("\n[2] hand evaluation");
const H = (s) => s.split(" ").map(idOf);
const cat = (s) => CAT_NAME[Math.floor(eval7(H(s)) / Math.pow(15, 5))];
ok(cat("As Ks Qs Js Ts 2h 3d") === "同花顺", "royal flush");
ok(cat("As 5s 4s 3s 2s Kh Qd") === "同花顺", "steel wheel");
ok(cat("9s 9h 9d 9c Ks 2d 3c") === "四条", "quads");
ok(cat("Ks Kh Kd 7c 7s 2d 3c") === "葫芦", "full house");
ok(cat("As Js 9s 6s 3s Kd Qh") === "同花", "flush");
ok(cat("8d 7c 6s 5h 4d Ah Ks") === "顺子", "straight");
ok(cat("Ah 2c 3d 4s 5h 9c Kd") === "顺子", "wheel straight");
ok(cat("Qc Qd Qh 9s 4h 2c 3d") === "三条", "trips");
ok(cat("Js Jh 6d 6c As 2d 3h") === "两对", "two pair");
ok(cat("Ts Th Ad 8c 3s 2h 4d") === "一对", "one pair");
ok(cat("As Qd 9c 5h 2s 7d 3c") === "高牌", "high card");

const cmp = (a, b) => Math.sign(eval7(H(a)) - eval7(H(b)));
ok(cmp("Ks Kh Kd 7c 7s 2d 3c", "As Js 9s 6s 3s Kd Qh") > 0, "full house > flush");
ok(cmp("As Js 9s 6s 3s Kd Qh", "8d 7c 6s 5h 4d Ah Ks") > 0, "flush > straight");
ok(cmp("As Kd 9c 5h 2s 7d 3c", "Ah Qd 9d 5c 2h 7s 4c") > 0, "kicker matters");
ok(cmp("As Kd Qc 5h 2s 7d 3c", "Ad Kh Qs 5c 2h 7s 4c") === 0, "identical -> tie");
ok(cmp("Ah 2c 3d 4s 5h 9c Kd", "2c 3d 4s 5h 6d 9c Kd") < 0, "wheel < six-high straight");

console.log("\n[3] preflop equity (Monte Carlo 20000)");
function preflop(a, b, iters = 20000) {
  const hero = H(a), vill = H(b);
  const deck = [];
  for (let id = 0; id < 52; id++) if (!hero.includes(id) && !vill.includes(id)) deck.push(id);
  const h7 = new Int32Array(7), v7 = new Int32Array(7);
  h7[5] = hero[0]; h7[6] = hero[1]; v7[5] = vill[0]; v7[6] = vill[1];
  let w = 0, t = 0, l = 0;
  for (let i = 0; i < iters; i++) {
    for (let k = 0; k < 5; k++) {
      const j = k + Math.floor(Math.random() * (deck.length - k));
      const tmp = deck[k]; deck[k] = deck[j]; deck[j] = tmp;
    }
    for (let k = 0; k < 5; k++) { h7[k] = deck[k]; v7[k] = deck[k]; }
    const x = eval7(h7), y = eval7(v7);
    if (x > y) w++; else if (x < y) l++; else t++;
  }
  return { win: (w / iters) * 100, tie: (t / iters) * 100, lose: (l / iters) * 100 };
}
const cases = [
  ["AA vs KK", "As Ah", "Ks Kh", 79, 84],
  ["AKs vs 22", "As Ks", "2c 2d", 46, 51],
  ["AKo vs 76s", "Ac Kd", "7h 6h", 55, 62],
  ["QQ vs AKs", "Qs Qd", "Ah Kh", 51, 57],
  ["JTs vs AKo", "Jh Th", "Ac Kd", 38, 44],
];
for (const [name, a, b, lo, hi] of cases) {
  const r = preflop(a, b);
  ok(r.win >= lo && r.win <= hi, `${name} -> first hand ${r.win.toFixed(1)}% (expect ${lo}-${hi}%)`);
}

console.log(fail === 0 ? "\nALL PASS" : `\n${fail} FAILED`);
process.exit(fail === 0 ? 0 : 1);
