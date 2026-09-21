# How it decides

Jev Hémicycle evaluates new amendments, debates and votes against a narrow monitoring topic, emitting transitions only when relevance crosses configured hysteresis thresholds.

The exact question and criteria live beside the call in [src/index.mjs](../src/index.mjs), making review and version control straightforward. Dates, identifiers, arithmetic, candidate generation, thresholds and state transitions remain code-owned. Synthetic demo probabilities are illustrative. Calibrate review thresholds on representative human labels before operational use.
