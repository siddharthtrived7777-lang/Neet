import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  writeBatch, 
  getDocFromServer,
  onSnapshot 
} from 'firebase/firestore';
import { db } from './firebase';
import { StudyEntry, TestEntry, ChapterStatus, RevisionTask } from './types';

// Helper to remove any undefined properties so Firestore never throws unsupported field value error
function sanitizeForFirestore<T extends Record<string, any>>(obj: T): T {
  const clean: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = value;
    }
  }
  return clean;
}

// Validate connection on boot as requested by Firebase Integration Guidelines
export async function testFirebaseConnection() {
  try {
    // Attempt to fetch a dummy doc from server to verify connection
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase connection verified.');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration or internet connection. App is in offline mode.");
    } else {
      console.log("Firebase initialized in standard mode.");
    }
  }
}

// Subcollection references
export const entriesRef = (userId: string) => collection(db, 'users', userId, 'entries');
export const testsRef = (userId: string) => collection(db, 'users', userId, 'tests');
export const statusesRef = (userId: string) => collection(db, 'users', userId, 'chapterStatuses');
export const revisionsRef = (userId: string) => collection(db, 'users', userId, 'revisions');

/**
 * Fetch all study records, test tracker logs, custom chapter statuses, and revisions for a given user from Firestore
 */
export async function fetchUserData(userId: string) {
  try {
    const [entriesSnap, testsSnap, statusesSnap, revisionsSnap] = await Promise.all([
      getDocs(entriesRef(userId)),
      getDocs(testsRef(userId)),
      getDocs(statusesRef(userId)),
      getDocs(revisionsRef(userId))
    ]);

    const entries: StudyEntry[] = [];
    entriesSnap.forEach(docSnap => {
      entries.push({ id: docSnap.id, ...docSnap.data() } as StudyEntry);
    });

    const tests: TestEntry[] = [];
    testsSnap.forEach(docSnap => {
      tests.push({ id: docSnap.id, ...docSnap.data() } as TestEntry);
    });

    const chapterStatuses: ChapterStatus[] = [];
    statusesSnap.forEach(docSnap => {
      chapterStatuses.push(docSnap.data() as ChapterStatus);
    });

    const revisions: RevisionTask[] = [];
    revisionsSnap.forEach(docSnap => {
      revisions.push({ id: docSnap.id, ...docSnap.data() } as RevisionTask);
    });

    return { entries, tests, chapterStatuses, revisions };
  } catch (error) {
    console.error("Error fetching user data from Firestore:", error);
    throw error;
  }
}

/**
 * Real-time listener for active user data across multiple devices (Tablet <-> Mobile)
 */
export function subscribeToUserData(
  userId: string,
  callbacks: {
    onEntries?: (entries: StudyEntry[]) => void;
    onTests?: (tests: TestEntry[]) => void;
    onChapterStatuses?: (statuses: ChapterStatus[]) => void;
    onRevisions?: (revisions: RevisionTask[]) => void;
  }
) {
  const unsubs: (() => void)[] = [];

  if (callbacks.onEntries) {
    const unsub = onSnapshot(entriesRef(userId), (snap) => {
      const entries: StudyEntry[] = [];
      snap.forEach(docSnap => {
        entries.push({ id: docSnap.id, ...docSnap.data() } as StudyEntry);
      });
      callbacks.onEntries!(entries);
    }, (error) => {
      console.warn("Realtime entries listener:", error);
    });
    unsubs.push(unsub);
  }

  if (callbacks.onTests) {
    const unsub = onSnapshot(testsRef(userId), (snap) => {
      const tests: TestEntry[] = [];
      snap.forEach(docSnap => {
        tests.push({ id: docSnap.id, ...docSnap.data() } as TestEntry);
      });
      callbacks.onTests!(tests);
    }, (error) => {
      console.warn("Realtime tests listener:", error);
    });
    unsubs.push(unsub);
  }

  if (callbacks.onChapterStatuses) {
    const unsub = onSnapshot(statusesRef(userId), (snap) => {
      const statuses: ChapterStatus[] = [];
      snap.forEach(docSnap => {
        statuses.push(docSnap.data() as ChapterStatus);
      });
      callbacks.onChapterStatuses!(statuses);
    }, (error) => {
      console.warn("Realtime statuses listener:", error);
    });
    unsubs.push(unsub);
  }

  if (callbacks.onRevisions) {
    const unsub = onSnapshot(revisionsRef(userId), (snap) => {
      const revs: RevisionTask[] = [];
      snap.forEach(docSnap => {
        revs.push({ id: docSnap.id, ...docSnap.data() } as RevisionTask);
      });
      callbacks.onRevisions!(revs);
    }, (error) => {
      console.warn("Realtime revisions listener:", error);
    });
    unsubs.push(unsub);
  }

  return () => {
    unsubs.forEach(unsub => unsub());
  };
}

/**
 * Sync entire local data to cloud in chunks (preventing Firestore 500-operation batch limits)
 */
export async function syncLocalDataToCloud(
  userId: string,
  localData: {
    entries: StudyEntry[];
    tests: TestEntry[];
    chapterStatuses: ChapterStatus[];
    revisions: RevisionTask[];
  }
) {
  try {
    const operations: { ref: any; data: any }[] = [];

    // 1. Sync entries
    localData.entries.forEach(entry => {
      const docRef = doc(db, 'users', userId, 'entries', entry.id);
      operations.push({ ref: docRef, data: sanitizeForFirestore(entry) });
    });

    // 2. Sync tests
    localData.tests.forEach(test => {
      const docRef = doc(db, 'users', userId, 'tests', test.id);
      operations.push({ ref: docRef, data: sanitizeForFirestore(test) });
    });

    // 3. Sync chapterStatuses
    localData.chapterStatuses.forEach(status => {
      const safeId = encodeURIComponent(status.chapterName);
      const docRef = doc(db, 'users', userId, 'chapterStatuses', safeId);
      operations.push({ ref: docRef, data: sanitizeForFirestore(status) });
    });

    // 4. Sync revisions
    localData.revisions.forEach(rev => {
      const docRef = doc(db, 'users', userId, 'revisions', rev.id);
      operations.push({ ref: docRef, data: sanitizeForFirestore(rev) });
    });

    // Commit in chunks of 350 operations
    for (let i = 0; i < operations.length; i += 350) {
      const chunk = operations.slice(i, i + 350);
      const batch = writeBatch(db);
      chunk.forEach(op => {
        batch.set(op.ref, op.data, { merge: true });
      });
      await batch.commit();
    }

    console.log("Local data successfully batch-synced to Firestore!");
  } catch (error) {
    console.error("Error batch-syncing local data to Firestore:", error);
    throw error;
  }
}

/**
 * Save single StudyEntry
 */
export async function saveStudyEntryCloud(userId: string, entry: StudyEntry) {
  const docRef = doc(db, 'users', userId, 'entries', entry.id);
  await setDoc(docRef, sanitizeForFirestore(entry), { merge: true });
}

/**
 * Delete single StudyEntry
 */
export async function deleteStudyEntryCloud(userId: string, entryId: string) {
  const docRef = doc(db, 'users', userId, 'entries', entryId);
  await deleteDoc(docRef);
}

/**
 * Save single TestEntry
 */
export async function saveTestEntryCloud(userId: string, test: TestEntry) {
  const docRef = doc(db, 'users', userId, 'tests', test.id);
  await setDoc(docRef, sanitizeForFirestore(test), { merge: true });
}

/**
 * Delete single TestEntry
 */
export async function deleteTestEntryCloud(userId: string, testId: string) {
  const docRef = doc(db, 'users', userId, 'tests', testId);
  await deleteDoc(docRef);
}

/**
 * Save single ChapterStatus
 */
export async function saveChapterStatusCloud(userId: string, status: ChapterStatus) {
  const safeId = encodeURIComponent(status.chapterName);
  const docRef = doc(db, 'users', userId, 'chapterStatuses', safeId);
  await setDoc(docRef, sanitizeForFirestore(status), { merge: true });
}

/**
 * Save single RevisionTask
 */
export async function saveRevisionTaskCloud(userId: string, rev: RevisionTask) {
  const docRef = doc(db, 'users', userId, 'revisions', rev.id);
  await setDoc(docRef, sanitizeForFirestore(rev), { merge: true });
}

/**
 * Delete single RevisionTask
 */
export async function deleteRevisionTaskCloud(userId: string, revId: string) {
  const docRef = doc(db, 'users', userId, 'revisions', revId);
  await deleteDoc(docRef);
}

/**
 * Save user's exam date to Cloud Firestore
 */
export async function saveExamDateCloud(userId: string, examDate: string | null) {
  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, { examDate }, { merge: true });
    console.log("Exam date synced to Cloud successfully!");
  } catch (error) {
    console.error("Error saving exam date to cloud:", error);
  }
}

/**
 * Fetch user's exam date from Cloud Firestore
 */
export async function fetchExamDateCloud(userId: string): Promise<string | null> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data()?.examDate || null;
    }
    return null;
  } catch (error) {
    console.error("Error fetching exam date from cloud:", error);
    return null;
  }
}
