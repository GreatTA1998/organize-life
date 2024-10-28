<script>
  import TemplateColumn from './TemplateColumn.svelte'
  import { onMount } from 'svelte'
  import { user, templates } from '/src/store.js'
  import Templates from '/src/back-end/Templates'
  import { filterByType } from './utils.js'

  $: weeklyTasks = filterByType($templates, 'weekly')

  $: monthlyTasks = filterByType($templates, 'monthly')

  $: yearlyTasks = filterByType($templates, 'yearly')

  $: quickTasks = filterByType($templates, 'quick')

  onMount(async () => {
    $templates = await Templates.getAll({
      userID: $user.uid,
      includeStats: true
    })
  })
</script>

<h4 class="bug-notice">
  Known Bugs:
  <ul>
    <li>Updates to templates need a refresh to display on the calendar</li>
    <li>adding quick tasks to the calendar requires refresh to recalculate statistics</li>
  </ul>
</h4>
<div style="padding: 48px;">
  <div style="font-size: 32px; margin-bottom: 48px;">Templates</div>
  <div style="display: flex; width: 90vw; justify-content: space-between;">
    <TemplateColumn templates={quickTasks} crontab="" />
    <TemplateColumn templates={weeklyTasks} crontab="0 0 * * 0" />
    <TemplateColumn templates={monthlyTasks} crontab="0 0 0 * *" />
    <TemplateColumn templates={yearlyTasks} crontab="0 0 0 0 *" />
  </div>
</div>

<style src="./Templates.css" lang="postcss">
</style>
