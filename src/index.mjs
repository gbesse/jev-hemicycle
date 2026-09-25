// Purpose: Fetch official Assemblée nationale publications and evaluate them against monitored topics with hysteresis.
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
    if (seen.has(id)) continue;
    seen.add(id);
    const title = stripMarkup(item.title);
    if (!title) continue;
    const description = stripMarkup(item.description);
    const parsedDate = item.pubDate ? new Date(plain(item.pubDate)) : null;
    documents.push({
      id: String(id).slice(0, 500),
      kind: "parliamentary-publication",
      title: title.slice(0, 1000),
      text: `${title}\n${description}`.slice(0, 20_000),
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
  return {
    id: String(input.id),
    kind: String(input.kind || "document"),
    title: String(input.title || ""),
    text: String(input.text),
    sourceUrl: String(input.sourceUrl),
    date: input.date || null,
  };
}
export async function evaluateDocument(
  input,
  topic,
  provider,
  previous = "unknown",
  options = {},
) {
  const doc = document(input);
  if (!topic?.id || !topic?.description)
    throw new TypeError("topic needs id and description");
  const r = await provider.decide({
    state: { document: doc, topic },
    questions: {
      relevant: {
        type: "noul",
        instructions:
          "Does this parliamentary document materially address the monitored topic, its implementation, funding, beneficiaries, obligations, or repeal? Mere keyword overlap is false.",
        criteria: {
          true: "Materially affects the topic",
          false: "Only incidental or unrelated",
        },
      },
    },
  });
  const p = r.answers.relevant.noul,
    on = options.onThreshold ?? 0.8,
    off = options.offThreshold ?? 0.2;
  if (!(off >= 0 && off < on && on <= 1))
    throw new TypeError("Thresholds must satisfy 0 <= off < on <= 1");
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
