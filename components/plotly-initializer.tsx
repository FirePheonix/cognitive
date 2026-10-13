'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';

// ─── Shared helpers ────────────────────────────────────────────────────────────

function range(start: number, stop: number, step = 1): number[] {
  const out: number[] = [];
  for (let v = start; v <= stop + 1e-9; v += step) out.push(parseFloat(v.toFixed(8)));
  return out;
}

function sigmoid(z: number) { return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, z)))); }

/** Seeded LCG random number generator */
function seedRng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 0x100000000; };
}

/** Box-Muller normal sample */
function normSample(rng: () => number, mu = 0, sig = 1) {
  const u = Math.max(rng(), 1e-12), v = rng();
  return mu + sig * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Gaussian clusters – returns {x, y} arrays */
function gaussCluster(n: number, cx: number, cy: number, sig: number, rng: () => number) {
  return {
    x: Array.from({ length: n }, () => normSample(rng, cx, sig)),
    y: Array.from({ length: n }, () => normSample(rng, cy, sig)),
  };
}

/** Gaussian PDF */
function gaussPdf(x: number, mu: number, sig: number) {
  return (1 / (sig * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * ((x - mu) / sig) ** 2);
}

/** Polynomial least-squares fit via Gaussian elimination on normal equations */
function polyFit(xs: number[], ys: number[], degree: number): number[] {
  const d = degree + 1, n = xs.length;
  const A = xs.map(x => Array.from({ length: d }, (_, i) => x ** i));
  // AtA and Aty
  const AtA: number[][] = Array.from({ length: d }, (_, i) =>
    Array.from({ length: d }, (_, j) => A.reduce((s, r) => s + r[i] * r[j], 0)));
  const Aty: number[] = Array.from({ length: d }, (_, i) =>
    A.reduce((s, r, k) => s + r[i] * ys[k], 0));
  // Augmented matrix
  const M = AtA.map((r, i) => [...r, Aty[i]]);
  // Gauss-Jordan
  for (let c = 0; c < d; c++) {
    let maxR = c;
    for (let r = c + 1; r < d; r++) if (Math.abs(M[r][c]) > Math.abs(M[maxR][c])) maxR = r;
    [M[c], M[maxR]] = [M[maxR], M[c]];
    if (Math.abs(M[c][c]) < 1e-14) continue;
    for (let r = 0; r < d; r++) {
      if (r === c) continue;
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= d; k++) M[r][k] -= f * M[c][k];
    }
  }
  return M.map((r, i) => r[d] / r[i]);
}

function polyEval(coeffs: number[], x: number) {
  return coeffs.reduce((s, c, i) => s + c * x ** i, 0);
}

// ─── Recipe engine ─────────────────────────────────────────────────────────────

function recipes(name: string, params: Record<string, any>, dark: boolean) {
  const bg    = dark ? '#0f0f0f' : '#ffffff';
  const paper = dark ? '#0f0f0f' : '#ffffff';
  const text  = dark ? '#e5e5e5' : '#171717';
  const grid  = dark ? '#2a2a2a' : '#e5e5e5';
  const muted = dark ? '#555'    : '#999';

  const base = (overrides: object = {}) => ({
    plot_bgcolor: bg, paper_bgcolor: paper,
    font: { color: text, family: 'Inter, system-ui, sans-serif', size: 12 },
    margin: { t: 48, r: 24, b: 56, l: 60 },
    xaxis: { gridcolor: grid, zerolinecolor: grid, zerolinewidth: 1 },
    yaxis: { gridcolor: grid, zerolinecolor: grid, zerolinewidth: 1 },
    legend: { orientation: 'h' as const, y: -0.25 },
    ...overrides,
  });

  const COLORS = { indigo: '#6366f1', amber: '#f59e0b', emerald: '#10b981', rose: '#ef4444', sky: '#0ea5e9', purple: '#a855f7' };

  // ────────────────────────────────────────────────────────────────────────────
  // EXISTING RECIPES (kept exactly)
  // ────────────────────────────────────────────────────────────────────────────

  if (name === 'sigmoid') {
    const z = range(-6, 6, 0.15);
    const y = z.map(sigmoid);
    const dy = z.map(v => { const s = sigmoid(v); return s * (1 - s); });
    return {
      data: [
        { x: z, y, type: 'scatter', mode: 'lines', name: 'σ(z)', line: { color: COLORS.indigo, width: 3 } },
        { x: z, y: dy, type: 'scatter', mode: 'lines', name: "σ'(z)", line: { color: COLORS.amber, width: 2, dash: 'dash' } },
        { x: [0], y: [0.5], type: 'scatter', mode: 'markers', name: 'σ(0)=0.5', marker: { color: COLORS.rose, size: 10 } },
      ],
      layout: { ...base(), title: { text: params.title ?? 'Sigmoid  σ(z) = 1/(1+e⁻ᶻ)', font: { size: 13 } }, xaxis: { title: 'z', gridcolor: grid, zerolinecolor: grid }, yaxis: { title: 'σ(z)', range: [-0.05, 1.05], gridcolor: grid, zerolinecolor: grid } },
    };
  }

  if (name === 'mse_contour') {
    const tw = params.true_w ?? 3, tb = params.true_b ?? 7;
    const A = 38.5, B = 5.5;
    const wVals = range(1, 5, 0.12), bVals = range(3, 11, 0.2);
    const z = bVals.map(b => wVals.map(w => { const dw = w-tw, db = b-tb; return A*dw*dw + 2*B*dw*db + db*db; }));
    return {
      data: [
        { type: 'contour', x: wVals, y: bVals, z, colorscale: dark ? 'Viridis' : 'YlOrRd', reversescale: true, contours: { showlabels: true, labelfont: { size: 9, color: text } }, colorbar: { thickness: 10 } },
        { type: 'scatter', x: [tw], y: [tb], mode: 'markers', name: 'optimum', marker: { color: COLORS.emerald, size: 14, symbol: 'star' } },
        { type: 'scatter', mode: 'lines+markers', x: [1.0,1.5,2.0,2.5,2.8,3.0], y: [9.5,8.8,8.0,7.5,7.2,7.0], name: 'GD path', line: { color: COLORS.indigo, width: 2, dash: 'dot' }, marker: { color: COLORS.indigo, size: 5 } },
      ],
      layout: { ...base(), title: { text: params.title ?? 'MSE Loss Landscape', font: { size: 13 } }, xaxis: { title: 'w', gridcolor: grid, zerolinecolor: grid }, yaxis: { title: 'b', gridcolor: grid, zerolinecolor: grid } },
    };
  }

  if (name === 'linear_fit') {
    const rng = seedRng(42);
    const xs = range(0, 10, 0.5);
    const ys = xs.map(x => 2.5*x + 4 + (rng()-0.5)*6);
    return {
      data: [
        { type: 'scatter', mode: 'markers', x: xs, y: ys, name: 'data', marker: { color: COLORS.indigo, size: 7, opacity: 0.8 } },
        { type: 'scatter', mode: 'lines', x: [0, 10], y: [4, 29], name: 'ŷ = 2.5x + 4', line: { color: COLORS.rose, width: 2.5 } },
      ],
      layout: { ...base(), title: { text: params.title ?? 'Linear Regression Fit', font: { size: 13 } }, xaxis: { title: 'x', gridcolor: grid, zerolinecolor: grid }, yaxis: { title: 'y', gridcolor: grid, zerolinecolor: grid } },
    };
  }

  if (name === 'overfitting') {
    const depths = [1,2,3,4,5,6,7,8,9,10,12,15,20];
    const train  = [0.68,0.79,0.86,0.91,0.94,0.96,0.975,0.985,0.991,0.995,0.998,0.999,1.0];
    const val    = [0.66,0.77,0.84,0.87,0.88,0.875,0.865,0.85,0.83,0.81,0.77,0.72,0.66];
    return {
      data: [
        { type: 'scatter', mode: 'lines+markers', x: depths, y: train, name: 'Train', line: { color: COLORS.indigo, width: 2.5 }, marker: { size: 5 } },
        { type: 'scatter', mode: 'lines+markers', x: depths, y: val,   name: 'Validation', line: { color: COLORS.amber, width: 2.5 }, marker: { size: 5 } },
        { type: 'scatter', mode: 'lines', x: [5,5], y: [0.6,1.02], line: { color: COLORS.emerald, width: 1.5, dash: 'dash' }, showlegend: false },
      ],
      layout: { ...base(), title: { text: params.title ?? 'Overfitting: Accuracy vs Tree Depth', font: { size: 13 } }, xaxis: { title: 'max_depth', gridcolor: grid, zerolinecolor: grid }, yaxis: { title: 'Accuracy', range: [0.62,1.02], gridcolor: grid, zerolinecolor: grid }, annotations: [{ x: 5.3, y: 0.885, text: 'sweet spot', showarrow: false, font: { color: COLORS.emerald, size: 10 } }] },
    };
  }

  if (name === 'bias_variance') {
    const c = range(0, 10, 0.25);
    const bias2 = c.map(x => 4*Math.exp(-0.6*x));
    const vari  = c.map(x => 0.05*Math.exp(0.55*x));
    const tot   = bias2.map((b,i) => b + vari[i] + 0.1);
    const mi    = tot.reduce((m,v,i,a) => v < a[m] ? i : m, 0);
    return {
      data: [
        { type: 'scatter', mode: 'lines', x: c, y: bias2, name: 'Bias²', line: { color: COLORS.indigo, width: 2.5 } },
        { type: 'scatter', mode: 'lines', x: c, y: vari,  name: 'Variance', line: { color: COLORS.amber, width: 2.5 } },
        { type: 'scatter', mode: 'lines', x: c, y: tot,   name: 'Total Error', line: { color: COLORS.rose, width: 3 } },
        { type: 'scatter', mode: 'markers', x: [c[mi]], y: [tot[mi]], name: 'Optimum', marker: { color: COLORS.emerald, size: 12, symbol: 'star' } },
      ],
      layout: { ...base(), title: { text: params.title ?? 'Bias–Variance Tradeoff', font: { size: 13 } }, xaxis: { title: 'Model Complexity', gridcolor: grid, zerolinecolor: grid }, yaxis: { title: 'Error', gridcolor: grid, zerolinecolor: grid }, annotations: [{ x: c[mi]/2, y: 0.15, text: 'underfitting', showarrow: false, font: { color: muted, size: 10 } }, { x: (c[mi]+10)/2, y: 0.15, text: 'overfitting', showarrow: false, font: { color: muted, size: 10 } }] },
    };
  }

  if (name === 'roc_curve') {
    const fG = [0,0.02,0.05,0.08,0.12,0.18,0.25,0.35,0.5,0.7,1.0];
    const tG = [0,0.35,0.56,0.70,0.80,0.87,0.92,0.95,0.97,0.99,1.0];
    const fM = [0,0.05,0.12,0.22,0.35,0.50,0.65,0.80,1.0];
    const tM = [0,0.22,0.42,0.58,0.70,0.79,0.86,0.93,1.0];
    return {
      data: [
        { type: 'scatter', mode: 'lines', x: fG, y: tG, name: 'Good (AUC≈0.92)', line: { color: COLORS.indigo, width: 2.5 }, fill: 'tozeroy', fillcolor: dark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.06)' },
        { type: 'scatter', mode: 'lines', x: fM, y: tM, name: 'Weaker (AUC≈0.72)', line: { color: COLORS.amber, width: 2, dash: 'dash' } },
        { type: 'scatter', mode: 'lines', x: [0,1], y: [0,1], name: 'Random', line: { color: muted, width: 1.5, dash: 'dot' } },
      ],
      layout: { ...base(), title: { text: params.title ?? 'ROC Curve', font: { size: 13 } }, xaxis: { title: 'False Positive Rate', range: [0,1], gridcolor: grid, zerolinecolor: grid }, yaxis: { title: 'True Positive Rate', range: [0,1.02], gridcolor: grid, zerolinecolor: grid } },
    };
  }

  if (name === 'kmeans') {
    const rng = seedRng(7);
    const centers: [number,number][] = [[1,1],[5,8],[9,2]];
    const cols = [COLORS.indigo, COLORS.amber, COLORS.emerald];
    const traces = centers.map(([cx,cy], k) => {
      const cl = gaussCluster(40, cx, cy, 1.1, rng);
      return { type: 'scatter', mode: 'markers', name: `Cluster ${String.fromCharCode(65+k)}`, x: cl.x, y: cl.y, marker: { color: cols[k], size: 7, opacity: 0.8 } };
    });
    return {
      data: [...traces, { type: 'scatter', mode: 'markers', name: 'Centroids', x: centers.map(c=>c[0]), y: centers.map(c=>c[1]), marker: { color: cols, size: 18, symbol: 'x', line: { color: text, width: 2 } } }],
      layout: { ...base(), title: { text: params.title ?? 'K-Means  (k=3)', font: { size: 13 } }, xaxis: { title: 'Feature 1', gridcolor: grid, zerolinecolor: grid }, yaxis: { title: 'Feature 2', gridcolor: grid, zerolinecolor: grid } },
    };
  }

  // ────────────────────────────────────────────────────────────────────────────
  // NEW RECIPES
  // ────────────────────────────────────────────────────────────────────────────

  // ── nearest_centroid ─────────────────────────────────────────────────────────
  if (name === 'nearest_centroid') {
    const rng = seedRng(12);
    const c0 = gaussCluster(60, -2, -2, 1, rng);
    const c1 = gaussCluster(60,  2,  2, 1, rng);
    // Decision boundary: perpendicular bisector of (-2,-2)→(2,2) is y = -x
    const bx = range(-5, 5, 0.5);
    return {
      data: [
        { type: 'scatter', mode: 'markers', name: 'Class 0', x: c0.x, y: c0.y, marker: { color: COLORS.indigo, size: 6, opacity: 0.7 } },
        { type: 'scatter', mode: 'markers', name: 'Class 1', x: c1.x, y: c1.y, marker: { color: COLORS.amber, size: 6, opacity: 0.7 } },
        { type: 'scatter', mode: 'markers', name: 'Centroids', x: [-2, 2], y: [-2, 2], marker: { color: [COLORS.indigo, COLORS.amber], size: 18, symbol: 'x', line: { color: text, width: 3 } } },
        { type: 'scatter', mode: 'lines', name: 'Decision boundary', x: bx, y: bx.map(x => -x), line: { color: COLORS.emerald, width: 2.5, dash: 'dash' } },
      ],
      layout: { ...base(), title: { text: params.title ?? 'Nearest Centroid — linear decision boundary', font: { size: 13 } }, xaxis: { title: 'x₁', range: [-5.5,5.5], gridcolor: grid, zerolinecolor: grid }, yaxis: { title: 'x₂', range: [-5.5,5.5], gridcolor: grid, zerolinecolor: grid, scaleanchor: 'x' } },
    };
  }

  // ── gradient_descent_lr ──────────────────────────────────────────────────────
  if (name === 'gradient_descent_lr') {
    const iters = range(0, 30);
    // Good LR: fast exponential convergence
    const good = iters.map(i => 5 * Math.exp(-0.22 * i) + 0.05);
    // Low LR: very slow
    const low  = iters.map(i => 5 * Math.exp(-0.025 * i));
    // High LR: oscillates / diverges then maybe stabilises
    const high = iters.map(i => {
      const base = 0.5;
      const osc  = 2.5 * Math.exp(-0.08 * i) * Math.abs(Math.cos(1.3 * i));
      return base + osc + (i < 5 ? (5 - i) * 0.4 : 0);
    });
    return {
      data: [
        { type: 'scatter', mode: 'lines', name: 'Good LR (α=0.01)', x: iters, y: good, line: { color: COLORS.emerald, width: 2.5 } },
        { type: 'scatter', mode: 'lines', name: 'Low LR (α=0.0001)', x: iters, y: low, line: { color: COLORS.amber, width: 2, dash: 'dash' } },
        { type: 'scatter', mode: 'lines', name: 'High LR (α=0.5, oscillates)', x: iters, y: high, line: { color: COLORS.rose, width: 2, dash: 'dot' } },
      ],
      layout: { ...base(), title: { text: params.title ?? 'Gradient Descent — effect of learning rate', font: { size: 13 } }, xaxis: { title: 'Epoch', gridcolor: grid, zerolinecolor: grid }, yaxis: { title: 'Loss (MSE)', gridcolor: grid, zerolinecolor: grid } },
    };
  }

  // ── polynomial_overfit ───────────────────────────────────────────────────────
  if (name === 'polynomial_overfit') {
    const rng = seedRng(3);
    const xData = range(0, 2 * Math.PI, 2 * Math.PI / 14).slice(0, 14);
    const yData = xData.map(x => Math.sin(x) + normSample(rng, 0, 0.25));
    const xLine = range(0, 2 * Math.PI, 0.05);
    const c1  = polyFit(xData, yData, 1);
    const c4  = polyFit(xData, yData, 4);
    const c12 = polyFit(xData, yData, 12);
    return {
      data: [
        { type: 'scatter', mode: 'markers', name: 'Data', x: xData, y: yData, marker: { color: text, size: 8, opacity: 0.85 } },
        { type: 'scatter', mode: 'lines', name: 'Degree 1 (underfit)', x: xLine, y: xLine.map(x => polyEval(c1, x)),  line: { color: COLORS.amber, width: 2, dash: 'dash' } },
        { type: 'scatter', mode: 'lines', name: 'Degree 4 (good fit)', x: xLine, y: xLine.map(x => polyEval(c4, x)),  line: { color: COLORS.emerald, width: 2.5 } },
        { type: 'scatter', mode: 'lines', name: 'Degree 12 (overfit)',  x: xLine, y: xLine.map(x => Math.max(-2.5, Math.min(2.5, polyEval(c12, x)))), line: { color: COLORS.rose, width: 2, dash: 'dot' } },
      ],
      layout: { ...base(), title: { text: params.title ?? 'Polynomial Regression — underfitting vs overfitting', font: { size: 13 } }, xaxis: { title: 'x', gridcolor: grid, zerolinecolor: grid }, yaxis: { title: 'y', range: [-2.8, 2.8], gridcolor: grid, zerolinecolor: grid } },
    };
  }

  // ── cross_entropy_loss ───────────────────────────────────────────────────────
  if (name === 'cross_entropy_loss') {
    const p = range(0.01, 0.99, 0.01);
    const loss1 = p.map(v => -Math.log(v));       // y=1: -log(p)
    const loss0 = p.map(v => -Math.log(1 - v));   // y=0: -log(1-p)
    return {
      data: [
        { type: 'scatter', mode: 'lines', name: 'y=1: loss = −log(p)', x: p, y: loss1, line: { color: COLORS.indigo, width: 2.5 } },
        { type: 'scatter', mode: 'lines', name: 'y=0: loss = −log(1−p)', x: p, y: loss0, line: { color: COLORS.amber, width: 2.5, dash: 'dash' } },
      ],
      layout: { ...base(), title: { text: params.title ?? 'Binary Cross-Entropy Loss', font: { size: 13 } }, xaxis: { title: 'Predicted probability  p̂', gridcolor: grid, zerolinecolor: grid }, yaxis: { title: 'Loss', range: [0, 5], gridcolor: grid, zerolinecolor: grid }, annotations: [{ x: 0.1, y: 4.2, text: 'Confident &amp; wrong → huge penalty', showarrow: false, font: { color: muted, size: 10 } }] },
    };
  }

  // ── logistic_boundary ────────────────────────────────────────────────────────
  if (name === 'logistic_boundary') {
    const rng = seedRng(7);
    const c0 = gaussCluster(60, -2, -1.5, 1, rng);
    const c1 = gaussCluster(60,  2,  1.5, 1, rng);
    // Boundary: the midpoint perpendicular — here y = -1.5/2 / (2/1) * ... simpler: just use y = -4/3 * x
    const bx = range(-4.5, 4.5, 0.2);
    return {
      data: [
        { type: 'scatter', mode: 'markers', name: 'Class 0', x: c0.x, y: c0.y, marker: { color: COLORS.indigo, size: 6, opacity: 0.7 } },
        { type: 'scatter', mode: 'markers', name: 'Class 1', x: c1.x, y: c1.y, marker: { color: COLORS.amber, size: 6, opacity: 0.7 } },
        { type: 'scatter', mode: 'lines', name: 'Decision boundary', x: bx, y: bx.map(x => -x * (1.5/2)), line: { color: COLORS.emerald, width: 2.5 } },
      ],
      layout: { ...base(), title: { text: params.title ?? 'Logistic Regression — linear decision boundary', font: { size: 13 } }, xaxis: { title: 'x₁', range: [-5.5,5.5], gridcolor: grid, zerolinecolor: grid }, yaxis: { title: 'x₂', range: [-5.5,5.5], gridcolor: grid, zerolinecolor: grid, scaleanchor: 'x' } },
    };
  }

  // ── precision_recall_threshold ───────────────────────────────────────────────
  if (name === 'precision_recall_threshold') {
    const thresh = range(0, 1, 0.02);
    const prec = thresh.map(t => Math.min(1, 0.5 + 0.5 * t + 0.05 * Math.sin(5*t)));
    const rec  = thresh.map(t => Math.max(0, 1 - 1.1 * t - 0.05 * Math.cos(4*t)));
    const f1   = thresh.map((_, i) => prec[i] + rec[i] > 0 ? 2*prec[i]*rec[i]/(prec[i]+rec[i]) : 0);
    const best = f1.reduce((m, v, i, a) => v > a[m] ? i : m, 0);
    return {
      data: [
        { type: 'scatter', mode: 'lines', name: 'Precision', x: thresh, y: prec, line: { color: COLORS.indigo, width: 2.5 } },
        { type: 'scatter', mode: 'lines', name: 'Recall',    x: thresh, y: rec,  line: { color: COLORS.amber,  width: 2.5 } },
        { type: 'scatter', mode: 'lines', name: 'F1',        x: thresh, y: f1,   line: { color: COLORS.emerald, width: 2.5 } },
        { type: 'scatter', mode: 'markers', name: 'Best F1', x: [thresh[best]], y: [f1[best]], marker: { color: COLORS.rose, size: 12, symbol: 'star' } },
      ],
      layout: { ...base(), title: { text: params.title ?? 'Precision / Recall / F1 vs Decision Threshold', font: { size: 13 } }, xaxis: { title: 'Threshold', gridcolor: grid, zerolinecolor: grid }, yaxis: { title: 'Score', range: [0,1.05], gridcolor: grid, zerolinecolor: grid } },
    };
  }

  // ── gini_entropy ─────────────────────────────────────────────────────────────
  if (name === 'gini_entropy') {
    const p = range(0.001, 0.999, 0.005);
    const gini = p.map(v => 1 - v**2 - (1-v)**2);
    const entr = p.map(v => -(v*Math.log2(v) + (1-v)*Math.log2(1-v)));
    const scaled = entr.map(v => v / 2); // entropy/2 for same scale
    return {
      data: [
        { type: 'scatter', mode: 'lines', name: 'Gini impurity', x: p, y: gini, line: { color: COLORS.indigo, width: 2.5 } },
        { type: 'scatter', mode: 'lines', name: 'Entropy / 2  (scaled)', x: p, y: scaled, line: { color: COLORS.amber, width: 2, dash: 'dash' } },
      ],
      layout: { ...base(), title: { text: params.title ?? 'Gini Impurity vs Entropy  (binary class)', font: { size: 13 } }, xaxis: { title: 'p (proportion of positive class)', gridcolor: grid, zerolinecolor: grid }, yaxis: { title: 'Impurity', gridcolor: grid, zerolinecolor: grid }, annotations: [{ x: 0.5, y: 0.51, text: 'max at p=0.5 (uniform)', showarrow: false, font: { color: muted, size: 10 } }] },
    };
  }

  // ── feature_importance_bar ───────────────────────────────────────────────────
  if (name === 'feature_importance_bar') {
    const features = params.features ?? ['age', 'income', 'credit_score', 'employment_years', 'debt_ratio', 'num_accounts', 'zip_code', 'random_noise'];
    const values   = params.values   ?? [0.28, 0.22, 0.19, 0.14, 0.09, 0.05, 0.02, 0.01];
    const clrs     = values.map((v: number) => v > 0.1 ? COLORS.indigo : v > 0.05 ? COLORS.amber : COLORS.rose);
    return {
      data: [{ type: 'bar', orientation: 'h', x: [...values].reverse(), y: [...features].reverse(), marker: { color: [...clrs].reverse() } }],
      layout: { ...base({ margin: { t: 48, r: 24, b: 40, l: 130 } }), title: { text: params.title ?? 'Feature Importance (MDI)', font: { size: 13 } }, xaxis: { title: 'Importance', gridcolor: grid, zerolinecolor: grid }, yaxis: { gridcolor: grid } },
    };
  }

  // ── svm_margin ───────────────────────────────────────────────────────────────
  if (name === 'svm_margin') {
    const rng = seedRng(5);
    // Class -1: centred at (-2, 0), class +1 at (2, 0)
    const c0 = gaussCluster(40, -2.5, 0, 0.8, rng);
    const c1 = gaussCluster(40,  2.5, 0, 0.8, rng);
    // Boundary: x=0 (vertical line). Margins at x=-1.5 and x=1.5
    const yRange = range(-3.5, 3.5, 0.5);
    // Support vectors (just a few near the margin)
    const svX = [-1.55, -1.60, 1.52, 1.58];
    const svY = [0.3, -0.5, 0.6, -0.4];
    return {
      data: [
        { type: 'scatter', mode: 'markers', name: 'Class −1', x: c0.x, y: c0.y, marker: { color: COLORS.indigo, size: 7, opacity: 0.7 } },
        { type: 'scatter', mode: 'markers', name: 'Class +1', x: c1.x, y: c1.y, marker: { color: COLORS.amber, size: 7, opacity: 0.7 } },
        { type: 'scatter', mode: 'lines', name: 'Decision boundary', x: Array(yRange.length).fill(0), y: yRange, line: { color: COLORS.emerald, width: 2.5 } },
        { type: 'scatter', mode: 'lines', name: 'Margin (w·x = ±1)', x: Array(yRange.length).fill(-1.5), y: yRange, line: { color: muted, width: 1.5, dash: 'dash' } },
        { type: 'scatter', mode: 'lines', showlegend: false, x: Array(yRange.length).fill(1.5),  y: yRange, line: { color: muted, width: 1.5, dash: 'dash' } },
        { type: 'scatter', mode: 'markers', name: 'Support vectors', x: svX, y: svY, marker: { color: COLORS.rose, size: 13, symbol: 'circle-open', line: { width: 2.5 } } },
      ],
      layout: { ...base(), title: { text: params.title ?? 'SVM — maximum margin & support vectors', font: { size: 13 } }, xaxis: { title: 'x₁', range: [-5,5], gridcolor: grid, zerolinecolor: grid }, yaxis: { title: 'x₂', range: [-4,4], gridcolor: grid, zerolinecolor: grid, scaleanchor: 'x' }, annotations: [{ x: 0.05, y: 3.3, text: 'max margin', showarrow: false, font: { color: muted, size: 10 } }] },
    };
  }

  // ── knn_k_selection ──────────────────────────────────────────────────────────
  if (name === 'knn_k_selection') {
    const ks   = [1,2,3,4,5,6,7,8,9,10,12,15,20,25,30];
    const train = [1.0,0.97,0.95,0.93,0.91,0.895,0.88,0.875,0.87,0.865,0.86,0.855,0.85,0.845,0.84];
    const val   = [0.75,0.80,0.84,0.86,0.88,0.875,0.87,0.865,0.86,0.855,0.85,0.845,0.84,0.835,0.83];
    const best = val.indexOf(Math.max(...val));
    return {
      data: [
        { type: 'scatter', mode: 'lines+markers', name: 'Train', x: ks, y: train, line: { color: COLORS.indigo, width: 2 }, marker: { size: 5 } },
        { type: 'scatter', mode: 'lines+markers', name: 'Validation', x: ks, y: val, line: { color: COLORS.amber, width: 2.5 }, marker: { size: 5 } },
        { type: 'scatter', mode: 'markers', name: `Best K=${ks[best]}`, x: [ks[best]], y: [val[best]], marker: { color: COLORS.rose, size: 12, symbol: 'star' } },
      ],
      layout: { ...base(), title: { text: params.title ?? 'KNN — choosing K via cross-validation', font: { size: 13 } }, xaxis: { title: 'K (number of neighbours)', gridcolor: grid, zerolinecolor: grid }, yaxis: { title: 'Accuracy', range: [0.7, 1.02], gridcolor: grid, zerolinecolor: grid } },
    };
  }

  // ── elbow_method ─────────────────────────────────────────────────────────────
  if (name === 'elbow_method') {
    const ks      = [1,2,3,4,5,6,7,8,9,10];
    const inertia = [3200,1800,950,600,480,430,405,388,378,372];
    return {
      data: [
        { type: 'scatter', mode: 'lines+markers', name: 'Inertia', x: ks, y: inertia, line: { color: COLORS.indigo, width: 2.5 }, marker: { size: 7 } },
        { type: 'scatter', mode: 'markers', name: 'Elbow (k=3)', x: [3], y: [950], marker: { color: COLORS.rose, size: 14, symbol: 'star' } },
      ],
      layout: { ...base(), title: { text: params.title ?? 'Elbow Method — optimal K for K-Means', font: { size: 13 } }, xaxis: { title: 'Number of clusters K', gridcolor: grid, zerolinecolor: grid }, yaxis: { title: 'Inertia (within-cluster SSE)', gridcolor: grid, zerolinecolor: grid }, annotations: [{ x: 3.2, y: 980, text: '← elbow', showarrow: false, font: { color: COLORS.rose, size: 11 } }] },
    };
  }

  // ── log_transform ────────────────────────────────────────────────────────────
  if (name === 'log_transform') {
    const rng = seedRng(9);
    // Log-normal raw data
    const raw = Array.from({ length: 400 }, () => Math.exp(normSample(rng, 2, 0.8)));
    const logged = raw.map(v => Math.log(v));
    // Build histogram bins manually
    function histBins(data: number[], nbins: number): { x: number[], y: number[] } {
      const lo = Math.min(...data), hi = Math.max(...data);
      const w = (hi - lo) / nbins;
      const counts = new Array(nbins).fill(0);
      data.forEach(v => { const b = Math.min(Math.floor((v-lo)/w), nbins-1); counts[b]++; });
      return { x: Array.from({length: nbins}, (_,i) => lo + (i+0.5)*w), y: counts };
    }
    const hRaw = histBins(raw, 30);
    const hLog = histBins(logged, 30);
    return {
      data: [
        { type: 'bar', name: 'Raw (right-skewed)', x: hRaw.x, y: hRaw.y, marker: { color: COLORS.indigo, opacity: 0.75 } },
        { type: 'bar', name: 'log(x) (symmetric)', x: hLog.x, y: hLog.y, marker: { color: COLORS.amber, opacity: 0.75 }, xaxis: 'x2', yaxis: 'y2' },
      ],
      layout: { ...base({ margin: { t: 48, r: 24, b: 60, l: 60 }, grid: { rows: 1, columns: 2, pattern: 'independent' } }), title: { text: params.title ?? 'Log Transform — taming skewed distributions', font: { size: 13 } }, xaxis:  { title: 'Raw value', domain: [0, 0.45], gridcolor: grid, zerolinecolor: grid }, xaxis2: { title: 'log(value)', domain: [0.55, 1], gridcolor: grid, zerolinecolor: grid }, yaxis:  { title: 'Count', gridcolor: grid, zerolinecolor: grid }, yaxis2: { title: 'Count', gridcolor: grid, zerolinecolor: grid } },
    };
  }

  // ── confusion_matrix_heatmap ─────────────────────────────────────────────────
  if (name === 'confusion_matrix_heatmap') {
    const tp = params.tp ?? 85, fn = params.fn ?? 15, fp = params.fp ?? 12, tn = params.tn ?? 188;
    const z    = [[tp, fn], [fp, tn]];
    const text2: string[][] = [[`TP\n${tp}`, `FN\n${fn}`], [`FP\n${fp}`, `TN\n${tn}`]];
    return {
      data: [{
        type: 'heatmap', z, text: text2, texttemplate: '%{text}',
        x: ['Predicted Positive', 'Predicted Negative'],
        y: ['Actually Positive',  'Actually Negative'],
        colorscale: [[0, dark ? '#1a2a1a' : '#f0fdf4'], [1, '#10b981']],
        showscale: false,
        textfont: { size: 14, color: text },
      }],
      layout: { ...base({ margin: { t: 48, r: 24, b: 80, l: 150 } }), title: { text: params.title ?? 'Confusion Matrix', font: { size: 13 } }, xaxis: { gridcolor: 'transparent', zerolinecolor: 'transparent' }, yaxis: { gridcolor: 'transparent', zerolinecolor: 'transparent' } },
    };
  }

  // ── learning_curve ───────────────────────────────────────────────────────────
  if (name === 'learning_curve') {
    const sizes = [50, 100, 200, 400, 700, 1000, 1500, 2000];
    const train = [0.97, 0.96, 0.94, 0.92, 0.91, 0.905, 0.900, 0.898];
    const val   = [0.68, 0.74, 0.80, 0.84, 0.87,  0.88,  0.888, 0.892];
    return {
      data: [
        { type: 'scatter', mode: 'lines+markers', name: 'Training score',   x: sizes, y: train, line: { color: COLORS.indigo, width: 2.5 }, marker: { size: 6 } },
        { type: 'scatter', mode: 'lines+markers', name: 'Validation score', x: sizes, y: val,   line: { color: COLORS.amber,  width: 2.5 }, marker: { size: 6 } },
      ],
      layout: { ...base(), title: { text: params.title ?? 'Learning Curves — more data reduces variance', font: { size: 13 } }, xaxis: { title: 'Training set size', gridcolor: grid, zerolinecolor: grid }, yaxis: { title: 'Score', range: [0.6, 1.0], gridcolor: grid, zerolinecolor: grid }, annotations: [{ x: 400, y: 0.88, text: 'gap = variance (overfitting)', showarrow: false, font: { color: muted, size: 10 } }] },
    };
  }

  // ── forest_convergence ───────────────────────────────────────────────────────
  if (name === 'forest_convergence') {
    const trees = [1,2,3,5,7,10,15,20,30,50,75,100,150,200];
    const single = 0.82;
    const oob = trees.map(n => single + (0.94-single)*(1 - Math.exp(-n/18)) + 0.005*Math.sin(n));
    return {
      data: [
        { type: 'scatter', mode: 'lines+markers', name: 'Random forest OOB accuracy', x: trees, y: oob, line: { color: COLORS.indigo, width: 2.5 }, marker: { size: 5 } },
        { type: 'scatter', mode: 'lines', name: 'Single tree', x: [1, 200], y: [single, single], line: { color: COLORS.rose, width: 1.5, dash: 'dash' } },
      ],
      layout: { ...base(), title: { text: params.title ?? 'Random Forest — accuracy vs number of trees', font: { size: 13 } }, xaxis: { title: 'Number of trees', gridcolor: grid, zerolinecolor: grid }, yaxis: { title: 'OOB Accuracy', range: [0.78, 0.96], gridcolor: grid, zerolinecolor: grid }, annotations: [{ x: 80, y: oob[trees.indexOf(75)]+0.005, text: 'plateaus — adding trees stops helping', showarrow: false, font: { color: muted, size: 10 } }] },
    };
  }

  // ── validation_curve ─────────────────────────────────────────────────────────
  if (name === 'validation_curve') {
    const alphas = [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0, 5.0, 10.0, 50.0];
    const xLog   = alphas.map(Math.log10);
    const train  = [0.96, 0.95, 0.94, 0.91, 0.88, 0.82, 0.78, 0.70, 0.65, 0.58];
    const val    = [0.72, 0.77, 0.82, 0.87, 0.88, 0.84, 0.80, 0.72, 0.67, 0.59];
    const bestI  = val.indexOf(Math.max(...val));
    return {
      data: [
        { type: 'scatter', mode: 'lines+markers', name: 'Train', x: xLog, y: train, line: { color: COLORS.indigo, width: 2.5 }, marker: { size: 5 } },
        { type: 'scatter', mode: 'lines+markers', name: 'Validation', x: xLog, y: val, line: { color: COLORS.amber, width: 2.5 }, marker: { size: 5 } },
        { type: 'scatter', mode: 'markers', name: 'Optimal α', x: [xLog[bestI]], y: [val[bestI]], marker: { color: COLORS.rose, size: 13, symbol: 'star' } },
      ],
      layout: { ...base(), title: { text: params.title ?? 'Validation Curve — hyperparameter α vs accuracy', font: { size: 13 } }, xaxis: { title: 'log₁₀(α)', gridcolor: grid, zerolinecolor: grid }, yaxis: { title: 'Accuracy', range: [0.52, 0.98], gridcolor: grid, zerolinecolor: grid }, annotations: [{ x: xLog[0], y: 0.58, text: 'underfitting →', showarrow: false, font: { color: muted, size: 10 } }, { x: xLog[xLog.length-1]-0.3, y: 0.58, text: '← overfitting', showarrow: false, font: { color: muted, size: 10 } }] },
    };
  }

  // ── gaussian_nb_distributions ────────────────────────────────────────────────
  if (name === 'gaussian_nb_distributions') {
    const x = range(-6, 10, 0.05);
    // Two classes, two features
    const classA_f1 = x.map(v => gaussPdf(v, -1.5, 1.2));
    const classB_f1 = x.map(v => gaussPdf(v,  2.5, 1.0));
    const classA_f2 = x.map(v => gaussPdf(v,  1.0, 1.5));
    const classB_f2 = x.map(v => gaussPdf(v,  5.0, 1.2));
    return {
      data: [
        { type: 'scatter', mode: 'lines', name: 'Class A  (feature 1)', x, y: classA_f1, line: { color: COLORS.indigo, width: 2.5 } },
        { type: 'scatter', mode: 'lines', name: 'Class B  (feature 1)', x, y: classB_f1, line: { color: COLORS.amber, width: 2.5 } },
        { type: 'scatter', mode: 'lines', name: 'Class A  (feature 2)', x, y: classA_f2, line: { color: COLORS.indigo, width: 2, dash: 'dash' } },
        { type: 'scatter', mode: 'lines', name: 'Class B  (feature 2)', x, y: classB_f2, line: { color: COLORS.amber, width: 2, dash: 'dash' } },
      ],
      layout: { ...base(), title: { text: params.title ?? 'Gaussian Naive Bayes — P(xⱼ | class) per feature', font: { size: 13 } }, xaxis: { title: 'Feature value', gridcolor: grid, zerolinecolor: grid }, yaxis: { title: 'Density', gridcolor: grid, zerolinecolor: grid } },
    };
  }

  // ── acf_plot ─────────────────────────────────────────────────────────────────
  if (name === 'acf_plot') {
    const maxLag = 24;
    // AR(2)-like ACF: decays with oscillation for lag > 0
    const rho1 = 0.85, rho2 = -0.35;
    const acf: number[] = [1];
    for (let k = 1; k <= maxLag; k++) {
      const v = rho1**(k) * Math.cos(k * 0.5) * Math.exp(-0.03*k);
      acf.push(parseFloat(v.toFixed(4)));
    }
    const lags = range(0, maxLag);
    const confBand = 1.96 / Math.sqrt(100); // ±1.96/√n
    // Stems: vertical lines from 0 to acf[k]
    const stemX: number[] = [], stemY: number[] = [];
    lags.forEach((l, i) => { stemX.push(l, l, null as any); stemY.push(0, acf[i], null as any); });
    return {
      data: [
        { type: 'scatter', mode: 'lines', x: stemX, y: stemY, line: { color: COLORS.indigo, width: 2 }, showlegend: false },
        { type: 'scatter', mode: 'markers', name: 'ACF(k)', x: lags, y: acf, marker: { color: lags.map((_,i) => Math.abs(acf[i]) > confBand ? COLORS.rose : COLORS.indigo), size: 9 } },
        { type: 'scatter', mode: 'lines', name: '95% CI', x: [-0.5, maxLag+0.5], y: [confBand, confBand], line: { color: muted, width: 1.5, dash: 'dot' } },
        { type: 'scatter', mode: 'lines', showlegend: false, x: [-0.5, maxLag+0.5], y: [-confBand, -confBand], line: { color: muted, width: 1.5, dash: 'dot' } },
        { type: 'scatter', mode: 'lines', showlegend: false, x: [-0.5, maxLag+0.5], y: [0,0], line: { color: muted, width: 1 } },
      ],
      layout: { ...base(), title: { text: params.title ?? 'Autocorrelation Function (ACF)', font: { size: 13 } }, xaxis: { title: 'Lag k', gridcolor: grid, zerolinecolor: grid }, yaxis: { title: 'ACF', range: [-1.1, 1.1], gridcolor: grid, zerolinecolor: grid } },
    };
  }

  // ── anomaly_distribution ─────────────────────────────────────────────────────
  if (name === 'anomaly_distribution') {
    const x = range(-5, 5, 0.04);
    const pdf = x.map(v => gaussPdf(v, 0, 1));
    // Anomaly threshold at z=2.5
    const thresh = 2.5;
    const rng = seedRng(20);
    const anomX = Array.from({ length: 8 }, () => (rng() > 0.5 ? 1 : -1) * (thresh + rng() * 2));
    const anomY = anomX.map(() => gaussPdf(0, 0, 1) * 0.05 * rng());
    return {
      data: [
        { type: 'scatter', mode: 'lines', name: 'Normal distribution', x, y: pdf, line: { color: COLORS.indigo, width: 2.5 }, fill: 'tozeroy', fillcolor: dark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.08)' },
        // Shaded tail regions
        { type: 'scatter', mode: 'lines', name: 'Anomaly zone |z|>2.5', x: x.filter(v => v >= thresh), y: x.filter(v => v >= thresh).map(v => gaussPdf(v, 0, 1)), fill: 'tozeroy', fillcolor: dark ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.2)', line: { width: 0 } },
        { type: 'scatter', mode: 'lines', showlegend: false, x: x.filter(v => v <= -thresh), y: x.filter(v => v <= -thresh).map(v => gaussPdf(v, 0, 1)), fill: 'tozeroy', fillcolor: dark ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.2)', line: { width: 0 } },
        { type: 'scatter', mode: 'markers', name: 'Detected anomalies', x: anomX, y: anomY, marker: { color: COLORS.rose, size: 11, symbol: 'triangle-up' } },
        // threshold lines
        { type: 'scatter', mode: 'lines', showlegend: false, x: [thresh, thresh], y: [0, 0.42], line: { color: COLORS.rose, width: 1.5, dash: 'dash' } },
        { type: 'scatter', mode: 'lines', showlegend: false, x: [-thresh, -thresh], y: [0, 0.42], line: { color: COLORS.rose, width: 1.5, dash: 'dash' } },
      ],
      layout: { ...base(), title: { text: params.title ?? 'Z-Score Anomaly Detection  (threshold |z|=2.5)', font: { size: 13 } }, xaxis: { title: 'Standard deviations from mean (z)', gridcolor: grid, zerolinecolor: grid }, yaxis: { title: 'Density', gridcolor: grid, zerolinecolor: grid }, annotations: [{ x: 0, y: 0.42, text: '99.4% of data is normal', showarrow: false, font: { color: muted, size: 10 } }] },
    };
  }

  // ── class_imbalance_bar ──────────────────────────────────────────────────────
  if (name === 'class_imbalance_bar') {
    const ratio = params.ratio ?? 20; // majority:minority
    const total = 1000;
    const minority = Math.round(total / (ratio + 1));
    const majority = total - minority;
    return {
      data: [{
        type: 'bar',
        x: ['Majority class (negative)', 'Minority class (positive)'],
        y: [majority, minority],
        marker: { color: [COLORS.indigo, COLORS.rose] },
        text: [`${majority} (${(majority/total*100).toFixed(0)}%)`, `${minority} (${(minority/total*100).toFixed(0)}%)`],
        textposition: 'auto',
      }],
      layout: { ...base(), title: { text: params.title ?? `Class Imbalance  (${ratio}:1 ratio)`, font: { size: 13 } }, xaxis: { gridcolor: grid, zerolinecolor: grid }, yaxis: { title: 'Count', gridcolor: grid, zerolinecolor: grid }, annotations: [{ x: 0.5, y: majority * 0.5, text: `A model that always predicts "majority" gets ${(majority/total*100).toFixed(0)}% accuracy`, showarrow: false, font: { color: '#fff', size: 10 } }] },
    };
  }

  // ── threshold_pr_f1 ───────────────────────────────────────────────────────────
  if (name === 'threshold_pr_f1') {
    // Alias – delegates to precision_recall_threshold
    return recipes('precision_recall_threshold', params, dark);
  }

  return null;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function PlotlyInitializer({ html }: { html: string }) {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const charts = document.querySelectorAll<HTMLElement>('.plotly-chart');
    if (!charts.length) return;
    const dark = resolvedTheme === 'dark';

    import('plotly.js-dist-min').then((Plotly: any) => {
      charts.forEach((el) => {
        const script = el.querySelector<HTMLScriptElement>('script[type="application/json"]');
        if (!script) return;
        try {
          const cfg = JSON.parse(script.textContent ?? '{}');
          const plotData = cfg.recipe ? recipes(cfg.recipe, cfg, dark) : cfg;
          if (!plotData) return;
          Plotly.react(el, plotData.data, plotData.layout ?? {}, {
            responsive: true, displayModeBar: true, displaylogo: false,
            modeBarButtonsToRemove: ['toImage', 'sendDataToCloud'],
            ...cfg.config,
          });
        } catch (e) { console.error('Plotly:', e); }
      });
    });
  }, [html, resolvedTheme]);

  return null;
}
