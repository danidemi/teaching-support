# CLAUDE.md

Guidance to Claude Code when working in this repository.

## What this repository is

This multi-repo is several things at once:

1. **A Claude Code plugin** (`learning-plugin`) for planning adult courses and producing their didactic material (slides, quizzes, exercises, manuals). You cannot access this folder because this folder content is rendered based on the jinja2 templates contained in `learning-plugin-jinja2`.
2. **A templetized Claude Code plugin** (``learning-plugin-jinja2`). This is the actual source of the plugin. Every update on the plugin should be applied here.
3. **Few live test course project** (`learning-test-course-<TOPIC>`), likely courses that human can regenerate for testing purpose.
4. **SCRUM management folders** (`learning-software-spec`), a series of folders that try to make you write code following a SCRUM workflow. Based on the SCRUM there, other source is being generated.
5. **Literature** (`learning-literature`), folder generally reserved to human for documentation about topics that are important for the project. Don't access them unless explicitly told.
6. **Tools** (`learning-tools`), a series of tools used across the project.
