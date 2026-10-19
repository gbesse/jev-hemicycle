import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchAssemblyDocuments, evaluateDocument } from '../src/index.mjs';
const url = 'https://www.assemblee-nationale.fr/dyn/17/textes/synthetic';
const rss = (guid, title, description) => `<rss><channel><item><guid>${guid}</guid><title>${title}</title><description>${description}</description><link>${url}</link></item></channel></rss>`;
test('known RSS truncation is retained and blocks semantic transitions without a call', async () => {
  const [doc] = await fetchAssemblyDocuments({ fetchImpl: async () => new Response(rss('synthetic', 'Budget', 'x'.repeat(21000))) });
  assert.equal(doc.text.length, 20000); assert.deepEqual(doc.truncation, { title: false, text: true });
  for (const lang of ['fr','en','es']) {
    const result = await evaluateDocument(doc, { id: 'topic', description: 'synthetic topic' }, { decide() { assert.fail('must not call'); } }, 'relevant', { lang });
    assert.equal(result.state, 'relevant'); assert.equal(result.transition, null);
    assert.equal(result.probability, null); assert.equal(result.requiresReview, true); assert.equal(result.reason, 'truncated_text');
  }
});
test('title display truncation alone does not imply that full context was truncated', async () => {
  const [doc] = await fetchAssemblyDocuments({ fetchImpl: async () => new Response(rss('synthetic', 'a'.repeat(1100), 'short')) });
  assert.deepEqual(doc.truncation, { title: true, text: false }); assert.equal(doc.text.length, 1106);
  let calls=0;const result=await evaluateDocument(doc,{id:'topic',description:'synthetic'},{async decide(){calls++;return {answers:{relevant:{type:'noul',noul:.9}}};}});
  assert.equal(calls,1);assert.equal(result.state,'relevant');
});
test('overlong source identifiers are rejected instead of colliding after truncation', async () => {
  await assert.rejects(fetchAssemblyDocuments({ fetchImpl: async () => new Response(rss('a'.repeat(501), 'Title', 'Text')) }), /identifier too long/);
});
test('malformed truncation metadata cannot bypass review', async () => {
  await assert.rejects(evaluateDocument({id:'doc',text:'Text',sourceUrl:url,truncation:{title:false,text:'true'}},{id:'t',description:'topic'},{decide(){assert.fail('must not call');}}), /truncation/);
});
