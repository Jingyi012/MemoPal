export type PegNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type NumberPegItem = {
  id: string;
  number: PegNumber;
  keyword: string;
  image: string;
  description: string;
};

export type NumberPegBinding = {
  id: string;
  userId: string;
  itemId: string;
  targetText: string;
  pegNumber: PegNumber;
  createdAt: string;
  updatedAt: string;
};

export type NumberPegPracticeMode = 'spelling' | 'shopping' | 'custom';

export type NumberPegPracticeSession = {
  id: string;
  userId: string;
  mode: NumberPegPracticeMode;
  items: string[];
  score: number;
  completedAt: string;
};
