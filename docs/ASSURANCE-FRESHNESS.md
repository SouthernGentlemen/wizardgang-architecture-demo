# Assurance freshness evaluation

Freshness policy, observation state, lifecycle state, and deployment provenance are separate assurance concepts. Freshness policy continues to describe how evidence becomes current or requires replacement; lifecycle continues to describe governed record state; deployment provenance continues to identify the deployed source revision.

`src/assurance/observation-window.js` is the single authority for interpreting a stored observation window in both runtime presentation and Node integrity validation. Callers supply an explicit clock when deterministic evaluation is required and translate the returned state for their own boundary without repeating timestamp comparisons.

A stored observation window is the half-open interval `[observedAt, validUntil)`:

- before `observedAt`: `not-yet-observed`;
- exactly at `observedAt`: `current`;
- after `observedAt` and before `validUntil`: `current`;
- exactly at `validUntil`: `expired`;
- after `validUntil`: `expired`.

When either boundary is declared, both must be valid date-times and `validUntil` must be strictly after `observedAt`. Reversed and zero-length windows are invalid. A partial or unparsable window is invalid. An invalid explicit clock is reported as an invalid evaluation rather than changing window semantics.

Records that declare neither `observedAt` nor `validUntil` do not have a stored observation window and are preserved. This includes observation-bound live-route evidence whose policy requires observing the live locator at use time rather than treating a previous stored observation as current state.

Runtime publication presents only the derived observation state and declared timestamps. Integrity validation converts the same shared state into validation errors, including staleness at the exact `validUntil` boundary. The public freshness-policy meanings in `src/assurance/presentation.ts` remain unchanged.
