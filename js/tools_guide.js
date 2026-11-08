// ============================================================================
// ElektroCoach PRO – Werkzeug-Guide & Werkzeug-Quiz
// 1. TOOLS: 10 Elektro-Werkzeuge + 4 VDE-Messgeräte-Steckbriefe (V5: Detail-SVG & Einstell-Tabelle)
// 2. QUIZ_QUESTIONS: 6 Werkzeug-Szenarien + 6 Messgeräte-Einstell-Szenarien (V5: Text-Antworten)
// 3. renderToolsGuide(containerEl | id) rendert Guide + Quiz / renderToolQuiz(containerEl)
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
    },

    // ------------------------------------------------------------------------
    // V5: Messgeräte-Steckbriefe (große Karten mit Detail-SVG & Einstell-Tabelle)
    // ------------------------------------------------------------------------
    {
      id: 'vde_tester',
      name: 'VDE-Installationstester (R_LO, R_ISO, Z_I, Z_S, RCD)',
      category: 'pruefen',
      norm: 'DIN VDE 0100-600 · DIN EN 61557 · CAT IV 300 V',
      wide: true,
      iconSvg: SVG_OPEN +
        '<rect x="8" y="6" width="48" height="52" rx="6"/>' +
        '<rect x="14" y="12" width="36" height="12" rx="2"/>' +
        '<circle cx="32" cy="40" r="10"/>' +
        '<path d="M32 40 L38 34"/>' +
        '<circle cx="16" cy="52" r="2"/><circle cx="32" cy="52" r="2" opacity="0"/><circle cx="48" cy="52" r="2"/>' +
        SVG_CLOSE,
      detailSvg: vdeTesterSvg(),
      description: 'Das Prüfgerät für die Erstprüfung nach DIN VDE 0100-600. Ein Drehschalter wählt die Messfunktion: ' +
        'R_LO (Schutzleiter, spannungsfrei), R_ISO (Isolation, spannungsfrei), Z_I (L–N) und Z_S (L–PE) unter Spannung, ' +
        'RCD-Prüfung (U_B, t_A, I_A) sowie Spannung/Drehfeld. Vor R_LO werden die Messleitungen per ZERO/R_komp kompensiert.',
      settings: [
        ['R_LO', 'Spannungsfrei! · Prüfstrom ≥ 200 mA DC, U_0 4–24 V · ± Umpolung · vorher Spitzen kurzschließen → ZERO (R_komp) · PE-Schiene ↔ jeder Schutzkontakt/Körper', '≤ 0,3 Ω (max. 1 Ω)'],
        ['R_ISO', 'Spannungsfrei! · 500 V DC (SELV/PELV 250 V) · Verbraucher ab oder L1–L3 + N brücken → gemeinsam gegen PE · SPD abklemmen', '≥ 1,0 MΩ (SELV ≥ 0,5 MΩ)'],
        ['Z_I', 'Unter 230 V · Messung L–N an der letzten Steckdose · liefert I_k = U_0 / Z_I und Spannungsfall', 'plausibel, I_k ≥ I_a'],
        ['Z_S', 'Unter 230 V · Messung L–PE · hinter RCD: Modus „No-Trip“ (< 15 mA / DC-Vormagnetisierung)', '≤ 2/3 · U_0 / I_a (B16: 1,91 Ω)'],
        ['RCD', 'Unter 230 V · I_ΔN einstellen (30 mA), Typ A/B · Messung U_B → t_A bei 1× und 5× → Rampe I_A', 'U_B ≤ 50 V · 300 ms / 40 ms · I_A 15–30 mA']
      ],
      baustellenTipp: 'Reihenfolge strikt einhalten: R_LO → R_ISO (beide spannungsfrei) → Z_S/Z_I → RCD → Drehfeld. ' +
        'Messwerte direkt im Gerät speichern und dem Stromkreis zuordnen – das spart abends das Protokoll-Abtippen.',
      typicalMistake: 'R_LO ohne Nullabgleich messen (0,2 Ω Messleitung wird jedem Wert zugeschlagen) oder die RCD-Prüfung ' +
        'vor der R_LO-Messung starten – bei unterbrochenem PE liegen dann 230 V an allen Gehäusen.'
    },
    {
      id: 'multimeter_trms',
      name: 'Digital-Multimeter True RMS (Buchsen 10 A / mA / COM / V/Ω)',
      category: 'pruefen',
      norm: 'DIN EN 61010-1 · CAT III 1000 V / CAT IV 600 V',
      wide: true,
      iconSvg: SVG_OPEN +
        '<rect x="14" y="4" width="36" height="56" rx="6"/>' +
        '<rect x="19" y="9" width="26" height="12" rx="2"/>' +
        '<circle cx="32" cy="34" r="7"/>' +
        '<path d="M32 34 L32 28"/>' +
        '<circle cx="20" cy="52" r="2.5"/><circle cx="28" cy="52" r="2.5"/><circle cx="36" cy="52" r="2.5"/><circle cx="44" cy="52" r="2.5"/>' +
        SVG_CLOSE,
      detailSvg: multimeterSvg(),
      description: 'Universal-Messgerät für Spannung, Strom, Widerstand und Durchgang. Entscheidend sind Drehschalter UND ' +
        'Buchse: Spannung über COM + V/Ω (parallel, R_i ≈ 10 MΩ), Strom über COM + 10 A bzw. mA (in Reihe, R_i ≈ 0,01 Ω). ' +
        'True RMS misst auch bei LED-Treibern, Dimmern und FU den echten Effektivwert.',
      settings: [
        ['Spannung V~ / V=', 'Buchsen COM + V/Ω · parallel zum Verbraucher · hochohmig (≈ 10 MΩ)', 'kein Kurzschluss möglich'],
        ['Strom A~ / A=', 'Buchsen COM + 10 A (bzw. mA bis ca. 400 mA) · Stromkreis auftrennen · in Reihe', 'niederohmig (≈ 0,01 Ω)'],
        ['Widerstand Ω / Durchgang', 'Buchsen COM + V/Ω · NUR spannungsfrei messen · Messleitungen vorher kurzschließen (≈ 0,2 Ω)', 'Messstrom nur ≈ 1 mA'],
        ['True RMS', 'Bei Schaltnetzteilen, LED, Dimmer, FU zwingend – Mittelwert-Geräte zeigen 30–50 % zu wenig', 'Aufdruck „TRMS“']
      ],
      baustellenTipp: 'Nach jeder Strommessung SOFORT die rote Leitung zurück in V/Ω stecken. Für Ströme im Betrieb lieber ' +
        'die Stromzange nehmen – dann muss der Stromkreis gar nicht aufgetrennt werden.',
      typicalMistake: '„10-A-Falle“: Leitung steckt noch in 10 A, Drehschalter auf V~, Spitzen in die Steckdose → satter ' +
        'Kurzschluss über den Shunt. Feinsicherung brennt, Billiggeräte ohne CAT-Schutz können explodieren.'
    },
    {
      id: 'oszilloskop',
      name: 'Zweikanal-Digital-Oszilloskop (DSO) mit 10:1-Tastkopf',
      category: 'pruefen',
      norm: 'DIN EN 61010-031 (Tastköpfe) · Masse = PE!',
      wide: true,
      iconSvg: SVG_OPEN +
        '<rect x="4" y="10" width="56" height="42" rx="4"/>' +
        '<rect x="9" y="15" width="32" height="26" rx="1.5"/>' +
        '<path d="M10 28 C14 18 18 18 22 28 C26 38 30 38 34 28 C36 23 38 21 40 22" stroke-width="2"/>' +
        '<circle cx="50" cy="22" r="4"/><circle cx="50" cy="36" r="4"/>' +
        SVG_CLOSE,
      detailSvg: oszilloskopSvg(),
      description: 'Macht den Spannungsverlauf über der Zeit sichtbar. Vertikal: Volt/Div (Ablenkkoeffizient), horizontal: ' +
        'Time/Div (Zeitbasis). Der Trigger (Level + Flanke) sorgt für ein stehendes Bild. Kopplung DC (alles), AC (nur ' +
        'Wechselanteil) oder GND (Nulllinie). Der 10:1-Tastkopf teilt die Spannung durch 10 und hebt R_E auf 10 MΩ.',
      settings: [
        ['Periodendauer T', 'Kästchen horizontal × Time/Div · z. B. 4 Div × 5 ms = 20 ms', 'f = 1 / T = 50 Hz'],
        ['Scheitelwert Û', 'Kästchen Nulllinie → Spitze × Volt/Div · z. B. 3,25 × 100 V = 325 V', 'U_eff = Û / √2 = 230 V'],
        ['Trigger', 'Quelle CH1 · Level in den Kurvenbereich · Flanke steigend ↗ / fallend ↘', 'Bild steht still'],
        ['Kopplung', 'DC = Gleich- + Wechselanteil · AC = Koppel-C sperrt DC (Brummspannung) · GND = Nulllinie', ''],
        ['Tastkopf', '10:1 → Anzeige × 10 (falls nicht automatisch) · R_E = 10 MΩ · 1:1 → R_E = 1 MΩ', 'Abgleich am Kalibrator']
      ],
      baustellenTipp: 'Netzspannungen nur mit Differenztastkopf oder einem isolierten, batteriebetriebenen Handheld-Oszi ' +
        '(CAT III) messen. Den 10:1-Tastkopf vorher am Kalibrier-Rechteck des Geräts abgleichen (Trimmer).',
      typicalMistake: 'Die schwarze Krokodil-Masseklemme an L klemmen: Sie ist beim Tisch-Oszi über das Netzkabel mit PE ' +
        'verbunden → direkter Erdschluss, Lichtbogen, RCD/LS fliegt. Niemals den Schutzleiter des Oszis „abkleben“!'
    },
    {
      id: 'pruefprotokoll',
      name: 'VDE-Prüfprotokoll (DIN VDE 0100-600) – Grenzwert-Spicker',
      category: 'pruefen',
      norm: 'DIN VDE 0100-600 · ZVEH-Formular',
      wide: true,
      iconSvg: SVG_OPEN +
        '<path d="M14 4 L42 4 L52 14 L52 60 L14 60 Z"/>' +
        '<path d="M42 4 L42 14 L52 14"/>' +
        '<path d="M20 24 L46 24 M20 32 L46 32 M20 40 L46 40 M20 48 L36 48" stroke-width="2"/>' +
        '<path d="M38 50 L42 54 L50 44" stroke-width="2.5"/>' +
        SVG_CLOSE,
      detailSvg: protokollSvg(),
      description: 'Ohne Protokoll keine Übergabe: Für jeden Stromkreis werden Schutzorgan, Leitung, R_LO, R_ISO, Z_S/Z_I ' +
        'und die RCD-Werte eingetragen und mit dem Grenzwert verglichen. Der Prüfer unterschreibt – damit übernimmst du ' +
        'die Verantwortung für die Sicherheit der Anlage.',
      settings: [
        ['R_LO', 'Schutzleiter-/Potentialausgleichs-Durchgängigkeit', '≤ 0,3 Ω (Richtwert, max. 1 Ω)'],
        ['R_ISO', '500 V DC je Stromkreis (SELV/PELV 250 V DC)', '≥ 1,0 MΩ (SELV ≥ 0,5 MΩ)'],
        ['Z_S', 'Schleifenimpedanz L–PE, Messwert mit 2/3-Faktor', 'B16 ≤ 1,91 Ω · C16 ≤ 0,96 Ω'],
        ['RCD t_A', 'Auslösezeit bei 1 × I_ΔN / 5 × I_ΔN', '≤ 300 ms / ≤ 40 ms'],
        ['RCD I_A', 'Auslösestrom per Rampe', '0,5–1,0 · I_ΔN (15–30 mA)'],
        ['RCD U_B', 'Berührungsspannung bei I_ΔN', '≤ 50 V AC']
      ],
      baustellenTipp: 'Jeden Messwert sofort gegen den Grenzwert prüfen und auffällige Werte NICHT schönreden: ' +
        'Mangel eintragen, Stromkreis kennzeichnen, Kunden schriftlich informieren.',
      typicalMistake: 'Nur die Werte eintragen, ohne sie zu bewerten – z. B. R_ISO = 0,35 MΩ „abgehakt“. ' +
        'Im Schadensfall zählt genau dieses Protokoll vor Gericht.'
    }
  ];

  // --------------------------------------------------------------------------
  // Detail-SVGs der Messgeräte (viewBox 0 0 320 200, technischer Strichstil)
  // --------------------------------------------------------------------------
  function detailOpen(label) {
    return `<svg viewBox="0 0 320 200" class="et-detail-svg" role="img" aria-label="${label}" ` +
      'font-family="Consolas, \'Courier New\', monospace">';
  }

  function vdeTesterSvg() {
    const modes = ['OFF', 'U/f', 'R_LO', 'R_ISO', 'Z_I', 'Z_S', 'RCD'];
    const cx = 108, cy = 120, r = 30;
    const labels = modes.map((m, i) => {
      const a = (-200 + i * (220 / (modes.length - 1))) * Math.PI / 180;
      const x = cx + Math.cos(a) * (r + 22), y = cy + Math.sin(a) * (r + 22) + 4;
      const active = m === 'R_LO';
      return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" font-size="10" font-weight="700" fill="${active ? '#10b981' : '#94a3b8'}">${m}</text>`;
    }).join('');
    const ptr = (-200 + 2 * (220 / (modes.length - 1))) * Math.PI / 180;
    return detailOpen('VDE-Installationstester mit Drehschalter') +
      '<rect x="20" y="8" width="176" height="186" rx="14" fill="#1e293b" stroke="#f59e0b" stroke-width="2.5"/>' +
      '<rect x="34" y="20" width="148" height="46" rx="5" fill="#0b1220" stroke="#475569"/>' +
      '<text x="42" y="36" font-size="10" fill="#64748b">R_LO  ±  I=212 mA</text>' +
      '<text x="42" y="58" font-size="22" font-weight="800" fill="#34d399">0.18 Ω</text>' +
      '<text x="150" y="58" font-size="10" fill="#34d399">✓</text>' +
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#0f172a" stroke="#94a3b8" stroke-width="2.5"/>` +
      `<line x1="${cx}" y1="${cy}" x2="${(cx + Math.cos(ptr) * (r - 6)).toFixed(1)}" y2="${(cy + Math.sin(ptr) * (r - 6)).toFixed(1)}" stroke="#10b981" stroke-width="4" stroke-linecap="round"/>` +
      labels +
      '<rect x="38" y="160" width="52" height="22" rx="6" fill="#0f172a" stroke="#38bdf8"/>' +
      '<text x="64" y="175" text-anchor="middle" font-size="10" font-weight="700" fill="#38bdf8">ZERO</text>' +
      '<rect x="128" y="160" width="52" height="22" rx="6" fill="#065f46" stroke="#10b981"/>' +
      '<text x="154" y="175" text-anchor="middle" font-size="10" font-weight="700" fill="#d1fae5">TEST</text>' +
      // Buchsen & Messleitungen
      '<circle cx="216" cy="34" r="7" fill="#7f1d1d" stroke="#ef4444" stroke-width="2"/><text x="230" y="38" font-size="10" fill="#fca5a5">L</text>' +
      '<circle cx="216" cy="62" r="7" fill="#1e3a8a" stroke="#3b82f6" stroke-width="2"/><text x="230" y="66" font-size="10" fill="#93c5fd">N</text>' +
      '<circle cx="216" cy="90" r="7" fill="#365314" stroke="#84cc16" stroke-width="2"/><text x="230" y="94" font-size="10" fill="#bef264">PE</text>' +
      '<path d="M196 34 L209 34 M196 62 L209 62 M196 90 L209 90" stroke="#475569" stroke-width="2"/>' +
      '<text x="208" y="122" font-size="9.5" fill="#94a3b8">R_LO: PE-Schiene</text>' +
      '<text x="208" y="135" font-size="9.5" fill="#94a3b8">↔ Schutzkontakt</text>' +
      '<text x="208" y="152" font-size="9.5" fill="#fbbf24">1. ZERO drücken</text>' +
      '<text x="208" y="165" font-size="9.5" fill="#fbbf24">2. spannungsfrei!</text>' +
      '<text x="208" y="178" font-size="9.5" fill="#fbbf24">3. ± umpolen</text>' +
      '</svg>';
  }

  function multimeterSvg() {
    const modes = ['OFF', 'V~', 'V=', 'Ω', '•))', 'mA', 'A=', 'A~'];
    const cx = 100, cy = 106, r = 26;
    const labels = modes.map((m, i) => {
      const a = (-210 + i * (240 / (modes.length - 1))) * Math.PI / 180;
      const x = cx + Math.cos(a) * (r + 18), y = cy + Math.sin(a) * (r + 18) + 4;
      return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" font-size="10" font-weight="700" fill="${m === 'V~' ? '#10b981' : '#94a3b8'}">${m}</text>`;
    }).join('');
    const ptr = (-210 + 1 * (240 / (modes.length - 1))) * Math.PI / 180;
    const sock = (x, label, ring, txt) =>
      `<circle cx="${x}" cy="172" r="9" fill="#0b1220" stroke="${ring}" stroke-width="3"/>` +
      `<text x="${x}" y="192" text-anchor="middle" font-size="9" font-weight="700" fill="${txt}">${label}</text>`;
    return detailOpen('Digital-Multimeter mit Drehschalter und vier Buchsen') +
      '<rect x="36" y="6" width="128" height="190" rx="14" fill="#1e293b" stroke="#f59e0b" stroke-width="2.5"/>' +
      '<rect x="48" y="16" width="104" height="38" rx="4" fill="#0b1220" stroke="#475569"/>' +
      '<text x="56" y="28" font-size="8.5" fill="#64748b">TRMS  AUTO</text>' +
      '<text x="56" y="48" font-size="18" font-weight="800" fill="#34d399">230.4 V~</text>' +
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#0f172a" stroke="#94a3b8" stroke-width="2.5"/>` +
      `<line x1="${cx}" y1="${cy}" x2="${(cx + Math.cos(ptr) * (r - 5)).toFixed(1)}" y2="${(cy + Math.sin(ptr) * (r - 5)).toFixed(1)}" stroke="#10b981" stroke-width="4" stroke-linecap="round"/>` +
      labels +
      sock(58, '10A', '#ef4444', '#fca5a5') + sock(86, 'mA', '#ef4444', '#fca5a5') +
      sock(114, 'COM', '#64748b', '#cbd5e1') + sock(142, 'V/Ω', '#ef4444', '#fca5a5') +
      '<path d="M50 150 L56 158 L52 158 L58 166" stroke="#fbbf24" stroke-width="2" fill="none"/>' +
      // Mini-Schaltbilder: U parallel / I in Reihe
      '<text x="180" y="22" font-size="10" font-weight="700" fill="#10b981">U: parallel</text>' +
      '<path d="M182 34 L300 34 M182 74 L300 74" stroke="#94a3b8" stroke-width="2"/>' +
      '<rect x="230" y="44" width="20" height="20" fill="none" stroke="#cbd5e1" stroke-width="2"/>' +
      '<path d="M240 34 L240 44 M240 64 L240 74 M270 34 L270 44 M270 64 L270 74" stroke="#94a3b8" stroke-width="2"/>' +
      '<circle cx="270" cy="54" r="10" fill="#0f172a" stroke="#10b981" stroke-width="2"/><text x="270" y="58" text-anchor="middle" font-size="10" font-weight="800" fill="#10b981">V</text>' +
      '<text x="180" y="106" font-size="10" font-weight="700" fill="#38bdf8">I: in Reihe</text>' +
      '<path d="M182 118 L218 118 M242 118 L300 118 L300 158 L182 158" stroke="#94a3b8" stroke-width="2" fill="none"/>' +
      '<circle cx="230" cy="118" r="10" fill="#0f172a" stroke="#38bdf8" stroke-width="2"/><text x="230" y="122" text-anchor="middle" font-size="10" font-weight="800" fill="#38bdf8">A</text>' +
      '<rect x="262" y="108" width="20" height="20" fill="#131b2e" stroke="#cbd5e1" stroke-width="2"/>' +
      '<text x="180" y="180" font-size="9" fill="#fbbf24">⚠ 10A-Buchse + Steckdose</text>' +
      '<text x="180" y="192" font-size="9" fill="#fbbf24">= Kurzschluss über Shunt!</text>' +
      '</svg>';
  }

  function oszilloskopSvg() {
    const x0 = 20, y0 = 16, w = 200, h = 160, divX = w / 10, divY = h / 8;
    let grid = '';
    for (let i = 0; i <= 10; i++) grid += `<line x1="${x0 + i * divX}" y1="${y0}" x2="${x0 + i * divX}" y2="${y0 + h}" stroke="#1f3b2f" stroke-width="${i === 5 ? 1.4 : 0.8}"/>`;
    for (let j = 0; j <= 8; j++) grid += `<line x1="${x0}" y1="${y0 + j * divY}" x2="${x0 + w}" y2="${y0 + j * divY}" stroke="#1f3b2f" stroke-width="${j === 4 ? 1.4 : 0.8}"/>`;
    // Sinus: Periode = 4 Div, Amplitude = 3,25 Div
    const mid = y0 + 4 * divY, amp = 3.25 * divY;
    let d = '';
    for (let px = 0; px <= w; px += 2) {
      const y = mid - Math.sin((px / (4 * divX)) * 2 * Math.PI) * amp;
      d += (px === 0 ? 'M' : 'L') + (x0 + px).toFixed(1) + ' ' + y.toFixed(1) + ' ';
    }
    const peakX = x0 + divX; // Scheitel bei 1/4 Periode
    return detailOpen('Oszilloskop-Bildschirm mit Raster, Scheitelwert und Periodendauer') +
      `<rect x="${x0 - 8}" y="${y0 - 8}" width="${w + 16}" height="${h + 16}" rx="8" fill="#03140d" stroke="#475569" stroke-width="2"/>` +
      grid +
      `<path d="${d}" fill="none" stroke="#facc15" stroke-width="2.2"/>` +
      // Û-Pfeil
      `<line x1="${peakX}" y1="${mid}" x2="${peakX}" y2="${mid - amp}" stroke="#38bdf8" stroke-width="1.8"/>` +
      `<path d="M${peakX - 4} ${mid - amp + 6} L${peakX} ${mid - amp} L${peakX + 4} ${mid - amp + 6}" fill="none" stroke="#38bdf8" stroke-width="1.8"/>` +
      `<text x="${peakX + 6}" y="${mid - amp / 2}" font-size="11" font-weight="800" fill="#38bdf8">Û = 3,25 Div</text>` +
      // T-Pfeil
      `<line x1="${x0}" y1="${y0 + h - 10}" x2="${x0 + 4 * divX}" y2="${y0 + h - 10}" stroke="#f472b6" stroke-width="1.8"/>` +
      `<path d="M${x0 + 4 * divX - 6} ${y0 + h - 14} L${x0 + 4 * divX} ${y0 + h - 10} L${x0 + 4 * divX - 6} ${y0 + h - 6}" fill="none" stroke="#f472b6" stroke-width="1.8"/>` +
      `<text x="${x0 + 4}" y="${y0 + h - 14}" font-size="11" font-weight="800" fill="#f472b6">T = 4 Div</text>` +
      // Trigger-Marke
      `<path d="M${x0 + w + 2} ${mid - 0.5 * divY} l8 -5 l0 10 z" fill="#10b981"/>` +
      // Bedienfeld
      '<text x="240" y="24" font-size="10" font-weight="700" fill="#94a3b8">CH1 100 V/Div</text>' +
      '<text x="240" y="38" font-size="10" font-weight="700" fill="#94a3b8">5 ms/Div</text>' +
      '<text x="240" y="52" font-size="10" font-weight="700" fill="#10b981">Trig ↗ CH1</text>' +
      '<circle cx="256" cy="76" r="11" fill="#0f172a" stroke="#cbd5e1" stroke-width="2"/><text x="256" y="100" text-anchor="middle" font-size="8.5" fill="#94a3b8">V/Div</text>' +
      '<circle cx="292" cy="76" r="11" fill="#0f172a" stroke="#cbd5e1" stroke-width="2"/><text x="292" y="100" text-anchor="middle" font-size="8.5" fill="#94a3b8">T/Div</text>' +
      '<text x="240" y="122" font-size="9.5" fill="#cbd5e1">T = 4 · 5 ms = 20 ms</text>' +
      '<text x="240" y="135" font-size="9.5" fill="#cbd5e1">f = 1/T = 50 Hz</text>' +
      '<text x="240" y="148" font-size="9.5" fill="#cbd5e1">Û = 325 V → 230 V</text>' +
      '<text x="240" y="170" font-size="9.5" font-weight="800" fill="#fbbf24">⚠ Krokodil-</text>' +
      '<text x="240" y="183" font-size="9.5" font-weight="800" fill="#fbbf24">klemme = PE!</text>' +
      '</svg>';
  }

  function protokollSvg() {
    const rows = [
      ['R_LO', '≤ 0,3 Ω', '0,18 Ω', true],
      ['R_ISO', '≥ 1,0 MΩ', '0,35 MΩ', false],
      ['Z_S (B16)', '≤ 1,91 Ω', '0,85 Ω', true],
      ['RCD t_A 1×/5×', '≤ 300/40 ms', '24/12 ms', true],
      ['RCD I_A', '15–30 mA', '22 mA', true],
      ['RCD U_B', '≤ 50 V', '4,2 V', true]
    ];
    const body = rows.map((r, i) => {
      const y = 62 + i * 20;
      return `<line x1="30" y1="${y + 6}" x2="290" y2="${y + 6}" stroke="#cbd5e1" stroke-width="0.6"/>` +
        `<text x="36" y="${y}" font-size="10" font-weight="700" fill="#0f172a">${r[0]}</text>` +
        `<text x="128" y="${y}" font-size="10" fill="#334155">${r[1]}</text>` +
        `<text x="206" y="${y}" font-size="10" font-weight="700" fill="${r[3] ? '#047857' : '#b91c1c'}">${r[2]}</text>` +
        `<text x="272" y="${y}" font-size="12" font-weight="800" fill="${r[3] ? '#047857' : '#b91c1c'}">${r[3] ? '✓' : '✗'}</text>`;
    }).join('');
    return detailOpen('Prüfprotokoll nach DIN VDE 0100-600 mit Grenzwerten') +
      '<path d="M22 6 L272 6 L298 32 L298 196 L22 196 Z" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5"/>' +
      '<path d="M272 6 L272 32 L298 32" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1.5"/>' +
      '<text x="34" y="24" font-size="11" font-weight="800" fill="#0f172a">Prüfprotokoll DIN VDE 0100-600</text>' +
      '<text x="34" y="36" font-size="8.5" fill="#475569">Stromkreis 3 · Steckdosen Werkstatt · NYM-J 3×2,5</text>' +
      '<rect x="30" y="42" width="260" height="12" fill="#e2e8f0"/>' +
      '<text x="36" y="51" font-size="8.5" font-weight="700" fill="#475569">Messung</text>' +
      '<text x="128" y="51" font-size="8.5" font-weight="700" fill="#475569">Grenzwert</text>' +
      '<text x="206" y="51" font-size="8.5" font-weight="700" fill="#475569">Messwert</text>' +
      '<text x="264" y="51" font-size="8.5" font-weight="700" fill="#475569">i.O.</text>' +
      body +
      '<text x="36" y="186" font-size="9" fill="#b91c1c" font-weight="700">Mangel: R_ISO &lt; 1 MΩ → nicht freigeben!</text>' +
      '<path d="M210 186 C220 176 230 192 240 182 C246 176 252 188 262 182" fill="none" stroke="#1e3a8a" stroke-width="1.5"/>' +
      '</svg>';
  }

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
    },

    // V5: Messgeräte-Einstellungen (Text-Antworten statt Werkzeug-Auswahl)
    {
      id: 'tq7',
      type: 'text',
      tool: 'vde_tester',
      scenario: 'Erstprüfung Neubau – R_LO',
      question: 'Du hast neue 5-m-Messleitungen an den Installationstester gesteckt und willst R_LO messen. Was ist dein erster Handgriff?',
      options: [
        'Messspitzen kurzschließen und ZERO / R_komp drücken (Nullabgleich)',
        'Wahlschalter auf R_ISO 500 V stellen und einmal TEST drücken',
        'Prüfstrom auf 10 mA senken, damit die Messleitung nicht warm wird',
        'Den PE im Verteiler abklemmen, damit nichts parallel mitgemessen wird'
      ],
      correct: 'Messspitzen kurzschließen und ZERO / R_komp drücken (Nullabgleich)',
      explanation: 'Messleitungen haben selbst 0,1–0,3 Ω. Ohne Kompensation wird dieser Wert jedem Messergebnis ' +
        'zugeschlagen – bei Grenzwerten um 0,3 Ω fällt dann jede Steckdose durch.',
      praxis: 'Nach jedem Wechsel der Messleitung oder Verlängerung neu kompensieren. Der Prüfstrom bleibt ≥ 200 mA – ' +
        'mit Mini-Strom würden lose Klemmen unentdeckt bleiben.'
    },
    {
      id: 'tq8',
      type: 'text',
      tool: 'vde_tester',
      scenario: 'Altbau-Sanierung – R_ISO',
      question: 'Im Wohnzimmer-Stromkreis hängen ein LED-Dimmer und ein Smart-Home-Aktor, die nicht abgeklemmt werden können. Wie misst du R_ISO?',
      options: [
        'Spannungsfrei, L und N brücken und mit 500 V DC gemeinsam gegen PE messen',
        'Unter Spannung mit 250 V DC zwischen L und N messen, Geräte bleiben aktiv',
        'Mit 1000 V DC zwischen L und N messen, die Geräte vertragen das kurzzeitig',
        'Gar nicht – Stromkreise mit Elektronik sind von der R_ISO-Messung befreit'
      ],
      correct: 'Spannungsfrei, L und N brücken und mit 500 V DC gemeinsam gegen PE messen',
      explanation: 'Durch das Brücken liegen beide Seiten der Elektronik auf demselben Potenzial – sie bekommt keine ' +
        'Prüfspannung ab. Gemessen wird nur die Isolation der aktiven Leiter gegen PE (≥ 1,0 MΩ).',
      praxis: 'Brücken nach der Messung wieder entfernen und im Protokoll vermerken. SPD Typ 3 vorher abklemmen.'
    },
    {
      id: 'tq9',
      type: 'text',
      tool: 'multimeter_trms',
      scenario: 'Schaltschrank – Strommessung',
      question: 'Du sollst den Strom (ca. 2 A) eines 24-V-DC-Magnetventils mit dem Multimeter messen. Wie gehst du vor?',
      options: [
        'A= wählen, Leitung in COM + 10 A, Stromkreis auftrennen und Gerät in Reihe schalten',
        'V= wählen, Leitung in COM + V/Ω, Messspitzen parallel an das Magnetventil halten',
        'A= wählen, Leitung in COM + mA, Messspitzen parallel an das Magnetventil halten',
        'Ω wählen, Leitung in COM + V/Ω, das Ventil im laufenden Betrieb durchmessen'
      ],
      correct: 'A= wählen, Leitung in COM + 10 A, Stromkreis auftrennen und Gerät in Reihe schalten',
      explanation: 'Strom fließt DURCH das Messgerät – also in Reihe. 2 A sind zu viel für die mA-Buchse (meist max. ' +
        '400 mA), daher die 10-A-Buchse. Parallel an der Spannung wäre die Strombuchse ein Kurzschluss.',
      praxis: 'Nach der Messung sofort zurück in V/Ω stecken! Bequemer: DC-fähige Stromzange um eine Ader.'
    },
    {
      id: 'tq10',
      type: 'text',
      tool: 'oszilloskop',
      scenario: 'Elektronik-Labor – Zeitbasis',
      question: 'Am Oszilloskop steht Time/Div = 2 ms. Eine volle Periode des Signals ist 10 Kästchen breit. Welche Frequenz hat es?',
      options: ['50 Hz (T = 20 ms)', '500 Hz (T = 2 ms)', '5 Hz (T = 200 ms)', '100 Hz (T = 10 ms)'],
      correct: '50 Hz (T = 20 ms)',
      explanation: 'T = 10 Div · 2 ms/Div = 20 ms → f = 1 / 0,02 s = 50 Hz. Immer erst die Periodendauer aus ' +
        'Kästchen × Zeitbasis bestimmen, dann den Kehrwert bilden.',
      praxis: 'Für genaue Messungen die Zeitbasis so wählen, dass 1–2 Perioden den Schirm füllen – oder die ' +
        'Cursor-/Measure-Funktion des DSO nutzen.'
    },
    {
      id: 'tq11',
      type: 'text',
      tool: 'vde_tester',
      scenario: 'Kundendienst – RCD-Rampentest',
      question: 'Der Kunde klagt über sporadische FI-Auslösungen. Die Rampe ergibt I_A = 13 mA (RCD 30 mA), im Kreis hängen mehrere PCs. Was tust du als Nächstes?',
      options: [
        'Alle Verbraucher ausstecken und die Rampe erneut messen – Ableitströme verfälschen den Wert',
        'Den RCD sofort gegen einen 100-mA-Typ tauschen, damit er seltener auslöst',
        'Nichts – 13 mA zeigen, dass der RCD besonders sicher und schnell arbeitet',
        'Den RCD überbrücken und den Stromkreis nur noch über den LS absichern'
      ],
      correct: 'Alle Verbraucher ausstecken und die Rampe erneut messen – Ableitströme verfälschen den Wert',
      explanation: 'Ableitströme von Netzteilen fließen bereits über PE und addieren sich zum Prüfstrom. Erst ohne ' +
        'Verbraucher zeigt die Rampe den echten Auslösestrom. Liegt er dann immer noch < 15 mA, ist der RCD defekt.',
      praxis: 'Ein 100-mA-RCD oder Überbrücken ist lebensgefährlich – Personenschutz verlangt ≤ 30 mA. Bei vielen ' +
        'Ableitströmen Stromkreise auf mehrere RCDs aufteilen.'
    },
    {
      id: 'tq12',
      type: 'text',
      tool: 'pruefprotokoll',
      scenario: 'Abnahme – Prüfprotokoll kontrollieren',
      question: 'Im Protokoll eines Kollegen steht: „Werkstatt · LS B16 · R_LO 0,21 Ω · R_ISO 85 MΩ · Z_S 2,6 Ω“. Was beanstandest du?',
      options: [
        'Z_S = 2,6 Ω ist für B16 zu hoch (Praxis-Grenzwert 1,91 Ω)',
        'R_ISO = 85 MΩ ist zu hoch, ab 50 MΩ liegt ein Leiterbruch vor',
        'R_LO = 0,21 Ω ist zu niedrig, der PE muss mindestens 0,3 Ω haben',
        'Nichts – Z_S darf bei einem LS B16 bis zu 14,4 Ω betragen'
      ],
      correct: 'Z_S = 2,6 Ω ist für B16 zu hoch (Praxis-Grenzwert 1,91 Ω)',
      explanation: 'B16: I_a = 5 · 16 A = 80 A → Z_S,max = 230 V / 80 A = 2,87 Ω, mit 2/3-Faktor 1,91 Ω. ' +
        '2,6 Ω → Abschaltung in 0,4 s nicht sicher. R_LO und R_ISO sind in Ordnung.',
      praxis: 'Abhilfe: größerer Querschnitt, kürzere Leitung, kleinerer LS oder zusätzlicher RCD. Mangel im ' +
        'Protokoll eintragen und den Stromkreis nicht freigeben.'
    }
  ];

  const CATEGORIES = [
    { id: 'alle', label: 'Alle', icon: '🧰' },
    { id: 'kabel', label: 'Kabel & Leiter', icon: '🔌' },
    { id: 'messen', label: 'Messen & Prüfen', icon: '📟' },
    { id: 'pruefen', label: 'VDE-Messgeräte', icon: '📐' },
    { id: 'montage', label: 'Montage', icon: '🔧' }
  ];

  const CATEGORY_COLORS = {
    kabel: 'var(--accent-amber)',
    messen: 'var(--accent-blue)',
    pruefen: '#22d3ee',
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
      .et-card-wide { grid-column:1 / -1; }
      .et-detail-svg { display:block; width:100%; max-width:560px; height:auto; margin:12px auto 0;
        background:#0b1220; border:1px solid var(--border); border-radius:12px; padding:6px; }
      .et-settings { width:100%; border-collapse:collapse; font-size:0.82rem; margin-top:4px; }
      .et-settings th { text-align:left; color:var(--text-muted); font-weight:600; padding:6px 8px;
        border-bottom:1px solid var(--border); }
      .et-settings td { padding:7px 8px; border-bottom:1px solid rgba(255,255,255,0.06); vertical-align:top;
        color:var(--text-main); line-height:1.45; }
      .et-settings td:first-child { font-weight:700; color:#22d3ee; white-space:nowrap; }
      .et-settings td:last-child { color:var(--accent-amber); font-weight:600; }
      .et-settings-wrap { overflow-x:auto; background:rgba(34,211,238,0.06); border-left:3px solid #22d3ee;
        border-radius:10px; padding:8px 10px; }
      .et-option.et-text { display:block; font-size:0.88rem; line-height:1.45; }
      .et-options.et-options-text { grid-template-columns:1fr; }
      @media (max-width: 560px) { .et-settings td:first-child { white-space:normal; } }
    `;
    document.head.appendChild(style);
  }

  // --------------------------------------------------------------------------
  // Werkzeug-Guide
  // --------------------------------------------------------------------------
  // Gesamtansicht: Werkzeug-Guide + Werkzeug-/Messgeräte-Quiz in einem Container
  function renderToolsGuide(containerEl) {
    const el = typeof containerEl === 'string' ? document.getElementById(containerEl) : containerEl;
    if (!el) return;
    injectStyles();
    if (!el.querySelector('[data-et-guide-root]')) {
      el.innerHTML = `
        <div data-et-guide-root></div>
        <div class="section-card" style="margin-top:16px;">
          <div class="section-header">
            <h2>🎯 Werkzeug- & Messgeräte-Quiz</h2>
            <span class="badge badge-blue">${QUIZ_QUESTIONS.length} Szenarien · +10 XP</span>
          </div>
          <div data-et-quiz-root></div>
        </div>`;
    }
    renderGuideList(el.querySelector('[data-et-guide-root]'));
    renderToolQuiz(el.querySelector('[data-et-quiz-root]'));
  }

  function settingsTable(tool) {
    if (!tool.settings || !tool.settings.length) return '';
    return `
      <div class="et-settings-wrap">
        <strong style="display:block;margin-bottom:4px;">🎛️ So stellst du das Gerät ein</strong>
        <table class="et-settings">
          <thead><tr><th>Funktion</th><th>Einstellung & Anschluss</th><th>Soll / Grenzwert</th></tr></thead>
          <tbody>
            ${tool.settings.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2] || '–'}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  function renderGuideList(containerEl) {
    if (!containerEl) return;

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
        <div class="et-card ${isOpen ? 'open' : ''} ${tool.wide ? 'et-card-wide' : ''}" data-et-tool="${tool.id}" role="button" tabindex="0" aria-expanded="${isOpen}">
          <div class="et-card-head">
            <div class="et-icon" style="color:${color};">${tool.iconSvg}</div>
            <div>
              <h4 class="et-name">${tool.name}</h4>
              <span class="et-badge" style="color:${color};">${tool.norm}</span>
            </div>
          </div>
          <p class="et-desc">${tool.description}</p>
          ${tool.detailSvg ? tool.detailSvg : ''}
          ${isOpen ? `
            <div class="et-details">
              ${settingsTable(tool)}
              <div class="et-box et-tip"><strong>💡 Profi-Tipp von der Baustelle</strong>${tool.baustellenTipp}</div>
              <div class="et-box et-mistake"><strong>⚠️ Typischer Azubi-Fehler</strong>${tool.typicalMistake}</div>
            </div>` : `<div class="et-toggle-hint">▸ Antippen für ${tool.settings ? 'Einstell-Tabelle, ' : ''}Profi-Tipp & typischen Fehler</div>`}
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
        renderGuideList(containerEl);
      });
    });

    containerEl.querySelectorAll('[data-et-tool]').forEach(card => {
      const toggle = () => {
        const id = card.getAttribute('data-et-tool');
        guideState.openId = guideState.openId === id ? null : id;
        renderGuideList(containerEl);
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

    const isText = q.type === 'text';
    const optionsHtml = quizState.shuffledOptions.map((value, i) => {
      let cls = 'et-option' + (isText ? ' et-text' : '');
      if (quizState.answered) {
        if (value === q.correct) cls += ' correct';
        else if (value === quizState.selected) cls += ' wrong';
      }
      if (isText) {
        return `
        <button class="${cls}" data-et-answer="${i}" ${quizState.answered ? 'disabled' : ''}>
          <strong>${String.fromCharCode(65 + i)})</strong> ${value}
        </button>`;
      }
      const tool = getTool(value);
      return `
        <button class="${cls}" data-et-answer="${i}" ${quizState.answered ? 'disabled' : ''}>
          ${tool.iconSvg}
          <span>${tool.name}</span>
        </button>`;
    }).join('');

    let feedbackHtml = '';
    if (quizState.answered) {
      const isCorrect = quizState.selected === q.correct;
      const correctLabel = isText ? q.correct : getTool(q.correct).name;
      const refTool = isText && q.tool ? getTool(q.tool) : null;
      feedbackHtml = `
        <div class="et-feedback">
          <div class="et-box ${isCorrect ? 'et-tip' : 'et-mistake'}">
            <strong>${isCorrect ? '✅ Richtig! +10 XP' : `❌ Leider falsch – richtig ist: ${correctLabel}`}</strong>
            ${q.explanation}
          </div>
          <div class="et-box" style="background:rgba(56,189,248,0.08); border-left:3px solid var(--accent-blue); margin-top:10px;">
            <strong>🏗️ Praxisbezug</strong>${q.praxis}
          </div>
          ${refTool ? `<div style="font-size:0.8rem;color:var(--text-muted);margin-top:8px;">📐 Mehr dazu im Steckbrief: <strong>${refTool.name}</strong></div>` : ''}
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
        <div class="et-options ${isText ? 'et-options-text' : ''}">${optionsHtml}</div>
        ${feedbackHtml}
      </div>`;

    containerEl.querySelectorAll('[data-et-answer]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (quizState.answered) return;
        quizState.selected = quizState.shuffledOptions[parseInt(btn.getAttribute('data-et-answer'), 10)];
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
