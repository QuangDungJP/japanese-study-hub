export type Language = 'japanese';
export type Skill = 'reading' | 'speaking' | 'writing' | 'listening';
export type Level = 'beginner' | 'intermediate' | 'advanced';

export interface Lesson {
  id: string;
  title: string;
  titleVi: string;
  language: Language;
  skill: Skill;
  level: Level;
  duration: number; // in minutes
  xp: number;
  completed: boolean;
  progress: number;
}

export interface Vocabulary {
  id: string;
  word: string;
  meaning: string;
  pronunciation: string;
  example: string;
  exampleVi: string;
  language: Language;
  mastered: boolean;
}

export interface UserProgress {
  totalXp: number;
  streak: number;
  lessonsCompleted: number;
  vocabularyMastered: number;
  dailyGoal: number;
  dailyProgress: number;
}
