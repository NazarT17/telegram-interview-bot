export interface Question {
  id: number;
  question: string;
  answer: string;
  options: string[]; // 3 short answer options
  correctOption: number; // Index of correct option (0, 1, or 2)
  difficulty: "easy" | "medium" | "hard";
  tags?: string[];
}

export interface Topic {
  name: string;
  description: string;
  questions: Question[];
}

export interface QuestionResult {
  question: Question;
  userAnswer: string;
  isCorrect: boolean;
  timeTaken: number; // in seconds
}

export interface MockInterviewState {
  userId: number;
  topicName: string;
  currentQuestionIndex: number;
  questions: Question[];
  results: QuestionResult[];
  startTime: number;
  questionStartTime: number;
  timeLimit: number; // seconds per question
}
