<script>
  import { tasksScheduledOn } from '/src/store'
  import { createEventDispatcher } from 'svelte'

  export let exactHeight
  export let exactWidth = 64
  export let monthName
  export let isShowingDockingArea
  export let leftEdgeIdx
  export let calOriginDT
  export let isCompact = false

  const dispatch = createEventDispatcher()

  $: monthName = leftEdgeIdx ? calOriginDT.plus({ days: leftEdgeIdx }).toFormat('LLL') : ''
  $: yearName = leftEdgeIdx ? calOriginDT.plus({ days: leftEdgeIdx }).toFormat('yyyy') : ''
</script>

<div class="corner-label" style="height: {exactHeight + 1}px; --timestamps-column-width: {exactWidth}px;">
  <div 
    style="
      font-size: 12px;
      outline: 0px solid red; 
      font-size: { isCompact ? '12px' : '16px'};
      margin-top: { isCompact ? '12px' : 'var(--main-content-top-margin)'}; 
      margin-left: { isCompact ? '0px' : 'var(--calendar-left-padding)'};
      display: flex; 
      justify-content: center;
    "
    style:flex-direction={isCompact ? 'row' : 'column'}
  >
    <div style="color: rgb(0, 0, 0); font-weight: 400; display: inline-block;">
      {monthName}
    </div>

    {#if !isCompact}
      <div style="font-weight: 200; margin-top: 2px; display: inline-block;">
        {yearName}
      </div>
    {/if}
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
  }
  /* padding: 0px 5px 5px var(--calendar-left-padding); */


  .collapse-arrow {
    position: absolute;
    bottom: 4px;
    left: 50%;
    /* moves the left edge of the arrow to the center */
    transform: translateX(-50%);
    /* shifts the arrow back by half its own width */
    right: auto;
    font-size: 26px;
    cursor: pointer;
    color: rgb(121, 121, 121);
    font-weight: 300;
  }
</style>
