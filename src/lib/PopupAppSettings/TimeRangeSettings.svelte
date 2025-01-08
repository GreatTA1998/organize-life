<script>
  import { user } from '/src/store'
  import { updateFirestoreDoc } from '/src/helpers/firestoreHelpers.js'

  function updateCalendarTimeRange ({ earliestHHMM }) {
    updateFirestoreDoc('/users/' + $user.uid, {
      earliestHHMM: earliestHHMM,
    })
  }
</script>

<div>
  Start time      
  <input type="time" on:input={e => updateCalendarTimeRange({ earliestHHMM: e.target.value })} />

  <div on:click={() => updateCalendarTimeRange({ earliestHHMM: '07:00' })} on:keydown>
    Click this for the short-cut to start from 7 am
  </div>
</div>

<!-- <div>End time
  <input type="time" on:input={e => updateCalendarTimeRange({ latestHHMM: e.target.value })} />
</div> -->

