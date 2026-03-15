export interface QuizTopic {
  id: number;
  name: string;
  nextReview: string;
  intervalDays: number;
  easinessFactor: number;
  repetition: number;
  status: 'new' | 'learning' | 'review' | 'mastered';
  totalReviews: number;
  earliestDueDate: string | null;
  textbookName: string | null;
  textbookUrl: string | null;
}

export interface QuizConcept {
  id: number;
  topicId: number;
  topicName: string;
  name: string;
  content: string | null;
  terms: string | null;
  lastReviewed: string | null;
  nextReview: string;
  intervalDays: number;
  easinessFactor: number;
  repetition: number;
  status: 'new' | 'learning' | 'review' | 'mastered';
  totalReviews: number;
  pdfFilename: string | null;
  hasCachedQuestions: boolean;
  questionCount: number;
}

export interface FlashcardTerm {
  term: string;
  definition: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizSession {
  id: number;
  totalQuestions: number;
  correctAnswers: number;
  quality: number;
  takenAt: string;
  nextReview: string | null;
}
