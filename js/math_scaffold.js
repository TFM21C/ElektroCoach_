// ============================================================================
// ElektroCoach PRO – Baustellen-Mathe: Geführter Einstieg (eigenständiges Modul)
// 1. Modus 'basics':         1×1 Fundament & Kopfrechen-Basics in 4 Stufen + Mix
//                            (Streak, ermutigendes Feedback, Rechenweg-Tipps, +10 XP)
// 2. Modus 'division_guide': Schriftliche Division Schritt für Schritt
//                            (Zustandsautomat mit Vor/Zurück, Tafel-Ansicht,
//                            Herunterhol-Pfeil, Erklärung bei falscher Wahl)
// 3. API: ElektroMathScaffold.render(containerEl) / ElektroMathScaffold.destroy()
// ============================================================================

window.ElektroMathScaffold = (function () {
  'use strict';

  const MAX_DECIMALS = 2;
  const AUTO_NEXT_MS = 900;
  const DIVISION_XP = 20;
  const BASICS_XP = 10;

  // --------------------------------------------------------------------------
  // Divisionsaufgaben (555 : 12 ist das Standard-Beispiel)
  // --------------------------------------------------------------------------
  const TASKS = [
    { dividend: 555, divisor: 12, level: 'Start', note: 'mit Komma' },
    { dividend: 625, divisor: 25, level: 'leicht', note: 'geht glatt auf' },
    { dividend: 768, divisor: 16, level: 'leicht', note: 'geht glatt auf' },
    { dividend: 435, divisor: 15, level: 'mittel', note: 'großer Rest' },
    { dividend: 840, divisor: 14, level: 'mittel', note: 'Null im Ergebnis' },
    { dividend: 989, divisor: 12, level: 'knifflig', note: 'geht nicht auf' }
  ];

  // --------------------------------------------------------------------------
  // 1×1-Stufen
  // --------------------------------------------------------------------------
  const LEVELS = {
    klein:  { label: 'Stufe 1', name: 'Kleines 1×1', icon: '🌱' },
    gross:  { label: 'Stufe 2', name: 'Großes 1×1', icon: '💪' },
    doppel: { label: 'Stufe 3', name: 'Verdoppeln & Halbieren', icon: '⚖️' },
    zehner: { label: 'Stufe 4', name: 'Zehnerpotenzen', icon: '🔟' },
    mix:    { label: 'Mix', name: 'Alles gemischt', icon: '🎲' }
  };
  const LEVEL_ORDER = ['klein', 'gross', 'doppel', 'zehner', 'mix'];

  const PRAISE = [
    'Stark! 💪', 'Sitzt! ✅', 'Sauber gerechnet! 👌', 'Genau so! ⚡', 'Läuft bei dir! 🚀',
    'Richtig – weiter so! 🙌', 'Top! Wie ein Meister! 🏆'
  ];
  const COMFORT = [
    'Kein Problem – genau dafür üben wir!',
    'Fast! Schau dir den Rechenweg an:',
    'Passiert jedem – so geht\'s leichter:'
  ];

  // --------------------------------------------------------------------------
  // Zustand
  // --------------------------------------------------------------------------
  const state = {
    mode: 'division_guide',
    div: null,
    basics: {
      level: 'klein',
      q: null,
      answered: false,
      picked: -1,
      streak: 0,
      best: 0,
      right: 0,
      total: 0,
      msg: '',
      suggest: null
    }
  };

  let root = null;
  let clickHandler = null;
  let autoTimer = null;

  // --------------------------------------------------------------------------
  // Hilfsfunktionen
  // --------------------------------------------------------------------------
  function rand(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function round3(n) {
    return Math.round(n * 1000) / 1000;
  }

  // Deutsche Schreibweise: Komma statt Punkt
  function fmt(n) {
    return String(round3(n)).replace('.', ',');
  }

  function giveXp(amount) {
    if (window.ElektroApp && typeof window.ElektroApp.addXp === 'function') {
      window.ElektroApp.addXp(amount);
    }
  }

  function clearTimer() {
    if (autoTimer) {
      clearTimeout(autoTimer);
      autoTimer = null;
    }
  }

  // ==========================================================================
  // TEIL 1: Geführte schriftliche Division
  // ==========================================================================

  // Zerlegt eine Division in Teilschritte. Jeder Schritt:
  // kind: 'first' | 'down' | 'decimal_first' | 'decimal'
  // current/curStr: Zahl, in die geteilt wird · col: rechte Spalte auf der Tafel
  // q/product/rest: Ergebnisziffer, Zwischenprodukt, Rest
  function buildSteps(dividend, divisor) {
    const digits = String(dividend).split('').map(Number);
    const steps = [];

    let k = 1;
    let cur = digits[0];
    while (cur < divisor && k < digits.length) {
      cur = cur * 10 + digits[k];
      k++;
    }
    const prefix = k > 1 ? Math.floor(cur / 10) : null;
    pushStep(steps, divisor, { kind: 'first', current: cur, curStr: String(cur), col: k - 1, taken: k, prefix: prefix });

    let idx = k;
    let dec = 0;
    for (;;) {
      const prevRest = steps[steps.length - 1].rest;
      if (idx < digits.length) {
        const d = digits[idx];
        pushStep(steps, divisor, {
          kind: 'down', current: prevRest * 10 + d, curStr: String(prevRest) + d,
          col: idx, broughtIdx: idx, digit: d, prevRest: prevRest
        });
        idx++;
      } else if (prevRest !== 0 && dec < MAX_DECIMALS) {
        dec++;
        pushStep(steps, divisor, {
          kind: dec === 1 ? 'decimal_first' : 'decimal', current: prevRest * 10, curStr: String(prevRest) + '0',
          col: digits.length - 1 + dec, digit: 0, prevRest: prevRest
        });
      } else {
        break;
      }
    }
    return steps;
  }

  function pushStep(steps, divisor, s) {
    s.q = Math.floor(s.current / divisor);
    s.product = s.q * divisor;
    s.rest = s.current - s.product;
    s.options = [s.q - 1, s.q, s.q + 1].filter(v => v >= 0 && v <= 9);
    steps.push(s);
  }

  function isDecimal(s) {
    return s.kind === 'decimal_first' || s.kind === 'decimal';
  }

  function quotientString(steps, upto) {
    let out = '';
    for (let i = 0; i <= upto && i < steps.length; i++) {
      if (steps[i].kind === 'decimal_first') out += ',';
      out += steps[i].q;
    }
    return out;
  }

  function loadTask(idx) {
    const prevXp = state.div ? state.div.xpGiven : {};
    const task = TASKS[idx];
    state.div = {
      taskIdx: idx,
      task: task,
      steps: buildSteps(task.dividend, task.divisor),
      cursor: 0,
      solved: [],
      wrong: [],
      lastWrong: [],
      mistakes: 0,
      showHelp: false,
      animCursor: -1,
      xpGiven: prevXp
    };
  }

  function divPick(val) {
    const d = state.div;
    const s = d.steps[d.cursor];
    if (!s || d.solved[d.cursor]) return;
    if (val === s.q) {
      d.solved[d.cursor] = true;
      d.lastWrong[d.cursor] = null;
    } else {
      if (!d.wrong[d.cursor]) d.wrong[d.cursor] = [];
      if (d.wrong[d.cursor].indexOf(val) === -1) {
        d.wrong[d.cursor].push(val);
        d.mistakes++;
      }
      d.lastWrong[d.cursor] = val;
    }
    draw();
  }

  function divNext() {
    const d = state.div;
    if (d.cursor >= d.steps.length || !d.solved[d.cursor]) return;
    d.cursor++;
    if (d.cursor === d.steps.length && !d.xpGiven[d.taskIdx]) {
      d.xpGiven[d.taskIdx] = true;
      giveXp(DIVISION_XP);
    }
    draw();
  }

  function divPrev() {
    const d = state.div;
    if (d.cursor <= 0) return;
    d.cursor--;
    draw();
  }

  // Erklärt, warum eine Wahl zu groß oder zu klein ist
  function wrongExplanation(s, divisor, val) {
    const p = val * divisor;
    if (val > s.q) {
      return `${val} × ${divisor} = <b>${p}</b> – das ist größer als <b>${s.current}</b>! ` +
        `Also passt ${divisor} nur <b>${s.q}-mal</b> rein.`;
    }
    const r = s.current - p;
    return `${val} × ${divisor} = ${p}. Rest wäre ${s.current} − ${p} = <b>${r}</b> – ` +
      `der Rest ist ${r === divisor ? 'genauso groß wie' : 'größer als'} <b>${divisor}</b>! ` +
      `Da passt die ${divisor} also noch mindestens einmal mehr rein.`;
  }

  function questionText(s, divisor) {
    const ask = ` Wie oft passt <b>${divisor}</b> in <b>${s.current}</b>?`;
    switch (s.kind) {
      case 'first':
        if (s.prefix !== null) {
          return `Die <b>${divisor}</b> passt nicht in <b>${s.prefix}</b> – zu klein! ` +
            `Also nehmen wir die ersten ${s.taken} Ziffern: <b>${s.current}</b>.` + ask;
        }
        return `Wir starten ganz links mit <b>${s.current}</b>.` + ask;
      case 'down':
        return `Zieh die <b>${s.digit}</b> herunter → <b>${s.current}</b>!` + ask;
      case 'decimal_first':
        return `Ziffern aufgebraucht – aber es bleibt Rest ${s.prevRest}! Was machen wir jetzt? → ` +
          `<b>Komma</b> im Ergebnis setzen und eine <b>0</b> an die ${s.prevRest} anhängen = <b>${s.current}</b>!` + ask;
      default:
        return `Wieder eine <b>0</b> anhängen = <b>${s.current}</b>!` + ask;
    }
  }

  // ---- Tafel ---------------------------------------------------------------
  function emptyRow(cols) {
    const row = [];
    for (let i = 0; i <= cols; i++) row.push({ ch: '', cls: [] });
    return row;
  }

  // Schreibt str rechtsbündig bis Spalte endCol (Index 0 im Array = Vorzeichen-Spalte)
  function place(row, str, endCol, cls) {
    const start = endCol - str.length + 1;
    for (let j = 0; j < str.length; j++) {
      const cell = row[start + 1 + j];
      if (!cell) continue;
      cell.ch = str[j];
      if (cls) cell.cls.push(cls);
    }
    return start; // Index der Vorzeichen-Zelle
  }

  function rowHtml(row, extra) {
    return '<div class="ems-row">' +
      row.map(c => `<span class="ems-cell ${c.cls.join(' ')}">${c.ch}</span>`).join('') +
      (extra || '') + '</div>';
  }

  function boardHtml(d, animate) {
    const t = d.task;
    const steps = d.steps;
    const n = steps.length;
    const digits = String(t.dividend).split('');
    const decCount = steps.filter(isDecimal).length;
    const cols = digits.length + decCount;
    const done = d.cursor >= n;
    const active = done ? -1 : d.cursor;
    const act = done ? null : steps[active];
    const last = done ? n - 1 : active;

    // Zeile 0: Dividend : Divisor = Ergebnis
    const head = [{ ch: '', cls: [] }];
    digits.forEach((ch, i) => {
      const cls = [];
      if (active === 0 && i < act.taken) cls.push('is-active');
      if (act && act.kind === 'down' && act.broughtIdx === i) {
        cls.push('is-pulled');
        if (animate) cls.push('is-anim');
      }
      head.push({ ch: ch, cls: cls });
    });

    let quot = '';
    for (let i = 0; i <= last; i++) {
      if (steps[i].kind === 'decimal_first') quot += '<span class="ems-q is-comma">,</span>';
      const known = done || i < active || d.solved[i];
      quot += known
        ? `<span class="ems-q${i === active ? ' is-new' : ''}">${steps[i].q}</span>`
        : '<span class="ems-q is-ask">?</span>';
    }
    if (done && steps[n - 1].rest !== 0) {
      const rounded = (Math.round(t.dividend / t.divisor * 100) / 100).toFixed(2).replace('.', ',');
      quot += `<span class="ems-q">…</span><span class="ems-approx">≈ ${rounded}</span>`;
    }
    const tail = `<span class="ems-op">:</span><span class="ems-divisor">${t.divisor}</span>` +
      `<span class="ems-op">=</span><span class="ems-quot">${quot}</span>`;

    let html = rowHtml(head, tail);

    // Teilschritte
    for (let i = 0; i <= last; i++) {
      const s = steps[i];
      const showCalc = done || i < active || d.solved[i];

      if (i > 0) {
        const row = emptyRow(cols);
        place(row, s.curStr, s.col, i === active ? 'is-active' : '');
        const dropCell = row[s.col + 1];
        dropCell.cls.push('is-drop');
        if (isDecimal(s)) dropCell.cls.push('is-zero');
        if (i === active && animate) dropCell.cls.push('is-anim');
        html += rowHtml(row);
      }

      if (showCalc) {
        const row = emptyRow(cols);
        const signIdx = place(row, String(s.product), s.col, 'is-prod');
        row[signIdx].ch = '−';
        row[signIdx].cls.push('is-prod');
        for (let c = signIdx; c <= s.col + 1; c++) row[c].cls.push('is-line');
        html += rowHtml(row);

        if (i === last) {
          const restRow = emptyRow(cols);
          place(restRow, String(s.rest), s.col, done ? 'is-final' : 'is-rest');
          html += rowHtml(restRow);
        }
      }
    }

    return `<div class="ems-board" role="img" aria-label="Schriftliche Division ${t.dividend} geteilt durch ${t.divisor}">${html}</div>`;
  }

  function stepPanelHtml(d) {
    const t = d.task;
    const s = d.steps[d.cursor];
    const i = d.cursor;
    const n = d.steps.length;
    const solved = !!d.solved[i];
    const wrongs = d.wrong[i] || [];

    const opts = s.options.map(v => {
      let cls = 'ems-opt';
      if (solved && v === s.q) cls += ' is-right';
      if (wrongs.indexOf(v) !== -1) cls += ' is-wrong';
      const dis = solved || wrongs.indexOf(v) !== -1 ? ' disabled' : '';
      return `<button type="button" class="${cls}" data-action="pick" data-val="${v}"${dis}>${v}</button>`;
    }).join('');

    let feedback = '';
    if (solved) {
      const isLast = i === n - 1;
      let end = '';
      if (isLast && s.rest === 0) end = '<div class="ems-done-line">Rest 0 – FERTIG! 🎉</div>';
      else if (isLast) end = `<div class="ems-done-line">Rest ${s.rest} – geht nicht auf. Nach ${MAX_DECIMALS} Nachkommastellen hören wir auf und runden.</div>`;
      feedback = `<div class="ems-fb is-ok">
          <div>✔ Richtig! Zwischenrechnung:</div>
          <div class="ems-calc">${s.q} × ${t.divisor} = <b>${s.product}</b></div>
          <div class="ems-calc">Rest: ${s.current} − ${s.product} = <b>${s.rest}</b></div>
          ${end}
        </div>`;
    } else if (d.lastWrong[i] !== null && d.lastWrong[i] !== undefined) {
      feedback = `<div class="ems-fb is-bad">🤔 ${wrongExplanation(s, t.divisor, d.lastWrong[i])}</div>`;
    }

    let zeroHint = '';
    if (!solved && s.current < t.divisor) {
      zeroHint = `<div class="ems-hint">💡 Ist die Zahl kleiner als ${t.divisor}, passt die ${t.divisor} <b>0-mal</b> – ` +
        'die 0 kommt trotzdem ins Ergebnis!</div>';
    }

    const help = d.showHelp
      ? `<div class="ems-help">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(m =>
          `<span>${m} × ${t.divisor} = <b>${m * t.divisor}</b></span>`).join('')}</div>`
      : '';

    return `
      <div class="ems-panel">
        <div class="ems-stepline">Teilschritt ${i + 1} von ${n}</div>
        <p class="ems-question">${questionText(s, t.divisor)}</p>
        ${zeroHint}
        <div class="ems-opts" role="group" aria-label="Antwort wählen">${opts}</div>
        <div aria-live="polite">${feedback}</div>
        <div class="ems-tools">
          <button type="button" class="ems-link" data-action="help" aria-pressed="${d.showHelp}">
            ${d.showHelp ? '🙈 Hilfsreihe ausblenden' : `📋 Hilfsreihe: 1×1 der ${t.divisor}`}
          </button>
          <button type="button" class="ems-link" data-action="to-basics">✖️ Erst 1×1 üben</button>
        </div>
        ${help}
        <div class="ems-nav">
          <button type="button" class="ems-btn ems-btn-ghost" data-action="prev"${i === 0 ? ' disabled' : ''}>← Zurück</button>
          <button type="button" class="ems-btn" data-action="next"${solved ? '' : ' disabled'}>
            ${i === n - 1 ? 'Ergebnis ansehen 🎉' : 'Weiter →'}
          </button>
        </div>
      </div>`;
  }

  function finalPanelHtml(d) {
    const t = d.task;
    const steps = d.steps;
    const q = quotientString(steps, steps.length - 1);
    const exact = steps[steps.length - 1].rest === 0;
    let result;
    let probe;
    if (exact) {
      result = `${t.dividend} : ${t.divisor} = <b>${q}</b>`;
      const back = round3(Number(q.replace(',', '.')) * t.divisor);
      probe = `Probe: ${q} × ${t.divisor} = ${fmt(back)} ✔`;
    } else {
      const rounded = (Math.round(t.dividend / t.divisor * 100) / 100).toFixed(2).replace('.', ',');
      result = `${t.dividend} : ${t.divisor} = ${q}… ≈ <b>${rounded}</b>`;
      probe = `Gerundet auf ${MAX_DECIMALS} Nachkommastellen – auf der Baustelle reicht das locker. ` +
        `Probe: ${rounded} × ${t.divisor} ≈ ${t.dividend} ✔`;
    }
    const praise = d.mistakes === 0
      ? '🏆 Ohne einen einzigen Fehlversuch – stark!'
      : `Du hast ${d.mistakes} Fehlversuch${d.mistakes === 1 ? '' : 'e'} gebraucht – und trotzdem alles selbst gelöst. Genau so lernt man's!`;
    const hasNext = d.taskIdx < TASKS.length - 1;

    return `
      <div class="ems-panel ems-final" aria-live="polite">
        <div class="ems-final-title">🎉 FERTIG!</div>
        <div class="ems-final-result">${result}</div>
        <div class="ems-final-probe">${probe}</div>
        <div class="ems-final-praise">${praise}${d.xpGiven[d.taskIdx] ? ` <span class="ems-xp">+${DIVISION_XP} XP</span>` : ''}</div>
        <div class="ems-recap">
          <b>Merke – das Schema:</b>
          <ol>
            <li>Wie oft passt der Teiler rein? (1×1!)</li>
            <li>Malnehmen und abziehen → Rest</li>
            <li>Nächste Ziffer herunterholen – sind keine mehr da: Komma setzen und 0 anhängen</li>
            <li>Wiederholen, bis der Rest 0 ist (oder genug Nachkommastellen da sind)</li>
          </ol>
        </div>
        <div class="ems-nav">
          <button type="button" class="ems-btn ems-btn-ghost" data-action="prev">← Zurück</button>
          <button type="button" class="ems-btn ems-btn-ghost" data-action="restart">⟲ Nochmal</button>
          ${hasNext ? '<button type="button" class="ems-btn" data-action="next-task">Nächste Aufgabe →</button>' : ''}
        </div>
      </div>`;
  }

  function divisionHtml() {
    if (!state.div) loadTask(0);
    const d = state.div;
    const animate = d.animCursor !== d.cursor;
    d.animCursor = d.cursor;
    const n = d.steps.length;

    const tasks = TASKS.map((t, i) =>
      `<button type="button" class="ems-chip${i === d.taskIdx ? ' is-on' : ''}" data-action="task" data-idx="${i}">
        <span class="ems-chip-main">${t.dividend} : ${t.divisor}</span>
        <span class="ems-chip-sub">${t.level} · ${t.note}</span>
      </button>`).join('');

    const dots = d.steps.map((_, i) => {
      let cls = 'ems-dot';
      if (i < d.cursor || d.solved[i]) cls += ' is-done';
      if (i === d.cursor) cls += ' is-cur';
      return `<span class="${cls}"></span>`;
    }).join('') + `<span class="ems-dot ems-dot-goal${d.cursor >= n ? ' is-done is-cur' : ''}">🏁</span>`;

    return `
      <div class="ems-tasks" role="group" aria-label="Aufgabe wählen">${tasks}</div>
      <div class="ems-dots" aria-hidden="true">${dots}</div>
      <div class="ems-div-grid">
        ${boardHtml(d, animate)}
        ${d.cursor >= n ? finalPanelHtml(d) : stepPanelHtml(d)}
      </div>`;
  }

  // ==========================================================================
  // TEIL 2: 1×1 Fundament & Kopfrechen-Basics
  // ==========================================================================

  function makeOptions(answer, candidates) {
    const seen = {};
    seen[fmt(answer)] = true;
    const out = [answer];
    shuffle(candidates).forEach(c => {
      const v = round3(c);
      if (out.length < 4 && v > 0 && !seen[fmt(v)]) {
        seen[fmt(v)] = true;
        out.push(v);
      }
    });
    let k = 1;
    while (out.length < 4) {
      const v = round3(answer + k);
      if (v > 0 && !seen[fmt(v)]) {
        seen[fmt(v)] = true;
        out.push(v);
      }
      k = k > 0 ? -k : -k + 1;
    }
    return shuffle(out);
  }

  function multiplyTip(a, b) {
    if (a === 10 || b === 10) {
      const x = a === 10 ? b : a;
      return `× 10 → einfach eine 0 anhängen: ${x} → <b>${x * 10}</b>`;
    }
    if (a > 10 || b > 10) {
      const big = Math.max(a, b);
      const small = Math.min(a, b);
      return `Zerlegen: ${big} × ${small} = 10 × ${small} + ${big - 10} × ${small} = ` +
        `${10 * small} + ${(big - 10) * small} = <b>${big * small}</b>`;
    }
    if (a === 9 || b === 9) {
      const x = a === 9 ? b : a;
      return `Trick: ${x} × 9 = ${x} × 10 − ${x} = ${x * 10} − ${x} = <b>${x * 9}</b>`;
    }
    if (a === 5 || b === 5) {
      const x = a === 5 ? b : a;
      return `Trick: ${x} × 5 ist die Hälfte von ${x} × 10 = ${x * 10} : 2 = <b>${x * 5}</b>`;
    }
    return `Eins weniger + einmal mehr: ${a} × ${b} = ${a} × ${b - 1} + ${a} = ` +
      `${a * (b - 1)} + ${a} = <b>${a * b}</b>`;
  }

  const GENERATORS = {
    klein() {
      const a = rand(2, 10);
      const b = rand(2, 10);
      const ans = a * b;
      return {
        text: `${a} × ${b}`,
        answer: ans,
        tip: multiplyTip(a, b),
        options: makeOptions(ans, [a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b, ans + 10, ans - 10])
      };
    },
    gross() {
      const a = rand(11, 19);
      const b = rand(2, 9);
      const ans = a * b;
      return {
        text: `${a} × ${b}`,
        answer: ans,
        tip: multiplyTip(a, b),
        options: makeOptions(ans, [ans + 10, ans - 10, a * (b + 1), a * (b - 1), 10 * b + (a - 10), (a - 10) * b + 10])
      };
    },
    doppel() {
      if (Math.random() < 0.5) {
        const n = rand(13, 99);
        const t = n - (n % 10);
        const o = n % 10;
        const ans = n * 2;
        return {
          text: `Verdopple ${n}`,
          answer: ans,
          tip: o === 0
            ? `${n} · 2 = <b>${ans}</b>`
            : `Zehner und Einer einzeln: ${t} · 2 + ${o} · 2 = ${t * 2} + ${o * 2} = <b>${ans}</b>`,
          options: makeOptions(ans, [ans + 10, ans - 10, ans + 2, ans - 2, t * 2 + o, ans + 1])
        };
      }
      const m = 2 * rand(12, 99);
      const t = m - (m % 10);
      const o = m % 10;
      const ans = m / 2;
      return {
        text: `Halbiere ${m}`,
        answer: ans,
        tip: o === 0
          ? `${m} : 2 = <b>${ans}</b>`
          : `Zehner und Einer einzeln: ${t} : 2 + ${o} : 2 = ${t / 2} + ${o / 2} = <b>${ans}</b>`,
        options: makeOptions(ans, [ans + 10, ans - 10, ans + 5, ans - 5, ans + 1, t / 2 + o])
      };
    },
    zehner() {
      const variant = rand(0, 4);
      let text;
      let ans;
      let tip;
      if (variant === 0) {
        const n = rand(3, 99);
        ans = n * 10;
        text = `${n} × 10`;
        tip = `× 10 → eine 0 anhängen: ${n} → <b>${ans}</b>`;
      } else if (variant === 1) {
        const n = rand(2, 30);
        ans = n * 100;
        text = `${n} × 100`;
        tip = `× 100 → zwei Nullen anhängen: ${n} → <b>${ans}</b>`;
      } else if (variant === 2) {
        const n = 10 * rand(5, 99);
        ans = n / 10;
        text = `${n} : 10`;
        tip = `: 10 → eine 0 wegstreichen: ${n} → <b>${ans}</b>`;
      } else if (variant === 3) {
        const n = 10 * rand(11, 99);
        ans = round3(n / 100);
        text = `${n} : 100`;
        tip = `: 100 → Komma zwei Stellen nach links: ${n} → <b>${fmt(ans)}</b>`;
      } else {
        const x = round3(rand(11, 99) / 10);
        ans = round3(x * 10);
        text = `${fmt(x)} × 10`;
        tip = `× 10 → Komma eine Stelle nach rechts: ${fmt(x)} → <b>${fmt(ans)}</b>`;
      }
      return {
        text: text,
        answer: ans,
        tip: tip,
        options: makeOptions(ans, [ans * 10, ans / 10, ans * 100, ans / 100])
      };
    },
    mix() {
      return GENERATORS[pick(['klein', 'gross', 'doppel', 'zehner'])]();
    }
  };

  function nextBasicsQuestion() {
    const b = state.basics;
    b.q = GENERATORS[b.level]();
    b.answered = false;
    b.picked = -1;
    b.msg = '';
  }

  function basicsPick(idx) {
    const b = state.basics;
    if (b.answered || !b.q || b.q.options[idx] === undefined) return;
    b.answered = true;
    b.picked = idx;
    b.total++;
    const correct = fmt(b.q.options[idx]) === fmt(b.q.answer);
    if (correct) {
      b.right++;
      b.streak++;
      b.best = Math.max(b.best, b.streak);
      giveXp(BASICS_XP);
      let msg = pick(PRAISE);
      if (b.streak > 0 && b.streak % 10 === 0) msg = `🔥🔥 ${b.streak}er-Serie! Du bist nicht zu stoppen!`;
      else if (b.streak > 0 && b.streak % 5 === 0) msg = `🔥 ${b.streak}er-Serie! Richtig stark!`;
      b.msg = msg;
      const li = LEVEL_ORDER.indexOf(b.level);
      if (b.streak >= 5 && b.streak % 5 === 0 && li < LEVEL_ORDER.length - 2) {
        b.suggest = LEVEL_ORDER[li + 1];
      }
      clearTimer();
      autoTimer = setTimeout(() => {
        autoTimer = null;
        nextBasicsQuestion();
        draw();
      }, AUTO_NEXT_MS);
    } else {
      b.streak = 0;
      b.msg = pick(COMFORT);
    }
    draw();
  }

  function setLevel(level) {
    if (!LEVELS[level]) return;
    clearTimer();
    const b = state.basics;
    b.level = level;
    b.suggest = null;
    nextBasicsQuestion();
    draw();
  }

  function basicsHtml() {
    const b = state.basics;
    if (!b.q) nextBasicsQuestion();
    const q = b.q;
    const correctIdx = q.options.findIndex(v => fmt(v) === fmt(q.answer));
    const pickedRight = b.answered && b.picked === correctIdx;

    const levels = LEVEL_ORDER.map(id => {
      const l = LEVELS[id];
      return `<button type="button" class="ems-chip${id === b.level ? ' is-on' : ''}" data-action="level" data-level="${id}">
        <span class="ems-chip-main">${l.icon} ${l.label}</span>
        <span class="ems-chip-sub">${l.name}</span>
      </button>`;
    }).join('');

    const opts = q.options.map((v, i) => {
      let cls = 'ems-opt ems-opt-wide';
      if (b.answered && i === correctIdx) cls += ' is-right';
      if (b.answered && i === b.picked && i !== correctIdx) cls += ' is-wrong';
      return `<button type="button" class="${cls}" data-action="bpick" data-idx="${i}"${b.answered ? ' disabled' : ''}>${fmt(v)}</button>`;
    }).join('');

    let feedback = '';
    if (b.answered && pickedRight) {
      feedback = `<div class="ems-fb is-ok">✔ ${b.msg} <span class="ems-xp">+${BASICS_XP} XP</span></div>`;
    } else if (b.answered) {
      feedback = `<div class="ems-fb is-bad">
          <div>${b.msg}</div>
          <div class="ems-calc">${q.tip}</div>
        </div>
        <div class="ems-nav"><button type="button" class="ems-btn" data-action="bnext">Nächste Aufgabe →</button></div>`;
    }

    const suggest = b.suggest
      ? `<div class="ems-suggest">
          <span>🚀 Das sitzt! Bereit für <b>${LEVELS[b.suggest].label}: ${LEVELS[b.suggest].name}</b>?</span>
          <span>
            <button type="button" class="ems-btn" data-action="level" data-level="${b.suggest}">Los geht's</button>
            <button type="button" class="ems-link" data-action="dismiss">Noch hier bleiben</button>
          </span>
        </div>`
      : '';

    const quote = b.total ? Math.round(b.right / b.total * 100) : 0;

    return `
      <div class="ems-tasks" role="group" aria-label="Stufe wählen">${levels}</div>
      ${suggest}
      <div class="ems-stats">
        <div class="ems-stat"><span>🔥 Serie</span><b>${b.streak}</b></div>
        <div class="ems-stat"><span>🏅 Beste Serie</span><b>${b.best}</b></div>
        <div class="ems-stat"><span>✅ Richtig</span><b>${b.right}/${b.total}</b></div>
        <div class="ems-stat"><span>🎯 Quote</span><b>${quote} %</b></div>
      </div>
      <div class="ems-flash">
        <div class="ems-flash-label">${LEVELS[b.level].icon} ${LEVELS[b.level].name}</div>
        <div class="ems-flash-task">${q.text} = <span class="ems-flash-q">?</span></div>
      </div>
      <div class="ems-opts ems-opts-grid" role="group" aria-label="Antwort wählen">${opts}</div>
      <div aria-live="polite">${feedback}</div>
      <p class="ems-footnote">Ein sicheres 1×1 ist das Fundament für jede schriftliche Division – ` +
      `<button type="button" class="ems-link" data-action="mode" data-mode="division_guide">🪜 zur geführten Division</button></p>`;
  }

  // ==========================================================================
  // Rendering & Events
  // ==========================================================================
  function draw() {
    if (!root) return;
    const isDiv = state.mode === 'division_guide';
    root.innerHTML = `
      <div class="ems sim-card">
        <div class="ems-header">
          <div>
            <span class="ems-badge">Baustellen-Mathe · Schritt für Schritt</span>
            <h3>🧮 Rechnen mit Anleitung</h3>
            <p class="ems-sub">Wir fangen bei deinem Niveau an und gehen gemeinsam Schritt für Schritt vor – keiner wird allein gelassen.</p>
          </div>
        </div>
        <div class="ems-modes" role="tablist" aria-label="Übungsmodus">
          <button type="button" role="tab" class="ems-mode${isDiv ? ' is-on' : ''}" aria-selected="${isDiv}"
            data-action="mode" data-mode="division_guide">🪜 Geführte Division</button>
          <button type="button" role="tab" class="ems-mode${!isDiv ? ' is-on' : ''}" aria-selected="${!isDiv}"
            data-action="mode" data-mode="basics">✖️ 1×1 Fundament</button>
        </div>
        <div class="ems-body">${isDiv ? divisionHtml() : basicsHtml()}</div>
      </div>`;
  }

  function onClick(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn || !root || !root.contains(btn) || btn.disabled) return;
    const action = btn.getAttribute('data-action');

    switch (action) {
      case 'mode': {
        const mode = btn.getAttribute('data-mode');
        if (mode !== 'basics' && mode !== 'division_guide') return;
        clearTimer();
        state.mode = mode;
        if (mode === 'basics' && state.basics.answered) nextBasicsQuestion();
        draw();
        break;
      }
      case 'task': {
        const idx = Number(btn.getAttribute('data-idx'));
        if (TASKS[idx]) { loadTask(idx); draw(); }
        break;
      }
      case 'pick':
        divPick(Number(btn.getAttribute('data-val')));
        break;
      case 'next':
        divNext();
        break;
      case 'prev':
        divPrev();
        break;
      case 'restart':
        loadTask(state.div.taskIdx);
        draw();
        break;
      case 'next-task':
        if (state.div.taskIdx < TASKS.length - 1) { loadTask(state.div.taskIdx + 1); draw(); }
        break;
      case 'help':
        state.div.showHelp = !state.div.showHelp;
        draw();
        break;
      case 'to-basics':
        clearTimer();
        state.mode = 'basics';
        draw();
        break;
      case 'level':
        setLevel(btn.getAttribute('data-level'));
        break;
      case 'bpick':
        basicsPick(Number(btn.getAttribute('data-idx')));
        break;
      case 'bnext':
        clearTimer();
        nextBasicsQuestion();
        draw();
        break;
      case 'dismiss':
        state.basics.suggest = null;
        draw();
        break;
      default:
        break;
    }
  }

  function render(containerEl) {
    const el = typeof containerEl === 'string' ? document.getElementById(containerEl) : containerEl;
    if (!el) {
      console.warn('ElektroMathScaffold.render: Container nicht gefunden.');
      return;
    }
    if (root) destroy();
    ensureStyles();
    root = el;
    if (state.div) state.div.animCursor = -1;
    clickHandler = onClick;
    root.addEventListener('click', clickHandler);
    draw();
  }

  function destroy() {
    clearTimer();
    if (root && clickHandler) root.removeEventListener('click', clickHandler);
    if (root) root.innerHTML = '';
    root = null;
    clickHandler = null;
  }

  function setMode(mode) {
    if (mode !== 'basics' && mode !== 'division_guide') return;
    clearTimer();
    state.mode = mode;
    draw();
  }

  // --------------------------------------------------------------------------
  // Styles (einmalig injiziert, Präfix "ems-" vermeidet Konflikte)
  // --------------------------------------------------------------------------
  function ensureStyles() {
    if (document.getElementById('ems-styles')) return;
    const style = document.createElement('style');
    style.id = 'ems-styles';
    style.textContent = `
.ems { --ems-chalk: #f1f5f9; --ems-amber: #fbbf24; --ems-sky: #7dd3fc; --ems-green: #34d399; --ems-red: #f87171;
  background: var(--bg-card, #131b2e); border: 1px solid var(--border, #23314f); border-radius: var(--radius, 16px);
  padding: 18px; color: var(--text-main, #f8fafc); }
.ems h3 { margin: 6px 0 4px; font-size: 1.15rem; }
.ems-sub { margin: 0; color: var(--text-muted, #94a3b8); font-size: .85rem; }
.ems-badge { display: inline-block; font-size: .72rem; font-weight: 700; color: #f59e0b;
  background: rgba(245,158,11,.12); border: 1px solid rgba(245,158,11,.35); border-radius: 999px; padding: 3px 10px; }
.ems-modes { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 14px 0; padding: 4px;
  background: var(--bg-main, #0b0f17); border-radius: 12px; }
.ems-mode { background: transparent; color: var(--text-muted, #94a3b8); border: 0; border-radius: 9px;
  padding: 10px 8px; font-weight: 700; font-size: .9rem; cursor: pointer; }
.ems-mode.is-on { background: var(--bg-card-hover, #1a2540); color: var(--text-main, #f8fafc); box-shadow: inset 0 0 0 1px #38bdf8; }
.ems-tasks { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; margin-bottom: 10px; }
.ems-chip { flex: 0 0 auto; display: flex; flex-direction: column; align-items: flex-start; gap: 2px;
  background: var(--bg-card-hover, #1a2540); color: var(--text-main, #f8fafc); border: 1px solid var(--border, #23314f);
  border-radius: 10px; padding: 7px 11px; cursor: pointer; }
.ems-chip.is-on { border-color: #38bdf8; background: rgba(56,189,248,.12); }
.ems-chip-main { font-weight: 700; font-size: .9rem; white-space: nowrap; }
.ems-chip-sub { font-size: .7rem; color: var(--text-muted, #94a3b8); white-space: nowrap; }
.ems-dots { display: flex; align-items: center; gap: 6px; margin: 4px 0 12px; }
.ems-dot { width: 12px; height: 12px; border-radius: 50%; background: #334155; transition: background .3s, transform .3s; }
.ems-dot.is-done { background: var(--ems-green); }
.ems-dot.is-cur { transform: scale(1.35); box-shadow: 0 0 0 2px rgba(56,189,248,.6); }
.ems-dot-goal { width: auto; height: auto; background: none; font-size: .9rem; opacity: .5; }
.ems-dot-goal.is-done { background: none; opacity: 1; }
.ems-div-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); gap: 14px; align-items: start; }
@media (max-width: 760px) { .ems-div-grid { grid-template-columns: 1fr; } }

/* Tafel / dunkles Rechenheft */
.ems-board { --cell: 1.9rem; position: relative; overflow-x: auto; padding: 18px 16px 22px; border-radius: 12px;
  background-color: #1d2b25;
  background-image: linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px);
  background-size: var(--cell) var(--cell); background-position: 16px 18px;
  border: 6px solid #5b4632; box-shadow: inset 0 0 30px rgba(0,0,0,.45);
  font-family: 'Courier New', Consolas, monospace; font-weight: 700; color: var(--ems-chalk); }
.ems-row { display: flex; align-items: center; height: var(--cell); white-space: nowrap; }
.ems-cell { position: relative; flex: 0 0 var(--cell); width: var(--cell); height: var(--cell);
  display: inline-flex; align-items: center; justify-content: center; font-size: 1.45rem;
  text-shadow: 0 0 2px rgba(255,255,255,.35); }
.ems-cell.is-line { border-bottom: 2px solid var(--ems-chalk); }
.ems-cell.is-prod { color: #cbd5e1; }
.ems-cell.is-active { color: var(--ems-amber); background: rgba(251,191,36,.14); border-radius: 4px; }
.ems-cell.is-pulled { color: var(--ems-sky); }
.ems-cell.is-pulled::after { content: '↓'; position: absolute; bottom: -.95em; font-size: 1rem; color: var(--ems-sky); }
.ems-cell.is-pulled.is-anim::after { animation: ems-arrow 1s ease-in-out 2; }
.ems-cell.is-drop { color: var(--ems-sky); }
.ems-cell.is-drop.is-zero { color: var(--ems-amber); }
.ems-cell.is-drop.is-anim { animation: ems-drop .75s cubic-bezier(.2,.9,.3,1.2); }
.ems-cell.is-rest { color: var(--ems-green); }
.ems-cell.is-final { color: var(--ems-green); text-decoration: underline double; }
.ems-op { margin: 0 .35em; font-size: 1.45rem; color: #cbd5e1; }
.ems-divisor { font-size: 1.45rem; color: var(--ems-chalk); }
.ems-quot { display: inline-flex; align-items: center; font-size: 1.45rem; }
.ems-q { min-width: .7em; text-align: center; color: var(--ems-green); }
.ems-q.is-comma { min-width: .4em; color: var(--ems-amber); }
.ems-q.is-new { animation: ems-pop .45s ease-out; }
.ems-q.is-ask { color: var(--ems-amber); animation: ems-blink 1.1s ease-in-out infinite; }
.ems-approx { margin-left: .5em; font-size: 1.1rem; color: var(--ems-amber); }
@keyframes ems-drop { 0% { transform: translateY(-2.4em); opacity: .15; } 70% { opacity: 1; } 100% { transform: translateY(0); } }
@keyframes ems-arrow { 0%, 100% { transform: translateY(0); opacity: 1; } 50% { transform: translateY(.35em); opacity: .55; } }
@keyframes ems-pop { 0% { transform: scale(1.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
@keyframes ems-blink { 50% { opacity: .3; } }

/* Panel */
.ems-panel { background: var(--bg-main, #0b0f17); border: 1px solid var(--border, #23314f); border-radius: 12px; padding: 14px; }
.ems-stepline { font-size: .75rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #38bdf8; }
.ems-question { margin: 8px 0 12px; line-height: 1.5; font-size: 1rem; }
.ems-question b { color: var(--ems-amber); }
.ems-hint { font-size: .82rem; color: var(--text-muted, #94a3b8); margin: -4px 0 10px; }
.ems-opts { display: flex; gap: 10px; flex-wrap: wrap; }
.ems-opts-grid { display: grid; grid-template-columns: repeat(2, 1fr); }
.ems-opt { min-width: 64px; padding: 12px 18px; font-size: 1.3rem; font-weight: 800; border-radius: 12px; cursor: pointer;
  background: var(--bg-card-hover, #1a2540); color: var(--text-main, #f8fafc); border: 2px solid var(--border, #23314f);
  transition: transform .1s, border-color .2s; }
.ems-opt:hover:not(:disabled) { border-color: #38bdf8; transform: translateY(-1px); }
.ems-opt:disabled { cursor: default; }
.ems-opt.is-right { border-color: var(--ems-green); background: rgba(16,185,129,.18); color: var(--ems-green); }
.ems-opt.is-wrong { border-color: var(--ems-red); background: rgba(239,68,68,.12); color: var(--ems-red); opacity: .75; text-decoration: line-through; }
.ems-fb { margin-top: 12px; padding: 10px 12px; border-radius: 10px; font-size: .9rem; line-height: 1.5; }
.ems-fb.is-ok { background: rgba(16,185,129,.1); border: 1px solid rgba(16,185,129,.4); }
.ems-fb.is-bad { background: rgba(245,158,11,.1); border: 1px solid rgba(245,158,11,.4); }
.ems-calc { font-family: 'Courier New', Consolas, monospace; font-size: 1rem; margin-top: 4px; }
.ems-done-line { margin-top: 6px; font-weight: 800; color: var(--ems-green); }
.ems-tools { display: flex; gap: 14px; flex-wrap: wrap; margin-top: 12px; }
.ems-link { background: none; border: 0; padding: 0; color: #38bdf8; font-size: .82rem; font-weight: 600; cursor: pointer; text-decoration: underline; }
.ems-help { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px 10px; margin-top: 8px; padding: 8px 10px;
  border-radius: 8px; background: rgba(56,189,248,.07); font-family: 'Courier New', Consolas, monospace; font-size: .85rem; }
.ems-nav { display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; margin-top: 14px; }
.ems-btn { background: #38bdf8; color: #0b0f17; border: 0; border-radius: 10px; padding: 10px 16px; font-weight: 800; cursor: pointer; }
.ems-btn:disabled { opacity: .35; cursor: not-allowed; }
.ems-btn-ghost { background: transparent; color: var(--text-main, #f8fafc); border: 1px solid var(--border, #23314f); }
.ems-xp { display: inline-block; margin-left: 6px; padding: 1px 8px; border-radius: 999px; font-size: .75rem; font-weight: 800;
  background: rgba(168,85,247,.18); color: #c084fc; }
.ems-final-title { font-size: 1.4rem; font-weight: 900; color: var(--ems-green); }
.ems-final-result { margin: 6px 0; font-size: 1.25rem; font-family: 'Courier New', Consolas, monospace; }
.ems-final-result b { color: var(--ems-amber); }
.ems-final-probe, .ems-final-praise { font-size: .88rem; color: var(--text-muted, #94a3b8); margin-top: 4px; }
.ems-recap { margin-top: 12px; padding: 10px 12px; border-radius: 10px; background: rgba(56,189,248,.07); font-size: .85rem; }
.ems-recap ol { margin: 6px 0 0; padding-left: 20px; line-height: 1.6; }

/* 1×1 Fundament */
.ems-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 12px; }
.ems-stat { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 8px 4px; border-radius: 10px;
  background: var(--bg-main, #0b0f17); border: 1px solid var(--border, #23314f); }
.ems-stat span { font-size: .7rem; color: var(--text-muted, #94a3b8); white-space: nowrap; }
.ems-stat b { font-size: 1.15rem; }
@media (max-width: 480px) { .ems-stats { grid-template-columns: repeat(2, 1fr); } }
.ems-flash { text-align: center; padding: 22px 12px; margin-bottom: 12px; border-radius: 12px;
  background: #1d2b25; border: 6px solid #5b4632; font-family: 'Courier New', Consolas, monospace; }
.ems-flash-label { font-family: inherit; font-size: .8rem; color: #cbd5e1; margin-bottom: 6px; }
.ems-flash-task { font-size: 2rem; font-weight: 800; color: var(--ems-chalk); }
.ems-flash-q { color: var(--ems-amber); }
.ems-opt-wide { width: 100%; }
.ems-suggest { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;
  margin-bottom: 12px; padding: 10px 12px; border-radius: 10px; background: rgba(168,85,247,.12); border: 1px solid rgba(168,85,247,.4); font-size: .88rem; }
.ems-suggest > span:last-child { display: flex; gap: 12px; align-items: center; }
.ems-footnote { margin: 14px 0 0; font-size: .82rem; color: var(--text-muted, #94a3b8); }
@media (max-width: 480px) { .ems-board { --cell: 1.6rem; } .ems-cell, .ems-op, .ems-divisor, .ems-quot { font-size: 1.2rem; } }
@media (prefers-reduced-motion: reduce) {
  .ems-cell.is-anim, .ems-cell.is-anim::after, .ems-q.is-new, .ems-q.is-ask { animation: none; }
}
`;
    document.head.appendChild(style);
  }

  return {
    render,
    destroy,
    setMode,
    // Für Tests / externe Steuerung
    buildSteps,
    getState: () => JSON.parse(JSON.stringify(state))
  };
})();
