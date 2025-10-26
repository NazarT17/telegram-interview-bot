export interface Question {
  id: number;
  question: string;
  answer: string;
  difficulty: "easy" | "medium" | "hard";
  tags?: string[];
}

export interface Topic {
  name: string;
  description: string;
  questions: Question[];
}

export interface MockInterviewState {
  userId: number;
  currentQuestionIndex: number;
  questions: Question[];
  score: number;
  startTime: Date;
}
