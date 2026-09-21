// Purpose: Verify parliamentary relevance hysteresis.
import test from "node:test";
import assert from "node:assert/strict";
import { evaluateDocument } from "../src/index.mjs";
import { createFakeProvider } from "../src/jev.mjs";
const d = { id: "1", text: "x", sourceUrl: "https://x.test" },
  t = { id: "t", description: "topic" };
test("turns relevant above threshold", async () => {
  const p = createFakeProvider(() => ({
    model: "jev-1.13.0",
    answers: { relevant: { type: "noul", noul: 0.9 } },
    usage: { input_tokens: 1, output_tokens: 0 },
  }));
  assert.deepEqual((await evaluateDocument(d, t, p)).transition, {
    from: "unknown",
    to: "relevant",
  });
});
test("holds prior state in uncertain band", async () => {
  const p = createFakeProvider(() => ({
    model: "jev-1.13.0",
    answers: { relevant: { type: "noul", noul: 0.5 } },
    usage: { input_tokens: 1, output_tokens: 0 },
  }));
  assert.equal((await evaluateDocument(d, t, p, "relevant")).state, "relevant");
});
test("rejects inverted hysteresis thresholds", async () => {
  const p = createFakeProvider(() => ({
    model: "jev-1.13.0",
    answers: { relevant: { type: "noul", noul: 0.5 } },
    usage: { input_tokens: 1, output_tokens: 0 },
  }));
  await assert.rejects(
    evaluateDocument(d, t, p, "unknown", {
      onThreshold: 0.2,
      offThreshold: 0.8,
    }),
    /Thresholds/,
  );
});
