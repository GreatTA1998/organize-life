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
  import ReusableCalendarHeader from "./ReusableCalendarHeader.svelte"
  import BetaCalendarTimestamps from '$lib/BetaCalendarTimestamps.svelte'

  const TOTAL_DAYS = 365; // Show a year's worth of days
  const BUFFER_DAYS = 0; // One week buffer on each side
  const DAY_WIDTH = 200; // Adjust based on your ReusableCalendarColumn width
  let isShowingDockingArea = true

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


<div class="calendar-container" bind:clientWidth={containerWidth} on:scroll={(e) => scrollX = e.target.scrollLeft}>
  <!-- TO-DO: don't hard-code the height -->
  <div class="giant-blank-div" 
    style="
      width: {TOTAL_DAYS * DAY_WIDTH}px; 
      height: {1920 + 120}px
    "
  >
    {#if visibleDays.length > 0}
      <div 
        class="doctor-who-phone-booth"
        style:transform={`translateX(${visibleDays[0]?.diff(startDate, 'days').days * DAY_WIDTH}px)`}
        style:width="fit-content"
        style:height={`${1920 + 120}px`}
        style:position="relative"
      >
        <div class="top-flexbox" class:bottom-border={$tasksScheduledOn}>
          <div class="pinned-div">
            <div style="font-size: 16px; margin-top: var(--main-content-top-margin);">
              <div style="color: rgb(0, 0, 0); font-weight: 400;">
                Oct
                <!-- {calStartDateClassObj.toLocaleString("en-US", { month: "short" })} -->
              </div>
              <div style="font-weight: 200; margin-top: 2px;">
                2024
                <!-- {calStartDateClassObj.toLocaleString("en-US", { year: "numeric" })} -->
              </div>
            </div>
      
            {#if $tasksScheduledOn}
              <span
                on:click={() => isShowingDockingArea = !isShowingDockingArea}
                class="collapse-arrow material-symbols-outlined"
              >
                {isShowingDockingArea ? "expand_less" : "expand_more"}
              </span>
            {/if}
          </div>

          <div class="sticky-y-div flexbox" style="border: 2px solid blue;">
            {#each visibleDays as currentDate, i (currentDate.toMillis() + `${i}`)}
              {i}
              <ReusableCalendarHeader
                ISODate={currentDate.toFormat('yyyy-MM-dd')}
                isShowingDockingArea={true}
                on:task-update
                on:task-click
                on:task-checkbox-change
                on:new-root-task
              />
            {/each}
          </div>
        </div>

        {#if $tasksScheduledOn}
          <div style="display: flex; width: fit-content">
            {#if visibleDays.length > 0}
              <BetaCalendarTimestamps leftOffset={visibleDays[0].diff(startDate, 'days').days * DAY_WIDTH}/>
            {/if}
            <!-- {#each visibleDays as currentDate, i (currentDate.toMillis())}
              {@const yyyyMMdd = currentDate.toFormat('yyyy-MM-dd')}
              <div class="day-wrapper" style="border: 10px solid green;">
                {yyyyMMdd} {i}
                {#if i === BUFFER_DAYS}
                  <div use:lazyCallable={() => handleIntersect(yyyyMMdd)} style="outline: 4px solid blue;">
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
                {:else}
                  <ReusableCalendarColumn 
                    {i}
                    {currentDate}
                    {yyyyMMdd}
                    calendarBeginningDateClassObject={DateTime.fromISO(yyyyMMdd).toJSDate()}
                    timestamps={timesOfDay}
                    pixelsPerHour={MIKA_PIXELS_PER_HOUR}
                    timeBlockDurationInMinutes={60}
                    scheduledTasks={$tasksScheduledOn[yyyyMMdd] ? $tasksScheduledOn[yyyyMMdd].hasStartTime : []}
                    on:new-root-task
                    on:task-update
                    on:task-click
                    on:task-checkbox-change
                  />
                {/if}
              </div>
            {/each} -->
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .calendar-container {
    height: 100%;
    overflow-x: scroll;
    overflow-y: scroll;
  }

  .giant-blank-div {
    position: relative;
    height: fit-content;
    border: 8px solid black;
  }

  .day-wrapper {
    width: 200px;
  }

  .sticky-y-div {
    position: sticky;
    top: 0;
    color: white;
    z-index: 1; /* Lower z-index than pinned-div */
    background-color: var(--calendar-bg-color);
    width: fit-content;
  }

  .flexbox {
    display: flex;
  }

  .bottom-border {
    border-bottom: 1px solid lightgrey;
  }

  .top-flexbox {
    display: flex;
    position: static;
    position: sticky;
    top: 0;
    z-index: 2;
    width: fit-content;
  }
</style>
