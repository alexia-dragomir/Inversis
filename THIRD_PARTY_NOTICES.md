# Third-party software

Stage 1 extraction uses [h5wasm 0.10.3](https://github.com/usnistgov/h5wasm), pinned
as a development-only dependency. It reads authentic NetCDF4/HDF5 files offline and
is not included in the application bundle. See its LICENSE.txt for NIST and bundled
third-party terms.

Independent precipitation validation uses h5py 3.15.1 (BSD-3-Clause), NumPy 2.3.5
(BSD-3-Clause) and the bundled HDF5 library. Exact reader versions are retained in
the oracle output; Python requirements are pinned in `requirements-validation.txt`.
These are local/CI scientific validation tools, not shipped application dependencies.

Installed versions from package metadata; complete transitive versions are pinned in package-lock.json. Runtime packages: React, React DOM and Scheduler. All other direct entries below are build/test/lint tooling.

| Package | Version | License | Source |
| --- | --- | --- | --- |
| react | 19.3.1 | MIT | https://react.dev/ |
| react-dom | 19.3.1 | MIT | https://react.dev/ |
| @eslint/js | 10.0.1 | MIT | https://eslint.org |
| @types/node | 26.6.6 | MIT | https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/node |
| @types/react | 19.3.0 | MIT | https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react |
| @types/react-dom | 19.3.0 | MIT | https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react-dom |
| @vitejs/plugin-react | 6.3.0 | MIT | https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-react#readme |
| eslint | 10.15.0 | MIT | https://eslint.org |
| eslint-plugin-react-hooks | 7.1.1 | MIT | https://react.dev/ |
| typescript | 6.0.3 | Apache-2.0 | https://www.typescriptlang.org/ |
| typescript-eslint | 8.72.2 | MIT | https://typescript-eslint.io/packages/typescript-eslint |
| vite | 8.3.8 | MIT | https://vite.dev |
| vitest | 5.1.0 | MIT | https://vitest.dev |
| scheduler | 0.28.0 | MIT | https://react.dev/ |

Official configuration reference consulted: https://vitest.dev/config/.
License terms remain in each installed package. The project owner's original
Inversis logo and banner are bundled; their provenance is in `public/brand/README.md`.
No NASA logos, flags, mission insignia or external font assets are bundled.
OpenAI Codex and Firecrawl were used during development; see docs/AI_USE.md.
