// ============================================================================
// ElektroCoach PRO – Werkzeug-Guide & Werkzeug-Quiz
// 1. TOOLS: 10 typische Elektro-Werkzeuge mit Norm, Profi-Tipp & Azubi-Fehler
// 2. QUIZ_QUESTIONS: 6 Baustellen-Szenarien "Welches Werkzeug nimmst du?"
// 3. renderToolsGuide(containerEl) / renderToolQuiz(containerEl)
// ============================================================================

window.ElektroTools = (function () {
  // Gemeinsame SVG-Attribute (technischer Strichstil, folgt currentColor)
  const SVG_OPEN = '<svg viewBox="0 0 64 64" width="48" height="48" fill="none" stroke="currentColor" ' +
    'stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
  const SVG_CLOSE = '</svg>';

  const TOOLS = [
    {
      id: 'jokari',
      name: 'Jokari-Kabelmesser / Abmantler',
      category: 'kabel',
      norm: 'DIN EN 60900',
      iconSvg: SVG_OPEN +
        '<circle cx="22" cy="22" r="13"/>' +
        '<circle cx="22" cy="22" r="5"/>' +
        '<path d="M31 31 L54 54"/>' +
        '<path d="M36 30 L56 50 L50 56 L30 36"/>' +
        '<path d="M14 14 L18 18"/>' +
        SVG_CLOSE,
      description: 'Rundkabel-Abmantler für NYM-, NYY- und H05VV-Leitungen (ca. 8–13 mm Ø). Die Klinge ist in der Tiefe ' +
        'einstellbar und schneidet nur den Außenmantel – Rundschnitt durch Drehen, Längsschnitt durch Ziehen.',
      baustellenTipp: 'Erst an einem Reststück die Schnitttiefe einstellen. Rundschnitt: 1–2 Umdrehungen, dann Mantel ' +
        'knicken und abziehen – er reißt sauber an der Schnittlinie. Für lange Abmantellängen Längsschnitt mit der Hakenklinge.',
      typicalMistake: 'Mit dem Cuttermesser "längs am Mantel entlang" arbeiten und dabei die Aderisolierung anritzen. ' +
        'Ein geritzter Leiter fällt spätestens bei der Isolationsmessung auf – oder Jahre später als Fehlerstrom.'
    },
    {
      id: 'abisolierer',
      name: 'Automatische Abisolierzange 0,03–10 mm²',
      category: 'kabel',
      norm: 'DIN EN 60900 (VDE-Ausführung)',
      iconSvg: SVG_OPEN +
        '<path d="M8 20 L34 20 L40 26 L34 32 L8 32 Z"/>' +
        '<path d="M8 36 L34 36 L40 42 L34 48 L8 48 Z" opacity="0.6"/>' +
        '<path d="M40 26 L56 22"/>' +
        '<path d="M40 42 L56 46"/>' +
        '<path d="M48 30 L48 38"/>' +
        '<path d="M14 26 L28 26"/>' +
        SVG_CLOSE,
      description: 'Selbsteinstellende Zange: klemmt den Leiter, schneidet die Isolierung und zieht sie in einem Hub ab. ' +
        'Passt sich automatisch an den Querschnitt an – kein Einkerben der Litze bei richtiger Anwendung.',
      baustellenTipp: 'Längenanschlag auf die Klemmen-Abisolierlänge einstellen (z. B. 11 mm bei WAGO 221, Aufdruck ' +
        'auf der Klemme beachten). So werden alle Adern einheitlich lang – das spart Nacharbeit und sieht im Verteiler sauber aus.',
      typicalMistake: 'Feindrähtige Litzen "irgendwie" mit dem Seitenschneider abisolieren. Abgeschnittene Einzeldrähte ' +
        'verringern den Querschnitt – Erwärmung an der Klemme ist die Folge.'
    },
    {
      id: 'aderendhuelsen_zange',
      name: 'Crimpzange für Aderendhülsen (Vier-/Sechskant)',
      category: 'kabel',
      norm: 'DIN 46228',
      iconSvg: SVG_OPEN +
        '<path d="M6 26 L30 26 L36 32 L30 38 L6 38"/>' +
        '<polygon points="42,25 50,25 54,32 50,39 42,39 38,32"/>' +
        '<path d="M54 32 L60 32"/>' +
        '<path d="M42 32 L50 32"/>' +
        SVG_CLOSE,
      description: 'Verpresst Aderendhülsen (isoliert/unisoliert) nach DIN 46228 auf feindrähtige Leiter, meist ' +
        '0,08–16 mm². Selbstnachstellende Zangen mit Zwangssperre geben erst frei, wenn die Pressung vollständig ist.',
      baustellenTipp: 'Hülse passend zum Querschnitt wählen (Farbcode nach DIN 46228-4: z. B. 1,5 mm² schwarz, ' +
        '2,5 mm² blau – Herstellerfarben können abweichen). Litze muss bis zum Hülsenende reichen, Isolierung im Kragen anliegen.',
      typicalMistake: 'Aderendhülsen mit der Kombizange "zusammendrücken". Das ist keine gasdichte Pressverbindung – ' +
        'die Hülse lockert sich, die Verbindung wird hochohmig und warm.'
    },
    {
      id: 'kabelschuh_presse',
      name: 'Presszange für Rohrkabelschuhe bis 50 mm²',
      category: 'kabel',
      norm: 'DIN 46235',
      iconSvg: SVG_OPEN +
        '<circle cx="14" cy="32" r="7"/>' +
        '<circle cx="14" cy="32" r="2.5"/>' +
        '<path d="M21 28 L40 28 L40 36 L21 36"/>' +
        '<path d="M40 30 L58 30"/>' +
        '<path d="M40 34 L58 34"/>' +
        '<polygon points="28,22 34,22 37,32 34,42 28,42 25,32" stroke-width="2"/>' +
        SVG_CLOSE,
      description: 'Mechanische Hebel-Presszange mit Sechskant-Einsätzen für Rohrkabelschuhe und Pressverbinder ' +
        'aus Kupfer (z. B. 10–50 mm²). Die Sechskantpressung verdichtet den Leiter rundum gleichmäßig.',
      baustellenTipp: 'Kabelschuh, Leiterquerschnitt und Presseinsatz müssen zusammenpassen (Prägung auf Schuh und ' +
        'Einsatz vergleichen). Bei Rohrkabelschuhen mit mehreren Pressungen von der Lasche zum Leiter hin pressen.',
      typicalMistake: 'Einen 35-mm²-Leiter in einen 50-mm²-Kabelschuh pressen oder mit dem Hammer "quetschen". ' +
        'Die Verbindung hält mechanisch nicht und hat einen zu hohen Übergangswiderstand.'
    },
    {
      id: 'duspol',
      name: 'Duspol digital – Zweipoliger Spannungsprüfer',
      category: 'messen',
      norm: 'DIN EN 61243-3 · CAT IV 600 V / CAT III 1000 V',
      iconSvg: SVG_OPEN +
        '<rect x="10" y="8" width="16" height="34" rx="4"/>' +
        '<rect x="14" y="13" width="8" height="10" rx="1"/>' +
        '<path d="M18 42 L18 56"/>' +
        '<rect x="38" y="20" width="14" height="22" rx="4"/>' +
        '<path d="M45 42 L45 56"/>' +
        '<path d="M26 14 C34 6 42 10 45 20"/>' +
        '<path d="M16 30 L20 30 M18 28 L18 32"/>' +
        SVG_CLOSE,
      description: 'Zweipoliger Spannungsprüfer nach DIN EN 61243-3 mit Display, Drehfeld- und Durchgangsanzeige. ' +
        'Per Tastendruck zuschaltbare Last: belastet den Stromkreis so, dass ein 30-mA-RCD auslöst (L gegen PE).',
      baustellenTipp: 'Vor UND nach dem Messen an einer bekannten Spannungsquelle prüfen (Prüfer-Selbsttest). ' +
        'Allpolig messen: L1–L2, L2–L3, L1–L3, jeder Außenleiter gegen N und gegen PE – erst dann ist "spannungsfrei" festgestellt.',
      typicalMistake: 'Mit dem einpoligen Phasenprüfer ("Lügenstift") auf Spannungsfreiheit prüfen. Der ist nach ' +
        'DGUV dafür nicht zulässig – bei isoliertem Standort oder Handschuhen leuchtet er nicht, obwohl Spannung anliegt.'
    },
    {
      id: 'drehmoment_vde',
      name: 'VDE-Drehmomentschraubendreher 0,6–2,5 Nm',
      category: 'montage',
      norm: 'DIN EN IEC 60900 – 1000 V',
      iconSvg: SVG_OPEN +
        '<rect x="22" y="4" width="20" height="26" rx="6"/>' +
        '<path d="M26 12 L38 12 M26 18 L38 18 M26 24 L38 24" stroke-width="1.5"/>' +
        '<path d="M32 30 L32 54"/>' +
        '<path d="M29 54 L35 54 L32 60 Z"/>' +
        '<path d="M44 14 A12 12 0 0 1 44 26"/>' +
        '<path d="M44 26 L47 22 M44 26 L40 24"/>' +
        SVG_CLOSE,
      description: 'Isolierter Schraubendreher mit einstellbarer Drehmomentbegrenzung (Rutschkupplung). Wechselklingen ' +
        'für Schlitz, PH/PZ und Plus-Minus-Schrauben an LS-Schaltern, RCDs und Reihenklemmen.',
      baustellenTipp: 'Anzugsmoment immer aus dem Datenblatt bzw. vom Gerät ablesen (bei LS-Schaltern oft 2,0–2,5 Nm, ' +
        'bei Reihenklemmen 2,5 mm² oft 0,5–0,8 Nm). Klicken = fertig. Nicht nachziehen "zur Sicherheit".',
      typicalMistake: 'Nach Gefühl anziehen. Zu locker = Übergangswiderstand, Lichtbogen, Brand im Verteiler. ' +
        'Zu fest = Klemmkörper verformt, feindrähtige Leiter abgequetscht.'
    },
    {
      id: 'schaltschrank_schluessel',
      name: 'Universal-Schaltschrankschlüssel',
      category: 'montage',
      norm: 'Doppelbart · Vierkant · Dreikant',
      iconSvg: SVG_OPEN +
        '<path d="M32 32 L32 8"/>' +
        '<path d="M32 32 L53 44"/>' +
        '<path d="M32 32 L11 44"/>' +
        '<circle cx="32" cy="32" r="5"/>' +
        '<rect x="28" y="4" width="8" height="8"/>' +
        '<polygon points="53,38 58,47 48,47"/>' +
        '<path d="M8 41 L8 47 M11 41 L11 47 M14 41 L14 47" stroke-width="2"/>' +
        SVG_CLOSE,
      description: 'Sternförmiger Schlüssel mit den gängigsten Profilen für Schaltschränke, Zählerschränke, ' +
        'Hausanschlusskästen und Verteiler: Doppelbart (3–5 mm), Vierkant (5–8 mm), Dreikant (7–9 mm).',
      baustellenTipp: 'Gehört an den Gürtel oder in die Hosentasche, nicht in die Kiste im Transporter. Viele ' +
        'Schlüssel haben zusätzlich einen 1/4"-Bit-Halter – damit spart man sich bei Kleinverteilern den Schraubendreher.',
      typicalMistake: 'Schranktüren mit Kombizange oder Schraubendreher aufwürgen. Das ruiniert Schlösser, die ' +
        'IP-Schutzart (Dichtung) – und beim Kunden den ersten Eindruck.'
    },
    {
      id: 'kati_blitz',
      name: 'Kati Blitz – Glasfaser-Einziehsystem 20–30 m',
      category: 'montage',
      norm: 'Einziehband Ø 4–6 mm',
      iconSvg: SVG_OPEN +
        '<circle cx="22" cy="34" r="16"/>' +
        '<circle cx="22" cy="34" r="10"/>' +
        '<circle cx="22" cy="34" r="3"/>' +
        '<path d="M38 34 C46 34 46 18 54 18 L60 18"/>' +
        '<circle cx="60" cy="18" r="2.5"/>' +
        '<path d="M14 52 L30 52 L30 58 L14 58 Z"/>' +
        SVG_CLOSE,
      description: 'Glasfaserverstärktes Einziehband in einer Abrolltrommel mit Führungsfeder und Ziehöse. ' +
        'Steif genug zum Schieben, flexibel genug für Bögen in Leerrohren und Kabelkanälen.',
      baustellenTipp: 'Leitungen versetzt (gestaffelt) an der Öse befestigen und mit Isolierband zu einer schlanken ' +
        'Spitze wickeln. Gleitmittel bei langen Strecken hilft. Zu zweit arbeiten: einer schiebt nach, einer zieht.',
      typicalMistake: 'Mit Draht oder einer Leitung "durchstochern". Das bleibt im ersten Bogen hängen – und ' +
        'Stahldraht kann im Rohr bestehende Leitungen beschädigen.'
    },
    {
      id: 'stromzange',
      name: 'True-RMS Digitalmultimeter & AC/DC-Stromzange',
      category: 'messen',
      norm: 'CAT III 600 V',
      iconSvg: SVG_OPEN +
        '<path d="M20 26 C10 22 10 6 24 6 L40 6 C54 6 54 22 44 26"/>' +
        '<path d="M32 6 L32 14" stroke-width="2"/>' +
        '<rect x="18" y="26" width="28" height="32" rx="5"/>' +
        '<rect x="23" y="31" width="18" height="10" rx="1.5"/>' +
        '<circle cx="32" cy="50" r="4"/>' +
        SVG_CLOSE,
      description: 'Misst Wechsel- und Gleichstrom berührungslos über die Zange sowie Spannung, Widerstand und ' +
        'Durchgang. True RMS liefert auch bei verzerrten Strömen (LED-Treiber, FU, Netzteile) den richtigen Effektivwert.',
      baustellenTipp: 'Immer nur EINEN Leiter umfassen. Um die ganze Mantelleitung zangt man ~0 A – praktisch zur ' +
        'Fehlerstromsuche: Zeigt die Zange um L+N einen Wert, fließt Strom über PE ab.',
      typicalMistake: 'Die Spannungsmessung mit Messleitungen in der Strom-Buchse machen (Sicherungsauslösung, ' +
        'Lichtbogen) oder ein CAT-II-Gerät am Hausanschluss einsetzen – dort ist mindestens CAT IV gefordert.'
    },
    {
      id: 'mauernutfraese',
      name: 'Mauernutfräse mit 2 Diamantscheiben',
      category: 'montage',
      norm: 'Absaugung Staubklasse M',
      iconSvg: SVG_OPEN +
        '<rect x="8" y="16" width="34" height="20" rx="4"/>' +
        '<circle cx="22" cy="44" r="10"/>' +
        '<circle cx="28" cy="44" r="10" opacity="0.6"/>' +
        '<path d="M42 22 L54 22 L58 28"/>' +
        '<path d="M42 30 L56 30"/>' +
        '<path d="M2 58 L62 58" stroke-width="2"/>' +
        '<path d="M18 58 L18 54 L32 54 L32 58" stroke-width="2"/>' +
        SVG_CLOSE,
      description: 'Schneidet mit zwei parallelen Diamantscheiben in einem Arbeitsgang beide Flanken einer ' +
        'Leitungsnut. Schnitttiefe und Nutbreite einstellbar, Absaugstutzen für einen Bausauger.',
      baustellenTipp: 'Nur mit Sauger der Staubklasse M (besser H) arbeiten – Quarzstaub ist krebserregend. Den Steg ' +
        'zwischen den Schnitten mit dem Ausbrechwerkzeug oder Stemmhammer entfernen. Installationszonen nach DIN 18015-3 einhalten!',
      typicalMistake: 'Schräg oder diagonal schlitzen und außerhalb der Installationszonen fräsen – der nächste ' +
        'Handwerker bohrt dann genau in die Leitung. Außerdem: ohne Absaugung = Bußgeldgefahr und Gesundheitsschaden.'
    }
  ];

  const QUIZ_QUESTIONS = [
    {
      id: 'tq1',
      scenario: 'Hausinstallation, Unterverteilung',
      question: 'Du sollst eine Zuleitung NYM-J 5×2,5 mm² auf 20 cm abmanteln, ohne die Aderisolierung zu ritzen. Womit arbeitest du?',
      options: ['jokari', 'abisolierer', 'mauernutfraese', 'aderendhuelsen_zange'],
      correct: 'jokari',
      explanation: 'Der Jokari-Abmantler schneidet mit einstellbarer Klingentiefe nur den Außenmantel – Rundschnitt ' +
        'durch Drehen, dann Längsschnitt oder Abziehen.',
      praxis: 'Eine angeritzte Ader fällt bei der Isolationswiderstandsmessung (≥ 1 MΩ bei 500 V DC) auf – oder ' +
        'erst Jahre später als RCD-Auslösung beim Kunden. Die Abisolierzange ist erst für die Einzeladern danach dran.'
    },
    {
      id: 'tq2',
      scenario: 'Schaltschrankbau',
      question: 'Feindrähtige H07V-K-Leiter sollen teils in WAGO-Hebelklemmen, teils in Schraubklemmen am Gerät angeschlossen werden. Welches Werkzeug brauchst du für eine dauerhaft sichere Verbindung an den Schraubklemmen?',
      options: ['aderendhuelsen_zange', 'kabelschuh_presse', 'jokari', 'drehmoment_vde'],
      correct: 'aderendhuelsen_zange',
      explanation: 'In Schraubklemmen spleißen feine Litzen unter der Schraube auf und werden abgeschert. Eine nach ' +
        'DIN 46228 verpresste Aderendhülse bündelt alle Einzeldrähte.',
      praxis: 'WAGO-221-Hebelklemmen sind für feindrähtige Leiter ohne Hülse zugelassen – bei Schraubklemmen ' +
        'gehört die Hülse dazu. Immer passende Hülse zum Querschnitt und eine Crimpzange mit Zwangssperre verwenden.'
    },
    {
      id: 'tq3',
      scenario: '5 Sicherheitsregeln – Regel 3',
      question: 'Du hast freigeschaltet und gegen Wiedereinschalten gesichert. Jetzt musst du die Spannungsfreiheit allpolig feststellen. Welches Gerät ist zulässig?',
      options: ['duspol', 'stromzange', 'drehmoment_vde', 'abisolierer'],
      correct: 'duspol',
      explanation: 'Spannungsfreiheit stellt man mit einem zweipoligen Spannungsprüfer nach DIN EN 61243-3 fest – ' +
        'allpolig: Außenleiter untereinander, gegen N und gegen PE.',
      praxis: 'Kein einpoliger Phasenprüfer! Der zeigt bei isoliertem Standort nichts an. Den Duspol vorher und ' +
        'nachher an einer bekannten Spannungsquelle testen – sonst prüfst du mit einem defekten Gerät.'
    },
    {
      id: 'tq4',
      scenario: 'Zählerschrank / Verteilerbau',
      question: 'Im Verteiler sollen Reihenklemmen und Leitungsschutzschalter fachgerecht nach Herstellerangabe angezogen werden. Welches Werkzeug nimmst du?',
      options: ['drehmoment_vde', 'schaltschrank_schluessel', 'kabelschuh_presse', 'duspol'],
      correct: 'drehmoment_vde',
      explanation: 'Der VDE-Drehmomentschraubendreher begrenzt das Anzugsmoment exakt auf den eingestellten Wert ' +
        '(z. B. 2,5 Nm am LS-Schalter laut Datenblatt).',
      praxis: 'Lose Klemmen sind eine der häufigsten Brandursachen in Verteilern. Viele Hersteller fordern das ' +
        'Drehmoment ausdrücklich – bei der Abnahme oder einem Schadensfall musst du es nachweisen können.'
    },
    {
      id: 'tq5',
      scenario: 'Hauptverteilung, TN-C-System',
      question: 'Ein 35-mm²-Kupferleiter soll auf die PEN-Sammelschiene angeschlossen werden. Wie stellst du die Verbindung her?',
      options: ['kabelschuh_presse', 'aderendhuelsen_zange', 'abisolierer', 'stromzange'],
      correct: 'kabelschuh_presse',
      explanation: 'Rohrkabelschuh nach DIN 46235 für 35 mm² Cu, verpresst mit Sechskant-Einsatz der passenden Größe – ' +
        'dann mit Schraube auf die Schiene.',
      praxis: 'Gerade am PEN ist eine schlechte Verbindung gefährlich: Ein PEN-Bruch kann Körper unter Spannung ' +
        'setzen und Geräte durch Sternpunktverschiebung zerstören. Querschnitt auf Schuh, Leiter und Einsatz abgleichen!'
    },
    {
      id: 'tq6',
      scenario: 'Neubau, Unterputz-Installation',
      question: 'Ein 15 m langes Leerrohr M25 mit 3 Bögen soll mit Leitungen belegt werden. Welches Hilfsmittel nimmst du?',
      options: ['kati_blitz', 'mauernutfraese', 'jokari', 'schaltschrank_schluessel'],
      correct: 'kati_blitz',
      explanation: 'Das glasfaserverstärkte Einziehband (Kati Blitz) lässt sich durch mehrere Bögen schieben, ' +
        'danach werden die Leitungen an der Ziehöse befestigt und eingezogen.',
      praxis: 'Leitungen gestaffelt anbinden und schlank abkleben, damit sie in den Bögen nicht hängen bleiben. ' +
        'Bei vielen Bögen auf langen Strecken lieber eine Zwischendose als Zugstelle einplanen.'
    }
  ];

  const CATEGORIES = [
    { id: 'alle', label: 'Alle', icon: '🧰' },
    { id: 'kabel', label: 'Kabel & Leiter', icon: '🔌' },
    { id: 'messen', label: 'Messen & Prüfen', icon: '📟' },
    { id: 'montage', label: 'Montage', icon: '🔧' }
  ];

  const CATEGORY_COLORS = {
    kabel: 'var(--accent-amber)',
    messen: 'var(--accent-blue)',
    montage: 'var(--accent-emerald)'
  };

  let guideState = {
    filter: 'alle',
    openId: null
  };

  let quizState = {
    index: 0,
    score: 0,
    answered: false,
    selected: null,
    shuffledOptions: [],
    order: []
  };

  function getTool(id) {
    return TOOLS.find(t => t.id === id);
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }

  // Modul-eigene Styles einmalig einhängen (nutzt die CSS-Variablen aus styles.css)
  function injectStyles() {
    if (document.getElementById('elektro-tools-styles')) return;
    const style = document.createElement('style');
    style.id = 'elektro-tools-styles';
    style.textContent = `
      .et-filter-row { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:16px; }
      .et-pill { background:var(--bg-card); color:var(--text-muted); border:1px solid var(--border);
        border-radius:999px; padding:8px 14px; font-size:0.9rem; cursor:pointer; }
      .et-pill.active { background:var(--accent-blue); color:#0b0f17; border-color:var(--accent-blue); font-weight:600; }
      .et-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:12px; }
      .et-card { background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius);
        padding:16px; cursor:pointer; transition:background 0.15s, border-color 0.15s; }
      .et-card:hover { background:var(--bg-card-hover); }
      .et-card.open { border-color:var(--accent-blue); }
      .et-card-head { display:flex; gap:12px; align-items:flex-start; }
      .et-icon { flex-shrink:0; width:56px; height:56px; border-radius:12px; display:flex;
        align-items:center; justify-content:center; background:rgba(255,255,255,0.04); }
      .et-name { font-weight:700; color:var(--text-main); margin:0 0 6px; font-size:1rem; line-height:1.3; }
      .et-badge { display:inline-block; font-size:0.72rem; padding:3px 8px; border-radius:6px;
        border:1px solid currentColor; font-weight:600; }
      .et-desc { color:var(--text-muted); font-size:0.9rem; line-height:1.5; margin:12px 0 0; }
      .et-toggle-hint { color:var(--accent-blue); font-size:0.82rem; margin-top:10px; }
      .et-details { margin-top:12px; display:grid; gap:10px; }
      .et-box { border-radius:10px; padding:10px 12px; font-size:0.88rem; line-height:1.5; color:var(--text-main); }
      .et-box strong { display:block; margin-bottom:4px; }
      .et-tip { background:rgba(16,185,129,0.1); border-left:3px solid var(--accent-emerald); }
      .et-mistake { background:rgba(239,68,68,0.1); border-left:3px solid var(--accent-red); }
      .et-quiz-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;
        color:var(--text-muted); font-size:0.9rem; }
      .et-score { color:var(--accent-amber); font-weight:700; }
      .et-progress { height:6px; background:var(--border); border-radius:3px; overflow:hidden; margin-bottom:16px; }
      .et-progress-bar { height:100%; background:var(--accent-blue); transition:width 0.3s; }
      .et-scenario { font-size:0.8rem; color:var(--accent-purple); text-transform:uppercase; letter-spacing:0.05em; }
      .et-question { color:var(--text-main); font-size:1.05rem; line-height:1.5; margin:6px 0 16px; }
      .et-options { display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:10px; }
      .et-option { display:flex; align-items:center; gap:10px; text-align:left; background:var(--bg-card);
        border:1px solid var(--border); border-radius:12px; padding:10px; color:var(--text-main);
        cursor:pointer; font-size:0.9rem; }
      .et-option:hover:not(:disabled) { background:var(--bg-card-hover); }
      .et-option:disabled { cursor:default; }
      .et-option.correct { border-color:var(--accent-emerald); background:rgba(16,185,129,0.15); }
      .et-option.wrong { border-color:var(--accent-red); background:rgba(239,68,68,0.15); }
      .et-option svg { width:36px; height:36px; flex-shrink:0; color:var(--accent-blue); }
      .et-feedback { margin-top:16px; }
      .et-result { text-align:center; padding:24px 12px; }
      .et-result-big { font-size:2.4rem; font-weight:800; color:var(--accent-amber); margin:8px 0; }
      .et-actions { display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin-top:16px; }
    `;
    document.head.appendChild(style);
  }

  // --------------------------------------------------------------------------
  // Werkzeug-Guide
  // --------------------------------------------------------------------------
  function renderToolsGuide(containerEl) {
    if (!containerEl) return;
    injectStyles();

    const visible = guideState.filter === 'alle'
      ? TOOLS
      : TOOLS.filter(t => t.category === guideState.filter);

    const filterHtml = CATEGORIES.map(c => `
      <button class="et-pill ${guideState.filter === c.id ? 'active' : ''}" data-et-filter="${c.id}">
        ${c.icon} ${c.label}
      </button>`).join('');

    const cardsHtml = visible.map(tool => {
      const isOpen = guideState.openId === tool.id;
      const color = CATEGORY_COLORS[tool.category] || 'var(--accent-blue)';
      return `
        <div class="et-card ${isOpen ? 'open' : ''}" data-et-tool="${tool.id}" role="button" tabindex="0" aria-expanded="${isOpen}">
          <div class="et-card-head">
            <div class="et-icon" style="color:${color};">${tool.iconSvg}</div>
            <div>
              <h4 class="et-name">${tool.name}</h4>
              <span class="et-badge" style="color:${color};">${tool.norm}</span>
            </div>
          </div>
          <p class="et-desc">${tool.description}</p>
          ${isOpen ? `
            <div class="et-details">
              <div class="et-box et-tip"><strong>💡 Profi-Tipp von der Baustelle</strong>${tool.baustellenTipp}</div>
              <div class="et-box et-mistake"><strong>⚠️ Typischer Azubi-Fehler</strong>${tool.typicalMistake}</div>
            </div>` : `<div class="et-toggle-hint">▸ Antippen für Profi-Tipp & typischen Fehler</div>`}
        </div>`;
    }).join('');

    containerEl.innerHTML = `
      <div class="et-guide">
        <div class="et-filter-row">${filterHtml}</div>
        <div class="et-grid">${cardsHtml}</div>
      </div>`;

    containerEl.querySelectorAll('[data-et-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        guideState.filter = btn.getAttribute('data-et-filter');
        guideState.openId = null;
        renderToolsGuide(containerEl);
      });
    });

    containerEl.querySelectorAll('[data-et-tool]').forEach(card => {
      const toggle = () => {
        const id = card.getAttribute('data-et-tool');
        guideState.openId = guideState.openId === id ? null : id;
        renderToolsGuide(containerEl);
      };
      card.addEventListener('click', toggle);
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      });
    });
  }

  // --------------------------------------------------------------------------
  // Werkzeug-Quiz
  // --------------------------------------------------------------------------
  function prepareQuestion() {
    const q = QUIZ_QUESTIONS[quizState.order[quizState.index]];
    quizState.shuffledOptions = shuffle(q.options);
    quizState.answered = false;
    quizState.selected = null;
  }

  function resetQuiz() {
    quizState.index = 0;
    quizState.score = 0;
    quizState.order = shuffle(QUIZ_QUESTIONS.map((_, i) => i));
    prepareQuestion();
  }

  function renderToolQuiz(containerEl) {
    if (!containerEl) return;
    injectStyles();
    if (!quizState.order.length) resetQuiz();

    const total = QUIZ_QUESTIONS.length;

    // Ergebnis-Screen
    if (quizState.index >= total) {
      const pct = Math.round((quizState.score / total) * 100);
      const verdict = pct === 100 ? '🏆 Werkzeug-Profi! Der Obermonteur gibt dir die Kiste.'
        : pct >= 67 ? '💪 Solide – noch ein, zwei Werkzeuge im Guide nachlesen.'
        : '📚 Ab in den Werkzeug-Guide – die Prüfung fragt genau das ab.';
      containerEl.innerHTML = `
        <div class="et-result">
          <div style="color:var(--text-muted);">Werkzeug-Quiz abgeschlossen</div>
          <div class="et-result-big">${quizState.score} / ${total}</div>
          <div style="color:var(--text-main);">${verdict}</div>
          <div class="et-actions">
            <button class="btn-primary" data-et-action="restart">🔄 Nochmal spielen</button>
          </div>
        </div>`;
      containerEl.querySelector('[data-et-action="restart"]').addEventListener('click', () => {
        resetQuiz();
        renderToolQuiz(containerEl);
      });
      return;
    }

    const q = QUIZ_QUESTIONS[quizState.order[quizState.index]];
    const progress = Math.round((quizState.index / total) * 100);

    const optionsHtml = quizState.shuffledOptions.map(toolId => {
      const tool = getTool(toolId);
      let cls = 'et-option';
      if (quizState.answered) {
        if (toolId === q.correct) cls += ' correct';
        else if (toolId === quizState.selected) cls += ' wrong';
      }
      return `
        <button class="${cls}" data-et-answer="${toolId}" ${quizState.answered ? 'disabled' : ''}>
          ${tool.iconSvg}
          <span>${tool.name}</span>
        </button>`;
    }).join('');

    let feedbackHtml = '';
    if (quizState.answered) {
      const isCorrect = quizState.selected === q.correct;
      const correctTool = getTool(q.correct);
      feedbackHtml = `
        <div class="et-feedback">
          <div class="et-box ${isCorrect ? 'et-tip' : 'et-mistake'}">
            <strong>${isCorrect ? '✅ Richtig! +10 XP' : `❌ Leider falsch – richtig ist: ${correctTool.name}`}</strong>
            ${q.explanation}
          </div>
          <div class="et-box" style="background:rgba(56,189,248,0.08); border-left:3px solid var(--accent-blue); margin-top:10px;">
            <strong>🏗️ Praxisbezug</strong>${q.praxis}
          </div>
          <button class="btn-primary btn-sm" style="margin-top:12px;" data-et-action="next">
            ${quizState.index + 1 < total ? 'Nächstes Szenario ➜' : 'Auswertung anzeigen 🏁'}
          </button>
        </div>`;
    }

    containerEl.innerHTML = `
      <div class="et-quiz">
        <div class="et-quiz-head">
          <span>Szenario ${quizState.index + 1} von ${total}</span>
          <span class="et-score">⭐ ${quizState.score} Punkte</span>
        </div>
        <div class="et-progress"><div class="et-progress-bar" style="width:${progress}%;"></div></div>
        <div class="et-scenario">${q.scenario}</div>
        <p class="et-question">${q.question}</p>
        <div class="et-options">${optionsHtml}</div>
        ${feedbackHtml}
      </div>`;

    containerEl.querySelectorAll('[data-et-answer]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (quizState.answered) return;
        quizState.selected = btn.getAttribute('data-et-answer');
        quizState.answered = true;
        if (quizState.selected === q.correct) {
          quizState.score++;
          if (window.ElektroApp && window.ElektroApp.addXp) {
            window.ElektroApp.addXp(10);
          }
        }
        renderToolQuiz(containerEl);
      });
    });

    const nextBtn = containerEl.querySelector('[data-et-action="next"]');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        quizState.index++;
        if (quizState.index < total) prepareQuestion();
        renderToolQuiz(containerEl);
      });
    }
  }

  return {
    TOOLS,
    QUIZ_QUESTIONS,
    CATEGORIES,
    renderToolsGuide,
    renderToolQuiz,
    resetQuiz
  };
})();
