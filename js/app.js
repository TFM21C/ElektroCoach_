// ============================================================================
// ElektroCoach PRO – Hauptlogik, Spaced Repetition (Leitner Box 1–4) & Rechner
// ============================================================================

window.ElektroApp = (function () {
  const STORAGE_KEY = 'elektrocoach_state_v2';
  const data = window.ELEKTRO_DATA || { categories: [], questions: [], cheatSheets: [] };

  // Azubi-Level- & Rang-System
  const RANKS = [
    { minXp: 0, title: '1. Lehrjahr · Neuling', icon: '🪛', nextAt: 150 },
    { minXp: 150, title: '2. Lehrjahr · Schaltschrank-Bändiger', icon: '⚡', nextAt: 400 },
    { minXp: 400, title: '3. Lehrjahr · Mess- & Prüf-Profi', icon: '📐', nextAt: 800 },
    { minXp: 800, title: 'Prüfungsanwärter Sommer 2027', icon: '🏆', nextAt: 1400 },
    { minXp: 1400, title: 'Jung-Geselle & VDE-Gott', icon: '👑', nextAt: 2200 },
    { minXp: 2200, title: 'Obermonteur / Meister-Titan', icon: '🎖️', nextAt: 99999 }
  ];

  let state = {
    xp: 0,
    boxes: {}, // questionId -> 1 (Wackelt), 2 (Im Training), 3 (Sitzt), 4 (Meister)
    activeTab: 'home',
    quizFilter: 'weak', // 'all' | 'weak' | 'quick10' | categoryId
    fachFilter: 'all', // 'all' | 'GST' | 'KoSys' | 'SG' | 'IE' | 'PuG'
    quizQueue: [],
    quizIndex: 0,
    answeredCurrent: false,
    selectedOption: null,
    currentShuffledOptions: null, // [{ text, origIdx }]
    streakDays: 1,
    lastStudyDate: '',
    roundStats: {
      total: 0,
      correct: 0,
      xpGained: 0,
      promoted: 0,
      demoted: 0,
      wrongQuestions: [],
      completedIds: []
    }
  };

  // Prüfungsfächer der Klasse EEL 12b (BS Lauingen, ISB-Lehrplan Jgst. 12/13)
  const FAECHER = [
    { id: 'all', label: 'Alle Fächer' },
    { id: 'GST', label: 'GST (LF 12/13)', title: 'Gebäudesystemtechnik' },
    { id: 'KoSys', label: 'KoSys (LF 9)', title: 'Kommunikationssysteme' },
    { id: 'SG', label: 'SG (LF 10)', title: 'System- und Gerätetechnik' },
    { id: 'IE', label: 'IE (LF 11)', title: 'Installations- und Energietechnik' },
    { id: 'PuG', label: 'PuG (WiSo)', title: 'Politik und Gesellschaft' }
  ];

  function getRank(xp) {
    for (let i = RANKS.length - 1; i >= 0; i--) {
      if (xp >= RANKS[i].minXp) return RANKS[i];
    }
    return RANKS[0];
  }

  function updateStreak() {
    const today = new Date().toISOString().slice(0, 10);
    if (!state.lastStudyDate) {
      state.lastStudyDate = today;
      state.streakDays = 1;
      return;
    }

    if (state.lastStudyDate === today) return; // Schon heute registriert

    const last = new Date(state.lastStudyDate);
    const curr = new Date(today);
    const diffDays = Math.round((curr - last) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      state.streakDays++;
    } else if (diffDays > 1) {
      state.streakDays = 1; // Streak unterbrochen
    }
    state.lastStudyDate = today;
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('elektrocoach_state_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        state.xp = parsed.xp || 0;
        state.boxes = parsed.boxes || {};
        state.streakDays = parsed.streakDays || 1;
        state.lastStudyDate = parsed.lastStudyDate || '';
        if (FAECHER.some(f => f.id === parsed.fachFilter)) state.fachFilter = parsed.fachFilter;
      }
    } catch (e) {
      console.warn('LocalStorage konnte nicht geladen werden:', e);
    }

    updateStreak();

    // Initialisiere alle Fragen: isWeakSpot startet in Box 1 ("Wackelt"), Rest in Box 2 ("Im Training")
    data.questions.forEach(q => {
      if (!state.boxes[q.id]) {
        state.boxes[q.id] = q.isWeakSpot ? 1 : 2;
      }
    });
  }

  function saveState() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          xp: state.xp,
          boxes: state.boxes,
          fachFilter: state.fachFilter,
          streakDays: state.streakDays,
          lastStudyDate: state.lastStudyDate
        })
      );
    } catch (e) {}
  }

  function addXp(amount) {
    state.xp += amount;
    saveState();
    renderHeaderStats();
    renderDashboard();
  }

  function renderHeaderStats() {
    const elXp = document.getElementById('stat-xp');
    if (elXp) elXp.textContent = state.xp;

    const rank = getRank(state.xp);
    const elRank = document.getElementById('stat-rank');
    if (elRank) {
      elRank.textContent = `${rank.icon} ${rank.title.split('·')[0].trim()}`;
      elRank.title = rank.title;
    }
  }

  function updateCountdown() {
    const el = document.getElementById('exam-countdown');
    if (!el) return;
    const examDate = new Date('2027-07-01T08:00:00');
    const now = new Date();
    const diffDays = Math.max(0, Math.ceil((examDate - now) / (1000 * 60 * 60 * 24)));
    el.textContent = `⏱️ Noch ${diffDays} Tage bis Juli 2027`;
  }

  function renderDashboard() {
    updateCountdown();
    renderHeaderStats();

    const total = data.questions.length;
    let weakCount = 0;
    let learningCount = 0;
    let safeCount = 0;

    data.questions.forEach(q => {
      const b = state.boxes[q.id] || 2;
      if (b === 1) weakCount++;
      else if (b === 2) learningCount++;
      else safeCount++;
    });

    const elMastered = document.getElementById('stat-mastered');
    if (elMastered) elMastered.textContent = `${safeCount}/${total}`;

    const setIf = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setIf('kpi-total-q', total);
    setIf('kpi-weak', weakCount);
    setIf('kpi-learning', learningCount);
    setIf('kpi-safe', safeCount);

    // Level- & Fortschrittsbalken im Hero-Bereich
    const rank = getRank(state.xp);
    const rankEl = document.getElementById('hero-rank-display');
    if (rankEl) {
      const prevXp = rank.minXp;
      const nextXp = rank.nextAt;
      const range = Math.max(1, nextXp - prevXp);
      const currentProgress = Math.min(100, Math.round(((state.xp - prevXp) / range) * 100));

      rankEl.innerHTML = `
        <div style="background:#090d16;padding:10px 14px;border-radius:12px;border:1px solid #1e293b;margin:12px 0 6px;">
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.82rem;margin-bottom:6px;">
            <span style="font-weight:800;color:var(--accent-amber);">${rank.icon} ${rank.title}</span>
            <span style="color:var(--text-muted);font-weight:700;">🔥 ${state.streakDays} Tage Streak · ${state.xp} / ${nextXp} XP</span>
          </div>
          <div class="cat-progress-bar" style="height:7px;">
            <div class="cat-progress-fill" style="width:${currentProgress}%;background:linear-gradient(90deg, #f59e0b, #10b981);"></div>
          </div>
        </div>
      `;
    }

    const catGrid = document.getElementById('categories-grid');
    if (catGrid) {
      catGrid.innerHTML = data.categories
        .map(cat => {
          const catQuestions = data.questions.filter(q => q.category === cat.id);
          const catSafe = catQuestions.filter(q => (state.boxes[q.id] || 2) >= 3).length;
          const catWeak = catQuestions.filter(q => (state.boxes[q.id] || 2) === 1).length;
          const pct = catQuestions.length ? Math.round((catSafe / catQuestions.length) * 100) : 0;

          return `
            <div class="cat-card" onclick="ElektroApp.startQuizMode('${cat.id}')">
              <div class="cat-card-top">
                <span class="cat-icon">${cat.icon}</span>
                <span class="badge ${catWeak > 0 ? 'badge-red' : 'badge-emerald'}">
                  ${catWeak > 0 ? `${catWeak} Wackel-Fragen` : `${pct}% sicher`}
                </span>
              </div>
              <h3 style="font-size:0.95rem;font-weight:800;margin-bottom:4px;">${cat.title}</h3>
              <p style="font-size:0.76rem;color:var(--text-muted);min-height:34px;">${cat.description}</p>
              <div class="cat-progress-bar">
                <div class="cat-progress-fill" style="width:${pct}%;"></div>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:0.72rem;color:var(--text-muted);margin-top:6px;">
                <span>${catSafe}/${catQuestions.length} sitzen</span>
                <span style="color:var(--accent-blue);font-weight:700;">Trainieren →</span>
              </div>
            </div>
          `;
        })
        .join('');
    }
  }

  // --------------------------------------------------------------------------
  // Quiz & Spaced Repetition (Tab 2)
  // --------------------------------------------------------------------------
  function questionsInFach() {
    if (state.fachFilter === 'all') return [...data.questions];
    return data.questions.filter(q => q.fach === state.fachFilter);
  }

  function buildQuizQueue(filter, excludeIds = []) {
    state.quizFilter = filter;
    const base = questionsInFach();
    let pool = [];

    if (filter === 'weak') {
      pool = base.filter(q => (state.boxes[q.id] || 2) === 1 || q.isWeakSpot);
      if (pool.length === 0) pool = [...base];
    } else if (filter === 'quick10') {
      // Priorisiere Box 1 und 2, schließe bereits in dieser Session gelernte aus falls genug übrig
      let available = base.filter(q => !excludeIds.includes(q.id));
      if (available.length < 5) available = [...base]; // Reset falls Pool erschöpft
      available.sort((a, b) => (state.boxes[a.id] || 2) - (state.boxes[b.id] || 2));
      pool = available.slice(0, 10);
    } else if (filter === 'all') {
      pool = [...base];
    } else {
      pool = base.filter(q => q.category === filter);
      let available = pool.filter(q => !excludeIds.includes(q.id));
      if (available.length >= 5) pool = available;
    }

    // Sortiere so, dass schwächere Fragen zuerst drankommen
    pool.sort((a, b) => (state.boxes[a.id] || 2) - (state.boxes[b.id] || 2));
    state.quizQueue = pool;
    state.quizIndex = 0;
    state.answeredCurrent = false;
    state.selectedOption = null;
    state.currentShuffledOptions = null;

    // Reset round stats
    state.roundStats = {
      total: 0,
      correct: 0,
      xpGained: 0,
      promoted: 0,
      demoted: 0,
      wrongQuestions: [],
      completedIds: [...excludeIds]
    };
  }

  function renderQuizFilterBar() {
    const bar = document.getElementById('quiz-filter-bar');
    if (!bar) return;

    const filters = [
      { id: 'weak', label: '🎯 Wackel-Themen (Box 1)' },
      { id: 'quick10', label: '☕ 10er Vesperpause' },
      { id: 'all', label: `Alle (${questionsInFach().length})` },
      ...data.categories.map(c => ({ id: c.id, label: `${c.icon} ${c.shortTitle}` }))
    ];

    bar.innerHTML = filters
      .map(
        f => `
        <button class="filter-pill ${state.quizFilter === f.id ? 'active' : ''}" onclick="ElektroApp.startQuizMode('${f.id}')">
          ${f.label}
        </button>
      `
      )
      .join('');

    const fachBar = document.getElementById('quiz-fach-bar');
    if (fachBar) {
      fachBar.innerHTML = FAECHER.map(f => {
        const count = f.id === 'all' ? data.questions.length : data.questions.filter(q => q.fach === f.id).length;
        return `
          <button class="fach-pill ${state.fachFilter === f.id ? 'active' : ''}" ${f.title ? `title="${f.title}"` : ''} onclick="ElektroApp.setFachFilter('${f.id}')">
            ${f.label} <span class="fach-pill-count">${count}</span>
          </button>
        `;
      }).join('');
    }
  }

  function setFachFilter(fach) {
    state.fachFilter = fach;
    saveState();
    buildQuizQueue(state.quizFilter);
    renderQuizCard();
  }

  function shuffleOptions(q) {
    const mapped = q.options.map((opt, i) => ({ text: opt, origIdx: i }));
    // Fisher-Yates Shuffle
    for (let i = mapped.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [mapped[i], mapped[j]] = [mapped[j], mapped[i]];
    }
    return mapped;
  }

  function renderQuizCard() {
    renderQuizFilterBar();
    const container = document.getElementById('quiz-container');
    if (!container) return;

    if (!state.quizQueue || state.quizQueue.length === 0) {
      buildQuizQueue(state.quizFilter || 'weak');
    }

    if (state.quizIndex >= state.quizQueue.length) {
      renderQuizSummaryScreen();
      return;
    }

    const q = state.quizQueue[state.quizIndex];
    if (!q) {
      container.innerHTML = `<div class="quiz-card"><p>Keine weiteren Fragen in diesem Filter gefunden.</p></div>`;
      return;
    }

    // Mische die Antwortoptionen dynamisch, damit die richtige Antwort nicht an fester Position klebt
    if (!state.currentShuffledOptions) {
      state.currentShuffledOptions = shuffleOptions(q);
    }

    const cat = data.categories.find(c => c.id === q.category);
    const boxNum = state.boxes[q.id] || 2;
    const boxLabels = {
      1: { text: 'Box 1 · Wackelt noch', cls: 'badge-red' },
      2: { text: 'Box 2 · Im Training', cls: 'badge-amber' },
      3: { text: 'Box 3 · Sitzt gut', cls: 'badge-blue' },
      4: { text: 'Box 4 · Prüfungsreif', cls: 'badge-emerald' }
    };
    const boxInfo = boxLabels[boxNum] || boxLabels[2];

    const letters = ['A', 'B', 'C', 'D'];
    const optionsHtml = state.currentShuffledOptions
      .map((item, displayIdx) => {
        let cls = 'quiz-opt-btn';
        if (state.answeredCurrent) {
          if (item.origIdx === q.correctIndex) cls += ' correct';
          else if (item.origIdx === state.selectedOption) cls += ' wrong';
        }
        return `
          <button class="${cls}" ${state.answeredCurrent ? 'disabled' : ''} onclick="ElektroApp.answerQuestion(${item.origIdx})">
            <strong>${letters[displayIdx]})</strong> ${item.text}
          </button>
        `;
      })
      .join('');

    let explanationHtml = '';
    if (state.answeredCurrent) {
      const isRight = state.selectedOption === q.correctIndex;
      explanationHtml = `
        <div class="quiz-explanation">
          <div style="font-weight:800;margin-bottom:6px;color:${isRight ? '#34d399' : '#fca5a5'};">
            ${
              isRight
                ? '✅ Stark! +15 XP – Karte wandert eine Leitner-Box höher!'
                : '❌ Noch wackelig! Kein Problem – Karte kommt in Box 1 zum Wiederholen:'
            }
          </div>
          <p><strong>Baustellen-Erklärung:</strong> ${q.explanation}</p>
          ${q.formula ? `<div class="quiz-formula-box">📐 ${q.formula}</div>` : ''}
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;flex-wrap:wrap;gap:8px;">
            <small style="color:var(--text-muted);">Quelle: ${q.source || 'Fachkunde Elektrotechnik'}</small>
            <button class="btn-primary btn-sm" onclick="ElektroApp.nextQuestion()">
              ${state.quizIndex + 1 < state.quizQueue.length ? `Nächste Frage (${state.quizIndex + 1}/${state.quizQueue.length}) →` : 'Runde abschließen 🏆 →'}
            </button>
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="quiz-card">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">
          <div>
            <span class="badge badge-blue">${cat ? `${cat.icon} ${cat.title}` : q.category}</span>
            <span class="badge ${boxInfo.cls}">${boxInfo.text}</span>
            ${q.isWeakSpot ? `<span class="badge badge-red">⚡ Fokus-Thema</span>` : ''}
          </div>
          <div class="quiz-card-meta">
            ${q.fach ? `<span class="fach-badge fach-${q.fach}" title="${(FAECHER.find(f => f.id === q.fach) || {}).title || ''}">${q.fach}</span>` : ''}
            <small style="color:var(--text-muted);font-weight:700;">
              Frage ${state.quizIndex + 1} von ${state.quizQueue.length}
            </small>
          </div>
        </div>

        <div class="quiz-question-title">${q.question}</div>
        <div class="quiz-options">${optionsHtml}</div>
        ${explanationHtml}
      </div>
    `;
  }

  function answerQuestion(origIdx) {
    if (state.answeredCurrent) return;
    const q = state.quizQueue[state.quizIndex];
    if (!q) return;

    state.answeredCurrent = true;
    state.selectedOption = origIdx;

    state.roundStats.total++;
    state.roundStats.completedIds.push(q.id);

    const currentBox = state.boxes[q.id] || 2;
    if (origIdx === q.correctIndex) {
      state.roundStats.correct++;
      state.roundStats.xpGained += 15;
      state.roundStats.promoted++;
      state.boxes[q.id] = Math.min(4, currentBox + 1);
      addXp(15);
    } else {
      state.roundStats.demoted++;
      state.roundStats.wrongQuestions.push(q);
      state.boxes[q.id] = 1; // Zurück in Box 1 ("Wackelt")
    }

    saveState();
    renderDashboard();
    renderQuizCard();
  }

  function nextQuestion() {
    if (state.quizIndex + 1 < state.quizQueue.length) {
      state.quizIndex++;
      state.answeredCurrent = false;
      state.selectedOption = null;
      state.currentShuffledOptions = null;
      renderQuizCard();
    } else {
      // Runde beendet! Kein Endlos-Loop auf dieselben 10 Fragen, sondern Runden-Screen!
      renderQuizSummaryScreen();
    }
  }

  function renderQuizSummaryScreen() {
    const container = document.getElementById('quiz-container');
    if (!container) return;

    const stats = state.roundStats;
    const total = Math.max(1, stats.total);
    const pct = Math.round((stats.correct / total) * 100);
    const rank = getRank(state.xp);

    container.innerHTML = `
      <div class="quiz-summary-card">
        <div class="summary-badge-icon">${pct >= 80 ? '🏆' : pct >= 50 ? '⚡' : '💪'}</div>
        <h2 style="font-size:1.3rem;font-weight:800;margin-bottom:4px;">Runde abgeschlossen!</h2>
        <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:16px;">
          Du hast <strong>${stats.correct} von ${total}</strong> Fragen richtig beantwortet (${pct}%).
        </p>

        <div class="summary-kpis">
          <div class="summary-kpi">
            <span style="font-size:1.3rem;font-weight:800;color:var(--accent-emerald);">+${stats.xpGained}</span>
            <small>XP verdient</small>
          </div>
          <div class="summary-kpi">
            <span style="font-size:1.3rem;font-weight:800;color:var(--accent-blue);">⬆️ ${stats.promoted}</span>
            <small>Aufgestiegen</small>
          </div>
          <div class="summary-kpi">
            <span style="font-size:1.3rem;font-weight:800;color:${stats.demoted > 0 ? '#f87171' : 'var(--text-muted)'};">
              ${stats.demoted > 0 ? `⬇️ ${stats.demoted}` : '0'}
            </span>
            <small>In Box 1</small>
          </div>
        </div>

        <div style="background:#090d16;padding:12px;border-radius:12px;border:1px solid #1e293b;margin:14px 0 16px;text-align:left;">
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.82rem;margin-bottom:4px;">
            <strong style="color:var(--accent-amber);">${rank.icon} ${rank.title}</strong>
            <span style="color:var(--text-muted);font-weight:700;">${state.xp} XP</span>
          </div>
          <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">
            🔥 <strong>${state.streakDays} Tage Streak!</strong> Dranbleiben zahlt sich im Juli 2027 aus.
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:10px;">
          <button class="btn-primary" onclick="ElektroApp.startNextRound()">
            🔄 Nächste 10 frische Fragen starten →
          </button>
          ${
            stats.wrongQuestions.length > 0
              ? `
            <button class="btn-secondary" onclick="ElektroApp.repeatWrongQuestions()">
              🎯 Nur die ${stats.wrongQuestions.length} Fehler wiederholen
            </button>
          `
              : ''
          }
          <button class="btn-secondary" onclick="ElektroApp.switchTab('home')">
            🏠 Zurück zum Radar
          </button>
        </div>
      </div>
    `;
  }

  function startNextRound() {
    // Ziehe neue 10 Fragen, schließe die gerade beantworteten aus
    buildQuizQueue(state.quizFilter, state.roundStats.completedIds);
    renderQuizCard();
  }

  function repeatWrongQuestions() {
    if (!state.roundStats.wrongQuestions || state.roundStats.wrongQuestions.length === 0) return;
    state.quizQueue = [...state.roundStats.wrongQuestions];
    state.quizIndex = 0;
    state.answeredCurrent = false;
    state.selectedOption = null;
    state.currentShuffledOptions = null;
    state.roundStats = {
      total: 0,
      correct: 0,
      xpGained: 0,
      promoted: 0,
      demoted: 0,
      wrongQuestions: [],
      completedIds: []
    };
    renderQuizCard();
  }

  // --------------------------------------------------------------------------
  // Tab 4: Schnellrechner & Spickzettel
  // --------------------------------------------------------------------------
  function renderCalculatorsAndCheats() {
    const calcEl = document.getElementById('quick-calculators');
    if (calcEl) {
      calcEl.innerHTML = `
        <div class="sim-controls-grid">
          <div style="background:#0f172a;padding:12px;border-radius:12px;border:1px solid #1e293b;">
            <h4 style="font-size:0.9rem;margin-bottom:8px;">⚙️ 1. Schlupf & Synchrondrehzahl (DSAM)</h4>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
              <div>
                <label style="font-size:0.72rem;color:var(--text-muted);">Polpaarzahl p (1, 2, 3)</label>
                <input type="number" id="calc-p" class="calc-input" value="2" min="1" max="8" oninput="ElektroApp.runQuickCalcs()"/>
              </div>
              <div>
                <label style="font-size:0.72rem;color:var(--text-muted);">Läuferdrehzahl n (min⁻¹)</label>
                <input type="number" id="calc-n" class="calc-input" value="1440" oninput="ElektroApp.runQuickCalcs()"/>
              </div>
            </div>
            <div id="calc-slip-res" class="quiz-formula-box"></div>
          </div>

          <div style="background:#0f172a;padding:12px;border-radius:12px;border:1px solid #1e293b;">
            <h4 style="font-size:0.9rem;margin-bottom:8px;">📏 2. Spannungsfall ΔU (Cu, γ = 56)</h4>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:8px;">
              <div>
                <label style="font-size:0.72rem;color:var(--text-muted);">Länge l (m)</label>
                <input type="number" id="calc-l" class="calc-input" value="25" oninput="ElektroApp.runQuickCalcs()"/>
              </div>
              <div>
                <label style="font-size:0.72rem;color:var(--text-muted);">Strom I (A)</label>
                <input type="number" id="calc-i" class="calc-input" value="16" oninput="ElektroApp.runQuickCalcs()"/>
              </div>
              <div>
                <label style="font-size:0.72rem;color:var(--text-muted);">Querschnitt A (mm²)</label>
                <input type="number" id="calc-a" class="calc-input" value="2.5" step="0.5" oninput="ElektroApp.runQuickCalcs()"/>
              </div>
            </div>
            <div id="calc-du-res" class="quiz-formula-box"></div>
          </div>
        </div>
      `;
      runQuickCalcs();
    }

    const cheatsEl = document.getElementById('cheatsheets-container');
    if (cheatsEl && data.cheatSheets) {
      cheatsEl.innerHTML = data.cheatSheets
        .map(
          cs => `
          <div style="background:#0f172a;border:1px solid #23314f;border-radius:14px;padding:15px;margin-bottom:12px;">
            <h3 style="font-size:0.98rem;font-weight:800;color:var(--accent-blue);margin-bottom:8px;">${cs.title}</h3>
            <div style="display:grid;gap:6px;margin-bottom:10px;">
              ${(cs.formulas || [])
                .map(
                  f => `
                <div style="background:#090d16;padding:7px 10px;border-radius:8px;border:1px solid #1e293b;font-size:0.8rem;">
                  <strong style="color:var(--text-muted);">${f.label}:</strong>
                  <span style="color:var(--accent-amber);font-family:monospace;margin-left:6px;">${f.formula}</span>
                </div>
              `
                )
                .join('')}
            </div>
            <p style="font-size:0.82rem;background:rgba(16,185,129,0.1);border-left:3px solid var(--accent-emerald);padding:8px 10px;border-radius:6px;margin-bottom:8px;">
              <strong>👷 Baustellen-Praxis:</strong> ${cs.siteTip}
            </p>
            <ul style="padding-left:18px;font-size:0.8rem;color:var(--text-muted);">
              ${(cs.mnemonics || []).map(m => `<li>${m}</li>`).join('')}
            </ul>
          </div>
        `
        )
        .join('');
    }
  }

  function runQuickCalcs() {
    const p = parseFloat(document.getElementById('calc-p')?.value) || 2;
    const n = parseFloat(document.getElementById('calc-n')?.value) || 1440;
    const ns = Math.round((60 * 50) / p);
    const slip = (((ns - n) / ns) * 100).toFixed(1);
    const slipEl = document.getElementById('calc-slip-res');
    if (slipEl) {
      slipEl.innerHTML = `n_s = ${ns} min⁻¹ · Schlupf s = <strong>${slip} %</strong>`;
    }

    const l = parseFloat(document.getElementById('calc-l')?.value) || 25;
    const i = parseFloat(document.getElementById('calc-i')?.value) || 16;
    const a = parseFloat(document.getElementById('calc-a')?.value) || 2.5;
    const du1Ph = ((2 * l * i * 1.0) / (56 * a)).toFixed(2);
    const du1Pct = ((du1Ph / 230) * 100).toFixed(2);
    const du3Ph = ((Math.sqrt(3) * l * i * 1.0) / (56 * a)).toFixed(2);
    const du3Pct = ((du3Ph / 400) * 100).toFixed(2);
    const duEl = document.getElementById('calc-du-res');
    if (duEl) {
      duEl.innerHTML = `230V (1~): <strong>${du1Ph} V (${du1Pct} %)</strong><br>400V (3~): <strong>${du3Ph} V (${du3Pct} %)</strong>`;
    }
  }

  function switchTab(tabId) {
    state.activeTab = tabId;
    document.querySelectorAll('.tab-panel').forEach(el => {
      el.classList.toggle('active', el.id === `tab-${tabId}`);
    });
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    if (tabId === 'home') renderDashboard();
    if (tabId === 'quiz') renderQuizCard();
    if (tabId === 'sim' && window.ElektroSimulators) {
      window.ElektroSimulators.renderAll('simulators-container');
    }
    if (tabId === 'math' && window.ElektroMathTrainer) {
      window.ElektroMathTrainer.render();
    }
    if (tabId === 'cheats') renderCalculatorsAndCheats();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function startQuizMode(filter) {
    buildQuizQueue(filter);
    switchTab('quiz');
  }

  function init() {
    loadState();
    renderDashboard();
    buildQuizQueue('weak');
    if (window.ElektroSimulators) {
      window.ElektroSimulators.renderAll('simulators-container');
    }
    if (window.ElektroMathTrainer) {
      window.ElektroMathTrainer.init();
    }
    renderCalculatorsAndCheats();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  document.addEventListener('DOMContentLoaded', init);

  return {
    switchTab,
    startQuizMode,
    setFachFilter,
    answerQuestion,
    nextQuestion,
    startNextRound,
    repeatWrongQuestions,
    runQuickCalcs,
    addXp
  };
})();
