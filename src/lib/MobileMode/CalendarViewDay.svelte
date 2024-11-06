<script>
  import ReusableFlexibleDayTask from '$lib/ReusableFlexibleDayTask.svelte'
  import FunctionalDoodleIcon from '$lib/FunctionalDoodleIcon.svelte'
  import { tasksScheduledOn } from '/src/store.js'
  import { createEventDispatcher, onMount } from 'svelte'
  import {
    getTimeInHHMM,
    pureNumericalHourForm
  } from '/src/helpers/everythingElse.js'
  import { DateTime } from 'luxon'

  export let dateToRender
  export let doodleIcons

  let DayHeader
  let CurrentTimeIndicator
  $: tasksThisDay = $tasksScheduledOn[dateToRender]

  let idxOfTimeIndicator = 0
  const dispatch = createEventDispatcher()

  $: if ($tasksScheduledOn) {
    computeIndicatorPosition()
  }

  $: if (CurrentTimeIndicator) {
    if (DayHeader) {
      DayHeader.scrollIntoView({ behavior: 'instant', block: 'start' })
    }
  }

  onMount(() => {})

  function computeIndicatorPosition() {
    const { hasStartTime } = tasksThisDay
    // bonus: display current time (brown line)
    for (let i = 0; i < hasStartTime.length; i++) {
      if (!hasTimeAlreadyPassed(hasStartTime[i])) {
        idxOfTimeIndicator = i
        return
      }
    }
  }

  function hasTimeAlreadyPassed(eventTask) {
    const nowHHMM = getTimeInHHMM({ dateClassObj: new Date() })
    return (
      pureNumericalHourForm(nowHHMM) >
      pureNumericalHourForm(eventTask.startTime)
    )
  }

  function hasAlreadyHappened(eventTask) {
    return eventTask.isDone
  }

  function isNightTime(eventTask) {
    const sevenPM = new Date()
    sevenPM.setHours(19) // 7 pm
    const nightHHMM = getTimeInHHMM({ dateClassObj: sevenPM })
    return (
      pureNumericalHourForm(eventTask.startTime) >
      pureNumericalHourForm(nightHHMM)
    )
  }
</script>

<div style="padding: 0px;">
  <h1
    bind:this={DayHeader}
    style="font-size: 2.4rem; text-transform: uppercase; color: black; padding: 8px; margin: 0px; margin-bottom: 0px"
  >
    {DateTime.fromISO(dateToRender).toFormat('cccc (LLL dd)')}
  </h1>

  {#if doodleIcons}
    <div style="display: flex; flex-wrap: wrap;">
      {#each tasksThisDay.noStartTime.hasIcon as iconTask}
        <FunctionalDoodleIcon
          {iconTask}
          on:task-click
          on:task-update
        />
      {/each}
    </div>
  {/if}

  <div
    style="display: flex; flex-direction: column; gap: 4px; padding-left: 8px; margin-bottom: 8px;"
  >
    {#each tasksThisDay.noStartTime.noIcon as flexibleDayTask}
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <div
        on:click={() => dispatch('task-click', { task: flexibleDayTask })}
        style="width: var(--calendar-day-section-width); font-size: 12px; display: flex; gap: 4px; margin-bottom: 4px; margin-left: 4px; margin-right: 4px;"
      >
        <ReusableFlexibleDayTask 
          task={flexibleDayTask}
          fontSizeInPx={32}
          cssWidth={'100%'}
          on:task-click
          on:task-update
        />
      </div>
    {/each}
  </div>

  {#each tasksThisDay.hasStartTime as eventToday, i}
    {#if dateToRender === DateTime.now().toFormat('yyyy-MM-dd') && i === idxOfTimeIndicator}
      <div
        bind:this={CurrentTimeIndicator}
        class="current-time-indicator"
      ></div>
    {/if}

    {#if eventToday.iconURL}
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <div
        on:click={() => dispatch('task-click', { task: eventToday })}
        class="today-event"
        class:half-visible={!hasAlreadyHappened(eventToday)}
        class:night-time={isNightTime(eventToday)}
        style="display: flex; align-items: center; margin-bottom: 0px;"
      >
        <div class="event-scheduled-time">
          {eventToday.startTime}
        </div>

        <!-- svelte-ignore a11y-missing-attribute -->
        <img src={eventToday.iconURL} style="width: 48px; height: 48px;" />
      </div>
    {:else}
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <div
        on:click={() => dispatch('task-click', { task: eventToday })}
        class="today-event"
        class:half-visible={!hasAlreadyHappened(eventToday)}
        class:night-time={isNightTime(eventToday)}
        style="
          margin-bottom: 0px;
          background-image: {eventToday.imageDownloadURL
          ? `url(${eventToday.imageDownloadURL})`
          : ''};
          background-size: contain;
          background-repeat: no-repeat;
        "
      >
        {#if !eventToday.imageDownloadURL}
          <div class="event-scheduled-time">
            {eventToday.startTime}
          </div>
          <div
            style="font-size: 32px; display: flex; align-items: center; flex-wrap: no-wrap;"
          >
            {eventToday.name}
          </div>
        {:else}
          <div style="width: 100%; height: 240px;"></div>
        {/if}
      </div>
    {/if}
  {/each}
</div>

<style>
  .current-time-indicator {
    border: 4px solid var(--location-indicator-color);
    border-radius: 0px;
    width: 100%;
    margin-top: 8px;
    margin-bottom: 8px;
  }

  .today-event {
    padding: 8px;
    border: 1px solid grey;
  }

  .night-time {
    background-color: rgb(40, 40, 40);
    color: white;
  }

  .event-scheduled-time {
    font-size: 32px;
    font-weight: 600;
  }

  .half-visible {
    opacity: 0.5;
  }
</style>
