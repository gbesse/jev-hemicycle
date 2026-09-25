// Purpose: Verify parliamentary relevance hysteresis.
import test from "node:test";
import assert from "node:assert/strict";
import {
  ASSEMBLY_FEED,
  evaluateDocument,
  fetchAssemblyDocuments,
} from "../src/index.mjs";
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

const rss = (link = "https://www.assemblee-nationale.fr/dyn/17/textes/l17b1234_projet-loi") => `<?xml version="1.0"?><rss><channel>
  <item><guid>doc-1</guid><title>Projet &amp; mobilité</title><description><![CDATA[<p>Un texte sur les transports.</p>]]></description><link>${link}</link><pubDate>Wed, 23 Sep 2026 10:00:00 GMT</pubDate></item>
  <item><guid>doc-1</guid><title>Doublon</title><description>x</description><link>${link}</link></item>
  <item><guid>doc-2</guid><title>Budget</title><description>Crédits publics</description><link>https://assemblee-nationale.fr/dyn/17/textes/l17b5678</link></item>
</channel></rss>`;

test("fetches, normalizes, limits and deduplicates the official Assembly feed", async () => {
  let requested;
  const documents = await fetchAssemblyDocuments({
    limit: 2,
    fetchImpl: async (url, options) => {
      requested = { url, options };
      return new Response(rss(), { status: 200 });
    },
  });
  assert.equal(requested.url, ASSEMBLY_FEED);
  assert.equal(documents.length, 2);
  assert.deepEqual(documents[0], {
    id: "doc-1",
    kind: "parliamentary-publication",
    title: "Projet & mobilité",
    text: "Projet & mobilité\nUn texte sur les transports.",
    sourceUrl:
      "https://www.assemblee-nationale.fr/dyn/17/textes/l17b1234_projet-loi",
    date: "2026-09-23T10:00:00.000Z",
    source: "Assemblée nationale",
  });
});

test("refuses non-official links and bad limits from the Assembly feed", async () => {
  await assert.rejects(
    fetchAssemblyDocuments({
      fetchImpl: async () => new Response(rss("https://example.com/phishing")),
    }),
    /non-official link/,
  );
  await assert.rejects(fetchAssemblyDocuments({ limit: 0 }), /between 1 and 50/);
});
