export interface QuizTopic {
  id: number;
  name: string;
  nextReview: string;
  intervalDays: number;
  easinessFactor: number;
  repetition: number;
  status: 'new' | 'learning' | 'review' | 'mastered';
  totalReviews: number;
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
}
