<!-- src/components/ResultList.vue -->
<template>
  <div class="results-list column">
    <!-- Primary Results -->
    <div class="primary-results column">
      <q-card v-for="(it, idx) in primaryItems" :key="`primary-${it.headword}`" flat class="result-card"
        :class="{ 'is-dismissed': dismissing.has(it.headword) }"
        :style="!supportsSiblingIndex ? { '--sibling-index': idx + 1 } : undefined">
        <div class="card-header column">
          <div class="row items-center justify-between no-wrap full-width">
            <div class="card-headword col q-pr-xs">{{ getSelectedHeadword(idx, it) }}</div>
            <div class="col-auto row items-center no-wrap card-controls">
              <div class="selection-count">{{ (selected[idx] || []).length }}/{{ it.senses.length }}</div>
              <q-btn dense flat no-caps size="sm" label="Select all" class="selection-btn" @click="selectAll(idx, it)"
                :title="'Select all senses'" />
              <q-btn dense flat no-caps size="sm" label="Clear" class="selection-btn" @click="selectNone(idx)"
                :title="'Deselect all'" />
              <q-btn dense flat class="action-btn" icon="add" :disable="(selected[idx] || []).length === 0"
                :loading="addingItems.has(it.headword)" :title="'Add to Anki (only selected senses)'"
                @click="emitAdd(idx, it)" />
              <q-btn dense flat class="action-btn" icon="content_copy" @click="$emit('copy', it)" :title="'Copy'" />
              <q-btn dense flat class="action-btn action-btn-close" icon="close"
                @click="handleRemove(it, $event)" :title="'Remove'" />
            </div>
          </div>
          <div class="card-gloss full-width">{{ getSelectedGloss(idx, it) }}</div>
        </div>

        <!-- Full-width divider between card preview and selector -->
        <div class="card-divider"></div>

        <!-- Senses selector section -->
        <div class="card-body">
          <!-- Checkbox list -->
          <div class="senses-list column">
            <q-checkbox v-for="senseItem in getPreviewSenses(it)" :key="senseItem.originalIndex" dense
              :model-value="(selected[idx] || []).includes(senseItem.originalIndex)"
              @update:model-value="(val) => toggle(idx, senseItem.originalIndex, val)" color="grey-4"
              class="sense-checkbox">
              <template v-slot:default>
                <span class="sense-text">{{ typeof senseItem.item === 'string' ? senseItem.item : senseItem.item.text }}</span>
                <span v-if="senseItem.item.reading" class="sense-reading"> ({{ senseItem.item.reading }})</span>
              </template>
            </q-checkbox>

            <!-- Smoothly animated expandable extra senses -->
            <div v-if="getExtraSenses(it).length > 0" class="extra-senses-collapsible"
              :class="{ 'is-expanded': expanded[idx] }" :inert="!expanded[idx] || undefined">
              <div class="extra-senses-list column">
                <q-checkbox v-for="senseItem in getExtraSenses(it)" :key="senseItem.originalIndex" dense
                  :model-value="(selected[idx] || []).includes(senseItem.originalIndex)"
                  @update:model-value="(val) => toggle(idx, senseItem.originalIndex, val)" color="grey-4"
                  class="sense-checkbox">
                  <template v-slot:default>
                    <span class="sense-text">{{ typeof senseItem.item === 'string' ? senseItem.item : senseItem.item.text }}</span>
                    <span v-if="senseItem.item.reading" class="sense-reading"> ({{ senseItem.item.reading }})</span>
                  </template>
                </q-checkbox>
              </div>
            </div>

            <!-- Show more/less button -->
            <q-btn v-if="getSensesList(it).length > SENSES_PREVIEW_LIMIT" flat dense no-caps size="sm"
              :aria-expanded="Boolean(expanded[idx])"
              :label="expanded[idx] ? 'Show less' : `Show ${getSensesList(it).length - SENSES_PREVIEW_LIMIT} more...`"
              class="show-more-btn self-start" @click="expanded[idx] = !expanded[idx]" />
          </div>
        </div>
      </q-card>
    </div>

    <!-- Secondary Results (Collapsible) -->
    <div v-if="secondaryItems.length > 0" class="secondary-header-wrapper"
      :style="{ '--secondary-delay-index': primaryItems.length }">
      <q-expansion-item dense icon="more_horiz" label="More readings"
        header-class="secondary-header" class="secondary-expansion">
        <div class="secondary-results-list column">
          <q-card v-for="(it, idx) in secondaryItems" :key="`secondary-${it.headword}`" flat class="result-card"
            :class="{ 'is-dismissed': dismissing.has(it.headword) }"
            :style="!supportsSiblingIndex ? { '--sibling-index': idx + 1 } : undefined">
            <div class="card-header column">
              <div class="row items-center justify-between no-wrap full-width">
                <div class="card-headword col q-pr-xs">{{ getSelectedHeadwordSecondary(idx, it) }}</div>
                <div class="col-auto row items-center no-wrap card-controls">
                  <div class="selection-count">{{ (secondarySelected[idx] || []).length }}/{{ it.senses.length }}</div>
                  <q-btn dense flat no-caps size="sm" label="Select all" class="selection-btn"
                    @click="selectAllSecondary(idx, it)" :title="'Select all senses'" />
                  <q-btn dense flat no-caps size="sm" label="Clear" class="selection-btn"
                    @click="selectNoneSecondary(idx)" :title="'Deselect all'" />
                  <q-btn dense flat icon="add" :disable="(secondarySelected[idx] || []).length === 0"
                    :loading="addingItems.has(it.headword)" :title="'Add to Anki (only selected senses)'"
                    class="action-btn" @click="emitAddSecondary(idx, it)" />
                  <q-btn dense flat icon="content_copy" class="action-btn" @click="$emit('copy', it)"
                    :title="'Copy'" />
                  <q-btn dense flat icon="close" class="action-btn action-btn-close"
                    @click="handleRemove(it, $event)" :title="'Remove'" />
                </div>
              </div>
              <div class="card-gloss full-width">{{ getSelectedGlossSecondary(idx, it) }}</div>
            </div>

            <!-- Full-width divider between card preview and selector -->
            <div class="card-divider"></div>

            <!-- Senses selector section -->
            <div class="card-body">
              <!-- Checkbox list -->
              <div class="senses-list column">
                <q-checkbox v-for="senseItem in getPreviewSenses(it)" :key="senseItem.originalIndex" dense
                  :model-value="(secondarySelected[idx] || []).includes(senseItem.originalIndex)"
                  @update:model-value="(val) => toggleSecondary(idx, senseItem.originalIndex, val)" color="grey-4"
                  class="sense-checkbox">
                  <template v-slot:default>
                    <span class="sense-text">{{ typeof senseItem.item === 'string' ? senseItem.item : senseItem.item.text }}</span>
                    <span v-if="senseItem.item.reading" class="sense-reading"> ({{ senseItem.item.reading }})</span>
                  </template>
                </q-checkbox>

                <!-- Smoothly animated expandable extra senses -->
                <div v-if="getExtraSenses(it).length > 0" class="extra-senses-collapsible"
                  :class="{ 'is-expanded': secondaryExpanded[idx] }" :inert="!secondaryExpanded[idx] || undefined">
                  <div class="extra-senses-list column">
                    <q-checkbox v-for="senseItem in getExtraSenses(it)" :key="senseItem.originalIndex" dense
                      :model-value="(secondarySelected[idx] || []).includes(senseItem.originalIndex)"
                      @update:model-value="(val) => toggleSecondary(idx, senseItem.originalIndex, val)" color="grey-4"
                      class="sense-checkbox">
                      <template v-slot:default>
                        <span class="sense-text">{{ typeof senseItem.item === 'string' ? senseItem.item : senseItem.item.text }}</span>
                        <span v-if="senseItem.item.reading" class="sense-reading"> ({{ senseItem.item.reading }})</span>
                      </template>
                    </q-checkbox>
                  </div>
                </div>

                <!-- Show more/less button -->
                <q-btn v-if="getSensesList(it).length > SENSES_PREVIEW_LIMIT" flat dense no-caps size="sm"
                  :aria-expanded="Boolean(secondaryExpanded[idx])"
                  :label="secondaryExpanded[idx] ? 'Show less' : `Show ${getSensesList(it).length - SENSES_PREVIEW_LIMIT} more...`"
                  class="show-more-btn self-start" @click="secondaryExpanded[idx] = !secondaryExpanded[idx]" />
              </div>
            </div>
          </q-card>
        </div>
      </q-expansion-item>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'
const props = defineProps({
  primaryItems: {
    type: Array,
    default: () => []
  },
  secondaryItems: {
    type: Array,
    default: () => []
  },
  addingItems: {
    type: Set,
    default: () => new Set()
  }
})

const emit = defineEmits(['add-note', 'copy', 'preview', 'remove'])
// selected[idx] = array of selected sense indices for primaryItems[idx]
// secondarySelected[idx] = array of selected sense indices for secondaryItems[idx]

const selected = reactive([])
const secondarySelected = reactive([])
const expanded = reactive([])  // track which primary cards are expanded
const secondaryExpanded = reactive([])  // track which secondary cards are expanded
const dismissing = reactive(new Set())  // track cards currently animating out
const SENSES_PREVIEW_LIMIT = 5  // show first 5 senses by default
const supportsSiblingIndex =
  typeof CSS !== 'undefined' && CSS.supports('animation-delay: calc(sibling-index() * 0.1s)')

// keep selection array in sync with items length while preserving existing card state on removal
watch(
  () => props.primaryItems,
  (list, oldList = []) => {
    const prevByHeadword = new Map()
    oldList.forEach((it, idx) => {
      if (it?.headword) {
        prevByHeadword.set(it.headword, {
          selected: selected[idx],
          expanded: expanded[idx]
        })
      }
    })

    selected.length = 0
    expanded.length = 0
    list.forEach((it, idx) => {
      const prev = prevByHeadword.get(it.headword)
      if (prev && Array.isArray(prev.selected)) {
        selected[idx] = prev.selected
        expanded[idx] = Boolean(prev.expanded)
      } else {
        selected[idx] = Array.from({ length: it.senses?.length || 0 }, (_, i) => i)
        expanded[idx] = false
      }
    })
  },
  { immediate: true, deep: false }
)

watch(
  () => props.secondaryItems,
  (list, oldList = []) => {
    const prevByHeadword = new Map()
    oldList.forEach((it, idx) => {
      if (it?.headword) {
        prevByHeadword.set(it.headword, {
          selected: secondarySelected[idx],
          expanded: secondaryExpanded[idx]
        })
      }
    })

    secondarySelected.length = 0
    secondaryExpanded.length = 0
    list.forEach((it, idx) => {
      const prev = prevByHeadword.get(it.headword)
      if (prev && Array.isArray(prev.selected)) {
        secondarySelected[idx] = prev.selected
        secondaryExpanded[idx] = Boolean(prev.expanded)
      } else {
        secondarySelected[idx] = Array.from({ length: it.senses?.length || 0 }, (_, i) => i)
        secondaryExpanded[idx] = false
      }
    })
  },
  { immediate: true, deep: false }
)

function handleRemove(it, event) {
  const key = it.headword
  if (!key || dismissing.has(key)) return
  dismissing.add(key)

  const cardEl = event?.currentTarget?.closest?.('.result-card')
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches

  if (!cardEl || prefersReducedMotion) {
    dismissing.delete(key)
    emit('remove', it)
    return
  }

  let done = false
  const finish = () => {
    if (done) return
    done = true
    cardEl.hidden = true
    dismissing.delete(key)
    emit('remove', it)
  }

  cardEl.addEventListener('transitionend', (e) => {
    if (e.target === cardEl && e.propertyName === 'block-size') {
      finish()
    }
  })
  setTimeout(finish, 300)
}

function toggle(cardIdx, senseIdx, isOn) {
  const arr = selected[cardIdx]
  if (!arr) return
  const pos = arr.indexOf(senseIdx)
  if (isOn && pos === -1) arr.push(senseIdx)
  if (!isOn && pos !== -1) arr.splice(pos, 1)
}

function toggleSecondary(cardIdx, senseIdx, isOn) {
  const arr = secondarySelected[cardIdx]
  if (!arr) return
  const pos = arr.indexOf(senseIdx)
  if (isOn && pos === -1) arr.push(senseIdx)
  if (!isOn && pos !== -1) arr.splice(pos, 1)
}

function selectAll(cardIdx, it) {
  selected[cardIdx] = Array.from({ length: it.senses?.length || 0 }, (_, i) => i)
}

function selectNone(cardIdx) {
  selected[cardIdx] = []
}

// Helper to get the senses list
function getSensesList(it) {
  return it.sensesWithReadings || it.senses.map(s => ({ text: s, reading: it.reading }))
}

// First N senses always visible
function getPreviewSenses(it) {
  return getSensesList(it)
    .slice(0, SENSES_PREVIEW_LIMIT)
    .map((item, originalIndex) => ({ item, originalIndex }))
}

// Remaining senses inside animated collapsible container
function getExtraSenses(it) {
  return getSensesList(it)
    .slice(SENSES_PREVIEW_LIMIT)
    .map((item, idx) => ({ item, originalIndex: SENSES_PREVIEW_LIMIT + idx }))
}

function selectAllSecondary(cardIdx, it) {
  secondarySelected[cardIdx] = Array.from({ length: it.senses?.length || 0 }, (_, i) => i)
}

function selectNoneSecondary(cardIdx) {
  secondarySelected[cardIdx] = []
}

// Get selected senses as a comma-separated string for gloss display
function getSelectedGloss(idx, it) {
  const selectedIndices = selected[idx] || []
  if (selectedIndices.length === 0) return '(no senses selected)'

  const sensesList = it.sensesWithReadings || it.senses.map(s => ({ text: s, reading: it.reading }))
  const selectedSenses = selectedIndices
    .sort((a, b) => a - b)
    .map(i => {
      const sense = sensesList[i]
      return typeof sense === 'string' ? sense : sense.text
    })

  return selectedSenses.join(', ')
}

function getSelectedGlossSecondary(idx, it) {
  const selectedIndices = secondarySelected[idx] || []
  if (selectedIndices.length === 0) return '(no senses selected)'

  const sensesList = it.sensesWithReadings || it.senses.map(s => ({ text: s, reading: it.reading }))
  const selectedSenses = selectedIndices
    .sort((a, b) => a - b)
    .map(i => {
      const sense = sensesList[i]
      return typeof sense === 'string' ? sense : sense.text
    })

  return selectedSenses.join(', ')
}

// Get headword with only selected readings
function getSelectedHeadword(idx, it) {
  const selectedIndices = selected[idx] || []
  if (selectedIndices.length === 0) return it.word || it.headword

  const sensesList = it.sensesWithReadings || it.senses.map(s => ({ text: s, reading: it.reading }))

  // Collect unique readings from selected senses
  const activeReadings = new Set()
  selectedIndices.forEach(i => {
    const sense = sensesList[i]
    const reading = (typeof sense === 'string') ? it.reading : sense.reading
    if (reading) activeReadings.add(reading)
  })

  const readingsArray = Array.from(activeReadings)
  if (readingsArray.length === 0) return it.word || it.headword

  return `${it.word}【${readingsArray.join('、')}】`
}

function getSelectedHeadwordSecondary(idx, it) {
  const selectedIndices = secondarySelected[idx] || []
  if (selectedIndices.length === 0) return it.word || it.headword

  const sensesList = it.sensesWithReadings || it.senses.map(s => ({ text: s, reading: it.reading }))

  // Collect unique readings from selected senses
  const activeReadings = new Set()
  selectedIndices.forEach(i => {
    const sense = sensesList[i]
    const reading = (typeof sense === 'string') ? it.reading : sense.reading
    if (reading) activeReadings.add(reading)
  })

  const readingsArray = Array.from(activeReadings)
  if (readingsArray.length === 0) return it.word || it.headword

  return `${it.word}【${readingsArray.join('、')}】`
}

// Emit the item with selected senses only
function emitAdd(idx, it) {
  const picked = (selected[idx] || [])
    .sort((a, b) => a - b)
    .map(i => it.senses[i])

  const payload = {
    ...it,
    // add an explicit selectedSenses array for the parent
    selectedSenses: picked
  }
  emit('add-note', payload)
}

function emitAddSecondary(idx, it) {
  const picked = (secondarySelected[idx] || [])
    .sort((a, b) => a - b)
    .map(i => it.senses[i])

  const payload = {
    ...it,
    selectedSenses: picked
  }
  emit('add-note', payload)
}


</script>

<style scoped>
.results-list {
  gap: 8px;
}

.primary-results,
.secondary-results-list {
  gap: 8px;
}

.secondary-results-list {
  padding-top: 8px;
}

/* Staggered card entry animation */
@keyframes card-enter {
  from {
    opacity: 0;
    translate: 0 10px;
  }
  to {
    opacity: 1;
    translate: 0 0;
  }
}

/* Notion / Gemini dark surface card */
.result-card {
  --stagger-time: 0.06s;
  block-size: auto;
  background-color: #191919;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 0;
  overflow: hidden;
  transition:
    block-size 0.25s cubic-bezier(0.22, 1, 0.36, 1),
    margin-bottom 0.25s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.2s ease,
    translate 0.22s cubic-bezier(0.22, 1, 0.36, 1),
    border-color 0.15s ease,
    background-color 0.15s ease;
  animation: card-enter 0.28s cubic-bezier(0.22, 1, 0.36, 1) backwards;
  animation-delay: calc((var(--sibling-index, 1) - 1) * var(--stagger-time));
  animation-delay: calc((sibling-index() - 1) * var(--stagger-time));

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    transition: none !important;
  }
}

.result-card.is-dismissed {
  animation: none;
  block-size: 0;
  margin-bottom: -8px;
  border-width: 0;
  opacity: 0;
  translate: 0 -6px;
  pointer-events: none;
}

.secondary-header-wrapper {
  --stagger-time: 0.06s;
  animation: card-enter 0.28s cubic-bezier(0.22, 1, 0.36, 1) backwards;
  animation-delay: calc(var(--secondary-delay-index, 0) * var(--stagger-time));

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
}

.result-card:hover {
  border-color: rgba(255, 255, 255, 0.13);
}

.card-header {
  padding: 12px 12px 12px 14px;
}

.card-headword {
  font-size: 0.98rem;
  font-weight: 600;
  color: #f0f0f0;
  line-height: 1.35;
  letter-spacing: -0.01em;
}

.card-gloss {
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.55);
  line-height: 1.45;
  margin-top: 3px;
}

.card-controls {
  gap: 2px;
  flex-shrink: 0;
}

.selection-count {
  font-size: 0.68rem;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: rgba(255, 255, 255, 0.5);
  background-color: rgba(255, 255, 255, 0.06);
  padding: 1px 5px;
  border-radius: 5px;
  line-height: 1.4;
}

.selection-btn {
  font-size: 0.7rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.55);
  border-radius: 5px;
  padding: 1px 5px;
  min-height: 20px;
}

.selection-btn:hover {
  color: rgba(255, 255, 255, 0.9);
  background-color: rgba(255, 255, 255, 0.08);
}

.action-btn {
  color: rgba(255, 255, 255, 0.55);
  border-radius: 5px;
  width: 20px;
  height: 20px;
  min-width: 20px;
  min-height: 20px;
  padding: 0;
  transition: color 0.15s ease, background-color 0.15s ease;
}

.action-btn :deep(.q-icon) {
  font-size: 14px;
}

.action-btn:hover {
  color: #ffffff;
  background-color: rgba(255, 255, 255, 0.08);
}

/* Edge-to-edge full-width divider */
.card-divider {
  width: 100%;
  height: 1px;
  background-color: rgba(255, 255, 255, 0.08);
  margin: 0;
}

.card-body {
  padding: 6px 14px 8px;
}

.senses-list,
.extra-senses-list {
  gap: 0;
}

.extra-senses-collapsible {
  block-size: 0;
  opacity: 0;
  overflow: hidden;
  transition:
    block-size 0.25s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.2s ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none !important;
  }
}

.extra-senses-collapsible.is-expanded {
  block-size: auto;
  opacity: 1;
}

.sense-checkbox {
  padding: 1px 6px;
  margin: 0 -6px;
  min-height: 22px;
  border-radius: 5px;
  transition: background-color 0.12s ease;
}

.sense-checkbox:hover {
  background-color: rgba(255, 255, 255, 0.04);
}

.sense-checkbox :deep(.q-checkbox__inner) {
  font-size: 26px;
}

.sense-checkbox :deep(.q-checkbox__bg) {
  border-radius: 3px;
  border-width: 1.5px;
  border-color: rgba(255, 255, 255, 0.28);
}

.sense-checkbox :deep(.q-checkbox__inner--truthy .q-checkbox__bg) {
  background: rgba(255, 255, 255, 0.72);
  border-color: rgba(255, 255, 255, 0.72);
}

.sense-checkbox :deep(.q-checkbox__svg) {
  color: #191919;
}

.sense-text {
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.25;
}

.sense-reading {
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.45);
  line-height: 1.25;
}

.show-more-btn {
  font-size: 0.73rem;
  color: rgba(255, 255, 255, 0.5);
  border-radius: 5px;
  margin-top: 2px;
  padding: 1px 6px;
  min-height: 20px;
}

.show-more-btn:hover {
  color: rgba(255, 255, 255, 0.85);
  background-color: rgba(255, 255, 255, 0.06);
}

/* Secondary expansion styling */
.secondary-expansion :deep(.secondary-header) {
  background-color: #191919;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.65);
  font-size: 0.8125rem;
  font-weight: 500;
  min-height: 36px;
  padding: 4px 12px;
  transition: border-color 0.15s ease, color 0.15s ease;
}

.secondary-expansion :deep(.secondary-header:hover) {
  border-color: rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.9);
}

.secondary-expansion :deep(.q-item__section--avatar) {
  min-width: 28px;
  padding-right: 8px;
  color: rgba(255, 255, 255, 0.5);
}
</style>
