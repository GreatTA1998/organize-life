import cronParser from 'cron-parser';
import { DateTime } from 'luxon';
import { db } from "../firestoreConnection.js";
import { updateDoc, doc, setDoc, getDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { getRandomID } from '../../helpers/everythingElse.js';
const { parseExpression } = cronParser;

const getPeriodFromCrontab = (crontab) => {
  if (crontab === '') return 'quick';
  const parts = crontab.split(' ');
  if (parts.length !== 5) throw new Error('Invalid crontab format', crontab, parts);
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  if (dayOfMonth !== '*' && month !== '*' && dayOfWeek === '*') return 'yearly';
  if (dayOfMonth !== '*' && month === '*' && dayOfWeek === '*') return 'monthly';
  if (dayOfMonth === '*' && month === '*' && dayOfWeek !== '*') return 'weekly';
  throw new Error('unknown frequency');
}


const buildFutureTasks = async ({ template, startDateJS, endDateJS, userID, templateID }) => {
  const interval = parseExpression(template.crontab, ({ currentDate: startDateJS, endDate: endDateJS, iterator: true }));
  const generatedTasks = [];
  while (true) {
    const cronObj = interval.next();
    const ISODate = DateTime.fromJSDate(new Date(cronObj.value.toString())).toFormat('yyyy-MM-dd')
    const task = buildTaskFromTemplate(template, ISODate);
    Joi.attempt(task, TaskSchema);
    generatedTasks.push(task);
    if (cronObj.done) {
      await updateDoc(doc(db, "users", userID, 'templates', templateID), { lastGeneratedTask: ISODate });
      return generatedTasks;
    }
  }
}

const deleteFutureTasks = async ({ userID, id }) => {
  const fromDate = DateTime.now().toFormat('yyyy-MM-dd');
  const tasksQuery = query(
    collection(db, "users", userID, "tasks"),
    where('templateID', '==', id),
    where('startDateISO', '>=', fromDate)
  );
  const tasksSnapshot = await getDocs(tasksQuery);
  const deletePromises = tasksSnapshot.docs.map(doc => {
    const task = doc.data();
    const taskDateTime = DateTime.fromISO(
      `${task.startDateISO}T${task.startTime || '00'}:00`,
    );
    if (taskDateTime >= DateTime.now()) {
      return deleteDoc(doc(db, "users", userID, 'tasks', doc.id));
    }
    return Promise.resolve();
  });
  return Promise.all(deletePromises);
}

const postFutureTasks = async ({ userID, id }) => {
  const snapshot = await getDoc(doc(db, "users", userID, 'templates', id));
  const template = snapshot.data();
  template.id = id;
  const offset = getPeriodFromCrontab(template.crontab) === 'yearly' ? { years: 1 } : { months: 1 };
  const startDate = DateTime.now();
  const endDate = DateTime.now().plus(offset);
  const tasksArray = await buildFutureTasks({ template, startDateJS: new Date(startDate), endDateJS: new Date(endDate), userID, templateID: id });
  tasksArray.forEach(task => {
    const taskId = getRandomID()
    setDoc(doc(db, "users", userID, 'tasks', taskId), task);
  });
}

const getTotalStats = async ({ userID, id }) => {
  const q = query(collection(db, "users", userID, "tasks"), where('templateID', '==', id), where('startDateISO', '<=', DateTime.now().toFormat('yyyy-MM-dd')), where('isDone', '==', true));
  const snapshot = await getDocs(q)
  console.log(' get Total stats', snapshot.docs.map(doc => doc.data()));
  const TotalMinutesSpent = snapshot.docs.reduce((acc, doc) => acc + doc.data().duration, 0);
  const totalTasksCompleted = snapshot.docs.length
  return [totalTasksCompleted, TotalMinutesSpent]
};


function buildTaskFromTemplate(template, ISODate) {
  return {
    name: template.name,
    startDateISO: ISODate,
    iconURL: template.iconURL,
    tags: template.tags,
    templateID: template.id,
    timeZone: template.timeZone,
    notes: template.notes,
    notify: template.notify,
    isDone: false,
    imageDownloadURL: "",
    imageFullPath: "",
    duration: template.duration,
    parentID: "",
    orderValue: 0,
    startTime: template.startTime,
  }
}

export {
  getPeriodFromCrontab,
  buildFutureTasks,
  postFutureTasks,
  deleteFutureTasks,
  getTotalStats,
  buildTaskFromTemplate
}