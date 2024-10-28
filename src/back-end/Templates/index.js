import { db } from "../firestoreConnection.js";
import {
  doc,
  getDocs,
  collection,
  query,
  where,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc
} from "firebase/firestore";
import { DateTime } from 'luxon';
import { getPeriodFromCrontab, deleteFutureTasks, postFutureTasks, getTotalStats } from './utils.js';
import Joi from 'joi';
import TemplateSchema from '../Schemas/TemplateSchema.js';

const create = async ({ userID, template, templateID }) => {
  Joi.assert(template, TemplateSchema);
  const docRef = doc(db, "users", userID, 'templates', templateID);
  return setDoc(docRef, template);
};

const updateWithTasks = async ({ userID, id, updates }) => {
  if (updates.crontab) {
    const oldTemplate = await getDoc(doc(db, "users", userID, 'templates', id));
    Joi.assert({ ...oldTemplate.data(), ...updates }, TemplateSchema);
    await updateDoc(doc(db, "users", userID, 'templates', id), updates);
    return Promise.all([
      deleteFutureTasks({ userID, id }),
      updates.crontab === '0 0 0 * *' ? Promise.resolve([]) :
        postFutureTasks({ userID, id })
    ]);
  }
  const oldTemplate = await getDoc(doc(db, "users", userID, 'templates', id));
  Joi.assert({ ...oldTemplate.data(), ...updates }, TemplateSchema);
  updateDoc(doc(db, "users", userID, 'templates', id), updates)
  const uniqueProperties = ['crontab', 'id', 'userID', 'lastGeneratedTask'];
  for (const property of uniqueProperties) {
    delete updates[property];
  }
  delete updates.orderValue;
  const tasksQuery = query(
    collection(db, "users", userID, "tasks"),
    where('templateID', '==', id),
    where('startDateISO', '>=', DateTime.now().toFormat('yyyy-MM-dd'))
  );

  const tasksSnapshot = await getDocs(tasksQuery);
  const updatePromises = tasksSnapshot.docs.map(task => {
    const taskData = task.data();
    const taskDateTime = DateTime.fromISO(
      `${taskData.startDateISO}T${taskData.startTime || '00'}:00`,
    );
    if (taskDateTime >= DateTime.now()) {
      return updateDoc(doc(db, "users", userID, 'tasks', task.id), updates);
    }
    return Promise.resolve();
  });
  return Promise.all(updatePromises);
};



const getAll = async ({ userID, includeStats = true }) => {
  const q = query(collection(db, "users", userID, "templates"));
  const snapshot = await getDocs(q)
  const arraywithIds = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id, userID: doc.ref.parent.parent.id }))
  if (!includeStats) return arraywithIds;

  for (const template of arraywithIds) {
    const [totalTasksCompleted, TotalMinutesSpent] = await getTotalStats({ userID, id: template.id })
    template.totalTasksCompleted = totalTasksCompleted
    template.TotalMinutesSpent = TotalMinutesSpent
  }
  return arraywithIds
};

const deleteTemplate = async ({ userID, id }) => {
  deleteFutureTasks({ userID, id });
  return deleteDoc(doc(db, "users", userID, "templates", id));
};

export default { create, updateWithTasks, getAll, deleteTemplate, getPeriodFromCrontab };
