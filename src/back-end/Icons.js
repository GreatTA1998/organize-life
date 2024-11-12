import { collection, getDocs, query, where, or, deleteDoc, doc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "./firestoreConnection";
import {
    getStorage,
    ref,
    getDownloadURL,
    uploadString,
    deleteObject
} from "firebase/storage";
import IconSchema from "./Schemas/IconSchema.js";
async function getAvailable(uid) {
    const q = query(
        collection(db, "icons"),
        or(
            where("isShareable", "==", true),
            where("createdBy", "==", uid)
        )
    );
    const querySnapshot = await getDocs(q).catch((err) => console.error("error in getAvailableIcons", err));
    return querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
}

async function uploadIconDataURL(iconObject) {
    const url = await storeIconToBucket(iconObject.id, iconObject.dataURL);
    delete iconObject.dataURL;
    Joi.assert({...iconObject, url}, IconSchema);
    return setDoc(doc(db, "icons", iconObject.id), {
        ...iconObject,
        url,
    }).then(() => ({ ...iconObject, url }));
}

async function deleteRecursively({ id, uid, url }) {
    const storage = getStorage();
    const iconRef = ref(storage, `icons/${id}.png`);
    await deleteObject(iconRef);
    await deleteDoc(doc(db, "icons", id));
    deleteIconsFromTemplates({ uid, url });
    deleteIconsFromTasks({ uid, url });
    return true;
}


function storeIconToBucket(id, icon) {
    const storage = getStorage();
    const iconRef = ref(storage, `icons/${id}.png`);
    return uploadString(iconRef, icon, "data_url").then((snapshot) =>
        getDownloadURL(snapshot.ref)
    ).catch((err) => console.error("error in storeIconToBucket", err));
}

async function deleteIconsFromTemplates({ uid, url }) {
    const templateRef = collection(db, 'users', uid, "templates");
    const q = query(templateRef, where("iconURL", "==", url));  
    const templates = await getDocs(q);
    if (!templates.length) return;
    for (const template of templates) {
        updateDoc(template, {
            iconURL: "",
        });
    }
}
async function deleteIconsFromTasks({ uid, url }) {
    const tasksRef = collection(db, 'users', uid, "tasks");
    const q = query(tasksRef, where("iconURL", "==", url));
    const tasks = await getDocs(q);
    if (!tasks.length) return;
    for (const task of tasks) {
        updateDoc(task, {
            iconURL: "",
        });
    }
}

export default { uploadIconDataURL, getAvailable, deleteRecursively };