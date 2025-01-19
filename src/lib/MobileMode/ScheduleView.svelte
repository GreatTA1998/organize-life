{#if $uniqueEvents}
  <div style="padding: 24px; display: flex; flex-direction: column; row-gap: 12px;">
    {#each Object.keys($uniqueEvents) as simpleDateISO}
      {#if $uniqueEvents[simpleDateISO]}
        <ScheduleViewDay 
          tasksThisDay={$uniqueEvents[simpleDateISO]} 
          {simpleDateISO}
          on:task-click
          on:task-checkbox-change
        />
      {/if}
    {/each}
  </div>
{/if}

<script>
  import { uniqueEvents, user } from '/src/store'
  import ScheduleViewDay from './ScheduleViewDay.svelte'
  import { fetchMobileFutureOverviewTasks } from '$lib/MainPage/handleTasks.js'

  fetchMobileFutureOverviewTasks($user.uid)
</script>
