import { sourceDB, destinationDB } from '../firestoreConnection.js';
import { getDocs, query, collection, doc, writeBatch, getDoc, setDoc, getCountFromServer } from 'firebase/firestore';
import Joi from 'joi';
import TaskSchema from '../Schemas/TaskSchema.js';
import TemplateSchema from '../Schemas/TemplateSchema.js';
import UserSchema from '../Schemas/UserSchema.js';
import IconSchema from '../Schemas/IconSchema.js';

const migrateUser = async (userID) => {
    const userRef = doc(sourceDB, 'users', userID);
    const userSnapshot = await getDoc(userRef);
    const newUser = {
        FCMTokens: userSnapshot.data().FCMTokens || [],
        email: userSnapshot.data().email || '',
        isSubscriber: userSnapshot.data().isSubscriber || false,
        phoneNumber: userSnapshot.data().phoneNumber || '',
        maxOrderValue: userSnapshot.data().maxOrderValue || 0,
        uid: userSnapshot.id
    }
    Joi.attempt(newUser, UserSchema, "Error in user: " + userID);
    const newUserRef = doc(destinationDB, 'users', userID);
    await setDoc(newUserRef, newUser);
    return;
}

const migrateTemplates = async (userID) => {
    try {
        const templatesRef = collection(sourceDB, 'users', userID, 'periodicTasks');
        const templatesSnapshot = await getDocs(query(templatesRef));
        const batch = writeBatch(destinationDB);
        templatesSnapshot.forEach((templateDoc) => {
            if (!templateDoc.data().name) return;

            const newDocRef = doc(collection(destinationDB, 'users', userID, 'templates'), templateDoc.id);
            const newTemplate = {
                name: templateDoc.data().name,
                orderValue: templateDoc.data().orderValue || 0,
                lastGeneratedTask: templateDoc.data().lastGeneratedTask || '',
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

const checkTaskCount = async (userID) => {
    const tasksColl = await (collection(sourceDB, 'users', userID, 'tasks'))
    const snapshot = await getCountFromServer(tasksColl);
    console.log('count: ', snapshot.data().count);
}

const migrateTasks = async (userID) => {
    try {
        const tasks = await getDocs(query(collection(sourceDB, 'users', userID, 'tasks')))
        console.log(tasks.size);
        const batch = writeBatch(destinationDB);
        tasks.forEach((taskDoc) => {
            const newDocRef = doc(collection(destinationDB, 'users', userID, 'tasks'), taskDoc.id);
            if (!taskDoc.data().name) return;
            const newTask = {
                name: taskDoc.data().name,
                orderValue: parseInt(taskDoc.data().orderValue) || 0,
                parentID: taskDoc.data().parentID || '',
                duration: parseInt(taskDoc.data().duration) || 0,
                startDateISO: taskDoc.data().startDateISO || '',
                startTime: taskDoc.data().startTime || '',
                notify: taskDoc.data().notify || '',
                timeZone: taskDoc.data().timeZone || 'Asia/Tokyo',
                templateID: taskDoc.data().templateID || taskDoc.data().periodicTaskId || taskDoc.data().reusableTemplateID || '',
                iconURL: taskDoc.data().iconURL || taskDoc.data().iconUrl || '',
                notes: taskDoc.data().notes || '',
                isDone: taskDoc.data().isDone || false,
                imageDownloadURL: taskDoc.data().imageDownloadURL || '',
                imageFullPath: taskDoc.data().imageFullPath || '',
                tags: taskDoc.data().tags || ''
            };
            Joi.attempt(newTask, TaskSchema, "Error in task: " + taskDoc.id,);
            batch.set(newDocRef, newTask);
        });
        await batch.commit();
        console.log(`Successfully updated tasks`);
    } catch (error) {
        console.error('Error updating tasks:', error);
        throw error;
    }
}

async function migrateIconsCollection() {
    const iconsRef = collection(sourceDB, 'icons')
    const iconsSnapshot = await getDocs(iconsRef)
    const iconsDestRef = collection(destinationDB, 'icons')
    const batch = writeBatch(destinationDB)
    iconsSnapshot.forEach((iconDoc) => {
        const newIcon = {
            url: iconDoc.data().url,
            name: iconDoc.data().name,
            isShareable: iconDoc.data().isShareable,
            createdBy: iconDoc.data().createdBy,
            tags: iconDoc.data().tags || "",
        }
        Joi.attempt(newIcon, IconSchema);
        const newDocRef = doc(iconsDestRef, iconDoc.id)
        batch.set(newDocRef, newIcon)
    })
    await batch.commit()
}

// '46OCRjQornhVCBmt0uz7ITASqOP2';
//  '6uIcMMsBEkQ85OINCDADtrygzZx1';
// 'FrMRSz5BwTXGjcAevXGCBVBn26J3';
// 'yGVJSutBrnS1156uopQQOBuwpMl2';

// only once
// migrateIconsCollection()

// one at a time, doesnt auto cancel, so have to quit manually 
// migrateUser('FrMRSz5BwTXGjcAevXGCBVBn26J3')
// migrateTemplates('FrMRSz5BwTXGjcAevXGCBVBn26J3')
// checkTaskCount('FrMRSz5BwTXGjcAevXGCBVBn26J3')
// migrateTasks('FrMRSz5BwTXGjcAevXGCBVBn26J3')

// const tasks = await getDocs(query(collection(db, 'users', userID, 'tasks')))

