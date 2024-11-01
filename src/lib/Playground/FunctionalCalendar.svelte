<script>
  import ReusableCalendarColumn from '../ReusableCalendarColumn.svelte'
  import ReusableCalendarHeader from '../ReusableCalendarHeader.svelte'
  import FunctionalCalendarTimestamps from './FunctionalCalendarTimestamps.svelte'

  import Tasks from "/src/back-end/Tasks"
  import { buildCalendarDataStructures } from '/src/helpers/maintainState.js'
  import { MIKA_PIXELS_PER_HOUR } from "/src/helpers/everythingElse.js"

  import { onMount } from 'svelte'
  import { DateTime } from 'luxon'
  import { tasksScheduledOn, user, calendarTasks, hasInitialScrolled } from '/src/store.js'

  const TOTAL_COLUMNS = 365
  const COLUMN_WIDTH = 200
  const CORNER_LABEL_HEIGHT = 110
  const middleIdx = Math.floor(TOTAL_COLUMNS / 2)
  const c = 4 // 2c = 8, total rendered will be visible columns + (8)(2), so 16 additional columns

  let calOriginDT = DateTime.now().startOf('day').minus({ days: TOTAL_COLUMNS / 2 })
  let dtOfActiveColumns = []

  let leftTriggerIdx 
  let rightTriggerIdx
  let prevLeftEdgeIdx
  let prevRightEdgeIdx

  let ScrollParent
  let scrollParentWidth // width doesn't change during scroll, so bind:clientWidth shouldn't cause performance issues
  let scrollX = middleIdx * COLUMN_WIDTH

  $: leftEdgeIdx = Math.floor(scrollX / COLUMN_WIDTH)
  $: rightEdgeIdx = Math.ceil((scrollX + scrollParentWidth) / COLUMN_WIDTH)

  $: reactToScroll(leftEdgeIdx, rightEdgeIdx)

  $: monthName = leftEdgeIdx ? calOriginDT.plus({ days: leftEdgeIdx }).toFormat('LLL') : ''

  $: if (!$hasInitialScrolled && ScrollParent) {
    requestAnimationFrame(() => {
      ScrollParent.scrollLeft = middleIdx * COLUMN_WIDTH // don't set `hasInitialScrolled` to true, let <CurrentTimeIndicator/> finish off the rest of the logic when it mounts
    })
  }

  onMount(async () => {    
    leftTriggerIdx = leftEdgeIdx - c
    rightTriggerIdx = rightEdgeIdx + c

    updateActiveColumns()
  })

  function updateActiveColumns () {
    const output = []
    for (let i = leftEdgeIdx - 2*c; i <= rightEdgeIdx + 2*c; i++) {
      output.push(
        calOriginDT.plus({ days: i })
      )
    }
    dtOfActiveColumns = output

    prevRightEdgeIdx = rightEdgeIdx
    prevLeftEdgeIdx = leftEdgeIdx
  }

  function reactToScroll (leftEdgeIdx, rightEdgeIdx) {
    // note: `leftEdgeIdx` jumps non-consecutively sometimes depending on how fast the user is scrolling
    if (leftEdgeIdx <= leftTriggerIdx && leftEdgeIdx !== prevLeftEdgeIdx) {
      fetchMorePastTasks(leftTriggerIdx) // even though jumps can be arbitrarily wide, the function calls will resolve in a weakly decreasing order of their `leftTriggerIdx`
      leftTriggerIdx -= (2*c + 1)
    } 
    else if (rightEdgeIdx >= rightTriggerIdx && rightEdgeIdx !== prevRightEdgeIdx) {
      fetchMoreFutureTasks(rightTriggerIdx)
      rightTriggerIdx += (2*c + 1)
    }
    
    if (leftEdgeIdx <= prevLeftEdgeIdx - c || rightEdgeIdx >= prevRightEdgeIdx + c) {
      updateActiveColumns()
    }
  }

  async function fetchMorePastTasks (triggerIdx) {
    return new Promise(async (resolve) => {
      const triggerDT = calOriginDT.plus({ days: triggerIdx })
      const rightBound = triggerDT.minus({ days: (c+1) })
      const leftBound = rightBound.minus({ days: 2*c })  

      const newTasks = await Tasks.getByDateRange($user.uid, leftBound.toISODate(), rightBound.toISODate())

      buildCalendarDataStructures({
        flatArray: [...newTasks, ...$calendarTasks]
      })

      resolve()
    })
  }

  async function fetchMoreFutureTasks (triggerIdx) {
    return new Promise(async (resolve) => {
      const triggerDT = calOriginDT.plus({ days: triggerIdx })
      const leftBound = triggerDT.plus({ days: (c+1) })
      const rightBound = leftBound.plus({ days: 2*c })

      // note each new loaded intervals should not be overlapping
      const newTasks = await Tasks.getByDateRange($user.uid, leftBound.toISODate(), rightBound.toISODate())

      buildCalendarDataStructures({
        flatArray: [...$calendarTasks, ...newTasks]
      })

      resolve()
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
      style:width="{TOTAL_COLUMNS * COLUMN_WIDTH}px"
      style="display: flex; background-color: var(--calendar-bg-color);"
    >
      {#if dtOfActiveColumns.length > 0 && $tasksScheduledOn}
        <FunctionalCalendarTimestamps topMargin={CORNER_LABEL_HEIGHT}/>

        <div 
          class="visible-days"
          style:transform={`translateX(${dtOfActiveColumns[0]?.diff(calOriginDT, 'days').days * COLUMN_WIDTH}px)`}
        >
          <div class="headers" class:bottom-border={$tasksScheduledOn}>
            {#each dtOfActiveColumns as currentDate, i (currentDate.toMillis() + `${i}`)}
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
            {#each dtOfActiveColumns as currentDate, i (currentDate.toMillis())}
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