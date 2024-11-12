{#if $tasksScheduledOn}
  <div style="padding: 24px; display: flex; flex-direction: column; row-gap: 12px;">
    {#each Object.keys($tasksScheduledOn) as simpleDateISO}
      {#if $tasksScheduledOn[simpleDateISO]}
        <ScheduleViewDay 
          tasksThisDay={$tasksScheduledOn[simpleDateISO]} 
          {simpleDateISO}
          on:task-click
          on:task-checkbox-change
        />
      {/if}
    {/each}
  </div>
{/if}

<script>
  import { tasksScheduledOn } from '/src/store'
  import ScheduleViewDay from './ScheduleViewDay.svelte'
</script>
