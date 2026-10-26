// ============================================================================
// ElektroCoach PRO – Hauptlogik, Spaced Repetition (Leitner Box 1–4) & Rechner
// ============================================================================

window.ElektroApp = (function () {
  const STORAGE_KEY = 'elektrocoach_state_v1';
  const data = window.ELEKTRO_DATA || { categories: [], questions: [], cheatSheets: [] };

  let state = {
    xp: 0,
    boxes: {}, // questionId -> 1 (Wackelt), 2 (Im Training), 3 (Sitzt), 4 (Meister)
    activeTab: 'home',
    quizFilter: 'weak', // 'all' | 'weak' | 'quick10' | categoryId
    quizQueue: [],
    quizIndex: 0,
    answeredCurrent: false,
    selectedOption: null
  };

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        state.xp = parsed.xp || 0;
        state.boxes = parsed.boxes || {};
      }
    } catch (e) {
      console.warn('LocalStorage konnte nicht geladen werden:', e);
    }

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
          boxes: state.boxes
        })
      );
    } catch (e) {}
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

    document.getElementById('stat-xp').textContent = state.xp;
    document.getElementById('stat-mastered').textContent = `${safeCount}/${total}`;
    document.getElementById('kpi-total-q').textContent = total;
    document.getElementById('kpi-weak').textContent = weakCount;
    document.getElementById('kpi-learning').textContent = learningCount;
    document.getElementById('kpi-safe').textContent = safeCount;

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
  function buildQuizQueue(filter) {
    state.quizFilter = filter;
    let pool = [];
    if (filter === 'weak') {
      pool = data.questions.filter(q => (state.boxes[q.id] || 2) === 1 || q.isWeakSpot);
      if (pool.length === 0) pool = [...data.questions];
    } else if (filter === 'quick10') {
      // Priorisiere Box 1 und Box 2, mische auf 10 Fragen
      const sorted = [...data.questions].sort((a, b) => (state.boxes[a.id] || 2) - (state.boxes[b.id] || 2));
      pool = sorted.slice(0, 10);
    } else if (filter === 'all') {
      pool = [...data.questions];
    } else {
      pool = data.questions.filter(q => q.category === filter);
    }

    // Sortiere so, dass Box 1 zuerst kommt
    pool.sort((a, b) => (state.boxes[a.id] || 2) - (state.boxes[b.id] || 2));
    state.quizQueue = pool;
    state.quizIndex = 0;
    state.answeredCurrent = false;
    state.selectedOption = null;
  }

  function renderQuizFilterBar() {
    const bar = document.getElementById('quiz-filter-bar');
    if (!bar) return;

    const filters = [
      { id: 'weak', label: '🎯 Wackel-Themen (Box 1)' },
      { id: 'quick10', label: '☕ 10er Vesperpause' },
      { id: 'all', label: `Alle (${data.questions.length})` },
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
  }

  function renderQuizCard() {
    renderQuizFilterBar();
    const container = document.getElementById('quiz-container');
    if (!container) return;

    if (!state.quizQueue || state.quizQueue.length === 0) {
      buildQuizQueue(state.quizFilter || 'weak');
    }

    const q = state.quizQueue[state.quizIndex];
    if (!q) {
      container.innerHTML = `<div class="quiz-card"><p>Keine Fragen in diesem Filter gefunden.</p></div>`;
      return;
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
    const optionsHtml = q.options
      .map((opt, idx) => {
        let cls = 'quiz-opt-btn';
        if (state.answeredCurrent) {
          if (idx === q.correctIndex) cls += ' correct';
          else if (idx === state.selectedOption) cls += ' wrong';
        }
        return `
          <button class="${cls}" ${state.answeredCurrent ? 'disabled' : ''} onclick="ElektroApp.answerQuestion(${idx})">
            <strong>${letters[idx]})</strong> ${opt}
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
              Nächste Frage (${state.quizIndex + 1}/${state.quizQueue.length}) →
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
          <small style="color:var(--text-muted);font-weight:700;">
            Frage ${state.quizIndex + 1} von ${state.quizQueue.length}
          </small>
        </div>

        <div class="quiz-question-title">${q.question}</div>
        <div class="quiz-options">${optionsHtml}</div>
        ${explanationHtml}
      </div>
    `;
  }

  function answerQuestion(optIndex) {
    if (state.answeredCurrent) return;
    const q = state.quizQueue[state.quizIndex];
    if (!q) return;

    state.answeredCurrent = true;
    state.selectedOption = optIndex;

    const currentBox = state.boxes[q.id] || 2;
    if (optIndex === q.correctIndex) {
      state.xp += 15;
      state.boxes[q.id] = Math.min(4, currentBox + 1);
    } else {
      state.boxes[q.id] = 1; // Zurück in Box 1 ("Wackelt")
    }

    saveState();
    renderDashboard();
    renderQuizCard();
  }

  function nextQuestion() {
    if (state.quizIndex + 1 < state.quizQueue.length) {
      state.quizIndex++;
    } else {
      state.quizIndex = 0;
    }
    state.answeredCurrent = false;
    state.selectedOption = null;
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
                <label style="font-size:0.72rem;color:var(--text-muted);">Läufedrehzahl n (min⁻¹)</label>
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
    renderCalculatorsAndCheats();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  document.addEventListener('DOMContentLoaded', init);

  return {
    switchTab,
    startQuizMode,
    answerQuestion,
    nextQuestion,
    runQuickCalcs
  };
})();
