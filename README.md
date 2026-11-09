# Ankify ⚡

A lightweight macOS menu-bar popover application for Japanese language learners. Paste Japanese text from anywhere, break it down with morphological analysis, select definitions via Jisho, and export flashcards directly to your local Anki deck.

---

## ✨ Features

- **Menu Bar Tray Popover**: Lives unobtrusively in your macOS status bar; toggle open with a click or keyboard shortcut.
- **Morphological Tokenization**: Uses [`kuromoji.js`](https://github.com/takuyaa/kuromoji.js) in Electron's main process to parse sentences into individual words, parts of speech, and dictionary base forms.
- **Jisho.org Integration**: Queries live definitions and readings for all selected tokens.
- **Granular Sense Selection**: Choose which definitions and readings to include on your flashcard.
- **AnkiConnect Export**: Automatically formats front/back cards with kanji, readings, and numbered glosses, sending them straight to your local Anki collection via [AnkiConnect](https://foosoft.net/projects/anki-connect/).
- **Modern Dark UI**: Built with Vue 3, Pinia state management, and Quasar Framework.

---

## 🛠️ Prerequisites

1. **Node.js**: `v18` or higher.
2. **Anki Desktop**: Running locally with the [AnkiConnect](https://foosoft.net/projects/anki-connect/) add-on (code: `2055492159`).
   - Default endpoint: `http://127.0.0.1:8765`
   - Default note type: `Basic (and reversed card)`
   - Default deck: `Ankify` (created automatically if configured)

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Run in development mode (Electron)
```bash
npx quasar dev -m electron
```
> You will see `[main] app is ready` in your terminal logs and the Ankify icon will appear in your macOS menu bar.

### 3. Lint the codebase
```bash
npm run lint
```

### 4. Build for production
```bash
npx quasar build -m electron
```

---

## 🏗️ Architecture

```text
ankify/
├── src-electron/
│   ├── electron-main.js        # Main process: Tray window, IPC handlers, kuromoji tokenizer, Jisho & AnkiConnect bridges
│   ├── electron-preload.js     # Context bridge: exposes window.ankify API to Vue
│   └── icons/                  # macOS menu bar template icons (1x and @2x Retina)
└── src/
    ├── components/
    │   ├── TitleBar.vue        # Custom frameless window header, search input, and window controls
    │   └── ResultList.vue      # Token definition cards, multi-sense checkboxes, and Anki actions
    ├── stores/
    │   └── search.js           # Pinia store managing tokenization state, active queries, and selected senses
    ├── pages/
    │   └── cardBase.vue        # Main application layout and token chip picker
    └── assets/
        └── anki-logo.svg       # Vector icon
```

---

## 📜 License

MIT © Matt Gaarder
