<script>
  import ReusableCalendarColumn from '../ReusableCalendarColumn.svelte';
  import ReusableCalendarHeader from '../ReusableCalendarHeader.svelte';
  import FunctionalCalendarTimestamps from './FunctionalCalendarTimestamps.svelte';

  import Tasks from "/src/back-end/Tasks";
  import { buildCalendarDataStructures } from '/src/helpers/maintainState.js'
  import { MIKA_PIXELS_PER_HOUR } from "/src/helpers/everythingElse.js";

  import { onMount, tick } from 'svelte';
  import { DateTime } from 'luxon';
  import { tasksScheduledOn, user, calendarTasks, hasInitialScrolled } from '/src/store.js';

  const TOTAL_DAYS = 365;
  const DAY_WIDTH = 200;
  const CORNER_LABEL_HEIGHT = 110

  let ScrollParent
  let startDT = DateTime.now().startOf('day').minus({ days: TOTAL_DAYS / 2 })
  let scrollParentWidth
  let scrollX = 0

  let monthName = ''

  let dtOfHydratedColumns = []
  const c = 4 // 2c = 8, total rendered will be visible columns + (8)(2), so 16 additional columns

  let leftTriggerIdx 
  let rightTriggerIdx

  let prevLeftEdgeIdx
  let prevRightEdgeIdx

  // leftEdgeIdx represents the leftMost column that will be visible (even if only partially)
  $: leftEdgeIdx = Math.floor(scrollX / DAY_WIDTH)

  // rightEdgeIdx represents the rightmost column that will be visible (even if only partially)
  $: rightEdgeIdx = Math.ceil((scrollX + scrollParentWidth) / DAY_WIDTH)

  // update month name according to scroll position
  $: if (leftEdgeIdx && dtOfHydratedColumns) {
    const leftMostVisibleDT = startDT.plus({ days: leftEdgeIdx })
    monthName = leftMostVisibleDT.toFormat('LLL')
  }

  $: calculatePreparedColumns(leftEdgeIdx, rightEdgeIdx)

  $: if (!$hasInitialScrolled && ScrollParent) {
    const middleIndex = Math.floor(TOTAL_DAYS / 2)
    requestAnimationFrame(() => {
      ScrollParent.scrollLeft = middleIndex * DAY_WIDTH
      // don't set `hasInitialScrolled` to true, let <CurrentTimeIndicator/> finish off the rest of the logic when it mounts
    })
  }

  onMount(async () => {
    const middleIndex = Math.floor(TOTAL_DAYS / 2)
    scrollX = middleIndex * DAY_WIDTH

    await tick()
    
    leftTriggerIdx = leftEdgeIdx - c
    rightTriggerIdx = rightEdgeIdx + c

    prevLeftEdgeIdx = leftEdgeIdx
    prevRightEdgeIdx = rightEdgeIdx

    updateColumnsToHydrate()
  })

  function updateColumnsToHydrate () {
    const output = []
    for (let i = leftEdgeIdx - 2*c; i <= rightEdgeIdx + 2*c; i++) {
      output.push(
        startDT.plus({ days: i })
      )
    }
    dtOfHydratedColumns = output
  }

  function calculatePreparedColumns (leftEdgeIdx, rightEdgeIdx, force = true) {
    // note: `leftEdgeIdx` jumps non-consecutively sometimes depending on how fast the user is scrolling
    if (leftEdgeIdx <= leftTriggerIdx && leftEdgeIdx !== prevLeftEdgeIdx) {
      fetchPastTasks(leftTriggerIdx) // even though jumps can be arbitrarily wide, the function calls will resolve in a weakly decreasing order of their `leftTriggerIdx`
      leftTriggerIdx -= (2*c + 1)
    } 
    else if (rightEdgeIdx >= rightTriggerIdx && rightEdgeIdx !== prevRightEdgeIdx) {
      fetchNewWeekOfFutureTasks(rightTriggerIdx)
      rightTriggerIdx += (2*c + 1)
    }
    
    if (leftEdgeIdx <= prevLeftEdgeIdx - c) {
      updateColumnsToHydrate()
      prevLeftEdgeIdx = leftEdgeIdx // we want prevLeftEdgeIdx's jumps to be predictable, unlike `leftEdgeIdx`
      prevRightEdgeIdx = rightEdgeIdx
    }
    else if (rightEdgeIdx >= prevRightEdgeIdx + c) {
      updateColumnsToHydrate()
      prevRightEdgeIdx = rightEdgeIdx
      prevLeftEdgeIdx = leftEdgeIdx
    }
  }

  async function fetchPastTasks (obsIdx) {
    return new Promise(async (resolve) => {
      const dt = startDT.plus({ days: obsIdx })
      const right = dt.minus({ days: (c+1) }) // notice we go 1 more left
      const left = right.minus({ days: 2*c })  

      const newWeekTasksArray = await Tasks.getByDateRange(
        $user.uid,
        left.toISODate(),
        right.toISODate()
      )

      buildCalendarDataStructures({
        flatArray: [...newWeekTasksArray, ...$calendarTasks]
      })

      resolve()
    })
  }

  async function fetchNewWeekOfFutureTasks (rightObsIdx) {
    const dt = startDT.plus({ days: rightObsIdx })
    const left = dt.plus({ days: (c+1) })
    const right = left.plus({ days: 2*c })

    // note each new loaded intervals should not be overlapping
    const newWeekTasksArray = await Tasks.getByDateRange(
      $user.uid,
      left.toISODate(), 
      right.toISODate() 
    )

    buildCalendarDataStructures({
      flatArray: [...$calendarTasks, ...newWeekTasksArray]
    })
  }
</script>

<div class="calendar-wrapper" style="position: relative;">
  <div class="corner-label" style="height: {CORNER_LABEL_HEIGHT}px;">
    <div style="font-size: 16px; margin-top: var(--main-content-top-margin);">
      <div style="color: rgb(0, 0, 0); font-weight: 400;">
        {monthName}
      </div>
      <div style="font-weight: 200; margin-top: 2px;">
        2024
      </div>
    </div>
  </div>

  <div bind:this={ScrollParent}
    class="scroll-parent" 
    bind:clientWidth={scrollParentWidth}
    on:scroll={(e) => scrollX = e.target.scrollLeft}
  >
    <div 
      class="scroll-content" 
      style:width="{TOTAL_DAYS * DAY_WIDTH}px"
      style="display: flex; background-color: var(--calendar-bg-color);"
    >
      {#if dtOfHydratedColumns.length > 0 && $tasksScheduledOn}
        <FunctionalCalendarTimestamps topMargin={CORNER_LABEL_HEIGHT}/>

        <div 
          class="visible-days"
          style:transform={`translateX(${dtOfHydratedColumns[0]?.diff(startDT, 'days').days * DAY_WIDTH}px)`}
        >
          <div class="headers" class:bottom-border={$tasksScheduledOn}>
            {#each dtOfHydratedColumns as currentDate, i (currentDate.toMillis() + `${i}`)}
              <ReusableCalendarHeader
                ISODate={currentDate.toFormat('yyyy-MM-dd')}
                isShowingDockingArea={false}
                on:task-update
                on:task-click
                on:task-checkbox-change
                on:new-root-task
              />
            {/each}
          </div>

          <div class="day-columns">
            {#each dtOfHydratedColumns as currentDate, i (currentDate.toMillis())}
              <ReusableCalendarColumn 
                {i}
                {currentDate}
                yyyyMMdd={currentDate.toFormat('yyyy-MM-dd')}
                calendarBeginningDateClassObject={DateTime.fromISO(currentDate.toFormat('yyyy-MM-dd')).toJSDate()}
                pixelsPerHour={MIKA_PIXELS_PER_HOUR}
                timeBlockDurationInMinutes={60}
                scheduledTasks={$tasksScheduledOn[currentDate.toFormat('yyyy-MM-dd')] ? $tasksScheduledOn[currentDate.toFormat('yyyy-MM-dd')].hasStartTime : []}
                on:new-root-task
                on:task-update
                on:task-click
                on:task-checkbox-change
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

    width: var(--timestamps-column-width);
    padding: 0px 5px 5px var(--calendar-left-padding);
  }

  .scroll-parent {
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

  .bottom-border {
    border-bottom: 1px solid lightgrey;
  }
</style> 