import { sourceDB, destinationDB } from "../firestoreConnection.js";
import {
    getDoc,
    doc,
    getDocs,
    collection,
    query,
    setDoc,
    where,
    writeBatch,
} from "firebase/firestore";
import {
    getStorage,
    ref,
    getDownloadURL,
} from "firebase/storage";


async function migrateUser(userID) {
    const sourceUserRef = doc(sourceDB, "users", userID);
    const destinationUserRef = doc(destinationDB, "users", userID);

    // Migrate main user document
    const sourceUserSnapshot = await getDoc(sourceUserRef);
    await setDoc(destinationUserRef, sourceUserSnapshot.data());
    const batch = writeBatch(destinationDB);

    const knownSubcollections = ["tasks", "templates"]

    // Migrate each subcollection
    for (const subcollectionName of knownSubcollections) {
        const sourceSubcollectionRef = collection(sourceUserRef, subcollectionName);
        const destinationSubcollectionRef = collection(destinationUserRef, subcollectionName);

        const querySnapshot = await getDocs(sourceSubcollectionRef);

        if (!querySnapshot.empty) {
            for (const docSnapshot of querySnapshot.docs) {
                await batch.set(
                    doc(destinationSubcollectionRef, docSnapshot.id), docSnapshot.data());
            }
            console.log(`Migrated subcollection: ${subcollectionName}`);
        }
    }
    await batch.commit();
    console.log(`User ${userID} migration completed`);
    return true;
}


migrateUser("6uIcMMsBEkQ85OINCDADtrygzZx1");