// Objectif : démontrer la frontière de décision sans appel réseau.
import assert from "node:assert/strict";
import { evaluateDocument } from "../src/index.mjs";
import { createFakeProvider } from "../src/jev.mjs";
const p = createFakeProvider(() => ({
  model: "jev-1.13.0",
  answers: { relevant: { type: "noul", noul: 0.91 } },
  usage: { input_tokens: 80, output_tokens: 0 },
}));
const resultat = await evaluateDocument(
  {
    id: "amdt-42",
    kind: "amendment",
    title: "Réparabilité",
    text: "Crée une obligation de réparabilité pour les appareils ménagers.",
    sourceUrl: "https://example.test/amdt-42",
  },
  {
    id: "repair",
    description: "Droit à la réparation des appareils électroniques",
  },
  p,
);
assert.equal(resultat.state, "relevant");
console.log(JSON.stringify(resultat, null, 2));
