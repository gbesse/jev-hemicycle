// Objectif : implémenter la frontière de décision métier propre au dépôt.
import { XMLParser } from "fast-xml-parser";

export const ASSEMBLY_FEED =
  "https://www2.assemblee-nationale.fr/feeds/detail/documents-parlementaires";

const array = (value) =>
  value === undefined ? [] : Array.isArray(value) ? value : [value];
const plain = (value) => {
  if (typeof value === "string" || typeof value === "number")
    return String(value);
  if (value && typeof value === "object")
    return String(value["#text"] ?? value.__cdata ?? "");
  return "";
};
const stripMarkup = (value) =>
  plain(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

function officialAssemblyUrl(value) {
  const url = new URL(plain(value));
  if (
    url.protocol !== "https:" ||
    !(
      url.hostname === "assemblee-nationale.fr" ||
      url.hostname.endsWith(".assemblee-nationale.fr")
    )
  )
    throw new TypeError("Assembly feed contains a non-official link");
  return url.href;
}

/** Fetch and normalize the official Assemblée nationale parliamentary-publications RSS feed. */
export async function fetchAssemblyDocuments({
  limit = 20,
  fetchImpl = globalThis.fetch,
  timeoutMs = 15_000,
} = {}) {
  if (!(Number.isInteger(limit) && limit >= 1 && limit <= 50))
    throw new TypeError("limit must be an integer between 1 and 50");
  if (typeof fetchImpl !== "function")
    throw new TypeError("fetchImpl must be a function");
  const response = await fetchImpl(ASSEMBLY_FEED, {
    headers: {
      accept: "application/xml, application/rss+xml;q=0.9",
      "user-agent":
        "jev-hemicycle/0.2 (+https://github.com/gbesse/jev-hemicycle)",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok)
    throw new Error(`Assembly feed unavailable (${response.status})`);
  const parsed = new XMLParser({
    ignoreAttributes: false,
    processEntities: true,
  }).parse(await response.text());
  const seen = new Set();
  const documents = [];
  for (const item of array(parsed?.rss?.channel?.item)) {
    const sourceUrl = officialAssemblyUrl(item.link);
    const id = plain(item.guid) || sourceUrl;
    if (String(id).length > 500)
      throw new TypeError('Identifiant RSS trop long ; aucune troncation silencieuse / RSS identifier too long; no silent truncation / Identificador RSS demasiado largo; sin truncado silencioso');
    if (seen.has(id)) continue;
    seen.add(id);
    const title = stripMarkup(item.title);
    if (!title) continue;
    const description = stripMarkup(item.description);
    const fullText = `${title}\n${description}`;
    const parsedDate = item.pubDate ? new Date(plain(item.pubDate)) : null;
    documents.push({
      id: String(id),
      kind: "parliamentary-publication",
      title: title.slice(0, 1000),
      text: fullText.slice(0, 20_000),
      truncation: { title: title.length > 1000, text: fullText.length > 20_000 },
      sourceUrl,
      date:
        parsedDate && !Number.isNaN(parsedDate.valueOf())
          ? parsedDate.toISOString()
          : null,
      source: "Assemblée nationale",
    });
    if (documents.length === limit) break;
  }
  if (!documents.length)
    throw new Error("Assembly feed contains no usable document");
  return documents;
}

export function document(input) {
  if (!input?.id || !input?.text || !input?.sourceUrl)
    throw new TypeError("document needs id, text and sourceUrl");
  const truncation = input.truncation === undefined ? { title: false, text: false } : input.truncation;
  if (!truncation || typeof truncation !== 'object' || Array.isArray(truncation) || typeof truncation.title !== 'boolean' || typeof truncation.text !== 'boolean')
    throw new TypeError('Reçu de troncation invalide / Invalid truncation receipt / Recibo de truncado no válido');
  return {
    id: String(input.id),
    kind: String(input.kind || "document"),
    title: String(input.title || ""),
    text: String(input.text),
    sourceUrl: String(input.sourceUrl),
    date: input.date || null,
    truncation: { title: truncation.title, text: truncation.text },
  };
}
export async function evaluateDocument(
  input,
  topic,
  provider,
  previous = "unknown",
  options = {},
) {
  const on = options.onThreshold ?? 0.8, off = options.offThreshold ?? 0.2;
  if (!Number.isFinite(on) || !Number.isFinite(off) || !(off >= 0 && off < on && on <= 1))
    throw new TypeError("Seuils invalides / Thresholds must satisfy 0 <= off < on <= 1 / Umbrales no válidos");
  if (!['unknown','relevant','irrelevant'].includes(previous))
    throw new TypeError('État précédent invalide / Invalid previous state / Estado anterior no válido');
  const lang = options.lang ?? 'en';
  const prompts = {
    fr: {instructions:'Ce document parlementaire concerne-t-il matériellement le sujet suivi, sa mise en œuvre, son financement, ses bénéficiaires, ses obligations ou son abrogation ? Une simple coïncidence de mots-clés est fausse.', criteria:{true:'Affecte matériellement le sujet',false:'Lien accessoire ou absent'}},
    en: {instructions:'Does this parliamentary document materially address the monitored topic, its implementation, funding, beneficiaries, obligations, or repeal? Mere keyword overlap is false.', criteria:{true:'Materially affects the topic',false:'Only incidental or unrelated'}},
    es: {instructions:'¿Este documento parlamentario aborda materialmente el tema seguido, su aplicación, financiación, beneficiarios, obligaciones o derogación? La mera coincidencia de palabras clave es falsa.',criteria:{true:'Afecta materialmente al tema',false:'Relación incidental o inexistente'}},
  };
  if (!Object.hasOwn(prompts, lang)) throw new TypeError('Langue invalide / Invalid language / Idioma inválido: fr, en, es');
  try { topic = structuredClone(topic); } catch { throw new TypeError('Sujet non copiable / Topic cannot be snapshotted / Tema no copiable'); }
  const doc = document(input);
  if (!topic?.id || !topic?.description)
    throw new TypeError("topic needs id and description");
  if (doc.truncation.text)
    return { document: doc, topicId: topic.id, probability: null, state: previous,
      transition: null, uncertain: true, requiresReview: true,
      reason: 'truncated_text', deterministic: true };
  const r = await provider.decide({
    state: { document: structuredClone(doc), topic: structuredClone(topic) },
    questions: {
      relevant: {
        type: "noul",
        instructions: prompts[lang].instructions,
        criteria: { ...prompts[lang].criteria },
      },
    },
  });
  const answer = r?.answers?.relevant;
  const p = answer?.noul;
  if (answer?.type !== 'noul' || !Number.isFinite(p) || p < 0 || p > 1)
    throw new TypeError('Probabilité hors contrat / Probability out of contract / Probabilidad fuera de contrato');
  let state = previous;
  if (p >= on) state = "relevant";
  else if (p <= off) state = "irrelevant";
  const transition = state === previous ? null : { from: previous, to: state };
  return {
    document: doc,
    topicId: topic.id,
    probability: p,
    state,
    transition,
    uncertain: p > off && p < on,
    usage: r.usage,
  };
}
export async function runCli(argv, io = console) {
  io.log(
    JSON.stringify(
      {
        documents: argv,
        next: "Use evaluateDocument with normalized Assemblée nationale data.",
      },
      null,
      2,
    ),
  );
}
