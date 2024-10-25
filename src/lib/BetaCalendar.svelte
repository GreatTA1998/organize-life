<script>
  import { onMount, afterUpdate } from 'svelte';
  import { DateTime } from 'luxon';
  import ReusableCalendarColumn from './ReusableCalendarColumn.svelte';
  import { user, tasksScheduledOn, hasInitialScrolled } from "/src/store.js";
  import { MIKA_PIXELS_PER_HOUR } from "/src/helpers/everythingElse.js";
  import { size, cushion } from '/src/helpers/constants.js'
  import { lazyCallable } from "/src/helpers/actions.js";
  import { calendarTasks, daysToRender } from '/src/store.js'
  import { buildCalendarDataStructures } from '/src/helpers/maintainState.js'
  import { buildDates } from "../helpers/dataStructures";
  import Tasks from "../back-end/Tasks"

  const TOTAL_DAYS = 365; // Show a year's worth of days
  const BUFFER_DAYS = 7; // One week buffer on each side
  const DAY_WIDTH = 200; // Adjust based on your ReusableCalendarColumn width

  let startDate = DateTime.now().minus({ days: TOTAL_DAYS / 2 });
  let containerWidth;
  let scrollX;
  let visibleDays = [];
  let timesOfDay = getTimesOfDay()

  $: startIndex = Math.floor(scrollX / DAY_WIDTH) - BUFFER_DAYS;
  $: endIndex = Math.ceil((scrollX + containerWidth) / DAY_WIDTH) + BUFFER_DAYS;
  // $: console.log('startIndex, endIndex, visibleDays', startIndex, endIndex, visibleDays)
  $: visibleDays = calculateVisibleDays(startIndex, endIndex);

  function getTimesOfDay (numOfHourBlocksDisplayed = 24) {
    const temp = []
    let currentHour = 0; // today.getHours() // get the integer i.e. 0 to 23
    // now generate 16 hours of time (so it covers, for example, 8 am - midnight)
    for (let i = 0; i < numOfHourBlocksDisplayed;  i++) {
      if (currentHour === 24) {
        currentHour = 0
      }
      if (currentHour < 10) temp.push("0" + currentHour + ":00")
      else temp.push(currentHour + ":00")
      currentHour += 1
    }
    return temp
  }
    

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

  afterUpdate(() => {
    if (startIndex <= 0 || endIndex >= TOTAL_DAYS - 1) {
      // Load more days in the appropriate direction
      // Implement infinite scrolling logic here if needed
    }
  });

  function handleIntersect (ISODate) {
    console.log('handleIntersect, $hasInitialScrolled =', $hasInitialScrolled)
    if ($hasInitialScrolled) {
      fetchPastTasks(ISODate)
      return true // this boolean causes the observer to destroy itself after the callback
    } 
    else {
      return false // this won't destroy the observer
    }
  }

  async function fetchPastTasks(ISODate) {
    const dt = DateTime.fromISO(ISODate)
  
    const right = dt.minus({ days: cushion + 1 })
    const left = dt.minus({ days: cushion + size + cushion })  

    const newWeekTasksArray = await Tasks.getByDateRange(
      $user.uid,
      left.toISODate(),
      right.toISODate()
    )

    daysToRender.set(
      [...buildDates({ start: left, totalDays: size + cushion }), ...$daysToRender]
    )
    buildCalendarDataStructures({
      flatArray: [...newWeekTasksArray, ...$calendarTasks]
    })
  }
</script>


<div class="beta-calendar" style="outline: 2px solid red; margin-top: 100px;">
  <div class="calendar-container" bind:clientWidth={containerWidth} on:scroll={(e) => scrollX = e.target.scrollLeft}>
    <div class="calendar-content" style="width: {TOTAL_DAYS * DAY_WIDTH}px;">
      {#if $tasksScheduledOn}
        {#each visibleDays as currentDate, i (currentDate.toMillis())}
          {@const yyyyMMdd = currentDate.toFormat('yyyy-MM-dd')}

          <div class="day-wrapper" style="transform: translateX({currentDate.diff(startDate, 'days').days * DAY_WIDTH}px);">
            {yyyyMMdd} {i}
            {#if i === 7}
              <div use:lazyCallable={() => handleIntersect(yyyyMMdd)} style="border: 40px solid blue; width: 40px; height: 40px;"></div>
            {/if}

            <ReusableCalendarColumn 
              {i}
              {currentDate}
              {yyyyMMdd}
              calendarBeginningDateClassObject={DateTime.fromISO(yyyyMMdd).toJSDate()}
              timestamps={timesOfDay}
              pixelsPerHour={MIKA_PIXELS_PER_HOUR}
              timeBlockDurationInMinutes={60}
              scheduledTasks={$tasksScheduledOn[yyyyMMdd] ? $tasksScheduledOn[yyyyMMdd].hasStartTime : []}
            />
          </div>
        {/each}
      {/if}
    </div>
  </div>
</div>

<style>
  .beta-calendar {
    height: 100%;
    width: 100%;
    /* overflow: hidden; */
  }

  .calendar-container {
    height: 100%;
    overflow-x: scroll;
    /* overflow-y: hidden; */
  }

  .calendar-content {
    position: relative;
    height: 100%;
  }

  .day-wrapper {
    position: absolute;
    height: 100%;
    width: 200px;
  }
</style>
