# Gate and event receipts, Claude Code 2.1.287

Build sha256 `6eab8333fe2121553100d8f40bfada384a3e989b94f947e18ba6677a6fcb41ea`. Build time `2026-10-01T16:02:06Z`, read from the BUILD_TIME value of the build's manifest object, whose VERSION is 2.1.287 (the value sits at byte 177846624); there is no `buildDate` key in this build. Every offset in the data is a decimal byte offset into that file. The binary was read as bytes and never run, and nothing of its code is published here: an offset is the whole of the evidence a row carries (DESIGN, "What is published about the binary").

## Counting rules and totals

| quantity | counting rule | total |
|---|---|---|
| raw identifier runs | distinct byte runs matching `tengu_[a-z0-9_]+` anywhere in the file (`LC_ALL=C grep -a -o -E 'tengu_[a-z0-9_]+' FILE \| sort -u \| wc -l`) | 2733 |
| identifiers | distinct `tengu_[a-z0-9_]+` runs inside the JS modules of the Bun standalone module graph (the module table named by the Offsets struct before the `---- Bun! ----` trailer); the runs outside are bytecode string-table copies of a module identifier plus one trailing byte | 2702 |
| occurrences | every match of that pattern inside module text | 4070 |
| gate | the identifier sits at the name argument of a call whose callee resolves, through the ESM import graph, to the GrowthBook reader API (getFeatureValue_CACHED_MAY_BE_STALE, _SESSION_PINNED, _CACHED_WITH_REFRESH, _DEPRECATED, getFeatureValueWithSource, getDynamicConfig_*, checkGate_*), to a wrapper whose parameter reaches that argument (fixpoint over every named function), or to a reader injected at startup; or it is bound to a variable, thunk, property or return value that reaches such an argument; or it is read as a property of `cachedGrowthBookFeatures` on the parsed config; plus the hand-classified identifiers below | 818 |
| event | the identifier reaches argument 0 of logEvent, logEventAsync, the first-party logger or the Datadog sink, by the same call/wrapper/binding rules, or is an element of the Datadog allowlist Set | 1873 |
| config-key | the identifier is an object-literal key | 28 |
| other | a template-literal prefix or a run inside a longer string, and no class above | 12 |

Partition of the identifiers (an identifier takes the union of its occurrences' classes; "other" counts only where it is the only class):

| class set | identifiers |
|---|---|
| event | 1859 |
| gate | 796 |
| gate+config-key | 15 |
| gate+event | 7 |
| event+config-key | 7 |
| config-key | 6 |
| other | 12 |
| unclassified | 0 |

Before the hand reads, the mechanical rules leave 22 identifiers unclassified; each was read by hand at its offset and classed (hand verdicts carried from the first catalogue pass, listed in that pass's report section 1.3). The wrapper fixpoint derives 53 reader or logger functions including the seeds.

## Gate rows

One row per identifier in the gate class: 818 rows.

| field | counting rule | tally |
|---|---|---|
| `readers` (not a field; behind `cacheReach`) | the reader API at each read site, a gate counted once per reader it uses; a reader is named by the API name its module exports it under, and the three pipeline words are a value holder, a wrapper function and a direct disk read | getFeatureValue_CACHED_MAY_BE_STALE 679, getFeatureValue_SESSION_PINNED 49, holder 35, getFeatureValueWithSource_CACHED_MAY_BE_STALE 34, wrapper 26, checkGate_CACHED_OR_BLOCKING 11, getDynamicConfig_CACHED_MAY_BE_STALE 8, getFeatureValue_CACHED_WITH_REFRESH 7, getDynamicConfig_BLOCKS_ON_INIT 4, getFeatureValue_DEPRECATED 1, checkGate_OWN_OFF_FIRST 1, diskread 1 |
| `valueSource` | growthbook when a reader API call reads it; clientdata when the client-data sweep finds it read as a key of client data (an index into the client-data object, a `clientDataKey` property naming it, or an accessor called with it); config for a direct read of it as a property of `cachedGrowthBookFeatures` | growthbook 815, clientdata 15, config 1 (client-data keys found by the sweep, gate or not: 15) |
| `cacheReach` | full: some read goes through a value-only reader (getFeatureValue_*, getDynamicConfig_CACHED_MAY_BE_STALE, a wrapper or injected reader of one), which the frozen-disk mode answers from `cachedGrowthBookFeatures`; partial: read only through getFeatureValueWithSource, whose caller may test the source; direct: read straight off the config file; none: only checkGate_*, the blocking readers or client data | full 785, partial 21, none 11, direct 1 |
| `override` | an env variable or settings key read inside the read-site window (450 bytes before, 250 after, never crossing the token `function`) and joined to the read by an operator: `VAR ?? read(...)` or an early `return` on a set value = both; `VAR \|\| read(...)` or `if (VAR) return true` = on; `if (VAR) return false`, `!VAR && read(...)` = off; every pair read by hand where the operator rule could not decide, plus pairs found by a whole-function sweep, a sweep of other env objects and a one-call-away sweep. Variables that describe the host (CLAUDE_CODE_REMOTE and ten others) are excluded, and so is a variable whose env row is inert (the 17 removals below) | gates with an override: 117 (116 through an env variable, 8 through a settings key); pairs: env:force-off 19, env:force-on 23, env:override 81, settings:force-off 2, settings:override 5, settings:override-field 1; distinct keys: env 118, settings 7; by gate: both 78, on only 21, off only 18 |
| `prerequisites` | a variable, flag or settings key that must be set while the gate can still veto | 8 gates |
| `default` | the second argument at the read site as a JSON value, a declared value resolved to its literal when the literal sits in the same module; checkGate readers default to false; an argument that is not a literal (a value declared elsewhere, a call, a local) is an `expr` saying in words what it is, and a value that differs between read sites is an `expr` naming each; the three client-data-only gates have none | literal 788, expr 27, unknown 3 |
| `whatBasis` | read: the branch at the read site was read; inferred: the sentence rests on the name and nearby strings; null: no sentence written | read 576, inferred 198, not read 44 |
| `floor` | per rung, the number of maximal `tengu_[a-z0-9_]+` runs that start with the identifier (the presence test of `grep -a -F`); the floor is the first rung where it is positive, the previous rung the one before; a literal floor dates the identifier, never the behaviour | 1 gates already present at the earliest rung; absent at a later rung 3, exact-token floor differs 1 |
| `provenance` | every read site (the paren of the reader call, or the literal itself when it is the argument), the hand-read site for a gate no mechanical rule reached, and, when no read site spells the identifier itself (it is read through a variable), its first binding occurrence (`role: binding`) | 1027 entries, 70 of them bindings, 1022 distinct (version, offset) pairs; gates with none: 0 |

## Overrides removed because the variable is inert

The sweep above found 17 more env overrides, each written at the gate's read site as a read of the variable through one registry object. That registry is built at byte 178228744 by the registry factory over an empty shape, so it has no getters: every property read on it returns undefined whatever the environment holds, and the override can never fire. The env row of each variable carries `inert` saying so (`env.receipts.md`, the inert rows). Rule: an `override` entry is removed when its `shape` is `env` and its `key` names an env row whose `inert` is non-null; a gate whose array empties gets `override: null` and loses its toggle. All 17 were the gate's only override, so all 17 gates now have none.

| gate slug | variable | removed override | reason |
|---|---|---|---|
| bubbly-harbor | CLAUDE_CODE_WORKFLOW_PROMPT_PROVENANCE | override (both ways) | read only through the empty registry at 178228744, so it is always undefined |
| cedar-lattice | CLAUDE_CODE_DISPATCH_V2S | override (both ways) | read only through the empty registry at 178228744, so it is always undefined |
| cobalt-plinth-bryony | CLAUDE_CODE_ARTIFACT_FIVE_CLASS_ASKS | override (both ways) | read only through the empty registry at 178228744, so it is always undefined |
| compiled-acorn | CLAUDE_CODE_COMPILED_ACORN | override (both ways) | read only through the empty registry at 178228744, so it is always undefined |
| dreamy-frost | CLAUDE_CODE_DISPATCH_V2D | override (both ways) | read only through the empty registry at 178228744, so it is always undefined |
| fleet-past-sessions | CLAUDE_CODE_FLEET_PAST_SESSIONS | force-on | read only through the empty registry at 178228744, so it is always undefined |
| hearth-member-relay-rows-enabled | CLAUDE_CODE_AUTO_MODE_HEARTH_MEMBER_RELAY_ROWS | override (both ways) | read only through the empty registry at 178228744, so it is always undefined |
| lively-waffle | CLAUDE_CODE_SENDMESSAGE_HANDBACK | override (both ways) | read only through the empty registry at 178228744, so it is always undefined |
| melodic-wolf | CLAUDE_CODE_HANDBACK_PROVENANCE | override (both ways) | read only through the empty registry at 178228744, so it is always undefined |
| rc-long-turn-nudge | CLAUDE_CODE_FORCE_RC_LONG_TURN_NUDGE | force-on | read only through the empty registry at 178228744, so it is always undefined |
| rc-permission-nudge | CLAUDE_CODE_RC_PERMISSION_NUDGE | override (both ways) | read only through the empty registry at 178228744, so it is always undefined |
| swirling-squid | CLAUDE_CODE_ARTIFACT_INHERITED_TYPE_GRANT | override (both ways) | read only through the empty registry at 178228744, so it is always undefined |
| ticklish-whisper | CLAUDE_CODE_TICKLISH_WHISPER | override (both ways) | read only through the empty registry at 178228744, so it is always undefined |
| umber-sluice | CLAUDE_CODE_AUTO_MODE_ARTIFACT_CONSENT_RULE | override (both ways) | read only through the empty registry at 178228744, so it is always undefined |
| unified-waterfall | CLAUDE_CODE_REMOTE_TOOLS_ASK_SEATS | override (both ways) | read only through the empty registry at 178228744, so it is always undefined |
| valiant-rain | CLAUDE_CODE_REMOTE_TOOLS_JUMP_QUEUE | override (both ways) | read only through the empty registry at 178228744, so it is always undefined |
| violin-speculative-classifier | CLAUDE_CODE_REMOTE_TOOLS_SPECULATIVE_CLASSIFIER | override (both ways) | read only through the empty registry at 178228744, so it is always undefined |

## Events

`events.json` lists every identifier in the event class, sorted: 1873 names. An identifier in both the gate and the event class is in both files.

## Ladder read for floors

74 rungs, oldest first: 1.0.60, 2.0.0, 2.0.30, 2.1.23, 2.1.100, 2.1.112, 2.1.113, 2.1.114, 2.1.116, 2.1.117, 2.1.124, 2.1.139, 2.1.142, 2.1.143, 2.1.144, 2.1.145, 2.1.150, 2.1.152, 2.1.160, 2.1.168, 2.1.176, 2.1.191, 2.1.193, 2.1.195, 2.1.196, 2.1.197, 2.1.198, 2.1.199, 2.1.200, 2.1.201, 2.1.202, 2.1.203, 2.1.204, 2.1.205, 2.1.206, 2.1.207, 2.1.208, 2.1.214, 2.1.215, 2.1.216, 2.1.219, 2.1.220, 2.1.221, 2.1.222, 2.1.224, 2.1.225, 2.1.226, 2.1.227, 2.1.228, 2.1.232, 2.1.233, 2.1.234, 2.1.236, 2.1.237, 2.1.238, 2.1.239, 2.1.240, 2.1.243, 2.1.245, 2.1.246, 2.1.247, 2.1.248, 2.1.250, 2.1.251, 2.1.252, 2.1.258, 2.1.259, 2.1.261, 2.1.268, 2.1.278, 2.1.284, 2.1.285, 2.1.286, 2.1.287. Versions between two rungs were not on disk.

## Not covered

Two gates exist only at run time (a template that joins `tengu_` to pewter_owl_tool or pewter_owl_brief, the env variables CLAUDE_CODE_PEWTER_OWL and CLAUDE_CODE_PEWTER_OWL_TOOL beside them) and are not rows, because no identifier for them is in the build. Env overrides more than one call away from a gate read were not swept. The `what` sentences are extraction drafts.

## Against the first catalogue pass

Every headline number of the first pass over this build is reproduced by this run: 2,733 raw runs, 2,702 identifiers, 4,070 occurrences, the mechanical classes (22 unclassified before the hand reads), the partition 1,859 / 796 / 15 / 7 / 7 / 6 / 12, 1,873 events, 818 gates, the reader tally, the value sources (growthbook 815, client data 15, config 1), the cache reach 785 / 21 / 11 / 1, 134 gates with an override (133 through 135 env variables, 8 through 7 settings keys; by gate 93 both ways, 23 on only, 18 off only), 8 gates with a prerequisite, and the description bases 576 read / 198 inferred / 44 not read.

Two numbers differ, both in how a default is written rather than in what was read:

- Literal defaults: 788 here, 778 in the first pass's report. Under the first pass's own test (a default that is not an expression, not unknown and not different between read sites) its table reads 777; the report's 778 is not reproduced from that table. Of the 777, one (`tengu_projects_other_thread_rows_killswitch`, whose default is undefined) is written here as `{"expr": "undefined"}`, because `undefined` is not a JSON value, which leaves 776. The other twelve are defaults whose argument is a declared value with its literal in the same module: the first pass wrote the expression, this data writes the JSON value the constant holds. No default was read differently.
- The client-data key list: the first pass carried it as a hand-made sweep result with 14 keys plus `tengu_gorse_plover` added by hand; this pipeline runs the sweep as code (an index into the client-data object by a variable or by the literal name, an index into the result of the client-data accessor, a `clientDataKey` property, and the arguments of a function that indexes the client-data object by its parameter) and finds the same 15, `tengu_gorse_plover` included, with no hand entry.

Rules this pipeline adds to the first pass's:

- `provenance` names every read site, not only the first, and adds the identifier's binding occurrence (`role: binding`) when no read site spells the identifier itself, so a reader can tie a read through a variable back to the name.
- The eight gates no mechanical rule reaches carry the read offsets the first pass read them at by hand (brass_lantern, brook_heron, both ccr_mcp_set_servers_defer_connect gates, gentle_parasol, toasty_thimble, per_turn_effort, thistle_grebe).
- A default that differs between read sites is written as one `expr` naming each site's value; an unknown default is `{"unknown": "<reason>"}` rather than `null`, because `null` is itself the literal default of 45 gates.
