// ============================================================================
// ElektroCoach PRO – Proaktiver Lernplaner (eigenständiges Modul)
// 1. Lernplan-Generator:   Thema/Fach/Lernfeld + Datum der Arbeit + Intensität
//                          → Tagesplan mit Phasen (Grundlagen → Rechenwege →
//                          Praxis → Retro-Drill → Wackel-Themen → Generalprobe)
// 2. Retro-Drill:          streut proaktiv Fragen aus dem 1. & 2. Lehrjahr
//                          (GP-Teil-1-Stoff, LF 1–8) in jede Lerneinheit ein
// 3. Lehrplan-Explorer:    ISB-Lehrplan Bayern, LF 1–13, GP1/GP2, Stunden
// 4. API: ElektroStudyPlaner.renderHeroBanner(el) / renderPlanCreatorModal(el)
//         / renderLehrplanExplorer(el) / startTodaySession() / startRetroCheck()
// ============================================================================

window.ElektroStudyPlaner = (function () {
  'use strict';

  const STORAGE_KEY = 'elektrocoach_study_plan_v1';
  const APP_STORAGE_KEY = 'elektrocoach_state_v2'; // nur lesend (Leitner-Boxen)
  const STYLE_ID = 'esp-styles';
  const XP_PER_CORRECT = 15;
  const XP_DAY_BONUS = 25;
  const MAX_PLAN_DAYS = 30;
  const RETRO_CHECK_SIZE = 3;

  const DURATION_OPTIONS = [3, 5, 7, 14];
  const INTENSITY_OPTIONS = [
    { n: 5, label: 'entspannt', icon: '🌿' },
    { n: 8, label: 'solide', icon: '💪' },
    { n: 12, label: 'Intensivkurs', icon: '🔥' }
  ];

  // Lernphasen eines Plans – Reihenfolge wird in buildPhaseSequence() bestimmt
  const PHASES = {
    grundlagen: { title: 'Grundlagen & Spickzettel', icon: '📖', hint: 'Erst den Spickzettel zum Thema lesen, dann die Basisfragen.' },
    rechnen: { title: 'Rechenwege & Formeln', icon: '🧮', hint: 'Fragen mit Formeln zuerst – Rechenweg immer mitschreiben!' },
    praxis: { title: 'Praxis & Fehlerbilder', icon: '🔧', hint: 'Baustellen-Situationen: Was passiert, wenn …?' },
    retro: { title: 'Retro-Drill LJ 1 & 2', icon: '⏪', hint: 'Halbe Einheit Grundlagen aus dem 1. & 2. Lehrjahr – sitzt das noch?' },
    wackel: { title: 'Wackel-Themen ausbügeln', icon: '🎯', hint: 'Alles, was in diesem Plan schon schiefging, kommt nochmal.' },
    probe: { title: 'Generalprobe (Probe-Arbeit)', icon: '🏁', hint: '1,5-fache Fragenmenge, bunt gemischt – wie in der echten Arbeit.' }
  };

  // Richtwerte Unterrichtsstunden nach KMK-Rahmenlehrplan (falls data.js keine
  // Stunden liefert). Verbindlich ist der offizielle ISB-Lehrplan.
  const STUNDEN_RICHTWERTE = { 1: 80, 2: 100, 3: 100, 4: 40, 5: 80, 6: 60, 7: 80, 8: 60, 9: 80, 10: 100, 11: 100, 12: 80, 13: 60 };

  const FALLBACK_FAECHER = [
    { id: 'GST', title: 'Gebäudesystemtechnik', lernfelder: [] },
    { id: 'KoSys', title: 'Kommunikationssysteme', lernfelder: [] },
    { id: 'SG', title: 'System- und Gerätetechnik', lernfelder: [] },
    { id: 'IE', title: 'Installations- und Energietechnik', lernfelder: [] },
    { id: 'PuG', title: 'Politik und Gesellschaft (WiSo)', lernfelder: [] }
  ];

  // --------------------------------------------------------------------------
  // Zustand
  // --------------------------------------------------------------------------
  const state = {
    currentPlan: null,
    quiz: null,
    explorerFilter: 'all',
    heroContainers: [],
    explorerContainers: [],
    overlayEl: null,
    listenersBound: false
  };

  function data() {
    return window.ELEKTRO_DATA || { categories: [], questions: [], cheatSheets: [] };
  }

  function lehrplan() {
    return data().bayerischerLehrplan || null;
  }

  function faecher() {
    const lp = lehrplan();
    return lp && Array.isArray(lp.faecher) && lp.faecher.length ? lp.faecher : FALLBACK_FAECHER;
  }

  function lernfelder() {
    const lp = lehrplan();
    return lp && Array.isArray(lp.lernfelder) ? lp.lernfelder : [];
  }

  // --------------------------------------------------------------------------
  // Hilfsfunktionen
  // --------------------------------------------------------------------------
  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Lokale Datumsstrings (kein toISOString → keine UTC-Verschiebung um Mitternacht)
  function toDateStr(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function parseDate(str) {
    const parts = String(str || '').split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return null;
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function todayStr() {
    return toDateStr(new Date());
  }

  function addDays(dateStr, n) {
    const d = parseDate(dateStr) || new Date();
    d.setDate(d.getDate() + n);
    return toDateStr(d);
  }

  function daysBetween(fromStr, toStr) {
    const a = parseDate(fromStr);
    const b = parseDate(toStr);
    if (!a || !b) return 0;
    return Math.round((b - a) / 86400000);
  }

  function formatDate(dateStr, withWeekday) {
    const d = parseDate(dateStr);
    if (!d) return '';
    const opts = withWeekday
      ? { weekday: 'short', day: '2-digit', month: '2-digit' }
      : { day: '2-digit', month: '2-digit', year: 'numeric' };
    return d.toLocaleDateString('de-DE', opts);
  }

  function readBoxes() {
    try {
      const raw = localStorage.getItem(APP_STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && parsed.boxes ? parsed.boxes : {};
    } catch (e) {
      return {};
    }
  }

  function grantXp(amount) {
    if (amount > 0 && window.ElektroApp && typeof window.ElektroApp.addXp === 'function') {
      window.ElektroApp.addXp(amount);
    }
  }

  function isRetroQuestion(q) {
    return q.isRetro === true || (typeof q.lehrjahr === 'number' && q.lehrjahr <= 2);
  }

  // --------------------------------------------------------------------------
  // Storage
  // --------------------------------------------------------------------------
  function isValidPlan(p) {
    return (
      p &&
      typeof p === 'object' &&
      typeof p.id === 'string' &&
      typeof p.examDate === 'string' &&
      Array.isArray(p.dailyTasks) &&
      p.dailyTasks.length > 0
    );
  }

  function loadPlan() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const plan = parsed && parsed.currentPlan;
      if (isValidPlan(plan)) {
        plan.seenIds = Array.isArray(plan.seenIds) ? plan.seenIds : [];
        plan.wrongIds = Array.isArray(plan.wrongIds) ? plan.wrongIds : [];
        state.currentPlan = plan;
      }
    } catch (e) {
      console.warn('Lernplan konnte nicht geladen werden:', e);
    }
  }

  function savePlan() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ currentPlan: state.currentPlan }));
    } catch (e) {}
  }

  // --------------------------------------------------------------------------
  // Themen-Auswahl (Fach / Prüfungsschwerpunkt / Lernfeld)
  // --------------------------------------------------------------------------
  // topicKey-Format: 'fach:IE' | 'cat:drehstrom_motoren' | 'lf:5'
  function resolveTopic(topicKey) {
    const [kind, id] = String(topicKey || '').split(':');
    if (kind === 'fach') {
      const f = faecher().find(x => x.id === id);
      if (f) return { subject: f.id, categoryId: null, lernfeld: null, title: f.title };
    }
    if (kind === 'cat') {
      const c = (data().categories || []).find(x => x.id === id);
      if (c) return { subject: 'custom', categoryId: c.id, lernfeld: null, title: c.title };
    }
    if (kind === 'lf') {
      const lf = lernfelder().find(x => String(x.lf) === id);
      if (lf) return { subject: lf.fach || 'custom', categoryId: null, lernfeld: lf.lf, title: `LF ${lf.lf}: ${lf.title}` };
    }
    return null;
  }

  function topicQuestions(plan) {
    const all = data().questions || [];
    if (plan.categoryId) return all.filter(q => q.category === plan.categoryId);
    if (plan.subject && plan.subject !== 'custom') return all.filter(q => q.fach === plan.subject);
    return all.slice();
  }

  function retroQuestions() {
    return (data().questions || []).filter(isRetroQuestion);
  }

  // --------------------------------------------------------------------------
  // Plan-Generator
  // --------------------------------------------------------------------------
  function buildPhaseSequence(days, retro) {
    if (days <= 1) return ['probe'];
    if (days === 2) return ['grundlagen', 'probe'];
    if (days === 3) return ['grundlagen', 'rechnen', 'probe'];

    const middleCycle = retro ? ['rechnen', 'praxis', 'retro'] : ['rechnen', 'praxis'];
    const seq = ['grundlagen'];
    for (let i = 0; i < days - 3; i++) seq.push(middleCycle[i % middleCycle.length]);
    seq.push('wackel', 'probe');
    return seq;
  }

  function createPlan(opts) {
    const today = todayStr();
    const daysTotal = clamp(daysBetween(today, opts.examDate), 1, MAX_PLAN_DAYS);
    const perDay = opts.dailyTargetQuestions;
    const tasks = buildPhaseSequence(daysTotal, opts.retro).map((phase, i) => ({
      day: i + 1,
      phase,
      title: PHASES[phase].title,
      date: addDays(today, i),
      targetQuestions: phase === 'probe' ? Math.round(perDay * 1.5) : perDay,
      completed: false,
      completedAt: null,
      correct: 0,
      total: 0
    }));

    return {
      id: 'plan_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      subject: opts.topic.subject,
      categoryId: opts.topic.categoryId,
      lernfeld: opts.topic.lernfeld,
      topicKey: opts.topicKey,
      topicTitle: opts.title || opts.topic.title,
      examDate: opts.examDate,
      daysTotal,
      dailyTargetQuestions: perDay,
      dailyTasks: tasks,
      retroQuestionsIncluded: !!opts.retro,
      seenIds: [],
      wrongIds: [],
      createdAt: today
    };
  }

  function currentTask(plan) {
    return plan.dailyTasks.find(t => !t.completed) || null;
  }

  function retroCountFor(plan, task) {
    if (!plan.retroQuestionsIncluded) return 0;
    if (task.phase === 'retro') return Math.ceil(task.targetQuestions / 2);
    return Math.max(1, Math.round(task.targetQuestions * 0.25));
  }

  // Niedriger Rang = kommt eher dran. Zufallsanteil sorgt für Abwechslung.
  function rankQuestion(q, plan, phase, boxes) {
    if (phase === 'probe') return Math.random() * 10;
    let r = (boxes[q.id] || 2) - 1;
    if (plan.seenIds.includes(q.id)) r += 3;
    if (plan.wrongIds.includes(q.id)) r -= phase === 'wackel' ? 6 : 2;
    if (phase === 'rechnen' && !q.formula) r += 4;
    if (phase === 'grundlagen' && q.isWeakSpot) r += 1;
    return r + Math.random() * 0.9;
  }

  function pickRanked(pool, count, rankFn) {
    return pool
      .map(q => ({ q, r: rankFn(q) }))
      .sort((a, b) => a.r - b.r)
      .slice(0, Math.max(0, count))
      .map(x => x.q);
  }

  function buildDailyQueue(plan, task) {
    const boxes = readBoxes();
    const target = task.targetQuestions;
    const retroWanted = retroCountFor(plan, task);

    let topicPool = topicQuestions(plan);
    const nonRetro = topicPool.filter(q => !isRetroQuestion(q));
    if (nonRetro.length >= target - retroWanted) topicPool = nonRetro;

    const topicPicks = pickRanked(topicPool, target - retroWanted, q => rankQuestion(q, plan, task.phase, boxes));
    const used = new Set(topicPicks.map(q => q.id));

    let retroPicks = [];
    if (plan.retroQuestionsIncluded) {
      const retroNeeded = target - topicPicks.length; // füllt auch auf, wenn das Thema zu wenig Fragen hat
      const retroPool = retroQuestions().filter(q => !used.has(q.id));
      retroPicks = pickRanked(retroPool, retroNeeded, q => rankQuestion(q, plan, 'retro', boxes));
      retroPicks.forEach(q => used.add(q.id));
    }

    // Immer noch zu wenig? Mit beliebigen Fragen auffüllen.
    const missing = target - topicPicks.length - retroPicks.length;
    const filler = missing > 0
      ? shuffle((data().questions || []).filter(q => !used.has(q.id))).slice(0, missing)
      : [];

    // Retro-Fragen zufällig einstreuen – aber nie als allererste Frage
    const queue = shuffle(topicPicks.concat(filler));
    retroPicks.forEach(q => {
      const pos = queue.length === 0 ? 0 : 1 + Math.floor(Math.random() * queue.length);
      queue.splice(pos, 0, q);
    });

    return queue.map(q => ({ q, retro: retroPicks.includes(q) }));
  }

  // --------------------------------------------------------------------------
  // Styles
  // --------------------------------------------------------------------------
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .esp-hero { background: linear-gradient(135deg, #131b2e 0%, #1a2540 100%); border: 1px solid var(--border, #23314f); border-radius: var(--radius, 16px); padding: 16px; margin-bottom: 14px; }
      .esp-hero.esp-hero-empty { border-style: dashed; border-color: var(--accent-amber, #f59e0b); }
      .esp-hero-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; flex-wrap: wrap; }
      .esp-kicker { font-size: 0.72rem; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; color: var(--text-muted, #94a3b8); }
      .esp-title { font-size: 1.08rem; font-weight: 800; margin-top: 2px; }
      .esp-countdown { background: #090d16; border: 1px solid #1e293b; border-radius: 999px; padding: 5px 12px; font-size: 0.8rem; font-weight: 800; color: var(--accent-amber, #f59e0b); white-space: nowrap; }
      .esp-countdown.esp-urgent { color: #fca5a5; border-color: #7f1d1d; }
      .esp-today { margin: 12px 0 8px; font-size: 0.9rem; font-weight: 700; }
      .esp-today small { display: block; font-weight: 500; color: var(--text-muted, #94a3b8); margin-top: 3px; }
      .esp-warn { font-size: 0.78rem; color: #fca5a5; margin-bottom: 6px; font-weight: 700; }
      .esp-days { display: flex; gap: 4px; margin: 10px 0 4px; }
      .esp-day { flex: 1; min-width: 0; height: 9px; border-radius: 5px; background: #1e293b; }
      .esp-day.done { background: linear-gradient(90deg, #10b981, #34d399); }
      .esp-day.today { background: #f59e0b; box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.35); }
      .esp-days-meta { display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-muted, #94a3b8); }
      .esp-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
      .esp-overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(5, 8, 14, 0.82); display: flex; align-items: flex-start; justify-content: center; overflow-y: auto; padding: 24px 12px 90px; }
      .esp-modal { position: relative; width: 100%; max-width: 560px; background: var(--bg-card, #131b2e); border: 1px solid var(--border, #23314f); border-radius: var(--radius, 16px); padding: 18px; }
      .esp-modal-close { position: absolute; top: 10px; right: 10px; background: none; border: none; color: var(--text-muted, #94a3b8); font-size: 1.2rem; cursor: pointer; padding: 4px 8px; }
      .esp-modal h3 { font-size: 1.05rem; margin-bottom: 4px; padding-right: 30px; }
      .esp-field { margin-top: 14px; }
      .esp-field > label, .esp-label { display: block; font-size: 0.78rem; font-weight: 800; color: var(--text-muted, #94a3b8); margin-bottom: 6px; }
      .esp-input { width: 100%; background: #090d16; color: var(--text-main, #f8fafc); border: 1px solid var(--border, #23314f); border-radius: 10px; padding: 9px 10px; font-size: 0.9rem; font-family: inherit; }
      .esp-input:focus { outline: none; border-color: var(--accent-blue, #38bdf8); }
      .esp-pills { display: flex; flex-wrap: wrap; gap: 6px; }
      .esp-pill { background: #090d16; color: var(--text-main, #f8fafc); border: 1px solid var(--border, #23314f); border-radius: 999px; padding: 6px 12px; font-size: 0.8rem; font-weight: 700; cursor: pointer; font-family: inherit; }
      .esp-pill.active { border-color: var(--accent-amber, #f59e0b); background: rgba(245, 158, 11, 0.14); color: #fbbf24; }
      .esp-check { display: flex; gap: 10px; align-items: flex-start; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.35); border-radius: 12px; padding: 10px 12px; font-size: 0.84rem; cursor: pointer; }
      .esp-check input { margin-top: 3px; width: 18px; height: 18px; accent-color: #f59e0b; flex-shrink: 0; }
      .esp-hint { font-size: 0.75rem; color: var(--text-muted, #94a3b8); margin-top: 5px; }
      .esp-error { color: #fca5a5; font-size: 0.8rem; font-weight: 700; margin-top: 10px; }
      .esp-daylist { display: flex; flex-direction: column; gap: 6px; margin-top: 12px; }
      .esp-dayrow { display: flex; justify-content: space-between; align-items: center; gap: 8px; background: #090d16; border: 1px solid #1e293b; border-radius: 10px; padding: 8px 10px; font-size: 0.82rem; }
      .esp-dayrow.done { border-color: rgba(16, 185, 129, 0.45); }
      .esp-retro-badge { background: rgba(168, 85, 247, 0.16); color: #d8b4fe; border: 1px solid rgba(168, 85, 247, 0.45); }
      .esp-summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 14px 0; }
      .esp-summary-grid div { background: #090d16; border: 1px solid #1e293b; border-radius: 12px; padding: 10px; text-align: center; }
      .esp-summary-grid strong { display: block; font-size: 1.2rem; }
      .esp-summary-grid small { color: var(--text-muted, #94a3b8); font-size: 0.72rem; }
      .esp-lp-head { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 10px 0; }
      .esp-lp-gp { background: #090d16; border: 1px solid #1e293b; border-radius: 12px; padding: 10px; font-size: 0.78rem; color: var(--text-muted, #94a3b8); }
      .esp-lp-gp strong { display: block; color: var(--text-main, #f8fafc); font-size: 0.88rem; margin-bottom: 3px; }
      .esp-lf { background: #090d16; border: 1px solid #1e293b; border-radius: 12px; margin-top: 8px; }
      .esp-lf summary { list-style: none; cursor: pointer; padding: 10px 12px; display: flex; gap: 10px; align-items: center; }
      .esp-lf summary::-webkit-details-marker { display: none; }
      .esp-lf[open] { border-color: var(--accent-blue, #38bdf8); }
      .esp-lf-num { flex-shrink: 0; width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.8rem; background: #1e293b; }
      .esp-lf-num.gp1 { background: rgba(56, 189, 248, 0.15); color: #7dd3fc; }
      .esp-lf-num.gp2 { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
      .esp-lf-title { font-size: 0.85rem; font-weight: 700; line-height: 1.3; }
      .esp-lf-meta { font-size: 0.72rem; color: var(--text-muted, #94a3b8); margin-top: 3px; }
      .esp-lf-body { padding: 0 12px 12px 60px; font-size: 0.82rem; }
      .esp-lf-body ul { margin: 4px 0 10px 16px; }
      .esp-lf-body li { margin: 2px 0; }
      @media (max-width: 480px) { .esp-lf-body { padding-left: 12px; } .esp-lp-head { grid-template-columns: 1fr; } }
    `;
    document.head.appendChild(style);
  }

  // --------------------------------------------------------------------------
  // Overlay / Modal
  // --------------------------------------------------------------------------
  function openOverlay(innerHtml) {
    closeModal();
    const overlay = document.createElement('div');
    overlay.className = 'esp-overlay';
    overlay.setAttribute('data-esp', 'overlay-bg');
    overlay.innerHTML = `
      <div class="esp-modal" role="dialog" aria-modal="true">
        <button class="esp-modal-close" data-esp="close" aria-label="Schließen">✕</button>
        <div class="esp-modal-body">${innerHtml}</div>
      </div>
    `;
    document.body.appendChild(overlay);
    state.overlayEl = overlay;
    return overlay.querySelector('.esp-modal-body');
  }

  function overlayBody() {
    return state.overlayEl ? state.overlayEl.querySelector('.esp-modal-body') : null;
  }

  function closeModal() {
    if (state.overlayEl && state.overlayEl.parentNode) {
      state.overlayEl.parentNode.removeChild(state.overlayEl);
    }
    state.overlayEl = null;
    state.quiz = null;
  }

  // --------------------------------------------------------------------------
  // Hero-Banner
  // --------------------------------------------------------------------------
  function registerContainer(list, el) {
    const idx = list.indexOf(el);
    if (idx === -1) list.push(el);
    for (let i = list.length - 1; i >= 0; i--) {
      if (!list[i].isConnected) list.splice(i, 1);
    }
  }

  function subjectLabel(plan) {
    if (plan.categoryId) {
      const c = (data().categories || []).find(x => x.id === plan.categoryId);
      return c ? `${c.icon} ${c.shortTitle || c.title}` : 'Schwerpunkt';
    }
    if (plan.subject && plan.subject !== 'custom') {
      return plan.lernfeld ? `${plan.subject} · LF ${plan.lernfeld}` : plan.subject;
    }
    return 'Eigenes Thema';
  }

  function countdownText(plan) {
    const left = daysBetween(todayStr(), plan.examDate);
    if (left < 0) return { text: `📝 Arbeit war am ${formatDate(plan.examDate)}`, urgent: false, left };
    if (left === 0) return { text: '🔥 Heute ist die Arbeit – viel Erfolg!', urgent: true, left };
    if (left === 1) return { text: '⚡ Morgen ist die Arbeit!', urgent: true, left };
    return { text: `⏳ Noch ${left} Tage bis zur Arbeit!`, urgent: left <= 2, left };
  }

  function renderEmptyHero() {
    return `
      <div class="esp-hero esp-hero-empty">
        <div class="esp-kicker">📅 Proaktiver Lernplaner</div>
        <div class="esp-title" style="margin:4px 0 6px;">🎯 Nächste Arbeit im Anmarsch? Mach dir in 30 Sekunden einen proaktiven Lernplan!</div>
        <p style="font-size:0.82rem;color:var(--text-muted);">
          Thema wählen, Datum der Arbeit eintragen – der Coach verteilt die Fragen auf die Tage,
          gleicht mit dem bayerischen Lehrplan ab und streut alte Themen aus dem 1. &amp; 2. Lehrjahr ein.
        </p>
        <div class="esp-actions">
          <button class="btn-primary" data-esp="open-creator">📅 Neuen Lernplan erstellen</button>
          <button class="btn-secondary" data-esp="retro-check">🎲 Spontan-Check: ${RETRO_CHECK_SIZE} Fragen aus LJ 1 &amp; 2</button>
        </div>
      </div>
    `;
  }

  function renderPlanHero(plan) {
    const cd = countdownText(plan);
    const task = currentTask(plan);
    const doneCount = plan.dailyTasks.filter(t => t.completed).length;
    const total = plan.dailyTasks.length;
    const pct = Math.round((doneCount / total) * 100);
    const today = todayStr();

    // Rückstand: Tage, deren Datum schon vorbei ist, die aber noch offen sind
    const overdue = plan.dailyTasks.filter(t => !t.completed && t.date && t.date < today).length;
    const doneToday = plan.dailyTasks.some(t => t.completedAt === today);

    let todayHtml;
    let startLabel;
    if (!task) {
      todayHtml = `🏆 Alle ${total} Lerneinheiten erledigt! <small>Du bist bereit. Ein Spontan-Check vor der Arbeit schadet trotzdem nicht.</small>`;
      startLabel = '';
    } else {
      const phase = PHASES[task.phase] || PHASES.grundlagen;
      const retroN = retroCountFor(plan, task);
      const ahead = doneToday && task.date > today;
      todayHtml = `
        ${ahead ? '✅ Heute schon erledigt! Als Nächstes' : 'Heute'} Tag ${task.day}/${total}: ${task.targetQuestions} Fokus-Fragen
        <small>${phase.icon} ${escapeHtml(task.title)}${retroN ? ` · davon ~${retroN} Retro-Fragen aus LJ 1 &amp; 2` : ''} – ${escapeHtml(phase.hint)}</small>
      `;
      startLabel = ahead ? `⏩ Tag ${task.day} vorziehen` : '🚀 Heutige Lerneinheit starten';
    }

    const segments = plan.dailyTasks
      .map(t => {
        const cls = t.completed ? 'done' : task && t.day === task.day ? 'today' : '';
        const tip = `Tag ${t.day} (${formatDate(t.date, true)}): ${t.title}${t.completed ? ` – ${t.correct}/${t.total} richtig` : ''}`;
        return `<div class="esp-day ${cls}" title="${escapeHtml(tip)}"></div>`;
      })
      .join('');

    return `
      <div class="esp-hero">
        <div class="esp-hero-top">
          <div>
            <div class="esp-kicker">📅 Dein Lernplan · ${escapeHtml(subjectLabel(plan))} · Arbeit am ${formatDate(plan.examDate)}</div>
            <div class="esp-title">${escapeHtml(plan.topicTitle)}</div>
          </div>
          <div class="esp-countdown ${cd.urgent ? 'esp-urgent' : ''}">${cd.text}</div>
        </div>
        <div class="esp-today">${todayHtml}</div>
        ${overdue > 0 && task ? `<div class="esp-warn">⚠️ ${overdue} Lerneinheit${overdue > 1 ? 'en' : ''} im Rückstand – heute ruhig doppelt ran!</div>` : ''}
        <div class="esp-days">${segments}</div>
        <div class="esp-days-meta">
          <span>${doneCount}/${total} Tage erledigt</span>
          <span>${pct} %${plan.retroQuestionsIncluded ? ' · ⏪ Retro-Drill aktiv' : ''}</span>
        </div>
        <div class="esp-actions">
          ${startLabel ? `<button class="btn-primary" data-esp="start-today">${startLabel}</button>` : ''}
          <button class="btn-secondary" data-esp="retro-check">🎲 Random-Retro-Check</button>
          <button class="btn-secondary" data-esp="open-manage">⚙️ Plan anpassen / beenden</button>
        </div>
      </div>
    `;
  }

  function renderHeroBanner(containerEl) {
    const el = typeof containerEl === 'string' ? document.getElementById(containerEl) : containerEl;
    if (!el) return;
    ensureInit();
    registerContainer(state.heroContainers, el);
    el.innerHTML = state.currentPlan ? renderPlanHero(state.currentPlan) : renderEmptyHero();
  }

  function refreshAll() {
    state.heroContainers.slice().forEach(el => {
      if (el.isConnected) renderHeroBanner(el);
    });
    state.explorerContainers.slice().forEach(el => {
      if (el.isConnected) renderLehrplanExplorer(el);
    });
  }

  // --------------------------------------------------------------------------
  // Plan-Generator-Formular
  // --------------------------------------------------------------------------
  function topicOptionsHtml(selectedKey) {
    const sel = key => (key === selectedKey ? ' selected' : '');
    const qs = data().questions || [];

    const fachOpts = faecher()
      .map(f => {
        const n = qs.filter(q => q.fach === f.id).length;
        return `<option value="fach:${escapeHtml(f.id)}"${sel('fach:' + f.id)}>${escapeHtml(f.id)} – ${escapeHtml(f.title)} (${n} Fragen)</option>`;
      })
      .join('');

    const catOpts = (data().categories || [])
      .map(c => {
        const n = qs.filter(q => q.category === c.id).length;
        return `<option value="cat:${escapeHtml(c.id)}"${sel('cat:' + c.id)}>${c.icon} ${escapeHtml(c.title)} (${n} Fragen)</option>`;
      })
      .join('');

    const lfOpts = lernfelder()
      .map(lf => `<option value="lf:${lf.lf}"${sel('lf:' + lf.lf)}>LF ${lf.lf} – ${escapeHtml(lf.title)} (${escapeHtml(lf.fach || '')})</option>`)
      .join('');

    return `
      <optgroup label="Prüfungsfächer (BS Lauingen)">${fachOpts}</optgroup>
      ${catOpts ? `<optgroup label="Die 9 Prüfungs-Schwerpunkte">${catOpts}</optgroup>` : ''}
      ${lfOpts ? `<optgroup label="Lernfelder nach ISB-Lehrplan">${lfOpts}</optgroup>` : ''}
    `;
  }

  function creatorFormHtml(preset) {
    const p = preset || {};
    const today = todayStr();
    const examDate = p.examDate && p.examDate >= today ? p.examDate : addDays(today, 5);
    const diff = daysBetween(today, examDate);
    const intensity = p.intensity || 8;
    const retro = p.retro !== false;
    const topicKey = p.topicKey || 'fach:IE';

    const durationPills = DURATION_OPTIONS
      .map(d => `<button type="button" class="esp-pill ${d === diff ? 'active' : ''}" data-esp="pick-duration" data-days="${d}">in ${d} Tagen</button>`)
      .join('');

    const intensityPills = INTENSITY_OPTIONS
      .map(o => `<button type="button" class="esp-pill ${o.n === intensity ? 'active' : ''}" data-esp="pick-intensity" data-n="${o.n}">${o.icon} ${o.n} Fragen/Tag · ${o.label}</button>`)
      .join('');

    return `
      <form class="esp-creator" data-esp-form="creator" onsubmit="return false;">
        <h3>📅 Neuer Lernplan für die nächste Arbeit</h3>
        <p class="esp-hint">${state.currentPlan ? '⚠️ Ersetzt deinen aktuellen Plan.' : 'In 30 Sekunden fertig – danach steckst du im System und wirst jeden Tag abgefragt.'}</p>

        <div class="esp-field">
          <label for="esp-topic">Fach / Schwerpunkt / Lernfeld</label>
          <select id="esp-topic" class="esp-input" name="topic">${topicOptionsHtml(topicKey)}</select>
        </div>

        <div class="esp-field">
          <label for="esp-title">Thema der Arbeit (optional)</label>
          <input id="esp-title" class="esp-input" name="title" type="text" maxlength="80"
            placeholder="z. B. Drehstrom & Blindleistungskompensation" value="${escapeHtml(p.title || '')}" />
        </div>

        <div class="esp-field">
          <span class="esp-label">Wann ist die Arbeit?</span>
          <div class="esp-pills">${durationPills}</div>
          <input class="esp-input" name="examDate" type="date" min="${addDays(today, 1)}" value="${examDate}" style="margin-top:8px;" />
          <div class="esp-hint">Oder genaues Datum eintragen (max. ${MAX_PLAN_DAYS} Tage Lernzeit).</div>
        </div>

        <div class="esp-field">
          <span class="esp-label">Intensität</span>
          <div class="esp-pills">${intensityPills}</div>
          <input type="hidden" name="intensity" value="${intensity}" />
        </div>

        <div class="esp-field">
          <label class="esp-check">
            <input type="checkbox" name="retro" ${retro ? 'checked' : ''} />
            <span><strong>⚠️ Grundlagen aus 1. &amp; 2. Lehrjahr proaktiv einstreuen (Retro-Drill)</strong><br>
            <span class="esp-hint">Sicherheitsregeln, Ohmsches Gesetz, Schutzklassen, Leiterfarben … kommen zufällig dazwischen – genau wie in der GP.</span></span>
          </label>
        </div>

        <div class="esp-error" data-esp-error hidden></div>

        <div class="esp-actions">
          <button type="button" class="btn-primary" data-esp="create-submit">✅ Speichern &amp; Plan aktivieren</button>
          <button type="button" class="btn-secondary" data-esp="close">Abbrechen</button>
        </div>
      </form>
    `;
  }

  function renderPlanCreatorModal(containerEl, preset) {
    ensureInit();
    const el = typeof containerEl === 'string' ? document.getElementById(containerEl) : containerEl;
    if (el) {
      el.innerHTML = creatorFormHtml(preset);
      return;
    }
    openOverlay(creatorFormHtml(preset));
  }

  function openPlanCreator(preset) {
    renderPlanCreatorModal(null, preset);
  }

  function submitCreator(form) {
    const errEl = form.querySelector('[data-esp-error]');
    const showError = msg => {
      if (!errEl) return;
      errEl.textContent = msg;
      errEl.hidden = false;
    };

    const topicKey = form.elements.topic.value;
    const topic = resolveTopic(topicKey);
    if (!topic) return showError('Bitte ein Fach oder Thema auswählen.');

    const examDate = form.elements.examDate.value;
    if (!parseDate(examDate)) return showError('Bitte ein gültiges Datum für die Arbeit eintragen.');
    const diff = daysBetween(todayStr(), examDate);
    if (diff < 1) return showError('Die Arbeit muss mindestens morgen sein – sonst hilft nur noch der Spontan-Check 😉');
    if (diff > MAX_PLAN_DAYS) return showError(`Maximal ${MAX_PLAN_DAYS} Tage im Voraus – plane näher an der Arbeit.`);

    const intensity = parseInt(form.elements.intensity.value, 10);
    const perDay = INTENSITY_OPTIONS.some(o => o.n === intensity) ? intensity : 8;

    state.currentPlan = createPlan({
      topicKey,
      topic,
      title: form.elements.title.value.trim(),
      examDate,
      dailyTargetQuestions: perDay,
      retro: form.elements.retro.checked
    });
    savePlan();

    const inOverlay = state.overlayEl && state.overlayEl.contains(form);
    if (inOverlay) {
      closeModal();
    } else {
      form.parentNode.innerHTML = `<p class="esp-hint">✅ Lernplan „${escapeHtml(state.currentPlan.topicTitle)}“ ist aktiv.</p>`;
    }
    refreshAll();
  }

  // --------------------------------------------------------------------------
  // Plan anpassen / beenden
  // --------------------------------------------------------------------------
  function manageHtml(plan) {
    const rows = plan.dailyTasks
      .map(t => {
        const phase = PHASES[t.phase] || PHASES.grundlagen;
        return `
          <div class="esp-dayrow ${t.completed ? 'done' : ''}">
            <div>
              <strong>Tag ${t.day}</strong> · ${formatDate(t.date, true)} · ${phase.icon} ${escapeHtml(t.title)}
              <div class="esp-hint" style="margin-top:2px;">
                ${t.completed ? `✅ erledigt${t.total ? ` · ${t.correct}/${t.total} richtig` : ''}` : `${t.targetQuestions} Fragen offen`}
              </div>
            </div>
            <button class="btn-secondary btn-sm" data-esp="toggle-day" data-day="${t.day}">
              ${t.completed ? '↩️ Zurücksetzen' : '✔️ Erledigt'}
            </button>
          </div>
        `;
      })
      .join('');

    return `
      <h3>⚙️ Lernplan anpassen</h3>
      <p class="esp-hint">${escapeHtml(plan.topicTitle)} · Arbeit am ${formatDate(plan.examDate)} · ${plan.dailyTargetQuestions} Fragen/Tag · Retro-Drill ${plan.retroQuestionsIncluded ? 'an' : 'aus'}</p>
      <div class="esp-daylist">${rows}</div>
      <div class="esp-actions">
        <button class="btn-secondary" data-esp="replan">✏️ Neu planen (Datum / Intensität ändern)</button>
        <button class="btn-secondary" data-esp="delete-plan" style="border-color:#7f1d1d;color:#fca5a5;">🗑️ Plan beenden</button>
      </div>
    `;
  }

  function openManage() {
    if (!state.currentPlan) return openPlanCreator();
    openOverlay(manageHtml(state.currentPlan));
  }

  function toggleDay(day) {
    const plan = state.currentPlan;
    if (!plan) return;
    const task = plan.dailyTasks.find(t => t.day === day);
    if (!task) return;
    task.completed = !task.completed;
    task.completedAt = task.completed ? todayStr() : null;
    savePlan();
    const body = overlayBody();
    if (body) body.innerHTML = manageHtml(plan);
    refreshAll();
  }

  function deletePlan() {
    if (!state.currentPlan) return;
    if (!window.confirm(`Lernplan „${state.currentPlan.topicTitle}“ wirklich beenden?`)) return;
    state.currentPlan = null;
    savePlan();
    closeModal();
    refreshAll();
  }

  function replan() {
    const p = state.currentPlan;
    if (!p) return openPlanCreator();
    openPlanCreator({
      topicKey: p.topicKey,
      title: p.topicTitle !== (resolveTopic(p.topicKey) || {}).title ? p.topicTitle : '',
      examDate: p.examDate,
      intensity: p.dailyTargetQuestions,
      retro: p.retroQuestionsIncluded
    });
  }

  // --------------------------------------------------------------------------
  // Quiz (Lerneinheit, Retro-Check, Lernfeld-Check)
  // --------------------------------------------------------------------------
  function startQuiz(items, meta) {
    if (!items.length) {
      openOverlay(`<h3>😕 Keine Fragen gefunden</h3><p class="esp-hint">Für diese Auswahl gibt es noch keine Fragen im Katalog.</p>`);
      return;
    }
    openOverlay('');
    state.quiz = Object.assign(
      {
        items,
        index: 0,
        answered: false,
        selected: null,
        shuffled: null,
        correct: 0,
        retroTotal: 0,
        retroCorrect: 0,
        wrong: [],
        xp: 0
      },
      meta
    );
    renderQuiz();
  }

  function startTodaySession() {
    const plan = state.currentPlan;
    if (!plan) return openPlanCreator();
    const task = currentTask(plan);
    if (!task) return startRetroCheck();
    const phase = PHASES[task.phase] || PHASES.grundlagen;
    startQuiz(buildDailyQueue(plan, task), {
      mode: 'plan',
      day: task.day,
      heading: `Tag ${task.day}/${plan.dailyTasks.length} · ${phase.icon} ${task.title}`
    });
  }

  function startRetroCheck(count) {
    const n = count || RETRO_CHECK_SIZE;
    const boxes = readBoxes();
    const plan = state.currentPlan || { seenIds: [], wrongIds: [] };
    const picks = pickRanked(retroQuestions(), n, q => rankQuestion(q, plan, 'retro', boxes) + Math.random() * 2);
    startQuiz(picks.map(q => ({ q, retro: true })), {
      mode: 'retro',
      heading: '🎲 Random-Retro-Check · Sitzt das noch aus LJ 1 & 2?'
    });
  }

  function startLernfeldCheck(lfNum) {
    const lf = lernfelder().find(x => x.lf === lfNum);
    if (!lf) return;
    const qs = (data().questions || []).filter(q => q.fach === lf.fach);
    const sameYear = qs.filter(q => q.lehrjahr === lf.lehrjahr);
    const pool = sameYear.length >= RETRO_CHECK_SIZE ? sameYear : qs;
    const picks = shuffle(pool).slice(0, RETRO_CHECK_SIZE);
    startQuiz(picks.map(q => ({ q, retro: isRetroQuestion(q) })), {
      mode: 'check',
      heading: `🔎 Kurz-Check LF ${lf.lf} · ${lf.fach}`
    });
  }

  function shuffledOptions(q) {
    return shuffle(q.options.map((text, origIdx) => ({ text, origIdx })));
  }

  function renderQuiz() {
    const body = overlayBody();
    const quiz = state.quiz;
    if (!body || !quiz) return;

    if (quiz.index >= quiz.items.length) {
      renderQuizSummary();
      return;
    }

    const { q, retro } = quiz.items[quiz.index];
    if (!quiz.shuffled) quiz.shuffled = shuffledOptions(q);

    const cat = (data().categories || []).find(c => c.id === q.category);
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const optionsHtml = quiz.shuffled
      .map((item, i) => {
        let cls = 'quiz-opt-btn';
        if (quiz.answered) {
          if (item.origIdx === q.correctIndex) cls += ' correct';
          else if (item.origIdx === quiz.selected) cls += ' wrong';
        }
        return `
          <button class="${cls}" ${quiz.answered ? 'disabled' : ''} data-esp="answer" data-idx="${item.origIdx}">
            <strong>${letters[i]})</strong> ${escapeHtml(item.text)}
          </button>
        `;
      })
      .join('');

    let explanationHtml = '';
    if (quiz.answered) {
      const isRight = quiz.selected === q.correctIndex;
      const isLast = quiz.index + 1 >= quiz.items.length;
      explanationHtml = `
        <div class="quiz-explanation">
          <div style="font-weight:800;margin-bottom:6px;color:${isRight ? '#34d399' : '#fca5a5'};">
            ${isRight ? `✅ Sitzt! +${XP_PER_CORRECT} XP` : retro ? '❌ Retro-Lücke entdeckt – die kommt in den nächsten Tagen nochmal!' : '❌ Noch wackelig – kommt am Wackel-Tag wieder dran.'}
          </div>
          <p><strong>Baustellen-Erklärung:</strong> ${escapeHtml(q.explanation)}</p>
          ${q.formula ? `<div class="quiz-formula-box">📐 ${escapeHtml(q.formula)}</div>` : ''}
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;flex-wrap:wrap;gap:8px;">
            <small style="color:var(--text-muted);">Quelle: ${escapeHtml(q.source || 'Fachkunde Elektrotechnik')}</small>
            <button class="btn-primary btn-sm" data-esp="next">
              ${isLast ? 'Einheit abschließen 🏆 →' : `Nächste Frage (${quiz.index + 2}/${quiz.items.length}) →`}
            </button>
          </div>
        </div>
      `;
    }

    body.innerHTML = `
      <div class="esp-kicker">${escapeHtml(quiz.heading)}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;flex-wrap:wrap;margin-top:8px;">
        <div>
          ${cat ? `<span class="badge badge-blue">${cat.icon} ${escapeHtml(cat.shortTitle || cat.title)}</span>` : ''}
          ${retro ? `<span class="badge esp-retro-badge">⏪ Retro${q.lehrjahr ? ` · LJ ${q.lehrjahr}` : ''}</span>` : ''}
        </div>
        <small style="color:var(--text-muted);font-weight:700;">Frage ${quiz.index + 1} von ${quiz.items.length}</small>
      </div>
      <div class="cat-progress-bar" style="height:5px;margin:10px 0 4px;">
        <div class="cat-progress-fill" style="width:${Math.round((quiz.index / quiz.items.length) * 100)}%;"></div>
      </div>
      <div class="quiz-question-title">${escapeHtml(q.question)}</div>
      <div class="quiz-options">${optionsHtml}</div>
      ${explanationHtml}
    `;
  }

  function answerQuiz(origIdx) {
    const quiz = state.quiz;
    if (!quiz || quiz.answered || quiz.index >= quiz.items.length) return;
    const { q, retro } = quiz.items[quiz.index];
    quiz.answered = true;
    quiz.selected = origIdx;
    const isRight = origIdx === q.correctIndex;

    if (retro) quiz.retroTotal++;
    if (isRight) {
      quiz.correct++;
      if (retro) quiz.retroCorrect++;
      quiz.xp += XP_PER_CORRECT;
      grantXp(XP_PER_CORRECT);
    } else {
      quiz.wrong.push(q);
    }

    // Plan-Gedächtnis: gesehen / falsch → steuert die Auswahl der Folgetage
    const plan = state.currentPlan;
    if (plan) {
      if (!plan.seenIds.includes(q.id)) plan.seenIds.push(q.id);
      if (isRight) {
        plan.wrongIds = plan.wrongIds.filter(id => id !== q.id);
      } else if (!plan.wrongIds.includes(q.id)) {
        plan.wrongIds.push(q.id);
      }
      savePlan();
    }
    renderQuiz();
  }

  function nextQuiz() {
    const quiz = state.quiz;
    if (!quiz || !quiz.answered || quiz.index >= quiz.items.length) return;
    quiz.index++;
    quiz.answered = false;
    quiz.selected = null;
    quiz.shuffled = null;
    if (quiz.index >= quiz.items.length) finishQuiz();
    else renderQuiz();
  }

  function finishQuiz() {
    const quiz = state.quiz;
    const plan = state.currentPlan;
    if (quiz.mode === 'plan' && plan) {
      const task = plan.dailyTasks.find(t => t.day === quiz.day);
      if (task && !task.completed) {
        task.completed = true;
        task.completedAt = todayStr();
        task.correct = quiz.correct;
        task.total = quiz.items.length;
        quiz.xp += XP_DAY_BONUS;
        quiz.dayBonus = true;
        grantXp(XP_DAY_BONUS);
      }
      savePlan();
    }
    renderQuizSummary();
    refreshAll();
  }

  function renderQuizSummary() {
    const body = overlayBody();
    const quiz = state.quiz;
    if (!body || !quiz) return;

    const total = Math.max(1, quiz.items.length);
    const pct = Math.round((quiz.correct / total) * 100);
    const verdict =
      pct >= 85 ? '🏆 Prüfungsreif! Das Thema sitzt.' :
      pct >= 60 ? '💪 Solide – ein paar Lücken, die schließen wir.' :
      '🔧 Da wackelt noch einiges – genau dafür ist der Plan da!';

    let retroHtml = '';
    if (quiz.retroTotal > 0) {
      const ok = quiz.retroCorrect === quiz.retroTotal;
      retroHtml = `
        <p style="font-size:0.84rem;margin-bottom:8px;">
          ⏪ <strong>Retro-Drill LJ 1 &amp; 2:</strong> ${quiz.retroCorrect}/${quiz.retroTotal} richtig –
          ${ok ? 'Grundlagen sitzen! 👌' : 'die Lücken streut der Coach in den nächsten Tagen wieder ein.'}
        </p>
      `;
    }

    const wrongHtml = quiz.wrong.length
      ? `<div class="esp-hint" style="margin-bottom:8px;"><strong>Nochmal anschauen:</strong><ul style="margin:4px 0 0 16px;">${quiz.wrong
          .map(q => `<li>${escapeHtml(q.question)}</li>`)
          .join('')}</ul></div>`
      : '';

    const plan = state.currentPlan;
    const next = plan && quiz.mode === 'plan' ? currentTask(plan) : null;
    let nextHtml = '';
    if (quiz.mode === 'plan' && plan) {
      nextHtml = next
        ? `<p class="esp-hint">📅 Morgen: Tag ${next.day} · ${escapeHtml(next.title)} (${next.targetQuestions} Fragen). Dranbleiben!</p>`
        : `<p class="esp-hint">🎉 Plan komplett durchgezogen – du bist bereit für die Arbeit!</p>`;
    }

    body.innerHTML = `
      <div class="esp-kicker">${escapeHtml(quiz.heading)}</div>
      <h3 style="margin-top:6px;">${verdict}</h3>
      <div class="esp-summary-grid">
        <div><strong style="color:#34d399;">${quiz.correct}/${quiz.items.length}</strong><small>richtig</small></div>
        <div><strong>${pct} %</strong><small>Quote</small></div>
        <div><strong style="color:#fbbf24;">+${quiz.xp}</strong><small>XP${quiz.dayBonus ? ' inkl. Tagesbonus' : ''}</small></div>
      </div>
      ${retroHtml}
      ${wrongHtml}
      ${nextHtml}
      <div class="esp-actions">
        <button class="btn-primary" data-esp="close">Fertig ✔️</button>
        <button class="btn-secondary" data-esp="retro-check">🎲 Noch ${RETRO_CHECK_SIZE} Retro-Fragen</button>
      </div>
    `;
  }

  // --------------------------------------------------------------------------
  // Lehrplan-Explorer (ISB Bayern)
  // --------------------------------------------------------------------------
  function lfStunden(lf) {
    if (typeof lf.stunden === 'number') return { h: lf.stunden, estimated: false };
    const h = STUNDEN_RICHTWERTE[lf.lf];
    return { h: h || 0, estimated: true };
  }

  function explorerFilterMatch(lf, filter) {
    if (filter === 'all') return true;
    if (filter === 'GP1' || filter === 'GP2') return lf.pruefung === filter;
    if (filter.indexOf('lj') === 0) return String(lf.lehrjahr) === filter.slice(2);
    if (filter.indexOf('fach:') === 0) return lf.fach === filter.slice(5);
    return true;
  }

  function renderLehrplanExplorer(containerEl) {
    const el = typeof containerEl === 'string' ? document.getElementById(containerEl) : containerEl;
    if (!el) return;
    ensureInit();
    registerContainer(state.explorerContainers, el);

    const lp = lehrplan();
    const lfs = lernfelder();
    if (!lp || !lfs.length) {
      el.innerHTML = `<p class="esp-hint">Lehrplandaten (ELEKTRO_DATA.bayerischerLehrplan) nicht gefunden.</p>`;
      return;
    }

    const qs = data().questions || [];
    const filter = state.explorerFilter;
    const anyEstimated = lfs.some(lf => lfStunden(lf).estimated);

    const gpCards = (lp.pruefungsteile || [])
      .map(gp => {
        const sum = (gp.lernfelder || []).reduce((acc, n) => {
          const lf = lfs.find(x => x.lf === n);
          return acc + (lf ? lfStunden(lf).h : 0);
        }, 0);
        return `
          <div class="esp-lp-gp">
            <strong>${escapeHtml(gp.id)} · ${escapeHtml(gp.title)}</strong>
            LF ${(gp.lernfelder || []).join(', ')} · ca. ${sum} Std.<br>
            ${escapeHtml(gp.hinweis || '')}
          </div>
        `;
      })
      .join('');

    const filters = [
      { id: 'all', label: 'Alle LF' },
      { id: 'GP1', label: 'GP Teil 1' },
      { id: 'GP2', label: 'GP Teil 2' },
      { id: 'lj1', label: '1. LJ' },
      { id: 'lj2', label: '2. LJ' },
      { id: 'lj3', label: '3. LJ' },
      { id: 'lj4', label: '4. LJ' },
      ...faecher().filter(f => f.lernfelder && f.lernfelder.length).map(f => ({ id: 'fach:' + f.id, label: f.id }))
    ];
    const filterHtml = filters
      .map(f => `<button class="esp-pill ${filter === f.id ? 'active' : ''}" data-esp="lp-filter" data-filter="${escapeHtml(f.id)}">${escapeHtml(f.label)}</button>`)
      .join('');

    const planLf = state.currentPlan && state.currentPlan.lernfeld;
    const visible = lfs.filter(lf => explorerFilterMatch(lf, filter));
    const lfHtml = visible
      .map(lf => {
        const st = lfStunden(lf);
        const gpCls = lf.pruefung === 'GP1' ? 'gp1' : 'gp2';
        const nQ = qs.filter(q => q.fach === lf.fach).length;
        const inhalte = (lf.inhalte || []).map(i => `<li>${escapeHtml(i)}</li>`).join('');
        return `
          <details class="esp-lf">
            <summary>
              <div class="esp-lf-num ${gpCls}">LF ${lf.lf}</div>
              <div>
                <div class="esp-lf-title">${escapeHtml(lf.title)}${planLf === lf.lf ? ' 📅' : ''}</div>
                <div class="esp-lf-meta">
                  ${lf.fach ? `<span class="fach-badge fach-${escapeHtml(lf.fach)}">${escapeHtml(lf.fach)}</span>` : ''}
                  ${escapeHtml(lf.pruefung || '')} · ${lf.lehrjahr}. Lehrjahr · ${st.h ? `${st.h} Std.${st.estimated ? '*' : ''}` : 'Std. k. A.'}
                </div>
              </div>
            </summary>
            <div class="esp-lf-body">
              <strong>Schwerpunkte:</strong>
              <ul>${inhalte}</ul>
              <div class="esp-hint" style="margin-bottom:8px;">
                ${lf.pruefung === 'GP1' ? '⏪ GP-Teil-1-Stoff – wird im Retro-Drill proaktiv abgefragt.' : '🎯 GP-Teil-2-Stoff – Kernthema der Abschlussprüfung.'}
                · ${nQ} Fragen im Fach ${escapeHtml(lf.fach || '')}
              </div>
              <div class="esp-actions" style="margin-top:0;">
                <button class="btn-primary btn-sm" data-esp="lf-plan" data-lf="${lf.lf}">📅 Lernplan für LF ${lf.lf}</button>
                ${nQ ? `<button class="btn-secondary btn-sm" data-esp="lf-check" data-lf="${lf.lf}">🔎 Kurz-Check (${RETRO_CHECK_SIZE} Fragen)</button>` : ''}
              </div>
            </div>
          </details>
        `;
      })
      .join('');

    el.innerHTML = `
      <div class="esp-explorer">
        <div class="esp-kicker">🏛️ ISB-Lehrplan Bayern · ${escapeHtml(lp.schule || '')} · ${escapeHtml(lp.klasse || '')}</div>
        <div class="esp-title" style="font-size:0.95rem;">${escapeHtml(lp.beruf || '')}</div>
        <div class="esp-lp-head">${gpCards}</div>
        <div class="esp-pills" style="margin-bottom:4px;">${filterHtml}</div>
        ${lfHtml || '<p class="esp-hint">Keine Lernfelder für diesen Filter.</p>'}
        ${anyEstimated ? '<p class="esp-hint" style="margin-top:10px;">* Stunden = Richtwerte nach KMK-Rahmenlehrplan. Verbindlich ist der offizielle ISB-Lehrplan.</p>' : ''}
      </div>
    `;
  }

  // --------------------------------------------------------------------------
  // Event-Delegation (ein Listener für alle Container & Modals)
  // --------------------------------------------------------------------------
  function setPillActive(btn) {
    const group = btn.parentNode;
    if (!group) return;
    group.querySelectorAll('.esp-pill').forEach(p => p.classList.toggle('active', p === btn));
  }

  function handleClick(e) {
    const target = e.target.closest('[data-esp]');
    if (!target) return;
    const action = target.getAttribute('data-esp');

    // Klick auf den abgedunkelten Hintergrund schließt – aber nicht während eines Quiz
    if (action === 'overlay-bg') {
      if (e.target === target && !state.quiz) closeModal();
      return;
    }

    switch (action) {
      case 'close': {
        const inlineForm = target.closest('[data-esp-form]');
        if (inlineForm && !(state.overlayEl && state.overlayEl.contains(inlineForm))) {
          inlineForm.parentNode.innerHTML = '';
          break;
        }
        closeModal();
        refreshAll();
        break;
      }
      case 'open-creator':
        openPlanCreator();
        break;
      case 'open-manage':
        openManage();
        break;
      case 'start-today':
        startTodaySession();
        break;
      case 'retro-check':
        startRetroCheck();
        break;
      case 'pick-duration': {
        const form = target.closest('form');
        const days = parseInt(target.getAttribute('data-days'), 10);
        if (form && days) {
          form.elements.examDate.value = addDays(todayStr(), days);
          setPillActive(target);
        }
        break;
      }
      case 'pick-intensity': {
        const form = target.closest('form');
        if (form) {
          form.elements.intensity.value = target.getAttribute('data-n');
          setPillActive(target);
        }
        break;
      }
      case 'create-submit': {
        const form = target.closest('form');
        if (form) submitCreator(form);
        break;
      }
      case 'toggle-day':
        toggleDay(parseInt(target.getAttribute('data-day'), 10));
        break;
      case 'replan':
        replan();
        break;
      case 'delete-plan':
        deletePlan();
        break;
      case 'answer':
        answerQuiz(parseInt(target.getAttribute('data-idx'), 10));
        break;
      case 'next':
        nextQuiz();
        break;
      case 'lp-filter':
        state.explorerFilter = target.getAttribute('data-filter') || 'all';
        refreshAll();
        break;
      case 'lf-plan': {
        const n = target.getAttribute('data-lf');
        openPlanCreator({ topicKey: 'lf:' + n });
        break;
      }
      case 'lf-check':
        startLernfeldCheck(parseInt(target.getAttribute('data-lf'), 10));
        break;
      default:
        break;
    }
  }

  function handleChange(e) {
    // Manuelles Datum → passende Dauer-Pille markieren
    if (e.target && e.target.name === 'examDate') {
      const form = e.target.closest('[data-esp-form="creator"]');
      if (!form) return;
      const diff = daysBetween(todayStr(), e.target.value);
      form.querySelectorAll('[data-esp="pick-duration"]').forEach(p => {
        p.classList.toggle('active', parseInt(p.getAttribute('data-days'), 10) === diff);
      });
    }
  }

  function handleKeydown(e) {
    if (e.key === 'Escape' && state.overlayEl) {
      closeModal();
      refreshAll();
    }
  }

  function ensureInit() {
    if (state.listenersBound) return;
    state.listenersBound = true;
    injectStyles();
    loadPlan();
    document.addEventListener('click', handleClick);
    document.addEventListener('change', handleChange);
    document.addEventListener('keydown', handleKeydown);
  }

  function init() {
    ensureInit();
  }

  function getPlan() {
    ensureInit();
    return state.currentPlan ? JSON.parse(JSON.stringify(state.currentPlan)) : null;
  }

  return {
    init,
    getPlan,
    renderHeroBanner,
    renderPlanCreatorModal,
    renderLehrplanExplorer,
    openPlanCreator,
    startTodaySession,
    startRetroCheck,
    closeModal
  };
})();
