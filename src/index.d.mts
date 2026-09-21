// Purpose: Describe parliamentary documents and monitored-topic transitions.
import type { JevProvider } from "./jev.mjs";
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
