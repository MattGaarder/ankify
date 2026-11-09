import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSearchStore = defineStore('search', () => {
  // State
  const text = ref('')
  const loading = ref(false)
  const errorMsg = ref('')
  const primaryResults = ref([])
  const secondaryResults = ref([])
  const originalSelection = ref('')

  // Tokenization state
  const tokens = ref([])
  const activeWords = ref(new Set())
  const wordToResults = ref(new Map())
  const analyzing = ref(false)

  // Actions
  function normalizeItem(item) {
    const jp = item.japanese?.[0] || {}
    const word = jp.word || ''
    const reading = jp.reading || ''
    const headword = (word && reading) ? `${word}【${reading}】` : (word || reading || '(no word)')
    const senses = (item.senses || [])
      .map(s => (s.english_definitions || []).join(', '))
      .filter(Boolean)

    return {
      headword,
      word,
      reading,
      gloss: senses[0] || '(no gloss)',
      senses,
      raw: item
    }
  }

  async function analyze(textToAnalyze) {
    const q = textToAnalyze || ''
    if (!q.trim()) {
      tokens.value = []
      return []
    }
    analyzing.value = true
    try {
      const tks = await window.ankify.tokenize(q)
      tokens.value = tks

      const surfaced = tks
        .filter(t => ['名詞', '動詞', '形容詞', '副詞', '連体詞', '感動詞', '接続詞'].includes(t.pos))
        .map(t => (t.basic_form && t.basic_form !== '*') ? t.basic_form : t.surface_form)

      surfaced.unshift(q)

      const uniq = Array.from(new Set(surfaced)).filter(Boolean)
      return uniq
    } catch (e) {
      errorMsg.value = `Tokenization failed: ${String(e)}`
      return []
    } finally {
      analyzing.value = false
    }
  }

  async function lookupSelected(tokensToLookup) {
    if (!tokensToLookup || !tokensToLookup.length) {
      return
    }

    loading.value = true
    errorMsg.value = ''
    primaryResults.value = []
    secondaryResults.value = []
    const newWordToResults = new Map()
    const newActiveWords = new Set()

    try {
      const all = await Promise.all(
        tokensToLookup.map(async term => {
          const res = await window.ankify?.dictLookup?.(term)
          if (!res?.ok) {
            console.warn('[searchStore] dictLookup failed for term:', term, res?.error)
            return { term, items: [] }
          }
          const data = res.data?.data ?? []
          const items = data.map(normalizeItem)
          return { term, items }
        })
      )

      const allResults = []
      for (const { term, items } of all) {
        if (items.length > 0) {
          newWordToResults.set(term, items)
          newActiveWords.add(term)
          allResults.push(...items)
        }
      }

      const seen = new Set()
      const deduped = allResults.filter(it => {
        const key = it.headword
        if (!key || seen.has(key)) return false
        seen.add(key)
        return true
      })

      const kanjiGroups = new Map()
      for (const item of deduped) {
        const key = item.word || item.reading
        if (!key) continue

        if (!kanjiGroups.has(key)) {
          const sensesWithReadings = item.senses.map(sense => ({
            text: sense,
            reading: item.reading || item.word
          }))

          kanjiGroups.set(key, {
            word: item.word || item.reading,
            reading: item.reading || item.word,
            readings: new Set([item.reading || item.word].filter(Boolean)),
            senses: [...item.senses],
            sensesWithReadings,
            gloss: item.gloss,
            raw: item.raw
          })
        } else {
          const group = kanjiGroups.get(key)
          if (item.reading) group.readings.add(item.reading)

          for (const sense of item.senses) {
            const existing = group.sensesWithReadings.find(s => s.text === sense)
            if (!existing) {
              group.sensesWithReadings.push({
                text: sense,
                reading: item.reading || item.word
              })
              group.senses.push(sense)
            }
          }
        }
      }

      const grouped = Array.from(kanjiGroups.values()).map(group => {
        const readingsArray = Array.from(group.readings).filter(Boolean)
        const primaryReading = group.reading || readingsArray[0] || ''
        const hasKanji = group.word && primaryReading && group.word !== primaryReading
        return {
          word: group.word,
          reading: primaryReading,
          readings: readingsArray,
          sensesWithReadings: group.sensesWithReadings,
          headword: hasKanji
            ? (readingsArray.length > 1
                ? `${group.word}【${readingsArray.join('、')}】`
                : `${group.word}【${primaryReading}】`)
            : (group.word || primaryReading),
          gloss: group.gloss,
          senses: group.senses,
          raw: group.raw
        }
      })

      const original = originalSelection.value || ''
      const primary = []
      const secondary = []

      for (const item of grouped) {
        const matchWord = item.word
        const matchReading = item.reading
        if ((matchWord && original.includes(matchWord)) || (matchReading && original.includes(matchReading))) {
          primary.push(item)
        } else {
          secondary.push(item)
        }
      }

      primaryResults.value = primary
      secondaryResults.value = secondary
      wordToResults.value = newWordToResults
      activeWords.value = newActiveWords

      if (!primary.length && !secondary.length) {
        errorMsg.value = 'No results for selected tokens.'
      }
    } catch (e) {
      errorMsg.value = `Lookup failed: ${String(e)}`
    } finally {
      loading.value = false
    }
  }

  async function handleSelection(selectedText) {
    if (selectedText && selectedText.trim().length > 0) {
      originalSelection.value = selectedText
      const tokensToLookup = await analyze(selectedText)
      await lookupSelected(tokensToLookup)
    } else {
      // Clear results if selection is empty
      primaryResults.value = []
      secondaryResults.value = []
      errorMsg.value = ''
      originalSelection.value = ''
    }
  }

  function removeResult(item) {
    const headword = item.headword
    if (!headword) return

    // Remove only the specific result matching the headword
    primaryResults.value = primaryResults.value.filter(result => result.headword !== headword)
    secondaryResults.value = secondaryResults.value.filter(result => result.headword !== headword)

    // If no results left for this word, remove from activeWords
    const word = item.word
    if (word) {
      const remainingForWord = [...primaryResults.value, ...secondaryResults.value].filter(r => r.word === word)
      if (remainingForWord.length === 0) {
        const newActiveWords = new Set(activeWords.value)
        newActiveWords.delete(word)
        activeWords.value = newActiveWords

        const newWordToResults = new Map(wordToResults.value)
        newWordToResults.delete(word)
        wordToResults.value = newWordToResults
      }
    }
  }

  return {
    text,
    loading,
    errorMsg,
    primaryResults,
    secondaryResults,
    originalSelection,
    handleSelection,
    removeResult
  }
})
