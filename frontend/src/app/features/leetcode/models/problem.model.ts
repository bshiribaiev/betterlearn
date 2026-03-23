export interface Problem {
  id: number;
  url: string;
  title: string;
  notes: string | null;
  firstAttempted: string;
  nextReview: string;
  lastReviewed: string;
  intervalDays: number;
  easinessFactor: number;
  repetition: number;
  status: 'new' | 'learning' | 'review' | 'mastered';
  confidence: 'none' | 'low' | 'average' | 'high';
  difficulty: 'easy' | 'medium' | 'hard' | null;
}

export interface ProblemCreate {
  url: string;
  title?: string;
  notes?: string;
  confidence?: string;
  difficulty?: string;
}

export interface ReviewEntry {
  id: number;
  quality: number;
  reviewedAt: string;
}
