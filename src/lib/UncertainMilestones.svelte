<div style="padding: 24px;">
  Uncertain milestones
  <ul>
    <li>
      What it's good for: complex, long-term, pre-planned, multi-step milestones (without cluttering the to-do list)
    </li>
    <li>
     Status badges: Uncertain outcomes that requires trying dead-ends, awaiting, following-up and consistent effort
    </li>
    <li>
      Wholistic visualization: drag-and-drop entire branches anywhere, forging rich "tree histories" of everything you did
    </li>
  </ul>

  <button on:click={() => createMilestoneNode({ 
    id: getRandomID(), 
    newMilestoneObj: { name: 'Test milestone' }
  })}
  >
    Create milestone
  </button>

  <div style="display: flex; margin-top: 36px;">
    {#each allMilestones as milestoneObj, i (milestoneObj.id)}
      <RecursiveTaskElement 
        taskObj={milestoneObj}
        depth={0}
        ancestorRoomIDs={['']}
        doNotShowScheduledTasks={true}
        doNotShowCompletedTasks={false}
        dueInHowManyDays={Infinity}
        isMilestoneMode={true}
        on:task-click={(e) => openDetailedCard(e.detail)}
        on:task-checkbox-change={(e) => updateMilestoneNode({ id: e.detail.id, keyValueChanges: { isDone: e.detail.isDone }})}
        on:task-node-update
        on:subtask-create={(e) => createSubMilestone(e.detail)}
      >
        <div slot="dropzone-above-task-name">
          {#if allMilestones.length > 2}
            <ReusableHelperDropzone
              ancestorRoomIDs={['']}
              roomsInThisLevel={allMilestones}
              idxInThisLevel={i}
              parentID={''}
              parentObj={{ subtreeDeadlineInMsElapsed: Infinity }}
              colorForDebugging="purple"
              dueInHowManyDays={Infinity}
              isMilestoneMode={true}
            />
          {/if}
        </div>
      </RecursiveTaskElement>
    {/each}

    {#if allMilestones.length > 2}
      <!-- NOTE: BECAUSE WE DON'T DISPLAY TASKS THAT ARE COMPLETED,
        WE HAVE A DEVIATION BETWEEN STATE AND UI
        IN THE FUTURE IF THERE ARE UNEXPECTED BUGS, THIS IS THE LIKELY CAUSE
      -->
      <ReusableHelperDropzone
        ancestorRoomIDs={['']}
        roomsInThisLevel={allMilestones}
        idxInThisLevel={allMilestones.length}
        parentID={''}
        parentObj={{ subtreeDeadlineInMsElapsed: Infinity }}
        colorForDebugging="blue"
        dueInHowManyDays={Infinity}
        isMilestoneMode={true}
      />
    {/if}
  </div> 
</div>

{#key clickedMilestone}
  <!-- 
      on:task-reusable={() => createReusableTaskTemplate(clickedMilestone.id)}
      on:repeating-tasks-generate={(e) => uploadGeneratedTasks(e.detail)}
      on:task-click={(e) => openDetailedCard(e.detail)}
      on:task-checkbox-change={(e) => updateTaskNode({ id: e.detail.id, keyValueChanges: { isDone: e.detail.isDone }})} -->

  {#if isDetailedCardOpen}
    <DetailedCardPopup 
      taskObject={clickedMilestone}
      on:task-update={(e) => updateMilestoneNode(e.detail)} 
      on:card-close={() => isDetailedCardOpen = false}
      on:task-delete={(e) => deleteMilestoneNode(e.detail)}
    />
  {/if}
{/key}


<script>
  import { 
    setFirestoreDoc, 
    updateFirestoreDoc,
    deleteFirestoreDoc
  } from "/src/helpers/firestoreHelpers.js"
  import { user } from '/src/store'
  import { onMount, onDestroy } from 'svelte'
  import { 
    collection, 
    onSnapshot, 
    arrayUnion,
    arrayRemove 
  } from 'firebase/firestore'
  import { getRandomID } from '/src/helpers/everythingElse.js'
  import { reconstructTreeInMemory } from "/src/helpers/dataStructures.js"
  import RecursiveTaskElement from '$lib/RecursiveTaskElement.svelte'
  import ReusableHelperDropzone from '$lib/ReusableHelperDropzone.svelte'
  import DetailedCardPopup from '$lib/DetailedCardPopup/DetailedCardPopup.svelte'
  import {db} from '../back-end/firestoreConnection'
  import applyTaskSchema from '../helpers/applyTaskSchema'

  let unsub = null 
  let allMilestones = [] // don't worry about AF
  let isDetailedCardOpen = false
  let clickedMilestone = {}


  const milestonesPath = `/users/${$user.uid}/milestones/`

  onMount(() => {
    const ref = collection(db, `/users/${$user.uid}/milestones`)
    unsub = onSnapshot(ref, (querySnapshot) => {
      const result = [] 
      querySnapshot.forEach((doc) => {
        result.push({ id: doc.id, ...doc.data()})
      })

      allMilestones = reconstructTreeInMemory(result)

      // no need to partition it into disjoint, complete sets
      // tasksScheduledOn.set(computeDateToTasksDict(allTasks))
    })
  })

  onDestroy(() => {
    if (unsub) unsub()
  })

  function openDetailedCard ({ task }) {
    clickedMilestone = task 
    isDetailedCardOpen = true
  }
  
  // TO-DO: 
  //   - will need to generate the same tree to represent the hierarchical structure

  // same interface as hierarchical todo-lists, except the database collection is not "tasks" but `uncertainMilestones`
  async function createMilestoneNode ({ id, newMilestoneObj }) {
    const formatedMilestone = await applyTaskSchema(newMilestoneObj, $user)
   return await setFirestoreDoc(
      `users/${$user.uid}/milestones/${id}`, 
      newMilestoneObjChecked
    ).catch(err => console.error('error in creteMilesoneNode', err));
    // TO-DO: update a separate counter that keeps track of the `maxOrderValue` within milestones
  }

    
  function updateMilestoneNode ({ id, keyValueChanges }) {
    updateFirestoreDoc(milestonesPath + id, keyValueChanges)
    // very useful for debugging
  }

  // the param is `newTaskObj` to conform to the <RecursiveTaskElement> API,
  // but after that, you see we use `newMilestoneObj`
  function createSubMilestone ({ id, parentID, newTaskObj }) {
    updateMilestoneNode({ id: parentID, keyValueChanges: { children: arrayUnion(id)}})
    createMilestoneNode({ id, newMilestoneObj: newTaskObj })
  }

  function deleteMilestoneNode ({ id, parentID, childrenIDs, imageDownloadURL = '', imageFullPath = ''}) {
    if (parentID !== "") {
      updateFirestoreDoc(milestonesPath + parentID, {
        childrenIDs: arrayRemove(id)
      })
      // parent will be deleted, so the grandparent will take care of the children
      if (childrenIDs) {
        updateFirestoreDoc(milestonesPath + parentID, {
          childrenIDs: arrayUnion(...childrenIDs)
        })
      }
    }

    // temporary to clean up tasks that were created that didn't conform to the schema
    // surprisngly many, keep it in to save time
    if (childrenIDs) {
      for (const childID of childrenIDs) {
        updateFirestoreDoc(milestonesPath + childID, {
          "parentID": parentID
        })
      }
    }

    // TO-DO: handle pointerless images
    if (imageFullPath) {
      const storage = getStorage()
      deleteObject(ref(storage, imageFullPath))
    }

    // now safely delete itself
    deleteFirestoreDoc(milestonesPath + id)
  }


  // function below for reference
  function createSubtask ({ id, parentID, newTaskObj }) {
    // the parent needs to update its pointers
    updateMilestoneNode({ id: parentID, keyValueChanges: { children: arrayUnion(id)}})
    createMilestoneNode({ id, newTaskObj })
  }
</script>