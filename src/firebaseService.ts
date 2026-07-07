import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  writeBatch, 
  getDocFromServer 
} from 'firebase/firestore';
import { db } from './firebase';
import { StudyEntry, TestEntry, ChapterStatus, RevisionTask } from './types';

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
const entriesRef = (userId: string) => collection(db, 'users', userId, 'entries');
const testsRef = (userId: string) => collection(db, 'users', userId, 'tests');
const statusesRef = (userId: string) => collection(db, 'users', userId, 'chapterStatuses');
const revisionsRef = (userId: string) => collection(db, 'users', userId, 'revisions');

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
    entriesSnap.forEach(doc => {
      entries.push({ id: doc.id, ...doc.data() } as StudyEntry);
    });

    const tests: TestEntry[] = [];
    testsSnap.forEach(doc => {
      tests.push({ id: doc.id, ...doc.data() } as TestEntry);
    });

    const chapterStatuses: ChapterStatus[] = [];
    statusesSnap.forEach(doc => {
      // Document ID might be formatted differently or matches chapterName
      chapterStatuses.push(doc.data() as ChapterStatus);
    });

    const revisions: RevisionTask[] = [];
    revisionsSnap.forEach(doc => {
      revisions.push({ id: doc.id, ...doc.data() } as RevisionTask);
    });

    return { entries, tests, chapterStatuses, revisions };
  } catch (error) {
    console.error("Error fetching user data from Firestore:", error);
    throw error;
  }
}

/**
 * Sync entire local data to cloud in a batch
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
    const batch = writeBatch(db);

    // 1. Sync entries
    localData.entries.forEach(entry => {
      const docRef = doc(db, 'users', userId, 'entries', entry.id);
      batch.set(docRef, entry, { merge: true });
    });

    // 2. Sync tests
    localData.tests.forEach(test => {
      const docRef = doc(db, 'users', userId, 'tests', test.id);
      batch.set(docRef, test, { merge: true });
    });

    // 3. Sync chapterStatuses
    localData.chapterStatuses.forEach(status => {
      // We use a safe doc name (e.g. alphanumeric chapter name representation)
      const safeId = encodeURIComponent(status.chapterName);
      const docRef = doc(db, 'users', userId, 'chapterStatuses', safeId);
      batch.set(docRef, status, { merge: true });
    });

    // 4. Sync revisions
    localData.revisions.forEach(rev => {
      const docRef = doc(db, 'users', userId, 'revisions', rev.id);
      batch.set(docRef, rev, { merge: true });
    });

    await batch.commit();
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
  await setDoc(docRef, entry);
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
  await setDoc(docRef, test);
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
  await setDoc(docRef, status);
}

/**
 * Save single RevisionTask
 */
export async function saveRevisionTaskCloud(userId: string, rev: RevisionTask) {
  const docRef = doc(db, 'users', userId, 'revisions', rev.id);
  await setDoc(docRef, rev);
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

