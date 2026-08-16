{% extends "agents/_agent_base.md" %}

{% block ground_yourself %}Read, in order:

1. `design/material_authoring_rules.md` — rules shared by every material-authoring subagent.
2. {% block spec_file %}{% endblock %}
3. `.claude/reference/material_catalog.md` — {% block catalog_note %}confirm the path/filename pattern for your output.{% endblock %}
4. `{{ stores.curriculum.path }}` — {% block curriculum_note %}{% endblock %}
5. `{{ stores.design.path }}` — the node(s) {% block design_note %}that item's `node_ref` (or
   `covers_node_refs`) points to.{% endblock %}
6. `{{ stores.editorial_guidelines.path }}`, if it exists — tone, terminology, idiom policy. If
   it does not exist yet, follow the fallback in `material_authoring_rules.md` and record that
   you did.

{% block missing_gap_check %}{% endblock %}{% endblock %}
