// Purpose: Demonstrate a parliamentary relevance transition offline.
import { evaluateDocument } from "../src/index.mjs";
import { createFakeProvider } from "../src/jev.mjs";
const p = createFakeProvider(() => ({
  model: "jev-1.13.0",
  answers: { relevant: { type: "noul", noul: 0.91 } },
  usage: { input_tokens: 80, output_tokens: 0 },
}));
console.log(
  await evaluateDocument(
    {
      id: "amdt-42",
      kind: "amendment",
      title: "Repairability",
      text: "Creates a repairability obligation for household appliances.",
      sourceUrl: "https://example.test/amdt-42",
    },
    { id: "repair", description: "Right to repair electronic devices" },
    p,
  ),
);
