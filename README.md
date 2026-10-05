# tengu://flags

A page in the shape of `chrome://flags` for Claude Code. It lists the feature gates and environment variables that one Claude Code release reads, marks the ones you can set yourself, and turns your picks into lines for `settings.json`.

Feature gates are named `tengu_*` inside the client. Anthropic's servers decide most of them. Environment variables come from your shell or from the `env` block of `settings.json`, which Claude Code copies into its environment at startup.

## What the page shows

There is one table. Each row is one of three kinds.

| kind | what it is | switch on the page |
|---|---|---|
| gate | a `tengu_*` feature gate | only when a variable or a settings key overrides it beside the place the client reads it |
| variable | an environment variable the client reads | yes, unless it only describes the machine Claude Code runs on |
| change | something that moved between releases with no switch, such as a removed tool or command | never; the row says when it changed, how, and what stands in for a switch, if anything |

A grey row has no switch. It stays in the table so that a search for it finds it and explains why.

Telemetry event names also start with `tengu_`. They are names the client sends, and they switch nothing. They are hidden until you tick "Show telemetry events", which makes them searchable.

The search box looks at names, descriptions, the variable or settings key that overrides a gate, and workaround text. A link ending in `#<slug>` scrolls to that row. The values you pick are kept in the address, so a copied link reproduces them.

## What a switch promises

A switch appears only where the client itself reads an override in normal use. Setting it changes what that release does at that read site and nothing more. Every row names the release and the byte offset it was read at, listed under "Where it was read". The page shows nothing of the binary itself; anyone holding that release can find the spot by its offset. A different release can read the same name differently or not at all. That is why the version picker sits at the top and the export names the release its values were read against.

Some descriptions rest on the name and the strings near it, because the code that uses the name was not read. Those rows carry a note that says so.

## Running and developing the page

You need Node 22.12 or later. Install the pinned packages once:

```sh
npm install
```

The install also sets up the git hooks described below. For a page that reloads as you edit, start the development server and open the address it prints, usually <http://localhost:5173/>:

```sh
npm run dev
```

Adding `?dev=sample` to that address loads a small made-up data set from `sample/` instead of `data/`. It is handy when working on the page itself and never reaches the published site.

To see the page as it will be published, build it and serve the result. Browsers refuse to load module scripts and data files from a page opened straight from disk, so it has to come over http:

```sh
npm run build
python3 -m http.server -d dist 8000
```

Then open <http://localhost:8000/>.

| command | what it does |
|---|---|
| `npm run gate` | runs every check a commit has to pass. In order, they are the file-size and folder-shape limits, Biome's formatter and linter, the TypeScript check, the unit tests, the data validator, and the rule that a lint or type suppression must give its reason |
| `npm run e2e` | opens the built page in Chromium and checks it against the real data (run `npm run build` first; `npx playwright install chromium` fetches the browser the first time) |
| `npm run validate` | checks every file under `data/` against the schemas in `src/schema/` |
| `npm run index` | rebuilds `data/index.json` from the version folders |

Git runs `npm run gate` before each commit and refuses the commit when it fails. Before each push it runs the build and the Playwright checks. The workflow that publishes the site runs both again, so a commit that passes on your machine is the commit that gets built.

Rows are not written by hand. The pipelines described in the next section write a release's files under `data/versions/<version>/` and their evidence under `data/evidence/`. After they run, `npm run index` brings `data/index.json` up to date and `npm run validate` confirms every row has the shape the page expects. The page reads each file through the same schemas when it loads, so a file that fails them shows an error on the page in place of the table.

## How the data is made

Each release is read as bytes from the published Claude Code binary for that version, never run. A gate row comes from a call to the client's feature-gate reader, with its default and any inline override found at the same site. A variable row comes from the client's registry of environment variables or from a direct read of the environment. A change row comes from comparing the tool, command, hook, settings, variable and gate lists of neighbouring releases. The official changelog then narrows the gap, and a bisect over intermediate builds finds the first release with the new behaviour. Every count is stated with its counting rule in the `receipts.md` files under `data/evidence/`. None of the client's code is published here. A row carries offsets, names, the text the client shows to a model or a person, and plain-language explanations of what the code does. The data validator refuses any string that looks like code. The extraction scripts are not part of this repository.

## Layout

| path | holds |
|---|---|
| `index.html`, `src/` | the page, in TypeScript and SolidJS, styled with Tailwind CSS; `src/schema/` holds the shape of every data file |
| `data/versions/<version>/` | the gate, variable and event lists for one release, plus its sha256 |
| `data/changes.json` | the change rows across releases |
| `data/evidence/` | the counting rules and totals behind each data file |
| `tools/` | `validate.ts`, `index.ts`, `build-data.ts`, and the gate's own checks under `gate/` |
| `tests/` | the unit tests and the Playwright checks |
| `.github/workflows/pages.yml` | on every push to `main`, runs the gate, builds, checks the built page and publishes `dist/` to the `gh-pages` branch |

`main` holds the source, the data and the evidence. `gh-pages` holds the built site and is written only by the workflow. The repository's Pages setting serves the `gh-pages` branch from its root.

## Licence

The page and tools are under the licence in `LICENSE`. FlexSearch is Apache-2.0, copyright Nextapps GmbH. This project is not affiliated with Anthropic.
