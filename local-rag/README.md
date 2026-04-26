# Obi

Obi is a local-first desktop RAG (Retrieval-Augmented Generation) app. Point it at a folder, and it indexes your text, code, PDF, and image files so you can ask natural-language questions about them — entirely on-device.

> Your data never leaves your machine. The chat model, embedding model, and image model all run locally via `llama.cpp` sidecars and ONNX Runtime.

---

## Features

- **Local chat with RAG context** — questions are answered using your indexed files; no cloud calls.
- **File watcher** — pick a folder, Obi indexes it and keeps the index in sync as files change.
- **Multi-modal search**
  - Text & code via `nomic-embed-text-v2-moe` semantic embeddings + SQLite FTS5 (BM25) lexical search, fused with Reciprocal Rank Fusion.
  - Images via CLIP (`Xenova/clip-vit-base-patch32`) — ask "do i have apples" and Obi finds your apple photos.
  - **PDF text extraction** via `pdf-parse` — text-based PDFs are chunked and embedded just like other text files.
- **Files screen** — Search mode for keyword queries, **Browse mode** to list every indexed file with filters (modality, source), sort, and per-row Open / Remove actions.
- **Clear / per-file remove** — remove the whole index or evict a single file's chunks, embeddings, and FTS rows in one transaction.
- **Source preview** — click a result to see the matched chunk, file path, and an "Open File" jump.
- **Encrypted local SQLite store** at `~/Library/Application Support/Obi/rag/app.db` (macOS).

## Supported file types

| Modality | Extensions |
|---|---|
| Text | `.txt`, `.md`, `.mdx`, `.json`, `.csv`, `.yaml`, `.yml`, `.toml`, `.xml`, `.log`, `.ini`, `.sql`, **`.pdf`** |
| Code (opt-in) | `.ts`, `.tsx`, `.js`, `.jsx`, `.py`, `.java`, `.go`, `.rs`, … |
| Images | `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif` |

Scanned / image-only PDFs return empty text and are skipped today; visual PDF support is on the roadmap.

---

## Install (macOS)

```bash
git clone git@github.com:durpdur/Obsidian_RAG.git
cd Obsidian_RAG/local-rag
npm install
npx electron-rebuild
```

`electron-rebuild` is the fix for:
> The module `better_sqlite3.node` was compiled against a different Node.js version

### Required model files

Place these `.gguf` files in `local-rag/resources/models/`:

| Role | File | Source |
|---|---|---|
| Chat model | `gemma-4-E2B-it-Q3_K_M.gguf` | https://huggingface.co/lmstudio-community/gemma-4-E2B-it-GGUF/tree/main |
| Embedding model | `nomic-embed-text-v2-moe.Q4_K_M.gguf` | https://huggingface.co/nomic-ai/nomic-embed-text-v2-moe-GGUF/tree/main |

The CLIP image model is downloaded on demand by `@xenova/transformers` on first image index/query and cached under `resources/models/hf-cache/`.

### Run dev

```bash
npm run dev
```

This starts Vite + the Electron main process. Logs print to the terminal (look for `[index]`, `[search]`, `[llama]`, `[embed]`, `[imageEmbedder]` prefixes).

### Common gotchas (macOS)

> "Apple could not verify `llama-server` is free of malware…"

You need to clear the quarantine bit on the bundled binaries:

```bash
xattr -dr com.apple.quarantine resources/bin
```

Or right-click the binary, pick **Open**, and confirm — that whitelists it system-wide.

---

## Install (Windows)

Download a `llama.cpp` Windows release and replace the binaries in `resources/bin/`:

- https://github.com/ggml-org/llama.cpp/releases

Then follow the same `npm install` / model placement steps above.

> Windows packaging support is a work in progress.

---

## Architecture (one-screen overview)

```
┌────────────────┐    IPC    ┌──────────────────────────────────────────┐
│  React/MUI UI  │◀────────▶│  Electron Main                           │
│  (renderer)    │           │   ├─ chatSidecar  → llama.cpp (Gemma)   │
└────────────────┘           │   ├─ embedSidecar → llama.cpp (Nomic)   │
                             │   ├─ imageEmbedder → CLIP (transformers)│
                             │   ├─ fileWatcher  → chokidar            │
                             │   └─ vectorStore  → SQLite + sqlite-vec │
                             └──────────────────────────────────────────┘
                                                │
                                                ▼
                          ┌──────────────────────────────────────────┐
                          │  ~/Library/Application Support/Obi/rag/  │
                          │    app.db    (documents, chunks, FTS,    │
                          │               vector embeddings, images) │
                          └──────────────────────────────────────────┘
```

- **Search pipeline**: text-semantic kNN + text-lexical BM25 + image kNN → Reciprocal Rank Fusion → post-merge image-presence override (force-includes top image when CLIP found a real match below the corpus noise baseline).
- **Chat pipeline**: search retrieves top-K context → augments user prompt → streams from `llama.cpp` chat server back to the renderer over IPC with per-`requestId` cancellation.

---

## Useful env vars

| Var | Default | Effect |
|---|---|---|
| `OBI_IMAGE_BASELINE_RATIO` | `0.95` | Image must be at least 5% closer than the corpus noise baseline to be force-included. Lower = stricter. |
| `OBI_FORCE_IMAGE_DISTANCE_MAX` | unset | Hard absolute ceiling on image distance for force-include. Set if a specific noise number sneaks past the baseline gate. |

---

## Scripts

```bash
npm run dev          # Vite + Electron with hot reload
npm run build        # tsc --noEmit && vite build (renderer bundle)
npm run dist         # build + electron-builder (packaged app)
npm run lint         # ESLint
```
