<script>
  export let timestampsColumnWidth = 64
  export let pixelsPerHour

  export let topMargin
  export let compactTimestamps = false
  export let numOfDisplayedHours = 24
  export let startHour = 0

  let timesOfDay = getTimesOfDay(compactTimestamps)

  function getTimesOfDay () {
    const temp = [];
    let currentHour = startHour;
    for (let i = 0; i < numOfDisplayedHours; i++) {
      if (currentHour === 24) {
        currentHour = 0;
      }
      let timestamp = currentHour <  10 ? `0${currentHour}` : `${currentHour}`
      if (!compactTimestamps) {
        timestamp = timestamp + ':00'
      }
      temp.push(timestamp)

      currentHour += 1;
    }
    return temp;
  }
</script>

<div class="timestamps" style="--timestamps-column-width: {timestampsColumnWidth}px; margin-top: {topMargin}px;">
  {#each timesOfDay as timestamp, i (timestamp)}
    <div
      class="timestamp-number"
      style="height: {pixelsPerHour}px;"
    >
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

  .timestamp-number {
    text-align: center;
    color: #6d6d6d;
    background-color: var(--calendar-bg-color);
    z-index: 2;
    font-size: 12px;
  }
</style> 