import { parseExercises } from './src/utils/mdxParser';

const mdx = `---
title: "Zeiten: Vertiefung"
description: "Plusquamperfekt und Futur II"
---

# Plusquamperfekt & Futur II

Wir schauen uns seltenere, aber wichtige Zeiten an.

## 1. Plusquamperfekt (Vorvergangenheit)
Handlung war **vor** einer anderen Handlung in der Vergangenheit.
*   "Nachdem er gegessen **hatte**, ging er schlafen." (Essen war *vor* dem Schlafen).
*   Bildung: **hatte/war** + **Partizip II**.

## 2. Futur II (Vollendete Zukunft)
Handlung wird in der Zukunft **abgeschlossen sein** (oder Vermutung über Vergangenheit).
*   "Morgen um 10 Uhr **werde** ich die Arbeit **beendet haben**."
*   Bildung: **werden** + **Partizip II** + **haben/sein**.

---

### Übung 1: Welche Zeit ist das?

<Quiz answer="2" direction="horizontal">
  Er hatte schon geschlafen.
  <Option>Perfekt</Option>
  <Option>Plusquamperfekt</Option>
  <Option>Präteritum</Option>
</Quiz>

<Quiz answer="3" direction="horizontal">
  Sie wird angekommen sein.
  <Option>Futur I</Option>
  <Option>Perfekt</Option>
  <Option>Futur II</Option>
</Quiz>

---

### Übung 2: Plusquamperfekt bilden

Ergänzen Sie die Hilfsverben im Präteritum (hatte/war).

<InlineBlanks>
1. Sie [war] schon gegangen, als ich kam. (sein)
2. Wir [hatten] den Film schon gesehen. (haben)
3. Er [war] eingeschlafen. (sein)
</InlineBlanks>

---

### Übung 3: Reihenfolge

<Matching direction="left" pairs={[
  { left: "Zuerst gegessen, dann geschlafen", right: "Nachdem ich gegessen hatte, schlief ich." },
  { left: "Zuerst gelernt, dann Prüfung", right: "Nachdem ich gelernt hatte, schrieb ich die Prüfung." }
]} />
`;

const exercises = parseExercises(mdx);
console.log('Found exercises:', exercises.length);
exercises.forEach((ex, i) => {
    console.log(`${i}: ${ex.type} (start: ${ex.startIndex})`);
});
