# Deterministic engine boundary

Stage 0 defines contracts in `src/domain/contracts.ts`; no ranking engine is implemented.
Future pure functions accept explicit inputs and return `DecisionEvaluation`.
They must not import React, fetch data, read clocks, use randomness, or invoke AI.
Validate inputs, filter eligibility, build common complete scenarios, apply fixed
candidate-independent references, then calculate losses and regret. Preserve ties.
Use the same calculation for sensitivity, counterfactual branches, and certificates.
Independent reference tests must not call the production function to obtain expected values.
