# Rendering toolchain for the slide pipeline.
#
# One image, one emitter: the deck model is compiled to pandoc-flavoured Markdown,
# pandoc produces the editable .pptx, and LibreOffice converts *that same pptx* to
# .pdf — so the two formats cannot drift apart stylistically.
#
# Chromium is required by mermaid-cli (diagrams-as-code -> SVG) and is the reason
# this image is large; it is not used for rendering slides.
#
# Build:  tools/slides/slides build
FROM node:20-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive

# System packages:
#   libreoffice-impress  -> pptx -> pdf
#   chromium + fonts     -> mermaid-cli headless rendering
#   python3 + pyyaml     -> the model compiler / linter / coverage scripts
RUN apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates curl \
        libreoffice-impress \
        chromium \
        python3 python3-yaml \
        fonts-dejavu fonts-liberation fonts-noto-color-emoji \
        unzip poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Pandoc from upstream: Debian's package lags, and the pptx writer's speaker-note
# and section-header handling improved after the version bookworm ships.
ARG PANDOC_VERSION=3.1.13
RUN arch="$(dpkg --print-architecture)" \
    && curl -fsSL -o /tmp/pandoc.deb \
        "https://github.com/jgm/pandoc/releases/download/${PANDOC_VERSION}/pandoc-${PANDOC_VERSION}-1-${arch}.deb" \
    && dpkg -i /tmp/pandoc.deb \
    && rm /tmp/pandoc.deb

# mermaid-cli, reusing the system chromium instead of downloading a second one.
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
RUN npm install -g @mermaid-js/mermaid-cli@11 && npm cache clean --force

# The container runs as the invoking host user (see the `slides` wrapper), so every
# tool that wants a writable HOME must tolerate one it does not own.
ENV HOME=/tmp \
    XDG_CACHE_HOME=/tmp/.cache \
    XDG_CONFIG_HOME=/tmp/.config \
    PUPPETEER_CONFIG=/opt/slides/puppeteer.json

COPY puppeteer.json /opt/slides/puppeteer.json

WORKDIR /work
