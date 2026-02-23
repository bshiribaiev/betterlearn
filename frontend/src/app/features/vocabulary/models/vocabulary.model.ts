export interface Word {
  id: number;
  word: string;
  definition: string;
  nextReview: string;
  intervalDays: number;
  easinessFactor: number;
  repetition: number;
  status: 'new' | 'learning' | 'review' | 'mastered';
}

export interface WordCreate {
  word: string;
  definition: string;
}

export interface ReviewEntry {
  id: number;
  quality: number;
  reviewedAt: string;
}
