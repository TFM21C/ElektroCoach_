// ============================================================================
// ElektroCoach PRO – Interaktive Praxis-Simulatoren (Tab 3)
// 1. Motor-Klemmbrett & Typenschild-Trainer (Stern / Dreieck am 400V-Netz)
// 2. Taschen-FluidSIM (Steuerstromkreis, Ruhezustand & Drahtbruchsicherheit)
// 3. Antennen-Pegelrechner & dBµV-Signalketten-Trainer
// ============================================================================

window.ElektroSimulators = (function () {
  // --------------------------------------------------------------------------
  // State für Simulator 1: Klemmbrett & Typenschild
  // --------------------------------------------------------------------------
  const motorState = {
    nameplate: '230_400', // '230_400' (Δ 230V / Y 400V) oder '400_690' (Δ 400V / Y 690V)
    wiring: 'star',       // 'star' (Stern waagerecht), 'delta' (Dreieck senkrecht), 'none'
    phaseSwap: false      // false = Rechtslauf (L1->U1, L2->V1, L3->W1), true = Linkslauf (L1<->L2)
  };

  // --------------------------------------------------------------------------
  // State für Simulator 2: Taschen-FluidSIM
  // --------------------------------------------------------------------------
  const fluidState = {
    scenario: 'standard', // 'standard' | 'bug_no_hold' | 'bug_s0_no'
    f2Tripped: false,     // Überlastrelais 95-96 ausgelöst?
    s0Pressed: false,     // AUS-Taster S0 gedrückt?
    s1Pressed: false,     // EIN-Taster S1 gedrückt?
    wireBreakS0: false,   // Drahtbruch an S0 simuliert?
    k1Energized: false    // Schützspule K1 angezogen?
  };

  // --------------------------------------------------------------------------
  // State für Simulator 3: Antennen dBµV-Rechner & Zufalls-Aufgabe
  // --------------------------------------------------------------------------
  const dbState = {
    inputLevel: 60,       // dBµV am HÜP / LNB
    ampGain: 20,          // +dB Verstärker
    cableMeters: 30,      // m Koaxkabel
    cableLossPer100m: 20, // dB / 100m
    splitterLoss: 0,      // dB Verteiler
    outletLoss: 10,       // dB Antennendose
    challengeActive: false,
    challengeGuess: '',
    challengeFeedback: null
  };

  function recomputeFluidSim() {
    // Kontaktzustand F2 (95-96 Öffner): im Ruhezustand geschlossen (!f2Tripped)
    const f2Conducts = !fluidState.f2Tripped;

    // Kontaktzustand S0:
    // Im Standard & bug_no_hold ist S0 ein Öffner (11-12): leitet wenn NICHT gedrückt UND kein Drahtbruch.
    // Im Szenario bug_s0_no hat jemand fälschlich einen Schließer (13-14) eingebaut: leitet nur wenn gedrückt!
    let s0Conducts = false;
    if (fluidState.wireBreakS0) {
      s0Conducts = false; // Drahtbruch = Strompfad unterbrochen!
    } else if (fluidState.scenario === 'bug_s0_no') {
      s0Conducts = fluidState.s0Pressed; // Falsch: Schließer leitet erst beim Drücken!
    } else {
      s0Conducts = !fluidState.s0Pressed; // Richtig: Öffner leitet im Ruhezustand!
    }

    // Kontaktzustand S1 (13-14 Schließer): leitet wenn gedrückt
    const s1Conducts = fluidState.s1Pressed;

    // Selbsthaltekontakt K1 (13-14): war K1 im letzten Schritt angezogen?
    const k1HoldConducts = fluidState.k1Energized;

    if (fluidState.scenario === 'bug_no_hold') {
      // Verdrahtungsfehler: Selbsthaltekontakt fehlt / defekt -> nur Tippbetrieb über S1
      fluidState.k1Energized = f2Conducts && s0Conducts && s1Conducts;
    } else if (fluidState.scenario === 'bug_s0_no') {
      // Wenn S0 als Schließer eingebaut ist: sobald S0 nicht gedrückt wird, fällt alles ab
      fluidState.k1Energized = f2Conducts && s0Conducts && (s1Conducts || k1HoldConducts);
    } else {
      // Standard-Selbsthaltung: F2 (Öffner) UND S0 (Öffner) UND (S1 ODER K1-Selbsthaltung)
      fluidState.k1Energized = f2Conducts && s0Conducts && (s1Conducts || k1HoldConducts);
    }
  }

  // --------------------------------------------------------------------------
  // Render Simulator 1: Motor-Klemmbrett & Typenschild
  // --------------------------------------------------------------------------
  function renderMotorSim() {
    const is230_400 = motorState.nameplate === '230_400';
    const maxCoilVoltage = is230_400 ? 230 : 400;
    const appliedCoilVoltage =
      motorState.wiring === 'star' ? 230 : motorState.wiring === 'delta' ? 400 : 0;

    let statusClass = 'sim-alert-ok';
    let statusTitle = '';
    let statusText = '';

    if (motorState.wiring === 'none') {
      statusClass = 'sim-alert-warn';
      statusTitle = '⚠️ Keine Brücken eingelegt (Sternpunkt / Dreieck offen)';
      statusText =
        'Ohne Brücken auf dem Klemmbrett sind die Wicklungsenden (U2, V2, W2) offen. Es kann kein Strom durch die 3 Motorstränge fließen – der Motor läuft nicht an.';
    } else if (is230_400 && motorState.wiring === 'star') {
      statusClass = 'sim-alert-ok';
      statusTitle = '✅ PERFEKT: Sternschaltung (Y) bei Δ 230 V / Y 400 V';
      statusText =
        'Am 400-V-Netz teilen sich im Stern immer zwei Spulen die Außenleiterspannung (400 V / √3 = 230 V). Jede einzelne Spule bekommt genau 230 V – und genau dafür ist sie laut Typenschild (Δ 230 V) gebaut! Motor läuft mit 100 % Nennleistung.';
    } else if (is230_400 && motorState.wiring === 'delta') {
      statusClass = 'sim-alert-danger';
      statusTitle = '💥 WICKLUNGSBRand! Dreieck (Δ) bei Δ 230 V / Y 400 V am 400-V-Netz!';
      statusText =
        'Das war genau deine Prüfungsfalle: „Δ 230 V“ heißt, dass EINE einzelne Motorwicklung maximal 230 V aushält! Im Dreieck hängt jede Wicklung direkt zwischen zwei Außenleitern (z. B. L1 und L2) an vollen 400 V → 3-fache Überlast, der Motor brennt durch! Darum darf dieser Motor am 400-V-Netz NIEMALS in Stern-Dreieck angelassen werden!';
    } else if (!is230_400 && motorState.wiring === 'star') {
      statusClass = 'sim-alert-info';
      statusTitle = 'ℹ️ ANLAUF-STUFE (1/3 Leistung): Stern (Y) bei Δ 400 V / Y 690 V';
      statusText =
        'Jede Wicklung hält 400 V aus, bekommt hier im Stern aber nur 230 V. Dadurch sinken Strom und Drehmoment auf exakt 1/3 (P_Y = 1/3 P_Δ). Perfekt als kurze Anlaufstufe beim Stern-Dreieck-Anlauf, aber für den Dauerbetrieb unter Volllast zu schwach!';
    } else if (!is230_400 && motorState.wiring === 'delta') {
      statusClass = 'sim-alert-ok';
      statusTitle = '✅ DAUERBETRIEB (100 % Leistung): Dreieck (Δ) bei Δ 400 V / Y 690 V';
      statusText =
        'Jede einzelne Motorwicklung ist für 400 V gebaut (Δ 400 V) und liegt im Dreieck direkt an 400 V Außenleiterspannung. Dieser Motor darf am 400-V-Netz per Stern-Dreieck-Schaltung sanft anlaufen und im Dauerbetrieb in Dreieck laufen!';
    }

    // SVG Brücken zeichnen
    let bridgesSvg = '';
    if (motorState.wiring === 'star') {
      // Waagerechte Messingbrücken oben: W2 - U2 - V2
      bridgesSvg = `
        <rect x="70" y="42" width="160" height="12" rx="6" fill="#f59e0b" stroke="#fbbf24" stroke-width="2"/>
        <text x="150" y="34" text-anchor="middle" fill="#fbbf24" font-size="11" font-weight="700">Sternbrücke (W2–U2–V2)</text>
      `;
    } else if (motorState.wiring === 'delta') {
      // 3 senkrechte Messingbrücken: W2-U1, U2-V1, V2-W1
      bridgesSvg = `
        <rect x="69" y="42" width="12" height="86" rx="6" fill="#f59e0b" stroke="#fbbf24" stroke-width="2"/>
        <rect x="144" y="42" width="12" height="86" rx="6" fill="#f59e0b" stroke="#fbbf24" stroke-width="2"/>
        <rect x="219" y="42" width="12" height="86" rx="6" fill="#f59e0b" stroke="#fbbf24" stroke-width="2"/>
        <text x="150" y="34" text-anchor="middle" fill="#fbbf24" font-size="11" font-weight="700">3× Dreieckbrücken (senkrecht)</text>
      `;
    }

    const l1Label = motorState.phaseSwap ? 'L2' : 'L1';
    const l2Label = motorState.phaseSwap ? 'L1' : 'L2';

    return `
      <div class="sim-card">
        <div class="sim-card-header">
          <div>
            <span class="badge badge-blue">Simulator 1 · Dein Wackel-Thema #1</span>
            <h3>⚙️ Motor-Klemmbrett & Typenschild-Trainer</h3>
          </div>
        </div>
        <p class="sim-subtitle">Baustellen-Netz: <strong>3/N/PE AC 230/400 V (50 Hz)</strong>. Zwischen zwei Außenleitern (L1–L2–L3) liegen immer <strong>400 V</strong>.</p>

        <div class="sim-controls-grid">
          <div class="sim-control-group">
            <label>1. Motor-Typenschild wählen:</label>
            <div class="segmented-btns">
              <button class="seg-btn ${is230_400 ? 'active' : ''}" onclick="ElektroSimulators.setMotorNameplate('230_400')">
                Δ 230 V / Y 400 V<br><small>Max. 230 V pro Spule</small>
              </button>
              <button class="seg-btn ${!is230_400 ? 'active' : ''}" onclick="ElektroSimulators.setMotorNameplate('400_690')">
                Δ 400 V / Y 690 V<br><small>Max. 400 V pro Spule</small>
              </button>
            </div>
          </div>

          <div class="sim-control-group">
            <label>2. Messingbrücken auf dem Klemmbrett legen:</label>
            <div class="segmented-btns">
              <button class="seg-btn ${motorState.wiring === 'star' ? 'active' : ''}" onclick="ElektroSimulators.setMotorWiring('star')">
                ⭐ Stern (Y)<br><small>Waagerecht</small>
              </button>
              <button class="seg-btn ${motorState.wiring === 'delta' ? 'active' : ''}" onclick="ElektroSimulators.setMotorWiring('delta')">
                🔺 Dreieck (Δ)<br><small>Senkrecht</small>
              </button>
              <button class="seg-btn ${motorState.wiring === 'none' ? 'active' : ''}" onclick="ElektroSimulators.setMotorWiring('none')">
                Offen<br><small>Ohne Brücke</small>
              </button>
            </div>
          </div>
        </div>

        <div class="klemmbrett-wrap">
          <svg viewBox="0 0 300 200" class="klemmbrett-svg">
            <rect x="25" y="15" width="250" height="145" rx="14" fill="#1e293b" stroke="#475569" stroke-width="2"/>
            ${bridgesSvg}
            <!-- Obere Reihe: W2, U2, V2 -->
            <circle cx="75" cy="48" r="14" fill="#0f172a" stroke="#94a3b8" stroke-width="2.5"/>
            <text x="75" y="52" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="700">W2</text>

            <circle cx="150" cy="48" r="14" fill="#0f172a" stroke="#94a3b8" stroke-width="2.5"/>
            <text x="150" y="52" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="700">U2</text>

            <circle cx="225" cy="48" r="14" fill="#0f172a" stroke="#94a3b8" stroke-width="2.5"/>
            <text x="225" y="52" text-anchor="middle" fill="#f8fafc" font-size="11" font-weight="700">V2</text>

            <!-- Untere Reihe: U1, V1, W1 -->
            <circle cx="75" cy="122" r="14" fill="#0f172a" stroke="#38bdf8" stroke-width="2.5"/>
            <text x="75" y="126" text-anchor="middle" fill="#38bdf8" font-size="11" font-weight="700">U1</text>

            <circle cx="150" cy="122" r="14" fill="#0f172a" stroke="#38bdf8" stroke-width="2.5"/>
            <text x="150" y="126" text-anchor="middle" fill="#38bdf8" font-size="11" font-weight="700">V1</text>

            <circle cx="225" cy="122" r="14" fill="#0f172a" stroke="#38bdf8" stroke-width="2.5"/>
            <text x="225" y="126" text-anchor="middle" fill="#38bdf8" font-size="11" font-weight="700">W1</text>

            <!-- Zuleitung L1, L2, L3 -->
            <line x1="75" y1="136" x2="75" y2="178" stroke="#ef4444" stroke-width="3"/>
            <text x="75" y="193" text-anchor="middle" fill="#f87171" font-size="12" font-weight="700">${l1Label}</text>

            <line x1="150" y1="136" x2="150" y2="178" stroke="#38bdf8" stroke-width="3"/>
            <text x="150" y="193" text-anchor="middle" fill="#38bdf8" font-size="12" font-weight="700">${l2Label}</text>

            <line x1="225" y1="136" x2="225" y2="178" stroke="#10b981" stroke-width="3"/>
            <text x="225" y="193" text-anchor="middle" fill="#34d399" font-size="12" font-weight="700">L3</text>
          </svg>

          <div class="klemmbrett-metrics">
            <div class="metric-pill">
              <span>Erlaubte Spulenspannung:</span>
              <strong>max. ${maxCoilVoltage} V</strong>
            </div>
            <div class="metric-pill ${appliedCoilVoltage > maxCoilVoltage ? 'metric-danger' : ''}">
              <span>Tatsächliche Spannung je Spule:</span>
              <strong>${appliedCoilVoltage} V</strong>
            </div>
            <div class="metric-pill">
              <span>Drehrichtung:</span>
              <strong>${motorState.phaseSwap ? '↺ Linkslauf (L1/L2 getauscht)' : '↻ Rechtslauf (L1–L2–L3)'}</strong>
            </div>
            <button class="btn-secondary btn-sm" onclick="ElektroSimulators.togglePhaseSwap()">
              🔄 L1 & L2 tauschen (Drehrichtung ändern)
            </button>
          </div>
        </div>

        <div class="sim-alert ${statusClass}">
          <strong>${statusTitle}</strong>
          <p>${statusText}</p>
        </div>
      </div>
    `;
  }

  // --------------------------------------------------------------------------
  // Render Simulator 2: Taschen-FluidSIM (Steuerstromkreis & Drahtbruch)
  // --------------------------------------------------------------------------
  function renderFluidSim() {
    recomputeFluidSim();
    const k1 = fluidState.k1Energized;
    const f2Closed = !fluidState.f2Tripped;
    const s0Closed =
      fluidState.wireBreakS0
        ? false
        : fluidState.scenario === 'bug_s0_no'
        ? fluidState.s0Pressed
        : !fluidState.s0Pressed;
    const s1Closed = fluidState.s1Pressed;
    const holdClosed = fluidState.scenario === 'bug_no_hold' ? false : k1;

    const lineAfterF2 = f2Closed;
    const lineAfterS0 = lineAfterF2 && s0Closed;
    const lineAfterBranch = lineAfterS0 && (s1Closed || holdClosed);

    return `
      <div class="sim-card">
        <div class="sim-card-header">
          <div>
            <span class="badge badge-emerald">Simulator 2 · Dein Wackel-Thema #3 (FluidSIM-Ersatz)</span>
            <h3>🔌 Taschen-FluidSIM: Selbsthaltung & Drahtbruchsicherheit</h3>
          </div>
        </div>
        <p class="sim-subtitle">
          <strong>Goldene Prüfungsregel:</strong> Alle Schalter werden im Schaltplan im <strong>stromlosen, unbetätigten Ruhezustand</strong> gezeichnet! Ein <strong>Öffner (-S0, -F2)</strong> ist in Ruhe <em>geschlossen</em> und öffnet erst beim Drücken oder Drahtbruch.
        </p>

        <div class="sim-control-group" style="margin-bottom:12px;">
          <label>Schaltung / Fehlersuche-Modus wählen:</label>
          <div class="segmented-btns">
            <button class="seg-btn ${fluidState.scenario === 'standard' ? 'active' : ''}" onclick="ElektroSimulators.setFluidScenario('standard')">
              ✅ 1. Selbsthaltung (Korrekt)
            </button>
            <button class="seg-btn ${fluidState.scenario === 'bug_no_hold' ? 'active' : ''}" onclick="ElektroSimulators.setFluidScenario('bug_no_hold')">
              🔍 2. Fehler: Läuft nur beim Halten
            </button>
            <button class="seg-btn ${fluidState.scenario === 'bug_s0_no' ? 'active' : ''}" onclick="ElektroSimulators.setFluidScenario('bug_s0_no')">
              ⚠️ 3. Fehler: -S0 als Schließer
            </button>
          </div>
        </div>

        <div class="fluidsim-interactive-bar">
          <button class="sim-action-btn ${!fluidState.s0Pressed ? 'btn-nc-closed' : 'btn-nc-open'}" onclick="ElektroSimulators.toggleFluidButton('s0')">
            🔴 -S0 (AUS-Taster) ${fluidState.s0Pressed ? 'GEDRÜCKT (betätigt)' : 'Losgelassen (Ruhezustand)'}
          </button>
          <button class="sim-action-btn ${fluidState.s1Pressed ? 'btn-no-closed' : ''}" onclick="ElektroSimulators.pressS1Pulse()">
            🟢 -S1 (EIN-Taster antippen)
          </button>
          <button class="sim-action-btn ${fluidState.f2Tripped ? 'btn-nc-open' : ''}" onclick="ElektroSimulators.toggleFluidButton('f2')">
            🌡️ -F2 (95–96) ${fluidState.f2Tripped ? 'AUSGELÖST (Überlast!)' : 'OK (Ruhezustand)'}
          </button>
          <button class="sim-action-btn ${fluidState.wireBreakS0 ? 'btn-nc-open' : ''}" onclick="ElektroSimulators.toggleFluidButton('wireBreak')">
            ✂️ Drahtbruch an -S0: ${fluidState.wireBreakS0 ? 'KABEL ABGERISSEN!' : 'Leitung intakt'}
          </button>
        </div>

        <div class="fluidsim-canvas-wrap">
          <svg viewBox="0 0 340 270" class="fluidsim-svg">
            <!-- +24V / L1 Schiene oben -->
            <line x1="20" y1="20" x2="320" y2="20" stroke="#ef4444" stroke-width="3"/>
            <text x="25" y="14" fill="#f87171" font-size="11" font-weight="700">L1 (+24 V)</text>

            <!-- Leitung zu F2 -->
            <line x1="130" y1="20" x2="130" y2="48" stroke="#ef4444" stroke-width="2.5"/>
            <!-- -F2 (95-96 Öffner) -->
            <text x="80" y="62" fill="#e2e8f0" font-size="11" font-weight="700">-F2 (95/96)</text>
            <circle cx="130" cy="48" r="3" fill="#e2e8f0"/>
            <circle cx="130" cy="72" r="3" fill="#e2e8f0"/>
            ${
              f2Closed
                ? `<line x1="130" y1="48" x2="130" y2="72" stroke="#10b981" stroke-width="3"/>`
                : `<line x1="130" y1="72" x2="116" y2="50" stroke="#ef4444" stroke-width="3"/>`
            }

            <!-- Leitung zwischen F2 und S0 -->
            <line x1="130" y1="72" x2="130" y2="100" stroke="${lineAfterF2 ? '#10b981' : '#475569'}" stroke-width="2.5"/>

            <!-- -S0 (11-12 Öffner oder Fehler Schließer) -->
            <text x="58" y="115" fill="#e2e8f0" font-size="11" font-weight="700">-S0 (${fluidState.scenario === 'bug_s0_no' ? '13/14 FALSCH!' : '11/12 Öffner'})</text>
            <circle cx="130" cy="100" r="3" fill="#e2e8f0"/>
            <circle cx="130" cy="126" r="3" fill="#e2e8f0"/>
            ${
              fluidState.wireBreakS0
                ? `<text x="142" y="116" fill="#ef4444" font-size="11" font-weight="700">⚡ DRAHTBRUCH!</text>`
                : s0Closed
                ? `<line x1="130" y1="100" x2="130" y2="126" stroke="${lineAfterF2 ? '#10b981' : '#94a3b8'}" stroke-width="3"/>`
                : `<line x1="130" y1="126" x2="116" y2="102" stroke="#f59e0b" stroke-width="3"/>`
            }

            <!-- Verzweigung nach S0 zu S1 (links) und K1 13-14 (rechts) -->
            <line x1="130" y1="126" x2="130" y2="145" stroke="${lineAfterS0 ? '#10b981' : '#475569'}" stroke-width="2.5"/>
            <line x1="130" y1="145" x2="220" y2="145" stroke="${lineAfterS0 ? '#10b981' : '#475569'}" stroke-width="2.5"/>
            <line x1="130" y1="145" x2="130" y2="160" stroke="${lineAfterS0 ? '#10b981' : '#475569'}" stroke-width="2.5"/>
            <line x1="220" y1="145" x2="220" y2="160" stroke="${lineAfterS0 ? '#10b981' : '#475569'}" stroke-width="2.5"/>

            <!-- -S1 (13-14 Schließer) -->
            <text x="72" y="177" fill="#e2e8f0" font-size="11" font-weight="700">-S1 (13/14)</text>
            <circle cx="130" cy="160" r="3" fill="#e2e8f0"/>
            <circle cx="130" cy="186" r="3" fill="#e2e8f0"/>
            ${
              s1Closed
                ? `<line x1="130" y1="160" x2="130" y2="186" stroke="${lineAfterS0 ? '#10b981' : '#94a3b8'}" stroke-width="3"/>`
                : `<line x1="130" y1="186" x2="115" y2="162" stroke="#94a3b8" stroke-width="2.5"/>`
            }

            <!-- -K1 (13-14 Selbsthalte-Schließer) -->
            <text x="232" y="177" fill="#38bdf8" font-size="11" font-weight="700">-K1 (13/14)</text>
            <circle cx="220" cy="160" r="3" fill="#e2e8f0"/>
            <circle cx="220" cy="186" r="3" fill="#e2e8f0"/>
            ${
              fluidState.scenario === 'bug_no_hold'
                ? `<text x="232" y="192" fill="#ef4444" font-size="10" font-weight="700">❌ Draht fehlt!</text>
                   <line x1="220" y1="186" x2="205" y2="162" stroke="#ef4444" stroke-width="2" stroke-dasharray="3,3"/>`
                : holdClosed
                ? `<line x1="220" y1="160" x2="220" y2="186" stroke="#10b981" stroke-width="3"/>`
                : `<line x1="220" y1="186" x2="205" y2="162" stroke="#94a3b8" stroke-width="2.5"/>`
            }

            <!-- Zusammenführung vor Spule -K1 (A1/A2) -->
            <line x1="130" y1="186" x2="130" y2="200" stroke="${lineAfterS0 && s1Closed ? '#10b981' : '#475569'}" stroke-width="2.5"/>
            <line x1="220" y1="186" x2="220" y2="200" stroke="${lineAfterS0 && holdClosed ? '#10b981' : '#475569'}" stroke-width="2.5"/>
            <line x1="130" y1="200" x2="220" y2="200" stroke="${lineAfterBranch ? '#10b981' : '#475569'}" stroke-width="2.5"/>
            <line x1="175" y1="200" x2="175" y2="212" stroke="${lineAfterBranch ? '#10b981' : '#475569'}" stroke-width="2.5"/>

            <!-- Schützspule -K1 (A1/A2) -->
            <rect x="150" y="212" width="50" height="28" rx="4" fill="${k1 ? '#065f46' : '#1e293b'}" stroke="${k1 ? '#10b981' : '#94a3b8'}" stroke-width="2.5"/>
            <text x="175" y="230" text-anchor="middle" fill="#f8fafc" font-size="12" font-weight="700">-K1</text>
            <line x1="175" y1="240" x2="175" y2="255" stroke="${k1 ? '#38bdf8' : '#475569'}" stroke-width="2.5"/>

            <!-- N / 0V Schiene unten -->
            <line x1="20" y1="255" x2="320" y2="255" stroke="#38bdf8" stroke-width="3"/>
            <text x="25" y="249" fill="#38bdf8" font-size="11" font-weight="700">N (0 V)</text>
          </svg>

          <div class="fluidsim-status-box ${k1 ? 'motor-running' : 'motor-stopped'}">
            <div class="motor-indicator">${k1 ? '🟢 MOTOR LÄUFT (-K1 angezogen)' : '⚪ MOTOR STEHT (-K1 abgefallen)'}</div>
            <p>
              ${
                fluidState.wireBreakS0
                  ? '✂️ <strong>Drahtbruchsicherheit aktiv:</strong> Weil -S0 als Öffner im Ruhestromprinzip verdrahtet ist, hat der Kabelbruch den Stromkreis sofort unterbrochen. Der Motor stoppt sicher!'
                  : fluidState.scenario === 'bug_no_hold'
                  ? '🔍 <strong>Fehler-Labor:</strong> Ohne den parallelen Selbsthaltekontakt -K1 (13–14) läuft der Motor nur im Tippbetrieb (solange -S1 gedrückt wird).'
                  : fluidState.scenario === 'bug_s0_no'
                  ? '⚠️ <strong>Gefährlicher Fehler:</strong> Wenn -S0 als Schließer verdrahtet wird, ist der Stromkreis in Ruhe offen und lässt sich bei Drahtbruch im Betrieb nicht sicher abschalten!'
                  : k1
                  ? '✅ <strong>Selbsthaltung aktiv:</strong> Obwohl du -S1 losgelassen hast, fließt der Strom über -F2 (Öffner) → -S0 (Öffner) → -K1 (13–14 Hilfsschließer) zur Spule -K1!'
                  : 'ℹ️ <strong>Ruhezustand:</strong> -F2 (95/96) und -S0 (11/12) sind als Öffner bereits geschlossen. Tippe auf „-S1 antippen“, um den Motor zu starten!'
              }
            </p>
          </div>
        </div>
      </div>
    `;
  }

  // --------------------------------------------------------------------------
  // Render Simulator 3: Antennen dBµV-Ketten-Rechner & Trainer
  // --------------------------------------------------------------------------
  function renderDbSim() {
    const cableLoss = +((dbState.cableMeters / 100) * dbState.cableLossPer100m).toFixed(1);
    const totalLevel = +(
      dbState.inputLevel +
      dbState.ampGain -
      cableLoss -
      dbState.splitterLoss -
      dbState.outletLoss
    ).toFixed(1);

    const inNormWindow = totalLevel >= 47 && totalLevel <= 77;

    return `
      <div class="sim-card">
        <div class="sim-card-header">
          <div>
            <span class="badge badge-amber">Simulator 3 · Dein Wackel-Thema #2 (Geschenkte Punkte!)</span>
            <h3>📡 Antennen-Pegelrechner (dB & dBµV Plus/Minus-Kette)</h3>
          </div>
          <button class="btn-secondary btn-sm" onclick="ElektroSimulators.startDbChallenge()">
            🎲 Prüfungs-Rechenaufgabe würfeln
          </button>
        </div>

        <p class="sim-subtitle">
          <strong>Warum dB so einfach ist:</strong> Vergiss Multiplizieren! Du nimmst den Startpegel (in <strong>dBµV</strong>), rechnest Verstärker <strong>Plus (+)</strong> und alle Dämpfungen (Kabel, Verteiler, Dose) einfach <strong>Minus (−)</strong>!
        </p>

        ${
          dbState.challengeActive
            ? `
          <div class="db-challenge-box">
            <h4>🎯 Kopfrechen-Drill (wie in der Gesellenprüfung):</h4>
            <p>
              Eingangspegel = <strong>${dbState.inputLevel} dBµV</strong> ·
              Verstärker = <strong>+${dbState.ampGain} dB</strong> ·
              Kabel = <strong>${dbState.cableMeters} m</strong> (bei ${dbState.cableLossPer100m} dB/100m → <strong>−${cableLoss} dB</strong>) ·
              Verteiler = <strong>−${dbState.splitterLoss} dB</strong> ·
              Antennendose = <strong>−${dbState.outletLoss} dB</strong>.
            </p>
            <div class="db-challenge-input-row">
              <input type="number" step="0.1" id="db-guess-input" placeholder="Dein Ergebnis in dBµV..." value="${dbState.challengeGuess}" oninput="ElektroSimulators.updateDbGuess(this.value)"/>
              <button class="btn-primary btn-sm" onclick="ElektroSimulators.checkDbGuess()">Prüfen</button>
            </div>
            ${dbState.challengeFeedback ? `<div class="db-feedback">${dbState.challengeFeedback}</div>` : ''}
          </div>
        `
            : ''
        }

        <div class="db-chain-visual">
          <div class="db-node db-node-start">
            <small>1. HÜP / Eingang</small>
            <strong>${dbState.inputLevel} dBµV</strong>
          </div>
          <div class="db-op db-op-plus">+</div>
          <div class="db-node db-node-gain">
            <small>2. Verstärker</small>
            <strong>+${dbState.ampGain} dB</strong>
          </div>
          <div class="db-op db-op-minus">−</div>
          <div class="db-node db-node-loss">
            <small>3. Kabel (${dbState.cableMeters}m)</small>
            <strong>−${cableLoss} dB</strong>
          </div>
          <div class="db-op db-op-minus">−</div>
          <div class="db-node db-node-loss">
            <small>4. Verteiler</small>
            <strong>−${dbState.splitterLoss} dB</strong>
          </div>
          <div class="db-op db-op-minus">−</div>
          <div class="db-node db-node-loss">
            <small>5. Dose</small>
            <strong>−${dbState.outletLoss} dB</strong>
          </div>
          <div class="db-op">=</div>
          <div class="db-node ${inNormWindow ? 'db-node-result-ok' : 'db-node-result-warn'}">
            <small>Pegel am TV</small>
            <strong>${totalLevel} dBµV</strong>
          </div>
        </div>

        <div class="db-sliders-grid">
          <div class="slider-row">
            <label>Eingangspegel (HÜP/LNB): <strong>${dbState.inputLevel} dBµV</strong></label>
            <input type="range" min="40" max="85" step="1" value="${dbState.inputLevel}" oninput="ElektroSimulators.setDbParam('inputLevel', this.value)"/>
          </div>
          <div class="slider-row">
            <label>Hausanschlussverstärker (+G): <strong>+${dbState.ampGain} dB</strong></label>
            <input type="range" min="0" max="35" step="1" value="${dbState.ampGain}" oninput="ElektroSimulators.setDbParam('ampGain', this.value)"/>
          </div>
          <div class="slider-row">
            <label>Koaxkabel-Länge: <strong>${dbState.cableMeters} m</strong> (bei ${dbState.cableLossPer100m} dB/100m = <strong>−${cableLoss} dB</strong>)</label>
            <input type="range" min="5" max="100" step="5" value="${dbState.cableMeters}" oninput="ElektroSimulators.setDbParam('cableMeters', this.value)"/>
          </div>
          <div class="slider-row">
            <label>Verteiler-/Abzweigdämpfung: <strong>−${dbState.splitterLoss} dB</strong></label>
            <input type="range" min="0" max="16" step="1" value="${dbState.splitterLoss}" oninput="ElektroSimulators.setDbParam('splitterLoss', this.value)"/>
          </div>
          <div class="slider-row">
            <label>Anschlussdämpfung Antennendose: <strong>−${dbState.outletLoss} dB</strong></label>
            <input type="range" min="1" max="20" step="1" value="${dbState.outletLoss}" oninput="ElektroSimulators.setDbParam('outletLoss', this.value)"/>
          </div>
        </div>

        <div class="sim-alert ${inNormWindow ? 'sim-alert-ok' : 'sim-alert-warn'}">
          <strong>Rechnung: ${dbState.inputLevel} + ${dbState.ampGain} − ${cableLoss} − ${dbState.splitterLoss} − ${dbState.outletLoss} = ${totalLevel} dBµV</strong>
          <p>${
            inNormWindow
              ? '✅ Liegt sauber im Normfenster (47–77 dBµV für DVB-S bzw. ca. 60–75 dBµV für DVB-C).'
              : '⚠️ Achtung: Pegel ist außerhalb des idealen Normfensters (47–77 dBµV)! Verstärker oder Dosendämpfung anpassen.'
          }</p>
        </div>
      </div>
    `;
  }

  function renderAll(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = renderMotorSim() + renderFluidSim() + renderDbSim();
  }

  return {
    renderAll,
    setMotorNameplate(val) {
      motorState.nameplate = val;
      renderAll('simulators-container');
    },
    setMotorWiring(val) {
      motorState.wiring = val;
      renderAll('simulators-container');
    },
    togglePhaseSwap() {
      motorState.phaseSwap = !motorState.phaseSwap;
      renderAll('simulators-container');
    },
    setFluidScenario(val) {
      fluidState.scenario = val;
      fluidState.k1Energized = false;
      fluidState.s0Pressed = false;
      fluidState.s1Pressed = false;
      fluidState.f2Tripped = false;
      fluidState.wireBreakS0 = false;
      renderAll('simulators-container');
    },
    toggleFluidButton(which) {
      if (which === 's0') fluidState.s0Pressed = !fluidState.s0Pressed;
      if (which === 'f2') fluidState.f2Tripped = !fluidState.f2Tripped;
      if (which === 'wireBreak') fluidState.wireBreakS0 = !fluidState.wireBreakS0;
      renderAll('simulators-container');
    },
    pressS1Pulse() {
      fluidState.s1Pressed = true;
      recomputeFluidSim();
      renderAll('simulators-container');
      setTimeout(() => {
        fluidState.s1Pressed = false;
        recomputeFluidSim();
        renderAll('simulators-container');
      }, 650);
    },
    setDbParam(key, val) {
      dbState[key] = parseFloat(val);
      renderAll('simulators-container');
    },
    startDbChallenge() {
      const inputs = [55, 60, 62, 65, 68, 70];
      const gains = [15, 20, 22, 25];
      const lengths = [10, 20, 25, 30, 50];
      const splitters = [0, 4, 6, 8];
      const outlets = [4, 10, 12, 14];
      dbState.inputLevel = inputs[Math.floor(Math.random() * inputs.length)];
      dbState.ampGain = gains[Math.floor(Math.random() * gains.length)];
      dbState.cableMeters = lengths[Math.floor(Math.random() * lengths.length)];
      dbState.cableLossPer100m = 20;
      dbState.splitterLoss = splitters[Math.floor(Math.random() * splitters.length)];
      dbState.outletLoss = outlets[Math.floor(Math.random() * outlets.length)];
      dbState.challengeActive = true;
      dbState.challengeGuess = '';
      dbState.challengeFeedback = null;
      renderAll('simulators-container');
    },
    updateDbGuess(val) {
      dbState.challengeGuess = val;
    },
    checkDbGuess() {
      const cableLoss = +((dbState.cableMeters / 100) * dbState.cableLossPer100m).toFixed(1);
      const expected = +(
        dbState.inputLevel +
        dbState.ampGain -
        cableLoss -
        dbState.splitterLoss -
        dbState.outletLoss
      ).toFixed(1);
      const userVal = parseFloat(String(dbState.challengeGuess).replace(',', '.'));
      if (Math.abs(userVal - expected) < 0.15) {
        dbState.challengeFeedback = `🎉 <strong>Volltreffer (${expected} dBµV)!</strong> Siehst du: Einfach ${dbState.inputLevel} + ${dbState.ampGain} − ${cableLoss} − ${dbState.splitterLoss} − ${dbState.outletLoss} = ${expected} dBµV!`;
      } else {
        dbState.challengeFeedback = `Fast! Dein Tipp: ${isNaN(userVal) ? '–' : userVal} dBµV. Richtige Rechnung: <strong>${dbState.inputLevel} + ${dbState.ampGain} − ${cableLoss} (Kabel) − ${dbState.splitterLoss} (Verteiler) − ${dbState.outletLoss} (Dose) = ${expected} dBµV</strong>.`;
      }
      renderAll('simulators-container');
    }
  };
})();
