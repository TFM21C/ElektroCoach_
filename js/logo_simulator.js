// ============================================================================
// ElektroCoach PRO – 🛠️ Interaktives Schütz- & Steuerungs-Brett (V5, Neubau)
// 1. Steckbrett: 4 Strompfade zwischen L1/+24 V (oben) und N/0 V (unten),
//    je 5 Kontakt-Steckplätze (Zeile A–E) + 1 Aktor-Steckplatz (Spule/Lampe/Zeitrelais/RS)
//    + schaltbare Querbrücken zwischen benachbarten Pfaden nach jeder Zeile.
// 2. Bauteile: Drahtbrücke, Öffner/Schließer (Taster, Rastschalter, Hilfskontakte),
//    Motorschutz -F2 95–96, Schützspulen -K1/-K2/-K3, TON/TOFF, RS-Flip-Flop, Meldeleuchten.
// 3. 2-Phasen-Engine: Phase 1 Stromfluss (Union-Find über leitende Kontakte & Brücken),
//    Phase 2 genau EINE Spule umschalten (Abfallen vor Anziehen) → wiederholen bis stabil.
// 4. 5 Bauaufträge mit automatischem Prüf-Algorithmus (checkChallenge) & +50 XP.
// 5. API: ElektroLogo.render(containerEl) / ElektroLogo.destroy()
// ============================================================================

window.ElektroLogo = (function () {
  'use strict';

  const STORE_KEY = 'elektrocoach_schuetzbrett_v5';
  const COLS = 4;
  const ROWS = 5; // Kontaktzeilen A–E
  const ROW_NAMES = ['A', 'B', 'C', 'D', 'E'];
  const PAIRS = [[0, 1], [1, 2], [2, 3]]; // Querbrücken zwischen Nachbarpfaden
  const PAIR_KEYS = ['1-2', '2-3', '3-4'];
  const TON_MS = 2000;
  const TOFF_MS = 3000;
  const TICK_MS = 100;
  const XP_REWARD = 50;
  const OUT_LABELS = ['K1', 'K2', 'K3', 'K1T', 'K2T', 'B1', 'P1', 'P2'];

  // --------------------------------------------------------------------------
  // Bauteil-Katalog
  // --------------------------------------------------------------------------
  const BTN_LABELS = ['S0', 'S1', 'S2'];
  const AUX_LABELS = ['K1', 'K2', 'K3', 'K1T', 'K2T', 'B1'];

  const PARTS = {
    wire:   { kind: 'contact', name: 'Drahtbrücke', icon: '│', hint: 'Leitet immer' },
    open:   { kind: 'tool', name: 'Leer / Radierer', icon: '⌫', hint: 'Steckplatz leeren (Unterbrechung)' },
    f2_nc:  { kind: 'contact', name: 'Motorschutz -F2', icon: '🔥', labels: ['F2'], nc: true, act: 'thermal', hint: '95–96 Öffner' },
    btn_nc: { kind: 'contact', name: 'Taster Öffner', icon: '⏹', labels: BTN_LABELS, nc: true, act: 'push', flip: 'btn_no', hint: '11–12' },
    btn_no: { kind: 'contact', name: 'Taster Schließer', icon: '⏺', labels: BTN_LABELS, nc: false, act: 'push', flip: 'btn_nc', hint: '13–14' },
    sw_no:  { kind: 'contact', name: 'Rastschalter Schließer', icon: '⏻', labels: ['S3'], nc: false, act: 'latch', flip: 'sw_nc', hint: '-S3 13–14' },
    sw_nc:  { kind: 'contact', name: 'Rastschalter Öffner', icon: '⭘', labels: ['S3'], nc: true, act: 'latch', flip: 'sw_no', hint: '-S3 11–12' },
    aux_no: { kind: 'contact', name: 'Hilfskontakt Schließer', icon: '⊣', labels: AUX_LABELS, nc: false, act: 'aux', flip: 'aux_nc', hint: '13–14 (Selbsthaltung)' },
    aux_nc: { kind: 'contact', name: 'Hilfskontakt Öffner', icon: '⊢', labels: AUX_LABELS, nc: true, act: 'aux', flip: 'aux_no', hint: '21–22 (Verriegelung)' },
    coil_k1:    { kind: 'out', name: 'Schützspule -K1', icon: '▭', out: 'K1', cycle: 'coil_k2', hint: 'Rechtslauf / Netz' },
    coil_k2:    { kind: 'out', name: 'Schützspule -K2', icon: '▭', out: 'K2', cycle: 'coil_k3', hint: 'Linkslauf' },
    coil_k3:    { kind: 'out', name: 'Hilfsschütz -K3', icon: '▭', out: 'K3', cycle: 'coil_k1', hint: 'Hilfs-/Sternschütz' },
    timer_ton:  { kind: 'out', name: 'Zeitrelais TON -K1T', icon: '⏱', out: 'K1T', cycle: 'timer_toff', hint: 'Einschaltverzögert 2 s' },
    timer_toff: { kind: 'out', name: 'Zeitrelais TOFF -K2T', icon: '⏲', out: 'K2T', cycle: 'timer_ton', hint: 'Ausschaltverzögert 3 s' },
    rs_ff:      { kind: 'out', name: 'RS-Flip-Flop -B1', icon: '⧉', out: 'B1', hint: 'S = eigener Pfad, R = Nachbarpfad' },
    lamp_green: { kind: 'out', name: 'Meldeleuchte -P1 grün', icon: '◉', out: 'P1', cycle: 'lamp_red', hint: 'Betrieb' },
    lamp_red:   { kind: 'out', name: 'Meldeleuchte -P2 rot', icon: '◉', out: 'P2', cycle: 'lamp_green', hint: 'Störung' }
  };

  const PALETTE = [
    'wire', 'open', 'f2_nc', 'btn_nc', 'btn_no', 'aux_no', 'aux_nc', 'sw_no', 'sw_nc',
    'coil_k1', 'coil_k2', 'coil_k3', 'timer_ton', 'timer_toff', 'rs_ff', 'lamp_green', 'lamp_red'
  ];
  const DEFAULT_LABEL = { f2_nc: 'F2', btn_nc: 'S0', btn_no: 'S1', sw_no: 'S3', sw_nc: 'S3', aux_no: 'K1', aux_nc: 'K2' };

  function terminals(slot) {
    const isTimer = slot.l === 'K1T' || slot.l === 'K2T';
    switch (slot.t) {
      case 'f2_nc': return ['95', '96'];
      case 'btn_nc': case 'sw_nc': return ['11', '12'];
      case 'btn_no': case 'sw_no': return ['13', '14'];
      case 'aux_no': return isTimer ? ['17', '18'] : ['13', '14'];
      case 'aux_nc': return isTimer ? ['15', '16'] : ['21', '22'];
      default: return ['', ''];
    }
  }

  // --------------------------------------------------------------------------
  // Brett-Datenmodell & Builder für Start-/Musterlösungen
  // --------------------------------------------------------------------------
  function emptyBoard() {
    return {
      s: Array.from({ length: COLS }, () => Array.from({ length: ROWS }, () => null)),
      o: Array.from({ length: COLS }, () => null),
      b: PAIRS.map(() => Array.from({ length: ROWS }, () => false))
    };
  }

  function isValidBoard(b) {
    return b && Array.isArray(b.s) && b.s.length === COLS && b.s.every(col => Array.isArray(col) && col.length === ROWS) &&
      Array.isArray(b.o) && b.o.length === COLS && Array.isArray(b.b) && b.b.length === PAIRS.length;
  }

  // Lesbarer Builder: Pfad 1–4, Zeile 'A'–'E', Brücke '1-2' nach Zeile 'B' …
  function build() {
    const board = emptyBoard();
    const api = {
      put(path, row, t, l) {
        board.s[path - 1][ROW_NAMES.indexOf(row)] = { t, l: l || DEFAULT_LABEL[t] || '' };
        return api;
      },
      wires(path, rows) {
        rows.split('').forEach(r => api.put(path, r, 'wire'));
        return api;
      },
      out(path, t) {
        board.o[path - 1] = { t };
        return api;
      },
      bridge(pair, afterRow) {
        board.b[PAIR_KEYS.indexOf(pair)][ROW_NAMES.indexOf(afterRow)] = true;
        return api;
      },
      done: () => board
    };
    return api;
  }

  // Rechtslauf mit Selbsthaltung (Pfad 1+2) – Basis für mehrere Aufträge
  function baseSelbsthaltung() {
    return build()
      .put(1, 'A', 'f2_nc', 'F2').put(1, 'B', 'btn_nc', 'S0').put(1, 'C', 'btn_no', 'S1')
      .put(2, 'C', 'aux_no', 'K1')
      .bridge('1-2', 'B').bridge('1-2', 'C');
  }

  // --------------------------------------------------------------------------
  // Bauaufträge (Challenges) inkl. Prüf-Testfälle
  // --------------------------------------------------------------------------
  const SHORT_HINT = '💥 -K1 und -K2 waren gleichzeitig angezogen → Kurzschluss L1–L3 im Hauptstromkreis! ' +
    'Baue den Öffner -K2 (21–22) in Reihe vor die Spule -K1 und den Öffner -K1 (21–22) in Reihe vor die Spule -K2 (Schützverriegelung).';
  const OSC_HINT = '〰️ Die Schaltung schwingt (Spule schaltet sich über den eigenen Öffner ständig ab und wieder ein). ' +
    'Prüfe, ob irgendwo ein Öffner einer Spule im eigenen Strompfad sitzt.';

  const t = (label, actions, expect, hint) => ({ label, actions, expect, hint });

  const CHALLENGES = [
    {
      id: 'a1',
      nr: 1,
      mode: 'wende',
      tab: '1 · Selbsthaltung',
      title: 'Auftrag 1: Schütz-Selbsthaltung mit Vorrang Stopp (-K1)',
      goal: 'Ein Lüftermotor soll mit <strong>-S1</strong> eingeschaltet werden und nach dem Loslassen weiterlaufen. ' +
        '<strong>-S0</strong> schaltet ab – auch wenn -S1 gleichzeitig gedrückt ist (Vorrang AUS). ' +
        'Bei Überlast muss <strong>-F2</strong> abschalten.',
      steps: [
        'Pfad 1: Zeile A <strong>-F2 (95–96)</strong>, Zeile B <strong>-S0 Öffner (11–12)</strong>, Zeile C <strong>-S1 Schließer (13–14)</strong>.',
        'Zeilen D und E in Pfad 1 mit einer <strong>Drahtbrücke │</strong> schließen – ein leerer Steckplatz ist eine Unterbrechung!',
        'Pfad 2, Zeile C: <strong>Hilfskontakt -K1 Schließer (13–14)</strong> = Selbsthaltung.',
        'Querbrücken <strong>1↔2 nach Zeile B und nach Zeile C</strong> setzen → -K1 (13–14) liegt parallel zu -S1.',
        'Aktor-Zeile Pfad 1: <strong>Spule -K1 (A1–A2)</strong>.'
      ],
      start: () => build().wires(1, 'ABCDE').out(1, 'coil_k1').done(),
      solution: () => baseSelbsthaltung().wires(1, 'DE').out(1, 'coil_k1').done(),
      tests: [
        t('Ruhezustand: -K1 ist abgefallen', [], { K1: 0 },
          'Im Ruhezustand fließt Strom zur Spule. Steckt noch eine Drahtbrücke statt -S1? -S1 muss ein Schließer (13–14) sein.'),
        t('-S1 kurz tasten → -K1 zieht an und hält sich selbst', [['tap', 'S1']], { K1: 1 },
          'Fällt -K1 nach dem Loslassen ab (Tippbetrieb)? Dann fehlt der Selbsthalte-Schließer -K1 (13–14) parallel zu -S1 (Pfad 2 + Querbrücken 1↔2 nach B und C). ' +
          'Zieht -K1 gar nicht an? Leere Steckplätze im Pfad mit Drahtbrücken schließen.'),
        t('-S0 tasten → -K1 fällt ab', [['tap', 'S0']], { K1: 0 },
          '-S0 muss ein Öffner (11–12) VOR der Parallelschaltung -S1 ∥ -K1 sein – sonst wird er von der Selbsthaltung überbrückt.'),
        t('-S0 und -S1 gleichzeitig drücken → AUS hat Vorrang', [['press', 'S0'], ['press', 'S1']], { K1: 0 },
          'Vorrang AUS: -S0 muss in Reihe vor -S1 liegen, damit ein gedrückter Stopp-Taster immer gewinnt.'),
        t('Loslassen, wieder einschalten, Überlast -F2 auslösen → -K1 fällt ab',
          [['release', 'S1'], ['release', 'S0'], ['tap', 'S1'], ['trip']], { K1: 0 },
          'Der Öffner -F2 (95–96) des Motorschutzrelais gehört in Reihe in den Steuerstromkreis von -K1.'),
        t('-F2 zurücksetzen → Motor läuft NICHT von selbst wieder an', [['reset']], { K1: 0 },
          'Nach einer Überlast darf der Motor nicht selbsttätig anlaufen – die Selbsthaltung muss durch -F2 unterbrochen werden.')
      ]
    },
    {
      id: 'a2',
      nr: 2,
      mode: 'wende',
      tab: '2 · Wendeschütz Über-AUS',
      title: 'Auftrag 2: Wendeschützschaltung mit Schützverriegelung (Über-AUS)',
      goal: 'Rechtslauf <strong>-K1</strong> über -S1, Linkslauf <strong>-K2</strong> über -S2 – jeweils mit Selbsthaltung. ' +
        'Zum Umschalten muss erst <strong>-S0</strong> gedrückt werden (Über-AUS). <strong>-K1 und -K2 dürfen NIE gleichzeitig anziehen</strong> ' +
        '(Kurzschluss im Hauptstromkreis!).',
      steps: [
        'Rechtslauf steht schon in Pfad 1+2. Ergänze in Pfad 1, Zeile D den <strong>Öffner -K2 (21–22)</strong>.',
        'Pfad 3: Zeile C <strong>-S2 Schließer</strong>, Zeile D <strong>Öffner -K1 (21–22)</strong>, Zeile E Drahtbrücke, Aktor <strong>-K2</strong>.',
        'Pfad 4, Zeile C: <strong>Selbsthaltung -K2 (13–14)</strong>, Querbrücken <strong>3↔4 nach B und C</strong>.',
        'Gemeinsame Versorgung: Querbrücke <strong>2↔3 nach Zeile B</strong> – so speisen -F2 und -S0 beide Drehrichtungen.',
        'Pfade 3 und 4 haben in Zeile A/B KEINE Drahtbrücke – sonst würden -F2/-S0 umgangen!'
      ],
      start: () => baseSelbsthaltung().wires(1, 'DE').out(1, 'coil_k1').out(3, 'coil_k2').done(),
      solution: () => baseSelbsthaltung()
        .put(1, 'D', 'aux_nc', 'K2').wires(1, 'E').out(1, 'coil_k1')
        .put(3, 'C', 'btn_no', 'S2').put(3, 'D', 'aux_nc', 'K1').wires(3, 'E').out(3, 'coil_k2')
        .put(4, 'C', 'aux_no', 'K2')
        .bridge('2-3', 'B').bridge('3-4', 'B').bridge('3-4', 'C')
        .done(),
      tests: [
        t('Ruhezustand: -K1 = 0, -K2 = 0', [], { K1: 0, K2: 0 }, 'Im Ruhezustand darf kein Schütz anziehen – prüfe Schließer/Öffner der Taster.'),
        t('-S1 tasten → Rechtslauf -K1 bleibt an', [['tap', 'S1']], { K1: 1, K2: 0 },
          'Rechtslauf: -S1 (13–14) mit Selbsthaltung -K1 (13–14) parallel – und der Öffner -K2 (21–22) in Reihe.'),
        t('-S2 drücken, während -K1 läuft → -K2 darf NICHT anziehen', [['tap', 'S2']], { K1: 1, K2: 0 },
          'Schützverriegelung fehlt: Der Öffner -K1 (21–22) muss in Reihe im Strompfad von -K2 liegen.'),
        t('-S0 tasten → alles aus', [['tap', 'S0']], { K1: 0, K2: 0 },
          '-S0 muss beide Drehrichtungen abschalten: Gemeinsame Versorgung über die Querbrücke 2↔3 nach -S0 (Zeile B).'),
        t('-S2 tasten → Linkslauf -K2 bleibt an', [['tap', 'S2']], { K1: 0, K2: 1 },
          'Linkslauf: -S2 (13–14) in Pfad 3, Selbsthaltung -K2 (13–14) in Pfad 4, Querbrücken 3↔4 nach B und C.'),
        t('-S1 drücken, während -K2 läuft → -K1 darf NICHT anziehen', [['tap', 'S1']], { K1: 0, K2: 1 },
          'Der Öffner -K2 (21–22) muss in Reihe im Strompfad von -K1 liegen.'),
        t('Überlast -F2 → beide Drehrichtungen aus', [['trip']], { K1: 0, K2: 0 },
          '-F2 (95–96) muss VOR der Aufteilung in Rechts- und Linkslauf liegen.')
      ]
    },
    {
      id: 'a3',
      nr: 3,
      mode: 'wende',
      tab: '3 · Wendeschütz direkt',
      title: 'Auftrag 3: Wendeschütz mit Taster- UND Schützverriegelung (direktes Umschalten)',
      goal: 'Wie Auftrag 2 – aber man soll <strong>direkt von Rechts auf Links umschalten</strong> können, ohne vorher -S0 zu drücken. ' +
        'Dazu kommt zur Schützverriegelung die <strong>Tasterverriegelung</strong>: Öffner von -S2 im Rechtslauf-Pfad, Öffner von -S1 im Linkslauf-Pfad.',
      steps: [
        'Gleiches Label = gleicher Taster: Ein <strong>-S2 Öffner</strong> in Pfad 1 schaltet gleichzeitig mit dem -S2 Schließer in Pfad 3.',
        'Pfad 1: A -F2 · B -S0 · C -S1 Schließer · D <strong>-S2 Öffner</strong> · E <strong>-K2 (21–22)</strong>.',
        'Pfad 3: C -S2 Schließer · D <strong>-S1 Öffner</strong> · E <strong>-K1 (21–22)</strong>.',
        'Die Schützverriegelung bleibt Pflicht! Sie schützt, falls ein Schütz mechanisch hängt (verschweißte Kontakte).'
      ],
      start: () => CHALLENGES[1].solution(),
      solution: () => baseSelbsthaltung()
        .put(1, 'D', 'btn_nc', 'S2').put(1, 'E', 'aux_nc', 'K2').out(1, 'coil_k1')
        .put(3, 'C', 'btn_no', 'S2').put(3, 'D', 'btn_nc', 'S1').put(3, 'E', 'aux_nc', 'K1').out(3, 'coil_k2')
        .put(4, 'C', 'aux_no', 'K2')
        .bridge('2-3', 'B').bridge('3-4', 'B').bridge('3-4', 'C')
        .done(),
      tests: [
        t('Ruhezustand: -K1 = 0, -K2 = 0', [], { K1: 0, K2: 0 }, 'Im Ruhezustand darf kein Schütz anziehen.'),
        t('-S1 tasten → Rechtslauf -K1', [['tap', 'S1']], { K1: 1, K2: 0 }, 'Rechtslauf mit Selbsthaltung prüfen.'),
        t('-S2 tasten → direkt Linkslauf: -K1 fällt ab, -K2 zieht an', [['tap', 'S2']], { K1: 0, K2: 1 },
          'Tasterverriegelung fehlt: Der Öffner -S2 (11–12) muss in Reihe im Pfad von -K1 liegen – er trennt -K1, damit -K2 anziehen kann.'),
        t('-S1 tasten → direkt zurück auf Rechtslauf', [['tap', 'S1']], { K1: 1, K2: 0 },
          'Der Öffner -S1 (11–12) muss in Reihe im Pfad von -K2 liegen.'),
        t('-S0 tasten → alles aus', [['tap', 'S0']], { K1: 0, K2: 0 }, '-S0 muss beide Zweige versorgen (Querbrücke 2↔3 nach Zeile B).'),
        t('-S1 und -S2 gleichzeitig drücken → keiner zieht an', [['press', 'S1'], ['press', 'S2']], { K1: 0, K2: 0 },
          'Beide Taster gedrückt: Jeder Öffner sperrt den anderen Zweig.'),
        t('-K1 hängt mechanisch (verschweißt) → -K2 darf trotz -S2 NICHT anziehen',
          [['release', 'S1'], ['release', 'S2'], ['tap', 'S0'], ['stick', 'K1'], ['tap', 'S2']], { K1: 1, K2: 0 },
          'Nur Tasterverriegelung reicht nicht! Bei einem klebenden -K1 schützt allein der Öffner -K1 (21–22) im Pfad von -K2.'),
        t('Überlast -F2 → alles aus', [['unstick', 'K1'], ['trip']], { K1: 0, K2: 0 }, '-F2 muss vor der Aufteilung liegen.')
      ]
    },
    {
      id: 'a4',
      nr: 4,
      mode: 'folge',
      tab: '4 · Folgeschaltung',
      title: 'Auftrag 4: Folgeschaltung – Förderband -K2 erst, wenn Absaugung -K1 läuft',
      goal: 'In der Schreinerei darf das Förderband <strong>-K2</strong> (Start -S2) nur laufen, wenn die Absaugung <strong>-K1</strong> ' +
        '(Start -S1) bereits läuft. Fällt die Absaugung aus (Überlast -F2), muss das Band sofort mit stoppen. -S0 stoppt beides.',
      steps: [
        'Pfad 1+2: Absaugung -K1 mit Selbsthaltung (wie Auftrag 1).',
        'Pfad 3+4: Förderband -K2 mit -S2 Schließer und Selbsthaltung -K2 (13–14), Querbrücken 3↔4 nach B und C.',
        'In Pfad 3 unterhalb der Selbsthaltung (Zeile D): <strong>Schließer -K1 (13–14)</strong> in Reihe = Folgeverriegelung.',
        'Gemeinsame Versorgung über -F2 und -S0: Querbrücke 2↔3 nach Zeile B.'
      ],
      start: () => build().put(1, 'A', 'f2_nc', 'F2').put(1, 'B', 'btn_nc', 'S0').out(1, 'coil_k1').out(3, 'coil_k2').done(),
      solution: () => baseSelbsthaltung().wires(1, 'DE').out(1, 'coil_k1')
        .put(3, 'C', 'btn_no', 'S2').put(3, 'D', 'aux_no', 'K1').wires(3, 'E').out(3, 'coil_k2')
        .put(4, 'C', 'aux_no', 'K2')
        .bridge('2-3', 'B').bridge('3-4', 'B').bridge('3-4', 'C')
        .done(),
      tests: [
        t('Ruhezustand: beide Motoren aus', [], { K1: 0, K2: 0 }, 'Im Ruhezustand darf kein Schütz anziehen.'),
        t('-S2 tasten, Absaugung aus → Förderband darf NICHT starten', [['tap', 'S2']], { K1: 0, K2: 0 },
          'Folgeverriegelung fehlt: Schließer -K1 (13–14) in Reihe in den Strompfad von -K2 setzen.'),
        t('-S1 tasten → Absaugung -K1 läuft', [['tap', 'S1']], { K1: 1, K2: 0 }, 'Absaugung -K1 mit Selbsthaltung bauen.'),
        t('-S2 tasten → Förderband -K2 läuft zusätzlich', [['tap', 'S2']], { K1: 1, K2: 1 },
          'Förderband: -S2 Schließer + Selbsthaltung -K2 (13–14) parallel zu -S2, Versorgung über Querbrücke 2↔3.'),
        t('Überlast -F2 an der Absaugung → Förderband stoppt mit', [['trip']], { K1: 0, K2: 0 },
          'Der Schließer -K1 muss in Reihe UNTERHALB der -K2-Selbsthaltung sitzen – sonst hält sich -K2 weiter selbst.'),
        t('-F2 zurück, beide starten, -S0 → beide aus', [['reset'], ['tap', 'S1'], ['tap', 'S2'], ['tap', 'S0']], { K1: 0, K2: 0 },
          '-S0 muss vor der Aufteilung liegen und beide Pfade versorgen.')
      ]
    },
    {
      id: 'a5',
      nr: 5,
      mode: 'wende',
      tab: '5 · Freies Brett',
      sandbox: true,
      title: 'Auftrag 5: Freies Montagebrett (Sandbox)',
      goal: 'Bau, was du willst: Öffner, Schließer, Rastschalter -S3, Zeitrelais <strong>TON -K1T</strong> (zieht nach 2 s Dauerstrom an) ' +
        'und <strong>TOFF -K2T</strong> (hält 3 s nach), <strong>RS-Flip-Flop -B1</strong> (Setzen über den eigenen Pfad, ' +
        'Rücksetzen über den Nachbarpfad 1↔2 bzw. 3↔4, Reset-Vorrang) und Meldeleuchten.',
      steps: [
        'Kontakte eines Zeitrelais: Hilfskontakt mit Label -K1T bzw. -K2T (Klemmen 17–18 Schließer / 15–16 Öffner).',
        'RS-Flip-Flop in Aktor-Zeile Pfad 3: S = Strom in Pfad 3, R = Strom in Pfad 4 (Pfad 4 ohne Aktor lassen).',
        'Beispiel: Pfad 1 -S1 → TON -K1T, Pfad 2 -K1T (17–18) → Lampe -P1. -S1 gedrückt halten und 2 s warten!'
      ],
      start: () => emptyBoard(),
      solution: () => build()
        .put(1, 'A', 'btn_no', 'S1').wires(1, 'BCDE').out(1, 'timer_ton')
        .put(2, 'A', 'aux_no', 'K1T').wires(2, 'BCDE').out(2, 'lamp_green')
        .put(3, 'A', 'btn_no', 'S2').wires(3, 'BCDE').out(3, 'rs_ff')
        .put(4, 'A', 'btn_no', 'S0').wires(4, 'BCDE')
        .done(),
      tests: []
    }
  ];

  // --------------------------------------------------------------------------
  // Laufzeit-Zustand & Engine
  // --------------------------------------------------------------------------
  function freshRuntime() {
    const out = {};
    OUT_LABELS.forEach(l => { out[l] = false; });
    return {
      pressed: { S0: false, S1: false, S2: false },
      latched: { S3: false },
      f2Tripped: false,
      out,
      stuck: {},
      timers: { K1T: { since: null }, K2T: { wasOn: false, offAt: null } },
      power: null,
      shortSeen: false,
      oscillating: false
    };
  }

  function conducts(slot, rt) {
    if (!slot) return false;
    switch (slot.t) {
      case 'wire': return true;
      case 'f2_nc': return !rt.f2Tripped;
      case 'btn_no': return !!rt.pressed[slot.l];
      case 'btn_nc': return !rt.pressed[slot.l];
      case 'sw_no': return !!rt.latched[slot.l];
      case 'sw_nc': return !rt.latched[slot.l];
      case 'aux_no': return !!rt.out[slot.l];
      case 'aux_nc': return !rt.out[slot.l];
      default: return false;
    }
  }

  // Phase 1: Stromfluss über Union-Find (Kontakte sind in beide Richtungen leitend – wie echte Klemmstellen)
  function computePower(board, rt) {
    const per = ROWS + 1;
    const TOP = COLS * per;
    const parent = Array.from({ length: TOP + 1 }, (_, i) => i);
    const find = x => {
      while (parent[x] !== x) {
        parent[x] = parent[parent[x]];
        x = parent[x];
      }
      return x;
    };
    const union = (a, b) => { parent[find(a)] = find(b); };
    const id = (c, l) => c * per + l;

    for (let c = 0; c < COLS; c++) {
      union(id(c, 0), TOP);
      for (let r = 0; r < ROWS; r++) {
        if (conducts(board.s[c][r], rt)) union(id(c, r), id(c, r + 1));
      }
    }
    PAIRS.forEach(([a, b], p) => {
      for (let l = 1; l <= ROWS; l++) {
        if (board.b[p][l - 1]) union(id(a, l), id(b, l));
      }
    });
    const top = find(TOP);
    const live = [];
    for (let c = 0; c < COLS; c++) {
      live.push([]);
      for (let l = 0; l <= ROWS; l++) live[c].push(find(id(c, l)) === top);
    }
    return live; // live[c][l]
  }

  function partnerOf(c) {
    return c ^ 1; // 0↔1, 2↔3
  }

  // Sollzustand aller Ausgänge aus dem Stromfluss (inkl. Zeitrelais & Flip-Flop)
  function computeDesired(board, rt, live, now) {
    const d = {};
    const coilPow = {};
    OUT_LABELS.forEach(l => { d[l] = false; coilPow[l] = false; });
    let ffSet = false, ffReset = false, hasFF = false;

    board.o.forEach((o, c) => {
      if (!o) return;
      const inPow = live[c][ROWS];
      const lbl = PARTS[o.t].out;
      if (o.t === 'rs_ff') {
        hasFF = true;
        if (inPow) ffSet = true;
        if (live[partnerOf(c)][ROWS] && !board.o[partnerOf(c)]) ffReset = true;
      } else {
        coilPow[lbl] = coilPow[lbl] || inPow;
      }
    });

    ['K1', 'K2', 'K3', 'P1', 'P2'].forEach(l => { d[l] = coilPow[l]; });

    // TON: Kontakte schalten erst nach 2 s ununterbrochenem Spulenstrom
    const ton = rt.timers.K1T;
    if (coilPow.K1T) {
      if (ton.since === null) ton.since = now;
      d.K1T = now - ton.since >= TON_MS;
    } else {
      ton.since = null;
      d.K1T = false;
    }

    // TOFF: Kontakte schalten sofort, fallen erst 3 s nach Stromende ab
    const toff = rt.timers.K2T;
    if (coilPow.K2T) {
      toff.wasOn = true;
      toff.offAt = null;
      d.K2T = true;
    } else {
      if (toff.wasOn) {
        toff.wasOn = false;
        toff.offAt = now;
      }
      if (toff.offAt !== null && now - toff.offAt >= TOFF_MS) toff.offAt = null;
      d.K2T = toff.offAt !== null;
    }

    // RS-Flip-Flop mit Reset-Vorrang
    if (hasFF) d.B1 = ffReset ? false : (ffSet ? true : rt.out.B1);

    Object.keys(rt.stuck).forEach(l => { if (rt.stuck[l]) d[l] = true; });
    return d;
  }

  // Phase 2: Pro Durchlauf genau EINE Änderung (Abfallen vor Anziehen) → bis stabil
  function settle(board, rt, now, onStep) {
    for (let iter = 0; iter < 64; iter++) {
      const live = computePower(board, rt);
      const d = computeDesired(board, rt, live, now);
      let change = OUT_LABELS.find(l => rt.out[l] && !d[l]);
      if (!change) change = OUT_LABELS.find(l => !rt.out[l] && d[l]);
      if (!change) {
        rt.power = live;
        return true;
      }
      rt.out[change] = d[change];
      if (onStep) onStep(rt);
    }
    rt.oscillating = true;
    rt.power = computePower(board, rt);
    return false;
  }

  function timersPending(rt) {
    return (rt.timers.K1T.since !== null && !rt.out.K1T) || rt.timers.K2T.offAt !== null;
  }

  // --------------------------------------------------------------------------
  // Automatischer Schaltungs-Prüfer (headless, virtuelle Uhr)
  // --------------------------------------------------------------------------
  function checkChallenge(ch, board) {
    const rt = freshRuntime();
    let now = 0;
    let shortHit = false;
    const watch = r => {
      if (ch.mode === 'wende' && r.out.K1 && r.out.K2) shortHit = true;
    };
    const run = () => {
      settle(board, rt, now, watch);
      now += 150;
    };
    const apply = ([act, arg]) => {
      if (act === 'press') rt.pressed[arg] = true;
      else if (act === 'release') rt.pressed[arg] = false;
      else if (act === 'trip') rt.f2Tripped = true;
      else if (act === 'reset') rt.f2Tripped = false;
      else if (act === 'stick') rt.stuck[arg] = true;
      else if (act === 'unstick') delete rt.stuck[arg];
      if (act === 'tap') {
        rt.pressed[arg] = true;
        run();
        rt.pressed[arg] = false;
      }
      run();
    };

    run();
    const results = [];
    for (const test of ch.tests) {
      test.actions.forEach(apply);
      const got = {};
      let ok = true;
      Object.keys(test.expect).forEach(k => {
        got[k] = rt.out[k] ? 1 : 0;
        if (got[k] !== test.expect[k]) ok = false;
      });
      const pass = ok && !shortHit && !rt.oscillating;
      results.push({
        label: test.label,
        pass,
        expect: test.expect,
        got,
        hint: shortHit ? SHORT_HINT : rt.oscillating ? OSC_HINT : test.hint
      });
      if (!pass) break;
    }
    const passed = results.length === ch.tests.length && results.every(r => r.pass);
    return { passed, results };
  }

  // --------------------------------------------------------------------------
  // Persistenz (Brett-Stand je Auftrag, gelöste Aufträge)
  // --------------------------------------------------------------------------
  const store = loadStore();

  function loadStore() {
    const def = { active: 'a1', boards: {}, solved: {}, peeked: {} };
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (raw && typeof raw === 'object') {
        const s = Object.assign(def, raw);
        Object.keys(s.boards).forEach(k => { if (!isValidBoard(s.boards[k])) delete s.boards[k]; });
        if (!CHALLENGES.some(c => c.id === s.active)) s.active = 'a1';
        return s;
      }
    } catch (e) { /* ignorieren */ }
    return def;
  }

  function saveStore() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(store));
    } catch (e) { /* ignorieren */ }
  }

  function currentChallenge() {
    return CHALLENGES.find(c => c.id === store.active) || CHALLENGES[0];
  }

  function currentBoard() {
    const ch = currentChallenge();
    if (!store.boards[ch.id]) store.boards[ch.id] = ch.start();
    return store.boards[ch.id];
  }

  // --------------------------------------------------------------------------
  // UI-Zustand
  // --------------------------------------------------------------------------
  let root = null;
  let els = null;
  let rt = freshRuntime();
  let tool = null;
  let tickHandle = null;
  let lastCheck = null; // { passed, results, message }
  let flash = '';

  function resettle() {
    const board = currentBoard();
    const mode = currentChallenge().mode;
    rt.shortSeen = false;
    rt.oscillating = false;
    settle(board, rt, Date.now(), r => {
      if (mode === 'wende' && r.out.K1 && r.out.K2) rt.shortSeen = true;
    });
    if (mode === 'wende' && rt.out.K1 && rt.out.K2) rt.shortSeen = true;
    syncTick();
  }

  function syncTick() {
    const need = timersPending(rt);
    if (need && !tickHandle) {
      tickHandle = setInterval(() => {
        resettle();
        renderDynamic();
      }, TICK_MS);
    } else if (!need && tickHandle) {
      clearInterval(tickHandle);
      tickHandle = null;
    }
  }

  function stopTick() {
    if (tickHandle) clearInterval(tickHandle);
    tickHandle = null;
  }

  // --------------------------------------------------------------------------
  // SVG-Zeichnung des Bretts
  // --------------------------------------------------------------------------
  const VB_W = 540;
  const COL_X = [110, 220, 330, 440];
  const RAIL_TOP = 40;
  const LEVEL_Y = l => 66 + l * 76; // l = 0 … 5
  const RAIL_BOT = LEVEL_Y(ROWS) + 112;
  const VB_H = RAIL_BOT + 26;
  const C_LIVE = '#22c55e';
  const C_DEAD = '#64748b';

  function lineCol(on) {
    return on ? C_LIVE : C_DEAD;
  }

  function seg(x1, y1, x2, y2, on, extra) {
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${lineCol(on)}" stroke-width="${on ? 3.4 : 2.4}" ` +
      `stroke-linecap="round" ${on ? 'class="sb-live"' : ''} ${extra || ''}/>`;
  }

  function chip(x, y, w, text, act, c, r, color) {
    return `<g class="sb-chip" data-act="${act}" data-c="${c}" data-r="${r}" role="button" tabindex="0" aria-label="${text} umschalten">` +
      `<rect x="${x}" y="${y}" width="${w}" height="15" rx="4" fill="#0f172a" stroke="${color}" stroke-width="1.3"/>` +
      `<text x="${x + w / 2}" y="${y + 11}" text-anchor="middle" font-size="10" font-weight="800" fill="${color}">${text}</text></g>`;
  }

  function contactSvg(slot, c, r, live) {
    const x = COL_X[c];
    const y1 = LEVEL_Y(r), y2 = LEVEL_Y(r + 1);
    const cy = (y1 + y2) / 2;
    const topOn = live[c][r], botOn = live[c][r + 1];
    let g = '';

    if (!slot) {
      return `<rect x="${x - 20}" y="${y1 + 10}" width="40" height="${y2 - y1 - 20}" rx="7" fill="none" stroke="#334155" ` +
        `stroke-dasharray="4 4"/><text x="${x}" y="${cy + 5}" text-anchor="middle" font-size="16" fill="#334155">+</text>`;
    }
    if (slot.t === 'wire') {
      return seg(x, y1, x, y2, topOn && botOn);
    }

    const def = PARTS[slot.t];
    const closed = conducts(slot, rt);
    const flowing = closed && topOn && botOn;
    const tt = cy - 14, tb = cy + 14;
    g += seg(x, y1, x, tt, topOn) + seg(x, tb, x, y2, botOn);

    const bladeCol = flowing ? C_LIVE : '#e2e8f0';
    if (def.nc) {
      // Öffner: Haken am oberen Festkontakt
      g += `<path d="M${x} ${tt} L${x} ${tt + 4} L${x + 10} ${tt + 4}" fill="none" stroke="${lineCol(topOn)}" stroke-width="2.4"/>`;
    }
    const tip = closed
      ? (def.nc ? [x + 12, tt + 2] : [x, tt])
      : [x - 11, tt + 3];
    g += `<line x1="${x}" y1="${tb}" x2="${tip[0]}" y2="${tip[1]}" stroke="${bladeCol}" stroke-width="2.8" stroke-linecap="round"/>`;
    g += `<circle cx="${x}" cy="${tb}" r="2.2" fill="${bladeCol}"/>`;

    // Betätigungsart (DIN EN 60617): Taster, Rastschalter, Motorschutz (thermisch)
    const midX = (x + tip[0]) / 2 - 2, midY = (tb + tip[1]) / 2;
    if (def.act === 'push' || def.act === 'latch' || def.act === 'thermal') {
      g += `<line x1="${midX}" y1="${midY}" x2="${x - 24}" y2="${midY}" stroke="#94a3b8" stroke-width="1.4" stroke-dasharray="3 2"/>`;
      if (def.act === 'push') {
        g += `<path d="M${x - 21} ${midY - 6} L${x - 24} ${midY - 6} L${x - 24} ${midY + 6} L${x - 21} ${midY + 6}" fill="none" stroke="#94a3b8" stroke-width="1.6"/>`;
      } else if (def.act === 'latch') {
        g += `<path d="M${x - 21} ${midY - 6} L${x - 24} ${midY - 6} L${x - 24} ${midY + 6} M${x - 24} ${midY + 2} L${x - 20} ${midY + 6}" fill="none" stroke="#94a3b8" stroke-width="1.6"/>`;
      } else {
        g += `<path d="M${x - 24} ${midY + 5} L${x - 24} ${midY - 5} L${x - 30} ${midY - 5} L${x - 30} ${midY + 5}" fill="none" stroke="${rt.f2Tripped ? '#f87171' : '#94a3b8'}" stroke-width="1.6"/>`;
      }
    }

    const [tTop, tBot] = terminals(slot);
    g += `<text x="${x - 6}" y="${tt - 2}" text-anchor="end" font-size="9" fill="#94a3b8">${tTop}</text>`;
    g += `<text x="${x - 6}" y="${tb + 11}" text-anchor="end" font-size="9" fill="#94a3b8">${tBot}</text>`;

    const lblColor = def.act === 'aux' ? '#c084fc' : def.act === 'thermal' ? '#fb923c' : '#38bdf8';
    if (def.labels && def.labels.length > 1) g += chip(x + 13, cy - 18, 36, `-${slot.l}`, 'label', c, r, lblColor);
    else g += `<text x="${x + 31}" y="${cy - 7}" text-anchor="middle" font-size="10" font-weight="800" fill="${lblColor}">-${slot.l}</text>`;
    if (def.flip) g += chip(x + 13, cy + 2, 36, def.nc ? 'NC⇄' : 'NO⇄', 'flip', c, r, def.nc ? '#f87171' : '#34d399');
    return g;
  }

  function outputSvg(o, c, live) {
    const x = COL_X[c];
    const y1 = LEVEL_Y(ROWS), y2 = RAIL_BOT;
    const cy = (y1 + y2) / 2;
    const inOn = live[c][ROWS];
    if (!o) {
      return `<rect x="${x - 22}" y="${y1 + 18}" width="44" height="${y2 - y1 - 36}" rx="7" fill="none" stroke="#334155" stroke-dasharray="4 4"/>` +
        `<text x="${x}" y="${cy + 4}" text-anchor="middle" font-size="9.5" fill="#475569">Aktor</text>`;
    }
    const def = PARTS[o.t];
    const on = !!rt.out[def.out];
    let g = '';
    const top = cy - 14, bot = cy + 14;
    g += seg(x, y1, x, top, inOn) + `<line x1="${x}" y1="${bot}" x2="${x}" y2="${y2}" stroke="#3b82f6" stroke-width="2.4"/>`;

    if (o.t === 'lamp_green' || o.t === 'lamp_red') {
      const col = o.t === 'lamp_green' ? '#22c55e' : '#ef4444';
      g += `<circle cx="${x}" cy="${cy}" r="14" fill="${on ? col : '#0f172a'}" fill-opacity="${on ? 0.85 : 1}" stroke="${on ? col : '#94a3b8'}" stroke-width="2.2" ${on ? 'class="sb-glow"' : ''}/>`;
      g += `<path d="M${x - 10} ${cy - 10} L${x + 10} ${cy + 10} M${x + 10} ${cy - 10} L${x - 10} ${cy + 10}" stroke="${on ? '#0f172a' : '#94a3b8'}" stroke-width="1.6"/>`;
      g += `<text x="${x - 18}" y="${top - 2}" text-anchor="end" font-size="9" fill="#94a3b8">X1</text>`;
      g += `<text x="${x - 18}" y="${bot + 10}" text-anchor="end" font-size="9" fill="#94a3b8">X2</text>`;
      g += chip(x + 18, cy - 8, 32, `-${def.out}`, 'label', c, 'o', col);
      return g;
    }

    const isFF = o.t === 'rs_ff';
    const w = isFF ? 44 : 38, h = isFF ? 34 : 28;
    const fill = on ? 'rgba(34,197,94,0.25)' : '#0f172a';
    const stroke = on ? C_LIVE : (inOn ? '#fbbf24' : '#94a3b8');
    g += `<rect x="${x - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="3" fill="${fill}" stroke="${stroke}" stroke-width="2.4" ${on ? 'class="sb-glow"' : ''}/>`;
    if (o.t === 'timer_ton') {
      g += `<rect x="${x - w / 2 - 9}" y="${cy - 7}" width="9" height="14" fill="${stroke}"/>`;
    } else if (o.t === 'timer_toff') {
      g += `<rect x="${x - w / 2 - 9}" y="${cy - 7}" width="9" height="14" fill="none" stroke="${stroke}" stroke-width="1.6"/>` +
        `<path d="M${x - w / 2 - 9} ${cy - 7} l9 14 M${x - w / 2} ${cy - 7} l-9 14" stroke="${stroke}" stroke-width="1.2"/>`;
    }
    if (isFF) {
      g += `<text x="${x - 16}" y="${cy - 3}" font-size="9.5" font-weight="800" fill="#cbd5e1">S</text>`;
      g += `<text x="${x - 16}" y="${cy + 11}" font-size="9.5" font-weight="800" fill="#cbd5e1">R</text>`;
      g += `<text x="${x + 6}" y="${cy + 4}" text-anchor="middle" font-size="10" font-weight="800" fill="${on ? '#bbf7d0' : '#f8fafc'}">${on ? 'Q=1' : 'Q=0'}</text>`;
      g += `<text x="${x}" y="${cy + h / 2 + 12}" text-anchor="middle" font-size="8.5" fill="#94a3b8">R ← Pfad ${partnerOf(c) + 1}</text>`;
    } else {
      g += `<text x="${x}" y="${cy + 4}" text-anchor="middle" font-size="11" font-weight="800" fill="${on ? '#bbf7d0' : '#f8fafc'}">${def.out}</text>`;
    }
    g += `<text x="${x - w / 2 - (o.t.startsWith('timer') ? 12 : 3)}" y="${top - 2}" text-anchor="end" font-size="9" fill="#94a3b8">A1</text>`;
    g += `<text x="${x - w / 2 - 3}" y="${bot + 10}" text-anchor="end" font-size="9" fill="#94a3b8">A2</text>`;

    if (def.cycle) g += chip(x + w / 2 + 4, cy - 8, 38, `-${def.out}`, 'label', c, 'o', on ? C_LIVE : '#38bdf8');
    else g += `<text x="${x + w / 2 + 6}" y="${cy + 4}" font-size="10" font-weight="800" fill="#38bdf8">-${def.out}</text>`;

    // Zeitrelais: Restzeit anzeigen
    const now = Date.now();
    if (o.t === 'timer_ton' && rt.timers.K1T.since !== null && !rt.out.K1T) {
      const rest = Math.max(0, TON_MS - (now - rt.timers.K1T.since)) / 1000;
      g += `<text x="${x}" y="${cy + h / 2 + 12}" text-anchor="middle" font-size="9" font-weight="700" fill="#fbbf24">⏱ ${rest.toFixed(1)} s</text>`;
    }
    if (o.t === 'timer_toff' && rt.timers.K2T.offAt !== null) {
      const rest = Math.max(0, TOFF_MS - (now - rt.timers.K2T.offAt)) / 1000;
      g += `<text x="${x}" y="${cy + h / 2 + 12}" text-anchor="middle" font-size="9" font-weight="700" fill="#fbbf24">⏲ ${rest.toFixed(1)} s</text>`;
    }
    return g;
  }

  function bridgesSvg(board, live) {
    let g = '';
    PAIRS.forEach(([a, b], p) => {
      for (let l = 1; l <= ROWS; l++) {
        const y = LEVEL_Y(l);
        const xa = COL_X[a], xb = COL_X[b];
        const on = board.b[p][l - 1];
        const isLive = on && live[a][l];
        g += `<g class="sb-bridge ${on ? 'is-on' : ''}" data-act="bridge" data-p="${p}" data-l="${l}" role="button" tabindex="0" ` +
          `aria-label="Querbrücke Pfad ${PAIR_KEYS[p]} nach Zeile ${ROW_NAMES[l - 1]} ${on ? 'entfernen' : 'setzen'}">` +
          `<rect x="${xa + 8}" y="${y - 9}" width="${xb - xa - 16}" height="18" fill="transparent"/>`;
        if (on) {
          g += seg(xa, y, xb, y, isLive) +
            `<circle cx="${xa}" cy="${y}" r="4.2" fill="${lineCol(isLive)}"/><circle cx="${xb}" cy="${y}" r="4.2" fill="${lineCol(isLive)}"/>`;
        } else {
          g += `<line x1="${xa + 10}" y1="${y}" x2="${xb - 10}" y2="${y}" stroke="#1e293b" stroke-width="2" stroke-dasharray="3 5" class="sb-bridge-ghost"/>` +
            `<text x="${(xa + xb) / 2}" y="${y + 4}" text-anchor="middle" font-size="11" fill="#334155" class="sb-bridge-plus">⊕</text>`;
        }
        g += '</g>';
      }
    });
    return g;
  }

  function boardSvg() {
    const board = currentBoard();
    const live = rt.power || computePower(board, rt);
    let g = `<svg viewBox="0 0 ${VB_W} ${VB_H}" class="sb-board-svg" role="img" aria-label="Steckbrett mit 4 Strompfaden" ` +
      'font-family="Consolas, \'Courier New\', monospace">';

    // Spaltenköpfe & Zeilennamen
    COL_X.forEach((x, c) => {
      g += `<text x="${x}" y="18" text-anchor="middle" font-size="11" font-weight="800" fill="#94a3b8">Pfad ${c + 1}</text>`;
    });
    ROW_NAMES.forEach((n, r) => {
      g += `<text x="44" y="${(LEVEL_Y(r) + LEVEL_Y(r + 1)) / 2 + 4}" text-anchor="middle" font-size="12" font-weight="800" fill="#475569">${n}</text>`;
    });
    g += `<text x="44" y="${(LEVEL_Y(ROWS) + RAIL_BOT) / 2 + 4}" text-anchor="middle" font-size="9.5" font-weight="800" fill="#475569">Aktor</text>`;

    // Schienen
    g += `<line x1="64" y1="${RAIL_TOP}" x2="${VB_W - 20}" y2="${RAIL_TOP}" stroke="#ef4444" stroke-width="5" stroke-linecap="round"/>`;
    g += `<text x="8" y="${RAIL_TOP - 4}" font-size="10" font-weight="800" fill="#f87171">L1</text>`;
    g += `<text x="8" y="${RAIL_TOP + 9}" font-size="9" font-weight="700" fill="#f87171">+24V</text>`;
    g += `<line x1="64" y1="${RAIL_BOT}" x2="${VB_W - 20}" y2="${RAIL_BOT}" stroke="#3b82f6" stroke-width="5" stroke-linecap="round"/>`;
    g += `<text x="8" y="${RAIL_BOT - 4}" font-size="10" font-weight="800" fill="#60a5fa">N</text>`;
    g += `<text x="8" y="${RAIL_BOT + 9}" font-size="9" font-weight="700" fill="#60a5fa">0V</text>`;

    COL_X.forEach((x, c) => {
      g += seg(x, RAIL_TOP, x, LEVEL_Y(0), true);
    });

    // Steckplätze (Hit-Areas unter den Symbolen)
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        const y1 = LEVEL_Y(r), y2 = LEVEL_Y(r + 1);
        g += `<rect class="sb-slot" data-act="slot" data-c="${c}" data-r="${r}" x="${COL_X[c] - 46}" y="${y1 + 10}" width="100" height="${y2 - y1 - 20}" rx="8" ` +
          `role="button" tabindex="0" aria-label="Steckplatz Pfad ${c + 1} Zeile ${ROW_NAMES[r]}"/>`;
      }
      g += `<rect class="sb-slot sb-slot-out" data-act="slot" data-c="${c}" data-r="o" x="${COL_X[c] - 46}" y="${LEVEL_Y(ROWS) + 12}" width="100" height="${RAIL_BOT - LEVEL_Y(ROWS) - 24}" rx="8" ` +
        `role="button" tabindex="0" aria-label="Aktor-Steckplatz Pfad ${c + 1}"/>`;
    }

    g += bridgesSvg(board, live);

    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) g += `<g pointer-events="none">${contactSvg(board.s[c][r], c, r, live)}</g>`;
      g += `<g pointer-events="none">${outputSvg(board.o[c], c, live)}</g>`;
    }
    // Chips wieder klickbar machen (liegen in pointer-events:none-Gruppen)
    g += '</svg>';
    return g.replace(/<g class="sb-chip"/g, '<g class="sb-chip" pointer-events="all"');
  }

  // --------------------------------------------------------------------------
  // Hauptstromkreis-Visualisierung (Motor M 3~)
  // --------------------------------------------------------------------------
  function motorSvg(id, label, dir, sparks) {
    const cls = sparks ? 'sb-rotor sb-shake' : dir === 1 ? 'sb-rotor sb-cw' : dir === -1 ? 'sb-rotor sb-ccw' : 'sb-rotor';
    const ring = sparks ? '#ef4444' : dir ? C_LIVE : '#64748b';
    return `<svg viewBox="0 0 120 120" class="sb-motor" role="img" aria-label="${label}">` +
      `<circle cx="60" cy="60" r="44" fill="#0b1220" stroke="${ring}" stroke-width="4"/>` +
      `<g class="${cls}" style="transform-origin:60px 60px;">` +
      '<path d="M60 60 L60 24 A10 10 0 0 1 72 30 Z" fill="#334155"/>' +
      '<path d="M60 60 L91 78 A10 10 0 0 1 80 88 Z" fill="#334155"/>' +
      '<path d="M60 60 L29 78 A10 10 0 0 1 28 64 Z" fill="#334155"/>' +
      '<circle cx="60" cy="60" r="8" fill="#94a3b8"/></g>' +
      `<text x="60" y="66" text-anchor="middle" font-size="15" font-weight="900" fill="#f8fafc" font-family="Segoe UI, Arial">M</text>` +
      `<text x="60" y="82" text-anchor="middle" font-size="10" font-weight="800" fill="#cbd5e1" font-family="Segoe UI, Arial">3~</text>` +
      (sparks ? '<g class="sb-sparks"><path d="M20 20 l8 14 l-6 0 l8 14" stroke="#facc15" stroke-width="3" fill="none"/>' +
        '<path d="M98 18 l-6 14 l6 0 l-8 14" stroke="#facc15" stroke-width="3" fill="none"/>' +
        '<path d="M100 96 l-10 -6 l2 6 l-10 -6" stroke="#fb923c" stroke-width="3" fill="none"/>' +
        '<path d="M18 98 l10 -8 l0 6 l10 -8" stroke="#fb923c" stroke-width="3" fill="none"/></g>' : '') +
      `<text x="60" y="116" text-anchor="middle" font-size="9.5" font-weight="700" fill="#94a3b8" font-family="Segoe UI, Arial">${id}</text>` +
      '</svg>';
  }

  // --------------------------------------------------------------------------
  // Rendering
  // --------------------------------------------------------------------------
  function paletteIcon(id) {
    const def = PARTS[id];
    return `<span class="sb-pal-icon">${def.icon}</span>`;
  }

  function renderPalette() {
    if (!els) return;
    els.palette.innerHTML = PALETTE.map(id => {
      const def = PARTS[id];
      const isOut = def.kind === 'out';
      return `<button type="button" class="sb-pal ${tool === id ? 'active' : ''} ${isOut ? 'is-out' : ''} ${id === 'open' ? 'is-erase' : ''}" ` +
        `draggable="true" data-tool="${id}" title="${def.name} – ${def.hint}">` +
        `${paletteIcon(id)}<span class="sb-pal-name">${def.name}</span><small>${def.hint}</small></button>`;
    }).join('');
  }

  function renderChallenge() {
    if (!els) return;
    const ch = currentChallenge();
    els.tabs.innerHTML = CHALLENGES.map(c =>
      `<button type="button" class="sb-tab ${c.id === ch.id ? 'active' : ''}" data-ch="${c.id}">` +
      `${store.solved[c.id] ? '✅ ' : ''}${c.tab}</button>`).join('');

    let resultHtml = '';
    if (lastCheck) {
      resultHtml = `<div class="sb-results">` +
        lastCheck.results.map((r, i) => {
          const exp = Object.keys(r.expect).map(k => `-${k}=${r.expect[k]}`).join(' ');
          const got = Object.keys(r.got).map(k => `-${k}=${r.got[k]}`).join(' ');
          return `<div class="sb-res ${r.pass ? 'ok' : 'bad'}">` +
            `<span>${r.pass ? '✅' : '❌'} Test ${i + 1}: ${r.label}</span>` +
            (r.pass ? '' : `<small>Soll: ${exp} · Ist: ${got}</small><div class="sb-res-hint">💡 ${r.hint}</div>`) +
            '</div>';
        }).join('') +
        (lastCheck.message ? `<div class="sb-res-msg ${lastCheck.passed ? 'ok' : 'bad'}">${lastCheck.message}</div>` : '') +
        '</div>';
    }

    els.challenge.innerHTML = `
      <h4 class="sb-ch-title">${ch.title}</h4>
      <p class="sb-ch-goal">${ch.goal}</p>
      <details class="sb-steps" ${ch.sandbox ? 'open' : ''}>
        <summary>🧭 Bau-Hinweise (aufklappen, wenn du feststeckst)</summary>
        <ol>${ch.steps.map(s => `<li>${s}</li>`).join('')}</ol>
      </details>
      <div class="sb-ch-actions">
        ${ch.sandbox ? '' : `<button type="button" class="btn-primary btn-sm" data-cmd="check">🔍 Meine Schaltung prüfen (+${XP_REWARD} XP)</button>`}
        <button type="button" class="btn-secondary btn-sm" data-cmd="solution">💡 ${ch.sandbox ? 'Beispiel (TON + RS-Flip-Flop) laden' : 'Musterlösung aufs Brett laden'}</button>
        <button type="button" class="btn-secondary btn-sm" data-cmd="restart">↺ Auftrag neu starten</button>
        <button type="button" class="btn-secondary btn-sm" data-cmd="clear">🧹 Brett leeren</button>
      </div>
      ${resultHtml}`;
  }

  function renderDynamic() {
    if (!els) return;
    els.board.innerHTML = boardSvg();
    const ch = currentChallenge();
    const o = rt.out;

    // Taster-Zustände im Bedien-Panel
    els.panel.querySelectorAll('[data-btn]').forEach(b => {
      const k = b.getAttribute('data-btn');
      b.classList.toggle('is-down', !!rt.pressed[k]);
    });
    const f2 = els.panel.querySelector('[data-cmd="f2"]');
    if (f2) {
      f2.classList.toggle('is-tripped', rt.f2Tripped);
      f2.innerHTML = rt.f2Tripped ? '🔥 -F2 ausgelöst → zurücksetzen' : '🔥 -F2 Überlast testen';
    }
    const s3 = els.panel.querySelector('[data-cmd="s3"]');
    if (s3) {
      s3.classList.toggle('is-down', rt.latched.S3);
      s3.innerHTML = rt.latched.S3 ? '⏻ -S3 eingerastet' : '⏻ -S3 Rastschalter';
    }

    // Status-Chips
    const present = new Set(['K1', 'K2', 'K3']);
    currentBoard().o.forEach(x => { if (x) present.add(PARTS[x.t].out); });
    currentBoard().s.forEach(col => col.forEach(sl => { if (sl && PARTS[sl.t].act === 'aux') present.add(sl.l); }));
    els.status.innerHTML = OUT_LABELS.filter(l => present.has(l)).map(l =>
      `<span class="sb-stat ${o[l] ? 'on' : ''} ${rt.stuck[l] ? 'stuck' : ''}">-${l} ${o[l] ? '● an' : '○ aus'}</span>`).join('');

    // Hauptstromkreis
    const both = o.K1 && o.K2;
    if (ch.mode === 'folge') {
      els.motor.innerHTML =
        `<div class="sb-motors">${motorSvg('-K1 Absaugung', 'Absaugung', o.K1 ? 1 : 0, false)}` +
        `${motorSvg('-K2 Förderband', 'Förderband', o.K2 ? 1 : 0, false)}</div>` +
        '<small class="sb-motor-note">Folgeschaltung: zwei Motoren – -K2 darf nur laufen, wenn -K1 läuft.</small>';
    } else {
      const dir = both ? 0 : o.K1 ? 1 : o.K2 ? -1 : 0;
      els.motor.innerHTML =
        `<div class="sb-motors">${motorSvg(both ? '💥 KURZSCHLUSS' : o.K1 ? '↻ Rechtslauf (-K1)' : o.K2 ? '↺ Linkslauf (-K2)' : 'Stillstand', 'Drehstrommotor', dir, both)}</div>` +
        '<small class="sb-motor-note">Hauptstrom: -K1 legt L1→U, L2→V, L3→W (Rechtsdrehfeld) · -K2 tauscht L1 ↔ L3 (Linksdrehfeld).</small>';
    }

    // Alarm-Banner
    let alert = '';
    if (ch.mode === 'wende' && both) {
      alert = `<div class="sim-alert sim-alert-danger sb-alert">⚡💥 <strong>Kurzschluss im Hauptstromkreis!</strong> -K1 und -K2 sind gleichzeitig angezogen – ` +
        `L1 und L3 werden über die Hauptkontakte direkt kurzgeschlossen. ${missingInterlockText()}</div>`;
    } else if (ch.mode === 'wende' && rt.shortSeen) {
      alert = '<div class="sim-alert sim-alert-warn sb-alert">⚡ Kurzzeitig waren -K1 und -K2 gleichzeitig an – das reicht für einen Kurzschluss! ' +
        `${missingInterlockText()}</div>`;
    } else if (rt.oscillating) {
      alert = `<div class="sim-alert sim-alert-warn sb-alert">${OSC_HINT}</div>`;
    } else if (rt.f2Tripped) {
      alert = '<div class="sim-alert sim-alert-warn sb-alert">🔥 Motorschutz -F2 hat ausgelöst – Öffner 95–96 ist offen. Zum Weiterarbeiten zurücksetzen.</div>';
    }
    els.alert.innerHTML = alert;
    els.flash.textContent = flash;
  }

  function missingInterlockText() {
    const all = [];
    currentBoard().s.forEach(col => col.forEach(sl => { if (sl) all.push(sl); }));
    const hasK2nc = all.some(s => s.t === 'aux_nc' && s.l === 'K2');
    const hasK1nc = all.some(s => s.t === 'aux_nc' && s.l === 'K1');
    const tips = [];
    if (!hasK2nc) tips.push('Öffner <strong>-K2 (21–22)</strong> in Reihe vor die Spule -K1');
    if (!hasK1nc) tips.push('Öffner <strong>-K1 (21–22)</strong> in Reihe vor die Spule -K2');
    return tips.length
      ? `Es fehlt: ${tips.join(' und ')}.`
      : 'Die Öffner -K1/-K2 (21–22) sind da – sitzen sie wirklich in Reihe im JEWEILS ANDEREN Pfad (und nicht parallel)?';
  }

  function renderAllParts() {
    renderPalette();
    renderChallenge();
    renderDynamic();
  }

  // --------------------------------------------------------------------------
  // Bedienung: Bauen
  // --------------------------------------------------------------------------
  function boardChanged(msg) {
    flash = msg || '';
    lastCheck = null;
    saveStore();
    resettle();
    renderChallenge();
    renderDynamic();
  }

  function placeTool(c, r, toolId) {
    const board = currentBoard();
    const isOutSlot = r === 'o';
    const where = `Pfad ${c + 1} / ${isOutSlot ? 'Aktor-Zeile' : `Zeile ${ROW_NAMES[r]}`}`;
    if (toolId === 'open') {
      if (isOutSlot) board.o[c] = null;
      else board.s[c][r] = null;
      boardChanged(`⌫ Steckplatz ${where} geleert.`);
      return;
    }
    const def = PARTS[toolId];
    if (def.kind === 'out' && !isOutSlot) {
      flash = '⚠️ Spulen, Zeitrelais, Flip-Flops und Leuchten gehören in die Aktor-Zeile ganz unten (direkt vor N / 0 V).';
      renderDynamic();
      return;
    }
    if (def.kind === 'contact' && isOutSlot) {
      flash = '⚠️ Kontakte und Drahtbrücken gehören in die Zeilen A–E. Die Aktor-Zeile ist für Spulen & Leuchten.';
      renderDynamic();
      return;
    }
    if (isOutSlot) {
      board.o[c] = { t: toolId };
      boardChanged(`✅ ${def.name} (A1–A2) in ${where} gesetzt.`);
    } else {
      const prev = board.s[c][r];
      // Gleiches Bauteil nochmal antippen → Bezeichnung weiterschalten
      if (prev && prev.t === toolId && def.labels && def.labels.length > 1) {
        cycleLabel(c, r);
        return;
      }
      board.s[c][r] = { t: toolId, l: DEFAULT_LABEL[toolId] || '' };
      const tm = terminals(board.s[c][r]);
      boardChanged(`✅ ${def.name}${board.s[c][r].l ? ` -${board.s[c][r].l}` : ''}${tm[0] ? ` (${tm[0]}–${tm[1]})` : ''} in ${where} gesetzt.`);
    }
  }

  function cycleLabel(c, r) {
    const board = currentBoard();
    if (r === 'o') {
      const o = board.o[c];
      if (!o || !PARTS[o.t].cycle) return;
      o.t = PARTS[o.t].cycle;
      boardChanged(`🔁 Aktor in Pfad ${c + 1} ist jetzt ${PARTS[o.t].name}.`);
      return;
    }
    const sl = board.s[c][r];
    if (!sl) return;
    const labels = PARTS[sl.t].labels || [];
    if (labels.length < 2) return;
    sl.l = labels[(labels.indexOf(sl.l) + 1) % labels.length];
    const tm = terminals(sl);
    boardChanged(`🔁 Kontakt Pfad ${c + 1} / Zeile ${ROW_NAMES[r]} gehört jetzt zu -${sl.l} (${tm[0]}–${tm[1]}).`);
  }

  function flipContact(c, r) {
    const sl = currentBoard().s[c][r];
    if (!sl || !PARTS[sl.t].flip) return;
    sl.t = PARTS[sl.t].flip;
    const tm = terminals(sl);
    boardChanged(`⇄ Pfad ${c + 1} / Zeile ${ROW_NAMES[r]}: jetzt ${PARTS[sl.t].nc ? 'Öffner (NC)' : 'Schließer (NO)'} ${tm[0]}–${tm[1]}.`);
  }

  function toggleBridge(p, l) {
    const board = currentBoard();
    board.b[p][l - 1] = !board.b[p][l - 1];
    boardChanged(`${board.b[p][l - 1] ? '🔗 Querbrücke gesetzt' : '✂️ Querbrücke entfernt'}: Pfad ${PAIR_KEYS[p].replace('-', '↔')} nach Zeile ${ROW_NAMES[l - 1]}.`);
  }

  function handleBoardAction(target) {
    const act = target.getAttribute('data-act');
    if (act === 'bridge') {
      toggleBridge(+target.getAttribute('data-p'), +target.getAttribute('data-l'));
      return;
    }
    const c = +target.getAttribute('data-c');
    const rAttr = target.getAttribute('data-r');
    const r = rAttr === 'o' ? 'o' : +rAttr;
    if (act === 'label') cycleLabel(c, r);
    else if (act === 'flip') flipContact(c, r);
    else if (act === 'slot') {
      if (tool) {
        placeTool(c, r, tool);
      } else {
        const filled = r === 'o' ? currentBoard().o[c] : currentBoard().s[c][r];
        flash = filled
          ? '💡 Bezeichnung & Kontaktart über die kleinen Chips ändern – oder links ein Bauteil wählen und den Platz neu belegen.'
          : '👉 Erst ein Bauteil im Werkzeugkasten antippen, dann den Steckplatz.';
        renderDynamic();
      }
    }
  }

  // --------------------------------------------------------------------------
  // Bedienung: Testen, Prüfen, Aufträge
  // --------------------------------------------------------------------------
  function setPressed(key, down) {
    if (rt.pressed[key] === down) return;
    rt.pressed[key] = down;
    resettle();
    renderDynamic();
  }

  function powerCycle() {
    rt = freshRuntime();
    resettle();
  }

  function selectChallenge(id) {
    if (!CHALLENGES.some(c => c.id === id)) return;
    store.active = id;
    saveStore();
    lastCheck = null;
    flash = '';
    powerCycle();
    renderAllParts();
  }

  function runCheck() {
    const ch = currentChallenge();
    if (ch.sandbox) return;
    const res = checkChallenge(ch, currentBoard());
    let message = '';
    if (res.passed) {
      if (store.peeked[ch.id]) {
        message = '🎉 Alle Tests bestanden – aber mit Musterlösung. Keine XP: „↺ Auftrag neu starten“ und selbst bauen!';
      } else if (store.solved[ch.id]) {
        message = '🎉 Alle Tests bestanden! (Die +50 XP gab es schon beim ersten Mal.)';
      } else {
        store.solved[ch.id] = true;
        saveStore();
        message = `🎉 Alle ${ch.tests.length} Tests bestanden – Prüfungsreif! +${XP_REWARD} XP`;
        if (window.ElektroApp && window.ElektroApp.addXp) window.ElektroApp.addXp(XP_REWARD);
      }
      confetti();
    } else {
      const failed = res.results.find(r => !r.pass);
      message = `Noch nicht ganz: Test ${res.results.indexOf(failed) + 1} von ${ch.tests.length} schlägt fehl. Lies den Tipp, bau um und prüf nochmal!`;
    }
    lastCheck = Object.assign(res, { message });
    renderChallenge();
  }

  function loadBoard(board, peek, msg) {
    const ch = currentChallenge();
    store.boards[ch.id] = board;
    if (peek) store.peeked[ch.id] = true;
    else delete store.peeked[ch.id];
    powerCycle();
    boardChanged(msg);
  }

  function confetti() {
    if (!root || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
    const host = root.querySelector('.sb');
    if (!host) return;
    const layer = document.createElement('div');
    layer.className = 'sb-confetti';
    const colors = ['#22c55e', '#10b981', '#34d399', '#a7f3d0', '#facc15'];
    for (let i = 0; i < 70; i++) {
      const p = document.createElement('i');
      p.style.left = Math.random() * 100 + '%';
      p.style.background = colors[i % colors.length];
      p.style.animationDelay = (Math.random() * 0.6).toFixed(2) + 's';
      p.style.animationDuration = (1.6 + Math.random() * 1.2).toFixed(2) + 's';
      p.style.transform = `rotate(${Math.round(Math.random() * 360)}deg)`;
      layer.appendChild(p);
    }
    host.appendChild(layer);
    setTimeout(() => layer.remove(), 3200);
  }

  // --------------------------------------------------------------------------
  // render / destroy
  // --------------------------------------------------------------------------
  let listeners = [];

  function on(el, type, handler, opts) {
    el.addEventListener(type, handler, opts);
    listeners.push([el, type, handler, opts]);
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

    root.innerHTML = `
      <div class="sb sim-card">
        <div class="sb-header">
          <div>
            <span class="badge badge-emerald">Steuerungstechnik · Stromlaufplan in aufgelöster Darstellung (DIN EN 61082)</span>
            <h3>🛠️ Interaktives Schütz- & Steuerungs-Brett – Selber bauen & testen</h3>
          </div>
        </div>

        <div class="sb-tabs" role="tablist" aria-label="Bauaufträge"></div>
        <div class="sb-challenge"></div>

        <div class="sb-grid">
          <div class="sb-build">
            <div class="sb-pal-head">🧰 Werkzeugkasten <small>Bauteil wählen → Steckplatz antippen · PC: auch Drag & Drop · ⊕ = Querbrücke</small></div>
            <div class="sb-palette"></div>
            <div class="sb-board"></div>
            <div class="sb-flash" aria-live="polite"></div>
          </div>
          <div class="sb-side">
            <div class="sb-panel">
              <div class="sb-panel-title">🎛️ Bedien-Panel (gedrückt halten = Taster betätigt)</div>
              <div class="sb-btns">
                <button type="button" class="sb-test sb-test-stop" data-btn="S0">🔴 -S0 (Stopp) drücken</button>
                <button type="button" class="sb-test" data-btn="S1">▶️ -S1 (Rechts/Ein) drücken</button>
                <button type="button" class="sb-test" data-btn="S2">◀️ -S2 (Links) drücken</button>
                <button type="button" class="sb-test sb-test-f2" data-cmd="f2">🔥 -F2 Überlast testen</button>
                <button type="button" class="sb-test sb-test-s3" data-cmd="s3">⏻ -S3 Rastschalter</button>
                <button type="button" class="sb-test sb-test-off" data-cmd="power">⏼ Steuerspannung aus/ein</button>
              </div>
              <div class="sb-status" aria-live="polite"></div>
            </div>
            <div class="sb-motor-box"></div>
            <div class="sb-alert-box" aria-live="assertive"></div>
          </div>
        </div>

        <details class="sb-info">
          <summary>📘 So funktioniert das Brett (Regeln, Klemmen, Engine)</summary>
          <ul>
            <li><strong>Ruhezustand:</strong> Gezeichnet und gebaut wird unbetätigt. Öffner (NC) leiten in Ruhe, Schließer (NO) sind offen. Ein <em>leerer</em> Steckplatz ist eine Unterbrechung – durchgehende Leitung = Drahtbrücke │.</li>
            <li><strong>Gleiche Bezeichnung = gleiches Gerät:</strong> Alle Kontakte mit -S1 schalten beim Drücken von -S1 gleichzeitig (Tasterverriegelung). Alle Hilfskontakte -K1 schalten, sobald die Spule -K1 angezogen hat.</li>
            <li><strong>Querbrücken ⊕</strong> verbinden zwei Nachbarpfade auf gleicher Höhe. Zwei Brücken (oberhalb und unterhalb) machen aus zwei Kontakten eine Parallelschaltung – z. B. Selbsthaltung -K1 (13–14) ∥ -S1.</li>
            <li><strong>Klemmen:</strong> 13–14 Schließer · 11–12 / 21–22 Öffner · 95–96 Motorschutz-Öffner · A1–A2 Spule · 17–18 / 15–16 Zeitrelais-Kontakte · X1–X2 Leuchte.</li>
            <li><strong>Zeitrelais:</strong> TON -K1T schaltet seine Kontakte nach 2 s Dauerstrom · TOFF -K2T schaltet sofort und hält 3 s nach. <strong>RS-Flip-Flop -B1:</strong> S = Strom im eigenen Pfad, R = Strom im Nachbarpfad (ohne Aktor), Reset hat Vorrang.</li>
            <li><strong>2-Phasen-Engine:</strong> 1. Stromfluss von L1 durch alle leitenden Kontakte & Brücken berechnen · 2. genau eine Spule umschalten (Abfallen vor Anziehen) · wiederholen, bis nichts mehr schaltet. So funktionieren Selbsthaltung, Verriegelung und Wettlauf-Effekte wie im echten Schaltschrank.</li>
          </ul>
        </details>
      </div>`;

    els = {
      tabs: root.querySelector('.sb-tabs'),
      challenge: root.querySelector('.sb-challenge'),
      palette: root.querySelector('.sb-palette'),
      board: root.querySelector('.sb-board'),
      flash: root.querySelector('.sb-flash'),
      panel: root.querySelector('.sb-panel'),
      status: root.querySelector('.sb-status'),
      motor: root.querySelector('.sb-motor-box'),
      alert: root.querySelector('.sb-alert-box')
    };

    // Aufträge & Befehle
    on(els.tabs, 'click', e => {
      const b = e.target.closest('[data-ch]');
      if (b) selectChallenge(b.getAttribute('data-ch'));
    });
    on(els.challenge, 'click', e => {
      const b = e.target.closest('[data-cmd]');
      if (!b) return;
      const cmd = b.getAttribute('data-cmd');
      const ch = currentChallenge();
      if (cmd === 'check') runCheck();
      else if (cmd === 'solution') loadBoard(ch.solution(), !ch.sandbox, ch.sandbox ? '💡 Beispiel geladen: -S1 gedrückt halten (TON 2 s), -S2 setzt -B1, -S0 setzt zurück.' : '💡 Musterlösung geladen – teste sie mit dem Bedien-Panel und vergleiche mit deinem Aufbau.');
      else if (cmd === 'restart') loadBoard(ch.start(), false, '↺ Auftrag neu gestartet.');
      else if (cmd === 'clear') loadBoard(emptyBoard(), false, '🧹 Brett geleert – bau los!');
    });

    // Werkzeugkasten
    on(els.palette, 'click', e => {
      const b = e.target.closest('[data-tool]');
      if (!b) return;
      const id = b.getAttribute('data-tool');
      tool = tool === id ? null : id;
      flash = tool ? `🧰 ${PARTS[tool].name} gewählt – jetzt einen Steckplatz antippen.` : '';
      renderPalette();
      renderDynamic();
    });
    on(els.palette, 'dragstart', e => {
      const b = e.target.closest('[data-tool]');
      if (!b || !e.dataTransfer) return;
      e.dataTransfer.setData('text/plain', b.getAttribute('data-tool'));
      e.dataTransfer.effectAllowed = 'copy';
    });

    // Brett: Klick, Tastatur, Drag & Drop
    on(els.board, 'click', e => {
      const target = e.target.closest('[data-act]');
      if (target) handleBoardAction(target);
    });
    on(els.board, 'keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const target = e.target.closest('[data-act]');
      if (!target) return;
      e.preventDefault();
      handleBoardAction(target);
    });
    on(els.board, 'dragover', e => {
      if (e.target.closest('[data-act="slot"]')) {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
      }
    });
    on(els.board, 'drop', e => {
      const slot = e.target.closest('[data-act="slot"]');
      const id = e.dataTransfer && e.dataTransfer.getData('text/plain');
      if (!slot || !PARTS[id]) return;
      e.preventDefault();
      const rAttr = slot.getAttribute('data-r');
      placeTool(+slot.getAttribute('data-c'), rAttr === 'o' ? 'o' : +rAttr, id);
    });

    // Bedien-Panel: Taster (gedrückt halten), Rastfunktionen
    els.panel.querySelectorAll('[data-btn]').forEach(b => {
      const key = b.getAttribute('data-btn');
      const down = e => {
        e.preventDefault();
        if (b.setPointerCapture && e.pointerId !== undefined) {
          try { b.setPointerCapture(e.pointerId); } catch (err) { /* ignorieren */ }
        }
        setPressed(key, true);
      };
      const up = () => setPressed(key, false);
      on(b, 'pointerdown', down);
      on(b, 'pointerup', up);
      on(b, 'pointercancel', up);
      on(b, 'lostpointercapture', up);
      on(b, 'contextmenu', e => e.preventDefault());
      on(b, 'keydown', e => {
        if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
          e.preventDefault();
          setPressed(key, true);
        }
      });
      on(b, 'keyup', e => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          setPressed(key, false);
        }
      });
      on(b, 'blur', up);
    });
    on(els.panel, 'click', e => {
      const b = e.target.closest('[data-cmd]');
      if (!b) return;
      const cmd = b.getAttribute('data-cmd');
      if (cmd === 'f2') rt.f2Tripped = !rt.f2Tripped;
      else if (cmd === 's3') rt.latched.S3 = !rt.latched.S3;
      else if (cmd === 'power') {
        powerCycle();
        flash = '⏼ Steuerspannung kurz aus und wieder ein – alle Schütze sind abgefallen.';
      }
      resettle();
      renderDynamic();
    });

    resettle();
    renderAllParts();
  }

  function destroy() {
    stopTick();
    listeners.forEach(([el, type, h, opts]) => el.removeEventListener(type, h, opts));
    listeners = [];
    // Gedrückte Taster loslassen, damit beim nächsten render nichts „hängt“
    Object.keys(rt.pressed).forEach(k => { rt.pressed[k] = false; });
    els = null;
    root = null;
  }

  // --------------------------------------------------------------------------
  // Styles (einmalig, nutzt die CSS-Variablen aus styles.css)
  // --------------------------------------------------------------------------
  function ensureStyles() {
    if (document.getElementById('sb-styles')) return;
    const style = document.createElement('style');
    style.id = 'sb-styles';
    style.textContent = `
.sb { position: relative; overflow: hidden; }
.sb-header h3 { font-size: 1.05rem; font-weight: 800; margin-top: 6px; }
.sb-tabs { display: flex; gap: 6px; overflow-x: auto; padding: 10px 0 6px; }
.sb-tab { flex-shrink: 0; background: var(--bg-card); color: var(--text-muted); border: 1px solid var(--border);
  border-radius: 999px; padding: 7px 12px; font-size: 0.8rem; font-weight: 700; cursor: pointer; }
.sb-tab.active { background: var(--accent-emerald); color: #04130d; border-color: var(--accent-emerald); }
.sb-challenge { background: #0f172a; border: 1px solid var(--border); border-radius: 12px; padding: 12px 14px; margin-bottom: 12px; }
.sb-ch-title { font-size: 0.95rem; font-weight: 800; color: var(--accent-amber); margin-bottom: 6px; }
.sb-ch-goal { font-size: 0.85rem; line-height: 1.5; color: #cbd5e1; }
.sb-steps { margin-top: 8px; font-size: 0.82rem; color: #cbd5e1; }
.sb-steps summary { cursor: pointer; color: var(--accent-blue); font-weight: 700; }
.sb-steps ol { padding-left: 20px; margin-top: 6px; display: grid; gap: 4px; line-height: 1.45; }
.sb-ch-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
.sb-results { margin-top: 10px; display: grid; gap: 6px; }
.sb-res { font-size: 0.8rem; padding: 7px 10px; border-radius: 8px; display: grid; gap: 3px; }
.sb-res.ok { background: rgba(16,185,129,0.1); color: #a7f3d0; }
.sb-res.bad { background: rgba(239,68,68,0.12); color: #fecaca; border: 1px solid rgba(239,68,68,0.4); }
.sb-res small { color: var(--text-muted); font-family: Consolas, monospace; }
.sb-res-hint { color: #fde68a; line-height: 1.45; }
.sb-res-msg { font-size: 0.85rem; font-weight: 800; padding: 8px 10px; border-radius: 8px; }
.sb-res-msg.ok { background: rgba(34,197,94,0.18); color: #bbf7d0; border: 1px solid #22c55e; }
.sb-res-msg.bad { background: rgba(245,158,11,0.12); color: #fde68a; }
.sb-grid { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr); gap: 14px; align-items: start; }
.sb-build, .sb-side { min-width: 0; }
@media (max-width: 860px) { .sb-grid { grid-template-columns: minmax(0, 1fr); } }
.sb-pal-head { font-size: 0.85rem; font-weight: 800; margin-bottom: 6px; }
.sb-pal-head small { display: block; font-weight: 500; color: var(--text-muted); font-size: 0.72rem; margin-top: 2px; }
.sb-palette { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 6px; margin-bottom: 8px; }
.sb-pal { flex-shrink: 0; width: 96px; display: flex; flex-direction: column; align-items: center; gap: 2px;
  background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; padding: 6px 4px;
  color: var(--text-main); cursor: grab; text-align: center; }
.sb-pal:hover { background: var(--bg-card-hover); }
.sb-pal.active { border-color: var(--accent-emerald); background: rgba(16,185,129,0.15); box-shadow: 0 0 0 2px rgba(16,185,129,0.35); }
.sb-pal.is-out { border-style: dashed; }
.sb-pal.is-erase { color: #fca5a5; }
.sb-pal-icon { font-size: 1.15rem; line-height: 1.2; }
.sb-pal-name { font-size: 0.68rem; font-weight: 800; line-height: 1.2; }
.sb-pal small { font-size: 0.6rem; color: var(--text-muted); line-height: 1.15; }
.sb-board { background: #070b13; border: 1px solid var(--border); border-radius: 12px; padding: 4px; }
.sb-board-svg { display: block; width: 100%; height: auto; user-select: none; -webkit-user-select: none; }
.sb-slot { fill: transparent; cursor: pointer; }
.sb-slot:hover, .sb-slot:focus { fill: rgba(56,189,248,0.06); outline: none; stroke: rgba(56,189,248,0.35); stroke-width: 1; }
.sb-chip { cursor: pointer; }
.sb-chip:hover rect, .sb-chip:focus rect { fill: #1e293b; }
.sb-chip:focus { outline: none; }
.sb-bridge { cursor: pointer; }
.sb-bridge:hover .sb-bridge-ghost { stroke: #38bdf8; }
.sb-bridge:hover .sb-bridge-plus { fill: #38bdf8; }
.sb-bridge:focus { outline: none; }
.sb-live { stroke-dasharray: 9 5; animation: sb-flow 0.6s linear infinite; }
.sb-glow { filter: drop-shadow(0 0 6px rgba(34,197,94,0.75)); }
.sb-flash { min-height: 1.3em; font-size: 0.8rem; color: #cbd5e1; margin-top: 6px; line-height: 1.4; }
.sb-panel { background: #0f172a; border: 1px solid var(--border); border-radius: 12px; padding: 10px; }
.sb-panel-title { font-size: 0.82rem; font-weight: 800; margin-bottom: 8px; }
.sb-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.sb-test { min-height: 52px; border-radius: 12px; border: 2px solid #334155; background: #131b2e; color: var(--text-main);
  font-size: 0.82rem; font-weight: 800; cursor: pointer; touch-action: none; -webkit-user-select: none; user-select: none;
  transition: transform 0.06s, background 0.1s; }
.sb-test:active, .sb-test.is-down { transform: scale(0.96); background: rgba(56,189,248,0.25); border-color: var(--accent-blue); }
.sb-test-stop { border-color: #7f1d1d; }
.sb-test-stop.is-down { background: rgba(239,68,68,0.3); border-color: #ef4444; }
.sb-test-f2.is-tripped { background: rgba(249,115,22,0.3); border-color: #f97316; }
.sb-test-s3.is-down { background: rgba(16,185,129,0.25); border-color: #10b981; }
.sb-test-off { font-size: 0.75rem; color: var(--text-muted); }
.sb-status { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.sb-stat { font-family: Consolas, monospace; font-size: 0.78rem; font-weight: 800; padding: 4px 8px; border-radius: 8px;
  background: #131b2e; border: 1px solid #334155; color: var(--text-muted); }
.sb-stat.on { background: rgba(34,197,94,0.18); border-color: #22c55e; color: #bbf7d0; }
.sb-stat.stuck { border-color: #f97316; }
.sb-motor-box { margin-top: 12px; text-align: center; }
.sb-motors { display: flex; justify-content: center; gap: 14px; }
.sb-motor { width: 130px; height: 130px; }
.sb-motor-note { display: block; color: var(--text-muted); font-size: 0.72rem; line-height: 1.4; margin-top: 4px; }
.sb-rotor { transform-box: view-box; }
.sb-cw { animation: sb-spin 0.9s linear infinite; }
.sb-ccw { animation: sb-spin 0.9s linear infinite reverse; }
.sb-shake { animation: sb-shake 0.12s linear infinite; }
.sb-sparks { animation: sb-blink 0.18s steps(2) infinite; }
.sb-alert { margin-top: 12px; font-size: 0.82rem; line-height: 1.45; }
.sb-info { margin-top: 14px; font-size: 0.82rem; color: #cbd5e1; }
.sb-info summary { cursor: pointer; font-weight: 800; color: var(--accent-blue); }
.sb-info ul { padding-left: 18px; margin-top: 8px; display: grid; gap: 6px; line-height: 1.5; }
.sb-confetti { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 5; }
.sb-confetti i { position: absolute; top: -12px; width: 8px; height: 14px; border-radius: 2px; animation: sb-fall linear forwards; }
@keyframes sb-flow { to { stroke-dashoffset: -14; } }
@keyframes sb-spin { to { transform: rotate(360deg); } }
@keyframes sb-shake { 0% { transform: translate(0,0); } 25% { transform: translate(2px,-1px); } 50% { transform: translate(-2px,1px); } 75% { transform: translate(1px,2px); } }
@keyframes sb-blink { to { opacity: 0.15; } }
@keyframes sb-fall { to { top: 105%; transform: rotate(540deg); opacity: 0.6; } }
@media (prefers-reduced-motion: reduce) {
  .sb-live, .sb-cw, .sb-ccw, .sb-shake, .sb-sparks { animation: none; }
}
`;
    document.head.appendChild(style);
  }

  return {
    render,
    destroy,
    // Für Tests / externe Steuerung
    setChallenge: selectChallenge,
    checkChallenge: id => {
      const ch = CHALLENGES.find(c => c.id === id) || currentChallenge();
      return checkChallenge(ch, store.boards[ch.id] || ch.start());
    },
    getState: () => JSON.parse(JSON.stringify({ store, runtime: rt })),
    _internal: { CHALLENGES, checkChallenge, settle, freshRuntime, emptyBoard }
  };
})();
