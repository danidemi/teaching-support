# Runtime for the knowledge-graph editor (tools/graph). Unlike tools/slides/Dockerfile there's
# no system package to install here (no pandoc/LibreOffice/Chromium) — this image exists purely
# to provide the Node 20+ this app's package.json requires (`engines.node: >=20`), since the host
# running this repo may only have an older Node (18 at the time this was written).
#
# The image intentionally does not bake in node_modules: the whole repo is bind-mounted at
# runtime (see the `graph` wrapper script), so node_modules ends up on the host, owned by the
# invoking user — the same reasoning tools/slides/Dockerfile documents for why it runs as the
# invoking uid:gid.
#
# Build: tools/graph/graph build
FROM node:20-bookworm-slim

WORKDIR /work
