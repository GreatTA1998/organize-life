import { db } from '../firestoreConnection.js';
import { getDocs, query, collection, doc, writeBatch } from 'firebase/firestore';
import Joi from 'joi';
import TaskSchema from '../Schemas/TaskSchema.js';
import TemplateSchema from '../Schemas/TemplateSchema.js';

const nesseseryFields = [
    "duration",
    "name",
    "orderValue",
    "parentID",
    "startTime",
    "startDateISO",
    "iconURL",
    "timeZone",
    "notify",
    "notes",
    "templateID",
    "isDone",
    "imageDownloadURL",
    "imageFullPath"];

const removeUnnecessaryFields = (task) => {
    const cleanedTask = {};
    nesseseryFields.forEach(field => {
        if (task.hasOwnProperty(field)) {
            cleanedTask[field] = task[field];
        }
    });
    return cleanedTask;
};

const updateCollection = async (userID) => {
    try {
        const templatesRef = collection(db, 'users', userID, 'periodicTasks');
        const templatesSnapshot = await getDocs(query(templatesRef));
        const batch = writeBatch(db);
        templatesSnapshot.forEach((templateDoc) => {
            const newDocRef = doc(collection(db, 'users', userID, 'templates'), templateDoc.id);
            const newTemplate = {
                name: templateDoc.data().name,
                orderValue: templateDoc.data().orderValue,
                lastGeneratedTask: templateDoc.data().lastGeneratedTask,
                crontab: templateDoc.data().crontab || '',
                iconURL: templateDoc.data().iconURL || templateDoc.data().iconUrl || '',
                tags: templateDoc.data().tags || '',
                timeZone: templateDoc.data().timeZone || 'Asia/Tokyo',
                notes: templateDoc.data().notes || '',
                notify: templateDoc.data().notify || '',
                duration: templateDoc.data().duration || 0,
                startTime: templateDoc.data().startTime || '',
            }
            Joi.attempt(newTemplate, TemplateSchema);
            batch.set(newDocRef, newTemplate);
        });
        await batch.commit();
        console.log(`Successfully migrated documents to 'templates' collection`);
    } catch (error) {
        console.error('Error updating collection:', error);
        throw error;
    }
};

const updateTasks = async (userID) => {
    try {
        const tasks = await getDocs(query(collection(db, 'users', userID, 'tasks')))
        console.log(tasks.size);
        const batch = writeBatch(db);
        tasks.forEach((taskDoc) => {
            const newDocRef = doc(collection(db, 'users', userID, 'tasks'), taskDoc.id);
            if (!taskDoc.data().name) return;
            const newTask = {
                ...taskDoc.data(),
                orderValue: taskDoc.data().orderValue || 0,
                duration: taskDoc.data().duration || 0,
                startDateISO: taskDoc.data().startDateISO || '',
                startTime: taskDoc.data().startTime || '',
                notify: taskDoc.data().notify || '',
                timeZone: taskDoc.data().timeZone || 'Asia/Tokyo',
                templateID: taskDoc.data().templateID || taskDoc.data().periodicTaskId || taskDoc.data().reusableTemplateID || '',
                iconURL: taskDoc.data().iconURL || taskDoc.data().iconUrl || '',
                notes: taskDoc.data().notes || '',
                isDone: taskDoc.data().isDone || false,
                imageDownloadURL: taskDoc.data().imageDownloadURL || '',
                imageFullPath: taskDoc.data().imageFullPath || ''
            };
            const cleanedTask = removeUnnecessaryFields(newTask);
            Joi.attempt(cleanedTask, TaskSchema, "Error in task: " + taskDoc.id,);
            batch.set(newDocRef, cleanedTask);
        });
        console.log(`updating ${batch.size} tasks`);
        await batch.commit();
        console.log(`Successfully updated ${batch.size} tasks`);
    } catch (error) {
        console.error('Error updating tasks:', error);
        throw error;
    }
}

const userID = '1'
// '46OCRjQornhVCBmt0uz7ITASqOP2';
//  '6uIcMMsBEkQ85OINCDADtrygzZx1';

// task: 02N6mo10hj07qnVA7oiB
// await updateCollection('yGVJSutBrnS1156uopQQOBuwpMl2')
await updateTasks('yGVJSutBrnS1156uopQQOBuwpMl2')


// const tasks = await getDocs(query(collection(db, 'users', userID, 'tasks')))

