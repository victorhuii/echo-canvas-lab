# Design choices

Echo Canvas Lab — implementation rationale and tradeoffs.

| Choice | Why it fits this project | Cost or boundary |
| --- | --- | --- |
| Deterministic bounded geometry | Make acoustic-path approximations visible and testable. | This is not architectural acoustic certification. |
| Worker revisions and audio lifecycle gates | Keep edits, diagnostics and audible parameters synchronized and reject stale results. | Browser audio/listening behavior still needs device-specific validation. |
| Browser-local WebAudio | Avoid hardware, upload services and paid generative calls. | Perceptual routing does not reproduce a full physical room solver. |

## Evidence and scope

Original code inspired by Kevin Yang; geometry and audio lifecycle checks. Inspired by Kevin Yang; no verified upstream source or original award ownership claimed.

Ownership: **Independent educational recreation**. Attribution and source notices remain in the [README](../README.md).

See [architecture](ARCHITECTURE.md) and [portfolio notes](PORTFOLIO.md) for implementation details and existing evidence. This documentation update does not add a new benchmark or training run.
