/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type NEETSubject = 'Physics' | 'Chemistry' | 'Biology';

export type StudyType =
  | 'Class'
  | 'Self Study'
  | 'Revision'
  | 'PYQ'
  | 'MCQ Practice'
  | 'Test Analysis';

export type ConfidenceLevel = 'High' | 'Medium' | 'Low';

export type ChapterStatusType =
  | 'Not Started'
  | 'Studying'
  | 'Completed'
  | 'Revision 1'
  | 'Revision 2'
  | 'Revision 3'
  | 'Revision 4'
  | 'Mastered';

export type PriorityLevel = 'High' | 'Medium' | 'Low';

export interface StudyEntry {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  durationMinutes: number;
  subject: NEETSubject;
  chapter: string;
  topic: string;
  studyType: StudyType;
  mcqsSolved: number;
  mcqsCorrect: number;
  mcqsWrong: number;
  accuracy: number; // 0 to 100
  confidenceLevel: ConfidenceLevel;
  notes: string;
}

export interface TestEntry {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  marks: number;
  outOf: number;
  accuracy: number; // calculated as percentage
  wrongChapters: string[];
  weakChapters: string[];
}

export interface ChapterStatus {
  chapterName: string;
  subject: NEETSubject;
  status: ChapterStatusType;
  lastStudiedDate: string | null;
  nextRevisionDate: string | null;
  averageAccuracy: number;
  totalHours: number;
  totalMcqs: number;
  confidenceTrend: ConfidenceLevel[];
}

export interface RevisionTask {
  id: string;
  chapterName: string;
  subject: NEETSubject;
  stage: number; // 1 to 7 corresponding to the revision levels
  dueDate: string; // YYYY-MM-DD
  priority: PriorityLevel;
  completed: boolean;
  completedDate: string | null;
  accuracyAtRevision: number | null;
  subtopics?: string;
}
