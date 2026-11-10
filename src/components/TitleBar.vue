<template>
  <div class="title-bar column no-wrap text-white">
    <!-- Top Row: Native macOS Traffic Lights Space & Draggable Header -->
    <div class="title-bar-header row items-center full-width"></div>

    <!-- Bottom Row: Search/Input Area -->
    <div class="title-input-wrapper full-width scroll-y" :style="{ height: inputHeight + 'px' }">
      <q-input ref="inputRef" v-model="searchStore.text" borderless dense type="textarea" placeholder="Search..."
        class="title-input full-width" input-class="text-white"
        input-style="min-height: 24px; line-height: 1.5; resize: none;" @mouseup="onTextSelect" @keyup="onTextSelect"
        @paste="onPaste" />
    </div>

    <!-- Divider & Resize Handle (with grounded full-width loading bar) -->
    <div class="resize-handle full-width" @mousedown="startDrag">
      <q-linear-progress v-if="searchStore.loading" indeterminate color="white" track-color="transparent"
        class="divider-progress" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useSearchStore } from 'stores/search'

const searchStore = useSearchStore()
const inputRef = ref(null)
const inputHeight = ref(250)
const isDragging = ref(false)
const startY = ref(0)
const startHeight = ref(0)

function onTextSelect(event) {
  const input = event.target
  const start = input.selectionStart
  const end = input.selectionEnd
  const selectedText = input.value.substring(start, end)

  searchStore.handleSelection(selectedText)
}

function onPaste() {
  // Wait a tick so the paste finishes first
  setTimeout(() => {
    if (inputRef.value) {
      inputRef.value.focus()
      inputRef.value.select()

      // Trigger search on the full text
      const text = searchStore.text
      if (text) {
        searchStore.handleSelection(text)
      }
    }
  }, 0)
}

// Drag logic
function startDrag(event) {
  console.log('[TitleBar] startDrag called', { clientY: event.clientY })
  event.preventDefault()
  event.stopPropagation() // Prevent parent drag region from interfering

  isDragging.value = true
  startY.value = event.clientY
  startHeight.value = inputHeight.value

  console.log('[TitleBar] Starting drag', { isDragging: isDragging.value, startY: startY.value, startHeight: startHeight.value })

  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  document.body.style.cursor = 'ns-resize'
}

function onDrag(event) {
  if (!isDragging.value) {
    console.log('[TitleBar] onDrag called but not dragging')
    return
  }

  const deltaY = event.clientY - startY.value
  const newHeight = startHeight.value + deltaY

  console.log('[TitleBar] onDrag', {
    clientY: event.clientY,
    deltaY,
    startHeight: startHeight.value,
    newHeight,
    constrainedHeight: Math.max(40, Math.min(newHeight, 400))
  })

  // Constrain height (min 40px, max 400px)
  inputHeight.value = Math.max(40, Math.min(newHeight, 400))
}

function stopDrag() {
  console.log('[TitleBar] stopDrag called', { finalHeight: inputHeight.value })
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.body.style.cursor = ''
}
</script>

<style scoped>
.title-bar {
  width: 100%;
  background-color: #191919;
  -webkit-app-region: drag;
  user-select: none;
  -webkit-user-select: none;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  transition: height 0.2s;
}

.title-bar-header {
  height: 28px;
  min-height: 28px;
  background-color: #191919;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  -webkit-app-region: drag;
  user-select: none;
  -webkit-user-select: none;
}

.title-bar :deep(button),
.title-bar :deep(input),
.title-bar :deep(textarea),
.title-bar :deep(select),
.title-bar :deep(.q-btn),
.title-bar :deep(.q-field),
.title-bar :deep(.q-icon) {
  -webkit-app-region: no-drag;
}

.title-input-wrapper {
  background-color: #191919;
  padding: 6px 0 6px 10px;
  -webkit-app-region: no-drag;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  min-height: 40px;
  max-height: 400px;
}

/* Make the input fill the container */
:deep(.title-input) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.title-input .q-field__inner) {
  height: 100%;
}

:deep(.title-input .q-field__control) {
  height: 100%;
  min-height: unset;
}

:deep(.title-input textarea) {
  height: 100% !important;
  padding: 0 !important;
  resize: none;
}

/* Custom scrollbar for the input area */
.title-input-wrapper::-webkit-scrollbar {
  width: 14px;
}

.title-input-wrapper::-webkit-scrollbar-track {
  background: transparent;
}

.title-input-wrapper::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.36);
  border-radius: 9999px;
  border-right: 4px solid transparent;
  border-left: 2px solid transparent;
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
  background-clip: padding-box;
}

.title-input-wrapper::-webkit-scrollbar-thumb:hover {
  background-color: rgba(255, 255, 255, 0.52);
}

.resize-handle {
  position: relative;
  height: 1px;
  background: rgba(255, 255, 255, 0.12);
  cursor: ns-resize;
  -webkit-app-region: no-drag;
  transition: background-color 0.15s ease;
  flex-shrink: 0;
}

.resize-handle::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: -4px;
  bottom: -4px;
  z-index: 2;
}

.resize-handle:hover {
  background: rgba(255, 255, 255, 0.3);
}

.divider-progress {
  position: absolute;
  left: 0;
  right: 0;
  top: -1px;
  height: 2px;
  z-index: 3;
}

/* Custom styling for q-input to match the look */
:deep(.title-input .q-field__control) {
  background: transparent;
  /* Removed background to blend better or use rgba(255, 255, 255, 0.05) */
  border-radius: 4px;
  padding: 0;
  /* Remove padding to align with edge if needed, or keep small */
}

:deep(.title-input .q-field__control:before),
:deep(.title-input .q-field__control:after) {
  display: none;
  /* Remove underline/border */
}

:deep(.title-input.q-field--focused .q-field__control) {
  background: transparent;
  /* Remove glow/background change on focus */
  box-shadow: none;
  /* Ensure no shadow */
}
</style>
