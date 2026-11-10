<!--
  cardBase.vue
  Runs in the RENDERER process (Vue/Quasar). Talks to Electron MAIN via preload (window.ankify.*).

  Responsibilities:
    • Provide a textarea for Japanese input
    • Tokenize text (via MAIN → kuromoji) and let user select "content words"
    • Lookup selected tokens on Jisho (via MAIN → dict:lookup IPC)
    • Present results and allow adding to Anki (via MAIN → ankiconnect:invoke IPC)

  Where logs appear:
    • console.log HERE = DevTools console of the BrowserWindow (renderer)
    • console.warn HERE = same
    • Anything prefixed [main] in your terminal = Electron MAIN logs

  Glossary:
    • kuromoji tokens: array of token objects for Japanese morphs.
      Important fields used here:
        - surface_form   : original surface string as it appeared in text (e.g., "食べる")
        - basic_form     : dictionary/base form (e.g., "食べる"); '*' if not provided
        - pos            : part-of-speech in Japanese ("名詞","動詞","形容詞", etc.)
        - reading, pronunciation, pos_detail_1..3 (not used here but available)

    • Jisho JSON (https://jisho.org/api/v1/search/words):
      Top-level shape from dict:lookup:
        {
          ok: true,
          data: {
            "data": [
              {
                "japanese": [{ "word": "食べる", "reading": "たべる" }, ...],
                "senses": [
                  { "english_definitions": ["to eat", "to consume"], ... },
                  ...
                ],
                ...
              },
              ...
            ]
          }
        }
      We normalize each entry into a simple structure for display & note creation:
        {
          headword: "食べる【たべる】",
          word: "食べる",
          reading: "たべる",
          gloss: "to eat",           // first sense
          senses: ["to eat", ...],   // all glosses (flat list of strings)
          raw: <original Jisho entry>
        }

  Patterns to notice:
    • We use Set for token selections (fast add/remove/has), but Vue reactivity
      doesn't track Set mutations → we re-assign a *new* Set(set) to trigger updates.

    • Promise.all([...]) returns an array-of-arrays (per-token result lists).
      We then call .flat() to collapse one level: [[a,b],[c]] → [a,b,c].
      .flat() with no args = depth 1 by default.

    • We dedupe final results by a computed "key" (headword) using a Set to avoid duplicate cards.
-->
<template>
  <div class="page-background">
    <div class="results-container">
      <!-- Input & loading bar located in TitleBar -->

      <q-banner v-if="searchStore.errorMsg" class="q-mb-sm" dense rounded>
        {{ searchStore.errorMsg }}
      </q-banner>
      <ResultList
        v-if="!searchStore.loading && (searchStore.primaryResults.length || searchStore.secondaryResults.length)"
        :primary-items="searchStore.primaryResults" :secondary-items="searchStore.secondaryResults"
        :adding-items="addingItems" @add-note="onAddNote" @copy="onCopy" @remove="onRemove" />
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import ResultList from 'src/components/ResultList.vue';
import { useSearchStore } from 'stores/search';

const $q = useQuasar();
const searchStore = useSearchStore();
const addingItems = ref(new Set()); // Track items currently being added

onMounted(() => {
  try {
    console.log('ankify bridge keys:', Object.keys(window.ankify || {}))
  } catch (e) {
    console.warn('ankify bridge not available yet:', e)
  }
});

function onRemove(item) {
  searchStore.removeResult(item)
}

// ----------------------------------------------------------------------------
// onAddNote: Build an Anki note payload and POST to AnkiConnect (via MAIN bridge).
// ----------------------------------------------------------------------------
async function onAddNote(item) {
  const itemKey = item.headword; // Use headword as unique key
  if (addingItems.value.has(itemKey)) return;

  addingItems.value.add(itemKey);
  // Trigger reactivity for Set
  addingItems.value = new Set(addingItems.value);

  try {
    const modelName = 'Basic (and reversed card)'; // Deck model; adjust to taste
    const deckName = 'Ankify';

    const note = noteFromResult(item, { modelName, deckName });
    // ipcMain.handle('ankiconnect:invoke') expects: action + params
    // Here action = 'addNote', params = { note }
    const id = await window.ankify.invokeAnki('addNote', { note });
    console.log('addNote id:', id)

    $q.notify({
      type: 'positive',
      message: 'Flashcard successfully created',
      position: 'bottom-right',
      timeout: 2000
    });
  } catch (e) {
    console.error('Add note failed', e)
    $q.notify({
      type: 'negative',
      message: `Failed to add card: ${e.message}`,
      position: 'bottom-right'
    });
  } finally {
    addingItems.value.delete(itemKey);
    addingItems.value = new Set(addingItems.value);
  }
}
// noteFromResult: Translate our normalized Jisho item → AnkiConnect note JSON.
//
// AnkiConnect addNote schema (simplified):
// {
//   "action": "addNote",
//   "version": 6,
//   "params": {
//     "note": {
//       "deckName": "Ankify",
//       "modelName": "Basic (and reversed card)",
//       "fields": { "Front": "...", "Back": "..." },
//       "tags": ["ankify"],
//       "options": { allowDuplicate: false, ... }
//     }
//   }
// }
function noteFromResult(item, { modelName, deckName }) {
  const headword = String(item?.headword ?? '').trim()
  const word = String(item?.word ?? '').trim()
  const reading = String(item?.reading ?? '').trim()
  const sensesWithReadings = item?.sensesWithReadings || []

  // Get selected senses (either from selectedSenses or all senses)
  const selectedSenses = Array.isArray(item?.selectedSenses) && item.selectedSenses.length
    ? item.selectedSenses
    : (Array.isArray(item?.senses) ? item.senses : []);

  // Determine which readings to include based on selected senses
  let activeReadings = new Set()

  if (sensesWithReadings.length > 0) {
    // For each selected sense, find its reading
    for (const selectedSense of selectedSenses) {
      const senseObj = sensesWithReadings.find(s => s.text === selectedSense)
      if (senseObj && senseObj.reading) {
        activeReadings.add(senseObj.reading)
      }
    }
  } else {
    // Fallback: if no sensesWithReadings, use all readings or the single reading
    const allReadings = Array.isArray(item?.readings) ? item.readings : [reading]
    activeReadings = new Set(allReadings.filter(Boolean))
  }

  // Format front: kanji on one line, only selected readings on the next
  let front
  const readingsArray = Array.from(activeReadings).filter(Boolean)

  if (word && readingsArray.length > 0) {
    const readingsText = readingsArray.join('、')
    front = `${word}<br>${readingsText}`
  } else if (word) {
    front = word
  } else if (reading) {
    front = reading
  } else {
    front = headword // fallback to original format
  }

  // Format senses as numbered lines for the "Back" field (each on new line with HTML br tags)
  const back = selectedSenses.length
    ? selectedSenses.map((g, i) => `${i + 1}. ${g}`).join('<br>')
    : '(no gloss)'

  if (!front) throw new Error('Front is empty')

  return {
    deckName,
    modelName,
    fields: { Front: front, Back: back },
    tags: ['ankify', 'picked'],
    options: {
      allowDuplicate: false,
      duplicateScope: 'deck',
      duplicateScopeOptions: { deckName, checkChildren: false, checkAllModels: false }
    }
  }
}

function onCopy(item) {
  navigator.clipboard?.writeText(`${item.headword} — ${item.gloss}`)
}
</script>

<style>
.page-background {
  background-color: #202020;
}

.results-container {
  /* Right padding is 0 because the 14px scrollbar has 4px transparent borders on both left & right of the 6px thumb */
  padding: 8px 0 8px 8px;
}
</style>
