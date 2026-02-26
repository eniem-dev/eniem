# [eniem-cli-v1.5.0](https://github.com/eniem-dev/eniem/compare/eniem-cli-v1.4.0...eniem-cli-v1.5.0) (2026-02-26)


### Bug Fixes

* **cli:** always show tool activity in plan/build commands ([9f30312](https://github.com/eniem-dev/eniem/commit/9f30312ee2f286efdd5aef5c8369716459f89abb))
* **cli:** capture stderr from adapter subprocesses for better error messages ([3d414be](https://github.com/eniem-dev/eniem/commit/3d414be72dcbd0f054bfcbcd5521d1fd85c85d5d))
* **cli:** close stdin for non-claude adapters to unblock stdout streaming ([e75e221](https://github.com/eniem-dev/eniem/commit/e75e22189f61c7f513a1cd8cee17a12094f5d5ea))
* **cli:** fix codex adapter to match real JSON event format ([ed18507](https://github.com/eniem-dev/eniem/commit/ed185073d71d68738f386820bbae76fcd40603bd))
* **cli:** fix gemini adapter JSON event parsing to match real output ([2cf4720](https://github.com/eniem-dev/eniem/commit/2cf4720dae0aa7df8add3ea0f53ba4df3d0379d9))
* **cli:** normalize tool names in verbose output across all adapters ([c4f4da9](https://github.com/eniem-dev/eniem/commit/c4f4da9565fa5efde400b02dee0ae579952d93f6))
* **cli:** remove invalid -q flag from opencode adapter ([46647f7](https://github.com/eniem-dev/eniem/commit/46647f796229a3e30accf60371390444b2ddd99d))


### Features

* **multi-cli-adapters:** add --cli flag to plan/build commands ([9f69096](https://github.com/eniem-dev/eniem/commit/9f69096ed56f183f145d6e682e78e48495c8ef0a))
* **multi-cli-adapters:** add config show and config set subcommands ([a5960d5](https://github.com/eniem-dev/eniem/commit/a5960d5b9b89b91b5e38a129bda61a45af4df2d1))
* **multi-cli-adapters:** create adapter registry with getAdapter and listAvailable ([5b5365e](https://github.com/eniem-dev/eniem/commit/5b5365e43bf0c9357bb6bb571df19e6a4d6a6084))
* **multi-cli-adapters:** create Claude adapter implementing CLIAdapter ([675e72d](https://github.com/eniem-dev/eniem/commit/675e72dfac2ba849cb858fee0061e482e5913dfb))
* **multi-cli-adapters:** create CLI resolver with flag > config > default resolution ([060da97](https://github.com/eniem-dev/eniem/commit/060da97f83c8904511751560ad1e37d2faa9bcc6))
* **multi-cli-adapters:** create Codex adapter implementing CLIAdapter ([b71ebb3](https://github.com/eniem-dev/eniem/commit/b71ebb345e9c87a2dd20e80567b489a35b2902dd))
* **multi-cli-adapters:** create ConfigCommand with interactive CLI picker ([869b7c1](https://github.com/eniem-dev/eniem/commit/869b7c17dcd247ff01eec741ddd692be870878fa))
* **multi-cli-adapters:** create eni-config lib for .eni/config.json read/write/validate ([8949bce](https://github.com/eniem-dev/eniem/commit/8949bce52617b14d57299c324ecfde7520dfdb12))
* **multi-cli-adapters:** create FirstRunPrompt component for initial CLI config ([9fca5e5](https://github.com/eniem-dev/eniem/commit/9fca5e522c034036799fada9be7cba34f499cb35))
* **multi-cli-adapters:** create Gemini adapter implementing CLIAdapter ([428a805](https://github.com/eniem-dev/eniem/commit/428a8057afe128f58821966b500e51f72b9a4e5d))
* **multi-cli-adapters:** create MissingBinaryFallback component for CLI picker ([349a889](https://github.com/eniem-dev/eniem/commit/349a8895c0b17b4558438676ca9967e0b226907c))
* **multi-cli-adapters:** create OpenCode adapter implementing CLIAdapter ([de4d444](https://github.com/eniem-dev/eniem/commit/de4d4446cc3f56d5096f3646cc6dfe395587ac2d))
* **multi-cli-adapters:** define CLIAdapter interface and shared types ([d1d98bd](https://github.com/eniem-dev/eniem/commit/d1d98bd884b70724f6bb885ac0696d63aed4b3b4))
* **multi-cli-adapters:** integrate resolver, first-run, fallback, and CLI indicator into plan/build ([2c3485e](https://github.com/eniem-dev/eniem/commit/2c3485ec27d96cb2a659fc55f102ef77da05d97e))
* **multi-cli-adapters:** wire adapter registry into BuildCommand replacing runClaude ([1007e90](https://github.com/eniem-dev/eniem/commit/1007e90033ddf096e82e12d414e34f5077353755))
* **multi-cli-adapters:** wire adapter registry into PlanCommand ([43ad73b](https://github.com/eniem-dev/eniem/commit/43ad73b442a0f9f0455fd86cdac3cc9a5b7620f9))

# [eniem-cli-v1.4.0](https://github.com/eniem-dev/eniem/compare/eniem-cli-v1.3.0...eniem-cli-v1.4.0) (2026-02-23)


### Features

* trigger release after squash merge ([2d9efe2](https://github.com/eniem-dev/eniem/commit/2d9efe26c14d851f6f0da389ae1381c1e6a08ddd))

# [eniem-cli-v1.3.0](https://github.com/eniem-dev/eniem/compare/eniem-cli-v1.2.0...eniem-cli-v1.3.0) (2026-02-14)


### Features

* 6-polar-config-dedicated-folder ([#28](https://github.com/eniem-dev/eniem/issues/28)) ([e999e70](https://github.com/eniem-dev/eniem/commit/e999e70a8a5fcf89a186b8e3eeef701b6bcaad97))

# [eniem-cli-v1.2.0](https://github.com/eniem-dev/eniem/compare/eniem-cli-v1.1.0...eniem-cli-v1.2.0) (2026-02-13)


### Features

* cleanup AI workflow artifacts from sub-projects ([#21](https://github.com/eniem-dev/eniem/issues/21)) ([#26](https://github.com/eniem-dev/eniem/issues/26)) ([4de92a0](https://github.com/eniem-dev/eniem/commit/4de92a00597d96aa540fe6443959523af9ba6140))

# [eniem-cli-v1.1.0](https://github.com/eniem-dev/eniem/compare/eniem-cli-v1.0.0...eniem-cli-v1.1.0) (2026-02-13)


### Features

* consolidate CLAUDE.md into AGENTS.md with symlinks ([#25](https://github.com/eniem-dev/eniem/issues/25)) ([2f59d6b](https://github.com/eniem-dev/eniem/commit/2f59d6b04ab6e7db573a10270ba677f6abd0fd0c))

# eniem-cli-v1.0.0 (2026-02-12)


### Features

* 1-migrate-repos — Import all repos via git subtree ([#1](https://github.com/eniem-dev/eniem/issues/1)) ([43222c6](https://github.com/eniem-dev/eniem/commit/43222c6bf4013b128ad122f0bc74230be336fa09))
* 2-post-migration-config — configure package names, remove duplicate workflows, setup semantic-release ([#3](https://github.com/eniem-dev/eniem/issues/3)) ([5153390](https://github.com/eniem-dev/eniem/commit/515339027e7dced595e65e7ec4bf2145d4226b5b))
* **cli:** document ai init command and switch to npm trusted publishing ([66f92ab](https://github.com/eniem-dev/eniem/commit/66f92abd9543b142edf9719a41811a7c2228f47f))

# eniem-cli-v1.0.0 (2026-02-12)


### Features

* 1-migrate-repos — Import all repos via git subtree ([#1](https://github.com/eniem-dev/eniem/issues/1)) ([43222c6](https://github.com/eniem-dev/eniem/commit/43222c6bf4013b128ad122f0bc74230be336fa09))
* 2-post-migration-config — configure package names, remove duplicate workflows, setup semantic-release ([#3](https://github.com/eniem-dev/eniem/issues/3)) ([5153390](https://github.com/eniem-dev/eniem/commit/515339027e7dced595e65e7ec4bf2145d4226b5b))
* **cli:** document ai init command and switch to npm trusted publishing ([66f92ab](https://github.com/eniem-dev/eniem/commit/66f92abd9543b142edf9719a41811a7c2228f47f))

# [0.7.0](https://github.com/eniem-dev/eniem-cli/compare/v0.6.0...v0.7.0) (2026-01-30)


### Bug Fixes

* pass gitHost option to ai init command ([e91da09](https://github.com/eniem-dev/eniem-cli/commit/e91da098927a7495e703eb67df27888e1db8c74c))


### Features

* add ai init command to initialize AI workflow files ([201937f](https://github.com/eniem-dev/eniem-cli/commit/201937f22e5c5a6429857c165f9ac5a1b0a9edda))
* rename ralph commands to eni and update paths ([0171e0e](https://github.com/eniem-dev/eniem-cli/commit/0171e0e81e983505559f55f2660150bd683f6a31))

# [0.6.0](https://github.com/eniem-dev/eniem-cli/compare/v0.5.0...v0.6.0) (2026-01-22)


### Features

* update header to display logo in CLI ([0b8061d](https://github.com/eniem-dev/eniem-cli/commit/0b8061de419839faee6aefd83fe5dd56be7ea053))

# [0.5.0](https://github.com/eniem-dev/eniem-cli/compare/v0.4.0...v0.5.0) (2026-01-21)


### Bug Fixes

* add "Sync from sandbox" option to menu in production mode ([42734d0](https://github.com/eniem-dev/eniem-cli/commit/42734d09a8ed40928a33af737da8f855554446af))
* handle missing production file and add archived product management ([eb0403e](https://github.com/eniem-dev/eniem-cli/commit/eb0403e9e8ce16f009ffa583a54323a381603515))
* import full product details from Polar in cleanup ([995917e](https://github.com/eniem-dev/eniem-cli/commit/995917e810b1e6b79bae34e626baf9a5b322302e))
* show success message for local file save when Polar sync fails ([0419b9f](https://github.com/eniem-dev/eniem-cli/commit/0419b9ff0da33c646045d47d127b1c7ec27d93b3))


### Features

* add --prod flag and sandbox-to-production sync flow ([4d7b386](https://github.com/eniem-dev/eniem-cli/commit/4d7b3861a667b074302cbd6fd0bb7d7ce83488d1))
* add --token flag and always save local files on Polar failure ([59ffbb1](https://github.com/eniem-dev/eniem-cli/commit/59ffbb153fe48eae93b338570aa09718a216e3b8))
* add checkProductExists() helper function ([d2be2cb](https://github.com/eniem-dev/eniem-cli/commit/d2be2cbe441a5ce993f032468e73f138fdbe09ac))
* add MultiSelect component for multi-item selection UI ([4805791](https://github.com/eniem-dev/eniem-cli/commit/48057914dad142c1686d5745d70bcf02189b2e1b))
* add OperationMenu component for main menu operation selection ([226cb8c](https://github.com/eniem-dev/eniem-cli/commit/226cb8cedc258e12f23ff8e04dfd3572b8887d5f))
* add ProductList component for displaying products with sync status ([2bf1544](https://github.com/eniem-dev/eniem-cli/commit/2bf1544ae344d22d4f3fa694f59ffa49dcb5ec3c))
* add removeProduct() helper function ([21a62d2](https://github.com/eniem-dev/eniem-cli/commit/21a62d29a37da4a05097974f11eaf8eed4bef544))
* add updatePolarProduct() and archivePolarProduct() helper functions ([e60fcb0](https://github.com/eniem-dev/eniem-cli/commit/e60fcb0ac2b261860e44369c633343e91129415b))
* implement menu-driven products command with add/remove/sync/regenerate ([6c96827](https://github.com/eniem-dev/eniem-cli/commit/6c96827c077a3c8480c51f54961f7f6e852a2c44))

# [0.4.0](https://github.com/eniem-dev/eniem-cli/compare/v0.3.0...v0.4.0) (2026-01-20)


### Bug Fixes

* exclude products.tsx from coverage and improve tests ([736ccda](https://github.com/eniem-dev/eniem-cli/commit/736ccdae4a7ff44044adae9e61803137f310dcf9))
* improve products command with multiple bug fixes ([28badab](https://github.com/eniem-dev/eniem-cli/commit/28badab616146ece8052177dd0ade4f636289456))


### Features

* add @polar-sh/sdk and dotenv dependencies ([c75cc8f](https://github.com/eniem-dev/eniem-cli/commit/c75cc8ff00fa7152f1f598cf90ff4467664caaa5))
* add polar.ts with Polar API client wrapper ([c3c52a2](https://github.com/eniem-dev/eniem-cli/commit/c3c52a2058ade8e9290647f61b3cf24157d527ff))
* add products.ts with Product schema and file utilities ([30866cb](https://github.com/eniem-dev/eniem-cli/commit/30866cbec0823d979386d64b8d0070f341c20591))
* add ProductsCommand component and integrate with CLI ([4e4e12e](https://github.com/eniem-dev/eniem-cli/commit/4e4e12e5b061be2c0c794ab4fe5c57a961cf7a1c))
* generate products.generated.ts after product creation ([0eb5247](https://github.com/eniem-dev/eniem-cli/commit/0eb5247664ed2875fb6f6ea23de4f63c4c95a97d))

# [0.3.0](https://github.com/eniem-dev/eniem-cli/compare/v0.2.8...v0.3.0) (2026-01-20)


### Features

* replace .ralph with specs-based workflow ([e1ff2c8](https://github.com/eniem-dev/eniem-cli/commit/e1ff2c86798393248a6a4823b475aede926592da))

## [0.2.8](https://github.com/eniem-dev/eniem-cli/compare/v0.2.7...v0.2.8) (2026-01-15)


### Bug Fixes

* use dist/cli.js as bin entry point ([034f3fc](https://github.com/eniem-dev/eniem-cli/commit/034f3fcf7fe62f71ef713d12b24e0035273dee0f))

## [0.2.7](https://github.com/eniem-dev/eniem-cli/compare/v0.2.6...v0.2.7) (2026-01-15)


### Bug Fixes

* track bin folder for npm publishing ([35b8a77](https://github.com/eniem-dev/eniem-cli/commit/35b8a770fb9e2f2a0c706d77b651f859743750e8))

## [0.2.6](https://github.com/eniem-dev/eniem-cli/compare/v0.2.5...v0.2.6) (2026-01-15)


### Bug Fixes

* include dist and bin in npm package ([2db1a45](https://github.com/eniem-dev/eniem-cli/commit/2db1a4557836f0954ff66d8ea5d58c0f43e97b18))

## [0.2.5](https://github.com/eniem-dev/eniem-cli/compare/v0.2.4...v0.2.5) (2026-01-15)


### Bug Fixes

* upgrade npm to v11+ for OIDC trusted publishing ([fef57b2](https://github.com/eniem-dev/eniem-cli/commit/fef57b22a1ba1a249bcb08daf03f37d41cafa1c3))

## [0.2.4](https://github.com/eniem-dev/eniem-cli/compare/v0.2.3...v0.2.4) (2026-01-15)


### Bug Fixes

* align workflow with semantic-release OIDC docs ([b5d1c23](https://github.com/eniem-dev/eniem-cli/commit/b5d1c23f1d1784c511fe00e3294c36d440abccdf))

## [0.2.3](https://github.com/eniem-dev/eniem-cli/compare/v0.2.2...v0.2.3) (2026-01-15)


### Bug Fixes

* add registry-url for npm OIDC auth ([6ea0795](https://github.com/eniem-dev/eniem-cli/commit/6ea0795ba0aee069c3c7eee268d1c1def5806ee3))

## [0.2.2](https://github.com/eniem-dev/eniem-cli/compare/v0.2.1...v0.2.2) (2026-01-15)


### Bug Fixes

* enable npm provenance for OIDC publishing ([3b5e444](https://github.com/eniem-dev/eniem-cli/commit/3b5e4446d6f803ba670a7163dbc2c821fa271313))

## [0.2.1](https://github.com/eniem-dev/eniem-cli/compare/v0.2.0...v0.2.1) (2026-01-15)


### Bug Fixes

* update package metadata ([9370db1](https://github.com/eniem-dev/eniem-cli/commit/9370db1ef095f9ed4bf60e833108acb18e82178a))

# [0.2.0](https://github.com/eniem-dev/eniem-cli/compare/v0.1.0...v0.2.0) (2026-01-15)


### Features

* add package author and trigger initial release ([87d31a8](https://github.com/eniem-dev/eniem-cli/commit/87d31a808bd48e15e5bf9496d61c4690ceffe072))
