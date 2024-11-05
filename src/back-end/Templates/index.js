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

const updateWithTasks = async ({ userID, id, updates, newTemplate }) => {
  console.log('updates', updates)
  console.log('newTemplate', newTemplate)
    updateDoc(doc(db, "users", userID, 'templates', id), updates)
   
    if(updates.crontab !== '0 0 0 * *' && newTemplate.crontab !== '0 0 * * 0'){
      console.log('deleting future tasks')
      deleteFutureTasks({ userID, id });
      console.log('posting future tasks')
      return await postFutureTasks({ userID, id, newTemplate })
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

export default { create, updateWithTasks, getAll, deleteTemplate, getPeriodFromCrontab };
