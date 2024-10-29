<script>
  import { MIKA_PIXELS_PER_HOUR } from "/src/helpers/everythingElse.js";

  export let leftOffset

  const timestampDivTopMargin = 24;
  let numOfHourBlocksDisplayed = 24;
  let timesOfDay = getTimesOfDay()

  function getTimesOfDay () {
    const temp = []
    let currentHour = 0; // today.getHours() // get the integer i.e. 0 to 23
    // now generate 16 hours of time (so it covers, for example, 8 am - midnight)
    for (let i = 0; i < numOfHourBlocksDisplayed; i++) {
      if (currentHour === 24) {
        currentHour = 0
      }
      if (currentHour < 10) temp.push("0" + currentHour + ":00")
      else temp.push(currentHour + ":00")
      currentHour += 1
    }
    return temp
  }
</script>

<div class="x-sticky" style="margin-top: {timestampDivTopMargin}px; height: 1700px;">
  {#each timesOfDay as timestamp, i (timestamp)}
    <div
      class="x-sticky timestamp-number"
      style="
        height: {MIKA_PIXELS_PER_HOUR}px; 
        width: var(--timestamps-column-width);
        left: {leftOffset}px
      "
    >
      {timestamp.substring(0, 5)}
    </div>
  {/each}
</div>

<style>
  :root {
    --timestamps-column-width: 64px; /* was 96px */
  }

  .x-sticky {
    position: sticky;
    z-index: 1;
  }
  
  .timestamp-number {
    padding-left: var(--calendar-left-padding);
    color: #6d6d6d;

    /* opaque, so that shifted calendar content will go "underneath" the timestamps */
    background-color: var(--calendar-bg-color);
    z-index: 2;
    font-size: 12px;
  }
</style>
