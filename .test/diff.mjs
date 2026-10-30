// 用"暴力枚举 21 个五张组合"的参考实现，对拍 eval7
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

const rankOf = (id) => (id >> 2) + 2;
const suitOf = (id) => id & 3;

function score5(cards) {
  const rs = cards.map(rankOf).sort((a, b) => b - a);
  const ss = cards.map(suitOf);
  const flush = ss.every((s) => s === ss[0]);

  const uniq = [...new Set(rs)];
  let straightHigh = 0;
  if (uniq.length === 5) {
    if (uniq[0] - uniq[4] === 4) straightHigh = uniq[0];
    else if (uniq[0] === 14 && uniq[1] === 5 && uniq[4] === 2) straightHigh = 5; // 轮子
  }

  const cnt = new Map();
  rs.forEach((r) => cnt.set(r, (cnt.get(r) || 0) + 1));
  const groups = [...cnt.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);

  const pack = (cat, ks) => {
    let v = cat;
    for (let i = 0; i < 5; i++) v = v * 15 + (ks[i] || 0);
    return v;
  };

  if (flush && straightHigh) return pack(8, [straightHigh]);
  if (groups[0][1] === 4) return pack(7, [groups[0][0], groups[1][0]]);
  if (groups[0][1] === 3 && groups[1][1] === 2) return pack(6, [groups[0][0], groups[1][0]]);
  if (flush) return pack(5, rs);
  if (straightHigh) return pack(4, [straightHigh]);
  if (groups[0][1] === 3) return pack(3, [groups[0][0], groups[1][0], groups[2][0]]);
  if (groups[0][1] === 2 && groups[1][1] === 2) return pack(2, [groups[0][0], groups[1][0], groups[2][0]]);
  if (groups[0][1] === 2) return pack(1, [groups[0][0], groups[1][0], groups[2][0], groups[3][0]]);
  return pack(0, rs);
}

function ref7(ids) {
  let best = -1;
  for (let a = 0; a < 3; a++)
    for (let b = a + 1; b < 4; b++)
      for (let c = b + 1; c < 5; c++)
        for (let d = c + 1; d < 6; d++)
          for (let e = d + 1; e < 7; e++) {
            const s = score5([ids[a], ids[b], ids[c], ids[d], ids[e]]);
            if (s > best) best = s;
          }
  return best;
}

const N = 200000;
let bad = 0;
const hnd = new Int32Array(7);
for (let i = 0; i < N; i++) {
  const pool = [];
  for (let id = 0; id < 52; id++) pool.push(id);
  for (let k = 0; k < 7; k++) {
    const j = k + Math.floor(Math.random() * (52 - k));
    const t = pool[k]; pool[k] = pool[j]; pool[j] = t;
    hnd[k] = pool[k];
  }
  const fast = eval7(hnd);
  const slow = ref7(hnd);
  if (fast !== slow) {
    bad++;
    if (bad <= 5) {
      const label = (id) => "23456789TJQKA"[rankOf(id) - 2] + "shdc"[suitOf(id)];
      console.log("mismatch:", [...hnd].map(label).join(" "), "fast=", fast, "ref=", slow);
    }
  }
}
console.log(`对拍 ${N} 手，不一致 ${bad} 手`);
