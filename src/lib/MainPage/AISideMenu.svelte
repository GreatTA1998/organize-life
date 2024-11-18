<script>
  import AI from '../AI/AI.svelte'

  let aiPanelWidth = 380
  let isResizing = false
  let pressTimer
  let longPressThreshold = 100
  let wasResizing = false

  function startResizing(e) {
    pressTimer = setTimeout(() => {
      isResizing = true
      wasResizing = false
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', stopResizing)
    }, longPressThreshold)
    window.addEventListener('mouseup', clearPressTimer)
  }

  function handleMouseMove(e) {
    if (!isResizing) return
    const newWidth = window.innerWidth - e.clientX
    aiPanelWidth = Math.min(Math.max(newWidth, 1), 900)
  }

  function stopResizing() {
    if (aiPanelWidth < 100) {
      aiPanelWidth = 10
    }
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', stopResizing)
    isResizing = false
  }

  function clearPressTimer() {
    if (pressTimer) {
      clearTimeout(pressTimer)
      pressTimer = null
    }
    window.removeEventListener('mouseup', clearPressTimer)
  }

  function handleResizeClick(e) {
    if (!wasResizing && !isResizing) {
      if (aiPanelWidth < 50) {
        aiPanelWidth = 320
      } else {
        aiPanelWidth = 10
      }
    }
    wasResizing = false
  }
</script>

<div
  style="display:flex; flex: 0 0 {aiPanelWidth}px; position: relative; background-color: var(--navbar-bg-color)"
>
  <!-- <div class="floating-ai-indicator" style="right: {aiPanelWidth + 40}px;">
    <span
      on:click={toggleAI}
      on:keydown
      class="material-symbols-outlined"
      style="font-size: 28px; cursor: pointer;"
    >
      smart_toy
    </span>
  </div> -->
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div
    class="resize-handle"
    on:mousedown={startResizing}
    on:mouseup={handleResizeClick}
    style="touch-action: none; display: flex; position: absolute; left: -15px; top: 0; background-color: var(--navbar-bg-color); width: 15px; height: 100%; cursor: ew-resize;"
  >
    <div class="grip-lines">
      <div></div>
      <div></div>
      <div></div>
    </div>
  </div>
  <AI {aiPanelWidth} />
</div>

<style src="./MainPage.css"></style>
