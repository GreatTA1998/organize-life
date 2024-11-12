<slot {setIsPopupOpen}>

</slot>

{#if isPopupOpen}
  <div class="fullscreen-invisible-modular-popup-layer">
    <div class="detailed-card-popup" use:clickOutside on:click_outside={() => isPopupOpen = false}>
      <div style="display: flex; align-items: center;">
        <div style="font-size: 28px;">Have a problem?</div>
      </div>

      <div style="margin-top: 24px; margin-bottom: 24px;">
        Hello! Thanks for trying Intentions. If you are running into issues or have any suggestions, email me (99% reply rate within a week),
        or you can call me directly (9 am - 5 pm Tokyo Standard Time).
      </div>

      <div style="display: flex; align-items: center;">
        <span class="material-symbols-outlined" style="margin-right: 6px;">
          call
        </span>
        <div style="font-weight: 500;"> 
          +1 503 250 3868
        </div>
      </div>

      <div style="display: flex; align-items: center;">
        <span class="material-symbols-outlined" style="margin-right: 6px;">
          mail
        </span>

        <div style="font-weight: 500; margin-right: 12px;">
        elton@explanations.app
        </div>

        <div on:click={copyEmailToClipboard} style="color: #cc7837; border-radius: 24px; border: 2px solid #cc7837; cursor: pointer; display: flex; align-items: center; padding: 6px 8px; font-size: 24px;">
          <div style="font-size: 14px; margin-right: 4px; color: #cc7837; font-weight: 600;">
            Copy email
          </div>
          <span class="material-symbols-outlined">
            content_copy
          </span>
        </div>
      </div>
    </div>
  </div>
{/if}

<script>
  import { showSnackbar } from '/src/store'
  import { clickOutside } from '/src/helpers/everythingElse.js'


  let isPopupOpen = false

  function setIsPopupOpen ({ newVal }) {
    isPopupOpen = newVal
  }

  function copyEmailToClipboard () {
    navigator.clipboard.writeText("elton@explanations.app")
    showSnackbar.set(true)
    setTimeout(() => showSnackbar.set(false), 3000)
  }
</script>

<style>
  .detailed-card-popup {
    position: fixed;
    font-size: 14px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 58%;
    overflow-y: auto;
    z-index: 3;
    min-width: 360px;
    
    height: fit-content;

    padding: 24px;
    border-radius: 24px;
    background-color: white;
 
  /*    border: 1px solid #000; box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);*/
    -webkit-box-shadow:  0px 0px 0px 9999px rgba(0, 0, 0, 0.5);
  }

</style>