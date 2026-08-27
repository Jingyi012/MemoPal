/** Pegs are intentionally numeric so the library can grow from the starter ten to 1–100. */
export type PegNumber = number;

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
