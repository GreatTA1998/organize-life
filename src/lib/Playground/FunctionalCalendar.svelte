<script>
  import ReusableCalendarColumn from '../ReusableCalendarColumn.svelte';
  import ReusableCalendarHeader from '../ReusableCalendarHeader.svelte';
  import FunctionalCalendarTimestamps from './FunctionalCalendarTimestamps.svelte';

  import { onMount } from 'svelte';
  import { DateTime } from 'luxon';
  import { tasksScheduledOn } from '/src/store.js';
  import { MIKA_PIXELS_PER_HOUR } from "/src/helpers/everythingElse.js";

  const TOTAL_DAYS = 365;
  const DAY_WIDTH = 200;
  let startDate = DateTime.now().minus({ days: TOTAL_DAYS / 2 });
  let containerWidth;
  let scrollX = 0;
  let visibleDays = [];
  let timesOfDay = []; // deprecate this logic

  $: startIndex = Math.floor(scrollX / DAY_WIDTH);
  $: endIndex = Math.ceil((scrollX + containerWidth) / DAY_WIDTH);
  $: visibleDays = calculateVisibleDays(startIndex, endIndex);

  function calculateVisibleDays(start, end) {
    return Array.from({ length: end - start }, (_, i) => {
      const index = start + i;
      if (index < 0 || index >= TOTAL_DAYS) return null;
      return startDate.plus({ days: index });
    }).filter(Boolean);
  }

  onMount(() => {
    const middleIndex = Math.floor(TOTAL_DAYS / 2);
    scrollX = middleIndex * DAY_WIDTH;
  });
</script>

<div class="calendar-wrapper" style="position: relative;">
  <div class="corner-label" style="width: 64px; height: 96px;">
    <div style="font-size: 16px; margin-top: var(--main-content-top-margin);">
      <div style="color: rgb(0, 0, 0); font-weight: 400;">
        Oct
      </div>
      <div style="font-weight: 200; margin-top: 2px;">
        2024
      </div>
    </div>
  </div>

  <div 
    class="calendar-container" 
    bind:clientWidth={containerWidth}
    on:scroll={(e) => scrollX = e.target.scrollLeft}
  >
    <div 
      class="scroll-content" 
      style:width="{TOTAL_DAYS * DAY_WIDTH}px"
      style="display: flex"
    >
      {#if visibleDays.length > 0 && $tasksScheduledOn}
        <FunctionalCalendarTimestamps />

        <div 
          class="visible-days"
          style:transform={`translateX(${visibleDays[0]?.diff(startDate, 'days').days * DAY_WIDTH}px)`}
        >
          <div class="headers">
            {#each visibleDays as currentDate, i (currentDate.toMillis() + `${i}`)}
              <ReusableCalendarHeader
                ISODate={currentDate.toFormat('yyyy-MM-dd')}
                on:task-update
                on:task-click
                on:task-checkbox-change
                on:new-root-task
              />
            {/each}
          </div>

          <div class="day-columns">
            {#each visibleDays as currentDate, i (currentDate.toMillis())}
              <ReusableCalendarColumn 
                {i}
                {currentDate}
                yyyyMMdd={currentDate.toFormat('yyyy-MM-dd')}
                calendarBeginningDateClassObject={currentDate.toJSDate()}
                timestamps={timesOfDay}
                pixelsPerHour={MIKA_PIXELS_PER_HOUR}
                timeBlockDurationInMinutes={60}
                scheduledTasks={$tasksScheduledOn[currentDate.toFormat('yyyy-MM-dd')] ? $tasksScheduledOn[currentDate.toFormat('yyyy-MM-dd')].hasStartTime : []}
              />
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .calendar-wrapper {
    height: 100%;
    display: grid;
    grid-template-rows: auto 1fr;
    position: relative;
  }

  .corner-label {
    position: absolute;
    top: 0;
    left: 0;
    background: var(--calendar-bg-color);
    z-index: 3;
    border-bottom: 1px solid lightgrey;
    border-right: 1px solid lightgrey;
  }

  .calendar-container {
    overflow: auto;
    position: relative;
  }

  .scroll-content {
    position: relative;
  }

  .visible-days {
    position: absolute;
    left: 60px; /* Timestamp width */
  }

  .headers {
    display: flex;
    position: sticky;
    top: 0;
    background: var(--calendar-bg-color);
    z-index: 1;
  }

  .day-columns {
    display: flex;
  }
</style> 