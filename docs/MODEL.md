# Acoustic model

## Geometry

Coordinates are meters: x across the plan, y down the plan, and z upward. The browser audio graph maps these to x, height, and negative plan-y. Listener yaw is measured in the plan; exactly one listener is active.

A direct path is a line segment. Enabled finite wall intersections are tested against wall height. An enabled doorway admits intersections within its horizontal width and vertical opening; a path above a low wall is unobstructed. Collinear wall overlaps are treated conservatively as intersections. Degenerate endpoints and grazing boundaries remain approximations.

If the line is blocked, a bounded visibility graph connects the source, listener, and enabled opening centers. Dijkstra selects the shortest visible route. The last opening becomes the apparent source direction. Without such a route, transmission loss from intersected wall presets attenuates and low-passes the direct path. This routing approximates an audible portal effect; it does not model wave diffraction or guarantee the globally shortest physical propagation path around wall ends.

First-order specular reflections use mirrored-source geometry and reject blocked legs, out-of-bounds hit points, and hits through openings. Rectangular room sides and enabled finite partitions participate. The 3D mode also considers floor and ceiling planes. At most six strongest eligible paths per source are rendered. Multiple-bounce specular paths, scattering, phase interference, diffraction, and arbitrary meshes are omitted. [Allen and Berkley's image-method paper](https://doi.org/10.1121/1.382599) is a primary reference for the general technique; this small implementation is not a reproduction or validation of that paper's full method.

## Distance and materials

Path amplitude follows `10^(-lossDb/20) / (1 + distance)`, multiplied by source gain. Reflection gain adds a factor `0.35 * sqrt(1 - absorption)`. These are practical authoring approximations, not measured frequency-dependent transfer functions. Browser panner distance rolloff is disabled so the graph does not apply distance attenuation twice.

| Preset | Broadband absorption | Transmission loss |
| --- | --- | --- |
| Concrete | 0.08 | 26 dB |
| Wood | 0.20 | 15 dB |
| Curtain | 0.60 | 7 dB |
| Absorber | 0.90 | 10 dB |

The labels are illustrative. Real materials depend on thickness, mounting, frequency, openings, and construction. Do not use these values for compliance or acoustic engineering decisions.

## Reverb and playback

A Sabine-style estimate uses `0.161 * volume / equivalent absorption area`, bounded to 0.15–4 seconds. It includes the six room faces, both sides of partitions, and a simple open-door loss term. It is a rough scene descriptor. It does not certify diffuse-field assumptions or predict the exact decay of the rendered four-comb tail.

The audio graph uses browser [PannerNode HRTF](https://developer.mozilla.org/en-US/docs/Web/API/PannerNode), filtered and delayed direct/reflection paths, a damped feedback tail, output gain, and compression. Gain and spatial parameters ramp over 25 ms. A graph is created on user-requested playback and reused during edits. Local file decoding may create a suspended context before playback; it does not start a source. [AudioContext documentation](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext).

Raw mode is dry mono: path gains and the global wet output are muted. It is not loudness-normalized against the simulated result. A/B judgments should account for level differences.

## Revision contract

Every accepted scene edit increments a revision and clears prior diagnostics. The output is muted while new geometry is pending. At most one worker job is in flight; additional edits replace a single pending job. Worker results affect paths and audio only when their revision matches the current scene. The audio engine independently checks revision, scene mode, and active listener.

An unavailable worker uses the same deterministic engine on the main thread and labels that fallback. An error does not become a stale successful result. No model operates in the geometry or audio path.

## Scene contract and local assets

Version 1 requires exactly the documented object fields, unique safe IDs, finite bounded numeric values, supported materials, consistent wall/door dimensions, and an existing active listener. Imports are limited to 1 MB. Counts are bounded to 8 sources, 4 listeners, and 12 walls; history retains 50 edits per mode.

File assets use local IDs. They are absent from JSON exports and browser scene storage; reattachment is required. A missing asset remains silent and labeled. Audio files are limited to 20 MB, mono/stereo, and two minutes. A tab holds at most 16 decoded asset IDs. Reloading clears audio buffers.

## Verification

Tests use analytically checkable distances and mirror paths, open/closed/overhead wall cases, strict import counterexamples, out-of-order revisions, real worker-thread execution of the worker module, graph lifecycle assertions, and a DOM integration run against actual editor markup. They do not replace browser listening, calibrated measurements, or real-time performance benchmarks. No latency, fidelity, certification, or detection-accuracy result is claimed.
