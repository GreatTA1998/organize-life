import { db } from "../firestoreConnection.js";
import {
  doc,
  getDocs,
  collection,
  query,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import Tasks from '../Tasks.js';
import { getPeriodFromCrontab, deleteFutureTasks, postFutureTasks, getTotalStats } from './utils.js';
import Joi from 'joi';
import TemplateSchema from '../Schemas/TemplateSchema.js';

const create = async ({ userID, newTemplate, templateID }) => {
  Joi.assert(newTemplate, TemplateSchema);
  const docRef = doc(db, "users", userID, 'templates', templateID);
  return setDoc(docRef, newTemplate);
};

const update = async ({ userID, id, updates, newTemplate }) => {
  Joi.assert(newTemplate, TemplateSchema);
  Tasks.updateQuickTasks({userID, templateID: id, updates})
  updateDoc(doc(db, "users", userID, 'templates', id), updates)
}

const updateWithTasks = async ({ userID, id, updates, newTemplate }) => {
  updateDoc(doc(db, "users", userID, 'templates', id), updates)
  if (newTemplate.crontab !== '0 0 0 * *' && newTemplate.crontab !== '0 0 * * 0') {
    deleteFutureTasks({ userID, id });
    return postFutureTasks({ userID, id, newTemplate })
  }
  return [];
};

const getAll = async ({ userID, includeStats = true }) => {
  const q = query(collection(db, "users", userID, "templates"));
  const snapshot = await getDocs(q)
  const arraywithIds = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id, userID: doc.ref.parent.parent.id }))
  if (!includeStats) return arraywithIds;

  for (const template of arraywithIds) {
    const [totalTasksCompleted, totalMinutesSpent] = await getTotalStats({ userID, id: template.id })
    template.totalTasksCompleted = totalTasksCompleted
    template.totalMinutesSpent = totalMinutesSpent
  }
  return arraywithIds
};

const deleteTemplate = async ({ userID, id }) => {
  deleteFutureTasks({ userID, id });
  return deleteDoc(doc(db, "users", userID, "templates", id));
};

export default { create, update, updateWithTasks, getAll, deleteTemplate, getPeriodFromCrontab };
