<script>
  import UXFormField from "$lib/UXFormField.svelte";
  import { createEventDispatcher } from "svelte";
  import MyJSDatePicker from "$lib/MyJSDatePicker.svelte";
  import MyTimePicker from "$lib/DetailedCardPopup/MyTimePicker.svelte";
  import { DateTime } from "luxon";

  export let taskObject;

  let newStartMMDD = getLegacyMMDD(taskObject.startDateISO) 
  let newStartYYYY = taskObject.startDateISO ? taskObject.startDateISO.split('-')[0] : ''

  let internalStartTime = taskObject.startTime;
  const dispatch = createEventDispatcher();

  function getLegacyMMDD (simpleISO) {
    if (!simpleISO) return 
    else {
      const [YYYY, MM, DD] = simpleISO.split('-')
      return MM + '/' + DD
    }
  }

  function isScheduled (taskObj) {
    return taskObj.startDate && taskObj.startTime && taskObj.startYYYY;
  }

  function handleChanges (key, value, timeZone) {
    if (typeof Number(value) !== "number") return

    const taskUpdates = {
      [key]: value
    }

    if (timeZone) taskUpdates.timeZone = DateTime.local().zoneName

    dispatch("task-update", {
      id: taskObject.id,
      keyValueChanges: taskUpdates
    })
  }
</script>

<div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; row-gap: 24px; margin-top: 24px; font-size: 1.2em;">
  <div
    style="display: flex; align-items: start; gap: 16px;"
    class:half-invisible={!isScheduled(taskObject)}
  >
    <div>
      <MyJSDatePicker
        MMDD={newStartMMDD}
        YYYY={newStartYYYY}
        placeholder="Nov 2"
        on:date-selected={(e) => { 
          newStartMMDD = e.detail.selectedDate
          newStartYYYY = e.detail.selectedYear
          
          const isoMMDD = newStartMMDD.replace('/', '-')
          const YYYYMMDD = `${newStartYYYY}-${isoMMDD}`

          handleChanges('startDateISO', YYYYMMDD)
        }}
      />

      <MyTimePicker
        placeholder="HH:MM"
        pattern="[0-9]{2}:[0-9]{2}"
        value={internalStartTime}
        on:input={(e) => handleChanges("startTime", e.detail.typedHHMM)}
        on:time-selected={(e) => {
          internalStartTime = e.detail.selectedHHMM; // seems like a bug here,
          handleChanges("startTime", e.detail.selectedHHMM);
        }}
      />
    </div>

    <div style="margin-left: 6px; margin-right: 6px; max-width: 80px;">
      <UXFormField
        pattern="[0-9]*"
        max="1000"
        fieldLabel="Duration"
        value={Math.round(taskObject.duration)}
        willAutofocus={false}
        on:input={(e) => handleChanges("duration", Number(e.detail.value))}
      >
        <div
          slot="append"
          style="font-weight: 300; color: rgb(60, 60, 60); font-size: 12px;"
        >
          min
        </div>
      </UXFormField>
    </div>

    <div style="margin-left: 6px; margin-right: 6px; max-width: 120px;">
      <UXFormField
        fieldLabel="Notification"
        value={taskObject.notify}
        placeholder="not set"
        pattern="[0-9]*"
        max="1000"
        willAutofocus={false}
        on:input={(e) => handleChanges("notify", !isNaN(parseInt(e.detail.value)) ?e.detail.value : '', true)}
      >
        <div
          slot="append"
          style="font-weight: 300; color: rgb(60, 60, 60); font-size: 12px;"
        >
          min before
        </div>
      </UXFormField>
    </div>
  </div>
</div>