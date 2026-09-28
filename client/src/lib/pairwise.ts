// All-pairs (pairwise) test generation: greedy AETG-style, best of N candidates per row.

export interface Parameter {
  name: string;
  values: string[];
}

/** "Браузер: Chrome, Firefox, Safari" per line. */
export function parseParameters(text: string): Parameter[] {
  const params: Parameter[] = [];
  const seen = new Set<string>();
  text.split(/\r?\n/).forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const idx = trimmed.indexOf(":");
    if (idx <= 0) throw new Error(`Строка ${i + 1}: нужен формат «Параметр: значение1, значение2»`);
    const name = trimmed.slice(0, idx).trim();
    const values = Array.from(new Set(trimmed.slice(idx + 1).split(",").map((v) => v.trim()).filter(Boolean)));
    if (!values.length) throw new Error(`Строка ${i + 1}: у параметра «${name}» нет значений`);
    if (seen.has(name)) throw new Error(`Строка ${i + 1}: параметр «${name}» указан дважды`);
    seen.add(name);
    params.push({ name, values });
  });
  return params;
}

// Seeded PRNG so the same input gives the same table (reproducible test plans)
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pairKey = (p1: number, v1: number, p2: number, v2: number) => `${p1}:${v1}|${p2}:${v2}`;

export function generatePairwise(params: Parameter[], seed = 1, candidatesPerRow = 30): number[][] {
  const n = params.length;
  if (n === 0) return [];
  if (n === 1) return params[0].values.map((_, i) => [i]);

  const uncovered = new Set<string>();
  for (let a = 0; a < n; a++) {
    for (let b = a + 1; b < n; b++) {
      for (let va = 0; va < params[a].values.length; va++) {
        for (let vb = 0; vb < params[b].values.length; vb++) uncovered.add(pairKey(a, va, b, vb));
      }
    }
  }

  const rand = mulberry32(seed);
  const rows: number[][] = [];

  const gain = (row: number[], p: number, v: number) => {
    let g = 0;
    for (let q = 0; q < n; q++) {
      if (q === p || row[q] === -1) continue;
      if (uncovered.has(q < p ? pairKey(q, row[q], p, v) : pairKey(p, v, q, row[q]))) g++;
    }
    return g;
  };

  while (uncovered.size > 0) {
    // seed each candidate with one still-uncovered pair so every row makes progress
    const first = uncovered.values().next().value as string;
    const [[pa, va], [pb, vb]] = first.split("|").map((part) => part.split(":").map(Number));

    let best: number[] | null = null;
    let bestScore = -1;
    for (let c = 0; c < candidatesPerRow; c++) {
      const row = new Array(n).fill(-1);
      row[pa] = va;
      row[pb] = vb;
      const order = Array.from({ length: n }, (_, i) => i).filter((i) => i !== pa && i !== pb);
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      for (const p of order) {
        let bestV = 0;
        let bestG = -1;
        const start = Math.floor(rand() * params[p].values.length);
        for (let k = 0; k < params[p].values.length; k++) {
          const v = (start + k) % params[p].values.length;
          const g = gain(row, p, v);
          if (g > bestG) {
            bestG = g;
            bestV = v;
          }
        }
        row[p] = bestV;
      }
      let score = 0;
      for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) if (uncovered.has(pairKey(a, row[a], b, row[b]))) score++;
      if (score > bestScore) {
        bestScore = score;
        best = row;
      }
    }

    for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) uncovered.delete(pairKey(a, best![a], b, best![b]));
    rows.push(best!);
  }
  return rows;
}

export function totalCombinations(params: Parameter[]): number {
  return params.reduce((acc, p) => acc * p.values.length, 1);
}

/** Independent check that every value pair of every two parameters occurs in some row. */
export function missingPairs(params: Parameter[], rows: number[][]): number {
  let missing = 0;
  for (let a = 0; a < params.length; a++) {
    for (let b = a + 1; b < params.length; b++) {
      for (let va = 0; va < params[a].values.length; va++) {
        for (let vb = 0; vb < params[b].values.length; vb++) {
          if (!rows.some((r) => r[a] === va && r[b] === vb)) missing++;
        }
      }
    }
  }
  return missing;
}
