<script>
  import ReusableCalendarColumn from '../ReusableCalendarColumn.svelte'
  import ReusableCalendarHeader from '../ReusableCalendarHeader.svelte'
  import FunctionalCalendarTimestamps from './FunctionalCalendarTimestamps.svelte'

  import Tasks from "/src/back-end/Tasks"
  import { buildCalendarDataStructures } from '/src/helpers/maintainState.js'

  import { onMount, tick } from 'svelte'
  import { DateTime } from 'luxon'
  import { tasksScheduledOn, user, calendarTasks, hasInitialScrolled } from '/src/store.js'

  const TOTAL_COLUMNS = 365
  const COLUMN_WIDTH = 200
  const PIXELS_PER_HOUR = 80
  const CORNER_LABEL_HEIGHT = 110
  const middleIdx = Math.floor(TOTAL_COLUMNS / 2)

  const c = 4 // 2c = 8, total rendered will be visible columns + (8)(2), so 16 additional columns

  let calOriginDT = DateTime.now().startOf('day').minus({ days: TOTAL_COLUMNS / 2 })
  let dtOfActiveColumns = []

  let isShowingDockingArea = true
  let initialHeaderHeight
  let minRequiredHeight 
  let H
  let clientHeight 
  // height vs clientHeight

  let prevClientHeight

  $: {
    console.log('clientHeight =', clientHeight)
    if (clientHeight >= CORNER_LABEL_HEIGHT) {
      styleHeight = clientHeight + 1
      console.log('manual height =', styleHegiht)

      const roundedHeight = Math.round(clientHeight)
      if (roundedHeight !== prevClientHeight) { // prevent infinite loop due to 
        styleHeight = roundedHeight + 1
        console.log('updated to clientHeight =', clientHeight)
      }
      // do a max height and min-height logic
    }
  }

  let previousH
  let initialHydratedHeight
  let isInitial = true

  // $: if (initialHydratedHeight) {
  //   if (!previousH) {
  //     H = initialHydratedHeight
  //     previousH = H
  //     console.log('H =', H)
  //   }
  // }


  $: if ($tasksScheduledOn && isInitial) {
    isInitial = false
    H = computeDockingAreaHeight({ 
      leftBoundIdx: leftEdgeIdx - 2*c, 
      rightBoundIdx: rightEdgeIdx + 2*c 
    })
  }

  function toggleDockingArea () {
    isShowingDockingArea = !isShowingDockingArea
    if (!isShowingDockingArea) {
      minRequiredHeight = CORNER_LABEL_HEIGHT
      initialHeaderHeight = 0
    }
  }

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

  async function updateActiveColumns () {
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

  function resizeDockingArea ({ leftBoundIdx, rightBoundIdx}) {
    requestAnimationFrame(() => {
      H = computeDockingAreaHeight({ leftBoundIdx, rightBoundIdx })
      previousH = H
      console.log('H =', H)
    })
  }

  function reactToScroll (leftEdgeIdx, rightEdgeIdx) {
    // note: `leftEdgeIdx` jumps non-consecutively sometimes depending on how fast the user is scrolling
    if (leftEdgeIdx <= leftTriggerIdx && leftEdgeIdx !== prevLeftEdgeIdx) {
      fetchMorePastTasks(leftTriggerIdx).then(() => {
        resizeDockingArea({ 
          leftBoundIdx: leftTriggerIdx - 3*c, 
          rightBoundIdx: rightEdgeIdx + c // `rightEdgeIdx` is scoped within this function
        })
      }) // even though jumps can be arbitrarily wide, the function calls will resolve in a weakly decreasing order of their `leftTriggerIdx`
      leftTriggerIdx -= (2*c + 1)
    } 
    else if (rightEdgeIdx >= rightTriggerIdx && rightEdgeIdx !== prevRightEdgeIdx) {
      fetchMoreFutureTasks(rightTriggerIdx).then(() => {
        resizeDockingArea({ 
          leftBoundIdx: leftEdgeIdx - c, 
          rightBoundIdx: rightTriggerIdx + 3*c // `rightTriggerIdx` is scoped within this function
        })
      })
      rightTriggerIdx += (2*c + 1)
    }
    
    if (leftEdgeIdx <= prevLeftEdgeIdx - c || rightEdgeIdx >= prevRightEdgeIdx + c) {
      updateActiveColumns()
    }
  }

  function computeDockingAreaHeight ({ leftBoundIdx, rightBoundIdx }) {
    let maxHeightInBatch = CORNER_LABEL_HEIGHT
    for (let i = leftBoundIdx; i <= rightBoundIdx; i++) {
      const currentDT = calOriginDT.plus({ days: i })
      const yyyyMMdd = currentDT.toFormat('yyyy-MM-dd')

      let totalHeaderHeight = CORNER_LABEL_HEIGHT
      if ($tasksScheduledOn[yyyyMMdd]) {
        const { noStartTime } = $tasksScheduledOn[yyyyMMdd]
        const { hasIcon, noIcon } = noStartTime

        const baseHeaderHeight = 55

        const noIconTopMargin = 8
        const iconTasksHeight = Math.ceil(hasIcon.length / 6) * 37
        const normalTasksHeight = noIcon.length * (14 + noIconTopMargin) 

        const paddingAboveAllTasks = 6
        const topPadding = 36 // main-content-top-margin
        const botPadding = 18

        totalHeaderHeight = topPadding + botPadding + paddingAboveAllTasks + baseHeaderHeight + iconTasksHeight + normalTasksHeight
      }

      if (totalHeaderHeight > maxHeightInBatch) {
        maxHeightInBatch = totalHeaderHeight
      }
    }
    console.log('maxHeightInBatch =', maxHeightInBatch)
    return maxHeightInBatch
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
  <!-- TODO: make this a reusable component that displays the real YYYY -->
  <div class="corner-label" style="height: {H}px;">
    <div style="font-size: 16px; margin-top: var(--main-content-top-margin);">
      <div style="color: rgb(0, 0, 0); font-weight: 400;">
        {monthName}
      </div>
      <div style="font-weight: 200; margin-top: 2px;">
        2024
      </div>
    </div>

    {#if $tasksScheduledOn}
      <span
        on:click={toggleDockingArea}
        class="collapse-arrow material-symbols-outlined"
      >
        {isShowingDockingArea ? "expand_less" : "expand_more"}
      </span>
    {/if}
  </div>

  <div bind:this={ScrollParent}
    id="scroll-parent" 
    bind:clientWidth={scrollParentWidth}
    on:scroll={(e) => scrollX = e.target.scrollLeft}
  >
    <div 
      class="scroll-content" 
      style:width="{TOTAL_COLUMNS * COLUMN_WIDTH}px"
      style="display: flex; background-color: var(--calendar-bg-color);"
    >
      {#if dtOfActiveColumns.length > 0 && $tasksScheduledOn}
        <FunctionalCalendarTimestamps 
          topMargin={H}
        />

        <div 
          class="visible-days"
          style:transform={`translateX(${dtOfActiveColumns[0]?.diff(calOriginDT, 'days').days * COLUMN_WIDTH}px)`}
        >          
          <div 
            class="headers-flexbox" 
            class:bottom-border={$tasksScheduledOn}
          >
            {#each dtOfActiveColumns as currentDate, i (currentDate.toMillis() + `${i}`)}
              <ReusableCalendarHeader
                ISODate={currentDate.toFormat('yyyy-MM-dd')}
                {isShowingDockingArea}
                on:task-update
                on:task-click
                                                   
                on:new-root-task
              />
            {/each}
          </div>

          <div class="day-columns">
            {#each dtOfActiveColumns as currentDate, i (currentDate.toMillis())}
              <ReusableCalendarColumn 
                calendarBeginningDateClassObject={DateTime.fromISO(currentDate.toFormat('yyyy-MM-dd')).toJSDate()}
                pixelsPerHour={PIXELS_PER_HOUR}
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

  #scroll-parent {
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

  .headers-flexbox {
    position: sticky;
    top: 0;
    background: var(--calendar-bg-color);
    z-index: 1;

    display: flex;

    transition: all 500ms ease-out;
  }

  .day-columns {
    display: flex;
  }

  .bottom-border {
    border-bottom: 1px solid lightgrey;
  }

  .collapse-arrow {
    position: absolute;
    bottom: 4px;
    right: 4px;
    font-size: 26px;
    cursor: pointer;
    color: rgb(121, 121, 121);
    font-weight: 300;
  }
</style> 