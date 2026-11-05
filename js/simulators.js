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

  // --------------------------------------------------------------------------
  // Simulator 4: Siemens LOGO! 8 – Steuerungs-Labor (FUP-Logik & Zeitglieder)
  // --------------------------------------------------------------------------
  const SIG_ON = '#22d3ee';  // Signal 1 (24 V / High)
  const SIG_OFF = '#475569'; // Signal 0 (Low)

  const LOGO_PRESETS = {
    treppenlicht: {
      btn: '💡 a) Treppenlicht / Lüfter (TOFF)',
      display: 'TREPPENL. TOFF',
      inputs: [['push', false], ['switch', false], ['switch', false], ['switch', false]],
      roles: ['Taster Flur / Lichtschalter (Trg)', 'frei', 'frei', 'frei'],
      outRoles: ['Flurlicht / Badlüfter', 'frei'],
      explain: `
        <p><strong>Ausschaltverzögerung (TOFF, LOGO!-Sonderfunktion):</strong> Liegt an <em>Trg</em> ein 1-Signal, schaltet Q1 <strong>sofort EIN</strong>. Erst bei der <strong>fallenden Flanke</strong> (1 → 0) startet die Zeit T. Ist T abgelaufen, fällt Q1 ab. Ein neuer Impuls während des Nachlaufs startet die Zeit neu (<em>Retrigger</em>).</p>
        <p><strong>Praxis:</strong> Badlüfter-Nachlauf am Lichtschalter (I1 auf „Schalter“ stellen!) oder Treppenhauslicht per Taster. LOGO! hat zusätzlich einen eigenen Treppenlichtschalter-Baustein mit Ausschaltvorwarnung (Licht flackert kurz vor dem Abschalten).</p>
        <p><strong>Prüfungstipp:</strong> <em>TON</em> = Einschaltverzögerung (Zeit läuft beim Einschalten), <em>TOFF</em> = Ausschaltverzögerung (Zeit läuft beim Ausschalten). Im Display zeigt LOGO! die abgelaufene Zeit als <em>Ta</em>.</p>`
    },
    zweihand: {
      btn: '✋✋ b) Zweihand-Steuerung (&)',
      display: 'ZWEIHAND  &',
      inputs: [['push', false], ['push', false], ['switch', false], ['switch', false]],
      roles: ['Taster linke Hand', 'Taster rechte Hand', 'frei', 'frei'],
      outRoles: ['Presse / Stanze', 'frei'],
      explain: `
        <p><strong>UND-Baustein (&):</strong> Der Ausgang führt nur dann 1, wenn <strong>alle</strong> Eingänge 1 sind. Die Zweihandbedienung zwingt beide Hände aus dem Gefahrenbereich (Presse, Stanze, Schere).</p>
        <p><strong>Bedienung:</strong> Am Handy mit zwei Fingern gleichzeitig drücken – am PC die Tasten <kbd>1</kbd> + <kbd>2</kbd> gemeinsam halten oder einen Eingang auf „Schalter“ umstellen.</p>
        <p><strong>Prüfungstipp:</strong> Echte Zweihandschaltungen (DIN EN ISO 13851) verlangen zusätzlich <em>Gleichzeitigkeit innerhalb 0,5 s</em> und dass beide Taster vor einem Neustart losgelassen werden – und sie werden mit Sicherheitsschaltgeräten aufgebaut, nicht mit einer Standard-LOGO!.</p>`
    },
    wendeschuetz: {
      btn: '🔄 c) Wendeschütz-Verriegelung',
      display: 'WENDE VERRIEG.',
      inputs: [['switch', false], ['switch', false], ['switch', false], ['switch', false]],
      roles: ['Rechtslauf anfordern', 'Linkslauf anfordern', 'frei', 'frei'],
      outRoles: ['-K1 Rechtslauf', '-K2 Linkslauf'],
      explain: `
        <p><strong>Gegenseitige Verriegelung:</strong> <code>Q1 = I1 ∧ ¬Q2</code> und <code>Q2 = I2 ∧ ¬Q1</code>. Der Negationskreis am Eingang sorgt dafür, dass immer nur <strong>ein</strong> Schütz anziehen kann – sonst gäbe es beim Phasentausch (L1 ↔ L3) einen <strong>Kurzschluss zwischen zwei Außenleitern</strong>.</p>
        <p><strong>Probier:</strong> I1 einschalten → Q1 zieht an. Jetzt I2 dazuschalten → Q2 bleibt gesperrt. Erst wenn I1 wieder aus ist, gibt die Logik Q2 frei.</p>
        <p><strong>Prüfungstipp:</strong> Die Software-Verriegelung alleine reicht nicht! Zusätzlich gehören die <em>Öffner-Hilfskontakte</em> von -K1/-K2 in den jeweils anderen Spulenkreis (Schützverriegelung), denn ein verschweißter Hauptkontakt wird von der Steuerung nicht erkannt. Oft kommt noch eine mechanische Verriegelung dazu.</p>`
    },
    selbsthaltung: {
      btn: '🔒 d) Selbsthaltung (RS-Speicher)',
      display: 'SELBSTH. RS',
      inputs: [['push', false], ['push', true], ['switch', false], ['switch', false]],
      roles: ['START -S1 (Set)', 'STOPP -S0 (Öffner)', 'frei', 'frei'],
      outRoles: ['-K1 Motorschütz', 'frei'],
      explain: `
        <p><strong>RS-Speicher (Selbsthalterelais) mit Reset-Vorrang:</strong> S = 1 setzt Q1 dauerhaft, R = 1 setzt zurück. Sind S und R gleichzeitig 1, <strong>gewinnt R</strong> – Sicherheit geht vor.</p>
        <p><strong>Öffnerlogik:</strong> Der STOPP-Taster an I2 ist ein Öffner – im Ruhezustand liegt also <strong>Signal 1</strong> an. Der NOT-Baustein macht daraus R = 0. Wird STOPP gedrückt oder reißt der Draht, fällt das Signal auf 0 → R = 1 → Motor aus. Das ist die <strong>Drahtbruchsicherheit</strong> aus dem FluidSIM-Simulator, nur in Software!</p>
        <p><strong>Fehler-Labor:</strong> Stell I2 auf „Schließer (NO)“ um – dann liegt dauerhaft R = 1 an und der Motor lässt sich gar nicht mehr starten.</p>`
    },
    fup_sandbox: {
      btn: '🧩 e) Freier FUP-Baukasten',
      display: 'FUP-BAUKASTEN',
      inputs: [['switch', false], ['switch', false], ['switch', false], ['switch', false]],
      roles: ['frei verwendbar', 'frei verwendbar', 'frei verwendbar', 'frei verwendbar'],
      outRoles: ['Ausgang von B001', 'Ausgang von B002'],
      explain: `
        <p><strong>Grundfunktionen (GF) der LOGO!:</strong> <code>&</code> UND, <code>≥1</code> ODER, <code>&</code> mit Kreis = NAND, <code>≥1</code> mit Kreis = NOR, <code>=1</code> XOR (Exklusiv-ODER), <code>1</code> mit Kreis = NOT. Dazu der <strong>RS-Speicher</strong> als Sonderfunktion.</p>
        <p><strong>Offene Eingänge (x):</strong> LOGO! wertet sie so, dass sie das Ergebnis nicht verfälschen – bei &/NAND als 1, bei ≥1/NOR/XOR als 0. B002 kann den Ausgang von B001 weiterverarbeiten (Merker-Prinzip).</p>
        <p><strong>Aufgabe:</strong> Baue eine Wechselschaltung (zwei Schalter, ein Licht) nur mit LOGO!-Bausteinen. Tipp: Welcher Baustein ändert sein Ergebnis, egal welcher der beiden Eingänge umgeschaltet wird?</p>`
    }
  };

  const GATE_TYPES = {
    AND:  { symbol: '&',  pins: 3, neg: false, name: 'UND (AND)' },
    OR:   { symbol: '≥1', pins: 3, neg: false, name: 'ODER (OR)' },
    NAND: { symbol: '&',  pins: 3, neg: true,  name: 'NICHT-UND (NAND)' },
    NOR:  { symbol: '≥1', pins: 3, neg: true,  name: 'NICHT-ODER (NOR)' },
    XOR:  { symbol: '=1', pins: 2, neg: false, name: 'EXKLUSIV-ODER (XOR)' },
    NOT:  { symbol: '1',  pins: 1, neg: true,  name: 'NICHT (NOT)' },
    RS:   { symbol: 'RS', pins: 2, neg: false, name: 'RS-SPEICHER', pinNames: ['S', 'R'] }
  };

  const SANDBOX_SOURCES = [
    ['I1', 'I1'], ['I2', 'I2'], ['I3', 'I3'], ['I4', 'I4'],
    ['hi', '1 (hi)'], ['lo', '0 (lo)'], ['x', 'x (offen)']
  ];

  const logoState = {
    preset: 'treppenlicht',
    inputs: [0, 1, 2, 3].map(() => ({ actuated: false, mode: 'switch', nc: false })),
    q: [false, false],
    offDelay: 3, // Nachlaufzeit T in Sekunden
    timer: { prevTrg: false, endAt: null, handle: null },
    rsMem: { selbsthaltung: false, B001: false, B002: false },
    sandbox: {
      B001: { type: 'AND', pins: ['I1', 'I2', 'x'] },
      B002: { type: 'XOR', pins: ['I3', 'I4', 'x'] }
    },
    root: null
  };

  function applyLogoPreset(id) {
    const preset = LOGO_PRESETS[id];
    if (!preset) return;
    logoState.preset = id;
    logoState.inputs = preset.inputs.map(([mode, nc]) => ({ actuated: false, mode, nc }));
    resetLogoRuntime();
  }

  function resetLogoRuntime() {
    logoState.inputs.forEach(inp => { inp.actuated = false; });
    logoState.q = [false, false];
    logoState.timer.prevTrg = false;
    logoState.timer.endAt = null;
    logoState.rsMem = { selbsthaltung: false, B001: false, B002: false };
    syncLogoTimer();
  }
  applyLogoPreset('treppenlicht');

  function inputSignal(inp) {
    // Öffner (NC): Signal 1 im Ruhezustand, 0 wenn betätigt
    return inp.nc ? !inp.actuated : inp.actuated;
  }

  function rsLogic(memKey, set, reset) {
    if (reset) logoState.rsMem[memKey] = false; // Reset-Vorrang
    else if (set) logoState.rsMem[memKey] = true;
    return logoState.rsMem[memKey];
  }

  function gateLogic(type, vals, memKey) {
    switch (type) {
      case 'AND': return vals.every(Boolean);
      case 'NAND': return !vals.every(Boolean);
      case 'OR': return vals.some(Boolean);
      case 'NOR': return !vals.some(Boolean);
      case 'XOR': return vals[0] !== vals[1];
      case 'NOT': return !vals[0];
      case 'RS': return rsLogic(memKey, vals[0], vals[1]);
      default: return false;
    }
  }

  function sourceValue(src, I, b1Out) {
    if (src === 'x') return null;
    if (src === 'hi') return true;
    if (src === 'lo') return false;
    if (src === 'B001') return !!b1Out;
    return I[parseInt(src.slice(1), 10) - 1];
  }

  function evalSandboxBlock(id, I, b1Out) {
    const cfg = logoState.sandbox[id];
    const gate = GATE_TYPES[cfg.type];
    const srcs = cfg.pins.slice(0, gate.pins);
    // Offene Eingänge: bei &/NAND neutral = 1, sonst 0
    const openVal = cfg.type === 'AND' || cfg.type === 'NAND';
    const vals = srcs.map(src => {
      const v = sourceValue(src, I, b1Out);
      return v === null ? openVal : v;
    });
    return { type: cfg.type, srcs, vals, out: gateLogic(cfg.type, vals, id) };
  }

  function evalLogo() {
    const now = Date.now();
    const I = logoState.inputs.map(inputSignal);
    const prevQ = logoState.q.slice();
    const s = { I, q: [false, false], net: {} };

    switch (logoState.preset) {
      case 'treppenlicht': {
        const t = logoState.timer;
        const trg = I[0];
        if (trg) t.endAt = null;
        else if (t.prevTrg) t.endAt = now + logoState.offDelay * 1000; // fallende Flanke
        if (t.endAt !== null && now >= t.endAt) t.endAt = null;
        t.prevTrg = trg;
        s.q[0] = trg || t.endAt !== null;
        s.net.rest = t.endAt !== null ? Math.max(0, (t.endAt - now) / 1000) : 0;
        break;
      }
      case 'zweihand':
        s.q[0] = I[0] && I[1];
        break;
      case 'wendeschuetz': {
        // Zyklisch bis stabil auswerten (wie die LOGO!-Programmzyklen), Q1 hat bei Gleichzeitigkeit Vorrang
        let q1 = prevQ[0];
        let q2 = prevQ[1];
        for (let k = 0; k < 4; k++) {
          const n1 = I[0] && !q2;
          const n2 = I[1] && !n1;
          if (n1 === q1 && n2 === q2) break;
          q1 = n1;
          q2 = n2;
        }
        s.q = [q1, q2];
        s.net.blocked1 = I[0] && !q1;
        s.net.blocked2 = I[1] && !q2;
        break;
      }
      case 'selbsthaltung': {
        s.net.S = I[0];
        s.net.R = !I[1]; // NOT-Baustein hinter dem Öffner
        s.q[0] = rsLogic('selbsthaltung', s.net.S, s.net.R);
        break;
      }
      case 'fup_sandbox': {
        const b1 = evalSandboxBlock('B001', I, false);
        const b2 = evalSandboxBlock('B002', I, b1.out);
        s.net.b1 = b1;
        s.net.b2 = b2;
        s.q = [b1.out, b2.out];
        break;
      }
    }

    logoState.q = s.q;
    s.changed = [prevQ[0] !== s.q[0], prevQ[1] !== s.q[1]];
    return s;
  }

  function syncLogoTimer() {
    const t = logoState.timer;
    const needTick = logoState.preset === 'treppenlicht' && t.endAt !== null;
    if (needTick && !t.handle) {
      t.handle = setInterval(refreshLogo, 100);
    } else if (!needTick && t.handle) {
      clearInterval(t.handle);
      t.handle = null;
    }
  }

  // ---- FUP-Zeichnung (DIN EN 60617-12: Rechteck mit Symbol, Kreis = Negation) ----
  function sigColor(v) {
    return v ? SIG_ON : SIG_OFF;
  }

  function fupGate(o) {
    const w = o.w || 64;
    const pinCount = o.pins.length;
    const hh = Math.max(pinCount, 2) * 22 + 12;
    const outY = o.y + hh / 2;
    const on = !!o.out.val;
    const hasPinNames = o.pins.some(p => p.pinName);
    let svg = '';

    if (o.title) {
      svg += `<text x="${o.x + w / 2}" y="${o.y - 7}" text-anchor="middle" class="fup-title">${o.title}</text>`;
    }
    svg += `<rect x="${o.x}" y="${o.y}" width="${w}" height="${hh}" rx="3" fill="${on ? 'rgba(34,211,238,0.12)' : '#0b1220'}" stroke="${on ? SIG_ON : '#64748b'}" stroke-width="2"/>`;
    if (o.symbol) {
      svg += `<text x="${o.x + w / 2 + (hasPinNames ? 7 : 0)}" y="${o.y + 21}" text-anchor="middle" class="fup-sym">${o.symbol}</text>`;
    }
    if (o.inner) svg += o.inner(o.x, o.y, w, hh);

    o.pins.forEach((p, i) => {
      const py = o.y + (hh * (i + 1)) / (pinCount + 1);
      const col = sigColor(p.val);
      const sw = p.val ? 3 : 2;
      const xEnd = p.neg ? o.x - 8 : o.x;
      if (p.from) {
        const mx = o.x - 18;
        svg += `<polyline points="${p.from.x},${p.from.y} ${mx},${p.from.y} ${mx},${py} ${xEnd},${py}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linejoin="round"/>`;
      } else {
        const x0 = p.fromX !== undefined ? p.fromX : o.x - 52;
        svg += `<line x1="${x0}" y1="${py}" x2="${xEnd}" y2="${py}" stroke="${col}" stroke-width="${sw}"/>`;
        if (p.label) {
          svg += `<text x="${x0 - 5}" y="${py + 4}" text-anchor="end" class="fup-label" fill="${p.val ? SIG_ON : '#94a3b8'}">${p.label}</text>`;
        }
        svg += `<text x="${x0 + 4}" y="${py - 5}" class="fup-val" fill="${col}">${p.val ? 1 : 0}</text>`;
      }
      if (p.neg) {
        svg += `<circle cx="${o.x - 4}" cy="${py}" r="4" fill="#090d16" stroke="${col}" stroke-width="2"/>`;
      }
      if (p.pinName) {
        svg += `<text x="${o.x + 5}" y="${py + 4}" class="fup-pin">${p.pinName}</text>`;
      }
    });

    const oc = sigColor(on);
    const ox0 = o.out.neg ? o.x + w + 8 : o.x + w;
    const toX = o.out.toX !== undefined ? o.out.toX : o.x + w + 52;
    if (o.out.neg) {
      svg += `<circle cx="${o.x + w + 4}" cy="${outY}" r="4" fill="#090d16" stroke="${oc}" stroke-width="2"/>`;
    }
    svg += `<line x1="${ox0}" y1="${outY}" x2="${toX}" y2="${outY}" stroke="${oc}" stroke-width="${on ? 3 : 2}"/>`;
    svg += `<text x="${toX - 10}" y="${outY - 5}" class="fup-val" fill="${oc}">${on ? 1 : 0}</text>`;
    if (o.out.label) {
      svg += `<text x="${toX + 5}" y="${outY + 4}" class="fup-label" fill="${on ? SIG_ON : '#94a3b8'}">${o.out.label}</text>`;
    }
    return { svg, outX: toX, outY, h: hh };
  }

  function toffIcon(x, y, w, hh) {
    // Zeitdiagramm-Symbol: Eingangsimpuls oben, verlängerter Ausgang unten
    const ix = x + 34;
    const iy = y + hh / 2;
    return `
      <path d="M${ix},${iy - 3} h4 v-9 h10 v9 h20" fill="none" stroke="#e2e8f0" stroke-width="1.5"/>
      <path d="M${ix},${iy + 13} h4 v-9 h20 v9 h10" fill="none" stroke="#e2e8f0" stroke-width="1.5"/>
      <line x1="${ix + 14}" y1="${iy + 1}" x2="${ix + 24}" y2="${iy + 1}" stroke="#f59e0b" stroke-width="1.2"/>`;
  }

  function renderLogoFup(s) {
    const I = s.I;
    let body = '';
    let height = 140;

    switch (logoState.preset) {
      case 'treppenlicht': {
        const g = fupGate({
          x: 150, y: 30, w: 84, title: 'B001 · TOFF (Ausschaltverzögerung)',
          pins: [
            { label: 'I1', val: I[0], pinName: 'Trg' },
            { label: 'x', val: false, pinName: 'R' }
          ],
          out: { val: s.q[0], label: 'Q1' },
          inner: toffIcon
        });
        const running = s.net.rest > 0;
        const ta = running ? ` · Ta = ${(logoState.offDelay - s.net.rest).toFixed(1)} s` : '';
        body = g.svg + `<text x="192" y="${30 + g.h + 18}" text-anchor="middle" class="fup-title" fill="${running ? '#f59e0b' : '#94a3b8'}">Par: T = ${logoState.offDelay.toFixed(2)} s${ta}</text>`;
        height = 130;
        break;
      }
      case 'zweihand': {
        const g = fupGate({
          x: 150, y: 30, w: 64, title: 'B001 · UND',
          symbol: '&',
          pins: [{ label: 'I1', val: I[0] }, { label: 'I2', val: I[1] }],
          out: { val: s.q[0], label: 'Q1' }
        });
        body = g.svg;
        height = 110;
        break;
      }
      case 'wendeschuetz': {
        const g1 = fupGate({
          x: 150, y: 24, w: 64, title: 'B001 · & mit Verriegelung',
          symbol: '&',
          pins: [{ label: 'I1', val: I[0] }, { label: 'Q2', val: s.q[1], neg: true }],
          out: { val: s.q[0], label: 'Q1' }
        });
        const g2 = fupGate({
          x: 150, y: 116, w: 64, title: 'B002 · & mit Verriegelung',
          symbol: '&',
          pins: [{ label: 'I2', val: I[1] }, { label: 'Q1', val: s.q[0], neg: true }],
          out: { val: s.q[1], label: 'Q2' }
        });
        body = g1.svg + g2.svg;
        height = 186;
        break;
      }
      case 'selbsthaltung': {
        const gNot = fupGate({
          x: 96, y: 84, w: 46, title: 'B001 · NOT',
          symbol: '1',
          pins: [{ label: 'I2', val: I[1] }],
          out: { val: s.net.R, neg: true, toX: 168 }
        });
        const gRs = fupGate({
          x: 210, y: 26, w: 64, title: 'B002 · RS (Reset-Vorrang)',
          symbol: 'RS',
          pins: [
            { label: 'I1', val: s.net.S, pinName: 'S', fromX: 50 },
            { val: s.net.R, pinName: 'R', from: { x: gNot.outX, y: gNot.outY } }
          ],
          out: { val: s.q[0], label: 'Q1', toX: 316 }
        });
        body = gNot.svg + gRs.svg;
        height = 158;
        break;
      }
      case 'fup_sandbox': {
        const blockSvg = (id, b, y, outLabel) => {
          const gate = GATE_TYPES[b.type];
          return fupGate({
            x: 150, y, w: 70, title: `${id} · ${gate.name}`,
            symbol: gate.symbol,
            pins: b.srcs.map((src, i) => ({
              label: src === 'hi' ? '1' : src === 'lo' ? '0' : src,
              val: b.vals[i],
              pinName: gate.pinNames ? gate.pinNames[i] : ''
            })),
            out: { val: b.out, neg: gate.neg, label: outLabel }
          });
        };
        body = blockSvg('B001', s.net.b1, 24, 'Q1').svg + blockSvg('B002', s.net.b2, 128, 'Q2').svg;
        height = 216;
        break;
      }
    }
    return `<svg viewBox="0 0 360 ${height}" class="logo-fup-svg" role="img" aria-label="Funktionsplan FUP">${body}</svg>`;
  }

  // ---- Display (Bernstein-LCD) ----
  function sandboxExpr(b) {
    const n = b.srcs.map(src => (src === 'hi' ? '1' : src === 'lo' ? '0' : src));
    switch (b.type) {
      case 'AND': return n.join(' ∧ ');
      case 'NAND': return `¬(${n.join(' ∧ ')})`;
      case 'OR': return n.join(' ∨ ');
      case 'NOR': return `¬(${n.join(' ∨ ')})`;
      case 'XOR': return n.join(' ⊕ ');
      case 'NOT': return `¬${n[0]}`;
      case 'RS': return `RS(S=${n[0]}, R=${n[1]})`;
      default: return '';
    }
  }

  function renderLogoDisplay(s) {
    const preset = LOGO_PRESETS[logoState.preset];
    const cell = (n, on) => `<span class="ld-cell ${on ? 'on' : ''}">${n}</span>`;
    const b = v => (v ? 1 : 0);
    let live = '';
    let extra = '';
    let bar = '';

    switch (logoState.preset) {
      case 'treppenlicht': {
        const rest = s.net.rest;
        const pct = s.I[0] ? 100 : Math.min(100, (rest / logoState.offDelay) * 100);
        live = s.I[0] ? 'TRG=1  Q1 EIN' : rest > 0 ? `REST: ${rest.toFixed(1)} s` : 'BEREIT  Q1=0';
        bar = `<div class="ld-bar"><div style="width:${pct.toFixed(1)}%"></div></div>`;
        extra = `B001 TOFF T=${logoState.offDelay.toFixed(2)}s`;
        break;
      }
      case 'zweihand':
        live = `I1&I2: ${b(s.I[0])}&${b(s.I[1])} = ${b(s.q[0])}`;
        extra = s.q[0] ? 'PRESSE FÄHRT' : s.I[0] || s.I[1] ? 'WARTE AUF 2. HAND' : 'BEIDE HÄNDE!';
        break;
      case 'wendeschuetz':
        live = s.net.blocked2 ? 'Q2 GESPERRT (Q1)' : s.net.blocked1 ? 'Q1 GESPERRT (Q2)' : s.q[0] ? 'RECHTSLAUF  Q1=1' : s.q[1] ? 'LINKSLAUF  Q2=1' : 'STOP  Q1=0 Q2=0';
        extra = 'Q1=I1∧¬Q2 Q2=I2∧¬Q1';
        break;
      case 'selbsthaltung':
        live = `S=${b(s.net.S)} R=${b(s.net.R)} → Q1=${b(s.q[0])}`;
        extra = s.net.S && s.net.R ? 'RESET-VORRANG!' : `SPEICHER ${s.q[0] ? 'GESETZT' : 'RÜCKGES.'}`;
        break;
      case 'fup_sandbox':
        live = `B001 ${s.net.b1.type}=${b(s.net.b1.out)}`;
        extra = `B002 ${s.net.b2.type}=${b(s.net.b2.out)}`;
        break;
    }

    return `
      <div class="ld-row"><span class="ld-run">RUN</span><span>${preset.display}</span></div>
      <div class="ld-row"><span>I:${[0, 1, 2, 3].map(i => cell(i + 1, s.I[i])).join('')}</span><span>Q:${cell(1, s.q[0])}${cell(2, s.q[1])}</span></div>
      <div class="ld-row"><span>${live}</span></div>
      ${bar}
      <div class="ld-row ld-small"><span>${extra}</span></div>
    `;
  }

  function renderLogoStatus(s) {
    let cls = 'sim-alert-info';
    let html = '';
    switch (logoState.preset) {
      case 'treppenlicht':
        if (s.I[0]) {
          cls = 'sim-alert-ok';
          html = '✅ <strong>Trigger aktiv:</strong> I1 führt 1 → Q1 ist sofort EIN. Die Nachlaufzeit startet erst beim Loslassen (fallende Flanke).';
        } else if (s.net.rest > 0) {
          cls = 'sim-alert-warn';
          html = `⏱️ <strong>Nachlauf läuft: noch ${s.net.rest.toFixed(1)} s.</strong> I1 ist schon 0, aber TOFF hält Q1 weiter EIN. Nochmal drücken = Zeit startet neu (Retrigger).`;
        } else {
          html = 'ℹ️ <strong>Ruhezustand:</strong> Drück Taster I1 kurz – das Licht geht sofort an und läuft nach dem Loslassen noch T Sekunden nach.';
        }
        break;
      case 'zweihand':
        if (s.q[0]) {
          cls = 'sim-alert-ok';
          html = '✅ <strong>Beide Hände auf den Tastern:</strong> & = 1 → Q1 zieht an, die Presse fährt. Eine Hand loslassen = sofort Stopp.';
        } else if (s.I[0] || s.I[1]) {
          cls = 'sim-alert-warn';
          html = '✋ <strong>Nur eine Hand:</strong> Ein Eingang ist 0 → der &-Baustein bleibt 0. Genau das schützt die freie Hand vor dem Werkzeug!';
        } else {
          html = 'ℹ️ <strong>Bereit:</strong> Betätige I1 und I2 gleichzeitig (zwei Finger oder Tasten 1 + 2 halten).';
        }
        break;
      case 'wendeschuetz':
        if (s.net.blocked1 || s.net.blocked2) {
          cls = 'sim-alert-warn';
          html = `🔒 <strong>Verriegelung greift:</strong> ${s.net.blocked2 ? 'Q1 (Rechtslauf) ist aktiv → ¬Q1 = 0 sperrt B002. Q2 bleibt AUS' : 'Q2 (Linkslauf) ist aktiv → ¬Q2 = 0 sperrt B001. Q1 bleibt AUS'} – kein Kurzschluss zwischen den Außenleitern!`;
        } else if (s.q[0] || s.q[1]) {
          cls = 'sim-alert-ok';
          html = `✅ <strong>${s.q[0] ? 'Rechtslauf: -K1 (Q1)' : 'Linkslauf: -K2 (Q2)'} angezogen.</strong> Versuch jetzt die andere Drehrichtung dazuzuschalten!`;
        } else {
          html = 'ℹ️ <strong>Motor steht:</strong> Schalte I1 (Rechtslauf) oder I2 (Linkslauf) ein.';
        }
        break;
      case 'selbsthaltung':
        if (!logoState.inputs[1].nc) {
          cls = 'sim-alert-danger';
          html = '⚠️ <strong>Fehler: STOPP als Schließer!</strong> Im Ruhezustand liegt an I2 jetzt 0 an → NOT macht daraus R = 1 → der Reset-Vorrang blockiert jeden Start. Außerdem würde ein Drahtbruch nicht mehr erkannt.';
        } else if (s.net.S && s.net.R) {
          cls = 'sim-alert-warn';
          html = '⚖️ <strong>START und STOPP gleichzeitig:</strong> Reset-Vorrang – R gewinnt, Q1 bleibt AUS. Sicherheit geht vor!';
        } else if (s.q[0]) {
          cls = 'sim-alert-ok';
          html = `✅ <strong>Selbsthaltung aktiv:</strong> ${s.net.S ? 'S = 1 setzt den Speicher.' : 'START ist schon losgelassen, der RS-Speicher hält Q1 trotzdem EIN – wie der Hilfskontakt -K1 13/14.'}`;
        } else if (s.net.R) {
          cls = 'sim-alert-warn';
          html = '🔴 <strong>STOPP betätigt:</strong> Der Öffner unterbricht, I2 = 0 → R = 1 → Speicher rückgesetzt, Motor AUS.';
        } else {
          html = 'ℹ️ <strong>Ruhezustand:</strong> I2 (Öffner) liefert schon Signal 1. Tippe START (I1) an.';
        }
        break;
      case 'fup_sandbox': {
        const b1 = s.net.b1;
        const b2 = s.net.b2;
        html = `🧩 <strong>Q1 = ${sandboxExpr(b1)} = ${b1.out ? 1 : 0}</strong> &nbsp;·&nbsp; <strong>Q2 = ${sandboxExpr(b2)} = ${b2.out ? 1 : 0}</strong>`;
        cls = b1.out || b2.out ? 'sim-alert-ok' : 'sim-alert-info';
        break;
      }
    }
    return { cls, html };
  }

  function contactSvg(closed) {
    const c = closed ? '#4ade80' : '#64748b';
    return `
      <svg viewBox="0 0 34 34" width="34" height="34" aria-hidden="true">
        <line x1="17" y1="2" x2="17" y2="9" stroke="${c}" stroke-width="2"/>
        <line x1="17" y1="25" x2="17" y2="32" stroke="${c}" stroke-width="2"/>
        ${closed
          ? `<line x1="17" y1="9" x2="17" y2="25" stroke="${c}" stroke-width="2.5"/>`
          : `<line x1="17" y1="25" x2="9" y2="10" stroke="${c}" stroke-width="2.5"/>`}
        <text x="22" y="10" font-size="7" fill="#94a3b8">1</text>
        <text x="22" y="31" font-size="7" fill="#94a3b8">2</text>
      </svg>`;
  }

  // Aktualisiert nur die Live-Bereiche (kein Neuaufbau → Taster bleiben während des Haltens bedienbar)
  function refreshLogo() {
    const s = evalLogo();
    syncLogoTimer();
    const root = logoState.root;
    if (!root || !root.isConnected) return;
    const byId = id => root.querySelector('#' + id);

    const disp = byId('logo-display');
    if (disp) disp.innerHTML = renderLogoDisplay(s);

    logoState.inputs.forEach((inp, i) => {
      const n = i + 1;
      const card = byId(`logo-in-${n}`);
      const btn = byId(`logo-in-btn-${n}`);
      const sig = byId(`logo-in-sig-${n}`);
      const term = byId(`logo-term-i${n}`);
      if (card) card.classList.toggle('sig1', s.I[i]);
      if (btn) {
        btn.classList.toggle('on', inp.actuated);
        btn.setAttribute('aria-pressed', String(inp.actuated));
      }
      if (sig) {
        sig.textContent = `Signal ${s.I[i] ? 1 : 0}`;
        sig.classList.toggle('hi', s.I[i]);
      }
      if (term) term.classList.toggle('live', s.I[i]);
    });

    [0, 1].forEach(k => {
      const n = k + 1;
      const q = byId(`logo-q-${n}`);
      const term = byId(`logo-term-q${n}`);
      if (term) term.classList.toggle('live', s.q[k]);
      if (!q) return;
      q.classList.toggle('on', s.q[k]);
      const st = q.querySelector('.logo-q-state');
      if (st) st.textContent = s.q[k] ? 'EIN · Kontakt 1–2 zu' : 'AUS · Kontakt offen';
      const contact = q.querySelector('.logo-contact');
      if (contact) contact.innerHTML = contactSvg(s.q[k]);
      if (s.changed[k]) {
        q.classList.remove('relay-click');
        void q.offsetWidth; // Reflow → Animation neu starten
        q.classList.add('relay-click');
      }
    });

    const fup = byId('logo-fup');
    if (fup) fup.innerHTML = renderLogoFup(s);

    const status = byId('logo-status');
    if (status) {
      const st = renderLogoStatus(s);
      status.className = `sim-alert ${st.cls}`;
      status.innerHTML = st.html;
    }
  }

  function renderLogoInputCard(i) {
    const n = i + 1;
    const inp = logoState.inputs[i];
    const role = LOGO_PRESETS[logoState.preset].roles[i];
    const isPush = inp.mode === 'push';
    const handlers = isPush
      ? `onpointerdown="ElektroSimulators.logoPress(${n}, true, event)"
         onpointerup="ElektroSimulators.logoPress(${n}, false, event)"
         onpointerleave="ElektroSimulators.logoPress(${n}, false, event)"
         onpointercancel="ElektroSimulators.logoPress(${n}, false, event)"
         onkeydown="ElektroSimulators.logoKey(${n}, true, event)"
         onkeyup="ElektroSimulators.logoKey(${n}, false, event)"
         oncontextmenu="return false"`
      : `onclick="ElektroSimulators.logoToggle(${n})"`;
    return `
      <div class="logo-in" id="logo-in-${n}">
        <div class="logo-in-name">I${n}</div>
        <button type="button" id="logo-in-btn-${n}" class="logo-in-btn ${isPush ? 'push' : 'switch'} ${inp.nc ? 'nc' : ''}"
          aria-pressed="false" aria-label="Eingang I${n} (${isPush ? 'Taster' : 'Schalter'})" ${handlers}></button>
        <span class="logo-sig" id="logo-in-sig-${n}">Signal 0</span>
        <div class="logo-in-role">${role}</div>
        <button type="button" class="logo-mini" title="Taster (tastend) / Schalter (rastend) umschalten" onclick="ElektroSimulators.logoSetInputMode(${n})">${isPush ? '🔘 Taster' : '🎚️ Schalter'}</button>
        <button type="button" class="logo-mini ${inp.nc ? 'nc' : ''}" title="Schließer / Öffner umschalten" onclick="ElektroSimulators.logoToggleContact(${n})">${inp.nc ? 'Öffner (NC)' : 'Schließer (NO)'}</button>
      </div>`;
  }

  function renderLogoOutputCard(k) {
    const n = k + 1;
    return `
      <div class="logo-q" id="logo-q-${n}">
        <div class="logo-lamp" aria-hidden="true"></div>
        <div class="logo-q-text">
          <div class="logo-q-name">Q${n} <span class="logo-klack">klack!</span></div>
          <div class="logo-q-role">${LOGO_PRESETS[logoState.preset].outRoles[k]}</div>
          <div class="logo-q-state">AUS · Kontakt offen</div>
        </div>
        <div class="logo-contact">${contactSvg(false)}</div>
      </div>`;
  }

  function renderLogoSettings() {
    if (logoState.preset === 'treppenlicht') {
      return `
        <div class="logo-settings">
          <label for="logo-delay">Nachlaufzeit T (Parameter B001): <strong id="logo-delay-val">${logoState.offDelay.toFixed(1)} s</strong></label>
          <input type="range" id="logo-delay" min="1" max="10" step="0.5" value="${logoState.offDelay}" oninput="ElektroSimulators.logoSetDelay(this.value)"/>
        </div>`;
    }
    if (logoState.preset !== 'fup_sandbox') return '';

    const typeOptions = cur =>
      Object.keys(GATE_TYPES).map(t => `<option value="${t}" ${t === cur ? 'selected' : ''}>${GATE_TYPES[t].symbol} · ${t}</option>`).join('');
    const row = (id, outName, extraSources) => {
      const cfg = logoState.sandbox[id];
      const gate = GATE_TYPES[cfg.type];
      const sources = SANDBOX_SOURCES.concat(extraSources);
      const pins = cfg.pins.slice(0, gate.pins).map((src, i) => `
        <label class="logo-sb-pin">${gate.pinNames ? gate.pinNames[i] : 'E' + (i + 1)}
          <select class="logo-select" onchange="ElektroSimulators.logoSetPin('${id}', ${i}, this.value)">
            ${sources.map(([v, l]) => `<option value="${v}" ${v === src ? 'selected' : ''}>${l}</option>`).join('')}
          </select>
        </label>`).join('');
      return `
        <div class="logo-sb-row">
          <span class="logo-sb-name">${id} → ${outName}</span>
          <select class="logo-select" aria-label="Bausteintyp ${id}" onchange="ElektroSimulators.logoSetBlockType('${id}', this.value)">${typeOptions(cfg.type)}</select>
          ${pins}
        </div>`;
    };
    return `
      <div class="logo-settings">
        <div class="logo-sb-head">🧩 Programmierung (wie in LOGO!Soft Comfort): Baustein wählen, Eingänge verknüpfen</div>
        ${row('B001', 'Q1', [])}
        ${row('B002', 'Q2', [['B001', 'B001 (Ausgang)']])}
      </div>`;
  }

  function renderLogoSimulator(containerEl) {
    const el = typeof containerEl === 'string' ? document.getElementById(containerEl) : containerEl;
    if (!el) return;
    ensureLogoStyles();
    logoState.root = el;
    const preset = LOGO_PRESETS[logoState.preset];
    const screw = (id, label) => `<div class="logo-term" ${id ? `id="${id}"` : ''}><span class="logo-screw"></span>${label}</div>`;

    el.innerHTML = `
      <div class="sim-card logo-card">
        <div class="sim-card-header">
          <div>
            <span class="badge badge-amber">Simulator 4 · Steuerungstechnik (Kleinsteuerung / FUP)</span>
            <h3>📟 Siemens LOGO! 8 – Steuerungs-Labor</h3>
          </div>
          <button class="btn-secondary btn-sm" onclick="ElektroSimulators.logoReset()" title="Programm neu starten (STOP → RUN)">⟲ Neustart</button>
        </div>
        <p class="sim-subtitle">Programm wählen, Eingänge <strong>I1–I4</strong> betätigen und live im <strong>Funktionsplan (FUP)</strong> verfolgen, welcher Signalpfad <span style="color:${SIG_ON};font-weight:700">1 (24 V)</span> oder <span style="color:#94a3b8;font-weight:700">0</span> führt. Tastatur: <kbd>1</kbd>–<kbd>4</kbd> = I1–I4.</p>

        <div class="segmented-btns logo-preset-btns">
          ${Object.keys(LOGO_PRESETS).map(id => `
            <button class="seg-btn ${logoState.preset === id ? 'active' : ''}" onclick="ElektroSimulators.logoSetPreset('${id}')">${LOGO_PRESETS[id].btn}</button>`).join('')}
        </div>

        <div class="logo-layout">
          <div class="logo-unit">
            <div class="logo-terminals">
              ${screw('', 'L+')}${screw('', 'M')}${screw('logo-term-i1', 'I1')}${screw('logo-term-i2', 'I2')}${screw('logo-term-i3', 'I3')}${screw('logo-term-i4', 'I4')}
            </div>
            <div class="logo-face">
              <div class="logo-brand">
                <span class="logo-siemens">SIEMENS</span>
                <span class="logo-name">LOGO!<span class="logo-eight">8</span></span>
              </div>
              <div class="logo-screen-row">
                <div class="logo-display" id="logo-display" aria-live="off"></div>
                <div class="logo-keys" aria-hidden="true">
                  <span class="logo-key k-esc">ESC</span>
                  <span class="logo-key k-up">▲</span>
                  <span class="logo-key k-ok">OK</span>
                  <span class="logo-key k-left">◄</span>
                  <span class="logo-key k-down">▼</span>
                  <span class="logo-key k-right">►</span>
                </div>
              </div>
              <div class="logo-typeplate">12/24RCE · 6ED1052-1MD08-0BA1 · 8 DI / 4 DQ</div>
            </div>
            <div class="logo-terminals">
              ${screw('logo-term-q1', 'Q1·1')}${screw('', 'Q1·2')}${screw('logo-term-q2', 'Q2·1')}${screw('', 'Q2·2')}
            </div>
          </div>

          <div class="logo-io">
            <div class="logo-io-title">Eingänge · 24 V DC</div>
            <div class="logo-inputs">${[0, 1, 2, 3].map(renderLogoInputCard).join('')}</div>
            <div class="logo-io-title">Relaisausgänge · Leuchtmelder</div>
            <div class="logo-outputs">${[0, 1].map(renderLogoOutputCard).join('')}</div>
          </div>
        </div>

        ${renderLogoSettings()}

        <div class="logo-fup-wrap">
          <div class="logo-fup-head">
            <span>📐 Funktionsplan (FUP nach DIN EN 60617-12)</span>
            <span class="fup-legend"><span><i style="background:${SIG_ON}"></i>Signal 1</span><span><i style="background:${SIG_OFF}"></i>Signal 0</span><span><i class="neg"></i>Negation</span></span>
          </div>
          <div id="logo-fup"></div>
        </div>

        <div id="logo-status" class="sim-alert sim-alert-info"></div>
        <div class="logo-explain">${preset.explain}</div>
      </div>
    `;
    refreshLogo();
  }

  function rerenderLogo() {
    if (logoState.root && logoState.root.isConnected) renderLogoSimulator(logoState.root);
  }

  function logoPress(n, down, event) {
    const inp = logoState.inputs[n - 1];
    if (!inp || inp.mode !== 'push') return;
    if (event && event.type === 'pointerdown') event.preventDefault();
    if (inp.actuated === down) return;
    inp.actuated = down;
    refreshLogo();
  }

  function logoToggle(n) {
    const inp = logoState.inputs[n - 1];
    if (!inp || inp.mode !== 'switch') return;
    inp.actuated = !inp.actuated;
    refreshLogo();
  }

  function handleLogoHotkey(e, down) {
    if (!/^[1-4]$/.test(e.key) || e.ctrlKey || e.altKey || e.metaKey) return;
    const root = logoState.root;
    if (!root || !root.isConnected || root.offsetParent === null) return;
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    e.preventDefault();
    if (down && e.repeat) return;
    const n = parseInt(e.key, 10);
    if (logoState.inputs[n - 1].mode === 'push') logoPress(n, down);
    else if (down) logoToggle(n);
  }
  document.addEventListener('keydown', e => handleLogoHotkey(e, true));
  document.addEventListener('keyup', e => handleLogoHotkey(e, false));

  function ensureLogoStyles() {
    if (document.getElementById('logo-sim-styles')) return;
    const style = document.createElement('style');
    style.id = 'logo-sim-styles';
    style.textContent = `
      .lab-tabs { display: flex; gap: 6px; overflow-x: auto; margin-bottom: 14px; padding-bottom: 4px; scrollbar-width: thin; }
      .lab-tab-btn { flex: 0 0 auto; background: #0f172a; color: var(--text-muted); border: 1px solid #263554; border-radius: 999px; padding: 8px 13px; font-size: 0.78rem; font-weight: 700; cursor: pointer; white-space: nowrap; }
      .lab-tab-btn.active { background: rgba(56, 189, 248, 0.16); color: var(--text-main); border-color: var(--accent-blue); }

      .logo-preset-btns { flex-wrap: wrap; margin-bottom: 4px; }
      .logo-preset-btns .seg-btn { flex: 1 1 150px; }
      .logo-layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 14px; align-items: start; margin: 12px 0 14px; }

      .logo-unit { background: linear-gradient(180deg, #2b3240, #1b212b); border: 1px solid #3b4556; border-radius: 10px; padding: 8px 9px; box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 10px 24px rgba(0,0,0,0.45); width: 100%; max-width: 400px; margin: 0 auto; }
      .logo-terminals { display: flex; gap: 4px; background: #10141b; border-radius: 6px; padding: 5px 6px; }
      .logo-term { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; font: 700 0.58rem ui-monospace, SFMono-Regular, Consolas, monospace; color: #9aa4b2; }
      .logo-term.live { color: ${SIG_ON}; }
      .logo-screw { width: 14px; height: 14px; border-radius: 50%; position: relative; background: radial-gradient(circle at 35% 35%, #d5dbe3, #6b7380); box-shadow: inset 0 0 0 1px #2a2f38; }
      .logo-screw::after { content: ''; position: absolute; left: 3px; right: 3px; top: 6px; height: 2px; background: #2a2f38; transform: rotate(-35deg); }
      .logo-term.live .logo-screw { box-shadow: inset 0 0 0 1px #2a2f38, 0 0 0 2px rgba(34,211,238,0.75); }
      .logo-face { padding: 9px 3px 7px; }
      .logo-brand { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 7px; }
      .logo-siemens { font-weight: 900; letter-spacing: 0.08em; font-size: 0.82rem; color: #2dd4bf; }
      .logo-name { font-weight: 900; font-size: 1.05rem; color: #f1f5f9; font-style: italic; }
      .logo-eight { font-size: 0.7rem; vertical-align: super; margin-left: 2px; color: #2dd4bf; font-style: normal; }
      .logo-screen-row { display: flex; gap: 8px; align-items: stretch; }
      .logo-display { flex: 1; min-width: 0; min-height: 98px; padding: 6px 8px; border-radius: 4px; background: linear-gradient(180deg, #f9cd72, #e8a63a); color: #2a1a02; font: 700 0.74rem/1.4 ui-monospace, SFMono-Regular, Consolas, monospace; box-shadow: 0 0 18px rgba(245,158,11,0.45), inset 0 0 0 2px #8a5a10, inset 0 0 14px rgba(120,70,0,0.35); }
      .ld-row { display: flex; justify-content: space-between; align-items: center; gap: 6px; white-space: nowrap; overflow: hidden; }
      .ld-run { background: #2a1a02; color: #f9cd72; padding: 0 4px; border-radius: 2px; }
      .ld-cell { display: inline-block; min-width: 1.25em; text-align: center; border: 1px solid rgba(42,26,2,0.55); border-radius: 2px; margin-left: 2px; }
      .ld-cell.on { background: #2a1a02; color: #f9cd72; }
      .ld-bar { height: 6px; border: 1px solid #2a1a02; border-radius: 2px; margin: 2px 0; overflow: hidden; }
      .ld-bar > div { height: 100%; background: #2a1a02; transition: width 0.1s linear; }
      .ld-small { font-size: 0.64rem; opacity: 0.85; }
      .logo-keys { display: grid; grid-template-columns: repeat(3, 20px); grid-template-rows: repeat(3, 20px); gap: 3px; align-content: center; }
      .logo-key { display: flex; align-items: center; justify-content: center; background: #3a4352; border: 1px solid #4b5563; border-radius: 4px; color: #cbd5e1; font-size: 0.5rem; font-weight: 800; }
      .k-esc { grid-column: 1; grid-row: 1; } .k-up { grid-column: 2; grid-row: 1; } .k-ok { grid-column: 3; grid-row: 1; }
      .k-left { grid-column: 1; grid-row: 2; } .k-down { grid-column: 2; grid-row: 3; } .k-right { grid-column: 3; grid-row: 2; }
      .logo-typeplate { margin-top: 7px; font: 600 0.55rem ui-monospace, Consolas, monospace; color: #7c8796; letter-spacing: 0.03em; }

      .logo-io-title { font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin: 2px 0 6px; }
      .logo-inputs { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; margin-bottom: 12px; }
      .logo-in { background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 8px 4px 6px; display: flex; flex-direction: column; align-items: center; gap: 5px; text-align: center; transition: border-color 0.12s; }
      .logo-in.sig1 { border-color: rgba(34,211,238,0.65); }
      .logo-in-name { font-weight: 800; font-size: 0.82rem; }
      .logo-in-role { font-size: 0.62rem; color: var(--text-muted); line-height: 1.15; min-height: 2.3em; }
      .logo-in-btn { cursor: pointer; touch-action: none; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; border: none; padding: 0; }
      .logo-in-btn:focus-visible { outline: 2px solid var(--accent-blue); outline-offset: 3px; }
      .logo-in-btn.push { --cap1: #4ade80; --cap2: #15803d; --capd: #0f3d22; width: 44px; height: 44px; margin: 4px 0; border-radius: 50%; background: radial-gradient(circle at 40% 35%, var(--cap1), var(--cap2)); box-shadow: 0 4px 0 var(--capd), 0 0 0 4px #1f2937, 0 0 0 5px #4b5563; transition: transform 0.05s, box-shadow 0.05s; }
      .logo-in-btn.push.nc { --cap1: #f87171; --cap2: #b91c1c; --capd: #4c0d0d; }
      .logo-in-btn.push.on { transform: translateY(3px); box-shadow: 0 1px 0 var(--capd), 0 0 0 4px #1f2937, 0 0 0 5px #4b5563; }
      .logo-in-btn.switch { position: relative; width: 30px; height: 52px; border-radius: 8px; background: #1f2937; border: 2px solid #4b5563; }
      .logo-in-btn.switch::before { content: ''; position: absolute; left: 3px; right: 3px; bottom: 3px; height: 21px; border-radius: 5px; background: linear-gradient(180deg, #e5e7eb, #9ca3af); transition: bottom 0.12s; }
      .logo-in-btn.switch.on { border-color: ${SIG_ON}; }
      .logo-in-btn.switch.on::before { bottom: 23px; background: linear-gradient(180deg, #67e8f9, #0891b2); }
      .logo-sig { font: 700 0.62rem ui-monospace, Consolas, monospace; padding: 1px 6px; border-radius: 999px; background: #1e293b; color: #94a3b8; }
      .logo-sig.hi { background: rgba(34,211,238,0.18); color: #67e8f9; }
      .logo-mini { width: 100%; background: none; border: 1px solid #334155; color: var(--text-muted); border-radius: 6px; font-size: 0.58rem; font-weight: 700; padding: 3px 2px; cursor: pointer; }
      .logo-mini.nc { border-color: rgba(239,68,68,0.55); color: #fca5a5; }

      .logo-outputs { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
      .logo-q { background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 9px 8px; display: flex; align-items: center; gap: 8px; min-width: 0; }
      .logo-q.on { border-color: rgba(74,222,128,0.55); }
      .logo-lamp { flex: 0 0 42px; width: 42px; height: 42px; border-radius: 50%; border: 4px solid #14532d; background: radial-gradient(circle at 40% 35%, #334155, #0f172a); box-shadow: inset 0 2px 6px rgba(0,0,0,0.6); transition: background 0.1s, box-shadow 0.15s, border-color 0.15s; }
      .logo-q.on .logo-lamp { border-color: #4ade80; background: radial-gradient(circle at 40% 35%, #dcfce7, #22c55e 55%, #15803d); box-shadow: 0 0 18px 5px rgba(34,197,94,0.55), inset 0 0 6px rgba(255,255,255,0.5); }
      .logo-q-text { flex: 1; min-width: 0; }
      .logo-q-name { font-weight: 800; font-size: 0.86rem; }
      .logo-q-role { font-size: 0.64rem; color: var(--text-muted); line-height: 1.2; }
      .logo-q-state { font: 700 0.6rem ui-monospace, Consolas, monospace; color: #64748b; }
      .logo-q.on .logo-q-state { color: #4ade80; }
      .logo-contact { flex: 0 0 34px; }
      .logo-klack { font-size: 0.58rem; font-weight: 800; color: var(--accent-amber); opacity: 0; }
      .logo-q.relay-click .logo-lamp { animation: logoRelayClick 0.22s ease-out; }
      .logo-q.relay-click .logo-contact { animation: logoRelayShake 0.22s ease-out; }
      .logo-q.relay-click .logo-klack { animation: logoKlack 0.6s ease-out; }
      @keyframes logoRelayClick { 0% { transform: scale(1); } 35% { transform: scale(0.86); } 70% { transform: scale(1.07); } 100% { transform: scale(1); } }
      @keyframes logoRelayShake { 0%, 100% { transform: translateX(0); } 30% { transform: translateX(-2px); } 60% { transform: translateX(2px); } }
      @keyframes logoKlack { 0% { opacity: 1; } 100% { opacity: 0; } }

      .logo-settings { background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 10px 12px; margin-bottom: 12px; font-size: 0.8rem; }
      .logo-settings label { display: block; color: var(--text-muted); font-weight: 600; margin-bottom: 6px; }
      .logo-settings input[type=range] { width: 100%; }
      .logo-sb-head { font-size: 0.78rem; font-weight: 700; color: var(--text-muted); margin-bottom: 8px; }
      .logo-sb-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-bottom: 8px; }
      .logo-sb-name { font: 800 0.78rem ui-monospace, Consolas, monospace; min-width: 84px; }
      .logo-settings .logo-sb-pin { display: inline-flex; align-items: center; gap: 4px; margin: 0; font-size: 0.72rem; }
      .logo-select { background: #0b1220; color: var(--text-main); border: 1px solid #334155; border-radius: 8px; padding: 5px 6px; font-size: 0.78rem; }

      .logo-fup-wrap { background: #090d16; border: 1px solid #1e293b; border-radius: 12px; padding: 10px; margin-bottom: 12px; }
      .logo-fup-head { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 6px; font-size: 0.74rem; font-weight: 700; color: var(--text-muted); margin-bottom: 6px; }
      .fup-legend > span { display: inline-flex; align-items: center; gap: 4px; margin-left: 10px; }
      .fup-legend i { display: inline-block; width: 18px; height: 3px; border-radius: 2px; }
      .fup-legend i.neg { width: 9px; height: 9px; border-radius: 50%; border: 2px solid #94a3b8; }
      .logo-fup-svg { width: 100%; max-width: 520px; display: block; margin: 0 auto; }
      .fup-title { fill: #94a3b8; font: 700 10px ui-monospace, Consolas, monospace; }
      .fup-label { font: 800 12px ui-monospace, Consolas, monospace; }
      .fup-pin { fill: #cbd5e1; font: 700 10px ui-monospace, Consolas, monospace; }
      .fup-sym { fill: #f8fafc; font: 800 16px ui-monospace, Consolas, monospace; }
      .fup-val { font: 700 9px ui-monospace, Consolas, monospace; }

      .logo-explain { font-size: 0.82rem; color: var(--text-muted); margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }
      .logo-explain strong { color: var(--text-main); }
      .logo-card kbd { font: 700 0.72rem ui-monospace, Consolas, monospace; background: #1e293b; border: 1px solid #334155; border-bottom-width: 2px; border-radius: 4px; padding: 0 4px; color: var(--text-main); }

      @media (max-width: 640px) {
        .logo-layout { grid-template-columns: 1fr; }
        .logo-display { font-size: 0.68rem; }
      }
      @media (prefers-reduced-motion: reduce) {
        .logo-q.relay-click .logo-lamp, .logo-q.relay-click .logo-contact, .logo-q.relay-click .logo-klack { animation: none; }
      }
    `;
    document.head.appendChild(style);
  }

  // --------------------------------------------------------------------------
  // Labor-Navigation: Umschalter zwischen den 4 Simulatoren
  // --------------------------------------------------------------------------
  const LAB_TABS = [
    { id: 'motor', label: '1. ⚙️ Motor-Klemmbrett' },
    { id: 'fluid', label: '2. 🔌 Taschen-FluidSIM' },
    { id: 'db', label: '3. 📡 Antennen-Pegelrechner' },
    { id: 'logo', label: '4. 📟 Siemens LOGO! Steuerungs-Labor' }
  ];
  const labState = { activeSim: 'motor' };

  function renderAll(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    ensureLogoStyles();
    const tabs = `
      <div class="lab-tabs" role="tablist" aria-label="Praxis-Labor Simulatoren">
        ${LAB_TABS.map(t => `
          <button class="lab-tab-btn ${labState.activeSim === t.id ? 'active' : ''}" role="tab" aria-selected="${labState.activeSim === t.id}" onclick="ElektroSimulators.setLabTab('${t.id}')">${t.label}</button>`).join('')}
      </div>`;

    if (labState.activeSim === 'logo') {
      el.innerHTML = tabs + '<div id="logo-sim-root"></div>';
      renderLogoSimulator(el.querySelector('#logo-sim-root'));
      return;
    }
    const body =
      labState.activeSim === 'fluid' ? renderFluidSim() :
      labState.activeSim === 'db' ? renderDbSim() :
      renderMotorSim();
    el.innerHTML = tabs + body;
  }

  return {
    renderAll,
    renderLogoSimulator,
    setLabTab(id) {
      if (!LAB_TABS.some(t => t.id === id)) return;
      labState.activeSim = id;
      renderAll('simulators-container');
    },
    logoSetPreset(id) {
      applyLogoPreset(id);
      rerenderLogo();
    },
    logoPress,
    logoToggle,
    logoKey(n, down, event) {
      if (event.key !== ' ' && event.key !== 'Enter') return;
      event.preventDefault();
      if (down && event.repeat) return;
      logoPress(n, down);
    },
    logoSetInputMode(n) {
      const inp = logoState.inputs[n - 1];
      if (!inp) return;
      inp.mode = inp.mode === 'push' ? 'switch' : 'push';
      inp.actuated = false;
      rerenderLogo();
    },
    logoToggleContact(n) {
      const inp = logoState.inputs[n - 1];
      if (!inp) return;
      inp.nc = !inp.nc;
      rerenderLogo();
    },
    logoSetDelay(val) {
      const v = parseFloat(val);
      if (!isFinite(v) || v <= 0) return;
      logoState.offDelay = v;
      const label = document.getElementById('logo-delay-val');
      if (label) label.textContent = `${v.toFixed(1)} s`;
      refreshLogo();
    },
    logoSetBlockType(id, type) {
      if (!logoState.sandbox[id] || !GATE_TYPES[type]) return;
      logoState.sandbox[id].type = type;
      logoState.rsMem[id] = false;
      rerenderLogo();
    },
    logoSetPin(id, pinIdx, src) {
      const cfg = logoState.sandbox[id];
      if (!cfg || pinIdx < 0 || pinIdx > 2) return;
      cfg.pins[pinIdx] = src;
      rerenderLogo();
    },
    logoReset() {
      resetLogoRuntime();
      rerenderLogo();
    },
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
