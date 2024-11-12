import { todoTasks, calendarTasks } from '/src/store'
import { get } from "svelte/store";

export function trace(x, y) {
  console.log(x, y);
  return y;
}

export function findTaskByID (id) {
  for (const task of get(todoTasks)) {
    if (task.id === id) return task
  }
  for (const task of get(calendarTasks)) {
    if (task.id === id) return task
  } 
  return null
}
