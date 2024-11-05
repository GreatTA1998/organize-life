import { writable, readable, get } from 'svelte/store'
import Templates from './back-end/Templates'
import { DateTime } from 'luxon'
import { deleteFromLocalState, updateLocalState } from './helpers/maintainState';
import Joi from 'joi';
import TemplateSchema from './back-end/Schemas/TemplateSchema.js';
export const todoTasks = writable(null)
export const calendarTasks = writable(null)

// templates
export const templates = writable([])


function deleteFutureTasks(templateID){
  const fullISODate = ({ startDateISO, startTime }) => DateTime.fromISO(`${startDateISO}T${startTime || '00:00'}:00`).toISO()
  const afterNow = (taskISO) => taskISO > DateTime.now().toISO();
  const tasksToDelete = get(calendarTasks).filter(task => task.templateID === templateID && afterNow(fullISODate(task)))
  tasksToDelete.forEach(deleteFromLocalState);
}

export function deleteTemplate({ templateID }) {
  const currentUser = get(user)
  Templates.deleteTemplate({ id: templateID, userID: currentUser.uid })
  templates.update((templates) => templates.filter((template) => template.id !== templateID))
  deleteFutureTasks(templateID)
}


function buildNewTemplate({oldTemplate, keyValueChanges}){
  const newTemplate = { ...oldTemplate, ...keyValueChanges }
  delete newTemplate.id
  delete newTemplate.userID
  delete newTemplate.totalMinutesSpent
  delete newTemplate.totalTasksCompleted
  Joi.assert(newTemplate, TemplateSchema);
  return newTemplate
}
const postFutureTasks = (hydratedTasks) => {
  calendarTasks.update((calendarTasks) => [...calendarTasks, ...hydratedTasks])
}

export async function updateTemplate({ templateID, keyValueChanges, oldTemplate }) {
  console.log('keyValueChanges', keyValueChanges)
  const newTemplate = buildNewTemplate ({oldTemplate, keyValueChanges})
  const currentUser = get(user);
  const hydratedTasks = await Templates.updateWithTasks({
    userID: currentUser.uid,
    id: templateID,
    updates: keyValueChanges,
    newTemplate
  })
  if (keyValueChanges.crontab) {
    deleteFutureTasks(templateID)
    postFutureTasks(hydratedTasks)
  }
  templates.update((templates) => templates.map((template) =>
    template.id === templateID ? { ...template, ...keyValueChanges } : template
  ))
  const fullISODate = ({ startDateISO, startTime }) => DateTime.fromISO(`${startDateISO}T${startTime || '00:00'}:00`).toISO()
  const afterNow = (taskISO) => taskISO > DateTime.now().toISO();
  const tasksToUpdate = get(calendarTasks).filter(task => task.templateID === templateID && afterNow(fullISODate(task)))
  tasksToUpdate.forEach(({id}) => updateLocalState({ id, keyValueChanges }));
}

export const user = writable({}) // {} means not logged in, cannot be null
export const doodleIcons = writable([])

export const hasFetchedUser = writable(false)
export const hasLogoExited = writable(false)

export const mostRecentlyCompletedTaskID = writable('')
export const isSnackbarHidden = writable(false)
export const mostRecentlyCompletedTaskName = writable('')

// 200/24 is the week view value
export const appModePixelsPerHour = writable(200 / 24)

export const hasInitialScrolled = writable(false)

export const showSnackbar = writable(false)

export const userInfoFromAuthProvider = writable({})

export const whatIsBeingDragged = writable("")
export const whatIsBeingDraggedID = writable("")
export const whatIsBeingDraggedFullObj = writable(null)

export const allTasksDueToday = writable([])
export const allTasksDueThisWeek = writable([])
export const allTasksDueThisMonth = writable([])
export const allTasksDueThisYear = writable([])
export const allTasksDueThisLife = writable([])

export const inclusiveWeekTodo = writable([])

export const longHorizonTasks = writable([])

export const tasksScheduledOn = writable(null)

export const yPosWithinBlock = writable(0)

export const todoMemoryTree = writable(null)
export const calendarMemoryTree = writable(null)

export const daysToRender = writable([])