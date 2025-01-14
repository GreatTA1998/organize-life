<script>
  import { user } from '/src/store'
  import { WIDTHS } from '/src/helpers/constants.js'
  import { getTimestamps, getMinutesDiff } from '/src/helpers/calendarTimestamps.js'

  export let pixelsPerHour
  export let topMargin
  export let isCompact = false

  let timestampsColumnWidth = isCompact ? WIDTHS.MOBILE_TIME_AXIS : WIDTHS.DESKTOP_TIME_AXIS

  let timesOfDay = getTimestamps({ calEarliestHHMM: '07:15', calLatestHHMM: '23:15' })
  const minutesDiff = getMinutesDiff({ calEarliestHHMM: '07:15', calLatestHHMM: '23:15' })

  $: if ($user) {
    timesOfDay = getTimestamps({ calEarliestHHMM: '07:15', calLatestHHMM: '23:15' })
  }

  getTimestamps({ calEarliestHHMM: '07:15', calLatestHHMM: '23:15' })

  function getTopOffset (timestamp) {
    return (timeToMinutes(timestamp) - timeToMinutes('07:15')) * (pixelsPerHour / 60)
  }

  function timeToMinutes (time) {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }
</script>

<div class="timestamps" style="
  height: {minutesDiff * (pixelsPerHour / 60)}px;
  --timestamps-column-width: {timestampsColumnWidth}px; 
  margin-top: {topMargin}px;"
>
  {#each timesOfDay as timestamp, i (timestamp)}
    <div class="absolute-timestamp" style="top: {getTopOffset(timestamp)}px;">
      {timestamp.substring(0, 5)}
    </div>
  {/each}
</div>

<style>
  .timestamps {
    position: sticky;
    left: 0;
    top: 40px; /* Adjust based on your header height */
    background: var(--calendar-bg-color);
    z-index: 2;
    border-right: 1px solid lightgrey;
    width: var(--timestamps-column-width);
  }

  .absolute-timestamp {
    position: absolute;
    width: 100%; /* because <div> no longer fills to its parent's width if it's absolutely positioned  */
    text-align: center;
    color: #6d6d6d;
    background-color: var(--calendar-bg-color);
    z-index: 2;
    font-size: 12px;
  }
</style> 