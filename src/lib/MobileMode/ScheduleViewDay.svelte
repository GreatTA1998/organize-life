<div style="margin-bottom: 20px;">
  {#if DateTime.fromISO(simpleDateISO).toFormat('yyyy-MM-dd') === DateTime.now().toFormat('yyyy-MM-dd')}
    <div bind:this={CurrentDayIndicator} class="current-time-indicator"></div>
  {/if}

  <div style="font-size: 20px; margin-bottom: 6px; color: rgb(10, 10, 10); font-weight: 600;">  
    {DateTime.fromISO(simpleDateISO).toFormat('LLLL d (ccc)')}
  </div>

  <div style="display: flex; flex-wrap: wrap;">
    {#each tasksThisDay.noStartTime.hasIcon as iconTask}
      <FunctionalDoodleIcon
        {iconTask}
        on:task-click
        on:task-update
      />
    {/each}
  </div>

  {#each tasksThisDay.noStartTime.noIcon as flexibleDayTask}
    <div on:click={() => dispatch('task-click', { task: flexibleDayTask })} 
      style="
        width: var(--calendar-day-section-width); 
        font-size: 12px; 
        display: flex; 
        flex-direction: column;
        gap: 4px; margin-left: 4px; margin-right: 4px; margin-bottom: 4px;
      "
    >
      <ReusableFlexibleDayTask task={flexibleDayTask}
        fontSizeInPx={16}
        on:task-click
        on:task-update
        on:task-checkbox-change
      />
    </div>
  {/each}

  {#each tasksThisDay.hasStartTime as task}
    <div
      on:click={() => dispatch('task-click', { task })} 
      style="display: flex; align-items: center; flex-wrap: nowrap; padding: 2px;"
    >
      <div 
        style="font-size: 16px; white-space: nowrap; text-overflow: ellipsis;"
        class:grey-text={task.daysBeforeRepeating}
        class:purple-text={!task.daysBeforeRepeating}
      > 
        <span class="scheduled-event">
          {' ' + task.name + ' '}
          <!-- 
            Cannot use an inner class because the outer class "scheduled-event" will override
            I can't believe it's this hard...
          -->
          <div style="color: rgb(0, 0, 0); font-weight: 400; margin-right: 4px;">
            {getAmPmTime(task.startTime)}
          </div> 
        </span>
      </div>
    </div>
  {/each}
</div>

<script>
  import { DateTime } from 'luxon'
  import ReusableFlexibleDayTask from '$lib/ReusableFlexibleDayTask.svelte'
  import FunctionalDoodleIcon from '$lib/FunctionalDoodleIcon.svelte'
  import { createEventDispatcher } from 'svelte'

  export let tasksThisDay
  export let simpleDateISO

  let CurrentDayIndicator
  
  $: if (CurrentDayIndicator) {
    CurrentDayIndicator.scrollIntoView({ behavior: 'instant', block: 'start' })
  }

  const dispatch = createEventDispatcher()

  function getAmPmTime (hhmm) {
    const [hh, mm] = hhmm.split(':')
    const dt = DateTime.fromObject({ hour: Number(hh), minutes: Number(mm) })
    return dt.toFormat('h:mm a')
  }
</script>

<style>
  .current-time-indicator {
    border: 4px solid var(--location-indicator-color); 
    border-radius: 0px;
    width: 100%; 
    margin-top: 8px; 
    margin-bottom: 8px;
  }

  .scheduled-event {
    opacity: 0.7;
    font-size: 16px;
    gap: 6px;
    white-space: nowrap; text-overflow: ellipsis; 
    font-weight: 400; display: flex;
  }
</style>