<script>
  import { onMount } from 'svelte';
  import { DateTime } from 'luxon';

  const DAY_WIDTH = 200;
  const TOTAL_DAYS = 365;
  const HOUR_HEIGHT = 60;
  
  let containerEl;
  let scrollX = 0;
  let scrollY = 0;
  let containerWidth = 0;
  let startDate = DateTime.now().minus({ days: TOTAL_DAYS / 2 });
  
  // Calculate visible range based on scroll position
  $: startIndex = Math.floor(scrollX / DAY_WIDTH);
  $: endIndex = Math.ceil((scrollX + containerWidth) / DAY_WIDTH);
  $: visibleDays = calculateVisibleDays(startIndex, endIndex);
  
  // Generate timestamps (00:00 to 23:00)
  const timestamps = Array.from({ length: 24 }, (_, i) => 
    `${String(i).padStart(2, '0')}:00`
  );

  function calculateVisibleDays(start, end) {
    return Array.from({ length: end - start }, (_, i) => {
      const index = start + i;
      if (index < 0 || index >= TOTAL_DAYS) return null;
      return startDate.plus({ days: index });
    }).filter(Boolean);
  }

  onMount(() => {
    // Start in the middle
    const middleIndex = Math.floor(TOTAL_DAYS / 2);
    containerEl.scrollLeft = middleIndex * DAY_WIDTH;
  });

  function handleScroll(e) {
    scrollX = e.target.scrollLeft;
    scrollY = e.target.scrollTop;
  }
</script>

<div class="calendar-wrapper">
  <!-- Fixed top-left corner with month/year -->
  <div class="corner-label">
    <div class="month">{DateTime.now().toFormat('MMM')}</div>
    <div class="year">{DateTime.now().toFormat('yyyy')}</div>
  </div>

  <!-- Main scrollable container -->
  <div 
    class="calendar-container" 
    bind:this={containerEl}
    bind:clientWidth={containerWidth}
    on:scroll={handleScroll}
  >
    <!-- Large div to enable scrolling -->
    <div class="scroll-content" style:width="{TOTAL_DAYS * DAY_WIDTH}px" style="display: flex;">
      <div class="timestamps">
        {#each timestamps as time}
          <div class="timestamp" style:height="{HOUR_HEIGHT}px">{time}</div>
        {/each}
      </div>

      <!-- Calendar content -->
      {#if visibleDays.length > 0}
        <div 
          class="visible-days"
          style:transform={`translateX(${visibleDays[0].diff(startDate, 'days').days * DAY_WIDTH}px)`}
        >
          <!-- Headers (sticky top) -->
          <div class="headers">
            {#each visibleDays as day}
              <div class="day-header">
                {day.toFormat('ccc d')}
              </div>
            {/each}
          </div>

          <!-- Day columns -->
          <div class="day-columns">
            {#each visibleDays as day}
              <div class="day-column">
                {#each timestamps as time}
                  <div class="hour-cell" style:height="{HOUR_HEIGHT}px">
                    <!-- Cell content here -->
                  </div>
                {/each}
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .calendar-wrapper {
    height: 100vh;
    display: grid;
    grid-template-rows: auto 1fr;
  }

  .corner-label {
    position: fixed;
    top: 0;
    left: 0;
    background: white;
    padding: 10px;
    z-index: 3;
    border-bottom: 1px solid #ddd;
    border-right: 1px solid #ddd;
  }

  .calendar-container {
    overflow: auto;
    position: relative;
  }

  .scroll-content {
    position: relative;
    height: calc(24 * 60px + 40px); /* 24 hours + header height */
  }

  .timestamps {
    position: sticky;
    left: 0;
    top: 40px; /* Header height */
    background: white;
    z-index: 2;
    border-right: 1px solid #ddd;
    width: 60px;
  }

  .timestamp {
    border-bottom: 1px solid #eee;
    padding: 5px;
  }

  .visible-days {
    position: absolute;
    left: 60px; /* Timestamp width */
  }

  .headers {
    display: flex;
    position: sticky;
    top: 0;
    background: white;
    z-index: 1;
  }

  .day-header {
    width: 200px;
    height: 40px;
    border-bottom: 1px solid #ddd;
    border-right: 1px solid #ddd;
    padding: 10px;
  }

  .day-columns {
    display: flex;
  }

  .day-column {
    width: 200px;
    border-right: 1px solid #ddd;
  }

  .hour-cell {
    border-bottom: 1px solid #eee;
  }
</style>