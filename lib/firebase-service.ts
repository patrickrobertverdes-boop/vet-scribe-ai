import { db, storage, isFirebaseConfigured } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject, uploadString } from 'firebase/storage';
import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    setDoc,
    Timestamp,
    deleteDoc,
    limit,
    startAfter,
    getCountFromServer,
    collectionGroup,
    Firestore
} from 'firebase/firestore';
import { Patient, Consultation, Message, Conversation, PatientDocument, Appointment, ChecklistItem } from './types';

// Helper to ensure db is configured before calling Firestore methods
const getFirestoreDb = (): Firestore => {
    if (!isFirebaseConfigured || !db) {
        throw new Error("Firebase is not configured. Please add your credentials to .env.local");
    }
    return db;
};

/**
 * FIREBASE SERVICE - STRICT USER SCOPING
 * All queries are scoped to: users/{auth.uid}/...
 * No root-level collection access to prevent permission errors.
 */
export const firebaseService = {

    // --- PATIENTS ---
    // Path: users/{uid}/patients
    getPatients: async (uid: string, lastDoc?: any): Promise<Patient[]> => {
        try {
            const col = collection(getFirestoreDb(), 'users', uid, 'patients');
            let q = query(col, limit(100));
            if (lastDoc) q = query(q, startAfter(lastDoc));

            const snap = await getDocs(q);
            // Filter out placeholder documents
            return snap.docs
                .filter(d => !d.id.startsWith('_') && !d.data().placeholder)
                .map(d => ({ ...d.data(), id: d.id } as Patient));
        } catch (e) {
            console.error("[Patients] Fetch error:", e);
            return [];
        }
    },

    subscribeToPatients: (uid: string, callback: (patients: Patient[]) => void) => {
        const col = collection(getFirestoreDb(), 'users', uid, 'patients');
        return onSnapshot(query(col, limit(100)), (snap) => {
            // Filter out placeholder documents
            const patients = snap.docs
                .filter(d => !d.id.startsWith('_') && !d.data().placeholder)
                .map(d => ({ ...d.data(), id: d.id } as Patient));
            callback(patients);
        }, (err) => {
            console.error("[Patients] Subscription error:", err);
            callback([]);
        });
    },

    subscribeToPatient: (uid: string, id: string, callback: (patient: Patient | undefined) => void) => {
        const docRef = doc(getFirestoreDb(), 'users', uid, 'patients', id);
        return onSnapshot(docRef, (snap) => {
            if (snap.exists()) {
                callback({ ...snap.data(), id: snap.id } as Patient);
            } else {
                callback(undefined);
            }
        }, (err) => {
            console.error("[Patient] Subscription error:", err);
            callback(undefined);
        });
    },

    getPatient: async (uid: string, id: string): Promise<Patient | undefined> => {
        try {
            const docRef = doc(getFirestoreDb(), 'users', uid, 'patients', id);
            const snap = await getDoc(docRef);
            return snap.exists() ? { ...snap.data(), id: snap.id } as Patient : undefined;
        } catch (e) {
            console.error("[Patient] Get error:", e);
            return undefined;
        }
    },

    addPatient: async (uid: string, patient: Omit<Patient, 'id'>): Promise<Patient> => {
        const now = Timestamp.now();
        const data = { ...patient, createdAt: now, updatedAt: now };
        const docRef = await addDoc(collection(getFirestoreDb(), 'users', uid, 'patients'), data);
        return { ...data, id: docRef.id } as Patient;
    },

    createPatientMinimal: async (uid: string, minimal: { name: string, species: string, owner: string, prompt?: string }): Promise<Patient> => {
        const now = Timestamp.now();
        const full = {
            name: minimal.name,
            species: minimal.species as any,
            owner: minimal.owner,
            lastVisit: new Date().toISOString().split('T')[0],
            status: 'Active' as const,
            createdAt: now,
            aiStatus: 'processing' as const,
            breed: 'Pending AI...',
            age: 0, age_months: 0, weight: 0, image: '',
            allergies: [], medications: [], historySummary: '',
            aiPrompt: minimal.prompt || ''
        };
        const docRef = await addDoc(collection(getFirestoreDb(), 'users', uid, 'patients'), full);
        return { ...full, id: docRef.id } as Patient;
    },

    updatePatientWithAIProfile: async (uid: string, id: string, aiData: any) => {
        const docRef = doc(getFirestoreDb(), 'users', uid, 'patients', id);
        await updateDoc(docRef, { ...aiData, aiStatus: 'complete', aiGeneratedAt: new Date().toISOString() });
    },

    markAIProfileFailed: async (uid: string, id: string, err?: string) => {
        await updateDoc(doc(getFirestoreDb(), 'users', uid, 'patients', id), { aiStatus: 'failed', aiError: err });
    },

    updatePatient: async (uid: string, id: string, data: Partial<Patient>) => {
        // Filter out undefined values to prevent Firestore errors
        const cleanData = Object.fromEntries(
            Object.entries(data).filter(([_, v]) => v !== undefined)
        );
        if (Object.keys(cleanData).length > 0) {
            await updateDoc(doc(getFirestoreDb(), 'users', uid, 'patients', id), { ...cleanData, updatedAt: Timestamp.now() });
        }
    },

    // --- CONSULTATIONS ---
    // Path: users/{uid}/consultations
    getConsultations: async (uid: string, patientId?: string, lastDoc?: any): Promise<{ consultations: Consultation[], lastDoc: any }> => {
        try {
            const col = collection(getFirestoreDb(), 'users', uid, 'consultations');
            let q = patientId ? query(col, where('patientId', '==', patientId), limit(50)) : query(col, limit(50));
            if (lastDoc) q = query(q, startAfter(lastDoc));
            const snap = await getDocs(q);
            const data = snap.docs.map(d => ({ ...d.data(), id: d.id } as Consultation));
            return { consultations: data.sort((a, b) => b.date.localeCompare(a.date)), lastDoc: snap.docs[snap.docs.length - 1] };
        } catch (e) {
            console.error("[Consultations] Fetch error:", e);
            return { consultations: [], lastDoc: null };
        }
    },

    subscribeToConsultations: (uid: string, callback: (consultations: Consultation[]) => void, patientId?: string) => {
        const col = collection(getFirestoreDb(), 'users', uid, 'consultations');
        let q = patientId ? query(col, where('patientId', '==', patientId), limit(50)) : query(col, limit(50));

        return onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ ...d.data(), id: d.id } as Consultation));
            callback(data.sort((a, b) => b.date.localeCompare(a.date)));
        }, (err) => {
            console.error("[Consultations] Subscription error:", err);
            callback([]);
        });
    },

    createConsultation: async (uid: string, patientId: string, data: Omit<Consultation, 'id' | 'patientId'>): Promise<Consultation> => {
        const full = { ...data, patientId, createdAt: Timestamp.now() };
        const docRef = await addDoc(collection(getFirestoreDb(), 'users', uid, 'consultations'), full);
        return { ...full, id: docRef.id } as Consultation;
    },

    updateConsultation: async (uid: string, consultationId: string, data: Partial<Consultation>) => {
        const docRef = doc(getFirestoreDb(), 'users', uid, 'consultations', consultationId);
        await updateDoc(docRef, { ...data, updatedAt: Timestamp.now() });
    },

    deleteConsultation: async (uid: string, consultationId: string) => {
        const docRef = doc(getFirestoreDb(), 'users', uid, 'consultations', consultationId);
        await deleteDoc(docRef);
    },

    // --- DOCUMENTS ---
    // Path: users/{uid}/patients/{patientId}/documents
    subscribeToDocuments: (uid: string, patientId: string, callback: (docs: PatientDocument[]) => void) => {
        const col = collection(getFirestoreDb(), 'users', uid, 'patients', patientId, 'documents');
        return onSnapshot(col, (snap) => {
            const docs = snap.docs.map(d => ({ ...d.data(), id: d.id } as PatientDocument));
            callback(docs.sort((a, b) => (b.uploadDate || '').localeCompare(a.uploadDate || '')));
        }, (err) => {
            console.error("[Documents] Subscription error:", err);
            callback([]);
        });
    },


    deleteDocument: async (uid: string, patientId: string, docId: string, url?: string) => {
        // Direct path delete - requires patientId
        const docRef = doc(getFirestoreDb(), 'users', uid, 'patients', patientId, 'documents', docId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            const data = snap.data();
            if (data.storagePath && storage) {
                await deleteObject(ref(storage, data.storagePath)).catch(console.warn);
            }
            await deleteDoc(docRef);
        }
    },

    updateDocument: async (uid: string, patientId: string, docId: string, data: Partial<PatientDocument>) => {
        const docRef = doc(getFirestoreDb(), 'users', uid, 'patients', patientId, 'documents', docId);
        // Filter out undefined values to prevent Firestore errors
        const cleanData = Object.fromEntries(
            Object.entries(data).filter(([_, v]) => v !== undefined)
        );
        if (Object.keys(cleanData).length > 0) {
            await updateDoc(docRef, cleanData);
        }
    },

    // --- APPOINTMENTS ---
    // Path: users/{uid}/appointments
    subscribeToAppointments: (uid: string, callback: (apts: Appointment[]) => void) => {
        const col = collection(getFirestoreDb(), 'users', uid, 'appointments');
        return onSnapshot(query(col, limit(100)), (snap) => {
            const data = snap.docs.map(d => ({ ...d.data(), id: d.id } as Appointment));
            callback(data.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)));
        }, (err) => {
            console.error("[Appointments] Subscription error:", err);
            callback([]);
        });
    },

    addAppointment: async (uid: string, apt: Omit<Appointment, 'id' | 'createdAt'>): Promise<Appointment> => {
        const data = { ...apt, createdAt: Timestamp.now() };
        const docRef = await addDoc(collection(getFirestoreDb(), 'users', uid, 'appointments'), data);
        return { ...data, id: docRef.id } as Appointment;
    },

    deleteAppointment: async (uid: string, id: string) => {
        await deleteDoc(doc(getFirestoreDb(), 'users', uid, 'appointments', id));
    },

    // Get a single consultation by ID
    getConsultation: async (uid: string, id: string): Promise<Consultation | undefined> => {
        try {
            const docRef = doc(getFirestoreDb(), 'users', uid, 'consultations', id);
            const snap = await getDoc(docRef);
            return snap.exists() ? { ...snap.data(), id: snap.id } as Consultation : undefined;
        } catch (e) {
            console.error("[Consultation] Get error:", e);
            return undefined;
        }
    },

    // --- PRACTICE STATS ---
    // Path: users/{uid}/patients & users/{uid}/consultations
    subscribeToPracticeStats: (uid: string, callback: (stats: { patients: number, consultations: number }) => void) => {
        const pCol = collection(getFirestoreDb(), 'users', uid, 'patients');
        const cCol = collection(getFirestoreDb(), 'users', uid, 'consultations');

        const update = async () => {
            try {
                const [p, c] = await Promise.all([getCountFromServer(pCol), getCountFromServer(cCol)]);
                callback({ patients: p.data().count, consultations: c.data().count });
            } catch (e) {
                console.error("[Stats] Aggregation error:", e);
                callback({ patients: 0, consultations: 0 });
            }
        };

        update();
        const unP = onSnapshot(query(pCol, limit(1)), update, () => { });
        const unC = onSnapshot(query(cCol, limit(1)), update, () => { });
        return () => { unP(); unC(); };
    },

    // --- MESSAGES ---
    // Path: users/{uid}/conversations & users/{uid}/messages
    subscribeToConversations: (uid: string, callback: (c: Conversation[]) => void) => {
        const col = collection(getFirestoreDb(), 'users', uid, 'conversations');
        return onSnapshot(query(col, limit(50)), (snap) => {
            callback(snap.docs.map(d => ({ ...d.data(), id: d.id } as Conversation)));
        }, (err) => {
            console.error("[Conversations] Subscription error:", err);
            callback([]);
        });
    },

    subscribeToMessages: (uid: string, convId: string, callback: (m: Message[]) => void) => {
        const col = collection(getFirestoreDb(), 'users', uid, 'messages');
        return onSnapshot(query(col, where('conversationId', '==', convId), limit(100)), (snap) => {
            callback(snap.docs.map(d => ({ ...d.data(), id: d.id } as Message)).sort((a, b) => a.timestamp - b.timestamp));
        }, (err) => {
            console.error("[Messages] Subscription error:", err);
            callback([]);
        });
    },

    sendMessage: async (uid: string, convId: string, text: string, sender: string = 'You') => {
        const msg = {
            conversationId: convId,
            sender,
            message: text,
            timestamp: Date.now(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        await addDoc(collection(getFirestoreDb(), 'users', uid, 'messages'), msg);
        await updateDoc(doc(getFirestoreDb(), 'users', uid, 'conversations', convId), {
            lastMessage: text,
            lastTime: 'Just now'
        });
    },

    // --- CHECKLIST ---
    // Path: users/{uid}/checklist
    subscribeToChecklist: (uid: string, callback: (items: ChecklistItem[]) => void) => {
        const col = collection(getFirestoreDb(), 'users', uid, 'checklist');
        return onSnapshot(query(col, orderBy('createdAt', 'desc'), limit(50)), (snap) => {
            const data = snap.docs.map(d => ({ ...d.data(), id: d.id } as ChecklistItem));
            callback(data);
        }, (err) => {
            console.error("[Checklist] Subscription error:", err);
            callback([]);
        });
    },

    addChecklistItem: async (uid: string, text: string): Promise<ChecklistItem> => {
        const data = {
            text,
            completed: false,
            createdAt: Timestamp.now()
        };
        const docRef = await addDoc(collection(getFirestoreDb(), 'users', uid, 'checklist'), data);
        return { ...data, id: docRef.id } as ChecklistItem;
    },

    toggleChecklistItem: async (uid: string, itemId: string, completed: boolean) => {
        const docRef = doc(getFirestoreDb(), 'users', uid, 'checklist', itemId);
        await updateDoc(docRef, { completed });
    },

    deleteChecklistItem: async (uid: string, itemId: string) => {
        const docRef = doc(getFirestoreDb(), 'users', uid, 'checklist', itemId);
        await deleteDoc(docRef);
    },

    // --- USER PROFILE ---
    // Path: users/{uid}/profile/config
    getUserProfile: async (uid: string): Promise<any> => {
        try {
            const docRef = doc(getFirestoreDb(), 'users', uid);
            const snap = await getDoc(docRef);
            return snap.exists() ? snap.data() : null;
        } catch (e) {
            console.error("[Profile] Get error:", e);
            return null;
        }
    },

    subscribeToUserProfile: (uid: string, callback: (profile: any) => void) => {
        const docRef = doc(getFirestoreDb(), 'users', uid);
        return onSnapshot(docRef, (snap) => {
            if (snap.exists()) callback(snap.data());
            else callback(null);
        }, (err) => {
            console.error("[Profile] Subscription error:", err);
            callback(null);
        });
    },

    updateUserProfile: async (uid: string, data: any) => {
        const docRef = doc(getFirestoreDb(), 'users', uid);
        await setDoc(docRef, { ...data, updatedAt: Timestamp.now() }, { merge: true });
    },

    uploadProfileImage: async (uid: string, file: Blob | Uint8Array | string) => {
        if (!storage) throw new Error("Storage not configured");

        const timestamp = Date.now();
        const path = `users/${uid}/profile/avatar_${timestamp}`;
        const storageRef = ref(storage, path);

        console.log(`[FirebaseService] Audit: Initiating profile upload for ${uid}`);
        console.log(`[FirebaseService] Path: ${path}`);

        try {
            let snapshot;
            if (typeof file === 'string') {
                console.log(`[FirebaseService] Upload Mode: base64String`);
                // Assume it might be a data URL or just raw base64
                const format = file.startsWith('data:') ? 'data_url' : 'base64';
                snapshot = await uploadString(storageRef, file, format);
            } else {
                console.log(`[FirebaseService] Upload Mode: binary (Blob/Uint8Array)`);
                console.log(`[FirebaseService] Size: ${file instanceof Blob ? file.size : file.byteLength} bytes`);
                snapshot = await uploadBytes(storageRef, file, {
                    contentType: 'image/jpeg',
                    customMetadata: {
                        uploadedBy: uid,
                        uploadTimestamp: timestamp.toString()
                    }
                });
            }

            console.log(`[FirebaseService] Upload Success:`, snapshot.metadata.fullPath);
            const url = await getDownloadURL(snapshot.ref);
            console.log(`[FirebaseService] Final URL: ${url}`);
            return url;
        } catch (error: any) {
            console.error(`[FirebaseService] FATAL: Upload failed for ${uid}`);
            console.error(`[FirebaseService] Error Code: ${error.code}`);
            console.error(`[FirebaseService] Error Message: ${error.message}`);
            if (error.serverResponse) {
                console.error(`[FirebaseService] Server Response:`, error.serverResponse);
            }
            throw error;
        }
    },

    uploadDocument: async (uid: string, patientId: string, file: File | Blob) => {
        if (!storage) throw new Error("Storage not configured");

        const timestamp = Date.now();
        const fileName = (file as File).name || `upload_${timestamp}`;
        const path = `users/${uid}/patients/${patientId}/documents/${timestamp}_${fileName}`;
        const storageRef = ref(storage, path);

        console.log(`[FirebaseService] Audit: Document upload for patient ${patientId}`);

        try {
            const snapshot = await uploadBytes(storageRef, file, {
                contentType: (file as Blob).type || 'application/octet-stream'
            });
            const url = await getDownloadURL(snapshot.ref);

            const docData = {
                patientId,
                name: fileName,
                url,
                type: (file as Blob).type?.includes('pdf') ? 'pdf' : 'image',
                size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
                uploadDate: new Date().toLocaleDateString(),
                storagePath: path
            };
            await addDoc(collection(getFirestoreDb(), 'users', uid, 'patients', patientId, 'documents'), docData);
            return docData;
        } catch (error: any) {
            console.error(`[FirebaseService] Document upload failed:`, error.message);
            throw error;
        }
    }
};
