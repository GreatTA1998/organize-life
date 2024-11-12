{#each mobileCalDaysToRender as dateToRender}
  {#if $tasksScheduledOn && $tasksScheduledOn[dateToRender]}
    {#if dateToRender === DateTime.now().toFormat('yyyy-MM-dd')}
      {#if isCreatingNewTask}
        <div class="new-task-input">
          <UXFormField
            fieldLabel="Task Name"
            bind:value={newTaskName}
            on:task-entered={submitNewTask}
          />
          
          <MyJSDatePicker
            MMDD={newStartMMDD}
            YYYY={newStartYYYY}
            on:date-selected={(e) => { 
              newStartMMDD = e.detail.selectedDate
              newStartYYYY = e.detail.selectedYear
              
              const isoMMDD = newStartMMDD.replace('/', '-')
              const YYYYMMDD = `${newStartYYYY}-${isoMMDD}`
              
              newStartDateISO = YYYYMMDD
            }}
          />

          <button on:click={submitNewTask} style="height: 60px;">
            Create
          </button>
      
          <button on:click={() => {
            isCreatingNewTask = false
            newTaskName = ''
          }}>
            Cancel
          </button>
        </div>
      {/if}
    {/if}

    <CalendarViewDay 
      {dateToRender} 
      {doodleIcons}
      on:task-click  
    />

    <div style="margin-bottom: 60px;"></div>
  {/if}
{/each}

<slot {startTypingNewTask}>

</slot>

<script>
  import MyJSDatePicker from '$lib/MyJSDatePicker.svelte'
  import CalendarViewDay from '$lib/MobileMode/CalendarViewDay.svelte'
  import UXFormField from '$lib/UXFormField.svelte'
  import { onMount } from 'svelte'
  import { tasksScheduledOn, user } from '/src/store'
  import { getFirestoreCollection } from '/src/helpers/firestoreHelpers.js'
  import { DateTime } from 'luxon'
  import { buildDates } from '/src/helpers/dataStructures.js'
  import { createTaskNode } from '/src/helpers/crud.js'
  import { getRandomID } from '/src/helpers/everythingElse.js'

  let newStartMMDD = ''
  let newStartYYYY = ''
  let newStartDateISO = DateTime.now().toFormat('yyyy-MM-dd')

  let mobileCalDaysToRender = []
  let doodleIcons
  let isCreatingNewTask = false
  let newTaskName = ''

  onMount(async () => {
    decideMobileCalDaysToRender()

    const temp = await getFirestoreCollection('/doodleIcons')
    doodleIcons = temp

    // initialize the datepicker time to today
    const simpleDateISO = DateTime.now().toFormat('yyyy-MM-dd')
    const [yyyy, MM, dd] = simpleDateISO.split('-')
    newStartMMDD = `${MM}/${dd}`
    newStartYYYY = yyyy
  })

  function decideMobileCalDaysToRender () {
    const today = DateTime.now()
    mobileCalDaysToRender = buildDates({
      start: today.minus({ days: 7 }), 
      totalDays: 7 * 2 + 1
    })
  }

  function startTypingNewTask() {
    isCreatingNewTask = true
    newTaskName = ''
  }

  function submitNewTask() {
    const newName = newTaskName.trim() // removes trailing whitespace etc.
    if (newName) {
      const newTask = {
        name: newName,
        parentID: '',
        startDateISO: newStartDateISO
      }
      createTaskNode({ id: getRandomID(), newTaskObj: newTask })
      newTaskName = ''
    }
    isCreatingNewTask = false
  }
</script>

<style>
  .new-task-input {
    height: 80px;
    z-index: 1000;
    top: 0px;
    position: fixed;
    bottom: auto;
    left: 0;
    right: 0;
    background: white;
    padding: 10px;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    display: flex;
    gap: 10px;
  }
</style>
