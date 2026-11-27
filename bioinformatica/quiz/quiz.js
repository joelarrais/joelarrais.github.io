/* Bioinformática · Treino de escolha múltipla
 *
 * Talks to a Google Apps Script web app (actions: ping, stats, get_block,
 * check_one, submit_block, flag_question). Server data: question bank, XP,
 * Phred level, chapter stats and class ranking. Kept on this device only
 * (localStorage): pseudonym, recently seen questions, theme, best score,
 * days in a row and achievements.
 */
"use strict";

// =========================================================================
// CONFIGURATION: Google Apps Script web app URL
// =========================================================================
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyYlzNrDjnYpspI3CHS4Fw1Z9Vo2huO_dnYy7XE99NSDn8vNVRnsrkwMjp1QUis0W_51A/exec";

const GA_ID = "G-W9XHCK0310";               // same Google Analytics property as the personal page
const CONSENT_KEY = "analytics-consent";    // same key: one answer covers the whole site
const BLOCK_SECONDS = 600;                  // 10-minute timer
const FAST_SECONDS = 300;                   // "Sequenciação rápida" achievement
const REQUEST_TIMEOUT_MS = 20000;

const IS_DEMO = !APPS_SCRIPT_URL || APPS_SCRIPT_URL.indexOf("https://script.google.com/") !== 0;

const CHAPTERS = ["CAP1", "CAP2", "CAP3", "CAP5"];
const CAP_LABELS = {
  CAP1: "CAP1 · Fundamentos e ML",
  CAP2: "CAP2 · Genómica",
  CAP3: "CAP3 · Multi-Ómica",
  CAP5: "CAP5 · Fármacos"
};
const LETTERS = ["A", "B", "C", "D", "E", "F"];

const DEMO_QUESTIONS = [
  {
    id: "DEMO_01", cap: "CAP1", subtema: "Primer de ML",
    stem: "Normalizar a matriz de expressão e selecionar genes antes de dividir em treino e teste produz que problema?",
    options: [
      "Nenhum, desde que a normalização não use as etiquetas.",
      "Sobreajuste do modelo final, corrigível com regularização.",
      "Fuga de informação: o pré-processamento viu o conjunto de teste, tornando o desempenho otimista.",
      "Desequilíbrio de classes entre as partições."
    ],
    _demoKey: 2,
    _demoExp: "O pré-processamento e a seleção de variáveis têm de ser ajustados apenas dentro do treino para não haver data leakage."
  },
  {
    id: "DEMO_02", cap: "CAP2", subtema: "Do sequenciador ao VCF",
    stem: "Num ficheiro FASTQ, uma base tem qualidade Phred Q30. Qual é a probabilidade aproximada de erro nessa base?",
    options: ["1 em 30", "1 em 100", "1 em 1 000", "1 em 10 000"],
    _demoKey: 2,
    _demoExp: "Q = −10 log₁₀(P), logo Q30 equivale a P = 10⁻³ (1 em 1 000)."
  },
  {
    id: "DEMO_03", cap: "CAP3", subtema: "RNA-seq bulk",
    stem: "Que unidade deve ser usada como entrada de um teste de expressão diferencial no DESeq2?",
    options: [
      "Contagens transformadas por VST.",
      "TPM, por corrigir comprimento e profundidade.",
      "CPM, por corrigir a profundidade.",
      "Contagens brutas inteiras, para o modelo estimar corretamente a variância."
    ],
    _demoKey: 3,
    _demoExp: "O modelo binomial negativo do DESeq2 exige contagens brutas inteiras."
  },
  {
    id: "DEMO_04", cap: "CAP5", subtema: "Descoberta de hits",
    stem: "A regra dos cinco de Lipinski prevê:",
    options: [
      "A afinidade de ligação de uma molécula ao seu alvo.",
      "A probabilidade de absorção oral, e não a atividade sobre o alvo.",
      "A toxicidade hepática de uma molécula.",
      "A facilidade de síntese química."
    ],
    _demoKey: 1,
    _demoExp: "Lipinski avalia permeabilidade/absorção oral; não mede nem prevê afinidade pelo alvo."
  }
];

// Small line icons (24x24, stroke)
const ICONS = {
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  flame: '<path d="M12 3c2 3.5 5 5.6 5 10a5 5 0 0 1-10 0c0-2.4 1.1-4 2.4-5.2.2 1.8 1 2.9 2.3 3.4C11 8.8 11.4 6 12 3z"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>',
  dna: '<path d="M7 3c0 5 10 5 10 9s-10 4-10 9"/><path d="M17 3c0 5-10 5-10 9s10 4 10 9"/><path d="M8.5 6.5h7M8.5 17.5h7"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  award: '<circle cx="12" cy="9" r="6"/><path d="M8.5 14L7 22l5-3 5 3-1.5-8"/>',
  flag: '<path d="M5 21V4"/><path d="M5 4h12l-2 4 2 4H5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  auto: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 21h8M9 17h6"/>',
  up: '<path d="M12 19V5M5 12l7-7 7 7"/>'
};

// Achievements: unlocked on this device, per pseudonym
const ACHIEVEMENTS = [
  { id: "first", icon: "check", title: "Primeira leitura", desc: "Completa o primeiro bloco." },
  { id: "cov10", icon: "layers", title: "Cobertura 10×", desc: "Completa 10 blocos." },
  { id: "perfect", icon: "star", title: "Alinhamento perfeito", desc: "Faz 10/10 num bloco." },
  { id: "nogaps", icon: "target", title: "Sem gaps", desc: "Responde a todas as perguntas de um bloco, com pelo menos 8 certas." },
  { id: "pcr", icon: "flame", title: "Amplificação PCR", desc: "Acerta 5 seguidas no modo estudo." },
  { id: "fast", icon: "bolt", title: "Sequenciação rápida", desc: "Termina um bloco do modo frequência em menos de 5 minutos, com nota ≥ 7." },
  { id: "omics", icon: "dna", title: "Multi-ómica", desc: "75% de acerto nos quatro capítulos (mín. 5 respostas em cada)." },
  { id: "daily3", icon: "calendar", title: "Replicação diária", desc: "Treina em 3 dias seguidos." },
  { id: "q30", icon: "award", title: "Qualidade Q30", desc: "Alcança o nível Phred Q30." },
  { id: "reviewer", icon: "flag", title: "Revisão por pares", desc: "Sinaliza uma pergunta pouco clara." }
];

// =========================================================================
// Helpers
// =========================================================================

const $ = (id) => document.getElementById(id);

const store = {
  get(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* storage blocked */ }
  },
  getJSON(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value === null || value === undefined ? fallback : value;
    } catch (e) { return fallback; }
  },
  setJSON(key, value) { this.set(key, JSON.stringify(value)); }
};

function escapeHtml(s) {
  return String(s === null || s === undefined ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function fmt1(n) {
  return Number(n || 0).toFixed(1).replace(".", ",");
}

function icon(name, cls = "icon") {
  return `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ""}</svg>`;
}

function dayString(date) {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

function yesterdayString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dayString(d);
}

function levelNumber(code) {
  const n = parseInt(String(code || "").replace(/\D/g, ""), 10);
  return Number.isNaN(n) ? 0 : n;
}

function levelClass(code) {
  const n = levelNumber(code);
  return n >= 40 ? "q40" : n >= 30 ? "q30" : "";
}

function pluralize(n, one, many) {
  return `${n} ${n === 1 ? one : many}`;
}

// =========================================================================
// State
// =========================================================================

const storedSeen = store.getJSON("bioinf_seen", []);

const state = {
  mode: store.get("bioinf_mode") === "estudo" ? "estudo" : "frequencia",
  pseudonym: store.get("bioinf_pseudo") || "",
  seenIds: Array.isArray(storedSeen) ? storedSeen : [],
  blockToken: null,
  questions: [],
  answers: {},        // { qId: optionIndex | null (left blank) }
  marked: {},         // { qId: true } set aside to review (frequência)
  studyChecked: {},   // { qId: { correct, correctIdx, explicacao } }
  currentIdx: 0,
  streak: 0,
  bestStreakInBlock: 0,
  startedAt: 0,
  endsAt: 0,
  timerHandle: null,
  timerOn: false,
  inBlock: false,
  busy: false,
  flagTarget: null,
  user: null,          // last stats received for this pseudonym
  levelBefore: null,
  lastResult: null,
  reviewFilter: "todas",
  confirmAction: null
};

// =========================================================================
// Local progress (this device, per pseudonym)
// =========================================================================

function progressKey() {
  return "bioinf_progress:" + (state.pseudonym || "").toLowerCase();
}

function loadProgress() {
  const p = store.getJSON(progressKey(), {});
  return {
    bestScore: typeof p.bestScore === "number" ? p.bestScore : null,
    bestStreak: p.bestStreak || 0,
    lastDay: p.lastDay || null,
    dayStreak: p.dayStreak || 0,
    achievements: p.achievements && typeof p.achievements === "object" ? p.achievements : {}
  };
}

function saveProgress(p) {
  store.setJSON(progressKey(), p);
}

function registerPracticeDay(p) {
  const today = dayString(new Date());
  if (p.lastDay === today) return;
  p.dayStreak = p.lastDay === yesterdayString() ? p.dayStreak + 1 : 1;
  p.lastDay = today;
}

// days in a row still counts if the last practice was today or yesterday
function liveDayStreak(p) {
  if (!p.lastDay) return 0;
  return p.lastDay === dayString(new Date()) || p.lastDay === yesterdayString() ? p.dayStreak : 0;
}

function unlock(p, id, newly) {
  if (!p.achievements[id]) {
    p.achievements[id] = dayString(new Date());
    newly.push(id);
  }
}

function checkStatAchievements(p, user, newly) {
  if (!user) return;
  if (user.blocks >= 1) unlock(p, "first", newly);
  if (user.blocks >= 10) unlock(p, "cov10", newly);
  if (levelNumber(user.phred && user.phred.code) >= 30) unlock(p, "q30", newly);
  const ch = user.chapters || {};
  if (CHAPTERS.every((c) => ch[c] && ch[c].t >= 5 && ch[c].c / ch[c].t >= 0.75)) unlock(p, "omics", newly);
  if (liveDayStreak(p) >= 3) unlock(p, "daily3", newly);
}

function achievementTitle(id) {
  const a = ACHIEVEMENTS.find((x) => x.id === id);
  return a ? a.title : id;
}

// =========================================================================
// Google Analytics (loaded only after the visitor accepts)
// =========================================================================

window.dataLayer = window.dataLayer || [];
function gtag() { window.dataLayer.push(arguments); }

function loadAnalytics() {
  if (window.__gaLoaded) return;
  window.__gaLoaded = true;
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);
  gtag("js", new Date());
  gtag("config", GA_ID);
}

// anonymous usage events (mode, score); never the pseudonym
function track(name, params) {
  if (store.get(CONSENT_KEY) === "yes") gtag("event", name, params || {});
}

function setupConsent() {
  const consent = store.get(CONSENT_KEY);
  const banner = $("consent");
  if (consent === "yes") {
    loadAnalytics();
    return;
  }
  if (consent) return;
  const answer = (value) => {
    store.set(CONSENT_KEY, value);
    banner.hidden = true;
    if (value === "yes") loadAnalytics();
  };
  $("consent-yes").addEventListener("click", () => answer("yes"));
  $("consent-no").addEventListener("click", () => answer("no"));
  banner.hidden = false;
}

// =========================================================================
// Theme: automatic (system) → light → dark
// =========================================================================

const THEMES = {
  auto: { next: "light", icon: "auto", label: "automático" },
  light: { next: "dark", icon: "sun", label: "claro" },
  dark: { next: "auto", icon: "moon", label: "escuro" }
};

function applyTheme(theme) {
  const t = THEMES[theme] ? theme : "auto";
  if (t === "auto") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = t;
  const btn = $("btnTheme");
  btn.innerHTML = icon(THEMES[t].icon);
  btn.setAttribute("aria-label", `Tema: ${THEMES[t].label}. Mudar tema`);
  btn.title = `Tema: ${THEMES[t].label}`;
  btn.dataset.theme = t;
}

// =========================================================================
// Server
// =========================================================================

async function fetchWithTimeout(url, options = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } catch (err) {
    if (err.name === "AbortError") throw new Error("o servidor demorou demasiado a responder");
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function apiGet(params) {
  const resp = await fetchWithTimeout(APPS_SCRIPT_URL + "?" + new URLSearchParams(params));
  if (!resp.ok) throw new Error("Erro HTTP " + resp.status);
  return resp.json();
}

async function apiPost(payload) {
  const resp = await fetchWithTimeout(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  });
  if (!resp.ok) throw new Error("Erro HTTP " + resp.status);
  return resp.json();
}

async function checkServerPing() {
  try {
    const data = await apiGet({ action: "ping" });
    if (data.ok && data.counts) {
      const c = data.counts;
      $("bankStatusMsg").textContent =
        `Ligado ao banco: ${c.total} perguntas ativas (CAP1: ${c.CAP1}, CAP2: ${c.CAP2}, CAP3: ${c.CAP3}, CAP5: ${c.CAP5})`;
    }
  } catch (err) {
    $("bankStatusMsg").textContent = "Não foi possível contactar o servidor Google Sheets.";
  }
}

async function refreshStats() {
  if (IS_DEMO) { renderDemoStats(); return; }
  const btn = $("btnRefresh");
  btn.disabled = true;
  try {
    const data = await apiGet({ action: "stats", pseudonym: state.pseudonym || "" });
    if (data.ok) renderStats(data);
  } catch (err) {
    $("leaderboardWrap").innerHTML = '<p class="muted">Ainda sem ligação ao ranking. Verifica o URL do Apps Script.</p>';
  } finally {
    btn.disabled = false;
  }
}

// =========================================================================
// Home: progress, achievements, ranking
// =========================================================================

function updateHeaderPseudo() {
  $("hdrPseudo").textContent = state.pseudonym || "Sem pseudónimo";
}

function renderDemoStats() {
  renderStats({
    user: {
      pseudonym: state.pseudonym || "Visitante",
      blocks: 0, xp: 0, avgScore: 0,
      phred: { code: "Q10", label: "Basecalling Inicial", nextXp: 200 },
      chapters: { CAP1: { c: 0, t: 0 }, CAP2: { c: 0, t: 0 }, CAP3: { c: 0, t: 0 }, CAP5: { c: 0, t: 0 } }
    },
    leaderboard: []
  }, { silent: true });
}

function renderStats(data, opts = {}) {
  const u = data.user || {};
  state.user = u;

  $("stBlocks").textContent = u.blocks || 0;
  $("stAvg").textContent = fmt1(u.avgScore);
  $("stXp").textContent = u.xp || 0;

  // Phred level
  const ph = u.phred || { code: "Q10", label: "Basecalling Inicial", nextXp: 200 };
  const pill = $("hdrPhred");
  pill.textContent = `${ph.code} · ${ph.label}`;
  pill.className = "level-pill " + levelClass(ph.code);
  const code = $("levelCode");
  code.textContent = ph.code;
  code.className = "level-code " + levelClass(ph.code);
  $("levelLabel").textContent = ph.label;
  $("levelNext").textContent = ph.nextXp ? `${u.xp || 0} / ${ph.nextXp} XP` : "Nível máximo atingido!";
  const pct = ph.nextXp ? Math.min(100, Math.round(((u.xp || 0) / ph.nextXp) * 100)) : 100;
  $("levelBar").style.width = pct + "%";

  // chapter mastery
  let weakest = null;
  let weakestPct = 101;
  $("capMasteryContainer").innerHTML = CHAPTERS.map((cap) => {
    const s = (u.chapters && u.chapters[cap]) || { c: 0, t: 0 };
    const p = s.t > 0 ? Math.round((s.c / s.t) * 100) : 0;
    if (s.t >= 3 && p < weakestPct) { weakestPct = p; weakest = cap; }
    const cls = s.t === 0 ? "" : p < 55 ? "weak" : p >= 75 ? "good" : "";
    return `
      <div class="cap-bar">
        <div class="cap-bar-head">
          <span>${CAP_LABELS[cap]}</span>
          <span class="muted">${s.t > 0 ? `${p}% (${s.c}/${s.t})` : "Sem dados"}</span>
        </div>
        <div class="track"><div class="fill ${cls}" style="width:${p}%"></div></div>
      </div>`;
  }).join("");

  $("weakestHint").textContent = weakest
    ? `Sugestão de revisão: dá atenção especial a ${CAP_LABELS[weakest]} (${weakestPct}% de acerto).`
    : "Completa o teu primeiro bloco para veres o diagnóstico por capítulo.";

  renderLeaderboard(data.leaderboard);

  // achievements that depend on the server stats
  if (state.pseudonym) {
    const p = loadProgress();
    const newly = [];
    checkStatAchievements(p, u, newly);
    if (newly.length) {
      saveProgress(p);
      if (!opts.silent) {
        showToast(newly.length === 1
          ? `Nova conquista: ${achievementTitle(newly[0])}`
          : `${newly.length} novas conquistas desbloqueadas!`);
      }
    }
  }
  renderLocalProgress();
}

function renderLeaderboard(rows) {
  const wrap = $("leaderboardWrap");
  if (!rows || rows.length === 0) {
    wrap.innerHTML = '<p class="muted">Ainda não há blocos registados. Sê o primeiro a entrar no ranking!</p>';
    return;
  }
  const me = (state.pseudonym || "").toLowerCase();
  const body = rows.map((row, i) => {
    const isMe = me && String(row.pseudonym).toLowerCase() === me;
    const rank = i + 1;
    return `<tr class="${isMe ? "me" : ""}">
      <td><span class="rank ${rank <= 3 ? "r" + rank : ""}">${rank}</span></td>
      <td>${escapeHtml(row.pseudonym)}${isMe ? ' <span class="muted">(tu)</span>' : ""}</td>
      <td><span class="level-pill ${levelClass(row.phred && row.phred.code)}">${escapeHtml(row.phred && row.phred.code)}</span></td>
      <td class="num">${escapeHtml(row.xp)}</td>
      <td class="num">${fmt1(row.avgScore)}</td>
      <td class="num">${escapeHtml(row.blocks)}</td>
    </tr>`;
  }).join("");
  wrap.innerHTML = `<table class="lb">
    <thead><tr><th>#</th><th>Pseudónimo</th><th>Nível</th><th class="num">XP</th><th class="num">Média</th><th class="num">Blocos</th></tr></thead>
    <tbody>${body}</tbody></table>`;
}

function achievementCard(a, unlockedOn) {
  const title = unlockedOn ? `Desbloqueada em ${unlockedOn}` : "Por desbloquear";
  return `<div class="ach ${unlockedOn ? "unlocked" : "locked"}" title="${escapeHtml(title)}">
    <span class="ach-icon">${icon(a.icon)}</span>
    <span><strong>${escapeHtml(a.title)}</strong><span>${escapeHtml(a.desc)}</span></span>
  </div>`;
}

function renderLocalProgress() {
  const p = loadProgress();
  $("stBest").textContent = p.bestScore === null ? "–" : fmt1(p.bestScore);

  const days = liveDayStreak(p);
  const chip = $("dayStreak");
  chip.hidden = days < 2;
  chip.innerHTML = `${icon("flame")} ${days} dias seguidos`;

  const unlocked = ACHIEVEMENTS.filter((a) => p.achievements[a.id]).length;
  $("achCount").textContent = `${unlocked} / ${ACHIEVEMENTS.length}`;
  $("achievementsGrid").innerHTML = ACHIEVEMENTS.map((a) => achievementCard(a, p.achievements[a.id])).join("");
}

// =========================================================================
// Block: start, questions, timer
// =========================================================================

function showView(id) {
  ["viewHome", "viewQuiz", "viewResults"].forEach((v) => { $(v).hidden = v !== id; });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function selectedMode() {
  const checked = document.querySelector('input[name="mode"]:checked');
  return checked ? checked.value : "frequencia";
}

function onModeChange() {
  state.mode = selectedMode();
  store.set("bioinf_mode", state.mode);
  $("timerOptRow").hidden = state.mode !== "frequencia";
}

async function startBlock() {
  const pseudo = $("inputPseudo").value.trim();
  if (!pseudo) {
    showView("viewHome");
    showToast("Escolhe primeiro um pseudónimo para começar.");
    $("inputPseudo").focus();
    return;
  }
  if (state.busy) return;
  state.pseudonym = pseudo;
  store.set("bioinf_pseudo", pseudo);
  updateHeaderPseudo();
  state.mode = selectedMode();

  const btns = [$("btnStart"), $("btnAgain")];
  btns.forEach((b) => { b.disabled = true; });
  const startLabel = $("btnStart").textContent;
  $("btnStart").textContent = "A preparar bloco aleatório…";
  state.busy = true;

  try {
    let blockData;
    if (IS_DEMO) {
      blockData = {
        ok: true,
        blockToken: "DEMO_" + Date.now(),
        mode: state.mode,
        questions: DEMO_QUESTIONS.map((q) => ({ ...q }))
      };
    } else {
      blockData = await apiPost({
        action: "get_block",
        pseudonym: state.pseudonym,
        mode: state.mode,
        seenIds: state.seenIds
      });
    }

    if (!blockData.ok || !Array.isArray(blockData.questions) || blockData.questions.length === 0) {
      showToast(blockData.error || "Erro ao obter perguntas.");
      return;
    }

    state.blockToken = blockData.blockToken;
    state.questions = blockData.questions;
    state.answers = {};
    state.marked = {};
    state.studyChecked = {};
    state.currentIdx = 0;
    state.streak = 0;
    state.bestStreakInBlock = 0;
    state.startedAt = Date.now();
    state.levelBefore = state.user && state.user.phred ? state.user.phred.code : null;
    state.inBlock = true;

    // remember seen questions to reduce repeats
    const newIds = state.questions.map((q) => q.id);
    state.seenIds = Array.from(new Set(state.seenIds.concat(newIds))).slice(-180);
    store.setJSON("bioinf_seen", state.seenIds);

    showView("viewQuiz");
    setupTimer();
    renderQuestion();
    track("quiz_block_start", { mode: state.mode });
  } catch (err) {
    showToast("Falha na ligação ao servidor: " + err.message);
  } finally {
    state.busy = false;
    btns.forEach((b) => { b.disabled = false; });
    $("btnStart").textContent = startLabel;
  }
}

// timer counts down to a fixed end time, so it stays right in background tabs
function setupTimer() {
  clearInterval(state.timerHandle);
  const badge = $("timerBadge");
  state.timerOn = state.mode === "frequencia" && $("chkTimer").checked;
  store.set("bioinf_timer", $("chkTimer").checked ? "on" : "off");
  if (!state.timerOn) {
    badge.hidden = true;
    return;
  }
  state.endsAt = Date.now() + BLOCK_SECONDS * 1000;
  badge.hidden = false;
  updateTimerLabel();
  state.timerHandle = setInterval(() => {
    const left = updateTimerLabel();
    if (left <= 0) {
      clearInterval(state.timerHandle);
      showToast("Tempo esgotado! A submeter o bloco…");
      closeModals();
      finishBlock();
    }
  }, 500);
}

function updateTimerLabel() {
  const left = Math.max(0, Math.ceil((state.endsAt - Date.now()) / 1000));
  const badge = $("timerBadge");
  badge.textContent = `${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`;
  badge.classList.toggle("is-low", left <= 60);
  badge.setAttribute("aria-label", `Tempo restante: ${Math.floor(left / 60)} min ${left % 60} s`);
  return left;
}

function currentQuestion() {
  return state.questions[state.currentIdx];
}

function isFreq() {
  return state.mode === "frequencia";
}

function renderQuestion() {
  const q = currentQuestion();
  if (!q) return;
  const total = state.questions.length;
  const idx = state.currentIdx;
  const sel = state.answers[q.id];
  const checked = state.studyChecked[q.id];

  $("qCounter").textContent = `Pergunta ${idx + 1} / ${total}`;
  const capBadge = $("qCapBadge");
  capBadge.textContent = q.cap;
  capBadge.title = CAP_LABELS[q.cap] || q.cap;
  $("qSubtemaBadge").textContent = q.subtema || "";
  $("qSubtemaBadge").hidden = !q.subtema;
  $("quizProgress").style.width = `${Math.round(((idx + 1) / total) * 100)}%`;
  $("qStem").textContent = q.stem;

  // streak (study mode)
  const sb = $("streakBadge");
  sb.hidden = isFreq();
  sb.innerHTML = `${icon("flame")} Sequência: ${state.streak}`;

  // question navigator (frequência mode)
  const dots = $("qDots");
  dots.hidden = !isFreq();
  if (isFreq()) {
    dots.innerHTML = state.questions.map((item, i) => {
      const a = state.answers[item.id];
      const answered = a !== undefined && a !== null;
      const blank = a === null;
      const marked = !!state.marked[item.id];
      const status = answered ? "respondida" : blank ? "em branco" : "por responder";
      const cls = ["q-dot", i === idx ? "active" : "", answered ? "answered" : "", blank ? "blank" : "", marked ? "marked" : ""].join(" ");
      return `<button type="button" class="${cls}" data-goto="${i}" aria-label="Pergunta ${i + 1}, ${status}${marked ? ", marcada para rever" : ""}"${i === idx ? ' aria-current="step"' : ""}>${i + 1}</button>`;
    }).join("");
  }

  // options
  $("optionsContainer").innerHTML = q.options.map((text, i) => {
    let cls = "opt-btn";
    if (checked) {
      if (i === checked.correctIdx) cls += " correct";
      else if (i === sel && !checked.correct) cls += " wrong";
    } else if (sel === i) {
      cls += " selected";
    }
    return `<button type="button" class="${cls}" data-opt="${i}" aria-pressed="${sel === i}"${checked ? " disabled" : ""}>
      <span class="opt-letter">${LETTERS[i]}</span><span>${escapeHtml(text)}</span>
    </button>`;
  }).join("");

  // study feedback
  const fb = $("studyFeedback");
  if (!isFreq() && checked) {
    fb.hidden = false;
    fb.className = "feedback-box " + (checked.correct ? "ok" : "err");
    fb.innerHTML = `<strong>${checked.correct ? "Correto! (+1)" : "Incorreto (−0,2)"}</strong>${escapeHtml(checked.explicacao || "")}`;
  } else {
    fb.hidden = true;
  }

  // buttons
  $("btnBlank").hidden = !isFreq();
  const mark = $("btnMark");
  mark.hidden = !isFreq();
  mark.textContent = state.marked[q.id] ? "Desmarcar revisão" : "Marcar para rever";
  mark.classList.toggle("is-on", !!state.marked[q.id]);
  mark.setAttribute("aria-pressed", String(!!state.marked[q.id]));
  $("btnPrev").hidden = !isFreq() || idx === 0;

  const next = $("btnNext");
  if (!isFreq()) {
    if (!checked) {
      next.textContent = "Verificar resposta";
      next.disabled = sel === undefined || sel === null;
    } else {
      next.disabled = false;
      next.textContent = idx === total - 1 ? "Ver resumo e guardar" : "Próxima pergunta";
    }
  } else {
    next.disabled = false;
    next.textContent = idx === total - 1 ? "Submeter bloco" : "Seguinte";
  }
}

function goTo(i) {
  if (i < 0 || i >= state.questions.length || i === state.currentIdx) return;
  state.currentIdx = i;
  renderQuestion();
  keepQuestionInView();
}

// after moving between questions, bring the top of the question back into view
function keepQuestionInView() {
  const card = document.querySelector(".quiz-card");
  const top = card.getBoundingClientRect().top;
  if (top < 70) window.scrollTo({ top: window.scrollY + top - 80, behavior: "smooth" });
}

function chooseOption(i) {
  const q = currentQuestion();
  if (!q || i >= q.options.length) return;
  if (!isFreq() && state.studyChecked[q.id]) return;
  state.answers[q.id] = i;
  renderQuestion();
}

function leaveBlank() {
  const q = currentQuestion();
  state.answers[q.id] = null;
  if (state.currentIdx < state.questions.length - 1) goTo(state.currentIdx + 1);
  else renderQuestion();
}

function toggleMark() {
  const q = currentQuestion();
  if (state.marked[q.id]) delete state.marked[q.id];
  else state.marked[q.id] = true;
  renderQuestion();
}

async function nextAction() {
  if (state.busy) return;
  const q = currentQuestion();
  const isLast = state.currentIdx === state.questions.length - 1;

  if (!isFreq()) {
    if (!state.studyChecked[q.id]) {
      const sel = state.answers[q.id];
      if (sel === undefined || sel === null) return;
      await verifyStudyQuestion(q, sel);
      return;
    }
    if (isLast) await finishBlock();
    else goTo(state.currentIdx + 1);
    return;
  }

  if (isLast) confirmSubmit();
  else goTo(state.currentIdx + 1);
}

// frequência: before submitting, warn about unanswered and marked questions
function confirmSubmit() {
  const unanswered = state.questions.filter((q) => state.answers[q.id] === undefined).length;
  const marked = state.questions.filter((q) => state.marked[q.id]).length;
  if (unanswered === 0 && marked === 0) {
    finishBlock();
    return;
  }
  const parts = [];
  if (unanswered) parts.push(`${pluralize(unanswered, "pergunta por responder", "perguntas por responder")} (conta${unanswered === 1 ? "" : "m"} como em branco)`);
  if (marked) parts.push(pluralize(marked, "pergunta marcada para rever", "perguntas marcadas para rever"));
  askConfirm({
    title: "Submeter o bloco?",
    text: `Tens ${parts.join(" e ")}.`,
    ok: "Submeter",
    onOk: () => finishBlock()
  });
}

async function verifyStudyQuestion(q, selectedIdx) {
  const btn = $("btnNext");
  btn.disabled = true;
  btn.textContent = "A verificar…";
  state.busy = true;
  try {
    let res;
    if (IS_DEMO) {
      res = { ok: true, correct: selectedIdx === q._demoKey, correctIdx: q._demoKey, explicacao: q._demoExp };
    } else {
      res = await apiPost({ action: "check_one", blockToken: state.blockToken, qId: q.id, selectedIdx });
    }
    if (!res.ok) {
      showToast(res.error || "Erro ao verificar resposta.");
      return;
    }
    state.studyChecked[q.id] = res;
    state.streak = res.correct ? state.streak + 1 : 0;
    state.bestStreakInBlock = Math.max(state.bestStreakInBlock, state.streak);
    if (state.streak === 5) showToast("Sequência de 5! Amplificação em curso.");
  } catch (err) {
    showToast("Erro de rede: " + err.message);
  } finally {
    state.busy = false;
    renderQuestion();
  }
}

async function finishBlock() {
  if (state.busy || !state.inBlock) return;
  state.busy = true;
  clearInterval(state.timerHandle);
  const elapsedSec = Math.round((Date.now() - state.startedAt) / 1000);
  const btn = $("btnNext");
  btn.disabled = true;
  btn.textContent = "A corrigir e guardar…";

  try {
    let res;
    if (IS_DEMO) {
      res = gradeDemoLocally();
    } else {
      res = await apiPost({
        action: "submit_block",
        blockToken: state.blockToken,
        answers: state.answers,
        elapsedSec
      });
    }
    if (!res.ok) {
      showToast(res.error || "Erro ao submeter bloco.");
      return;
    }
    state.inBlock = false;
    const outcome = applyGamification(res, elapsedSec);
    state.lastResult = { res, elapsedSec, outcome };
    renderResults(res, elapsedSec, outcome);
    if (res.stats) renderStats(res.stats, { silent: true });
    else renderLocalProgress();
    showView("viewResults");
    celebrate(res, outcome);
    track("quiz_block_complete", { mode: state.mode, score: Number(res.score) });
  } catch (err) {
    showToast("Falha ao submeter: " + err.message + ". Tenta de novo.");
  } finally {
    state.busy = false;
    if (state.inBlock) renderQuestion();
  }
}

function gradeDemoLocally() {
  let certas = 0, erradas = 0, branco = 0;
  const capStats = { CAP1: { c: 0, t: 0 }, CAP2: { c: 0, t: 0 }, CAP3: { c: 0, t: 0 }, CAP5: { c: 0, t: 0 } };
  const review = {};
  state.questions.forEach((q) => {
    capStats[q.cap].t++;
    const sel = state.answers[q.id];
    let status = "branco";
    if (sel === undefined || sel === null) branco++;
    else if (sel === q._demoKey) { certas++; status = "certa"; capStats[q.cap].c++; }
    else { erradas++; status = "errada"; }
    review[q.id] = {
      status, selectedIdx: sel === undefined ? null : sel, correctIdx: q._demoKey,
      explicacao: q._demoExp, cap: q.cap, subtema: q.subtema
    };
  });
  const score = Math.max(0, Math.round((certas - erradas * 0.2) * 100) / 100);
  return { ok: true, score, certas, erradas, branco, capStats, review };
}

// =========================================================================
// Gamification after a block
// =========================================================================

function applyGamification(res, elapsedSec) {
  const p = loadProgress();
  const newly = [];
  const total = state.questions.length;
  const score = Number(res.score) || 0;

  registerPracticeDay(p);
  const previousBest = p.bestScore;
  const isRecord = previousBest !== null && score > previousBest;
  p.bestScore = previousBest === null ? score : Math.max(previousBest, score);
  p.bestStreak = Math.max(p.bestStreak, state.bestStreakInBlock);

  unlock(p, "first", newly);
  if (res.certas === total && total > 0) unlock(p, "perfect", newly);
  if (res.branco === 0 && res.certas >= 8) unlock(p, "nogaps", newly);
  if (state.bestStreakInBlock >= 5) unlock(p, "pcr", newly);
  if (isFreq() && elapsedSec < FAST_SECONDS && score >= 7) unlock(p, "fast", newly);
  checkStatAchievements(p, res.stats && res.stats.user, newly);
  if (liveDayStreak(p) >= 3) unlock(p, "daily3", newly);
  saveProgress(p);

  const after = res.stats && res.stats.user && res.stats.user.phred;
  const levelUp = !!(state.levelBefore && after && levelNumber(after.code) > levelNumber(state.levelBefore));

  return {
    newly,
    isRecord,
    levelUp,
    level: after || null,
    xp: Math.round(score * 10),
    dayStreak: liveDayStreak(p),
    bestStreak: state.bestStreakInBlock
  };
}

function scoreMessage(ratio) {
  if (ratio >= 0.9) return ["Excelente!", "Domínio sólido da matéria. Mantém o ritmo."];
  if (ratio >= 0.7) return ["Muito bom!", "Estás no bom caminho para a frequência."];
  if (ratio >= 0.5) return ["Bom trabalho.", "Revê as explicações das perguntas que falhaste."];
  return ["Continua a treinar.", "Foca-te nos capítulos com menor acerto e tenta outro bloco."];
}

function celebrate(res, outcome) {
  const total = state.questions.length || 10;
  if (outcome.levelUp || (Number(res.score) / total) >= 0.8) confetti();
  if (outcome.levelUp && outcome.level) showToast(`Subiste de nível: ${outcome.level.code} · ${outcome.level.label}!`);
}

function confetti() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const canvas = document.createElement("canvas");
  canvas.className = "confetti";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);
  const colors = ["#695aa6", "#b4a8ee", "#0f766e", "#f2c14e", "#e0607e"];
  const parts = Array.from({ length: 140 }, () => ({
    x: Math.random() * w,
    y: -20 - Math.random() * h * 0.4,
    vx: (Math.random() - 0.5) * 4,
    vy: 2 + Math.random() * 4,
    size: 5 + Math.random() * 6,
    rot: Math.random() * Math.PI * 2,
    vr: (Math.random() - 0.5) * 0.3,
    color: colors[Math.floor(Math.random() * colors.length)]
  }));
  const start = performance.now();
  function frame(t) {
    ctx.clearRect(0, 0, w, h);
    for (const p of parts) {
      p.vy += 0.06;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    }
    if (t - start < 2800) requestAnimationFrame(frame);
    else canvas.remove();
  }
  requestAnimationFrame(frame);
}

// =========================================================================
// Results and review
// =========================================================================

function renderResults(res, elapsedSec, outcome) {
  const total = state.questions.length;
  const score = Number(res.score) || 0;
  const ratio = total ? score / total : 0;

  $("resScore").textContent = fmt1(score);
  $("resOf").textContent = `/ ${total}`;
  $("scoreRing").style.setProperty("--pct", Math.max(0, Math.min(100, Math.round(ratio * 100))));

  const [title, line] = scoreMessage(ratio);
  $("resTitle").textContent = title;
  const mins = Math.floor(elapsedSec / 60);
  const secs = String(elapsedSec % 60).padStart(2, "0");
  $("resSummary").textContent = line;
  $("resMeta").textContent =
    `Pseudónimo: ${state.pseudonym} · ${isFreq() ? "Modo frequência" : "Modo estudo"} · Tempo: ${mins}m ${secs}s`;

  const rewards = [`<span class="reward">${icon("up")} +${outcome.xp} XP</span>`];
  if (outcome.levelUp && outcome.level) {
    rewards.push(`<span class="reward teal">${icon("award")} Novo nível: ${escapeHtml(outcome.level.code)} · ${escapeHtml(outcome.level.label)}</span>`);
  }
  if (outcome.isRecord) rewards.push(`<span class="reward gold">${icon("trophy")} Novo recorde pessoal</span>`);
  if (!isFreq() && outcome.bestStreak >= 3) rewards.push(`<span class="reward">${icon("flame")} Melhor sequência: ${outcome.bestStreak}</span>`);
  if (outcome.dayStreak >= 2) rewards.push(`<span class="reward">${icon("calendar")} ${outcome.dayStreak} dias seguidos</span>`);
  $("rewardRow").innerHTML = rewards.join("");

  $("resCertas").textContent = res.certas;
  $("resErradas").textContent = res.erradas;
  $("resBranco").textContent = res.branco;

  $("resCapGrid").innerHTML = CHAPTERS.map((c) => {
    const s = (res.capStats && res.capStats[c]) || { c: 0, t: 0 };
    return `<div class="stat-box" title="${escapeHtml(CAP_LABELS[c])}"><div class="val">${s.c}/${s.t}</div><div class="lbl">${c}</div></div>`;
  }).join("");

  const p = loadProgress();
  const box = $("newAchievements");
  box.hidden = outcome.newly.length === 0;
  $("newAchievementsGrid").innerHTML = outcome.newly
    .map((id) => achievementCard(ACHIEVEMENTS.find((a) => a.id === id), p.achievements[id]))
    .join("");

  state.reviewFilter = "todas";
  renderReview();
}

function renderReview() {
  const { res } = state.lastResult || {};
  if (!res) return;
  const items = state.questions.map((q, idx) => ({ q, idx, r: res.review && res.review[q.id] })).filter((x) => x.r);
  const count = (status) => items.filter((x) => x.r.status === status).length;
  const filters = [
    ["todas", "Todas", items.length],
    ["errada", "Erradas", count("errada")],
    ["branco", "Em branco", count("branco")],
    ["certa", "Certas", count("certa")]
  ];
  $("reviewFilter").innerHTML = filters.map(([key, label, n]) =>
    `<button type="button" data-filter="${key}" aria-pressed="${state.reviewFilter === key}">${label} (${n})</button>`
  ).join("");

  const shown = items.filter((x) => state.reviewFilter === "todas" || x.r.status === state.reviewFilter);
  if (shown.length === 0) {
    $("reviewList").innerHTML = '<p class="muted">Nenhuma pergunta nesta categoria.</p>';
    return;
  }
  $("reviewList").innerHTML = shown.map(({ q, idx, r }) => {
    const statusLabel = r.status === "certa" ? "Certa (+1)" : r.status === "errada" ? "Errada (−0,2)" : "Em branco (0)";
    const hasAnswer = r.selectedIdx !== null && r.selectedIdx !== undefined;
    const yourAns = hasAnswer ? `${LETTERS[r.selectedIdx]}) ${q.options[r.selectedIdx]}` : "Sem resposta";
    const corrAns = `${LETTERS[r.correctIdx]}) ${q.options[r.correctIdx]}`;
    return `<article class="review-item ${escapeHtml(r.status)}">
      <div class="review-head">
        <div>
          <span class="badge cap" title="${escapeHtml(CAP_LABELS[q.cap] || q.cap)}">${escapeHtml(q.cap)}</span>
          ${q.subtema ? `<span class="badge">${escapeHtml(q.subtema)}</span>` : ""}
          <span class="badge status-${escapeHtml(r.status)}">${statusLabel}</span>
        </div>
        <button type="button" class="btn btn-ghost" data-flag="${idx}">⚑ Sinalizar</button>
      </div>
      <p class="review-stem">${idx + 1}. ${escapeHtml(q.stem)}</p>
      <p class="review-ans"><strong>A tua resposta:</strong> ${escapeHtml(yourAns)}</p>
      ${r.status !== "certa" ? `<p class="review-ans correct"><strong>Resposta certa:</strong> ${escapeHtml(corrAns)}</p>` : ""}
      <div class="review-exp"><strong>Explicação:</strong> ${escapeHtml(r.explicacao || "")}</div>
    </article>`;
  }).join("");
}

// =========================================================================
// Modals: flag a question, confirmations
// =========================================================================

let lastFocus = null;

function openModal(id) {
  lastFocus = document.activeElement;
  $(id).hidden = false;
  const first = $(id).querySelector("select, textarea, button");
  if (first) first.focus();
}

function closeModal(id) {
  $(id).hidden = true;
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
}

function closeModals() {
  ["flagModal", "confirmModal"].forEach((id) => { if (!$(id).hidden) closeModal(id); });
  state.flagTarget = null;
  state.confirmAction = null;
}

function anyModalOpen() {
  return !$("flagModal").hidden || !$("confirmModal").hidden;
}

function askConfirm({ title, text, ok, onOk }) {
  $("confirmTitle").textContent = title;
  $("confirmText").textContent = text;
  $("btnConfirmOk").textContent = ok || "Confirmar";
  state.confirmAction = onOk;
  openModal("confirmModal");
  $("btnConfirmOk").focus();
}

function openFlagModal(q) {
  if (!q) return;
  state.flagTarget = q;
  $("flagQInfo").textContent = `Pergunta ${q.id} (${q.cap}): "${q.stem.slice(0, 110)}${q.stem.length > 110 ? "…" : ""}"`;
  $("flagComment").value = "";
  $("flagReason").selectedIndex = 0;
  openModal("flagModal");
}

async function submitFlag() {
  const q = state.flagTarget;
  if (!q) return;
  const motivo = $("flagReason").value;
  const comentario = $("flagComment").value.trim();
  const btn = $("btnSendFlag");
  btn.disabled = true;
  btn.textContent = "A enviar…";
  try {
    let ok = true;
    let error = null;
    if (!IS_DEMO) {
      const res = await apiPost({
        action: "flag_question",
        pseudonym: state.pseudonym || "Estudante",
        qId: q.id,
        cap: q.cap,
        motivo,
        comentario
      });
      ok = !!res.ok;
      error = res.error;
    }
    if (!ok) {
      showToast(error || "Erro ao enviar sinalização.");
      return;
    }
    closeModal("flagModal");
    state.flagTarget = null;
    track("quiz_flag", { cap: q.cap });
    const p = loadProgress();
    const newly = [];
    unlock(p, "reviewer", newly);
    saveProgress(p);
    showToast(newly.length
      ? "Obrigado! Nova conquista: Revisão por pares."
      : IS_DEMO ? "Demo: sinalização simulada com sucesso." : "Sinalização enviada para o docente. Obrigado!");
    renderLocalProgress();
  } catch (err) {
    showToast("Falha ao enviar sinalização: " + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "Enviar sinalização";
  }
}

function abortQuiz() {
  askConfirm({
    title: "Sair do bloco?",
    text: "O resultado deste bloco não será guardado.",
    ok: "Sair sem guardar",
    onOk: () => {
      clearInterval(state.timerHandle);
      state.inBlock = false;
      goHome();
    }
  });
}

function goHome() {
  clearInterval(state.timerHandle);
  showView("viewHome");
  renderLocalProgress();
  refreshStats();
}

// =========================================================================
// Toast
// =========================================================================

function showToast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 3400);
}

// =========================================================================
// Events
// =========================================================================

function bindEvents() {
  $("btnTheme").addEventListener("click", () => {
    const next = THEMES[$("btnTheme").dataset.theme || "auto"].next;
    store.set("bioinf_theme", next);
    applyTheme(next);
  });

  $("inputPseudo").addEventListener("input", (e) => {
    state.pseudonym = e.target.value.trim();
    store.set("bioinf_pseudo", state.pseudonym);
    updateHeaderPseudo();
    renderLocalProgress();
  });
  $("inputPseudo").addEventListener("keydown", (e) => {
    if (e.key === "Enter") startBlock();
  });

  document.querySelectorAll('input[name="mode"]').forEach((r) => r.addEventListener("change", onModeChange));
  $("btnStart").addEventListener("click", startBlock);
  $("btnRefresh").addEventListener("click", refreshStats);

  // quiz
  $("optionsContainer").addEventListener("click", (e) => {
    const b = e.target.closest("[data-opt]");
    if (b) chooseOption(Number(b.dataset.opt));
  });
  $("qDots").addEventListener("click", (e) => {
    const b = e.target.closest("[data-goto]");
    if (b) goTo(Number(b.dataset.goto));
  });
  $("btnNext").addEventListener("click", nextAction);
  $("btnPrev").addEventListener("click", () => goTo(state.currentIdx - 1));
  $("btnBlank").addEventListener("click", leaveBlank);
  $("btnMark").addEventListener("click", toggleMark);
  $("btnFlag").addEventListener("click", () => openFlagModal(currentQuestion()));
  $("btnExit").addEventListener("click", abortQuiz);

  // results
  $("btnAgain").addEventListener("click", startBlock);
  $("btnHome").addEventListener("click", goHome);
  $("reviewFilter").addEventListener("click", (e) => {
    const b = e.target.closest("[data-filter]");
    if (!b) return;
    state.reviewFilter = b.dataset.filter;
    renderReview();
  });
  $("reviewList").addEventListener("click", (e) => {
    const b = e.target.closest("[data-flag]");
    if (b) openFlagModal(state.questions[Number(b.dataset.flag)]);
  });

  // modals
  $("btnFlagCancel").addEventListener("click", () => { closeModal("flagModal"); state.flagTarget = null; });
  $("btnSendFlag").addEventListener("click", submitFlag);
  $("btnConfirmCancel").addEventListener("click", () => { closeModal("confirmModal"); state.confirmAction = null; });
  $("btnConfirmOk").addEventListener("click", () => {
    const action = state.confirmAction;
    closeModal("confirmModal");
    state.confirmAction = null;
    if (action) action();
  });
  ["flagModal", "confirmModal"].forEach((id) => {
    $(id).addEventListener("click", (e) => { if (e.target === $(id)) closeModals(); });
  });

  // keyboard shortcuts during a block
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && anyModalOpen()) { closeModals(); return; }
    if ($("viewQuiz").hidden || anyModalOpen()) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = e.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

    const k = e.key.toLowerCase();
    const map = { a: 0, b: 1, c: 2, d: 3, 1: 0, 2: 1, 3: 2, 4: 3 };
    if (k in map) {
      e.preventDefault();
      chooseOption(map[k]);
    } else if (k === "0" && isFreq()) {
      leaveBlank();
    } else if (k === "m" && isFreq()) {
      toggleMark();
    } else if (e.key === "ArrowRight" && isFreq()) {
      goTo(state.currentIdx + 1);
    } else if (e.key === "ArrowLeft" && isFreq()) {
      goTo(state.currentIdx - 1);
    } else if (e.key === "Enter") {
      if (tag === "BUTTON") return; // the focused button handles Enter itself
      e.preventDefault();
      nextAction();
    }
  });

  // warn before closing the tab in the middle of a block
  window.addEventListener("beforeunload", (e) => {
    if (state.inBlock) {
      e.preventDefault();
      e.returnValue = "";
    }
  });
}

// =========================================================================
// Start
// =========================================================================

function init() {
  applyTheme(store.get("bioinf_theme") || "auto");
  setupConsent();

  $("inputPseudo").value = state.pseudonym;
  updateHeaderPseudo();
  const radio = document.querySelector(`input[name="mode"][value="${state.mode}"]`);
  if (radio) radio.checked = true;
  $("chkTimer").checked = store.get("bioinf_timer") !== "off";
  $("timerOptRow").hidden = state.mode !== "frequencia";

  bindEvents();
  renderLocalProgress();

  if (IS_DEMO) {
    $("demoBanner").hidden = false;
    $("bankStatusMsg").textContent = "Modo demonstração (4 perguntas de exemplo)";
    renderDemoStats();
  } else {
    checkServerPing();
    refreshStats();
  }
}

init();
