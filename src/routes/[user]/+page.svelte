<script>
  import MainPage from '$lib/MainPage/MainPage.svelte'
  import { user } from '/src/store'
</script>

<!-- i.e. the user is fully hydrated, with properties like `journal` already initialized -->
{#if $user.uid}
  <MainPage />
{/if}
