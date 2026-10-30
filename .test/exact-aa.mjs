// 穷举 AA vs KK 的全部 1,712,304 种公共牌 —— 对照公认值 81.9% / 0.4% / 17.7%
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const ROOT = dirname(fileURLToPath(import.meta.url));
const ctx = {
  console, Math, Set, Map,
  window: { addEventListener() {} },
  document: { addEventListener() {}, getElementById() { return null; }, querySelectorAll() { return []; } },
};
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(readFileSync(join(ROOT, "..", "assets", "math.js"), "utf8"), ctx);
const { eval7, idOf } = ctx.window.PokerMath;

const hero = ["As", "Ah"].map(idOf);
const vill = ["Ks", "Kh"].map(idOf);
const deck = [];
for (let id = 0; id < 52; id++) {
  if (!hero.includes(id) && !vill.includes(id)) deck.push(id);
}
console.log("牌堆剩余:", deck.length);

const h7 = new Int32Array(7), v7 = new Int32Array(7);
h7[5] = hero[0]; h7[6] = hero[1]; v7[5] = vill[0]; v7[6] = vill[1];
let w = 0, t = 0, l = 0;
const t0 = Date.now();
for (let a = 0; a < deck.length; a++)
  for (let b = a + 1; b < deck.length; b++)
    for (let c = b + 1; c < deck.length; c++)
      for (let d = c + 1; d < deck.length; d++)
        for (let e = d + 1; e < deck.length; e++) {
          h7[0] = v7[0] = deck[a];
          h7[1] = v7[1] = deck[b];
          h7[2] = v7[2] = deck[c];
          h7[3] = v7[3] = deck[d];
          h7[4] = v7[4] = deck[e];
          const x = eval7(h7), y = eval7(v7);
          if (x > y) w++; else if (x < y) l++; else t++;
        }
const n = w + t + l;
const pct = (x) => ((x / n) * 100).toFixed(2);
console.log(`穷举 ${n} 局，用时 ${Date.now() - t0}ms`);
console.log(`AA 胜 ${pct(w)}%  平 ${pct(t)}%  KK 胜 ${pct(l)}%`);
const aaw = (w / n) * 100;
console.log(Math.abs(aaw - 81.9) < 1 ? "与公认值一致 ✓" : "与公认值不一致 ✗（应为 81.9%）");
