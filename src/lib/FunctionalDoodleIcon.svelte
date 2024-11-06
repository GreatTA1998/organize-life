<div style="position: relative;">
  <img 
    on:click|stopPropagation={handleSingleOrDoubleClick}
    src={iconTask.iconUrl} 
    class:clearly-visible={iconTask.isDone}
    class:task-not-done={!iconTask.isDone}
    style="width: 32px; height: 32px; border: 0px solid blue; cursor: pointer;"
    class:radial-glow={iconTask.isDone}
    class="ios-3d-touch-disable unselectable"
    draggable="true"
    on:dragstart|self={(e) => startDragMove(e, iconTask.id)} 
  >
</div>

<!-- 
  <div style="font-size: 2px;">{iconTask.name}</div>
  <div style="font-size: 2px;">{iconTask.repeatGroupID}</div> 
-->

<script>
  import { 
    whatIsBeingDragged, 
    whatIsBeingDraggedID, 
    whatIsBeingDraggedFullObj,
    yPosWithinBlock
  } from "/src/store.js"
  import { createEventDispatcher } from 'svelte'

  export let iconTask

  let timer
  let delay = 200

  const dispatch = createEventDispatcher()

  function handleSingleOrDoubleClick () {
    if (timer) {
      clearTimeout(timer)
      timer = null

      dispatch('task-update', { 
        id: iconTask.id, 
        keyValueChanges: {
          isDone: !iconTask.isDone
        }
      })

    } 
    else {
      timer = setTimeout(() => {
        dispatch('task-click', { task: iconTask })
      
        timer = null
      }, delay)
    }
  }

  function startDragMove (e, id) {
    e.dataTransfer.setData("text/plain", id)

    // record distance from the top of the element
    const rect = e.target.getBoundingClientRect()
    const y = e.clientY - rect.top // y position within el ement

    whatIsBeingDraggedID.set(id)
    whatIsBeingDragged.set('room')
    whatIsBeingDraggedFullObj.set(iconTask)

    yPosWithinBlock.set(y)
  }
</script>

<style>
  .ios-3d-touch-disable {
    -webkit-touch-callout: none;
  }

  .task-not-done {
    filter: grayscale(80%) opacity(0.8) blur(0.8px);
  }

  .clearly-visible {
    opacity: 1;
  }
</style>