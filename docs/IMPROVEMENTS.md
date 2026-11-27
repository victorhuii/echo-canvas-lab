# Research and improvements

The original [Echo Canvas submission](https://devpost.com/software/echo-canvas-ujzksi), by Kevin Yang, describes a spatial acoustics authoring workbench. It links a deployed demo. No verified original public repository was located in the November 27, 2026 search; unrelated projects named Echo Canvas were excluded. Public-source availability can change.

## Implemented here

- **No paid authoring dependency:** deterministic presets and complete manual editing work without an API key.
- **Revision-safe updates:** one in-flight geometry job, one coalesced pending scene, a current-revision gate, and muted output while computation is pending.
- **Recoverable editing:** independent per-mode storage, validated import/export, and 50-step undo/redo.
- **Explicit local audio:** assets never leave the tab; missing attachments are visibly silent; replacing an attachment releases the old generator.
- **Useful A/B behavior:** Raw mode mutes the wet tail and spatial paths, with its loudness difference documented.
- **Bounded operation:** counts, dimensions, attachment sizes, duration, history, path count, and feedback gains are limited.
- **Testable layers:** pure geometry, the actual worker module, graph lifecycle, editor handlers, and local HTTP serving have separate checks.

## Good next steps

1. Run browser listening and accessibility sessions on multiple browser/OS combinations. No perceptual result is established by mocked graph tests.
2. Compare impulse responses against measured test rooms and document error by frequency. Replace illustrative material coefficients with sourced, frequency-dependent measurements.
3. Add an explicitly versioned engine-interchange format with coordinate-system and unit tests.
4. Improve doorway routing beyond center points, including visibility around finite-wall ends. Treat diffraction as a separately validated model.
5. Add constrained optional AI authoring only after schema acceptance, cost limits, and server-side credential handling are designed. The present build makes no AI-generation claim.

These are future recommendations, not shipped capabilities. The original project's roadmap and claims remain its author's work; this repository is an independent implementation with a narrower model.
