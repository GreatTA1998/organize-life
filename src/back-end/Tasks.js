import { db } from "./firestoreConnection";
import { getRandomID } from "../helpers/everythingElse.js";
import {
  doc,
  getDocs,
  collection,
  query,
  where,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

const updateQuickTasks = async ({userID, templateID, updates}) => {
  const q = query(collection(db, "users", userID, "tasks"), where("templateID", "==", templateID));
  const snapshot = await getDocs(q);
  const updatePromises = snapshot.docs.map(doc => updateDoc(doc.ref, updates));
  return Promise.all(updatePromises);
}

const getByDateRange = (userUID, startDate, endDate) => {
  try {
    const q = query(
      collection(db, "users", userUID, "tasks"),
      where("startDateISO", ">=", startDate),
      where("startDateISO", "<=", endDate)
    );
    return getDocs(q).then((snapshot) =>
      snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }))
    );
  } catch (err) {
    console.error("Error in getByDateRange", err);
  }
};

const getUnscheduled = (userUID) => {
  const q = query(
    collection(db, "users", userUID, "tasks"),
    where("startDateISO", "==", ""),
    where("isDone", "==", false)
  );

  return getDocs(q).then((snapshot) =>
    snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }))
  );
};

const post = ({ userUID, task, taskID }) => {
  return setDoc(doc(db, "users", userUID, 'tasks', taskID), task);
};

const update = ({ userUID, taskID, keyValueChanges }) => {
  return updateDoc(doc(db, "users", userUID, 'tasks', taskID), keyValueChanges);
};

const remove = async ({ userUID, taskID }) => {
  deleteDoc(doc(db, "users", userUID, 'tasks', taskID));
  const childrenSnapshot = await getDocs(query(collection(db, "users", userUID, "tasks"), where("parentID", "==", taskID)));
  if (!childrenSnapshot.empty) {
    const updatePromises = childrenSnapshot.docs.map(child =>
      updateDoc(child.ref, { parentID: "" })
    );
    await Promise.all(updatePromises);
  }
  return;
}

const getTasksJSONByRange = async (uid, startDate, endDate) => {
  const neededProperties = [
    "duration",
    "isDone",
    "name",
    "notes",
    "startDateISO",
    "startTime",
  ];
  const q = query(
    collection(db, "users", uid, "tasks"),
    where("startDateISO", "!=", ""),
    where("startDateISO", ">=", startDate),
    where("startDateISO", "<=", endDate)
  );
  const getDataArray = (snapshot) => snapshot.docs.map((doc) => doc.data());
  const taskArray = await getDocs(q).then(getDataArray).catch(console.error);

  const reducetoNeeded = (task) =>
    neededProperties.reduce(
      (acc, prop) => ({ [prop]: task[prop] || "", ...acc }),
      {}
    );
  return JSON.stringify(taskArray.map(reducetoNeeded));
};

export default {
  updateQuickTasks,
  getByDateRange,
  getUnscheduled,
  post,
  update,
  getTasksJSONByRange,
  remove,
};
