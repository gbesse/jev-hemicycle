// Purpose: Evaluate sourced parliamentary documents against monitored topics with hysteresis.
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
