<script>
  import ReusableCreateTaskDirectly from '$lib/ReusableCreateTaskDirectly.svelte'
  import ReusableFlexibleDayTask from '$lib/ReusableFlexibleDayTask.svelte'
  import FunctionalDoodleIcon from '$lib/FunctionalDoodleIcon.svelte'
  import { onMount, createEventDispatcher, afterUpdate } from 'svelte'
  import {
    tasksScheduledOn,
    whatIsBeingDraggedFullObj,
    whatIsBeingDragged,
    whatIsBeingDraggedID
  } from '/src/store.js'
  import { getFirestoreCollection } from '/src/helpers/firestoreHelpers.js'
  import { DateTime } from 'luxon'

  export let ISODate
  export let isShowingDockingArea

  let doodleIcons = null

  const dispatch = createEventDispatcher()
  let isDirectlyCreatingTask = false

  onMount(async () => {
    const temp = await getFirestoreCollection('/doodleIcons')
    doodleIcons = temp
  })

  function dragover_handler(e) {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
  }

  function drop_handler(e, ISODate) {
    const id = e.dataTransfer.getData('text/plain')
    if (!id) return // it means we're adjusting the duration but it triggers a drop event, and a dragend event must be followed by a drop event

    e.preventDefault()
    e.stopPropagation()

    const dt = DateTime.fromISO(ISODate)

    dispatch('task-update', {
      id,
      keyValueChanges: {
        startTime: '',
        startDateISO: dt.toFormat('yyyy-MM-dd')
      }
    })

    whatIsBeingDraggedFullObj.set(null)
    whatIsBeingDraggedID.set('')
    whatIsBeingDragged.set('')
  }
 const trace = (x, y) => {
  console.log(x,y);
  return y
 }
  console.log(('$tasksScheduledOn[ISODate]', $tasksScheduledOn?.[ISODate]));
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  class="day-header sticky-day-of-week-abbreviation"
  on:click|self={() => (isDirectlyCreatingTask = true)}
  on:dragover={(e) => dragover_handler(e)}
  on:drop={(e) => drop_handler(e, ISODate)}
>
  <div class="unselectable">
    <div
      class="center-flex day-name-label"
      class:active-day-name={ISODate <= DateTime.now().toFormat('yyyy-MM-dd')}
    >
      {DateTime.fromISO(ISODate).toFormat('ccc')}
    </div>

    <div class="center-flex" style="font-size: 16px; font-weight: 300">
      <div
        class="center-flex"
        style="padding: 8px; width: 48px; height: 36px;"
        class:active-date-number={ISODate <=
          DateTime.now().toFormat('yyyy-MM-dd')}
        class:highlighted-circle={false}
      >
        {DateTime.fromISO(ISODate).toFormat('dd')}
      </div>
    </div>
  </div>

  {#if isShowingDockingArea}
    <div style="overflow: hidden; margin-top: 4px;">
      {#if $tasksScheduledOn && doodleIcons}
        {#if $tasksScheduledOn[ISODate]}
          <div style="display: flex; flex-wrap: wrap;">
            {#each $tasksScheduledOn[ISODate].noStartTime.hasIcon as iconTask (iconTask.id)}
              <FunctionalDoodleIcon
                {iconTask}
                on:task-click
                on:task-checkbox-change
              />
            {/each}
          </div>
          {console.log('$tasksScheduledOn[ISODate]', $tasksScheduledOn?.[ISODate])}
          {#each $tasksScheduledOn[ISODate].noStartTime.noIcon as flexibleDayTask (flexibleDayTask.id)}
          {console.log('flexibleDayTask', flexibleDayTask)}
            <div
              on:click={() => dispatch('task-click', { task: flexibleDayTask })}
              style="width: var(--calendar-day-section-width); font-size: 12px; display: flex; gap: 4px; margin-top: 8px; margin-left: 4px; margin-right: 4px;"
            >
              <ReusableFlexibleDayTask
                task={flexibleDayTask}
                on:task-click
                on:task-update
                on:task-checkbox-change
              />
            </div>
          {/each}
        {/if}
      {/if}
    </div>
  {/if}
  <!-- END OF DOCKING AREA -->

  {#if isDirectlyCreatingTask}
    <div
      id="calendar-direct-task-div"
      style="
        width: 90%; 
        padding-left: 0px; 
        padding-right: 0px;
      "
    >
      <ReusableCreateTaskDirectly
        newTaskStartTime={''}
        resultantDateClassObject={DateTime.fromISO(ISODate).toJSDate()}
        on:new-root-task
        on:reset={() => (isDirectlyCreatingTask = false)}
      />
    </div>
  {/if}
</div>

<style>
  .day-header {
    width: var(--calendar-day-section-width);
    padding-top: var(--main-content-top-margin);
    padding-bottom: 18px;
  }

  .sticky-day-of-week-abbreviation {
    font-size: 1.4em;
    background-color: var(--calendar-bg-color);
    color: #6d6d6d;

    position: sticky;

    /* FIGURE THIS OUT TOMORROW */
    top: 0px;
    z-index: 1;
  }

  .day-name-label {
    font-size: 16px;
    margin-bottom: 0px;
    font-weight: 500;
  }

  .active-day-name {
    font-weight: 600;
    color: black;
  }

  .active-date-number {
    font-weight: 400;
    color: black;
  }

  .highlighted-circle {
    border-radius: 25px;
  }

  .center-flex {
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>
