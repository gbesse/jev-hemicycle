// Cas limite : une probabilité intermédiaire ne fait pas osciller l’état suivi.
import assert from "node:assert/strict";
import { evaluateDocument } from "../src/index.mjs";
import { createFakeProvider } from "../src/jev.mjs";

const jev = createFakeProvider(() => ({
  model: "jev-1.13.0",
  answers: { relevant: { type: "noul", noul: 0.5 } },
  usage: { input_tokens: 50, output_tokens: 0 },
}));
const resultat = await evaluateDocument(
  {
    id: "amdt-43",
    text: "Mesure connexe à la réparabilité.",
    sourceUrl: "https://example.test/amdt-43",
  },
  { id: "reparation", description: "Droit à la réparation" },
  jev,
  "relevant",
);
assert.equal(resultat.state, "relevant");
assert.equal(resultat.uncertain, true);
console.log(JSON.stringify(resultat, null, 2));
