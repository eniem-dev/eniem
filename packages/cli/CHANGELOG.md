# [eniem-cli-v1.9.0](https://github.com/eniem-dev/eniem/compare/eniem-cli-v1.8.0...eniem-cli-v1.9.0) (2026-03-15)


### Features

* **cli:** add --all flag and Run all option for plan and build commands ([807e693](https://github.com/eniem-dev/eniem/commit/807e69311d1e5743ab31ddfbb7597e503222f38a))

# [eniem-cli-v1.8.0](https://github.com/eniem-dev/eniem/compare/eniem-cli-v1.7.0...eniem-cli-v1.8.0) (2026-03-10)


### Features

* **skills:** update functional-spec-interview to topic-decomposed approach ([3b11bb1](https://github.com/eniem-dev/eniem/commit/3b11bb114b06c36e9f7a5f24680d237379df391a))

# [eniem-cli-v1.7.0](https://github.com/eniem-dev/eniem/compare/eniem-cli-v1.6.0...eniem-cli-v1.7.0) (2026-03-06)


### Bug Fixes

* **cli:** prevent git clone/fetch from hanging when credentials are needed ([bc6b382](https://github.com/eniem-dev/eniem/commit/bc6b3825df664c2752199887534927a10bb3a3c8))
* **cli:** remove orphaned error display block in Wizard ([d24a93a](https://github.com/eniem-dev/eniem/commit/d24a93acec64474e92afd4ef34f835d1a665c518))
* **cli:** remove SSH agent check and fallbackUsed to fix typecheck ([a95a189](https://github.com/eniem-dev/eniem/commit/a95a18939dc9315f4f5f9e164ca7d781e41d03a4))
* **cli:** remove unused imports after SSH check removal ([e2bc591](https://github.com/eniem-dev/eniem/commit/e2bc5915192e87e665a4436cf201f2878a4049bc))


### Features

* **database-file-upload:** add FILE_UPLOAD_PROVIDER to CLI env generation ([0da5a3f](https://github.com/eniem-dev/eniem/commit/0da5a3f21bca9b34f2da9adfe11836d779137df1))
* **database-file-upload:** add FILE_UPLOAD_PROVIDER to CLI env-ready optional groups ([95d95b4](https://github.com/eniem-dev/eniem/commit/95d95b43d4c1b7240b41de486d2e65a338fb8ae6))
* **database-file-upload:** update StorageSetup test for database skip message ([cf3ecc2](https://github.com/eniem-dev/eniem/commit/cf3ecc2e2db14f6619ab5e98905faf754d234247))
* **database-file-upload:** update StorageSetup with database provider messaging ([c0e811a](https://github.com/eniem-dev/eniem/commit/c0e811a8fe987b638b184af53c2489398d664277))
* **handle-ssh-agent-not-loaded:** add ensureSshAgent() utility function ([6009466](https://github.com/eniem-dev/eniem/commit/60094663d225df4c7b8752c506f3b682870ae7c9))
* **handle-ssh-agent-not-loaded:** add SSH check to project init Wizard ([6e80676](https://github.com/eniem-dev/eniem/commit/6e8067670d61412d2869e3f55787196853692f5a))
* **handle-ssh-agent-not-loaded:** integrate SSH check into ai init state machine ([3e9c0b5](https://github.com/eniem-dev/eniem/commit/3e9c0b58de797e00f3fc67e5cfa9b00a4232cc81))
* **https-git-protocol-support:** add --protocol, --https, --ssh CLI flags with validation ([ca0cdf6](https://github.com/eniem-dev/eniem/commit/ca0cdf6429831ec6c80958a1d0705a518e17b0e2))
* **https-git-protocol-support:** add protocol support to sparseCloneBoilerplate ([5b4b351](https://github.com/eniem-dev/eniem/commit/5b4b351e70f41a3008beace7f414d8dcf02f4df5))
* **https-git-protocol-support:** add protocol-aware clone with HTTPS fallback ([85a041f](https://github.com/eniem-dev/eniem/commit/85a041f4989aa34ac8217a1127827b7d674b5a28))
* **https-git-protocol-support:** wire protocol to CloneStep UI with fallback messaging ([896c4df](https://github.com/eniem-dev/eniem/commit/896c4df7a2473c9cd6b9510c54cdb4e1927b9586))
* **multi-cli-config-setup:** add CLI selection multi-select step to ai init flow ([ef41ebe](https://github.com/eniem-dev/eniem/commit/ef41ebe4983bfcf4356d802a6bd42f71260a7c88))
* **multi-cli-config-setup:** add clis field to EniConfig type and validation ([5abdae1](https://github.com/eniem-dev/eniem/commit/5abdae1361af55983cad9576a7650b6208a09d77))
* **multi-cli-config-setup:** add folder removal step for unselected CLIs ([00541ac](https://github.com/eniem-dev/eniem/commit/00541ac1468bfcd86cf907293015c4785e72cf19))
* **multi-cli-config-setup:** add folder restoration step for selected CLIs ([91d24af](https://github.com/eniem-dev/eniem/commit/91d24afddd1e8e3a5703ab1aea6df73a8aa21724))
* **multi-cli-config-setup:** replace destructive copy with additive merge in copyAiFiles ([d22b47a](https://github.com/eniem-dev/eniem/commit/d22b47af12ea6058e63643ac76798fe163ed1dbd))
* **multi-cli-config-setup:** update sparse clone to include all CLI config folders ([e350ef7](https://github.com/eniem-dev/eniem/commit/e350ef7432b8ec5374667e6ad15d206291bc5da1))
* **multi-cli-config-setup:** wire removal and restoration steps into AiCommand state machine ([49bcc46](https://github.com/eniem-dev/eniem/commit/49bcc463a2352e44c8671e4127611ebd2228d636))
* **remove-gemini-cli-support:** remove Gemini CLI adapter and all references ([0369586](https://github.com/eniem-dev/eniem/commit/03695866feec086c28482430896447f4402dd5a3))

# [eniem-cli-v1.6.0](https://github.com/eniem-dev/eniem/compare/eniem-cli-v1.5.0...eniem-cli-v1.6.0) (2026-02-27)


### Bug Fixes

* **opencode:** use stdin instead of CLI argument for prompt ([0ef0bf4](https://github.com/eniem-dev/eniem/commit/0ef0bf42cc03a11de87442cc32a3b0c6ce6afd32))
* validate spec exists before showing running state in plan command ([834af12](https://github.com/eniem-dev/eniem/commit/834af12e412ceca64fe27e38e6eec4c1a17c350e))


### Features

* **cleanup-cli-ai-init:** add CLI adapter and verbose selection to ai init flow ([e05d069](https://github.com/eniem-dev/eniem/commit/e05d069e15f7c2e721bc759687a275cd7c00e897))
* **cleanup-cli-ai-init:** add verbose boolean to EniConfig type and validation ([9c5341c](https://github.com/eniem-dev/eniem/commit/9c5341cf3358c0a727f803b454efd30ad013215c))
* **cleanup-cli-ai-init:** add verbose to config show, set, and interactive config ([54207e3](https://github.com/eniem-dev/eniem/commit/54207e3708d3d19783a0e4381860a9193124695c))
* **cleanup-cli-ai-init:** document --no-verbose flag and update --verbose description ([ef9307a](https://github.com/eniem-dev/eniem/commit/ef9307a95ce5d66ba92008d433ad05226520ae21))
* **cleanup-cli-ai-init:** update ai init post-init success message ([bd79332](https://github.com/eniem-dev/eniem/commit/bd79332492a0765aaee400c45855727ef947b459))
* **cleanup-cli-ai-init:** wire verbose config into plan and build commands ([faf5d7c](https://github.com/eniem-dev/eniem/commit/faf5d7c7c003757e6d756c0e7e942a71e1b94082))
* **cli-header-spec-name-display:** add E2E tests for spec name header and logo visibility ([9eff0ca](https://github.com/eniem-dev/eniem/commit/9eff0ca410c0f0b76fedfc6ad93fc932acace37f))
* **cli-header-spec-name-display:** add optional subtitle prop to SectionHeader ([e0aca6e](https://github.com/eniem-dev/eniem/commit/e0aca6ef9beedadc6d14745cca77e8d2731120cc))
* **cli-header-spec-name-display:** move Header into BuildCommand and show spec name in subtitle ([ab41fb6](https://github.com/eniem-dev/eniem/commit/ab41fb6a9c432e3da99079000078406704f2c346))
* **cli-header-spec-name-display:** move Header into PlanCommand and show spec name in subtitle ([ec1b5e6](https://github.com/eniem-dev/eniem/commit/ec1b5e64bdb6866fa1aa5cccf9f60c408ffc309d))
* **narrate-tool-activity:** add narration field to EniConfig type and validateConfig ([c7a7f41](https://github.com/eniem-dev/eniem/commit/c7a7f415561a9ca36a6e17ad89204d608037fb54))
* **narrate-tool-activity:** add narration step to ai init flow ([491a498](https://github.com/eniem-dev/eniem/commit/491a4988cb061f6ecf7159baaec397ede21fb84e))
* **narrate-tool-activity:** add narration step to interactive config wizard ([8f999d6](https://github.com/eniem-dev/eniem/commit/8f999d6606f8ae8495fb803c1d1c4d32cfd2f714))
* **narrate-tool-activity:** add narration to config show and config set commands ([2f22d73](https://github.com/eniem-dev/eniem/commit/2f22d731df3efab641c166923d29a218bea820ce))
* **narrate-tool-activity:** add narration to FirstRunPrompt component ([9d2d454](https://github.com/eniem-dev/eniem/commit/9d2d45485fe787c35dbf8e3355ec0aae61cb30e6))
* **narrate-tool-activity:** create narration prompt injection utility ([443fc99](https://github.com/eniem-dev/eniem/commit/443fc993c516f9e9ec3096e7239f0ac1c4ec570a))
* **narrate-tool-activity:** wire narration config into plan and build commands ([0ae6f85](https://github.com/eniem-dev/eniem/commit/0ae6f850ee530acffc0c3d504dfee662299dfb22))
* **plan-build-list-flag:** add --list flag to plan and build commands ([6b632b3](https://github.com/eniem-dev/eniem/commit/6b632b331bfcd23ef6bce10f7ab6eba0087638dd))

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
