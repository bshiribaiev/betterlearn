export interface Word {
  id: number;
  topicId: number;
  word: string;
  definition: string | null;
  nextReview: string;
  intervalDays: number;
  easinessFactor: number;
  repetition: number;
  status: 'new' | 'learning' | 'review' | 'mastered';
  createdAt: string;
}

export interface WordGroup {
  addedDate: string;
  label: string | null;
  totalCount: number;
  dueCount: number;
  words: Word[];
}

export interface WordCreate {
  word: string;
}

export interface ReviewEntry {
  id: number;
  quality: number;
  reviewedAt: string;
}
