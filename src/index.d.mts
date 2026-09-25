// Purpose: Describe parliamentary documents and monitored-topic transitions.
import type { JevProvider } from "./jev.mjs";
export const ASSEMBLY_FEED: "https://www2.assemblee-nationale.fr/feeds/detail/documents-parlementaires";
export interface ParliamentaryDocument {
  id: string;
  kind: "parliamentary-publication";
  title: string;
  text: string;
  sourceUrl: string;
  date: string | null;
  source: "Assemblée nationale";
}
export function fetchAssemblyDocuments(options?: {
  limit?: number;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}): Promise<ParliamentaryDocument[]>;
export function document(input: any): {
  id: string;
  kind: string;
  title: string;
  text: string;
  sourceUrl: string;
  date: string | null;
};
export function evaluateDocument(
  input: any,
  topic: { id: string; description: string },
  provider: JevProvider,
  previous?: string,
  options?: { onThreshold?: number; offThreshold?: number },
): Promise<any>;
export function runCli(
  argv: string[],
  io?: { log(value: string): void },
): Promise<void>;
