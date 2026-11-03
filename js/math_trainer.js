// ============================================================================
// ElektroCoach PRO – Baustellen-Mathe & Kopfrechen-Trainer
// 1. Kopfrechen-Hacks (Division durch 12, x15, x25, x11, 1x1 Schnellfeuer)
// 2. Baustellen-Geometrie (Flächen z.B. 1,52 m * 72 cm, Verschnitt, Abstände)
// 3. Elektro-Einheiten & Zehnerpotenzen (mA, kOhm, µF, kW)
// ============================================================================

window.ElektroMathTrainer = (function () {
  let state = {
    mode: 'tricks', // 'tricks' | 'site' | 'units'
    score: 0,
    roundTotal: 5,
    currentIndex: 0,
    streak: 0,
    currentQuestion: null,
    answered: false,
    selectedOption: null
  };

  // Generator-Funktionen für die Aufgaben
  const GENERATORS = {
    tricks: [
      // 1. Division wie 989 / 12 mit Rest / Überschlag
      () => {
        const divisors = [12, 15, 8, 16];
        const div = divisors[Math.floor(Math.random() * divisors.length)];
        const mult = Math.floor(Math.random() * 60) + 40; // 40..100
        const remainder = Math.floor(Math.random() * (div - 1)) + 1;
        const numerator = mult * div + remainder;
        const exact = (numerator / div).toFixed(1);

        const base = mult * div;
        const trick = `Zerlege ${numerator} in ein glattes Vielfaches von ${div}:<br>` +
          `• ${div} × ${mult} = ${base}<br>` +
          `• Rest: ${numerator} − ${base} = ${remainder}<br>` +
          `• ${remainder} / ${div} ≈ ${(remainder / div).toFixed(2)}<br>` +
          `👉 Ergebnis: ${mult} + ${(remainder / div).toFixed(2)} = <strong>${exact}</strong>`;

        const options = [
          exact,
          ((numerator + 10) / div).toFixed(1),
          ((numerator - 15) / div).toFixed(1),
          (mult + 0.8).toFixed(1)
        ].sort(() => Math.random() - 0.5);

        return {
          title: `Schnell-Division: Was ergibt ${numerator} : ${div}?`,
          context: 'Typisch bei Aufteilung von Kabeln, Beleuchtungsgruppen oder Modulstrings im Kopf.',
          options,
          correctAnswer: exact,
          trick
        };
      },

      // 2. Multiplikation mit 15
      () => {
        const num = (Math.floor(Math.random() * 25) + 12) * 2; // gerade Zahl
        const ans = num * 15;
        const half = num * 5;
        const ten = num * 10;
        const trick = `15er-Trick: Rechne erst mal 10, dann die Hälfte addieren!<br>` +
          `• ${num} × 10 = ${ten}<br>` +
          `• Hälfte davon: ${half}<br>` +
          `👉 ${ten} + ${half} = <strong>${ans}</strong>`;

        const options = [
          ans.toString(),
          (ans - 30).toString(),
          (ans + 30).toString(),
          (ans + 15).toString()
        ].sort(() => Math.random() - 0.5);

        return {
          title: `Kopfrechen-Hack: Was ist ${num} × 15?`,
          context: 'Beliebt bei 15-Minuten-Takten oder Packungsgrößen auf der Baustelle.',
          options,
          correctAnswer: ans.toString(),
          trick
        };
      },

      // 3. Multiplikation mit 25
      () => {
        const num = (Math.floor(Math.random() * 20) + 6) * 4; // durch 4 teilbar
        const ans = num * 25;
        const div4 = num / 4;
        const trick = `25er-Trick: Mal 100 rechnen und durch 4 teilen!<br>` +
          `• ${num} × 100 = ${num * 100}<br>` +
          `• ${num * 100} : 4 = <strong>${ans}</strong> (bzw. ${num} : 4 = ${div4} → ${div4}00)`;

        const options = [
          ans.toString(),
          (ans - 100).toString(),
          (ans + 50).toString(),
          (ans + 100).toString()
        ].sort(() => Math.random() - 0.5);

        return {
          title: `Kopfrechen-Hack: Was ist ${num} × 25?`,
          context: 'Ideal für 25-Meter-Kabelringe oder Klemmen-Packungen.',
          options,
          correctAnswer: ans.toString(),
          trick
        };
      },

      // 4. Multiplikation mit 11
      () => {
        const d1 = Math.floor(Math.random() * 5) + 2;
        const d2 = Math.floor(Math.random() * 4) + 1;
        const num = d1 * 10 + d2;
        const ans = num * 11;
        const sum = d1 + d2;
        const trick = `11er-Trick für zweistellige Zahlen:<br>` +
          `• Nimm die Ziffern ${d1} und ${d2}.<br>` +
          `• Addiere beide: ${d1} + ${d2} = ${sum}.<br>` +
          `• Setze die Summe in die Mitte: <strong>${ans}</strong>!`;

        const options = [
          ans.toString(),
          (ans + 10).toString(),
          (ans - 11).toString(),
          (ans + 22).toString()
        ].sort(() => Math.random() - 0.5);

        return {
          title: `Kopfrechen-Hack: Was ist ${num} × 11?`,
          context: 'Blitzschnell im Kopf ohne Taschenrechner.',
          options,
          correctAnswer: ans.toString(),
          trick
        };
      },

      // 5. Großes 1x1 Routine (12x12 bis 19x19)
      () => {
        const a = Math.floor(Math.random() * 8) + 12; // 12..19
        const b = Math.floor(Math.random() * 8) + 12; // 12..19
        const ans = a * b;
        const trick = `Großes 1×1 Trick (${a} × ${b}):<br>` +
          `• Nimm die erste Zahl plus die Einerstelle der zweiten: ${a} + ${b % 10} = ${a + (b % 10)}.<br>` +
          `• Hänge eine Null an: ${(a + (b % 10)) * 10}.<br>` +
          `• Addiere das Produkt der Einerstellen: ${(a % 10)} × ${(b % 10)} = ${(a % 10) * (b % 10)}.<br>` +
          `👉 ${(a + (b % 10)) * 10} + ${(a % 10) * (b % 10)} = <strong>${ans}</strong>!`;

        const options = [
          ans.toString(),
          (ans - 12).toString(),
          (ans + 14).toString(),
          (ans + 20).toString()
        ].sort(() => Math.random() - 0.5);

        return {
          title: `1×1 Routine: Was ergibt ${a} × ${b}?`,
          context: 'Gehört zum täglichen Werkzeugkasten jedes Meisters.',
          options,
          correctAnswer: ans.toString(),
          trick
        };
      }
    ],

    site: [
      // 1. Flächenberechnung wie 1,52 m * 72 cm
      () => {
        const l = (Math.random() * 1.5 + 1.2).toFixed(2); // 1.20 .. 2.70 m
        const bCm = Math.floor(Math.random() * 50 + 50); // 50 .. 100 cm
        const bM = (bCm / 100).toFixed(2);
        const area = (parseFloat(l) * parseFloat(bM)).toFixed(3);

        const trick = `Baustellen-Rechnung:<br>` +
          `• Erst Einheit angleichen: ${bCm} cm = ${bM} m.<br>` +
          `• Überschlag im Kopf: ${Math.round(l * 10) / 10} m × ${Math.round(bM * 10) / 10} m ≈ ${(Math.round(l * 10) / 10 * Math.round(bM * 10) / 10).toFixed(2)} m².<br>` +
          `👉 Exakte Fläche: ${l} m × ${bM} m = <strong>${area} m²</strong>`;

        const options = [
          `${area} m²`,
          `${(parseFloat(area) * 1.2).toFixed(3)} m²`,
          `${(parseFloat(area) * 0.8).toFixed(3)} m²`,
          `${(parseFloat(area) + 0.35).toFixed(3)} m²`
        ].sort(() => Math.random() - 0.5);

        return {
          title: `Zuschnitt & Fläche: Wandfläche mit ${l} m Länge und ${bCm} cm Breite?`,
          context: 'Wichtig für Trockenbauplatten, Fliesenbedarf oder Wanddurchbrüche.',
          options,
          correctAnswer: `${area} m²`,
          trick
        };
      },

      // 2. Leitungs- & Trassenverschnitt (+10 %)
      () => {
        const length = Math.floor(Math.random() * 30 + 20) * 2; // 40..100 m
        const extra = Math.round(length * 0.1);
        const total = length + extra;
        const trick = `10-%-Verschnitt-Faustformel:<br>` +
          `• 10 % von ${length} m = ${extra} m Verschnitt-Zuschlag.<br>` +
          `👉 ${length} m + ${extra} m = <strong>${total} m</strong> (Bestellmaß)!`;

        const options = [
          `${total} m`,
          `${total + 5} m`,
          `${total - 4} m`,
          `${length + 15} m`
        ].sort(() => Math.random() - 0.5);

        return {
          title: `Materialplanung: Eine Kabeltrasse misst ${length} m. Wie viel Leitung bestellst du mit 10 % Verschnitt?`,
          context: 'Auf der Baustelle wird für Biegungen, Absetzlängen und Verschnitt immer 10 % aufgeschlagen.',
          options,
          correctAnswer: `${total} m`,
          trick
        };
      },

      // 3. Gleichmäßige Lampenabstände
      () => {
        const lamps = Math.floor(Math.random() * 3) + 3; // 3, 4, 5
        const roomLen = (lamps + 1) * 1.2; // glatter Abstand z.B. 1.2 m
        const dist = 1.2;
        const trick = `Gleichmäßige Lampenaufteilung:<br>` +
          `• Bei ${lamps} Lampen gibt es ${lamps + 1} Zwischenräume (inkl. Wandabstände).<br>` +
          `• Abstand = Gesamtlänge : (Anzahl + 1) = ${roomLen.toFixed(1)} m : ${lamps + 1} = <strong>${dist.toFixed(2)} m</strong>.<br>` +
          `• Zur Wand nimmt man meist den halben Abstand (a/2 = 0,60 m) oder gleichen Abstand je nach Leuchtenart.`;

        const options = [
          `${dist.toFixed(2)} m`,
          `${(dist + 0.3).toFixed(2)} m`,
          `${(dist - 0.25).toFixed(2)} m`,
          `${(roomLen / lamps).toFixed(2)} m`
        ].sort(() => Math.random() - 0.5);

        return {
          title: `Lichtplanung: ${lamps} Einbauspots sollen auf ${roomLen.toFixed(1)} m Decke gleichmäßig verteilt werden. Welcher Abstand?`,
          context: 'Formel: l / (n + 1). Verhindert ungleiche Schattenwürfe.',
          options,
          correctAnswer: `${dist.toFixed(2)} m`,
          trick
        };
      }
    ],

    units: [
      // 1. mA <-> A
      () => {
        const ma = [16, 30, 100, 300, 500][Math.floor(Math.random() * 5)];
        const a = (ma / 1000).toFixed(3);
        const trick = `Milli (m) bedeutet ein Tausendstel (10⁻³):<br>` +
          `• Komma um 3 Stellen nach links verschieben!<br>` +
          `👉 ${ma} mA = <strong>${parseFloat(a)} A</strong>`;

        const options = [
          `${parseFloat(a)} A`,
          `${(ma / 100).toFixed(2)} A`,
          `${(ma / 10000).toFixed(4)} A`,
          `${ma * 10} A`
        ].sort(() => Math.random() - 0.5);

        return {
          title: `Einheiten-Blitz: Wie viel Ampere sind ${ma} mA (z.B. RCD-Auslösestrom)?`,
          context: 'Muss im Schlaf sitzen bei Schutzmaßnahmen und Messprotokollen.',
          options,
          correctAnswer: `${parseFloat(a)} A`,
          trick
        };
      },

      // 2. kOhm <-> Ohm
      () => {
        const ko = (Math.random() * 8 + 1.2).toFixed(1);
        const o = Math.round(parseFloat(ko) * 1000);
        const trick = `Kilo (k) bedeutet mal Tausend (10³):<br>` +
          `• Komma um 3 Stellen nach rechts verschieben!<br>` +
          `👉 ${ko} kΩ = <strong>${o} Ω</strong>`;

        const options = [
          `${o} Ω`,
          `${o / 10} Ω`,
          `${o * 10} Ω`,
          `${Math.round(parseFloat(ko) * 100)} Ω`
        ].sort(() => Math.random() - 0.5);

        return {
          title: `Einheiten-Blitz: Wie viel Ohm sind ${ko} kΩ?`,
          context: 'Widerstandsdekaden und Sensorfühler (z.B. PT1000, NTC).',
          options,
          correctAnswer: `${o} Ω`,
          trick
        };
      },

      // 3. µF <-> nF
      () => {
        const uf = [0.1, 0.47, 1.0, 2.2, 4.7, 10][Math.floor(Math.random() * 6)];
        const nf = Math.round(uf * 1000);
        const trick = `Mikro (µ, 10⁻⁶) zu Nano (n, 10⁻⁹):<br>` +
          `• 1 µF = 1.000 nF.<br>` +
          `• Also mit 1.000 multiplizieren (Komma um 3 Stellen nach rechts):<br>` +
          `👉 ${uf} µF = <strong>${nf} nF</strong>`;

        const options = [
          `${nf} nF`,
          `${nf / 10} nF`,
          `${nf * 10} nF`,
          `${Math.round(uf * 100)} nF`
        ].sort(() => Math.random() - 0.5);

        return {
          title: `Kondensator-Kapazität: Wie viel nF sind ${uf} µF?`,
          context: 'Wichtig beim Entstörkondensator, Anlaufkondensator und Blindleistung.',
          options,
          correctAnswer: `${nf} nF`,
          trick
        };
      }
    ]
  };

  function setMode(newMode) {
    state.mode = newMode;
    state.score = 0;
    state.currentIndex = 0;
    state.answered = false;
    state.selectedOption = null;
    generateNextQuestion();
    render();
  }

  function generateNextQuestion() {
    const list = GENERATORS[state.mode] || GENERATORS.tricks;
    const fn = list[Math.floor(Math.random() * list.length)];
    state.currentQuestion = fn();
    state.answered = false;
    state.selectedOption = null;
  }

  function answer(opt) {
    if (state.answered) return;
    state.answered = true;
    state.selectedOption = opt;

    const isRight = (opt === state.currentQuestion.correctAnswer);
    if (isRight) {
      state.score++;
      state.streak++;
      if (window.ElektroApp && window.ElektroApp.addXp) {
        window.ElektroApp.addXp(10);
      }
    } else {
      state.streak = 0;
    }
    render();
  }

  function next() {
    state.currentIndex++;
    if (state.currentIndex < state.roundTotal) {
      generateNextQuestion();
      render();
    } else {
      renderSummary();
    }
  }

  function restartRound() {
    state.currentIndex = 0;
    state.score = 0;
    generateNextQuestion();
    render();
  }

  function renderSummary() {
    const container = document.getElementById('math-trainer-container');
    if (!container) return;

    const pct = Math.round((state.score / state.roundTotal) * 100);
    container.innerHTML = `
      <div class="math-summary-card">
        <div style="font-size:2.5rem;margin-bottom:8px;">${pct >= 80 ? '🏆' : pct >= 50 ? '⚡' : '💪'}</div>
        <h3 style="font-size:1.2rem;font-weight:800;margin-bottom:4px;">Runde abgeschlossen!</h3>
        <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:14px;">
          Du hast <strong>${state.score} von ${state.roundTotal}</strong> Aufgaben richtig gelöst (${pct}%).
        </p>

        <div style="background:#090d16;padding:12px;border-radius:12px;border:1px solid #1e293b;margin-bottom:16px;">
          <div style="color:var(--accent-emerald);font-weight:700;">+${state.score * 10} XP gesammelt!</div>
          <div style="font-size:0.78rem;color:var(--text-muted);margin-top:4px;">
            ${pct === 100 ? 'Perfekt! Baustellen-Kopfrechnen sitzt bombenfest!' : 'Gute Routine! Mach gleich noch eine Runde, um noch schneller zu werden.'}
          </div>
        </div>

        <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
          <button class="btn-primary" onclick="ElektroMathTrainer.restartRound()">🔄 Nochmal spielen</button>
          <button class="btn-secondary" onclick="ElektroMathTrainer.setMode('${state.mode === 'tricks' ? 'site' : state.mode === 'site' ? 'units' : 'tricks'}')">
            Anderen Modus testen →
          </button>
        </div>
      </div>
    `;
  }

  function render() {
    const container = document.getElementById('math-trainer-container');
    if (!container) return;

    if (!state.currentQuestion) {
      generateNextQuestion();
    }

    const q = state.currentQuestion;

    const modeLabels = {
      tricks: '⚡ Kopfrechen-Hacks (Division, x15, x25, 1x1)',
      site: '📐 Baustellen-Maße (Flächen, 10% Verschnitt, Lampen)',
      units: '🔋 Einheiten-Blitz (mA, kΩ, µF/nF)'
    };

    const optionsHtml = q.options.map((opt) => {
      let cls = 'math-opt-btn';
      if (state.answered) {
        if (opt === q.correctAnswer) cls += ' correct';
        else if (opt === state.selectedOption) cls += ' wrong';
      }
      return `
        <button class="${cls}" ${state.answered ? 'disabled' : ''} onclick="ElektroMathTrainer.answer('${opt}')">
          ${opt}
        </button>
      `;
    }).join('');

    let feedbackHtml = '';
    if (state.answered) {
      const isRight = state.selectedOption === q.correctAnswer;
      feedbackHtml = `
        <div class="math-feedback ${isRight ? 'success' : 'fail'}">
          <div style="font-weight:800;margin-bottom:6px;">
            ${isRight ? '✅ Richtig gerechnet! (+10 XP)' : '❌ Nicht ganz! Hier ist der schnelle Trick:'}
          </div>
          <div class="math-trick-box">${q.trick}</div>
          <button class="btn-primary btn-sm" style="margin-top:12px;" onclick="ElektroMathTrainer.next()">
            ${state.currentIndex + 1 < state.roundTotal ? 'Nächste Aufgabe →' : 'Zur Zusammenfassung →'}
          </button>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="math-trainer-card">
        <div class="math-modes-nav">
          <button class="math-mode-pill ${state.mode === 'tricks' ? 'active' : ''}" onclick="ElektroMathTrainer.setMode('tricks')">
            ⚡ Tricks & Hacks
          </button>
          <button class="math-mode-pill ${state.mode === 'site' ? 'active' : ''}" onclick="ElektroMathTrainer.setMode('site')">
            📐 Baustellen-Mathe
          </button>
          <button class="math-mode-pill ${state.mode === 'units' ? 'active' : ''}" onclick="ElektroMathTrainer.setMode('units')">
            🔋 Einheiten-Blitz
          </button>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <span style="font-size:0.75rem;color:var(--text-muted);font-weight:700;">
            Aufgabe ${state.currentIndex + 1} von ${state.roundTotal}
          </span>
          <span class="badge badge-emerald">🔥 Streak: ${state.streak}</span>
        </div>

        <div class="math-question-title">${q.title}</div>
        <p style="font-size:0.78rem;color:var(--text-muted);margin-bottom:16px;">${q.context}</p>

        <div class="math-options-grid">${optionsHtml}</div>
        ${feedbackHtml}
      </div>
    `;
  }

  function init() {
    generateNextQuestion();
    render();
  }

  return {
    init,
    render,
    setMode,
    answer,
    next,
    restartRound
  };
})();
