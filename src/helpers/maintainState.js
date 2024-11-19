import {
  todoTasks,
  todoMemoryTree,
  calendarTasks,
  calendarMemoryTree,
  tasksScheduledOn,
  inclusiveWeekTodo,
  uniqueEvents
} from "/src/store/index.js";
import { get } from "svelte/store";
import {
  reconstructTreeInMemory,
  constructCalendarTrees,
  computeDateToTasksDict,
} from "/src/helpers/dataStructures.js";

export function createOnLocalState({ id, createdNode }) {
  const newLocalNode = { id, ...createdNode }

  if (createdNode.startDateISO) {
    buildCalendarDataStructures({
      flatArray: [...get(calendarTasks), newLocalNode]
    })
  } else {
    buildTodoDataStructures({
      flatArray: [...get(todoTasks), newLocalNode]
    })
  }
}

export function updateLocalState({ id, keyValueChanges }) {
  const allTasks = [...get(todoTasks), ...get(calendarTasks)]
  const oldNode = allTasks.find(task => task.id === id)
  if(!oldNode) return;

  // compute what it'll be updated to
  const newNode = { ...oldNode };
  for (const [key, value] of Object.entries(keyValueChanges)) {
    newNode[key] = value;
  }
  // work with JS variables instead of Svelte stores
  let calArr = get(calendarTasks);
  let todoArr = get(todoTasks);

  // delete it from previous place
  if (oldNode.startDateISO) calArr = calArr.filter((task) => task.id !== id);
  else todoArr = todoArr.filter((task) => task.id !== id);

  // re-create it in new place (order doesn't matter, the tree algorithms will correct it)
  if (newNode.startDateISO) calArr = [...calArr, newNode];
  else todoArr = [...todoArr, newNode];

  // rebuild both structures, so it's correct no matter which arrays changed/didn't change
  buildCalendarDataStructures({
    flatArray: calArr,
  });
  buildTodoDataStructures({
    flatArray: todoArr,
  });
}

// we check for existence because mobile mode doesn't necessarily fetch the calendar tasks
// in the future we can be more precise with deletions and trim the logic
export function deleteFromLocalState({ id }) {
  if (get(calendarTasks)) {
    buildCalendarDataStructures({
      flatArray: get(calendarTasks).filter((task) => task.id !== id),
    })
  }
  if (get(todoTasks)) {
    buildTodoDataStructures({
      flatArray: get(todoTasks).filter((task) => task.id !== id),
    })
  }
}

export function buildEventsDataStructures({ flatArray }) {
  const memoryTree = constructCalendarTrees(flatArray);
  const dateToTasks = computeDateToTasksDict(memoryTree);
  uniqueEvents.set(dateToTasks)
}

export function buildCalendarDataStructures({ flatArray }) {
  calendarTasks.set(flatArray);
  const memoryTree = constructCalendarTrees(flatArray);
  calendarMemoryTree.set(memoryTree);
  const dateToTasks = computeDateToTasksDict(memoryTree);
  tasksScheduledOn.set(dateToTasks);
}

export function buildTodoDataStructures({ flatArray }) {
  todoTasks.set(flatArray);
  todoMemoryTree.set(reconstructTreeInMemory(get(todoTasks)));
  inclusiveWeekTodo.set(get(todoMemoryTree));
}

// TREE TRAVERSAL: IN CASE YOU NEED IT FOR THE FUTURE
function search({ memoryTree, id }) {
  // memory tree is an array of tree nodes
  for (const rootNode of memoryTree) {
    if (rootNode.id === id) return rootNode;
    else {
      for (const child of rootNode.children) {
        const out = helper({ node: child, id });
        if (out) return out;
      }
    }
  }
}

function helper({ node, id }) {
  if (node.id === id) return node;
  else {
    for (const child of node.children) {
      const out = helper({ node: child, id });
      if (out) return out;
    }
  }
}
