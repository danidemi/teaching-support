# piattaforma-corsi

This repository is a monorepo with three kinds of content:

- `learning-plugin/` — a Claude Code plugin for planning adult courses and producing
  their didactic material (slides, quizzes, exercises, manuals).
- `learning-container/tools/` — containerized toolchains the plugin depends on
  (`graph/` for the knowledge-goals graph editor, `slides/` for the slide build
  pipeline).
- `learning-test-course-*/` — sample course projects used to exercise the plugin
  while developing it (e.g. `learning-test-course-migration/`).

The repository is mid-restructure: some reference docs under `learning-plugin/`
still point at old paths (`tools/graph/`, `.claude/reference/`). Treat any such
path as stale until it is fixed.

## What was set up for local development

The plugin is not published anywhere. To make it usable while you develop it,
it was registered as a **local marketplace** pointing at this checkout:

- `.claude-plugin/marketplace.json` (in this repo, committed) declares a
  marketplace named `learning-tools` with one plugin entry, `learning-plugin`,
  sourced from `./learning-plugin`.
- The marketplace and the plugin were then registered with the Claude Code CLI:

  ```bash
  claude plugin marketplace add .
  claude plugin install learning-plugin@learning-tools
  ```

These two commands write to your **user-level** `~/.claude/settings.json`
(`extraKnownMarketplaces` and `enabledPlugins`), not to anything in this repo.
That means:

- The plugin is enabled for you personally, in every project, not just this
  one — it is a per-machine setting, not a per-repo one.
- Anyone else who clones this repo must run the same two commands themselves;
  committing `.claude-plugin/marketplace.json` only gives them the marketplace
  definition, not the registration.

## How to use the plugin while developing it

1. Edit anything under `learning-plugin/agents/`, `learning-plugin/skills/`, or
   `learning-plugin/reference/`.
2. Start a new Claude Code session (or run `/reload-plugins` if your build
   supports it) — plugin content is not hot-reloaded into a running session.
3. The plugin's slash-command skills (e.g. `/learning-requirements-gatherer`)
   and its subagents (e.g. `learning-project-manager`,
   `learning-curriculum-architect`) are now available like any built-in
   command or agent — no need to reference file paths manually.
4. Exercise the change against one of the `learning-test-course-*/` folders,
   which hold sample `specifications/`, `design/`, and `material/` content to
   run the pipeline against.
5. After changing **any** file under `learning-plugin/agents/` or
   `learning-plugin/skills/`, run the `learning-support-agent-coherence`
   skill. It checks for name/path/ownership drift across agents and skills,
   reports first, and only edits after you approve.

## Useful commands

```bash
# See what's installed and enabled
claude plugin list

# Inspect the plugin's components and their token cost
claude plugin details learning-plugin@learning-tools

# Validate the manifests (catches YAML/schema errors early)
claude plugin validate .
claude plugin validate ./learning-plugin

# Remove the plugin or the marketplace if you need to start over
claude plugin uninstall learning-plugin@learning-tools
claude plugin marketplace remove learning-tools
```

## Known issue

`claude plugin validate ./learning-plugin` currently reports a real error, not
just warnings: the YAML frontmatter of
`learning-plugin/agents/learning-reading-guide-author.md` fails to parse
because its `description` field contains an unquoted `kind: reading` sequence,
which YAML reads as a nested mapping. At runtime this agent loads with empty
metadata (name, tools, and model are all silently dropped). Fix by quoting the
`description` value; re-run `learning-support-agent-coherence` afterward since
this touches a file under `learning-plugin/agents/`.
