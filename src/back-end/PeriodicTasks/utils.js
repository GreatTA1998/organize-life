import cronParser from 'cron-parser';
import { DateTime } from 'luxon';
import { db } from "../firestoreConnection";
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
    console.error('unknown frequency', crontab);
    return 'unknown';
  }


const buildFutureTasks = async ({periodicTask, startDateJS, endDateJS, userID, periodicTaskId}) => {
    const interval = parseExpression(periodicTask.crontab, ({ currentDate: startDateJS, endDate: endDateJS, iterator: true }));
    const generatedTasks = [];
    while (true) {
        const cronObj = interval.next();
        const ISODate = DateTime.fromJSDate(new Date(cronObj.value.toString())).toFormat('yyyy-MM-dd')
        generatedTasks.push(buildTaskFromTemplate(periodicTask, ISODate));
      if (cronObj.done) {
        await updateDoc(doc(db, "users", userID, 'periodicTasks', periodicTaskId), {lastGeneratedTask: ISODate});
        return generatedTasks;
      }
    }
  }

  const deleteFutureTasks = async ({ userID, id, fromDate }) => {
    const tasksQuery = query(
      collection(db, "users", userID, "tasks"),
      where('periodicTaskId', '==', id),
      where('startDateISO', '>=', fromDate)
    );
    const tasksSnapshot = await getDocs(tasksQuery);
    const deletePromises = tasksSnapshot.docs.map(doc =>
      deleteDoc(doc.ref)
    );
    return Promise.all(deletePromises);
  }

  const postFutureTasks = async ({ userID, id, fromDate }) => {
    const snapshot = await getDoc(doc(db, "users", userID, 'periodicTasks', id));
    const periodicTask = snapshot.data();
    periodicTask.id = id;
    const offset = getPeriodFromCrontab(periodicTask.crontab) === 'yearly' ? { years: 1 } : { months: 1 };
    const startDate = DateTime.fromISO(`${fromDate}T${periodicTask.startTime||'00:00'}:00`, { zone: periodicTask.timeZone }).plus({ days: 1 });
    const endDate = DateTime.now().setZone(periodicTask.timeZone).plus(offset);
    const tasksArray = await buildFutureTasks({periodicTask, startDateJS: new Date(startDate), endDateJS: new Date(endDate), userID, periodicTaskId: id});
    tasksArray.forEach(task => {
        const taskId = getRandomID()
        setDoc(doc(db, "users", userID, 'tasks', taskId), task);
    });
  }

  const getTotalStats = async ({ userID, id }) => {
    const q = query(collection(db, "users", userID, "tasks"), where('periodicTaskId', '==', id), where('startDateISO', '<=', DateTime.now().toFormat('yyyy-MM-dd')));
    const snapshot = await getDocs(q)
    const TotalMinutesSpent = snapshot.docs.reduce((acc, doc) => acc + doc.data().duration, 0);
    const totalTasksCompleted = snapshot.docs.length
    return [totalTasksCompleted, TotalMinutesSpent]
  };


  function buildTaskFromTemplate(periodicTask, ISODate) {
    return {
            name: periodicTask.name,
            startDateISO: ISODate,
            iconUrl: periodicTask.iconUrl,
            tags: periodicTask.tags,
            periodicTaskId: periodicTask.id,
            timeZone: periodicTask.timeZone,
            notes: periodicTask.notes,
            notify: periodicTask.notify,
            isDone: false,
            imageDownloadURL: "",
            imageFullPath: "",
            duration: periodicTask.duration,
            parentID: "",
            orderValue: 0,
            startTime: periodicTask.startTime,
        }
  }

  export {
    getPeriodFromCrontab,
    buildFutureTasks,
    postFutureTasks,
    deleteFutureTasks,
    getTotalStats
  }