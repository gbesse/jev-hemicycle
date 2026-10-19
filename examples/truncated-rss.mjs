// Purpose: Keep known-truncated parliamentary snippets in review without a model request.
import assert from 'node:assert/strict';
import { fetchAssemblyDocuments, evaluateDocument } from '../src/index.mjs';
const xml = `<rss><channel><item><guid>synthetic-long</guid><title>Budget synthétique</title><description>${'x'.repeat(21000)}</description><link>https://www.assemblee-nationale.fr/dyn/synthetic</link></item></channel></rss>`;
const [document] = await fetchAssemblyDocuments({ fetchImpl: async () => new Response(xml) });
const result = await evaluateDocument(document, { id: 'synthetic-topic', description: 'synthetic policy' }, { decide() { throw Error('unexpected provider call'); } });
assert.equal(result.reason, 'truncated_text'); assert.equal(result.probability, null); assert.equal(result.transition, null);
console.log(JSON.stringify({ synthetic: true, description: { fr: 'Extrait connu comme tronqué : revue sans transition ni appel Jev.', en: 'Known-truncated excerpt: review without transition or Jev call.', es: 'Extracto truncado conocido: revisión sin transición ni llamada Jev.' }, truncation: document.truncation, state: result.state, reason: result.reason }, null, 2));
