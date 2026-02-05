import {
    collection,
    doc,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp,
    DocumentData
} from 'firebase/firestore';
import { db } from './firebase';

// Helper to get a reference to a user's subcollection
export const getUserSubcollection = (uid: string, subcollectionName: string) => {
    if (!db) throw new Error("Firestore not initialized");
    return collection(db, 'users', uid, subcollectionName);
};

// Example: Add a new client/patient to the user's isolated list
export const addUserPatient = async (uid: string, patientData: any) => {
    const patientsRef = getUserSubcollection(uid, 'patients');
    return await addDoc(patientsRef, {
        ...patientData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
};

// Example: Get user's scribe history
export const getUserHistory = async (uid: string) => {
    const historyRef = getUserSubcollection(uid, 'history');
    const q = query(historyRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Example: Get user specific settings/client_data
export const getUserClientData = async (uid: string) => {
    const clientDataRef = getUserSubcollection(uid, 'client_data');
    const snapshot = await getDocs(clientDataRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
