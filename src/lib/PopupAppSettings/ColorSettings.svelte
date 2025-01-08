<script>
  import { naturalGreen, sunshineOrange, offWhite } from '/src/helpers/color-utils.js'
  import { updateFirestoreDoc } from '/src/helpers/firestoreHelpers.js'
  import { user } from '/src/store'
</script>

<div> 
  <button on:click={() => updateFirestoreDoc(`/users/${$user.uid}`, { calendarTheme: 'naturalGreen' })} 
    class="color-square" style:background-color={naturalGreen}
  >
    Natural Green
  </button>

  <button on:click={() => updateFirestoreDoc(`/users/${$user.uid}`, { calendarTheme: 'offWhite' })} 
    class="color-square" style:background-color={offWhite}
  >
    Off White
  </button>

  <button on:click={() => updateFirestoreDoc(`/users/${$user.uid}`, { calendarTheme: 'sunshineOrange' })} 
    class="color-square" style:background-color={sunshineOrange}
  >
    Sunshine Orange
  </button>
</div>

<style>
  .color-square {
    width: 96px; 
    height: 96px; 
    border-radius: 12px;
    padding: 4px;
    box-sizing: border-box;
  }
</style>