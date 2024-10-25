 <!-- This component was first planned on Svelte REPL: https://svelte.dev/repl/d42716f1cc2746ce949de01f0117419e?version=4.2.15 -->
<div bind:this={ScrollableContainer} id="the-only-scrollable-container">
  <div class="top-flexbox" class:bottom-border={$tasksScheduledOn}>
    <div class="pinned-div">
      <div style="font-size: 16px; margin-top: var(--main-content-top-margin);">
        <div style="color: rgb(0, 0, 0); font-weight: 400;">
          {calStartDateClassObj.toLocaleString("en-US", { month: "short" })}
        </div>
        <div style="font-weight: 200; margin-top: 2px;">
          {calStartDateClassObj.toLocaleString("en-US", { year: "numeric" })}
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

    <div class="sticky-y-div flexbox">
      {#each $daysToRender as ISODate, i (ISODate)}
        {#if i === cushion}
          <div use:lazyCallable={() => handleIntersect(ISODate)} style="outline: 20px solid blue;"></div>
        {:else if i === $daysToRender.length - 1 - cushion}
          <div use:lazyCallable={() => fetchNewWeekOfFutureTasks(ISODate)}></div>
        {/if}

        <ReusableCalendarHeader
          {ISODate}
          {isShowingDockingArea}
          on:task-update
          on:task-click
          on:task-checkbox-change
          on:new-root-task
        />
      {/each}
    </div>
  </div>

  <div style="display: flex; width: fit-content;">
    <div class="x-sticky" style="margin-top: {timestampDivTopMargin}px;">
      {#each timesOfDay as timestamp, i (i)}
        <div
          class="x-sticky timestamp-number"
          style="height: {MIKA_PIXELS_PER_HOUR}px; width: var(--timestamps-column-width);"
        >
          {timestamp.substring(0, 5)}
        </div>
      {/each}
    </div>

    {#each $daysToRender as ISODate (ISODate)}
      <div style="margin-top: {topMarginEqualizer}px;" class="unselectable">
        {#if $tasksScheduledOn && timesOfDay.length !== 0}
          <ReusableCalendarColumn
            calendarBeginningDateClassObject={DateTime.fromISO(ISODate).toJSDate()}
            scheduledTasks={$tasksScheduledOn[ISODate] ? $tasksScheduledOn[ISODate].hasStartTime : []}
            timestamps={timesOfDay}
            pixelsPerHour={MIKA_PIXELS_PER_HOUR}
            timeBlockDurationInMinutes={60}
            on:new-root-task
            on:task-update
            on:task-click
            on:task-checkbox-change
          />
        {/if}
      </div>
    {/each}
  </div>
</div>

<script>
  import ReusableCalendarHeader from "$lib/ReusableCalendarHeader.svelte";
  import ReusableCalendarColumn from "$lib/ReusableCalendarColumn.svelte";
  import { MIKA_PIXELS_PER_HOUR } from "/src/helpers/everythingElse.js";
  import { onMount, afterUpdate, tick } from "svelte";
  import { user, tasksScheduledOn, hasInitialScrolled } from "/src/store.js";
  import { getFirestoreCollection } from "/src/helpers/firestoreHelpers.js";
  import { lazyCallable } from "/src/helpers/actions.js";
  import Tasks from "../back-end/Tasks";
  import { DateTime } from "luxon";
  import { buildDates } from "../helpers/dataStructures";
  import { size, cushion } from '/src/helpers/constants.js'
  import { calendarTasks, daysToRender } from '/src/store.js'
  import { buildCalendarDataStructures } from '/src/helpers/maintainState.js'

  export let calStartDateClassObj;

  let ScrollableContainer
  let doodleIcons = null;
  // NOTE: timesOfDay should start from 00:00, so dateClassObjects also need to start from 00:00 military time
  let timesOfDay = [];
  let numOfHourBlocksDisplayed = 24;
  const topMarginEqualizer = 8 + timestampDivTopMargin; // to align with the timestamps that can't be displayed at negative margins
  const timestampDivTopMargin = 24;
  let isShowingDockingArea = true;
  let stillRerendering = false
  
  onMount(async () => {
    const today = DateTime.now()
    daysToRender.set(
      buildDates({
        start: today.minus({ days: size + cushion }), 
        totalDays: 2 * (size + cushion) + 1 // +1 means because today's date column counts as the midpoint and is an additional column
      })
    )

    getTimesOfDay()
    fetchDoodleIcons()
  })

  function handleIntersect (ISODate) {
    if (stillRerendering) {
      return false
    }

    // the initial intersection doesn't count
    // the real intersection is when the app loads and autoscrolls to today's position
    // then the user scrolls backwards to the past
    if ($hasInitialScrolled) {
      alert('fetchPastTask')
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
    
    // const oldScrollLeft = ScrollableContainer.scrollLeft

    const newWeekTasksArray = await Tasks.getByDateRange(
      $user.uid,
      left.toISODate(),
      right.toISODate()
    )

    stillRerendering = true

    const oldScrollLeft = ScrollableContainer.scrollLeft
    console.log("oldScrollLeft =", oldScrollLeft)
    // alert(`oldScrollLeft = ${oldScrollLeft}`)
    
    daysToRender.set(
      [...buildDates({ start: left, totalDays: size + cushion }), ...$daysToRender]
    )
    buildCalendarDataStructures({
      flatArray: [...newWeekTasksArray, ...$calendarTasks]
    })
    requestAnimationFrame(() => {
      const totalAddedWidth = getShiftDueToNewColumns({ dayColumnWidth: 200 })

      const newScrollLeft = totalAddedWidth + oldScrollLeft
      ScrollableContainer.scrollLeft = newScrollLeft
      console.log(`totalAddedWidth =${totalAddedWidth}, oldScrollLeft =${oldScrollLeft}, newScrollLeft = ${newScrollLeft}`)


      // alert(`totalAddedWidth =${totalAddedWidth}, oldScrollLeft =${oldScrollLeft}, newScrollLeft = ${newScrollLeft}`)

      // be extra safe
      requestAnimationFrame(() => {
        stillRerendering = false
      })

    })
  }

  function getShiftDueToNewColumns ({ dayColumnWidth }) {
    return (size + cushion) * dayColumnWidth
  }

  async function fetchNewWeekOfFutureTasks(intersectedDate) {
    const dt = DateTime.fromISO(intersectedDate);
    const left = dt.plus({ days: cushion + 1 });
    const right = left.plus({ days: size + cushion });
    daysToRender.set(
      [...$daysToRender, ...buildDates({ start: left, totalDays: size + cushion })]
    )

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

  async function fetchDoodleIcons() {
    const temp = await getFirestoreCollection("/doodleIcons");
    doodleIcons = temp;
  }

  function toggleDockingArea() {
    isShowingDockingArea = !isShowingDockingArea;
  }

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
    timesOfDay = temp
  }
</script>

<style>
  :root {
    --pinned-div-width: 72px;
    --timestamps-column-width: 64px; /* was 96px */
    --day-header-width: 120px;
    --calendar-left-padding: 16px;
  }

  /* Hide the scrollbar for Chrome, Safari and Opera */
  #the-only-scrollable-container::-webkit-scrollbar {
    display: none;
  }

  /* Hide the scrollbar for Internet Explorer, Edge and Firefox */
  #the-only-scrollable-container {
    -ms-overflow-style: none;  /* Internet Explorer and Edge */
    scrollbar-width: none;  /* Firefox */
  }

  #the-only-scrollable-container {
    position: relative;
    overflow: auto;

    /* added to fix a patch of white between the header and the calendar column */
    background-color: var(--calendar-bg-color);
  }
  
  .x-sticky {
    position: sticky;
    left: 0px;
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

  .pinned-div {
    width: var(--timestamps-column-width);
    position: sticky;
    left: 0;
    background-color: var(--calendar-bg-color);
    padding: 0px 5px 5px var(--calendar-left-padding);
    z-index: 2; /* Ensure it appears on top */
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

  .collapse-arrow {
    position: absolute;
    bottom: 4px;
    right: 4px;
    font-size: 26px;
    cursor: pointer;
    color: rgb(121, 121, 121);
    font-weight: 300;
  }

  .top-flexbox {
    display: flex;
    position: static;
    position: sticky;
    top: 0;
    z-index: 2;
    width: fit-content;
  }

  .bottom-border {
    border-bottom: 1px solid lightgrey;
  }
</style>
