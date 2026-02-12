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
