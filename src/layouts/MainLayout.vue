<template>
  <div class="app-layout column no-wrap text-white">
    <TitleBar />

    <main class="senses-scroll-area col">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import TitleBar from 'components/TitleBar.vue'

// Automatic window resizing disabled to allow manual resizing
// Users can now freely resize the window by dragging edges/corners

/*
let resizeObserver = null

onMounted(() => {
  resizeObserver = new ResizeObserver(() => {
    updateWindowSize()
  })

  // Observe the page content if it exists, otherwise body (fallback)
  const page = document.querySelector('.q-page')
  if (page) {
    resizeObserver.observe(page)
  } else {
    // Retry observing if page isn't mounted yet (e.g. initial load)
    const observer = new MutationObserver((mutations, obs) => {
      const p = document.querySelector('.q-page')
      if (p) {
        resizeObserver.observe(p)
        obs.disconnect()
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })
  }
})

onUnmounted(() => {
  if (resizeObserver) resizeObserver.disconnect()
})

function updateWindowSize() {
  // Calculate desired height: TitleBar + Primary Results + Secondary Header
  // We use querySelector to find elements. Note: ResultList might not be rendered yet.

  const titleBar = document.querySelector('.title-bar')
  const primaryResults = document.querySelector('.primary-results')
  const secondaryHeader = document.querySelector('.secondary-header-wrapper .q-item') // q-expansion-item header is a q-item

  let totalHeight = 0

  if (titleBar) totalHeight += titleBar.offsetHeight
  if (primaryResults) totalHeight += primaryResults.offsetHeight
  if (secondaryHeader) totalHeight += secondaryHeader.offsetHeight

  // Add some padding/buffer (e.g. margins)
  // The q-page has padding, so we might want to measure the q-page-container height instead,
  // but we want to EXCLUDE the expanded secondary content.

  // Better approach: Measure the top of the secondary header relative to the top of the page?
  // Or just sum the parts as requested.

  // If no results, just title bar height + some buffer?
  if (!primaryResults && !secondaryHeader) {
    // Just title bar.
    // But we might have loading bar or error message in cardBase.
    const cardBaseContent = document.querySelector('.q-page > div')
    if (cardBaseContent) {
      totalHeight = cardBaseContent.offsetHeight + (titleBar ? titleBar.offsetHeight : 0)
    } else {
      totalHeight += 20 // minimal buffer
    }
  } else {
    totalHeight += 40 // Add buffer for margins/padding
  }

  // Enforce a minimum height
  totalHeight = Math.max(totalHeight, 100)

  // Send to Electron
  // We keep width 500 (or whatever current width is, handled by main process if we send -1 or similar, but here we send explicit)
  window.ankify.resize(500, totalHeight)
}
*/
</script>

<style scoped>
.app-layout {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: #202020;
}

.senses-scroll-area {
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-gutter: stable;
  background-color: #202020;
}
</style>
