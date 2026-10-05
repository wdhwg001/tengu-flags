# Environment variables of Claude Code 2.1.287: receipts

These are the counting rules and totals behind `data/versions/2.1.287/env.json`. The build read is the darwin-arm64 native binary of Claude Code 2.1.287, sha256 `6eab8333fe2121553100d8f40bfada384a3e989b94f947e18ba6677a6fcb41ea`, read as bytes and never run. Every offset is a decimal byte offset into that file, and an offset is the whole of the evidence a row carries: nothing of the build's code is published here (DESIGN, "What is published about the binary"). A minified name the build invented is named below by the offset where it is bound. The extraction scripts (`registry.py`, `extract.py`, `member.py`, `supp.py`, `floors_env.py`, `build_env.py`) are kept outside this repository; each rule below is stated so the number can be reproduced by any reader of the module text.

The module text is the JavaScript of the Bun standalone module graph: the `Offsets` struct before the `---- Bun! ----` trailer, the module table of 52-byte records, and each module's source bytes. All searches below run over that text only, never over the bytecode string tables that sit outside it.

## Totals

| | count |
|---|---|
| typed registry variables declared (main registry 1088, inbox registry 2, tether registry 1; section 1) | 1091 |
| typed registry variables with at least one read site | 1005 |
| typed registry variables declared and never read | 86 |
| variables read outside the typed registries | 208 |
| distinct variables read (the union) | 1213 |
| rows for read variables (after merging the 10 case-only spellings, see below) | 1203 |
| variables read only through the empty registry at 178228744 | 56 |
| env rows (the read rows plus one inert row for each of the 86 declared-and-unread and the 56 empty-registry variables) | 1345 |
| rows marked `inert` (86 declared and never read, 56 read only through the empty registry, 4 read sites with no effect) | 146 |
| rows whose variable the documentation table lists | 370 |
| rows whose variable it does not list | 975 |
| rows marked `hostContext` | 312 |
| `what` sentences resting on the read branch (`read`) | 1125 |
| `what` sentences resting on the name and nearby strings (`inferred`) | 78 |
| rows with no sentence (the 142 inert rows added for unread variables; their `inert` says what they are) | 142 |
| rows that override at least one gate | 118 |
| distinct gates those rows override | 116 |
| variable/gate override pairs (both 81, on 23, off 19) | 123 |
| provenance entries (205 of them `role: "binding"`), at 1745 distinct offsets | 1845 |

## 1. The typed registries

Rule: a registry is an object built by the registry factory, the one function at byte 178228388. The factory gives the result one getter per key of the shape it is handed; the getter reads the variable from `process.env` on every access and parses it with the key's parser. A shape is an empty object to which a helper attaches one getter per variable name, or a spread of such shapes, and each getter returns a value built by one of the registry's parsers. A registry variable is one name key of a shape that reaches a call of the factory. Every call site of the factory in the module text was listed by resolving each module's imports to that function.

| registry | built at | shape | keys | parsers |
|---|---|---|---|---|
| main | 178228726 | the spread of eight part shapes, at 178228343 | 1088 | str 529, bool 335, int 116, triBool 89, enum 11, rawStr 8 |
| inbox | 178228831 | `udsInboxShape` | 2 | str 2 |
| tether | 186753348 | `tetherShape` | 1 | triBool 1 |
| empty | 178228744 | an empty object, at 178228738 | 0 | none |
| second empty | 184993855 | an empty object, at 184993848 | 0 | none |

The eight parts of the main shape hold, in the order they are spread, 63, 68, 44, 298, 47, 192, 65 and 311 keys. The 298-key part at 178183065 is the one part of the registry an earlier pass had counted.

The two empty registries are built over empty shapes, so they have no getters: a property read on either, such as one naming CLAUDE_CODE_EVAL_ALLOW_FLAG_OVERRIDES, returns `undefined` whatever the environment holds, and `process.env` is never consulted. The module text reads 56 names through the empty registry at 178228744 at 69 sites and none through the second one. Each of those names is an inert row (section 11), because the build never reads it from the environment. They are: CCR_DELTA_RESET, CCR_PREFETCH_NETWORK, CCR_PREWARM_STAT, CCR_PREWARM_VDA, CCR_RUNNER_STARTUP_TIMING, CLAUDE_CODE_ARTIFACT_FIVE_CLASS_ASKS, CLAUDE_CODE_ARTIFACT_INHERITED_TYPE_GRANT, CLAUDE_CODE_ARTIFACT_MCP, CLAUDE_CODE_AUTO_MODE_ARTIFACT_CONSENT_RULE, CLAUDE_CODE_AUTO_MODE_CLASSIFIER_OVERLAP, CLAUDE_CODE_AUTO_MODE_CLASSIFY_ASK_USER_QUESTION, CLAUDE_CODE_AUTO_MODE_CLASSIFY_EDITS, CLAUDE_CODE_AUTO_MODE_EDIT_REMOVAL, CLAUDE_CODE_AUTO_MODE_EDIT_REMOVAL_CAP, CLAUDE_CODE_AUTO_MODE_GIT_STATUS, CLAUDE_CODE_AUTO_MODE_GIT_STATUS_LIMIT, CLAUDE_CODE_AUTO_MODE_GIT_STATUS_UPLOADS, CLAUDE_CODE_AUTO_MODE_HEARTH_MEMBER_RELAY_ROWS, CLAUDE_CODE_AUTO_MODE_OUTCOME_CODES, CLAUDE_CODE_AUTO_MODE_PRIOR_ASSISTANT_CONTEXT, CLAUDE_CODE_AUTO_MODE_REPO_VISIBILITY, CLAUDE_CODE_AUTO_MODE_SEGMENTED_TRANSCRIPT, CLAUDE_CODE_AUTO_MODE_TEMPERATURE, CLAUDE_CODE_COMPILED_ACORN, CLAUDE_CODE_COORDINATOR_PROPAGATE_NESTED_MEMORY, CLAUDE_CODE_DISPATCH_V2D, CLAUDE_CODE_DISPATCH_V2S, CLAUDE_CODE_EVAL_ALLOW_ARTIFACT_PUBLISH, CLAUDE_CODE_EVAL_ALLOW_FLAG_OVERRIDES, CLAUDE_CODE_EVAL_ARTIFACT_STUB_DIR, CLAUDE_CODE_FLEET_PAST_SESSIONS, CLAUDE_CODE_FORCE_FIRST_LAUNCH, CLAUDE_CODE_FORCE_RC_LONG_TURN_NUDGE, CLAUDE_CODE_HANDBACK_PROVENANCE, CLAUDE_CODE_MCP_SERVE_SETTINGS, CLAUDE_CODE_MEMORY_API_TOKEN, CLAUDE_CODE_PER_TURN_TIMING, CLAUDE_CODE_RC_PERMISSION_NUDGE, CLAUDE_CODE_REMOTE_TOOLS_ADOPT_MCP, CLAUDE_CODE_REMOTE_TOOLS_ASK_SEATS, CLAUDE_CODE_REMOTE_TOOLS_CALLER_SESSIONS_MAX, CLAUDE_CODE_REMOTE_TOOLS_JUMP_QUEUE, CLAUDE_CODE_REMOTE_TOOLS_POLICY, CLAUDE_CODE_REMOTE_TOOLS_SERVE, CLAUDE_CODE_REMOTE_TOOLS_SESSION_CHANNEL, CLAUDE_CODE_REMOTE_TOOLS_SPECULATIVE_CLASSIFIER, CLAUDE_CODE_SENDMESSAGE_HANDBACK, CLAUDE_CODE_SLEEPY_SNOWFLAKE, CLAUDE_CODE_TICKLISH_WHISPER, CLAUDE_CODE_TICKLISH_WHISPER_TIMEOUT_MS, CLAUDE_CODE_WORKFLOW_PROMPT_PROVENANCE, CLAUDE_REMOTE_TOOLS_BRIDGE_URL, CLAUDE_RUNNER_FAIL_FAST_FETCH, CLAUDE_RUNNER_STALL_GIVEUP, CLAUDE_RUNNER_TRUST_CANONICAL_PREWARM, CLAUDE_WORKSHOP_PROGRESS.

The registry parsers map onto the row field `type` as follows: `bool`, `triBool`, `int` and `str` are kept; `enum` becomes `{"enum": [values]}` with the values read from the parser's argument (two arguments are declared values, a list bound at 178176761 to `["us","eu","apac","jp","au","global"]` and one bound at 178194695 to `["5m","1h"]`); the parser `rawStr` (an untrimmed string, 8 keys) is written as `str` because the schema has no `rawStr`.

## 2. Read sites

Rule: a variable is read when the module text contains a site where its value is taken from `process.env` or from a registry getter. An assignment to a variable in `process.env`, a set call on a registry and a delete from `process.env` are writes, not reads. The channels, with the number of sites each found and the number of distinct names it reached:

| channel | what it matches | sites | names |
|---|---|---|---|
| reg | a property read (plain, optional-chained or bracketed with a string) on a binding that resolves through the ESM imports to the main, inbox or tether registry, naming a key of that registry | 2396 | 830 |
| penv | a property read on `process.env` (plain, optional-chained or bracketed with a string) | 673 | 385 |
| const | an index into `process.env` or a registry by a constant, where the constant (in the module or through its import), or the property holding it, is bound to exactly one string of variable shape (at most 12 for a property) | 76 | 54 |
| list | an index into `process.env` or a registry by the loop variable of a for-of loop, or by the parameter of an array method callback (some, every, filter, find, forEach, map, reduce), in the 900 bytes before, over an array literal, followed through imports and spreads | 70 | 61 |
| tmpl | an index into a registry by a template string with a fixed prefix and suffix: every registry key that matches the prefix and suffix | 9 | 6 |
| help | a call with a variable name, or a constant bound to one, of a helper function whose parameter it uses as an index into `process.env` or a registry (17 such helpers), in its module, in its importers, and through a CommonJS export of the helper called by its exported name; plus one call at 185531372 whose argument is the `envDisableVar` property of an object that binds it to `"CLAUDE_CODE_DISABLE_ARTIFACT"` | 107 | 82 |
| obj | a property read on the `env` property of an object other than `process` (an environment object handed in, such as a dependencies object) | 43 | 29 |
| member | a property read on a parameter holding the environment (a parameter that defaults to `process.env` and the like) and an `in` test of a name against such an object, found by a second pass over the names the first pass missed and accepted one by one | 9 | 9 |
| destr | names destructured from `process.env` (the destructuring at 191417551, naming CI and FORCE_HYPERLINK among others) | 8 | 8 |
| pairs | the Vertex AI region table of model and variable pairs at 178044792, searched for the model and read by the pair's variable at 178048384 | 19 | 19 |

The second pass took as its candidates every typed registry key, every variable named in the documentation table, and the 33 names in the client's own set of known non-registry variables (the set at 195262901, used to label telemetry), keeping those the first pass had not found. It found 10 member hits and kept 9; the tenth was a `delete`.

A row's `provenance` lists up to two read sites in different modules. When no read-site window shows the variable's name (the name is bound in a constant, a list or a property elsewhere), a further entry with `role: "binding"` points at the literal that binds it, and the read entries carry `role: "read"`.

### What the channels do not reach

The table is complete for the channels above and partial beyond them, for three reasons.

1. Dynamic reads whose key resolves to no literal by these rules: 56 sites at offsets 178048384 178228515 179604741 179635221 179635251 180495763 180497276 183397029 183497479 183501509 183506075 183506154 183506765 183506890 183507709 183507806 183507944 183782514 183854098 184022835 184584991 184585726 186347749 187059072 187776770 187780851 188258873 186994058 186994082 188315649 190609645 190611734 191453765 192150161 192150437 192150561 196928017 196928033 196928976 197427018 197478532 197671539 197697351 197697387 203802903 210473140 210738277 210738297 210739297 210882145 210887796 210888261 210890046 214914597 218414787 218414995. Most are generic: the registry getter itself, the settings `env` merge that copies every key, loops over every key of `process.env`, and lookups whose key arrives as a function argument. Two (186994058, 186994082) are false matches of the pattern inside a regular expression literal. One (178048384) is the Vertex table read, covered by the `pairs` channel.
2. Prefix families read by scanning the whole environment, such as `OTEL_*` and `INPUT_OTEL_*` at 180395862 and the `debug_*` options of the bundled debug library at 179604741. A variable named only by such a pattern has no row.
3. Environment objects passed between functions under other names. The second pass covers the names in its candidate set; a variable outside that set reached this way would be missed.

## 3. Declared and never read

86 typed registry keys have no read site in any channel, so each is an inert row (section 11): ALLOW_ANT_COMPUTER_USE_MCP, ANT_CLAUDE_CODE_METRICS_ENDPOINT, ANT_OTEL_EXPORTER_OTLP_ENDPOINT, ANT_OTEL_EXPORTER_OTLP_HEADERS, ANT_OTEL_EXPORTER_OTLP_PROTOCOL, ANT_OTEL_LOGS_EXPORTER, ANT_OTEL_METRICS_EXPORTER, ANT_OTEL_RESOURCE_ATTRIBUTES, ANT_OTEL_TRACES_EXPORTER, AWS_ENDPOINT_URL_BEDROCK, AWS_ENDPOINT_URL_BEDROCK_RUNTIME, BAT_THEME, CDPATH, CLAUDE_BRIDGE_OAUTH_TOKEN, CLAUDE_BRIDGE_SESSION_INGRESS_URL, CLAUDE_CODE_ARTIFACTS_API_BASE_URL, CLAUDE_CODE_ARTIFACT_ASSET_BASE_URL, CLAUDE_CODE_ARTIFACT_LIVE_BASE_URL, CLAUDE_CODE_ARTIFACT_REPL, CLAUDE_CODE_ARTIFACT_ROOM, CLAUDE_CODE_ARTIFACT_SYNC_BASE_URL, CLAUDE_CODE_ARTIFACT_VIEWER_BASE_URL, CLAUDE_CODE_ATTRIBUTION_STATUS_TIMEOUT_MS, CLAUDE_CODE_AUTO_MODE_EXTERNAL_PERMISSIONS, CLAUDE_CODE_AUTO_MODE_MODEL, CLAUDE_CODE_BG_CLASSIFIER_MODEL, CLAUDE_CODE_BRIDGE_SESSION_ID, CLAUDE_CODE_BRIDGE_SOURCE_DIR, CLAUDE_CODE_DEV_RAW_CHANGELOG_URL, CLAUDE_CODE_DISABLE_ATTRIBUTION_BASELINE_REUSE, CLAUDE_CODE_DISABLE_ATTRIBUTION_CROSS_REPO, CLAUDE_CODE_DISABLE_LAUNCH_COMPOSER, CLAUDE_CODE_ENABLE_DESIGN_SYNC, CLAUDE_CODE_ENABLE_LAUNCH_COMPOSER, CLAUDE_CODE_ENABLE_REFRESH_MCP_TOOLS, CLAUDE_CODE_FORCE_BRIDGE, CLAUDE_CODE_FORCE_EVALUATE_MEMORY, CLAUDE_CODE_FORCE_MEMORY_SURVEY, CLAUDE_CODE_FORCE_TIP_ID, CLAUDE_CODE_GB_BASE_URL, CLAUDE_CODE_GB_REFRESH_INTERVAL_MS, CLAUDE_CODE_HFI_BEARER_TOKEN, CLAUDE_CODE_MANAGED_SETTINGS_PATH, CLAUDE_CODE_MESSAGING_TOKEN, CLAUDE_CODE_MOCK_REMOTE_SETTINGS, CLAUDE_CODE_MOCK_TRIAL, CLAUDE_CODE_OVERRIDE_DATE, CLAUDE_CODE_PERFETTO_WRITE_INTERVAL_S, CLAUDE_CODE_POLL_EVENT_DECLARATIONS, CLAUDE_CODE_REMOTE_RAW_EVENTS_FILE, CLAUDE_CODE_REMOTE_SETTINGS_PATH, CLAUDE_CODE_REMOTE_SETTINGS_POLL_MS, CLAUDE_CODE_REPL, CLAUDE_CODE_SKIP_HFI_VERSION_CHECK, CLAUDE_CODE_SKIP_PROJECT_BACKFILL, CLAUDE_CODE_SKIP_REPO_UPLOAD, CLAUDE_CODE_TAG_ISMETA_MESSAGES, CLAUDE_CODE_TERMINAL_RECORDING, CLAUDE_CODE_TEST_FORCE_DENY, CLAUDE_CODE_TEST_NO_GIT_BASH, CLAUDE_CODE_TEST_NO_PWSH, CLAUDE_CODE_TWO_STAGE_CLASSIFIER, CLAUDE_CODE_USE_NATIVE_FILE_SEARCH, CLAUDE_MOCK_HEADERLESS_429, CLAUDE_SERVE_DRAIN_TIMEOUT_MS, CLAUDE_SNIP, CLAUDE_SSH_LOCAL_BINARY, CLAUDE_SSH_VERSION, EMBEDDED_SEARCH_TOOLS, ENABLE_LOCKLESS_UPDATES, ENABLE_LSP_TOOL, ENABLE_PID_BASED_VERSION_LOCKING, ENABLE_SESSION_BACKGROUNDING, ENABLE_SESSION_PERSISTENCE, ENVIRONMENT_SERVICE_KEY, FORCE_VCR, GH_CONFIG_DIR, GIT_CONFIG_NOSYSTEM, GIT_SSL_CAPATH, HUB_CONFIG, NoDefaultCurrentDirectoryInExePath, SSL_CERT_DIR, TEMP, TMP, ULTRAPLAN_PROMPT_FILE, VCR_RECORD. Several of these names occur in lists the client uses to classify, scrub or forward variables, or are written by the client for a child process; none is read.

Four rows are read sites that can have no effect in this build; their `what` says so and their `inert` gives the reason (section 11): USE_API_CONTEXT_MANAGEMENT (combined with a constant false), CLIPBOARD_NAPI_NODE_PATH (the loader returns before the read), TEST_ENABLE_SESSION_PERSISTENCE (behind a build-type test that always answers production) and CLAUDE_INTERNAL_FC_OVERRIDES (wired to an override reader that is a stub).

## 4. Case-only spellings merged

The slug rule (the name lowercased, `_` turned to `-`) gives one slug to names that differ only in case, so these pairs are one row each, named by the upper-case spelling, with the other spelling named in `what` and both spellings' read sites in `provenance`: ALL_PROXY / all_proxy, COMSPEC / ComSpec, GCLOUD_PROJECT / gcloud_project, GOOGLE_APPLICATION_CREDENTIALS / google_application_credentials, GOOGLE_CLOUD_PROJECT / google_cloud_project, HTTPS_PROXY / https_proxy, HTTP_PROXY / http_proxy, NO_PROXY / no_proxy, PROGRAMDATA / ProgramData, SYSTEMROOT / SystemRoot.

## 5. Documented

Rule: a variable is documented when it is the first cell of a table row, written as a single backticked name, inside the `## Variables` section of the official page https://code.claude.com/docs/en/env-vars (the copy fetched for this pass, whose CHANGELOG companion names 2.1.289 as the newest version). That section lists 382 variables. Of them, 332 are typed registry keys and 367 are read by 2.1.287, so 367 read rows carry the page's URL. Three of the inert rows added for unread variables are listed too (CLAUDE_CODE_BRIDGE_SESSION_ID, CLAUDE_CODE_MESSAGING_TOKEN, CLAUDE_CODE_USE_NATIVE_FILE_SEARCH), so 370 rows carry the URL and 975 do not. Of the 1091 typed registry keys, 332 are named on the page.

The 15 listed variables 2.1.287 does not read: CLAUDE_CODE_AUTO_BACKGROUND_WORKER_CHECKIN_SECONDS, CLAUDE_CODE_DISABLE_INLINE_SHELL_RM_PROMPT, CLAUDE_CODE_DISABLE_STRUCTURED_OUTPUTS and CLAUDE_SUBAGENT_BG_SHELL_MAX_MS (absent from the build's module text; the page may describe a later version); CLAUDE_CODE_CONNECT_TIMEOUT_MS, CLAUDE_CODE_ENABLE_OPUS_4_7_FAST_MODE and CLAUDE_CODE_OPUS_4_6_FAST_MODE_OVERRIDE (named only in the client's known-variable set at 195262901); CLAUDE_CODE_ENABLE_AUTO_MODE, CLAUDE_CODE_MAX_SUBAGENTS_PER_SESSION and TASK_MAX_OUTPUT_LENGTH (named only in name lists); CLAUDE_CODE_BRIDGE_SESSION_ID and CLAUDE_CODE_MESSAGING_TOKEN (set and removed by the client, never read); CLAUDE_CODE_USE_NATIVE_FILE_SEARCH (declared, never read); CLAUDE_EFFORT and CLAUDE_PID (set by the client for hook commands and Bash, never read by the client).

## 6. What each row controls

Rule: the sentence comes from the code at a read site of the variable, read in a window of about 110 bytes before and 170 bytes after it, and wider where the branch needed it. `whatBasis` is `read` when the sentence states what that branch does, and `inferred` when it leans on the variable's name and neighbouring strings beyond what the branch shows (78 rows, many of them codename-style variables whose branch only consults a gate or a model flag). Every row has a sentence. The sentences are an extraction draft and still owe the human-writing pass DESIGN.md requires before publication.

## 7. Overrides

Rule: `overrides` lists the gates whose value the variable replaces or forces at the gate's read site, taken from the gate pass's override column (in the project's notation of DESIGN, "How a gate's value is decided": `VAR ?? read(gate, default)` replaces in both directions, `VAR || read(...)` forces on, `if (VAR) return false` forces off). 118 rows override 116 gates through 123 pairs: 81 both ways, 23 on, 19 off. The gate pass also recorded 17 overrides through variables read via the empty registry at 178228744 (section 1); those variables are never read from the environment, so their rows are inert with empty `overrides`, and the 17 overrides were removed from the gate rows (`gates.receipts.md`). CLAUDE_CODE_PEWTER_OWL and CLAUDE_CODE_PEWTER_OWL_TOOL replace two gates whose names are built at run time (a template joining `tengu_` to a suffix) and have no gate row, so their `overrides` is empty.

## 8. Host context

Rule: `hostContext` is true for the 11 variables the gate pass excluded as describing the hosting environment (CLAUDE_CODE_REMOTE, CLAUDE_CODE_REMOTE_SESSION_ID, CLAUDE_CODE_REMOTE_ENVIRONMENT_TYPE, CLAUDE_CODE_EVAL_CONFINED, CLAUDE_CODE_EVAL_INTERVIEW_SESSION, CLAUDE_BG_BACKEND, CLAUDE_CODE_ENTRYPOINT, CLAUDE_CODE_SESSION_ORIGIN, CLAUDE_CODE_ENVIRONMENT_KIND, CLAUDE_CODE_REMOTE_MEMORY_DIR, CLAUDE_COWORK_MEMORY_GUIDELINES), for variables the client itself sets for its own process or hands to a child it starts (found from the 77 names written into `process.env`, set on a registry or put in a spawned child's environment object, each judged at its write), and for variables that describe the machine, terminal, CI system or cloud runtime rather than a choice (terminal and platform detection, `HOME`, `PATH` and their kind): 313 read rows by that rule. A variable the client sets only as a fallback when the user left it unset stays false. An inert row is never `hostContext` (it is greyed by `inert`), which clears the flag on CLAUDE_INTERNAL_FC_OVERRIDES: 312 rows.

## 9. Floors

Rule: the floor is the first cached rung whose bytes contain the variable's name as a whole token (a maximal run of `[A-Za-z0-9_]` equal to the name), and `previousRung` is the cached rung before it, or null when the floor is the earliest rung. The token test is stricter than a substring test, because many names are prefixes of others; the two disagree for 8 names (CF_PAGES, CLAUDE_CODE_AGENT, CLAUDE_CODE_SHELL, CODER, ENABLE_PROMPT_CACHING_1H, HISTFILE, LANG, TERMINAL). A literal floor dates the name, never the behaviour. 260 rows have their floor at the earliest rung, 1.0.60. 8 names are absent from some rungs after their floor (ANTHROPIC_FOUNDRY_AUTH_TOKEN, CLAUDE_CODE_SESSION_ID, COMSPEC, GIT_TERMINAL_PROMPT, OTEL_EXPORTER_OTLP_LOGS_ENDPOINT, OTEL_EXPORTER_OTLP_METRICS_ENDPOINT, USE_LOCAL_OAUTH, WSL_INTEROP).

The 74 rungs, all darwin-arm64 native builds: 1.0.60 2.0.0 2.0.30 2.1.23 2.1.100 2.1.112 2.1.113 2.1.114 2.1.116 2.1.117 2.1.124 2.1.139 2.1.142 2.1.143 2.1.144 2.1.145 2.1.150 2.1.152 2.1.160 2.1.168 2.1.176 2.1.191 2.1.193 2.1.195 2.1.196 2.1.197 2.1.198 2.1.199 2.1.200 2.1.201 2.1.202 2.1.203 2.1.204 2.1.205 2.1.206 2.1.207 2.1.208 2.1.214 2.1.215 2.1.216 2.1.219 2.1.220 2.1.221 2.1.222 2.1.224 2.1.225 2.1.226 2.1.227 2.1.228 2.1.232 2.1.233 2.1.234 2.1.236 2.1.237 2.1.238 2.1.239 2.1.240 2.1.243 2.1.245 2.1.246 2.1.247 2.1.248 2.1.250 2.1.251 2.1.252 2.1.258 2.1.259 2.1.261 2.1.268 2.1.278 2.1.284 2.1.285 2.1.286 2.1.287. Every version between two consecutive rungs is absent from the cache, so a floor means "introduced after the previous rung and at or before this one".

## 10. What is published

No excerpt of the build is published. Every provenance entry is a version and a byte offset: a read entry points at the variable's name at its read site, and a binding entry at the literal that binds the name. The 56 rows read only through the empty registry share one binding entry, at 178228744, where that registry is built; the module text ends there, at the NUL byte before the bytecode.

## 11. Inert rows

A row is inert when setting its variable changes nothing in this build. `inert` holds one sentence saying which of three kinds it is; an inert row has `hostContext` false, empty `overrides` and no toggle, and the page greys it.

| kind | counting rule | rows | `what` / `whatBasis` | `type` | `provenance` |
|---|---|---|---|---|---|
| declared, never read | a key of a shape reaching a call of the registry factory whose registry is the main, inbox or tether registry (section 1: 1091 keys) and which no channel of section 2 reaches, under either case spelling: 1091 minus the 1005 read | 86 | null / null | the key's parser as in section 1 (`rawStr` written `str`) | one entry, `role: "binding"`, at the key's own occurrence in its shape, where the helper attaches its getter |
| read only through the empty registry | a name read as a property of the empty registry at 178228744 (the 69 sites of section 1) that no channel reaches otherwise and that is a key of no registry | 56 | null / null | null: the empty registry has no parser for any name | up to two such read sites in different modules (`role: "read"`, the offset at the name), plus the registry's construction at 178228744 (`role: "binding"`) |
| read site with no effect | a read row whose branch was read and cannot act: USE_API_CONTEXT_MANAGEMENT (at 181000882 the read is joined by a logical and to a constant false), CLIPBOARD_NAPI_NODE_PATH (at 185202749 the loader sets a flag and returns null before the read), TEST_ENABLE_SESSION_PERSISTENCE (at 189962601 the read sits behind a test that the build type is "test", and the function at 189962496 always answers "production"), CLAUDE_INTERNAL_FC_OVERRIDES (at 181111398 the read is the body of the `readEnvironmentOverrides` dependency, which the module text never calls, beside a `getEnvironmentOverrides` method at 180764400 that returns null) | 4 | unchanged | unchanged | unchanged |

The 86 and the 56 are disjoint, neither shares a name or a slug with a read row, and 1203 + 86 + 56 = 1345 rows. The "declared, never read" sentence says the client does nothing with the variable; the runtime underneath and the programs the client starts still see the environment, which matters for standard names in the list such as TMP, TEMP, CDPATH, SSL_CERT_DIR and GIT_CONFIG_NOSYSTEM. The 86 rest on the channels of section 2, which are complete only for themselves: a name read through one of the 56 unresolved dynamic sites would be marked inert wrongly; those sites were not read one by one for this pass.
