// ============================================================================
// ElektroCoach PRO – Siemens LOGO! 8 Steuerungs-Simulator (eigenständiges Modul)
// 1. State: Eingänge I1–I4 (Schalter/Taster), Ausgänge Q1/Q2, TOFF-Timer, RS-Speicher
// 2. Presets: Treppenlicht (TOFF 3 s), Zweihand (UND), Wendeschütz (Verriegelung),
//    Selbsthaltung (RS, Reset-Vorrang), FUP-Sandbox (AND/OR/NAND/NOR/XOR/NOT)
// 3. UI: LOGO!-Gehäuse, Amber-LCD, Kipp-/Tastschalter, Relais-Leuchten, Live-FUP
// 4. API: ElektroLogo.render(containerEl) / ElektroLogo.destroy()
// ============================================================================

window.ElektroLogo = (function () {
  'use strict';

  const TOFF_MS = 3000;
  const TICK_MS = 50;

  // --------------------------------------------------------------------------
  // Grundfunktionen für die FUP-Sandbox (Symbole nach DIN EN 60617-12)
  // --------------------------------------------------------------------------
  const FUNCS = {
    AND:  { sym: '&',  neg: false, unary: false, name: 'UND',      f: (a, b) => a && b },
    OR:   { sym: '≥1', neg: false, unary: false, name: 'ODER',     f: (a, b) => a || b },
    NAND: { sym: '&',  neg: true,  unary: false, name: 'NICHT-UND', f: (a, b) => !(a && b) },
    NOR:  { sym: '≥1', neg: true,  unary: false, name: 'NICHT-ODER', f: (a, b) => !(a || b) },
    XOR:  { sym: '=1', neg: false, unary: false, name: 'EXKLUSIV-ODER', f: (a, b) => a !== b },
    NOT:  { sym: '1',  neg: true,  unary: true,  name: 'NICHT',    f: (a) => !a }
  };

  // --------------------------------------------------------------------------
  // Presets: Eingangstypen, Rollen, Ausgangsbezeichnungen & Lerntexte
  // --------------------------------------------------------------------------
  const PRESETS = {
    treppenlicht: {
      btn: '💡 Treppenlicht / Lüfter',
      title: 'Ausschaltverzögerung (TOFF) · B001',
      types: ['push', 'switch', 'switch', 'switch'],
      roles: ['Taster Licht', 'frei', 'frei', 'frei'],
      outputs: ['Licht / Lüfter', '—'],
      desc: 'I1 (Taster) schaltet Q1 <strong>sofort</strong> ein. Nach dem Loslassen läuft Q1 noch ' +
        '<strong>3 s nach</strong> (Ausschaltverzögerung TOFF). Erneutes Drücken während des Nachlaufs ' +
        'startet die Zeit neu (nachtriggerbar).',
      hint: 'Praxis: Im Treppenhaus oder beim Badlüfter stellt man mehrere Minuten Nachlauf ein. ' +
        'Prüfungsfrage-Klassiker: TON = Einschaltverzögerung, TOFF = Ausschaltverzögerung.'
    },
    zweihand: {
      btn: '✋✋ Zweihand (UND)',
      title: 'UND-Verknüpfung · B001',
      types: ['push', 'push', 'switch', 'switch'],
      roles: ['Hand links', 'Hand rechts', 'frei', 'frei'],
      outputs: ['Presse', '—'],
      desc: 'Q1 schaltet nur, solange <strong>I1 UND I2</strong> gleichzeitig gedrückt sind. ' +
        'Lässt der Bediener eine Hand los, fällt Q1 sofort ab – beide Hände sind außerhalb des Gefahrenbereichs.',
      hint: 'Achtung: Echte Zweihandschaltungen nach DIN EN ISO 13851 verlangen zusätzlich Gleichzeitigkeit ' +
        '(≤ 0,5 s) und eine sichere Steuerung. Eine Standard-LOGO! ist <strong>kein Sicherheitsbaustein</strong>.'
    },
    wendeschuetz: {
      btn: '🔁 Wendeschütz',
      title: 'Wendeschützschaltung mit Verriegelung · B001/B002',
      types: ['switch', 'switch', 'switch', 'switch'],
      roles: ['Rechtslauf', 'Linkslauf', 'frei', 'frei'],
      outputs: ['K1 Rechtslauf', 'K2 Linkslauf'],
      desc: 'I1 schaltet Q1 (Rechtslauf), I2 schaltet Q2 (Linkslauf). Die negierte Rückmeldung ' +
        '<strong>Q1 sperrt Q2</strong> und <strong>Q2 sperrt Q1</strong> – beide Schütze können nie gleichzeitig anziehen.',
      hint: 'Praxis: Zusätzlich zur Software-Verriegelung immer die Hardware-Verriegelung über die Öffner-Hilfskontakte ' +
        'von K1/K2 verdrahten. Klebt ein Schütz, verhindert nur sie den Kurzschluss zwischen zwei Außenleitern.'
    },
    selbsthaltung: {
      btn: '🔒 Selbsthaltung (RS)',
      title: 'Selbsthalterelais (RS, rücksetzdominant) · B001',
      types: ['push', 'push', 'switch', 'switch'],
      roles: ['Start (S)', 'Stopp (R)', 'frei', 'frei'],
      outputs: ['K1 Motor', '—'],
      desc: 'I1 (Start) <strong>setzt</strong> den Speicher, Q1 bleibt nach dem Loslassen an. ' +
        'I2 (Stopp) <strong>setzt zurück</strong>. Werden beide gleichzeitig gedrückt, gewinnt Reset (Reset-Vorrang).',
      hint: 'Praxis: Den Stopp-Taster als Öffner anschließen (drahtbruchsicher) und in der LOGO! negieren. ' +
        'Bei Maschinen muss Stopp immer Vorrang haben – darum rücksetzdominantes RS-Glied.'
    },
    fup_sandbox: {
      btn: '🧪 FUP-Sandbox',
      title: 'Grundfunktion · B001',
      types: ['switch', 'switch', 'switch', 'switch'],
      roles: ['Eingang A', 'Eingang B', 'frei', 'frei'],
      outputs: ['Ergebnis', '—'],
      desc: 'Wähle eine Grundfunktion und teste sie mit I1 und I2. Die Wahrheitstabelle markiert die ' +
        'aktuell anliegende Kombination.',
      hint: 'Merke: Der Kreis am Ausgang (Negation) dreht das Ergebnis um – NAND ist ein UND mit Kreis, NOR ein ODER mit Kreis.'
    }
  };

  // --------------------------------------------------------------------------
  // State
  // --------------------------------------------------------------------------
  const state = {
    preset: 'treppenlicht',
    fupFn: 'AND',
    inputs: [
      { id: 'I1', type: 'push', active: false },
      { id: 'I2', type: 'switch', active: false },
      { id: 'I3', type: 'switch', active: false },
      { id: 'I4', type: 'switch', active: false }
    ],
    outputs: [
      { id: 'Q1', active: false },
      { id: 'Q2', active: false }
    ],
    timer: { running: false, duration: TOFF_MS, endAt: 0, remaining: 0 },
    prevI1: false,  // Flankenerkennung für TOFF
    rs: false,      // RS-Speicherzustand
    blocked: '',    // Verriegelungsmeldung (Wendeschütz)
    sound: true
  };

  let root = null;       // Container-Element
  let els = null;        // gecachte DOM-Referenzen
  let tickId = null;     // setInterval-Handle des Timers
  let audioCtx = null;
  let listeners = [];    // registrierte Event-Listener (für destroy)
  const keyPressed = new Set(); // per Tastatur gehaltene Taster (Index)

  // --------------------------------------------------------------------------
  // Timer (TOFF)
  // --------------------------------------------------------------------------
  function now() {
    return (window.performance && performance.now) ? performance.now() : Date.now();
  }

  function startTimer() {
    state.timer.running = true;
    state.timer.endAt = now() + state.timer.duration;
    state.timer.remaining = state.timer.duration;
    if (tickId === null) tickId = setInterval(tick, TICK_MS);
  }

  function stopTimer() {
    state.timer.running = false;
    state.timer.remaining = 0;
    if (tickId !== null) {
      clearInterval(tickId);
      tickId = null;
    }
  }

  function tick() {
    if (!state.timer.running) {
      stopTimer();
      return;
    }
    state.timer.remaining = Math.max(0, state.timer.endAt - now());
    if (state.timer.remaining <= 0) stopTimer();
    evaluate();
    update();
  }

  // --------------------------------------------------------------------------
  // Steuerungslogik (ein Programmzyklus)
  // --------------------------------------------------------------------------
  function evaluate() {
    const I = state.inputs.map(i => i.active);
    const prevQ = state.outputs.map(q => q.active);
    let q1 = false;
    let q2 = false;
    state.blocked = '';

    switch (state.preset) {
      case 'treppenlicht': {
        if (I[0]) {
          if (state.timer.running) stopTimer();
          q1 = true;
        } else if (state.prevI1) {
          startTimer(); // fallende Flanke → Nachlauf starten
          q1 = true;
        } else {
          q1 = state.timer.running;
        }
        state.prevI1 = I[0];
        break;
      }
      case 'zweihand': {
        q1 = I[0] && I[1];
        break;
      }
      case 'wendeschuetz': {
        // Zyklus wiederholen, bis die Rückmeldungen stabil sind
        let a = prevQ[0];
        let b = prevQ[1];
        for (let n = 0; n < 4; n++) {
          const na = I[0] && !b;
          const nb = I[1] && !na;
          if (na === a && nb === b) break;
          a = na;
          b = nb;
        }
        q1 = a;
        q2 = b;
        if (I[0] && q2) state.blocked = 'I1 GESPERRT: Q2 EIN';
        else if (I[1] && q1) state.blocked = 'I2 GESPERRT: Q1 EIN';
        break;
      }
      case 'selbsthaltung': {
        if (I[1]) state.rs = false;      // Reset hat Vorrang
        else if (I[0]) state.rs = true;
        q1 = state.rs;
        break;
      }
      case 'fup_sandbox': {
        const fn = FUNCS[state.fupFn];
        q1 = fn.unary ? fn.f(I[0]) : fn.f(I[0], I[1]);
        break;
      }
    }

    const next = [!!q1, !!q2];
    next.forEach((on, i) => {
      if (on !== prevQ[i]) {
        state.outputs[i].active = on;
        relayFeedback(i, on);
      }
    });
  }

  // --------------------------------------------------------------------------
  // Relais-Klick (WebAudio, ohne externe Dateien)
  // --------------------------------------------------------------------------
  function playClick(on) {
    if (!state.sound) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtx) audioCtx = new Ctx();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const t = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(on ? 1900 : 1300, t);
      osc.frequency.exponentialRampToValueAtTime(220, t + 0.03);
      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.05);
    } catch (e) {
      // Audio ist optional – Fehler ignorieren
    }
  }

  function relayFeedback(idx, on) {
    playClick(on);
    if (!els || !els.lamps[idx]) return;
    const lamp = els.lamps[idx];
    lamp.classList.remove('elogo-clack');
    void lamp.offsetWidth; // Animation neu starten
    lamp.classList.add('elogo-clack');
  }

  // --------------------------------------------------------------------------
  // Preset / Eingänge
  // --------------------------------------------------------------------------
  function resetProgram() {
    stopTimer();
    state.inputs.forEach(inp => { inp.active = false; });
    state.outputs.forEach(q => { q.active = false; });
    state.prevI1 = false;
    state.rs = false;
    state.blocked = '';
  }

  function setPreset(id) {
    if (!PRESETS[id]) return;
    state.preset = id;
    resetProgram();
    PRESETS[id].types.forEach((t, i) => { state.inputs[i].type = t; });
    evaluate();
    renderDynamic();
    update();
  }

  function setFupFn(fn) {
    if (!FUNCS[fn]) return;
    state.fupFn = fn;
    evaluate();
    renderDynamic();
    update();
  }

  function canChangeType(idx) {
    return state.preset === 'fup_sandbox' || PRESETS[state.preset].roles[idx] === 'frei';
  }

  function toggleType(idx) {
    if (!canChangeType(idx)) return;
    const inp = state.inputs[idx];
    inp.type = inp.type === 'push' ? 'switch' : 'push';
    inp.active = false;
    evaluate();
    renderDynamic();
    update();
  }

  function setInput(idx, active) {
    const inp = state.inputs[idx];
    if (!inp || inp.active === active) return;
    inp.active = active;
    evaluate();
    update();
  }

  // --------------------------------------------------------------------------
  // LCD-Inhalt
  // --------------------------------------------------------------------------
  function fmtSec(ms) {
    return (ms / 1000).toFixed(1).padStart(4, '0');
  }

  function lcdMessage() {
    const I = state.inputs.map(i => i.active);
    const Q = state.outputs.map(q => q.active);
    switch (state.preset) {
      case 'treppenlicht':
        if (state.timer.running) return 'LÜFTER NACHLAUF: ' + fmtSec(state.timer.remaining) + 's';
        if (I[0]) return 'Q1 EIN · TASTER GEDRÜCKT';
        return 'BEREIT · TOFF ' + fmtSec(state.timer.duration) + 's';
      case 'zweihand':
        if (Q[0]) return 'PRESSE AKTIV · Q1 EIN';
        if (I[0]) return 'WARTE AUF I2 (RECHTS)';
        if (I[1]) return 'WARTE AUF I1 (LINKS)';
        return 'ZWEIHAND BEREIT';
      case 'wendeschuetz':
        if (state.blocked) return state.blocked;
        if (Q[0]) return 'RECHTSLAUF ▶ K1 EIN';
        if (Q[1]) return '◀ LINKSLAUF K2 EIN';
        return 'MOTOR STILLSTAND';
      case 'selbsthaltung':
        if (I[0] && I[1]) return 'RESET-VORRANG! Q1 AUS';
        if (Q[0]) return 'SELBSTHALTUNG · Q1 EIN';
        return 'AUS · WARTE AUF START';
      case 'fup_sandbox':
        return state.fupFn + ' → Q1 = ' + (Q[0] ? '1' : '0');
    }
    return '';
  }

  function lcdMatrix() {
    const digit = (on, ch) => `<span class="elogo-lcd-d${on ? ' is-inv' : ''}">${ch}</span>`;
    return 'I:' + state.inputs.map((x, i) => digit(x.active, i + 1)).join('') +
      '&nbsp;&nbsp;Q:' + state.outputs.map((q, i) => digit(q.active, i + 1)).join('');
  }

  // --------------------------------------------------------------------------
  // FUP-Diagramm (SVG). Leitungen tragen data-sig und werden in update() eingefärbt.
  // --------------------------------------------------------------------------
  const VB_W = 400;

  function wire(x1, y1, x2, y2, sig) {
    return `<line class="elogo-w" data-sig="${sig}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  }

  function neg(cx, cy, sig) {
    return `<circle class="elogo-neg" data-sig="${sig}" cx="${cx}" cy="${cy}" r="4.5"/>`;
  }

  function tag(x, y, label, sig) {
    return `<g class="elogo-tag" data-sig="${sig}">` +
      `<rect x="${x}" y="${y - 11}" width="44" height="22" rx="4"/>` +
      `<text x="${x + 22}" y="${y + 4.5}" text-anchor="middle">${label}</text></g>`;
  }

  // Allgemeiner Funktionsblock: Eingänge links, Ausgang rechts
  function block(o) {
    const bw = o.w || 70;
    const outY = o.y + o.h / 2;
    let s = '';
    o.inputs.forEach(inp => {
      s += tag(8, inp.y, inp.tag, inp.sig);
      s += wire(52, inp.y, inp.neg ? o.x - 9 : o.x, inp.y, inp.sig);
      if (inp.neg) s += neg(o.x - 4.5, inp.y, inp.sig);
      if (inp.pin) s += `<text class="elogo-pin" x="${o.x + 5}" y="${inp.y + 4}">${inp.pin}</text>`;
    });
    s += `<text class="elogo-bid" x="${o.x + bw / 2}" y="${o.y - 6}" text-anchor="middle">${o.id}</text>`;
    s += `<rect class="elogo-blk" data-sig="${o.out.sig}" x="${o.x}" y="${o.y}" width="${bw}" height="${o.h}" rx="3"/>`;
    if (o.sym) {
      s += `<text class="elogo-sym" x="${o.x + bw / 2}" y="${(o.symY || outY) + 9}" text-anchor="middle">${o.sym}</text>`;
    }
    if (o.inner) s += o.inner;
    if (o.out.pin) {
      s += `<text class="elogo-pin" x="${o.x + bw - 5}" y="${outY + 4}" text-anchor="end">${o.out.pin}</text>`;
    }
    const sx = o.out.neg ? o.x + bw + 9 : o.x + bw;
    if (o.out.neg) s += neg(o.x + bw + 4.5, outY, o.out.sig);
    s += wire(sx, outY, VB_W - 52, outY, o.out.sig);
    s += tag(VB_W - 52, outY, o.out.tag, o.out.sig);
    return s;
  }

  function fupSvg() {
    let h = 200;
    let body = '';
    switch (state.preset) {
      case 'treppenlicht': {
        const x = 150, y = 30, w = 110;
        const inner =
          // Zeitdiagramm-Symbol: kurzer Eingangsimpuls, verlängerter Ausgang
          `<path class="elogo-glyph" d="M${x + 22} ${y + 34} h8 v-14 h10 v14 h30"/>` +
          `<path class="elogo-glyph is-out" d="M${x + 22} ${y + 54} h8 v-14 h34 v14 h6"/>` +
          `<text class="elogo-par" x="${x + w / 2}" y="${y + 78}" text-anchor="middle">T = ${fmtSec(TOFF_MS)}s</text>` +
          `<text class="elogo-par is-live" data-text="ta" x="${x + w / 2}" y="${y + 96}" text-anchor="middle">Ta = 0.0s</text>` +
          `<rect class="elogo-bar-bg" x="${x + 12}" y="${y + 106}" width="${w - 24}" height="6" rx="3"/>` +
          `<rect class="elogo-bar" data-progress="${w - 24}" x="${x + 12}" y="${y + 106}" width="0" height="6" rx="3"/>`;
        body = block({
          id: 'B001 · TOFF', x, y, w, h: 140, inner,
          inputs: [
            { tag: 'I1', sig: 'I1', y: 70, pin: 'Trg' },
            { tag: '0', sig: 'LOW', y: 130, pin: 'R' }
          ],
          out: { tag: 'Q1', sig: 'Q1', pin: 'Q' }
        });
        break;
      }
      case 'zweihand': {
        body = block({
          id: 'B001', x: 165, y: 40, h: 120, sym: '&',
          inputs: [{ tag: 'I1', sig: 'I1', y: 70 }, { tag: 'I2', sig: 'I2', y: 130 }],
          out: { tag: 'Q1', sig: 'Q1' }
        });
        break;
      }
      case 'wendeschuetz': {
        h = 260;
        body = block({
          id: 'B001', x: 165, y: 22, h: 90, sym: '&',
          inputs: [{ tag: 'I1', sig: 'I1', y: 45 }, { tag: 'Q2', sig: 'Q2', y: 89, neg: true }],
          out: { tag: 'Q1', sig: 'Q1' }
        }) + block({
          id: 'B002', x: 165, y: 150, h: 90, sym: '&',
          inputs: [{ tag: 'I2', sig: 'I2', y: 173 }, { tag: 'Q1', sig: 'Q1', y: 217, neg: true }],
          out: { tag: 'Q2', sig: 'Q2' }
        });
        break;
      }
      case 'selbsthaltung': {
        body = block({
          id: 'B001 · RS', x: 160, y: 40, w: 80, h: 120, sym: 'RS', symY: 66,
          inner: `<text class="elogo-par" x="200" y="146" text-anchor="middle">R-Vorrang</text>`,
          inputs: [{ tag: 'I1', sig: 'I1', y: 70, pin: 'S' }, { tag: 'I2', sig: 'I2', y: 130, pin: 'R' }],
          out: { tag: 'Q1', sig: 'Q1', pin: 'Q' }
        });
        break;
      }
      case 'fup_sandbox': {
        const fn = FUNCS[state.fupFn];
        const inputs = fn.unary
          ? [{ tag: 'I1', sig: 'I1', y: 100 }]
          : [{ tag: 'I1', sig: 'I1', y: 70 }, { tag: 'I2', sig: 'I2', y: 130 }];
        body = block({
          id: 'B001 · ' + state.fupFn, x: 165, y: 40, h: 120, sym: fn.sym,
          inputs,
          out: { tag: 'Q1', sig: 'Q1', neg: fn.neg }
        });
        break;
      }
    }
    return `<svg class="elogo-fup" viewBox="0 0 ${VB_W} ${h}" role="img" ` +
      `aria-label="Funktionsplan ${PRESETS[state.preset].title}">${body}</svg>`;
  }

  function truthTable() {
    if (state.preset !== 'fup_sandbox') return '';
    const fn = FUNCS[state.fupFn];
    const a = state.inputs[0].active;
    const b = state.inputs[1].active;
    const rows = fn.unary ? [[false], [true]] : [[false, false], [false, true], [true, false], [true, true]];
    const bit = v => (v ? '1' : '0');
    const head = fn.unary ? '<th>I1</th><th>Q1</th>' : '<th>I1</th><th>I2</th><th>Q1</th>';
    const body = rows.map(r => {
      const cur = fn.unary ? r[0] === a : (r[0] === a && r[1] === b);
      const q = fn.unary ? fn.f(r[0]) : fn.f(r[0], r[1]);
      return `<tr class="${cur ? 'is-cur' : ''}">${r.map(v => `<td>${bit(v)}</td>`).join('')}` +
        `<td class="${q ? 'is-hi' : ''}">${bit(q)}</td></tr>`;
    }).join('');
    return `<div class="elogo-tt"><div class="elogo-sub">Wahrheitstabelle · ${fn.name}</div>` +
      `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
  }

  // --------------------------------------------------------------------------
  // Rendering
  // --------------------------------------------------------------------------
  function inputCard(i) {
    const inp = state.inputs[i];
    const role = PRESETS[state.preset].roles[i];
    const isPush = inp.type === 'push';
    const free = role === 'frei';
    const control = isPush
      ? `<button type="button" class="elogo-btn elogo-push" data-idx="${i}" aria-pressed="false" ` +
        `aria-label="${inp.id} Taster (gedrückt halten)"><span class="elogo-push-cap"></span></button>`
      : `<button type="button" class="elogo-btn elogo-switch" data-idx="${i}" aria-pressed="false" ` +
        `aria-label="${inp.id} Kippschalter"><span class="elogo-lever"></span></button>`;
    const typeBtn = canChangeType(i)
      ? `<button type="button" class="elogo-type" data-type-idx="${i}" title="Eingangstyp wechseln">⇄ ${isPush ? 'Schalter' : 'Taster'}</button>`
      : '';
    return `<div class="elogo-in${free ? ' is-free' : ''}">
        <div class="elogo-in-head"><span class="elogo-in-id">${inp.id}</span><span class="elogo-in-kind">${isPush ? 'Taster' : 'Schalter'}</span></div>
        ${control}
        <div class="elogo-in-role">${role}</div>
        <div class="elogo-in-state" data-state-idx="${i}">0</div>
        ${typeBtn}
      </div>`;
  }

  function lampCard(i) {
    const label = PRESETS[state.preset].outputs[i];
    return `<div class="elogo-out${label === '—' ? ' is-free' : ''}">
        <div class="elogo-lamp elogo-lamp-${i + 1}" data-lamp="${i}"><span class="elogo-lamp-glass"></span></div>
        <div class="elogo-out-id">Q${i + 1}</div>
        <div class="elogo-out-role">${label === '—' ? 'frei' : label}</div>
        <div class="elogo-out-contact" data-contact="${i}">Kontakt 1–2 offen</div>
      </div>`;
  }

  function renderDynamic() {
    if (!els) return;
    const p = PRESETS[state.preset];
    els.presetBtns.forEach(b => {
      const on = b.getAttribute('data-preset') === state.preset;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    els.inputs.innerHTML = [0, 1, 2, 3].map(inputCard).join('');
    els.outputs.innerHTML = [0, 1].map(lampCard).join('');
    els.fupTitle.textContent = p.title;
    els.fupFns.innerHTML = state.preset === 'fup_sandbox'
      ? Object.keys(FUNCS).map(k =>
        `<button type="button" class="elogo-fn${k === state.fupFn ? ' is-active' : ''}" data-fn="${k}">${k}</button>`).join('')
      : '';
    els.fup.innerHTML = fupSvg();
    els.info.innerHTML = `<p>${p.desc}</p><p class="elogo-hint">💡 ${p.hint}</p>`;

    els.lamps = Array.prototype.slice.call(els.outputs.querySelectorAll('[data-lamp]'));
    els.contacts = Array.prototype.slice.call(els.outputs.querySelectorAll('[data-contact]'));
    els.inBtns = Array.prototype.slice.call(els.inputs.querySelectorAll('.elogo-btn'));
    els.inStates = Array.prototype.slice.call(els.inputs.querySelectorAll('[data-state-idx]'));
    els.sigEls = Array.prototype.slice.call(els.fup.querySelectorAll('[data-sig]'));
    els.taText = els.fup.querySelector('[data-text="ta"]');
    els.bar = els.fup.querySelector('[data-progress]');
  }

  function update() {
    if (!els) return;
    const sig = {
      I1: state.inputs[0].active,
      I2: state.inputs[1].active,
      I3: state.inputs[2].active,
      I4: state.inputs[3].active,
      Q1: state.outputs[0].active,
      Q2: state.outputs[1].active
    };

    // Eingänge
    els.inBtns.forEach(btn => {
      const i = +btn.getAttribute('data-idx');
      const on = state.inputs[i].active;
      btn.classList.toggle('is-on', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    els.inStates.forEach(el => {
      const on = state.inputs[+el.getAttribute('data-state-idx')].active;
      el.textContent = on ? '1 · 230 V' : '0 · 0 V';
      el.classList.toggle('is-on', on);
    });

    // Ausgänge
    els.lamps.forEach((lamp, i) => lamp.classList.toggle('is-on', state.outputs[i].active));
    els.contacts.forEach((c, i) => {
      c.textContent = state.outputs[i].active ? 'Kontakt 1–2 geschlossen' : 'Kontakt 1–2 offen';
    });
    els.ledRun.classList.add('is-on');

    // LCD
    els.lcd1.textContent = 'LOGO! 230RCE · RUN';
    els.lcd2.innerHTML = lcdMatrix();
    els.lcd3.textContent = lcdMessage();
    els.lcd3.classList.toggle('is-alert', !!state.blocked ||
      (state.preset === 'selbsthaltung' && sig.I1 && sig.I2));

    // FUP-Signalpfade
    els.sigEls.forEach(el => el.classList.toggle('is-hi', !!sig[el.getAttribute('data-sig')]));
    if (els.taText) {
      els.taText.textContent = 'Ta = ' + fmtSec(state.timer.running ? state.timer.remaining : 0) + 's';
    }
    if (els.bar) {
      const full = +els.bar.getAttribute('data-progress');
      const ratio = state.timer.running ? state.timer.remaining / state.timer.duration
        : (sig.I1 && state.preset === 'treppenlicht' ? 1 : 0);
      els.bar.setAttribute('width', (full * ratio).toFixed(1));
    }

    // Wahrheitstabelle
    els.tt.innerHTML = truthTable();
  }

  function render(containerEl) {
    const el = typeof containerEl === 'string' ? document.getElementById(containerEl) : containerEl;
    if (!el) {
      console.warn('ElektroLogo.render: Container nicht gefunden.');
      return;
    }
    if (root) destroy();
    ensureStyles();
    root = el;

    const screw = label => `<div class="elogo-term"><span class="elogo-screw"></span><span>${label}</span></div>`;

    root.innerHTML = `
      <div class="elogo sim-card">
        <div class="elogo-header">
          <div>
            <span class="elogo-badge">Kleinsteuerung · FUP nach DIN EN 60617 / IEC 61131-3</span>
            <h3>📟 Siemens LOGO! 8 – Steuerungs-Labor</h3>
          </div>
          <div class="elogo-header-btns">
            <button type="button" class="elogo-mini" data-action="sound" aria-pressed="${state.sound}">${state.sound ? '🔊 Klick an' : '🔇 Klick aus'}</button>
            <button type="button" class="elogo-mini" data-action="reset" title="Programm neu starten (STOP → RUN)">⟲ Neustart</button>
          </div>
        </div>

        <div class="elogo-presets" role="group" aria-label="Programm wählen">
          ${Object.keys(PRESETS).map(id =>
            `<button type="button" class="elogo-preset" data-preset="${id}">${PRESETS[id].btn}</button>`).join('')}
        </div>

        <div class="elogo-grid">
          <div class="elogo-col">
            <div class="elogo-device">
              <div class="elogo-terms">${screw('L1')}${screw('N')}${screw('I1')}${screw('I2')}${screw('I3')}${screw('I4')}</div>
              <div class="elogo-face">
                <div class="elogo-brand">
                  <span class="elogo-siemens">SIEMENS</span>
                  <span class="elogo-name">LOGO!<sup>8</sup></span>
                </div>
                <div class="elogo-screen-row">
                  <div class="elogo-lcd" aria-live="polite">
                    <div class="elogo-lcd-row" data-lcd="1"></div>
                    <div class="elogo-lcd-row" data-lcd="2"></div>
                    <div class="elogo-lcd-row" data-lcd="3"></div>
                  </div>
                  <div class="elogo-keys" aria-hidden="true">
                    <span>ESC</span><span>▲</span><span>OK</span>
                    <span>◄</span><span>▼</span><span>►</span>
                  </div>
                </div>
                <div class="elogo-plate">
                  <span class="elogo-led" data-led="run"></span> RUN/STOP
                  <span class="elogo-plate-type">230RCE · 6ED1052-1FB08-0BA1</span>
                </div>
              </div>
              <div class="elogo-terms">${screw('Q1·1')}${screw('Q1·2')}${screw('Q2·1')}${screw('Q2·2')}</div>
            </div>

            <div class="elogo-sub">Relaisausgänge · Leuchtmelder</div>
            <div class="elogo-outs" data-el="outputs"></div>
          </div>

          <div class="elogo-col">
            <div class="elogo-fup-card">
              <div class="elogo-fup-head">
                <span>📐 <span data-el="fupTitle"></span></span>
                <span class="elogo-legend"><span><i class="hi"></i>1 / High</span><span><i></i>0 / Low</span><span><i class="neg"></i>Negation</span></span>
              </div>
              <div class="elogo-fns" data-el="fupFns"></div>
              <div data-el="fup"></div>
              <div data-el="tt"></div>
            </div>
            <div class="elogo-info" data-el="info"></div>
          </div>
        </div>

        <div class="elogo-sub">Eingänge · 230 V AC (Kippschalter = rastend, Taster = gedrückt halten)</div>
        <div class="elogo-ins" data-el="inputs"></div>
      </div>
    `;

    const q = sel => root.querySelector(sel);
    els = {
      presetBtns: Array.prototype.slice.call(root.querySelectorAll('[data-preset]')),
      inputs: q('[data-el="inputs"]'),
      outputs: q('[data-el="outputs"]'),
      fup: q('[data-el="fup"]'),
      fupFns: q('[data-el="fupFns"]'),
      fupTitle: q('[data-el="fupTitle"]'),
      tt: q('[data-el="tt"]'),
      info: q('[data-el="info"]'),
      lcd1: q('[data-lcd="1"]'),
      lcd2: q('[data-lcd="2"]'),
      lcd3: q('[data-lcd="3"]'),
      ledRun: q('[data-led="run"]'),
      soundBtn: q('[data-action="sound"]'),
      lamps: [], contacts: [], inBtns: [], inStates: [], sigEls: [], taText: null, bar: null
    };

    bindEvents();
    // Eingangstypen an das Preset angleichen (ohne Programm-Reset bei erneutem render)
    PRESETS[state.preset].types.forEach((t, i) => {
      if (!canChangeType(i)) state.inputs[i].type = t;
    });
    state.inputs.forEach(inp => { if (inp.type === 'push') inp.active = false; });
    renderDynamic();
    evaluate();
    update();
    if (state.timer.running && tickId === null) tickId = setInterval(tick, TICK_MS);
  }

  // --------------------------------------------------------------------------
  // Events (Delegation am Container, damit renderDynamic() nichts neu binden muss)
  // --------------------------------------------------------------------------
  function on(type, handler) {
    root.addEventListener(type, handler);
    listeners.push([type, handler]);
  }

  function pushIdx(target) {
    const btn = target && target.closest ? target.closest('.elogo-push') : null;
    return btn && root.contains(btn) ? +btn.getAttribute('data-idx') : -1;
  }

  function bindEvents() {
    on('pointerdown', e => {
      const idx = pushIdx(e.target);
      if (idx < 0 || (e.pointerType === 'mouse' && e.button !== 0)) return;
      e.preventDefault();
      const btn = e.target.closest('.elogo-push');
      try { btn.setPointerCapture(e.pointerId); } catch (err) { /* optional */ }
      btn.focus({ preventScroll: true });
      setInput(idx, true);
    });
    const release = e => {
      const idx = pushIdx(e.target);
      if (idx >= 0) setInput(idx, false);
    };
    on('pointerup', release);
    on('pointercancel', release);
    on('lostpointercapture', release);
    on('contextmenu', e => { if (pushIdx(e.target) >= 0) e.preventDefault(); });

    on('keydown', e => {
      if (e.repeat || (e.key !== ' ' && e.key !== 'Enter')) return;
      const idx = pushIdx(e.target);
      if (idx < 0) return;
      e.preventDefault();
      keyPressed.add(idx);
      setInput(idx, true);
    });
    on('keyup', e => {
      if (e.key !== ' ' && e.key !== 'Enter') return;
      const idx = pushIdx(e.target);
      if (idx < 0) return;
      e.preventDefault();
      keyPressed.delete(idx);
      setInput(idx, false);
    });
    // Nur per Tastatur gehaltene Taster beim Fokusverlust lösen – Maus/Touch
    // (Zweihand per Multitouch!) darf durch Fokuswechsel nicht abfallen.
    on('focusout', e => {
      const idx = pushIdx(e.target);
      if (idx >= 0 && keyPressed.delete(idx)) setInput(idx, false);
    });

    on('click', e => {
      const t = e.target;
      if (!t || !t.closest) return;
      const sw = t.closest('.elogo-switch');
      if (sw) {
        const idx = +sw.getAttribute('data-idx');
        setInput(idx, !state.inputs[idx].active);
        return;
      }
      const preset = t.closest('[data-preset]');
      if (preset) { setPreset(preset.getAttribute('data-preset')); return; }
      const fn = t.closest('[data-fn]');
      if (fn) { setFupFn(fn.getAttribute('data-fn')); return; }
      const typeBtn = t.closest('[data-type-idx]');
      if (typeBtn) { toggleType(+typeBtn.getAttribute('data-type-idx')); return; }
      const action = t.closest('[data-action]');
      if (action) {
        const a = action.getAttribute('data-action');
        if (a === 'reset') setPreset(state.preset);
        if (a === 'sound') {
          state.sound = !state.sound;
          action.textContent = state.sound ? '🔊 Klick an' : '🔇 Klick aus';
          action.setAttribute('aria-pressed', state.sound ? 'true' : 'false');
        }
      }
    });
  }

  // --------------------------------------------------------------------------
  // Aufräumen
  // --------------------------------------------------------------------------
  function destroy() {
    stopTimer();
    // Gedrückte Taster loslassen, damit beim nächsten render nichts "hängt"
    state.inputs.forEach(inp => { if (inp.type === 'push') inp.active = false; });
    if (root) listeners.forEach(([type, h]) => root.removeEventListener(type, h));
    listeners = [];
    keyPressed.clear();
    if (audioCtx && audioCtx.close) {
      try { audioCtx.close(); } catch (e) { /* ignorieren */ }
    }
    audioCtx = null;
    els = null;
    root = null;
  }

  // --------------------------------------------------------------------------
  // Styles (einmalig injiziert, Präfix "elogo-" vermeidet Konflikte)
  // --------------------------------------------------------------------------
  function ensureStyles() {
    if (document.getElementById('elogo-styles')) return;
    const style = document.createElement('style');
    style.id = 'elogo-styles';
    style.textContent = `
.elogo { --elogo-hi: #22c55e; --elogo-lo: #475569; --elogo-amber: #ffb000; --elogo-q2: #38bdf8;
  background: var(--bg-card, #131b2e); border: 1px solid var(--border, #23314f); border-radius: var(--radius, 16px);
  padding: 18px; color: var(--text-main, #f8fafc); }
.elogo h3 { margin: 6px 0 0; font-size: 1.15rem; }
.elogo-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
.elogo-header-btns { display: flex; gap: 8px; }
.elogo-badge { display: inline-block; font-size: .72rem; font-weight: 700; letter-spacing: .02em; color: #f59e0b;
  background: rgba(245,158,11,.12); border: 1px solid rgba(245,158,11,.35); border-radius: 999px; padding: 3px 10px; }
.elogo-mini { background: #1a2540; color: var(--text-main, #f8fafc); border: 1px solid var(--border, #23314f);
  border-radius: 10px; padding: 6px 12px; font-size: .8rem; cursor: pointer; }
.elogo-mini:hover { border-color: #38bdf8; }
.elogo-presets { display: flex; flex-wrap: wrap; gap: 6px; margin: 14px 0; }
.elogo-preset, .elogo-fn { background: #0f1626; color: var(--text-muted, #94a3b8); border: 1px solid var(--border, #23314f);
  border-radius: 10px; padding: 8px 12px; font-size: .85rem; font-weight: 600; cursor: pointer; transition: all .15s; }
.elogo-preset:hover, .elogo-fn:hover { color: #fff; border-color: #38bdf8; }
.elogo-preset.is-active, .elogo-fn.is-active { background: rgba(56,189,248,.15); color: #fff; border-color: #38bdf8; }
.elogo-fns { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.elogo-fns:empty { display: none; }
.elogo-fn { padding: 5px 10px; font-family: Consolas, 'Courier New', monospace; }
.elogo-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr); gap: 18px; }
@media (max-width: 820px) { .elogo-grid { grid-template-columns: 1fr; } }
.elogo-sub { font-size: .75rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em;
  color: var(--text-muted, #94a3b8); margin: 14px 0 8px; }

/* Gehäuse */
.elogo-device { background: linear-gradient(180deg, #3a3f47, #2a2e35); border: 1px solid #50565f; border-radius: 10px;
  padding: 8px; box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 10px 24px rgba(0,0,0,.45); }
.elogo-terms { display: flex; gap: 4px; background: #1c1f24; border-radius: 6px; padding: 5px; }
.elogo-term { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px;
  font: 600 .62rem Consolas, monospace; color: #9aa3ad; }
.elogo-screw { width: 14px; height: 14px; border-radius: 50%; background: radial-gradient(circle at 35% 35%, #c9ced4, #6b7280);
  position: relative; box-shadow: inset 0 -1px 2px rgba(0,0,0,.5); }
.elogo-screw::after { content: ''; position: absolute; left: 3px; right: 3px; top: 6px; height: 2px; background: #374151; transform: rotate(-35deg); }
.elogo-face { background: linear-gradient(180deg, #2f343b, #24282e); margin: 8px 0; border-radius: 6px; padding: 10px 12px;
  border: 1px solid #454b54; }
.elogo-brand { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }
.elogo-siemens { font: 800 .9rem Arial, sans-serif; letter-spacing: .08em; color: #2dd4bf; }
.elogo-name { font: 800 1.15rem Arial, sans-serif; color: #e5e7eb; font-style: italic; }
.elogo-name sup { color: #2dd4bf; font-size: .7em; margin-left: 2px; }
.elogo-screen-row { display: flex; gap: 12px; align-items: center; }
.elogo-lcd { flex: 1; min-width: 0; background: radial-gradient(ellipse at 30% 20%, #3a2600, #1d1300 70%); border: 3px solid #111;
  border-radius: 4px; padding: 8px 10px; box-shadow: inset 0 0 18px rgba(0,0,0,.8), 0 0 14px rgba(255,176,0,.12);
  font: 700 .86rem/1.55 Consolas, 'Courier New', monospace; color: var(--elogo-amber);
  text-shadow: 0 0 6px rgba(255,176,0,.65); }
.elogo-lcd-row { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-height: 1.55em; }
.elogo-lcd-row[data-lcd="3"].is-alert { animation: elogo-blink 1s steps(2, start) infinite; }
.elogo-lcd-d { display: inline-block; width: 1.1em; text-align: center; margin-left: 1px; border-radius: 2px; }
.elogo-lcd-d.is-inv { background: var(--elogo-amber); color: #1d1300; text-shadow: none; box-shadow: 0 0 8px rgba(255,176,0,.6); }
.elogo-keys { display: grid; grid-template-columns: repeat(3, 30px); gap: 4px; }
.elogo-keys span { display: flex; align-items: center; justify-content: center; height: 22px; border-radius: 4px;
  background: linear-gradient(180deg, #4b5159, #353a41); border: 1px solid #5d646d; font: 700 .58rem Arial, sans-serif; color: #cfd5db; }
.elogo-plate { display: flex; align-items: center; gap: 6px; margin-top: 8px; font: 600 .62rem Arial, sans-serif; color: #9aa3ad; }
.elogo-plate-type { margin-left: auto; opacity: .75; }
.elogo-led { width: 8px; height: 8px; border-radius: 50%; background: #14532d; }
.elogo-led.is-on { background: #4ade80; box-shadow: 0 0 8px #4ade80; }

/* Ausgänge */
.elogo-outs { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.elogo-out { background: #0f1626; border: 1px solid var(--border, #23314f); border-radius: 12px; padding: 12px; text-align: center; }
.elogo-out.is-free { opacity: .55; }
.elogo-lamp { width: 54px; height: 54px; margin: 0 auto 6px; border-radius: 50%; background: #1f2937; border: 4px solid #4b5563;
  display: flex; align-items: center; justify-content: center; transition: box-shadow .15s; }
.elogo-lamp-glass { width: 100%; height: 100%; border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, rgba(255,255,255,.25), rgba(30,41,59,.9) 60%); transition: background .15s; }
.elogo-lamp-1.is-on { box-shadow: 0 0 22px 6px rgba(34,197,94,.55); border-color: #16a34a; }
.elogo-lamp-1.is-on .elogo-lamp-glass { background: radial-gradient(circle at 35% 30%, #dcfce7, #22c55e 45%, #15803d); }
.elogo-lamp-2.is-on { box-shadow: 0 0 22px 6px rgba(56,189,248,.55); border-color: #0284c7; }
.elogo-lamp-2.is-on .elogo-lamp-glass { background: radial-gradient(circle at 35% 30%, #e0f2fe, #38bdf8 45%, #0369a1); }
.elogo-clack { animation: elogo-clack .18s ease-out; }
.elogo-out-id { font: 800 1rem Consolas, monospace; }
.elogo-out-role { font-size: .8rem; color: var(--text-muted, #94a3b8); }
.elogo-out-contact { font-size: .7rem; color: #64748b; margin-top: 4px; font-family: Consolas, monospace; }

/* Eingänge */
.elogo-ins { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
@media (max-width: 560px) { .elogo-ins { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.elogo-in { background: #0f1626; border: 1px solid var(--border, #23314f); border-radius: 12px; padding: 10px;
  display: flex; flex-direction: column; align-items: center; gap: 6px; }
.elogo-in.is-free { opacity: .6; }
.elogo-in-head { display: flex; justify-content: space-between; width: 100%; align-items: baseline; }
.elogo-in-id { font: 800 1rem Consolas, monospace; }
.elogo-in-kind { font-size: .7rem; color: var(--text-muted, #94a3b8); }
.elogo-in-role { font-size: .8rem; font-weight: 600; text-align: center; }
.elogo-in-state { font: 700 .72rem Consolas, monospace; color: #64748b; }
.elogo-in-state.is-on { color: var(--elogo-hi); }
.elogo-btn { border: none; background: none; padding: 0; cursor: pointer; -webkit-tap-highlight-color: transparent;
  touch-action: none; user-select: none; -webkit-user-select: none; }
.elogo-btn:focus-visible { outline: 2px solid #38bdf8; outline-offset: 4px; border-radius: 10px; }
.elogo-push { width: 62px; height: 62px; border-radius: 50%; background: radial-gradient(circle, #374151, #111827);
  border: 3px solid #6b7280; display: flex; align-items: center; justify-content: center; }
.elogo-push-cap { width: 42px; height: 42px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #86efac, #16a34a 60%, #14532d);
  box-shadow: 0 5px 0 #0b3d1f, 0 6px 10px rgba(0,0,0,.5); transform: translateY(-3px); transition: transform .06s, box-shadow .06s; }
.elogo-push.is-on .elogo-push-cap { transform: translateY(1px); box-shadow: 0 1px 0 #0b3d1f, 0 0 16px rgba(34,197,94,.7); }
.elogo-switch { width: 44px; height: 66px; border-radius: 8px; background: linear-gradient(180deg, #1f2937, #111827);
  border: 2px solid #6b7280; position: relative; }
.elogo-lever { position: absolute; left: 50%; top: 50%; width: 14px; height: 30px; margin: -26px 0 0 -7px; border-radius: 7px;
  background: linear-gradient(90deg, #9ca3af, #e5e7eb, #9ca3af); box-shadow: 0 3px 6px rgba(0,0,0,.6);
  transform-origin: 50% 100%; transform: rotate(180deg); transition: transform .12s; }
.elogo-switch.is-on { border-color: var(--elogo-hi); box-shadow: 0 0 12px rgba(34,197,94,.45); }
.elogo-switch.is-on .elogo-lever { transform: rotate(0deg); }
.elogo-type { background: none; border: 1px dashed #334155; color: var(--text-muted, #94a3b8); border-radius: 8px;
  font-size: .7rem; padding: 3px 8px; cursor: pointer; }
.elogo-type:hover { color: #fff; border-color: #38bdf8; }

/* FUP */
.elogo-fup-card { background: #0b1220; border: 1px solid var(--border, #23314f); border-radius: 12px; padding: 12px;
  background-image: radial-gradient(rgba(148,163,184,.08) 1px, transparent 1px); background-size: 14px 14px; }
.elogo-fup-head { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 6px; font-size: .85rem; font-weight: 700; margin-bottom: 8px; }
.elogo-legend { display: flex; gap: 10px; font-size: .7rem; font-weight: 500; color: var(--text-muted, #94a3b8); }
.elogo-legend i { display: inline-block; width: 14px; height: 3px; background: var(--elogo-lo); margin-right: 4px; vertical-align: middle; }
.elogo-legend i.hi { background: var(--elogo-hi); }
.elogo-legend i.neg { width: 8px; height: 8px; border-radius: 50%; background: none; border: 1.5px solid #cbd5e1; }
.elogo-fup { width: 100%; height: auto; display: block; }
.elogo-w { stroke: var(--elogo-lo); stroke-width: 3; stroke-linecap: round; transition: stroke .15s; }
.elogo-w.is-hi { stroke: var(--elogo-hi); stroke-dasharray: 8 5; animation: elogo-flow .5s linear infinite;
  filter: drop-shadow(0 0 3px rgba(34,197,94,.8)); }
.elogo-neg { fill: #0b1220; stroke: #cbd5e1; stroke-width: 2; }
.elogo-neg.is-hi { stroke: var(--elogo-hi); }
.elogo-tag rect { fill: #1e293b; stroke: var(--elogo-lo); stroke-width: 1.5; }
.elogo-tag text { fill: #cbd5e1; font: 700 12px Consolas, monospace; }
.elogo-tag.is-hi rect { fill: rgba(34,197,94,.18); stroke: var(--elogo-hi); }
.elogo-tag.is-hi text { fill: #bbf7d0; }
.elogo-blk { fill: #111a2e; stroke: #94a3b8; stroke-width: 2; transition: stroke .15s, fill .15s; }
.elogo-blk.is-hi { stroke: #38bdf8; fill: rgba(56,189,248,.1); filter: drop-shadow(0 0 5px rgba(56,189,248,.6)); }
.elogo-sym { fill: #f8fafc; font: 800 26px Consolas, 'Courier New', monospace; }
.elogo-bid { fill: #64748b; font: 600 10px Consolas, monospace; }
.elogo-pin { fill: #94a3b8; font: 600 10px Consolas, monospace; }
.elogo-par { fill: #cbd5e1; font: 600 11px Consolas, monospace; }
.elogo-par.is-live { fill: var(--elogo-amber); }
.elogo-glyph { fill: none; stroke: #94a3b8; stroke-width: 1.6; }
.elogo-glyph.is-out { stroke: #38bdf8; }
.elogo-bar-bg { fill: #1e293b; }
.elogo-bar { fill: var(--elogo-amber); }

/* Wahrheitstabelle & Info */
.elogo-tt table { border-collapse: collapse; font: 600 .85rem Consolas, monospace; margin-top: 4px; }
.elogo-tt th, .elogo-tt td { border: 1px solid #23314f; padding: 3px 14px; text-align: center; }
.elogo-tt th { color: var(--text-muted, #94a3b8); }
.elogo-tt td.is-hi { color: var(--elogo-hi); }
.elogo-tt tr.is-cur td { background: rgba(56,189,248,.15); }
.elogo-info { margin-top: 12px; font-size: .88rem; line-height: 1.5; color: #cbd5e1; }
.elogo-info p { margin: 0 0 8px; }
.elogo-hint { background: rgba(245,158,11,.08); border-left: 3px solid #f59e0b; padding: 8px 10px; border-radius: 6px; }

@keyframes elogo-flow { to { stroke-dashoffset: -13; } }
@keyframes elogo-blink { to { visibility: hidden; } }
@keyframes elogo-clack { 0% { transform: scale(1); } 40% { transform: scale(.9); } 100% { transform: scale(1); } }
@media (prefers-reduced-motion: reduce) {
  .elogo-w.is-hi, .elogo-lcd-row.is-alert, .elogo-clack { animation: none; }
}
`;
    document.head.appendChild(style);
  }

  return {
    render,
    destroy,
    // Für Tests / externe Steuerung
    setPreset,
    getState: () => JSON.parse(JSON.stringify(state))
  };
})();
