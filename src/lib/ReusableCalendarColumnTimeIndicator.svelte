<div class="current-time-indicator-container" 
  style="top: {timeIndicatorOffset}px;"
> 
  <hr 
    style="border: 2px solid var(--location-indicator-color); border-radius: 5px; width: 100%; margin-top: 0px; margin-bottom: 0px;"
    bind:this={CurrentTimeIndicator}
  > 
  <div style="font-size: 12px; color: var(--location-indicator-color); font-weight: 600;">
    {currentTimeString}
  </div>
</div>

<script>
  import { DateTime, Interval } from 'luxon'
  import { onMount, onDestroy } from 'svelte'
  import { hasInitialScrolled } from '/src/store.js'

  export let pixelsPerMinute

  let CurrentTimeIndicator
  let intervalID = ''
  let timeIndicatorOffset
  let currentTimeString

  // this reacts to the Home icon click which resets us back to today's position
  $: if (!$hasInitialScrolled) {
    requestAnimationFrame(() => {
      scrollToTimeIndicator()
    })
  }

  onMount(() => {
    updateTimeIndicator() 
    intervalID = setInterval(updateTimeIndicator, 1000)
  })

  onDestroy(() => {
    clearInterval(intervalID)
  })

  function scrollToTimeIndicator () {
    CurrentTimeIndicator.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'center' })
    requestAnimationFrame(() => {
      hasInitialScrolled.set(true)
    })
  }

  function updateTimeIndicator () {
    timeIndicatorOffset = computeTimeIndicatorOffset()
    currentTimeString = DateTime.now().toLocaleString(DateTime.TIME_24_SIMPLE)
  }

  function computeTimeIndicatorOffset () {
    const now = DateTime.now()
    const startOfDay = now.startOf('day')
    const i = Interval.fromDateTimes(startOfDay, now)
    const minutesDifference = i.length() / (1000 * 60)
    return minutesDifference * pixelsPerMinute
  } 
</script>

<style>
  .current-time-indicator-container {
    display: block; 
    align-items: center;
    position: absolute; 
    width: var(--calendar-day-section-width);
    pointer-events: none;
  }
</style>
