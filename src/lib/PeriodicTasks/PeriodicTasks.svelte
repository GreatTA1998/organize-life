<script>
  import TemplateColumn from './TemplateColumn.svelte'
  import { onMount } from 'svelte'
  import { user, periodicTasks } from '/src/store.js'
  import PeriodicTasks from '/src/back-end/PeriodicTasks'
  import { filterByType } from './utils.js'

  $: weeklyTasks = filterByType($periodicTasks, 'weekly')
    
  $: monthlyTasks = filterByType($periodicTasks, 'monthly')
    
  $: yearlyTasks = filterByType($periodicTasks, 'yearly')
   
  $: quickTasks = filterByType($periodicTasks, 'quick')

  onMount(async () => {
    $periodicTasks = await PeriodicTasks.getAll($user.uid)
  })

</script>

<h4 class="bug-notice" >Known Bug: updates to templates need a refresh to display on the calendar</h4>
<div style="padding: 48px;">
  <div style="font-size: 32px; margin-bottom: 48px;">Templates</div>
  {#if periodicTasks}
    <div style="display: flex; width: 90vw; justify-content: space-between;">
      <TemplateColumn templates={quickTasks} crontab=""  />
      <TemplateColumn templates={weeklyTasks} crontab="0 0 * * 0" />
      <TemplateColumn templates={monthlyTasks} crontab="0 0 0 * *" />
      <TemplateColumn templates={yearlyTasks} crontab="0 0 0 0 *" />
    </div>
  {/if}
</div>

<style src="./PeriodicTasks.css" lang="postcss">
</style>
