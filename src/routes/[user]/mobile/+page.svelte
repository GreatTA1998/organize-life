<script>
  import MobileMode from '$lib/MobileMode/MobileMode.svelte'

  import { user } from '/src/store'
</script>

<!-- Don't put this logic on +layout, because it'd block home page from loading for new users -->
{#if $user.uid}
  <MobileMode />
{/if}
