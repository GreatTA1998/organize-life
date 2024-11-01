<script>
  import { tasksScheduledOn } from '/src/store.js'
  import { createEventDispatcher } from 'svelte'

  export let exactHeight
  export let monthName
  export let isShowingDockingArea
  export let leftEdgeIdx
  export let calOriginDT

  const dispatch = createEventDispatcher()

   $: monthName = leftEdgeIdx ? calOriginDT.plus({ days: leftEdgeIdx }).toFormat('LLL') : ''
   $: yearName = leftEdgeIdx ? calOriginDT.plus({ days: leftEdgeIdx }).toFormat('yyyy') : ''
</script>

<div class="corner-label" style="height: {exactHeight + 1}px;">
  <div style="font-size: 16px; margin-top: var(--main-content-top-margin);">
    <div style="color: rgb(0, 0, 0); font-weight: 400;">
      {monthName}
    </div>
    <div style="font-weight: 200; margin-top: 2px;">
      {yearName}
    </div>
  </div>

  {#if $tasksScheduledOn}
    <span
      on:click={() => dispatch('toggle-docking-area')}
      class="collapse-arrow material-symbols-outlined"
    >
      {isShowingDockingArea ? "expand_less" : "expand_more"}
    </span>
  {/if}
</div>

<style>
  .corner-label {
    position: absolute;
    top: 0;
    left: 0;
    background: var(--calendar-bg-color);
    z-index: 3;
    border-bottom: 1px solid lightgrey;
    border-right: 1px solid lightgrey;

    width: var(--timestamps-column-width);
    padding: 0px 5px 5px var(--calendar-left-padding);
  }

  .collapse-arrow {
    position: absolute;
    bottom: 4px;
    right: 4px;
    font-size: 26px;
    cursor: pointer;
    color: rgb(121, 121, 121);
    font-weight: 300;
  }
</style>
