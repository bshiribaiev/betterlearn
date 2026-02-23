export interface Problem {
  id: number;
  url: string;
  title: string;
  notes: string | null;
  firstAttempted: string;
  nextReview: string;
  intervalDays: number;
  easinessFactor: number;
  repetition: number;
  status: 'new' | 'learning' | 'review' | 'mastered';
}

export interface ProblemCreate {
  url: string;
  title?: string;
  notes?: string;
}

export interface ReviewEntry {
  id: number;
  quality: number;
  reviewedAt: string;
}
