/*
 * ElektroCoach – Datenbasis
 * Prüfungs- und Baustellen-Lern-PWA für Friedrich
 * Elektroniker für Energie- und Gebäudetechnik (Abschluss Juli 2027)
 *
 * Aufbau:
 *   categories  – 6 Prüfungs-Themenblöcke
 *   questions   – Multiple-Choice-Fragen (4 Optionen, correctIndex 0–3)
 *   cheatSheets – 1 Spickzettel pro Kategorie
 *
 * isWeakSpot: true markiert Friedrichs 3 aktuelle Wackel-Themen
 * (Stand 2026-10-26, siehe Vault: 04_Bereiche/Lernen/Lernen.md):
 *   1. Typenschild 230/400 V vs. 400/690 V
 *   2. Pegelrechnung in dB / dBµV
 *   3. Ruhezustand im Schaltplan & Drahtbruchsicherheit
 *
 * Quellen:
 *   „Fachkunde Kap. X“ = Fachkunde-Lösungen (Europa-Lehrmittel, 2. Aufl., Blatt 0.1–15.10)
 *   „GP Teil 1 So 24“ usw. = Gesellenprüfung Teil 1, Altprüfungen
 */
window.ELEKTRO_DATA = {
  categories: [
    {
      id: "drehstrom_motoren",
      title: "Drehstrom & Motoren",
      shortTitle: "Drehstrom",
      icon: "⚙️",
      color: "#f59e0b",
      description: "Symmetrische/unsymmetrische Last, Neutralleiterbruch, Synchron- vs. Asynchronmotor, Schlupf, Stern-Dreieck-Klemmbrett, Typenschild, Motorschutz."
    },
    {
      id: "antennen_dvb",
      title: "Antennen & DVB",
      shortTitle: "Antennen",
      icon: "📡",
      color: "#3b82f6",
      description: "DVB-S/S2, LNB, Multischalter, DVB-C/BK-Anlage, IPTV nach DIN EN 50173, Pegelrechnung in dB/dBµV, Antennenerdung nach DIN VDE 0855-1."
    },
    {
      id: "schuetz_fluidsim",
      title: "Schützsteuerungen & FluidSIM",
      shortTitle: "Schütze",
      icon: "🔌",
      color: "#10b981",
      description: "Ruhezustand, Drahtbruchsicherheit, Tippbetrieb vs. Selbsthaltung, Wendeschützschaltung, automatische Stern-Dreieck-Schützschaltung."
    },
    {
      id: "schutz_vde",
      title: "Schutzmaßnahmen & VDE-Prüfung",
      shortTitle: "Schutz/VDE",
      icon: "🛡️",
      color: "#ef4444",
      description: "5 Sicherheitsregeln, Netzsysteme TN/TT, Abschaltzeiten, RCD Typ A/B, Geräteprüfung nach DIN VDE 0701-0702."
    },
    {
      id: "leitungsberechnung",
      title: "Leitungsberechnung & Überstromschutz",
      shortTitle: "Leitungen",
      icon: "📏",
      color: "#8b5cf6",
      description: "Ib ≤ In ≤ Iz, Verlegearten, Umrechnungsfaktoren, Spannungsfall Wechsel-/Drehstrom, LS-Charakteristiken B/C."
    },
    {
      id: "elektronik_digital",
      title: "Elektronik & Digitaltechnik",
      shortTitle: "Elektronik",
      icon: "💡",
      color: "#ec4899",
      description: "Phasenanschnitt vs. Phasenabschnitt (LED-Dimmer), B2U/B6U, Logikgatter, RS-Glied in LOGO!/SPS."
    }
  ],

  questions: [
    // ───────────────────────── 1. DREHSTROM & MOTOREN ─────────────────────────
    {
      id: "dm-01",
      category: "drehstrom_motoren",
      question: "Ein Durchlauferhitzer (3 gleiche Heizwiderstände) ist in Stern mit Neutralleiter am 400/230-V-Netz angeschlossen. Wie groß ist der Strom im Neutralleiter?",
      options: [
        "Genauso groß wie ein Außenleiterstrom",
        "0 A, weil sich die drei um 120° verschobenen Ströme gegenseitig aufheben",
        "√3-mal so groß wie ein Außenleiterstrom",
        "Ein Drittel des Außenleiterstroms"
      ],
      correctIndex: 1,
      explanation: "Bei symmetrischer Last sind alle drei Strangströme gleich groß und jeweils um 120° phasenverschoben. Ihre Zeigersumme ist null – der N führt keinen Strom. Deshalb kann man reine Drehstromverbraucher wie Durchlauferhitzer oder Motoren auch ganz ohne N anschließen. Auf der Baustelle: Misst du an einem symmetrischen Verbraucher deutlichen Strom auf dem N, stimmt etwas nicht (defekter Heizstab, Oberschwingungen durch Elektronik).",
      formula: "I_N = I_L1 + I_L2 + I_L3 (geometrisch) = 0 A bei symmetrischer Last",
      source: "Fachkunde Kap. 7 (Blatt 7.1–7.16, Drehstrom)",
      isWeakSpot: false
    },
    {
      id: "dm-02",
      category: "drehstrom_motoren",
      question: "In einer Altbau-Unterverteilung bricht bei unsymmetrischer Last (L1: 2 kW, L2: 200 W, L3: 1 kW) der Neutralleiter. Was passiert?",
      options: [
        "Alle Verbraucher gehen sofort aus, weil der Stromkreis offen ist",
        "Alle Verbraucher bekommen weiterhin 230 V",
        "Sternpunktverschiebung: Der Strang mit der kleinsten Leistung (größter Widerstand) bekommt die höchste Spannung – bis fast 400 V",
        "Der Strang mit der größten Leistung bekommt die höchste Spannung"
      ],
      correctIndex: 2,
      explanation: "Ohne N liegen die Verbraucher in Reihe zwischen den Außenleitern (400 V). Der Sternpunkt „wandert“ zum am stärksten belasteten Strang. Die Spannung teilt sich nach den Widerständen auf: Der 200-W-Verbraucher (großer Widerstand) bekommt fast 400 V und raucht ab, der 2-kW-Strang bekommt deutlich weniger als 230 V. Typisches Schadensbild: Fernseher, Netzteile und LED-Treiber auf einer Phase alle gleichzeitig defekt. Darum: N-Klemmen immer fest anziehen und kein N-Querschnitt kleiner als der Außenleiter bei Mehrphasen-Stromkreisen mit Elektroniklast.",
      formula: "Ohne N: Spannung teilt sich nach R auf → großer R (kleine P) = große U",
      source: "Fachkunde Kap. 7 (Blatt 7.1–7.16, unsymmetrische Last / Sternpunktverschiebung)",
      isWeakSpot: false
    },
    {
      id: "dm-03",
      category: "drehstrom_motoren",
      question: "Ein 4-poliger Drehstrom-Asynchronmotor (f = 50 Hz) hat laut Typenschild n = 1440 min⁻¹. Wie groß ist der Schlupf?",
      options: ["2 %", "40 %", "6 %", "4 %"],
      correctIndex: 3,
      explanation: "4-polig heißt Polpaarzahl p = 2. Synchrondrehzahl ns = f · 60 / p = 50 · 60 / 2 = 1500 min⁻¹. Schlupf s = (1500 − 1440) / 1500 = 60 / 1500 = 0,04 = 4 %. Baustellen-Trick: Die Drehzahl auf dem Typenschild liegt immer knapp UNTER einer Synchrondrehzahl (3000, 1500, 1000, 750 min⁻¹). Bei 1440 min⁻¹ weißt du sofort: 4-poliger Motor.",
      formula: "n_s = (f · 60) / p   |   s = (n_s − n) / n_s · 100 %",
      source: "Fachkunde Kap. 13 (Blatt 13.1–13.19, Drehfeld & Asynchronmotor)",
      isWeakSpot: false
    },
    {
      id: "dm-04",
      category: "drehstrom_motoren",
      question: "Worin unterscheidet sich der Synchronmotor grundsätzlich vom Asynchronmotor?",
      options: [
        "Der Synchronmotor läuft genau mit der Drehfelddrehzahl n_s, der Asynchronmotor läuft mit Schlupf etwas langsamer",
        "Der Asynchronmotor läuft genau mit n_s, der Synchronmotor langsamer",
        "Beide laufen mit Schlupf, nur der Synchronmotor hat einen Kurzschlussläufer",
        "Der Synchronmotor läuft nur an Gleichspannung"
      ],
      correctIndex: 0,
      explanation: "Beim Asynchronmotor (Kurzschlussläufer) wird im Läufer nur dann Spannung induziert, wenn sich das Drehfeld relativ zum Läufer bewegt – er braucht also Schlupf, um Drehmoment zu bilden. Der Synchronmotor hat ein eigenes Läufermagnetfeld (Permanentmagnete oder erregte Wicklung) und „rastet“ im Drehfeld ein: n = n_s, unabhängig von der Last (bis zum Kippen). Baustelle: 95 % aller Pumpen, Lüfter und Werkstattmaschinen sind Asynchronmotoren; Synchronmotoren findest du bei Servoantrieben und modernen EC-/PM-Motoren.",
      formula: "Asynchron: n < n_s (s > 0)   |   Synchron: n = n_s (s = 0)",
      source: "Fachkunde Kap. 13 (Blatt 13.1–13.19)",
      isWeakSpot: false
    },
    {
      id: "dm-05",
      category: "drehstrom_motoren",
      question: "Welche Brücken setzt du auf dem Motorklemmbrett für eine DREIECK-Schaltung?",
      options: [
        "W2–U2–V2 waagerecht miteinander verbinden",
        "U1–U2, V1–V2, W1–W2",
        "Drei senkrechte Brücken: U1–W2, V1–U2, W1–V2",
        "U1–V1–W1 miteinander verbinden"
      ],
      correctIndex: 2,
      explanation: "Auf dem Klemmbrett liegen oben U1 V1 W1 und unten (versetzt!) W2 U2 V2. Für Dreieck setzt du drei senkrechte Brücken: U1–W2, V1–U2, W1–V2 – so wird das Ende jeder Wicklung mit dem Anfang der nächsten verbunden. Für Stern legst du EINE waagerechte Brücke über W2–U2–V2 (meist mit zwei Blechen), das ist der Sternpunkt. U1–U2 zu brücken würde eine Wicklung kurzschließen.",
      formula: "Δ: U1–W2 | V1–U2 | W1–V2 (senkrecht)   ·   Y: W2–U2–V2 (waagerecht)",
      source: "Fachkunde Kap. 13 (Blatt 13.1–13.19, Klemmbrett & Leistungsschild)",
      isWeakSpot: false
    },
    {
      id: "dm-06",
      category: "drehstrom_motoren",
      question: "Drei gleiche Heizwiderstände werden am 400-V-Netz von Stern auf Dreieck umgeklemmt. Wie ändert sich die Leistung?",
      options: [
        "Sie bleibt gleich",
        "Sie wird √3-mal so groß",
        "Sie halbiert sich",
        "Sie wird 3-mal so groß"
      ],
      correctIndex: 3,
      explanation: "Im Stern liegt jeder Widerstand an 230 V, im Dreieck an 400 V – also √3-fache Spannung. Weil P = U² / R, steigt die Leistung je Widerstand um (√3)² = 3. Genau deshalb nutzt man den Stern-Dreieck-Anlauf: Im Stern sind Anlaufstrom und Anlaufmoment nur ein Drittel. Umgekehrt: Klemmst du einen Heizstab versehentlich in Dreieck statt Stern, verdreifacht sich die Leistung und er brennt durch.",
      formula: "P_Δ = 3 · P_Y   |   I_Anlauf,Y = 1/3 · I_Anlauf,Δ   |   P = √3 · U · I · cos φ",
      source: "Fachkunde Kap. 7 (Blatt 7.1–7.16, Stern & Dreieck)",
      isWeakSpot: false
    },
    {
      id: "dm-07",
      category: "drehstrom_motoren",
      question: "Auf dem Typenschild eines Motors steht „Δ 230 V / Y 400 V“. Das Netz ist 400/230 V. Wie schließt du ihn an?",
      options: [
        "Dauerhaft in Stern (Y) – ein Stern-Dreieck-Anlauf ist NICHT möglich",
        "Mit Stern-Dreieck-Anlauf, weil beide Schaltungen auf dem Schild stehen",
        "In Dreieck, weil 230 V die Wechselstromspannung ist",
        "Gar nicht, der Motor ist nur für Einphasen-Wechselstrom"
      ],
      correctIndex: 0,
      explanation: "Die KLEINERE Zahl auf dem Schild (230 V) ist die maximale Spannung, die eine einzelne Wicklung verträgt – NICHT „Einphasen-Wechselstrom“. Im Stern bekommt jede Wicklung 400 V / √3 = 230 V → passt. Im Dreieck läge jede Wicklung direkt an 400 V zwischen zwei Außenleitern → Wicklung brennt durch. Da der Motor im Betrieb im Stern laufen muss, gibt es keinen Stern-Dreieck-Anlauf (er würde ja in Dreieck enden). Typisch für kleine Motoren bis ca. 3 kW.",
      formula: "U_Wicklung = U_L / √3 = 400 V / 1,73 = 230 V (im Stern)   ·   Kleine Zahl = Wicklungsspannung!",
      source: "Fachkunde Kap. 13 (Blatt 13.1–13.19, Leistungsschild) / GP Teil 1",
      isWeakSpot: true
    },
    {
      id: "dm-08",
      category: "drehstrom_motoren",
      question: "Welches Typenschild muss ein Motor haben, damit er am 400-V-Netz mit Stern-Dreieck-Anlauf betrieben werden darf?",
      options: [
        "Δ 230 V / Y 400 V",
        "Δ 133 V / Y 230 V",
        "Y 230 V",
        "Δ 400 V / Y 690 V"
      ],
      correctIndex: 3,
      explanation: "Beim Stern-Dreieck-Anlauf läuft der Motor im Betrieb in DREIECK – jede Wicklung liegt dann an vollen 400 V. Also muss die Wicklung 400 V vertragen: Das Schild muss „Δ 400 V / Y 690 V“ zeigen. Kurz nach dem Anlauf im Stern bekommt jede Wicklung nur 230 V (Strom und Moment auf 1/3 reduziert), danach wird auf Dreieck umgeschaltet. Merke: Die Netzspannung (400 V) muss beim Δ-Wert stehen.",
      formula: "Y-Δ-Anlauf am 400-V-Netz ⇔ Schild „Δ 400 V“ (kleine Zahl = 400 V)",
      source: "Fachkunde Kap. 13 (Blatt 13.1–13.19, Stern-Dreieck-Anlauf) / GP Teil 1",
      isWeakSpot: true
    },
    {
      id: "dm-09",
      category: "drehstrom_motoren",
      question: "Ein Motor (Δ 400 V, I_N = 20 A) läuft mit Stern-Dreieck-Anlauf. Das Motorschutzrelais sitzt hinter dem Netzschütz IM STRANG (Wicklungszuleitung). Auf welchen Strom stellst du es ein?",
      options: ["20 A", "34,6 A", "11,6 A", "6,7 A"],
      correctIndex: 2,
      explanation: "Im Dreieck ist der Strangstrom (durch die Wicklung) um √3 kleiner als der Leiterstrom: I_Str = I_N / √3 = 20 A · 0,58 = 11,6 A. Sitzt das Motorschutzrelais in der Zuleitung VOR der Aufteilung (also im Leiter), stellst du I_N = 20 A ein. In der typischen Stern-Dreieck-Schützschaltung sitzt -F2 aber hinter dem Netzschütz in den Wicklungszuleitungen U1/V1/W1 → also 0,58 · I_N. Vorteil: Das Relais schützt so in Stern- UND Dreieckstufe.",
      formula: "I_Einstell = I_N / √3 = 0,58 · I_N (im Strang)",
      source: "Fachkunde Kap. 10 (Blatt 10.1–10.11, Motorschutzrelais) / Kap. 6",
      isWeakSpot: false
    },

    // ───────────────────────── 2. ANTENNEN & DVB ─────────────────────────
    {
      id: "ad-01",
      category: "antennen_dvb",
      question: "In welchem Frequenzbereich wird die Sat-ZF (Sat-Zwischenfrequenz) vom LNB über das Koaxkabel übertragen?",
      options: ["47–862 MHz", "5–65 MHz", "10,7–12,75 GHz", "950–2150 MHz"],
      correctIndex: 3,
      explanation: "Der Satellit sendet im Ku-Band (10,7–12,75 GHz). Diese Frequenzen würden im Koaxkabel sofort weggedämpft. Der LNB setzt sie deshalb mit seinem Oszillator (9,75 GHz Low-Band / 10,6 GHz High-Band) auf die Sat-ZF von 950–2150 MHz herunter. 47–862 MHz ist der Bereich der BK-/Kabelanlage (DVB-C), 5–65 MHz der Rückkanal.",
      formula: "f_ZF = f_Sat − f_LO   (z. B. 11,7 GHz − 9,75 GHz = 1,95 GHz)",
      source: "Fachkunde Kap. 12 (Blatt 12.1–12.18, Antennenanlagen)",
      isWeakSpot: false
    },
    {
      id: "ad-02",
      category: "antennen_dvb",
      question: "Wie wählt der Receiver beim Universal-LNB Polarisation und Frequenzband aus?",
      options: [
        "Über die Kabellänge",
        "Polarisation über die Speisespannung (ca. 13/14 V vertikal, 18 V horizontal), Band über ein 22-kHz-Signal (an = High-Band)",
        "Polarisation über das 22-kHz-Signal, Band über die Spannung",
        "Gar nicht – der LNB gibt immer alles gleichzeitig aus"
      ],
      correctIndex: 1,
      explanation: "Ein Universal-LNB hat 4 „Ebenen“: vertikal/horizontal × Low/High-Band. Der Receiver schaltet per Fernspeisespannung die Polarisation (13/14 V = vertikal, 18 V = horizontal) und per 22-kHz-Ton das Band (aus = Low, an = High). Ein Single-LNB kann daher nur EINEN Teilnehmer versorgen. Für mehrere Teilnehmer: Quattro-LNB (alle 4 Ebenen fest auf 4 Ausgängen) + Multischalter.",
      formula: "14 V = V | 18 V = H | 0 kHz = Low | 22 kHz = High",
      source: "Fachkunde Kap. 12 (Blatt 12.1–12.18)",
      isWeakSpot: false
    },
    {
      id: "ad-03",
      category: "antennen_dvb",
      question: "Ein Mehrfamilienhaus soll mit Satellitenempfang für 8 Wohnungen ausgestattet werden. Welche Struktur ist mit einem Multischalter typisch?",
      options: [
        "Baumstruktur mit Durchgangsdosen in Reihe",
        "Ringstruktur",
        "Sternstruktur: Von jedem Multischalter-Ausgang führt eine eigene Leitung zu genau einer Teilnehmerdose",
        "Busstruktur mit 75-Ω-Abschluss an jeder Dose"
      ],
      correctIndex: 2,
      explanation: "Weil jeder Receiver seine Ebene (Polarisation/Band) selbst über Spannung und 22 kHz anwählt, braucht jeder Teilnehmer eine EIGENE Leitung vom Multischalter – Sternstruktur. Der Multischalter bekommt die 4 Ebenen vom Quattro-LNB (bei 2 Satelliten 8 Eingänge + ggf. terrestrisch). Baustelle: Pro Wohnung mindestens 2 Leitungen vorsehen (Twin-Receiver/Aufnahme). Alternative ohne Sternverkabelung: Einkabelsystem (Unicable/JESS).",
      formula: "Multischalter: Ein Ausgang = ein Teilnehmer (Stern)",
      source: "Fachkunde Kap. 12 (Blatt 12.1–12.18)",
      isWeakSpot: false
    },
    {
      id: "ad-04",
      category: "antennen_dvb",
      question: "In einer BK-Anlage (DVB-C, Baumstruktur) bleibt der letzte Ausgang eines Verteilers unbelegt. Was musst du tun?",
      options: [
        "Nichts, offene Ausgänge sind unkritisch",
        "Mit einem 75-Ω-Abschlusswiderstand abschließen, um Reflexionen zu vermeiden",
        "Mit einem 50-Ω-Abschlusswiderstand abschließen",
        "Mit einem Kurzschlussstecker brücken"
      ],
      correctIndex: 1,
      explanation: "Koaxanlagen in der Rundfunktechnik haben einen Wellenwiderstand von 75 Ω. Ein offener (oder falsch abgeschlossener) Ausgang reflektiert das Signal zurück ins Netz → Geisterbilder, Bitfehler, Klötzchenbildung. Deshalb gehört an jeden freien Verteiler-/Abzweiger-Ausgang und an das Ende einer Durchgangsdosen-Kette ein 75-Ω-Abschlusswiderstand. 50 Ω ist Funk-/Messtechnik, nicht TV.",
      formula: "Wellenwiderstand TV-Koax: Z = 75 Ω → offene Ausgänge mit 75 Ω abschließen",
      source: "Fachkunde Kap. 12 (Blatt 12.1–12.18)",
      isWeakSpot: false
    },
    {
      id: "ad-05",
      category: "antennen_dvb",
      question: "Ein Kunde will IPTV in jedem Raum über das Hausnetz (10 Gbit/s zukunftssicher). Welche Verkabelung ist nach DIN EN 50173 zu empfehlen?",
      options: [
        "Koaxkabel 75 Ω",
        "Telefonleitung J-Y(St)Y",
        "Cat 5e, Klasse D",
        "Installationskabel Cat 7 (bzw. Komponenten Cat 6A), Übertragungsstrecke Klasse EA"
      ],
      correctIndex: 3,
      explanation: "IPTV ist reiner Netzwerkverkehr (Ethernet). Für 10GBASE-T über 90 m Permanent Link braucht man nach DIN EN 50173 die Klasse EA. Üblich ist Verlegekabel Cat 7 (S/FTP, 1000 MHz) mit Dosen/Patchfeld Cat 6A. Cat 5e (Klasse D) schafft nur 1 Gbit/s. Wichtig: Die Kategorie (Cat) bezieht sich auf Komponenten, die Klasse auf die gesamte Strecke – die schwächste Komponente bestimmt die Klasse.",
      formula: "Klasse D = Cat 5e (1 Gbit/s) | Klasse E = Cat 6 | Klasse EA = Cat 6A (10 Gbit/s) | Klasse F = Cat 7",
      source: "Fachkunde Kap. 12 (Multimedia) / Kap. 14 (Blatt 14.1–14.10, Netzwerktechnik)",
      isWeakSpot: false
    },
    {
      id: "ad-06",
      category: "antennen_dvb",
      question: "Am Eingang eines Hausverstärkers liegen 60 dBµV an. Verstärkung 20 dB, danach Verteiler 6 dB und Kabel + Dose zusammen 10 dB Dämpfung. Welcher Pegel kommt an der Dose an?",
      options: ["96 dBµV", "24 dBµV", "56 dBµV", "64 dBµV"],
      correctIndex: 3,
      explanation: "Die Pegelrechnung in dB ist reine Plus-Minus-Rechnung: Verstärker addieren, Dämpfungen (Kabel, Verteiler, Abzweiger, Dose) subtrahieren. 60 dBµV + 20 dB − 6 dB − 10 dB = 64 dBµV. Wichtig: Nur der Startwert hat die Einheit dBµV (absoluter Pegel), Verstärkung und Dämpfung sind dB (Verhältnisse). Ergebnis wieder in dBµV. Das ist in der Prüfung ein sicherer Punktelieferant!",
      formula: "Pegel_Dose [dBµV] = Pegel_Eingang [dBµV] + Σ Verstärkung [dB] − Σ Dämpfung [dB]",
      source: "Fachkunde Kap. 12 (Blatt 12.1–12.18, Pegelrechnung) / GP Teil 1",
      isWeakSpot: true
    },
    {
      id: "ad-07",
      category: "antennen_dvb",
      question: "Ein BK-Verstärker liefert 95 dBµV. Dann folgen 20 m Koaxkabel (0,2 dB/m), ein Abzweiger mit 12 dB Abzweigdämpfung und eine Antennendose mit 3 dB. Welcher Pegel liegt an der Dose an?",
      options: ["76 dBµV", "80 dBµV", "71 dBµV", "114 dBµV"],
      correctIndex: 0,
      explanation: "Erst die Kabeldämpfung ausrechnen: 20 m · 0,2 dB/m = 4 dB. Dann alles abziehen: 95 − 4 − 12 − 3 = 76 dBµV. Typischer Prüfungsfehler: Die Kabeldämpfung pro Meter vergessen zu multiplizieren oder die Dämpfung addieren statt abziehen. Baustelle: Mit dem Messgerät an der Dose nachmessen – liegt der Wert deutlich darunter, stimmt eine F-Stecker-Verbindung nicht.",
      formula: "a_Kabel = l · a' = 20 m · 0,2 dB/m = 4 dB   →   95 − 4 − 12 − 3 = 76 dBµV",
      source: "Fachkunde Kap. 12 (Blatt 12.1–12.18, Pegelrechnung)",
      isWeakSpot: true
    },
    {
      id: "ad-08",
      category: "antennen_dvb",
      question: "Was bedeutet eine Pegeländerung von +6 dB bezogen auf die SPANNUNG?",
      options: [
        "Die Spannung verdoppelt sich",
        "Die Spannung versechsfacht sich",
        "Die Spannung steigt um 6 µV",
        "Die Spannung halbiert sich"
      ],
      correctIndex: 0,
      explanation: "dB ist ein logarithmisches Verhältnis. Für Spannungen gilt: 20 · log(U2/U1). Verdoppelte Spannung → 20 · log 2 ≈ 6 dB. Für Leistungen gilt 10 · log(P2/P1): doppelte Leistung = 3 dB. Darum: Ein Verteiler mit 2 Ausgängen hat theoretisch 3 dB Dämpfung (Leistung halbiert), in der Praxis ca. 3,5–4 dB. +20 dB = 10-fache Spannung, +40 dB = 100-fache Spannung.",
      formula: "a = 20 · log(U2/U1) dB   |   a = 10 · log(P2/P1) dB   |   +6 dB = 2·U, +3 dB = 2·P",
      source: "Fachkunde Kap. 12 (Blatt 12.1–12.18, Pegelrechnung)",
      isWeakSpot: true
    },
    {
      id: "ad-09",
      category: "antennen_dvb",
      question: "Eine Sat-Antenne wird auf dem Dach (außerhalb eines Blitzschutz-Schutzbereichs) montiert. Was fordert DIN VDE 0855-1?",
      options: [
        "Erdungsleiter mind. 4 mm² Cu, Potentialausgleich 16 mm² Cu",
        "Keine Erdung, wenn der Mast aus Aluminium ist",
        "Erdungsleiter mind. 16 mm² Cu massiv auf kürzestem Weg zur Erdungsanlage, Koax-Schirme mit mind. 4 mm² Cu in den Potentialausgleich; Mast-Biegemoment an der Einspannstelle max. 1650 Nm",
        "Erdung über den Schirm des Koaxkabels reicht aus"
      ],
      correctIndex: 2,
      explanation: "Der Antennenmast muss über einen Erdungsleiter mit mind. 16 mm² Cu (alternativ 25 mm² Al oder 50 mm² Stahl) auf möglichst kurzem, senkrechtem Weg mit der Erdungsanlage/HES verbunden werden – ein Blitzeinschlag soll nicht über die Koaxschirme ins Haus laufen. Die Schirme der Koaxkabel werden über einen Erdungswinkel/Potentialausgleichsblock mit mind. 4 mm² Cu in den Potentialausgleich einbezogen. Statik: Ohne statischen Nachweis darf das Biegemoment an der Einspannstelle 1650 Nm nicht überschreiten (Windlast × Hebelarm, freie Mastlänge max. 6 m).",
      formula: "Erdung ≥ 16 mm² Cu | PA Koaxschirme ≥ 4 mm² Cu | M_Biege ≤ 1650 Nm | M = Σ (F_Wind · l)",
      source: "Fachkunde Kap. 12 (Blatt 12.1–12.18) / DIN VDE 0855-1",
      isWeakSpot: false
    },

    // ───────────────────────── 3. SCHÜTZSTEUERUNGEN & FLUIDSIM ─────────────────────────
    {
      id: "sf-01",
      category: "schuetz_fluidsim",
      question: "In welchem Zustand werden Kontakte in Schaltplänen (und in FluidSIM) grundsätzlich gezeichnet?",
      options: [
        "Im eingeschalteten Betriebszustand",
        "Im unbetätigten, spannungs- bzw. stromlosen Ruhezustand",
        "So, wie die Anlage gerade in der Simulation steht",
        "Öffner im betätigten, Schließer im unbetätigten Zustand"
      ],
      correctIndex: 1,
      explanation: "Schaltpläne zeigen IMMER den Ruhezustand: kein Taster gedrückt, keine Spule erregt, keine Spannung. Ein Öffner ist dort also geschlossen gezeichnet, ein Schließer offen. Wenn du einen Plan liest, musst du dir den Ablauf im Kopf „vorspielen“: Was passiert, wenn ich -S1 drücke? Häufiger Fehler: Den Plan so zeichnen, wie die Anlage läuft – dann stimmt in der Prüfung jeder Kontakt falsch herum.",
      formula: "Schaltplan = Ruhezustand: unbetätigt + stromlos",
      source: "Fachkunde Kap. 6 (Blatt 6.1–6.14, Schaltungstechnik)",
      isWeakSpot: true
    },
    {
      id: "sf-02",
      category: "schuetz_fluidsim",
      question: "Ein Öffner (Kontakt 11–12) ist im Schaltplan gezeichnet. Wie verhält er sich?",
      options: [
        "In Ruhe offen, beim Betätigen geschlossen",
        "Er schließt erst nach einer einstellbaren Zeit",
        "Er ist immer geschlossen",
        "In Ruhe geschlossen, beim Betätigen offen"
      ],
      correctIndex: 3,
      explanation: "Der Öffner heißt so, weil er beim Betätigen ÖFFNET – in Ruhe ist er also geschlossen und lässt Strom fließen. Funktionsziffern: Öffner enden auf 1–2 (z. B. 11–12, 21–22), Schließer auf 3–4 (13–14, 43–44), Überlastrelais-Öffner 95–96, -Schließer 97–98. Damit erkennst du auch ohne Symbol, um welchen Kontakt es sich handelt.",
      formula: "Öffner: x1–x2 (in Ruhe zu) | Schließer: x3–x4 (in Ruhe offen) | MSR: 95–96 Ö, 97–98 S",
      source: "Fachkunde Kap. 6 (Blatt 6.1–6.14)",
      isWeakSpot: true
    },
    {
      id: "sf-03",
      category: "schuetz_fluidsim",
      question: "Warum werden AUS-Taster -S0 und der Überlastkontakt -F2 (95–96) als ÖFFNER in Reihe in den Steuerstromkreis geschaltet?",
      options: [
        "Weil Öffner billiger sind",
        "Damit der Motor nach Netzausfall automatisch wieder anläuft",
        "Drahtbruchsicherheit (Ruhestromprinzip): Ein abgerissener Draht unterbricht den Steuerstromkreis, das Schütz fällt ab und die Maschine stoppt",
        "Damit das Schütz im Fehlerfall schneller anzieht"
      ],
      correctIndex: 2,
      explanation: "Ruhestromprinzip: Im Betrieb fließt ständig Strom durch -S0 und -F2. Reißt irgendwo ein Draht oder löst sich eine Klemme, wird der Kreis unterbrochen – genau wie beim Drücken von AUS – und die Maschine geht in den sicheren Zustand. Wäre AUS ein Schließer, würde ein Drahtbruch unbemerkt bleiben und der Motor ließe sich im Notfall NICHT mehr abschalten. Prüfungs-Schlüsselwort: „Drahtbruchsicherheit“.",
      formula: "AUS / Schutz = Öffner in Reihe → Drahtbruch = AUS",
      source: "Fachkunde Kap. 6 (Blatt 6.1–6.14) / Kap. 15 (Blatt 15.1–15.10, Drahtbruchsicherheit)",
      isWeakSpot: true
    },
    {
      id: "sf-04",
      category: "schuetz_fluidsim",
      question: "Was unterscheidet eine Selbsthaltung vom Tippbetrieb?",
      options: [
        "Bei Selbsthaltung liegt ein Schließer des Schützes (13–14) parallel zum EIN-Taster -S1; das Schütz bleibt nach Loslassen angezogen",
        "Bei Selbsthaltung liegt ein Öffner des Schützes in Reihe zu -S1",
        "Beim Tippbetrieb liegt der Hilfsschließer 13–14 parallel zu -S0",
        "Es gibt keinen Unterschied, nur die Taster sind anders"
      ],
      correctIndex: 0,
      explanation: "Tippbetrieb: Das Schütz ist nur so lange angezogen, wie du -S1 drückst (z. B. Einrichten einer Maschine, Kranfahrt). Selbsthaltung: Ein Hilfsschließer 13–14 des Schützes -Q1 liegt parallel zu -S1. Sobald -Q1 anzieht, überbrückt 13–14 den Taster – du kannst loslassen, das Schütz „hält sich selbst“. Nur ein Öffner in Reihe (-S0, -F2) oder Spannungsausfall beendet die Selbsthaltung. Vorteil: Nach Netzausfall läuft die Maschine NICHT von selbst wieder an (Wiederanlaufschutz).",
      formula: "Selbsthaltung: -Q1 (13–14) ∥ -S1   |   Tippen: nur -S1 ohne Parallelkontakt",
      source: "Fachkunde Kap. 0 (Blatt 0.1–0.11) / Kap. 6 (Blatt 6.1–6.14)",
      isWeakSpot: false
    },
    {
      id: "sf-05",
      category: "schuetz_fluidsim",
      question: "Bei einer Wendeschützschaltung (Rechts -Q1 / Links -Q2): Wozu dient der Öffner 21–22 von -Q2 im Spulenkreis von -Q1?",
      options: [
        "Als Selbsthaltung für -Q1",
        "Als Schützverriegelung: -Q1 kann nicht anziehen, solange -Q2 angezogen ist – sonst Kurzschluss zwischen zwei Außenleitern",
        "Als Motorschutz",
        "Zur Zeitverzögerung beim Umschalten"
      ],
      correctIndex: 1,
      explanation: "Zur Drehrichtungsumkehr tauscht -Q2 zwei Außenleiter (z. B. L1 und L3). Ziehen beide Schütze gleichzeitig an, entsteht ein satter Kurzschluss L1–L3 auf der Hauptstromseite. Darum liegt jeweils ein Öffner des anderen Schützes in Reihe mit der eigenen Spule (gegenseitige Schützverriegelung). Diese Verriegelung ist Pflicht und arbeitet auch, wenn ein Schütz mechanisch „klebt“.",
      formula: "Spulenkreis -Q1: … → -Q2 (21–22) → A1 -Q1   ·   Spulenkreis -Q2: … → -Q1 (21–22) → A1 -Q2",
      source: "Fachkunde Kap. 6 (Blatt 6.1–6.14, Verriegelung & Wendeschützschaltung)",
      isWeakSpot: false
    },
    {
      id: "sf-06",
      category: "schuetz_fluidsim",
      question: "Eine Wendeschützschaltung hat ZUSÄTZLICH zur Schützverriegelung eine Tasterverriegelung. Was ermöglicht diese?",
      options: [
        "Dass beide Schütze gleichzeitig anziehen können",
        "Dass der Motor nur nach Drücken von -S0 umgesteuert werden kann",
        "Direktes Umschalten der Drehrichtung ohne vorher AUS zu drücken: Der Öffner des Gegentasters unterbricht die Selbsthaltung des laufenden Schützes",
        "Sie ersetzt das Motorschutzrelais"
      ],
      correctIndex: 2,
      explanation: "Bei der Tasterverriegelung haben -S1 (Rechts) und -S2 (Links) je einen Schließer UND einen Öffner. Der Öffner von -S2 liegt im Kreis von -Q1 und umgekehrt. Drückst du während Rechtslauf auf „Links“, öffnet zuerst der Öffner von -S2 → -Q1 fällt ab → dann schließt der Schließer von -S2 → -Q2 zieht an. Ergebnis: direktes Umsteuern. Achtung Praxis: Direktes Umsteuern belastet Motor und Mechanik stark (Gegenstrombremsung) – nicht bei jeder Maschine erlaubt. Die Schützverriegelung bleibt trotzdem zwingend!",
      formula: "Doppelte Verriegelung = Schützverriegelung (21–22) + Tasterverriegelung (Öffner der Gegentaster)",
      source: "Fachkunde Kap. 6 (Blatt 6.1–6.14, Wendeschützschaltung)",
      isWeakSpot: false
    },
    {
      id: "sf-07",
      category: "schuetz_fluidsim",
      question: "Automatische Stern-Dreieck-Schützschaltung mit -K1 (Netz), -K2 (Stern), -K3 (Dreieck) und Zeitrelais -K4. Welcher Zustand darf NIE eintreten?",
      options: [
        "-K1 und -K2 gleichzeitig angezogen",
        "-K1 und -K3 gleichzeitig angezogen",
        "-K2 (Stern) und -K3 (Dreieck) gleichzeitig angezogen",
        "-K4 und -K1 gleichzeitig angezogen"
      ],
      correctIndex: 2,
      explanation: "Der Sternschütz verbindet W2–U2–V2 zum Sternpunkt, der Dreieckschütz legt diese Wicklungsenden an L1/L2/L3. Wären beide gleichzeitig zu, schließen sie die Außenleiter über den Sternpunkt kurz. Deshalb: gegenseitige Verriegelung über Öffner (21–22) von -K2 im Kreis von -K3 und umgekehrt. Ablauf: S1 → -K2 (Stern) und -K1 (Netz) ziehen an, -K4 läuft → nach Ablauf (Motor ca. bei Nenndrehzahl) fällt -K2 ab → erst dann zieht -K3 (Dreieck) an. (In neueren Plänen heißen die Leistungsschütze -Q1/-Q2/-Q3 und das Zeitrelais -K1.)",
      formula: "Stern-Schütz ⊻ Dreieck-Schütz (nie gleichzeitig!)   |   I_Anlauf,Y = 1/3 · I_Anlauf,Δ",
      source: "Fachkunde Kap. 6 (Blatt 6.1–6.14, Zeitrelais & Stern-Dreieck-Schützschaltung)",
      isWeakSpot: false
    },
    {
      id: "sf-08",
      category: "schuetz_fluidsim",
      question: "Welches Zeitrelais-Verhalten benötigt man für die automatische Umschaltung von Stern auf Dreieck?",
      options: [
        "Ansprechverzögert: Kontakte schalten erst nach Ablauf der eingestellten Zeit NACH dem Anziehen um",
        "Rückfallverzögert: Kontakte schalten nach Abschalten der Spule verzögert zurück",
        "Taktgeber (Blinkrelais)",
        "Stromstoßrelais"
      ],
      correctIndex: 0,
      explanation: "Das Zeitrelais wird beim Einschalten zusammen mit dem Sternschütz erregt. Nach der eingestellten Anlaufzeit (typisch 3–10 s, bis der Motor fast Nenndrehzahl erreicht hat) öffnet sein verzögerter Öffner den Kreis des Sternschützes, und der verzögerte Schließer gibt den Dreieckschütz frei. Das ist ansprechverzögert (Einschaltverzögerung). Baustelle: Zeit zu kurz → Motor schaltet zu früh auf Dreieck, der Stromstoß ist fast so groß wie beim Direktanlauf und der LS/die Sicherung kommt.",
      formula: "Ansprechverzögert (Einschaltverzögerung): Spule an → t abwarten → Kontakte schalten",
      source: "Fachkunde Kap. 6 (Blatt 6.1–6.14, Zeitrelais)",
      isWeakSpot: false
    },
    {
      id: "sf-09",
      category: "schuetz_fluidsim",
      question: "In FluidSIM läuft deine Selbsthaltung, aber der Motor geht mit -S0 nicht aus. Was ist der wahrscheinlichste Fehler?",
      options: [
        "-S0 wurde als Schließer statt als Öffner eingefügt oder liegt parallel statt in Reihe",
        "Das Motorschutzrelais ist zu hoch eingestellt",
        "Der Hilfsschließer 13–14 fehlt",
        "Die Spule A1–A2 ist falsch herum angeschlossen"
      ],
      correctIndex: 0,
      explanation: "-S0 muss als Öffner IN REIHE vor dem Parallelzweig (-S1 ∥ 13–14) liegen. Liegt -S0 parallel zur Selbsthaltung oder ist er als Schließer gezeichnet, kann er den Kreis nicht unterbrechen. Typischer Simulations-Check: 1. Ruhezustand – alle Öffner geschlossen gezeichnet? 2. Läuft Strom von L+ über -S0 → -F2 → (-S1 ∥ 13–14) → A1 nach M? Fehlt 13–14, wäre es nur Tippbetrieb – der Motor würde dann aber nach Loslassen von -S1 ausgehen.",
      formula: "Reihenfolge Steuerkreis: -F2 (95–96) → -S0 (Ö) → [-S1 (S) ∥ -Q1 (13–14)] → -Q1 (A1–A2)",
      source: "Fachkunde Kap. 6 (Blatt 6.1–6.14) / Kap. 15",
      isWeakSpot: true
    },

    // ───────────────────────── 4. SCHUTZMASSNAHMEN & VDE ─────────────────────────
    {
      id: "sv-01",
      category: "schutz_vde",
      question: "Wie lautet die korrekte Reihenfolge der 5 Sicherheitsregeln nach DIN VDE 0105-100?",
      options: [
        "Spannungsfreiheit feststellen – Freischalten – Erden und kurzschließen – Abdecken – Sichern",
        "Freischalten – gegen Wiedereinschalten sichern – Spannungsfreiheit feststellen – Erden und kurzschließen – benachbarte, unter Spannung stehende Teile abdecken oder abschranken",
        "Freischalten – Erden und kurzschließen – Spannungsfreiheit feststellen – Sichern – Abdecken",
        "Sichern – Freischalten – Abdecken – Spannungsfreiheit feststellen – Erden"
      ],
      correctIndex: 1,
      explanation: "Die Reihenfolge ist zwingend: 1. Freischalten (allpolig, z. B. LS/NH aus). 2. Gegen Wiedereinschalten sichern (Sperrelement, Schloss, Schild). 3. Spannungsfreiheit allpolig feststellen (zweipoliger Spannungsprüfer, vorher/nachher prüfen). 4. Erden und kurzschließen (immer erst erden, dann kurzschließen – in Niederspannungs-Hausinstallationen oft entbehrlich). 5. Benachbarte, unter Spannung stehende Teile abdecken oder abschranken. Wiedereinschalten in umgekehrter Reihenfolge.",
      formula: "Merksatz: „Frei – Sicher – Fest – Erd – Ab“",
      source: "Fachkunde Kap. 1 (Blatt 1.1–1.5, 5 Sicherheitsregeln)",
      isWeakSpot: false
    },
    {
      id: "sv-02",
      category: "schutz_vde",
      question: "Was kennzeichnet ein TN-C-System?",
      options: [
        "Neutralleiter und Schutzleiter sind im gesamten System als PEN-Leiter zusammengefasst; RCDs sind darin nicht einsetzbar",
        "N und PE sind im gesamten System getrennt",
        "Jede Anlage hat ihren eigenen Erder, der Sternpunkt ist nicht geerdet",
        "Das Netz ist vollständig gegen Erde isoliert"
      ],
      correctIndex: 0,
      explanation: "T = Sternpunkt des Trafos direkt geerdet, N = Körper über Schutzleiter mit diesem Erdungspunkt verbunden, C = combined: N und PE als PEN-Leiter in einem Leiter. Ein RCD kann im TN-C nicht funktionieren, weil der Fehlerstrom über den PEN wieder durch den Wandler zurückfließt. PEN nur fest verlegt mit mind. 10 mm² Cu. Heute üblich: TN-C-S – Aufteilung des PEN im Hausanschluss/Zählerschrank in N und PE, ab dann nie wieder zusammenführen!",
      formula: "TN-C: PEN | TN-S: N + PE getrennt | TN-C-S: Aufteilung im HAK/Zählerschrank | PEN ≥ 10 mm² Cu",
      source: "Fachkunde Kap. 11 (Blatt 11.1–11.12, Netzsysteme)",
      isWeakSpot: false
    },
    {
      id: "sv-03",
      category: "schutz_vde",
      question: "Ein Gartenhaus wird über ein TT-System versorgt. Welche Aussage ist richtig?",
      options: [
        "Der Schutzleiter wird vom Netzbetreiber über den PEN mitgeliefert",
        "Die Körper sind über einen eigenen Anlagenerder geerdet; die Abschaltung erfolgt in der Praxis über einen RCD",
        "Im TT-System sind keine Schutzmaßnahmen erforderlich",
        "Im TT-System genügt immer ein LS-Schalter zur Abschaltung"
      ],
      correctIndex: 1,
      explanation: "Im TT-System ist der Trafo-Sternpunkt (erstes T) am Kraftwerk/Ortsnetz geerdet, die Körper der Anlage aber über einen EIGENEN Anlagenerder (zweites T). Der Fehlerstrom fließt über Erdreich zurück – der Widerstand ist zu groß, als dass ein LS sicher in 0,2 s/1 s auslöst. Deshalb wird praktisch immer ein RCD eingesetzt. Bedingung: R_A · I_ΔN ≤ 50 V → mit 30-mA-RCD darf R_A bis 1666 Ω betragen.",
      formula: "TT mit RCD: R_A · I_ΔN ≤ 50 V   →   R_A ≤ 50 V / 0,03 A ≈ 1666 Ω",
      source: "Fachkunde Kap. 11 (Blatt 11.1–11.12)",
      isWeakSpot: false
    },
    {
      id: "sv-04",
      category: "schutz_vde",
      question: "Welche maximale Abschaltzeit gilt im TN-System (U0 = 230 V) für Endstromkreise bis 32 A und welche für Verteilerstromkreise?",
      options: [
        "0,2 s / 1 s",
        "5 s / 0,4 s",
        "0,4 s / 5 s",
        "1 s / 10 s"
      ],
      correctIndex: 2,
      explanation: "Nach DIN VDE 0100-410 gilt im TN-System bei 230 V: Endstromkreise ≤ 32 A (Steckdosen, handgeführte Geräte) müssen innerhalb 0,4 s abschalten, Verteilerstromkreise und Endstromkreise > 32 A innerhalb 5 s. Im TT-System sind die Zeiten kürzer (0,2 s / 1 s). Nachweis über die Schleifenimpedanz: Z_S · I_a ≤ U0. Baustelle: Schleifenimpedanz an der entferntesten Steckdose messen und mit dem Grenzwert des LS vergleichen.",
      formula: "TN, 230 V: ≤ 32 A → 0,4 s | Verteiler/> 32 A → 5 s   ·   Z_S · I_a ≤ U0",
      source: "Fachkunde Kap. 11 (Blatt 11.1–11.12, Abschaltbedingungen)",
      isWeakSpot: false
    },
    {
      id: "sv-05",
      category: "schutz_vde",
      question: "Für eine Wallbox mit möglichem glattem Gleichfehlerstrom (> 6 mA DC) wird welcher Fehlerstromschutz benötigt?",
      options: [
        "RCD Typ AC, 300 mA",
        "RCD Typ A, 30 mA ohne weitere Maßnahme",
        "RCD Typ B, 30 mA (oder Typ A + geeignete 6-mA-DC-Fehlerstromerkennung)",
        "Kein RCD, nur LS-Schalter C32"
      ],
      correctIndex: 2,
      explanation: "Typ A erfasst Wechsel- und pulsierende Gleichfehlerströme. Glatte Gleichfehlerströme (aus Ladeelektronik, Frequenzumrichtern, PV-Wechselrichtern) können einen Typ A „blind machen“ (Vormagnetisierung des Wandlers). Typ B ist allstromsensitiv. Bei Wallboxen: Typ B oder Typ A plus DC-Fehlerstromerkennung (RDC-DD 6 mA), die viele Wallboxen eingebaut haben. 30 mA ist der Zusatzschutz für Steckdosen bis 32 A und Ladepunkte.",
      formula: "Typ A: AC + pulsierend DC | Typ F: + Mischfrequenzen | Typ B: + glatter DC (allstromsensitiv) | Zusatzschutz: I_ΔN ≤ 30 mA",
      source: "Fachkunde Kap. 11 (Blatt 11.1–11.12, RCD) / Kap. 10",
      isWeakSpot: false
    },
    {
      id: "sv-06",
      category: "schutz_vde",
      question: "Wiederholungsprüfung nach DIN VDE 0701-0702 an einem Bohrhammer (Schutzklasse I, Anschlussleitung 4 m). Welcher Schutzleiterwiderstand ist maximal zulässig?",
      options: ["1 Ω", "0,1 Ω", "0,3 Ω", "3,5 Ω"],
      correctIndex: 2,
      explanation: "Für Anschlussleitungen bis 5 m gilt R_PE ≤ 0,3 Ω. Für jede weiteren 7,5 m Leitung kommen 0,1 Ω dazu, maximal 1 Ω. Beim Messen die Leitung über die ganze Länge bewegen (besonders an Knickschutz und Stecker) – ein angebrochener Schutzleiter zeigt sich oft nur als Messwertsprung. Ein Bohrhammer mit 0,8 Ω bei 4 m Leitung fällt durch!",
      formula: "R_PE ≤ 0,3 Ω (bis 5 m) + 0,1 Ω je weitere 7,5 m, max. 1 Ω",
      source: "Fachkunde Kap. 12 (Blatt 12.1–12.18, Geräteprüfung DIN VDE 0701-0702)",
      isWeakSpot: false
    },
    {
      id: "sv-07",
      category: "schutz_vde",
      question: "Welche Mindest-Isolationswiderstände fordert DIN VDE 0701-0702 bei der Geräteprüfung?",
      options: [
        "SK I: ≥ 1 MΩ, SK II: ≥ 2 MΩ (SK I mit Heizelementen: ≥ 0,3 MΩ)",
        "SK I: ≥ 2 MΩ, SK II: ≥ 1 MΩ",
        "Beide Schutzklassen: ≥ 0,5 MΩ",
        "SK I: ≥ 1 kΩ, SK II: ≥ 2 kΩ"
      ],
      correctIndex: 0,
      explanation: "Gemessen wird mit 500 V DC zwischen den kurzgeschlossenen aktiven Leitern (L+N) und PE (SK I) bzw. berührbaren leitfähigen Teilen (SK II). Schutzklasse II hat die höhere Anforderung (2 MΩ), weil dort die Isolierung der EINZIGE Schutz ist – es gibt keinen Schutzleiter. Ausnahme: SK-I-Geräte mit Heizelementen (Wasserkocher, Heizlüfter) dürfen 0,3 MΩ haben – dann muss aber zusätzlich der Schutzleiterstrom gemessen werden.",
      formula: "R_ISO ≥ 1 MΩ (SK I) | ≥ 2 MΩ (SK II) | ≥ 0,3 MΩ (SK I mit Heizelement) | Prüfspannung 500 V DC",
      source: "Fachkunde Kap. 12 (Blatt 12.1–12.18, Geräteprüfung)",
      isWeakSpot: false
    },
    {
      id: "sv-08",
      category: "schutz_vde",
      question: "Welcher Grenzwert gilt nach DIN VDE 0701-0702 für den Schutzleiterstrom I_PE eines Gerätes der Schutzklasse I (allgemein) und welcher für den Berührungsstrom?",
      options: [
        "I_PE ≤ 30 mA, Berührungsstrom ≤ 3,5 mA",
        "I_PE ≤ 10 mA, Berührungsstrom ≤ 1 mA",
        "I_PE ≤ 0,5 mA, Berührungsstrom ≤ 3,5 mA",
        "I_PE ≤ 3,5 mA, Berührungsstrom ≤ 0,5 mA"
      ],
      correctIndex: 3,
      explanation: "Der Schutzleiterstrom (Ableitstrom über PE, z. B. durch Entstörkondensatoren) darf bei SK-I-Geräten allgemein 3,5 mA nicht überschreiten (bei Heizgeräten > 3,5 kW gilt 1 mA/kW, max. 10 mA). Der Berührungsstrom an berührbaren leitfähigen Teilen (vor allem SK II oder nicht mit PE verbundene Teile bei SK I) darf 0,5 mA nicht überschreiten. Baustelle: Viele Geräte an einem 30-mA-RCD addieren ihre Ableitströme – dann löst der RCD scheinbar „grundlos“ aus.",
      formula: "I_PE ≤ 3,5 mA | I_Berühr ≤ 0,5 mA",
      source: "Fachkunde Kap. 12 (Blatt 12.1–12.18, Geräteprüfung)",
      isWeakSpot: false
    },

    // ───────────────────────── 5. LEITUNGSBERECHNUNG ─────────────────────────
    {
      id: "lb-01",
      category: "leitungsberechnung",
      question: "Welche Grundbedingung muss für den Überlastschutz einer Leitung erfüllt sein?",
      options: [
        "I_N ≤ I_b ≤ I_z",
        "I_z ≤ I_N ≤ I_b",
        "I_b ≤ I_N ≤ I_z",
        "I_b ≤ I_z ≤ I_N"
      ],
      correctIndex: 2,
      explanation: "I_b = Betriebsstrom des Verbrauchers, I_N = Nennstrom der Schutzeinrichtung (LS/Sicherung), I_z = zulässige Strombelastbarkeit der Leitung unter den tatsächlichen Verlegebedingungen. Die Sicherung muss größer als der Betriebsstrom sein (sonst löst sie im Normalbetrieb aus) und darf nicht größer als die Belastbarkeit der Leitung sein (sonst schützt sie die Leitung nicht). Zusätzlich gilt I_2 ≤ 1,45 · I_z – bei LS-Schaltern und gG-Sicherungen automatisch erfüllt.",
      formula: "I_b ≤ I_N ≤ I_z   und   I_2 ≤ 1,45 · I_z",
      source: "Fachkunde Kap. 10 (Blatt 10.1–10.11, Leitungsberechnung)",
      isWeakSpot: false
    },
    {
      id: "lb-02",
      category: "leitungsberechnung",
      question: "Eine NYM-J 3×2,5 mm² wird direkt auf/in der Wand (unter Putz, ohne Rohr) verlegt. Welche Verlegeart ist das?",
      options: ["A1", "B1", "C", "E"],
      correctIndex: 2,
      explanation: "Verlegeart C = Leitung direkt auf oder in der Wand (auch im Putz). Übersicht: A1 = Aderleitungen im Rohr in wärmedämmender Wand (schlechteste Kühlung), A2 = mehradrige Leitung im Rohr in wärmedämmender Wand, B1 = Aderleitungen im Rohr auf/in der Wand, B2 = mehradrige Leitung im Rohr auf/in der Wand, C = direkt auf/in der Wand, E = frei in Luft (z. B. Kabelpritsche, mind. 0,3·d Abstand zur Wand). Je besser die Wärmeabfuhr, desto höher I_z: A1 < B2 < B1 < C < E.",
      formula: "A1: Rohr in Dämmung | B1: Adern im Rohr | B2: Mantelleitung im Rohr | C: direkt in/auf Wand | E: frei in Luft",
      source: "Fachkunde Kap. 10 (Blatt 10.1–10.11, Verlegearten)",
      isWeakSpot: false
    },
    {
      id: "lb-03",
      category: "leitungsberechnung",
      question: "Tabellenwert I_r = 30 A. Umgebungstemperatur-Faktor f1 = 0,94, Häufungsfaktor f2 = 0,70. Welchen LS-Schalter darfst du höchstens einsetzen?",
      options: ["B10", "B16", "B20", "B25"],
      correctIndex: 1,
      explanation: "I_z = I_r · f1 · f2 = 30 A · 0,94 · 0,70 = 19,74 A. Der nächstkleinere Normwert, der ≤ I_z ist, ist 16 A → B16. Ein B20 wäre bereits über I_z – die Leitung wäre bei Überlast nicht geschützt. Typischer Prüfungsfehler: Mit I_r direkt (30 A) die Sicherung wählen und die Faktoren vergessen. Baustelle: Mehrere Leitungen gebündelt in einem Kabelkanal oder auf dem Dachboden im Sommer – genau da greifen f1 und f2.",
      formula: "I_z = I_r · f1 · f2 = 30 · 0,94 · 0,70 = 19,74 A → I_N = 16 A",
      source: "Fachkunde Kap. 10 (Blatt 10.1–10.11, Umrechnungsfaktoren)",
      isWeakSpot: false
    },
    {
      id: "lb-04",
      category: "leitungsberechnung",
      question: "Eine Steckdosenzuleitung (Wechselstrom 230 V) ist l = 30 m lang, I = 16 A, cos φ = 1, A = 2,5 mm² Cu (γ = 56 m/(Ω·mm²)). Wie groß ist der Spannungsfall?",
      options: [
        "ca. 3,4 V (1,5 %)",
        "ca. 6,9 V (3,0 %)",
        "ca. 12 V (5,2 %)",
        "ca. 13,7 V (6,0 %)"
      ],
      correctIndex: 1,
      explanation: "Bei Wechselstrom fließt der Strom über Hin- UND Rückleiter, daher der Faktor 2: ΔU = 2 · 30 m · 16 A · 1 / (56 · 2,5 mm²) = 960 / 140 = 6,86 V. Prozentual: 6,86 V / 230 V · 100 % ≈ 3,0 %. Das liegt an der Grenze der Empfehlung (nach DIN 18015-1 max. 3 % zwischen Zähler und Verbraucher). Bei längeren Leitungen auf 4 mm² gehen.",
      formula: "ΔU = (2 · l · I · cos φ) / (γ · A)   |   Δu = ΔU / U · 100 %",
      source: "Fachkunde Kap. 0 / Kap. 10 (Blatt 10.1–10.11, Spannungsfall)",
      isWeakSpot: false
    },
    {
      id: "lb-05",
      category: "leitungsberechnung",
      question: "Drehstromzuleitung zu einer Unterverteilung: l = 50 m, I = 32 A, cos φ = 0,85, A = 6 mm² Cu (γ = 56). Wie groß ist der Spannungsfall?",
      options: [
        "ca. 7,0 V (1,75 %)",
        "ca. 8,1 V (2,0 %)",
        "ca. 14,0 V (3,5 %)",
        "ca. 4,0 V (1,0 %)"
      ],
      correctIndex: 0,
      explanation: "Bei symmetrischem Drehstrom fließt (im Idealfall) kein Rückstrom über N, die Spannungsfälle der Außenleiter sind um 120° verschoben → Faktor √3 statt 2. ΔU = √3 · 50 · 32 · 0,85 / (56 · 6) = 2355,6 / 336 ≈ 7,0 V. Bezogen auf 400 V: 7,0 / 400 · 100 % ≈ 1,75 %. Fehlerfalle: Mit 2 statt √3 rechnen (ergibt 8,1 V) oder auf 230 V statt 400 V beziehen.",
      formula: "ΔU = (√3 · l · I · cos φ) / (γ · A)   |   Δu = ΔU / 400 V · 100 %",
      source: "Fachkunde Kap. 10 (Blatt 10.1–10.11, Spannungsfall Drehstrom)",
      isWeakSpot: false
    },
    {
      id: "lb-06",
      category: "leitungsberechnung",
      question: "In welchem Bereich löst ein LS-Schalter mit B-Charakteristik unverzögert (magnetisch) aus?",
      options: [
        "1,13- bis 1,45-fach I_N",
        "10- bis 20-fach I_N",
        "5- bis 10-fach I_N",
        "3- bis 5-fach I_N"
      ],
      correctIndex: 3,
      explanation: "Der magnetische Kurzschlussauslöser spricht bei B zwischen 3·I_N und 5·I_N an, bei C zwischen 5·I_N und 10·I_N, bei D zwischen 10·I_N und 20·I_N. Für den Nachweis der Abschaltbedingung nimmt man immer den OBEREN Wert (sichere Auslösung): B16 → I_a = 5 · 16 A = 80 A. 1,13/1,45 · I_N sind die Grenzen des thermischen Überlastauslösers (kleiner/großer Prüfstrom).",
      formula: "B: 3–5 · I_N | C: 5–10 · I_N | D: 10–20 · I_N   ·   I_a = oberer Wert",
      source: "Fachkunde Kap. 10 (Blatt 10.1–10.11, LS-Schalter)",
      isWeakSpot: false
    },
    {
      id: "lb-07",
      category: "leitungsberechnung",
      question: "Ein Steckdosenkreis ist mit B16 abgesichert (TN-System, U0 = 230 V). Welche Schleifenimpedanz Z_S darf maximal gemessen werden, damit die Abschaltbedingung (0,4 s) erfüllt ist?",
      options: ["14,4 Ω", "1,44 Ω", "2,88 Ω", "0,72 Ω"],
      correctIndex: 2,
      explanation: "Für sichere Abschaltung innerhalb 0,4 s muss der Kurzschlussstrom den magnetischen Auslöser sicher ansprechen lassen: I_a = 5 · 16 A = 80 A. Z_S ≤ U0 / I_a = 230 V / 80 A = 2,875 Ω ≈ 2,88 Ω. Bei C16 wäre I_a = 160 A → Z_S ≤ 1,44 Ω. Baustelle: In der Praxis rechnet man wegen Erwärmung der Leiter oft mit 2/3 des Wertes als Messgrenze (ca. 1,92 Ω für B16).",
      formula: "Z_S ≤ U0 / I_a = 230 V / (5 · 16 A) = 2,88 Ω",
      source: "Fachkunde Kap. 11 (Blatt 11.1–11.12, Abschaltbedingungen) / Kap. 10",
      isWeakSpot: false
    },
    {
      id: "lb-08",
      category: "leitungsberechnung",
      question: "Für eine Kreissäge mit hohem Anlaufstrom löst der B16 beim Einschalten ständig aus. Welche Lösung ist fachgerecht (Leitung 2,5 mm², I_z ≥ 16 A, Abschaltbedingung erfüllt)?",
      options: [
        "B20 einsetzen",
        "C16 einsetzen, nachdem geprüft wurde, dass Z_S ≤ 1,44 Ω ist",
        "LS-Schalter überbrücken",
        "B10 einsetzen"
      ],
      correctIndex: 1,
      explanation: "Der Nennstrom darf wegen I_N ≤ I_z nicht erhöht werden. Die C-Charakteristik löst erst bei 5–10 · I_N magnetisch aus und verträgt damit Einschaltströme von Motoren, Trafos und vielen LED-Netzteilen. ABER: Weil I_a = 10 · 16 A = 160 A, muss die Schleifenimpedanz kleiner sein (Z_S ≤ 1,44 Ω) – bei langen Leitungen nachmessen!",
      formula: "C16: I_a = 160 A → Z_S ≤ 230 V / 160 A = 1,44 Ω",
      source: "Fachkunde Kap. 10 (Blatt 10.1–10.11, LS-Charakteristiken)",
      isWeakSpot: false
    },
    {
      id: "lb-09",
      category: "leitungsberechnung",
      question: "Warum steht beim Spannungsfall für Wechselstrom der Faktor 2, bei Drehstrom aber √3 in der Formel?",
      options: [
        "Weil Drehstrom eine höhere Frequenz hat",
        "Bei Wechselstrom fließt der Strom über Hin- und Rückleiter (doppelte Länge); bei symmetrischem Drehstrom ist N stromlos und die Leiterspannungsfälle sind um 120° verschoben",
        "Weil Kupfer bei Drehstrom besser leitet",
        "Der Faktor hängt nur vom cos φ ab"
      ],
      correctIndex: 1,
      explanation: "Wechselstrom: Strom geht über L hin und über N zurück → wirksame Leiterlänge 2 · l. Drehstrom (symmetrisch): Kein Strom auf N, der Spannungsfall je Leiter ist l · I · cos φ / (γ · A); bezogen auf die Leiterspannung (400 V) kommt durch die 120°-Verschiebung der Faktor √3 hinzu. Merke: Faktor 2 → Bezug 230 V; Faktor √3 → Bezug 400 V.",
      formula: "1~: ΔU = 2·l·I·cos φ / (γ·A) → Bezug 230 V   |   3~: ΔU = √3·l·I·cos φ / (γ·A) → Bezug 400 V",
      source: "Fachkunde Kap. 2 (Blatt 2.1–2.10) / Kap. 10",
      isWeakSpot: false
    },

    // ───────────────────────── 6. ELEKTRONIK & DIGITALTECHNIK ─────────────────────────
    {
      id: "ed-01",
      category: "elektronik_digital",
      question: "Ein Kunde tauscht Halogen gegen LED-Retrofits. Welches Dimmverfahren ist für die meisten LED-Lampen/-Treiber (kapazitives Verhalten) geeignet?",
      options: [
        "Phasenanschnitt (Leading Edge)",
        "Phasenabschnitt (Trailing Edge)",
        "Pulsweitenmodulation über den Neutralleiter",
        "Ein Vorwiderstand"
      ],
      correctIndex: 1,
      explanation: "LED-Treiber haben am Eingang Kondensatoren → kapazitive Last. Beim Phasenanschnitt wird die Spannung mitten in der Halbwelle schlagartig eingeschaltet – die steile Flanke erzeugt im Kondensator hohe Stromspitzen (I = C · du/dt) → Flackern, Brummen, Zerstörung von Treiber oder Dimmer. Phasenabschnitt schaltet sanft am Nulldurchgang ein und schneidet die Halbwelle hinten ab – ideal für kapazitive Lasten (LED, elektronische Trafos). Phasenanschnitt passt zu ohmschen und induktiven Lasten (Glühlampe, konventioneller Trafo).",
      formula: "Phasenanschnitt: R, L (induktiv) | Phasenabschnitt: R, C (kapazitiv, LED) | Universaldimmer: R, L, C (erkennt Last)",
      source: "GP Teil 1 So 24 (Dimmer-Kennlinien, Anlagen) / Fachkunde Kap. 9 (Blatt 9.1–9.24)",
      isWeakSpot: false
    },
    {
      id: "ed-02",
      category: "elektronik_digital",
      question: "Ein Phasenanschnittdimmer schaltet in jeder Halbwelle erst bei 90° ein. Woran erkennst du das auf dem Oszilloskop?",
      options: [
        "Die Sinuskurve beginnt bei 0°, wird bei 90° abgeschnitten und fällt senkrecht auf 0",
        "Die Spannung ist bis 90° null und springt dann senkrecht auf den Momentanwert (Scheitelwert), danach folgt sie dem Sinus bis 180°",
        "Die Frequenz verdoppelt sich auf 100 Hz",
        "Die Kurve wird zu einer Gleichspannung"
      ],
      correctIndex: 1,
      explanation: "PhasenANschnitt: Der ANFANG der Halbwelle wird weggeschnitten. Der Triac zündet beim Zündwinkel α (hier 90°) und die Spannung springt senkrecht hoch – bei 90° genau auf den Scheitelwert 325 V. Phasenabschnitt ist spiegelbildlich: Die Halbwelle beginnt bei 0° normal und wird beim Abschaltwinkel senkrecht abgeschnitten (MOSFET/IGBT). Bei α = 90° wird in beiden Fällen etwa die halbe Leistung an einen ohmschen Verbraucher abgegeben.",
      formula: "Anschnitt = vorne weg (Triac, Zündwinkel α) | Abschnitt = hinten weg (MOSFET/IGBT)",
      source: "GP Teil 1 So 24 / Fachkunde Kap. 9 (Blatt 9.1–9.24, Thyristor/Triac, Dimmer)",
      isWeakSpot: false
    },
    {
      id: "ed-03",
      category: "elektronik_digital",
      question: "Ein Brückengleichrichter B2U wird mit 50 Hz Wechselspannung gespeist. Welche Frequenz hat die pulsierende Ausgangsspannung und wie viele Dioden werden benötigt?",
      options: [
        "50 Hz, 2 Dioden",
        "300 Hz, 6 Dioden",
        "150 Hz, 6 Dioden",
        "100 Hz, 4 Dioden"
      ],
      correctIndex: 3,
      explanation: "Die B2U (Zweipuls-Brückenschaltung, Graetz-Brücke) besteht aus 4 Dioden und richtet beide Halbwellen gleich: Aus 50 Hz werden 2 Pulse pro Periode → 100 Hz Brummfrequenz. Pro Halbwelle leiten immer 2 Dioden in Reihe (Spannungsverlust ca. 2 · 0,7 V). Ohne Glättung: U_d ≈ 0,9 · U (arithmetischer Mittelwert). Mit Ladekondensator: Leerlauf bis √2 · U. Die E1U (Einweg, 1 Diode) liefert nur 50 Hz.",
      formula: "B2U: 4 Dioden, f_Brumm = 2 · f = 100 Hz, U_d ≈ 0,9 · U, Û = √2 · U",
      source: "Fachkunde Kap. 0 (Blatt 0.1–0.11, B2U) / Kap. 9 (Blatt 9.1–9.24, Gleichrichter)",
      isWeakSpot: false
    },
    {
      id: "ed-04",
      category: "elektronik_digital",
      question: "Ein B6U-Gleichrichter (Drehstrombrücke) wird am 400-V-Netz betrieben. Welche Aussage ist richtig?",
      options: [
        "4 Dioden, 100 Hz Welligkeit, U_d ≈ 360 V",
        "3 Dioden, 50 Hz Welligkeit, U_d ≈ 565 V",
        "6 Dioden, 150 Hz Welligkeit, U_d ≈ 230 V",
        "6 Dioden, 300 Hz Welligkeit, U_d ≈ 1,35 · 400 V ≈ 540 V"
      ],
      correctIndex: 3,
      explanation: "Die B6U besteht aus 6 Dioden und erzeugt 6 Pulse pro Periode → 6 · 50 Hz = 300 Hz. Die Welligkeit ist so gering, dass oft keine große Glättung nötig ist. Ideeller Gleichspannungsmittelwert U_di ≈ 1,35 · U_L = 540 V. Genau das findest du im Zwischenkreis jedes Frequenzumrichters (FU) – ca. 540–565 V DC. Achtung Baustelle: Zwischenkreiskondensatoren nach dem Abschalten erst entladen lassen (Wartezeit auf dem FU beachten)!",
      formula: "B6U: 6 Dioden, f = 6 · 50 Hz = 300 Hz, U_di ≈ 1,35 · U_L",
      source: "Fachkunde Kap. 9 (Blatt 9.1–9.24, Gleichrichter)",
      isWeakSpot: false
    },
    {
      id: "ed-05",
      category: "elektronik_digital",
      question: "Bei welcher Eingangskombination liefert ein NAND-Gatter mit zwei Eingängen am Ausgang „0“?",
      options: [
        "A = 0, B = 0",
        "A = 0, B = 1",
        "A = 1, B = 0",
        "A = 1, B = 1"
      ],
      correctIndex: 3,
      explanation: "NAND = NICHT-UND. Ein UND gibt nur bei A = 1 UND B = 1 eine 1 aus – das NAND invertiert das: Nur bei A = B = 1 ist der Ausgang 0, in allen anderen Fällen 1. Merkhilfe: „NAND sagt nur NEIN, wenn ALLE JA sagen.“ Das NAND ist universell – aus NAND-Gattern lässt sich jede andere Logikfunktion aufbauen.",
      formula: "NAND: Q = ¬(A ∧ B)   |   De Morgan: ¬(A ∧ B) = ¬A ∨ ¬B",
      source: "Fachkunde Kap. 9 (Blatt 9.1–9.24, Schaltalgebra & Digitaltechnik)",
      isWeakSpot: false
    },
    {
      id: "ed-06",
      category: "elektronik_digital",
      question: "Bei welcher Eingangskombination liefert ein NOR-Gatter mit zwei Eingängen am Ausgang „1“?",
      options: [
        "Nur bei A = 0 und B = 0",
        "Nur bei A = 1 und B = 1",
        "Wenn mindestens ein Eingang 1 ist",
        "Wenn genau ein Eingang 1 ist"
      ],
      correctIndex: 0,
      explanation: "NOR = NICHT-ODER. Ein ODER gibt 1 aus, sobald mindestens ein Eingang 1 ist. Das NOR invertiert: Nur wenn ALLE Eingänge 0 sind, ist der Ausgang 1. „Genau ein Eingang 1“ wäre XOR (Exklusiv-ODER, typische Wechselschaltung). Praxisbeispiel NOR: Eine Warnleuchte „Anlage in Ruhe“ leuchtet nur, wenn weder Motor 1 noch Motor 2 läuft.",
      formula: "NOR: Q = ¬(A ∨ B)   |   De Morgan: ¬(A ∨ B) = ¬A ∧ ¬B",
      source: "Fachkunde Kap. 9 (Blatt 9.1–9.24, Schaltalgebra & Digitaltechnik)",
      isWeakSpot: false
    },
    {
      id: "ed-07",
      category: "elektronik_digital",
      question: "Eine Presse darf nur laufen, wenn der Bediener ZWEI Taster gleichzeitig drückt (Zweihandbedienung). Welche Grundverknüpfung ist das in der LOGO!?",
      options: ["ODER (OR)", "XOR", "NOR", "UND (AND)"],
      correctIndex: 3,
      explanation: "Der Ausgang darf nur 1 werden, wenn Taster 1 UND Taster 2 betätigt sind → UND-Verknüpfung. In der Schütztechnik entspricht UND einer Reihenschaltung von Schließern, ODER einer Parallelschaltung (z. B. Selbsthaltung: -S1 ODER 13–14). Hinweis Praxis: Echte Zweihandsteuerungen nach Sicherheitsnorm brauchen zusätzlich Gleichzeitigkeitsüberwachung (< 0,5 s) und zertifizierte Sicherheitsbausteine – im Prüfungsbeispiel reicht das UND.",
      formula: "UND = Reihenschaltung (Q = A ∧ B) | ODER = Parallelschaltung (Q = A ∨ B)",
      source: "Fachkunde Kap. 9 (Schaltalgebra) / Kap. 15 (Blatt 15.1–15.10, LOGO!)",
      isWeakSpot: false
    },
    {
      id: "ed-08",
      category: "elektronik_digital",
      question: "Ein RS-Glied (Selbsthalterelais) in der LOGO! bekommt gleichzeitig S = 1 und R = 1. Was passiert?",
      options: [
        "Q = 1, weil Setzen Vorrang hat",
        "Q = 0, weil beim LOGO!-RS-Glied das Rücksetzen Vorrang hat (rücksetzdominant)",
        "Q wechselt ständig zwischen 0 und 1",
        "Die LOGO! geht in STOP"
      ],
      correctIndex: 1,
      explanation: "Das RS-Glied speichert einen Zustand: S = 1 setzt Q auf 1, und Q bleibt 1, auch wenn S wieder 0 ist (Software-Selbsthaltung). R = 1 setzt Q zurück auf 0. Sind beide gleichzeitig 1, entscheidet die Dominanz – bei der LOGO! ist das RS-Glied rücksetzdominant: Q = 0. Das ist sicherheitstechnisch sinnvoll: AUS (Reset) muss immer stärker sein als EIN – genau wie -S0 in der Schützschaltung, der vor der Selbsthaltung in Reihe liegt.",
      formula: "S = 1 → Q = 1 (gespeichert) | R = 1 → Q = 0 | S = R = 1 → Q = 0 (rücksetzdominant)",
      source: "Fachkunde Kap. 15 (Blatt 15.1–15.10, RS-Speicher)",
      isWeakSpot: false
    },
    {
      id: "ed-09",
      category: "elektronik_digital",
      question: "Der AUS-Taster -S0 einer LOGO!-Steuerung ist drahtbruchsicher als Öffner an Eingang I1 angeschlossen. Wie muss I1 im Programm abgefragt werden?",
      options: [
        "Als Schließer-Abfrage: Im Normalbetrieb ist I1 = 1 (Öffner geschlossen); bei Betätigung ODER Drahtbruch wird I1 = 0 → Ausgang aus. Im Programm wird I1 daher negiert an R des RS-Glieds geführt",
        "Gar nicht, Öffner können an SPS-Eingängen nicht verwendet werden",
        "I1 direkt an den Set-Eingang des RS-Glieds",
        "Als Öffner-Abfrage direkt an S, weil der Taster ein Öffner ist"
      ],
      correctIndex: 0,
      explanation: "Hardware: -S0 ist ein Öffner → im Ruhezustand geschlossen → I1 hat ständig Signal 1. Wird -S0 gedrückt ODER reißt das Kabel, fällt I1 auf 0. Im Programm brauchst du also „Reset, wenn I1 = 0“ → I1 über ein NICHT-Gatter (Negation) an den R-Eingang. Häufiger Fehler: In der Software einen Schließer-AUS-Taster annehmen – dann merkt die Steuerung einen Drahtbruch nicht. Die Drahtbruchsicherheit wird IMMER in der Hardware (Öffner) realisiert, nicht in der Software.",
      formula: "Hardware Öffner → Ruhe I1 = 1 → Programm: R = ¬I1",
      source: "Fachkunde Kap. 15 (Blatt 15.1–15.10, Drahtbruchsicherheit)",
      isWeakSpot: true
    }
  ],

  cheatSheets: [
    {
      id: "cs-drehstrom_motoren",
      category: "drehstrom_motoren",
      title: "Drehstrom & Motoren",
      formulas: [
        { label: "Leiter- und Strangspannung (Stern)", formula: "U_L = √3 · U_Str → 400 V = 1,73 · 230 V" },
        { label: "Leiter- und Strangstrom (Dreieck)", formula: "I_L = √3 · I_Str → I_Str = 0,58 · I_L" },
        { label: "Drehstromleistung", formula: "P = √3 · U · I · cos φ" },
        { label: "Stern vs. Dreieck (gleiche R)", formula: "P_Δ = 3 · P_Y   |   I_Anlauf,Y = 1/3 · I_Anlauf,Δ" },
        { label: "Synchrondrehzahl", formula: "n_s = f · 60 / p (3000 / 1500 / 1000 / 750 min⁻¹)" },
        { label: "Schlupf", formula: "s = (n_s − n) / n_s · 100 %" },
        { label: "Motorschutz im Strang (Y-Δ)", formula: "I_Einstell = 0,58 · I_N" }
      ],
      siteTip: "Vor dem Anklemmen IMMER erst das Typenschild lesen: Steht „Δ 230 / Y 400 V“, kommt die waagerechte Sternbrücke W2–U2–V2 drauf – fertig, kein Y-Δ-Anlauf. Nur „Δ 400 / Y 690 V“ darf am 400-V-Netz in Dreieck laufen bzw. Y-Δ anlaufen. Drehrichtung falsch? Zwei Außenleiter tauschen.",
      mnemonics: [
        "Die kleine Zahl auf dem Schild ist die Wicklungsspannung – nicht „Wechselstrom“!",
        "Y-Δ-Anlauf am 400-V-Netz nur mit „Δ 400 V“ auf dem Schild.",
        "Δ-Brücken senkrecht (3 Stück), Y-Brücke waagerecht (W2–U2–V2).",
        "Symmetrische Last → N stromlos. N-Bruch bei Schieflast → kleinster Verbraucher kriegt fast 400 V.",
        "Asynchron = Schlupf, Synchron = genau n_s."
      ]
    },
    {
      id: "cs-antennen_dvb",
      category: "antennen_dvb",
      title: "Antennen, DVB & Pegelrechnung",
      formulas: [
        { label: "Pegel an der Dose", formula: "dBµV_Ende = dBµV_Start + Verstärkung (dB) − Dämpfungen (dB)" },
        { label: "Kabeldämpfung", formula: "a_Kabel = l · a' (z. B. 20 m · 0,2 dB/m = 4 dB)" },
        { label: "Spannungsverhältnis", formula: "a = 20 · log(U2/U1) → +6 dB = 2 · U, +20 dB = 10 · U" },
        { label: "Leistungsverhältnis", formula: "a = 10 · log(P2/P1) → +3 dB = 2 · P" },
        { label: "Sat-ZF", formula: "950–2150 MHz (LO 9,75 / 10,6 GHz)" },
        { label: "LNB-Steuerung", formula: "13/14 V = vertikal, 18 V = horizontal, 22 kHz = High-Band" },
        { label: "Antennenerdung (DIN VDE 0855-1)", formula: "≥ 16 mm² Cu | PA Schirme ≥ 4 mm² Cu | M_Biege ≤ 1650 Nm" }
      ],
      siteTip: "Pegelplan von oben nach unten aufschreiben: Startwert in dBµV, dann jede Komponente als +/− dB-Zeile darunter – wie ein Kassenzettel. Freie Verteiler-Ausgänge immer mit 75 Ω abschließen, F-Stecker sauber abisolieren (kein Schirmgeflecht-Härchen am Innenleiter!).",
      mnemonics: [
        "Verstärker = Plus, alles andere (Kabel, Verteiler, Abzweiger, Dose) = Minus.",
        "Nur der Startwert hat „µV“ – Verstärkung und Dämpfung sind reine dB.",
        "Multischalter = Stern: ein Ausgang, ein Teilnehmer.",
        "TV-Koax = 75 Ω, offene Enden abschließen.",
        "IPTV / 10 Gbit/s: Klasse EA (Cat 6A-Komponenten, Cat 7-Kabel) nach DIN EN 50173.",
        "Erdung 16, Potentialausgleich 4, Mast max. 1650 Nm."
      ]
    },
    {
      id: "cs-schuetz_fluidsim",
      category: "schuetz_fluidsim",
      title: "Schützsteuerungen & FluidSIM",
      formulas: [
        { label: "Kontakt-Ziffern", formula: "Öffner x1–x2 | Schließer x3–x4 | MSR 95–96 (Ö), 97–98 (S) | Spule A1–A2" },
        { label: "Selbsthaltung", formula: "-F2 (95–96) → -S0 (Ö) → [-S1 (S) ∥ -Q1 (13–14)] → -Q1 (A1–A2)" },
        { label: "Schützverriegelung (Wende)", formula: "-Q2 (21–22) in Reihe vor Spule -Q1 und umgekehrt" },
        { label: "Stern-Dreieck automatisch", formula: "S1 → Netz + Stern + Zeitrelais → t → Stern ab → Dreieck an" },
        { label: "Zeitrelais für Y-Δ", formula: "ansprechverzögert (Einschaltverzögerung)" }
      ],
      siteTip: "Beim Fehlersuchen im Schaltschrank dem Strompfad mit dem Finger von L+ bis M (bzw. L bis N) folgen und an jeder Klemme messen. Läuft der Motor nach Loslassen von EIN nicht weiter: 13–14 prüfen. Geht er mit AUS nicht aus: Liegt -S0 wirklich als Öffner in Reihe?",
      mnemonics: [
        "Schaltplan = Ruhezustand: nichts gedrückt, nichts unter Spannung.",
        "Öffner ist in Ruhe ZU – er öffnet beim Betätigen.",
        "AUS und Schutz immer als Öffner in Reihe → Drahtbruch = AUS (Ruhestromprinzip).",
        "Selbsthaltung: Schließer 13–14 parallel zum EIN-Taster.",
        "Wende- und Stern-/Dreieckschütz: NIE beide gleichzeitig – gegenseitig mit 21–22 verriegeln."
      ]
    },
    {
      id: "cs-schutz_vde",
      category: "schutz_vde",
      title: "Schutzmaßnahmen & VDE-Prüfung",
      formulas: [
        { label: "5 Sicherheitsregeln", formula: "Freischalten – Sichern – Spannungsfreiheit feststellen – Erden & Kurzschließen – Abdecken" },
        { label: "Abschaltbedingung TN", formula: "Z_S · I_a ≤ U0 | ≤ 32 A: 0,4 s | Verteiler: 5 s" },
        { label: "TT mit RCD", formula: "R_A · I_ΔN ≤ 50 V" },
        { label: "RCD-Typen", formula: "A: AC + puls. DC | F: + Mischfrequenz | B: + glatter DC" },
        { label: "Geräteprüfung R_PE", formula: "≤ 0,3 Ω (bis 5 m) + 0,1 Ω / 7,5 m, max. 1 Ω" },
        { label: "Geräteprüfung R_ISO (500 V DC)", formula: "SK I ≥ 1 MΩ | SK II ≥ 2 MΩ | SK I mit Heizung ≥ 0,3 MΩ" },
        { label: "Ableitströme", formula: "I_PE ≤ 3,5 mA | Berührungsstrom ≤ 0,5 mA" }
      ],
      siteTip: "Spannungsfreiheit nur mit zweipoligem Spannungsprüfer feststellen – vorher und nachher an einer bekannten Spannungsquelle testen. Beim Prüfen nach 0701-0702 die Anschlussleitung während der R_PE-Messung durchbiegen, besonders am Knickschutz. Fehlauslösender RCD? Erst Ableitströme der angeschlossenen Geräte zusammenrechnen.",
      mnemonics: [
        "„Frei – Sicher – Fest – Erd – Ab“ (5 Sicherheitsregeln).",
        "TN-C: PEN – kein RCD möglich. PEN nach der Aufteilung nie wieder zusammenführen.",
        "Steckdosen ≤ 32 A: 30-mA-RCD als Zusatzschutz.",
        "Wallbox/FU/PV: Typ B oder Typ A + 6-mA-DC-Erkennung.",
        "SK II braucht MEHR Isolation (2 MΩ), weil kein PE da ist."
      ]
    },
    {
      id: "cs-leitungsberechnung",
      category: "leitungsberechnung",
      title: "Leitungsberechnung & Überstromschutz",
      formulas: [
        { label: "Grundbedingung", formula: "I_b ≤ I_N ≤ I_z   und   I_2 ≤ 1,45 · I_z" },
        { label: "Belastbarkeit", formula: "I_z = I_r · f1 (Temperatur) · f2 (Häufung)" },
        { label: "Spannungsfall Wechselstrom", formula: "ΔU = 2 · l · I · cos φ / (56 · A) → Bezug 230 V" },
        { label: "Spannungsfall Drehstrom", formula: "ΔU = √3 · l · I · cos φ / (56 · A) → Bezug 400 V" },
        { label: "Prozentual", formula: "Δu = ΔU / U · 100 % (DIN 18015-1: ≤ 3 % ab Zähler)" },
        { label: "LS-Auslösung magnetisch", formula: "B: 3–5 · I_N | C: 5–10 · I_N | D: 10–20 · I_N" },
        { label: "Max. Schleifenimpedanz", formula: "Z_S ≤ U0 / I_a → B16: 2,88 Ω | C16: 1,44 Ω" }
      ],
      siteTip: "Vor dem Leitungsziehen klären: Wie wird verlegt (Rohr in Dämmung = A1 ist der schlechteste Fall!), wie viele Leitungen liegen gebündelt, wird es warm (Dachboden)? Lange Strecken zu Garage, Wallbox oder Gartenhaus immer auf Spannungsfall nachrechnen – dann lieber gleich einen Querschnitt größer.",
      mnemonics: [
        "Betrieb ≤ Sicherung ≤ Leitung.",
        "Kühlung schlecht → I_z klein: A1 < B2 < B1 < C < E.",
        "Wechselstrom Faktor 2 (hin + zurück), Drehstrom √3.",
        "Für die Abschaltbedingung immer den OBEREN Auslösewert nehmen (B = 5 · I_N, C = 10 · I_N).",
        "Hoher Einschaltstrom → C-Charakteristik, aber Z_S neu prüfen."
      ]
    },
    {
      id: "cs-elektronik_digital",
      category: "elektronik_digital",
      title: "Elektronik & Digitaltechnik",
      formulas: [
        { label: "Dimmer-Zuordnung", formula: "Anschnitt: R, L | Abschnitt: R, C (LED) | Universal: R, L, C" },
        { label: "B2U", formula: "4 Dioden, 100 Hz, U_d ≈ 0,9 · U, Û = √2 · U" },
        { label: "B6U", formula: "6 Dioden, 300 Hz, U_di ≈ 1,35 · U_L ≈ 540 V" },
        { label: "UND / ODER", formula: "Q = A ∧ B (Reihe) | Q = A ∨ B (parallel)" },
        { label: "NAND / NOR", formula: "Q = ¬(A ∧ B) | Q = ¬(A ∨ B)" },
        { label: "De Morgan", formula: "¬(A ∧ B) = ¬A ∨ ¬B | ¬(A ∨ B) = ¬A ∧ ¬B" },
        { label: "RS-Glied (LOGO!)", formula: "S → Q = 1 speichern | R → Q = 0 | S = R = 1 → Q = 0" }
      ],
      siteTip: "LED flackert oder brummt am Dimmer? Erst prüfen, ob es ein Phasenabschnitt- oder Universaldimmer ist und ob die Mindestlast erreicht wird – viele alte Dimmer brauchen 20–60 W Grundlast. Beim FU vor Arbeiten am Zwischenkreis (≈ 540 V DC!) die angegebene Entladezeit abwarten und nachmessen.",
      mnemonics: [
        "LED = kapazitiv = PhasenABschnitt.",
        "ANschnitt schneidet vorne, ABschnitt schneidet hinten.",
        "NAND sagt nur NEIN, wenn alle JA sagen. NOR sagt nur JA, wenn alle NEIN sagen.",
        "UND = Reihe, ODER = parallel.",
        "AUS-Taster als Öffner an der SPS → im Programm negiert an Reset (Drahtbruchsicherheit in Hardware!)."
      ]
    }
  ]
};
