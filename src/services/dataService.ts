import { Topic, Question } from "../types";
import playwrightData from "../data/playwright.json";
import typescriptData from "../data/typescript.json";
import qaData from "../data/qa.json";

class DataService {
  private topics: Map<string, Topic>;

  constructor() {
    this.topics = new Map();
    this.loadTopics();
  }

  private loadTopics(): void {
    this.topics.set("playwright", playwrightData as Topic);
    this.topics.set("typescript", typescriptData as Topic);
    this.topics.set("qa", qaData as Topic);
  }

  getTopics(): Topic[] {
    return Array.from(this.topics.values());
  }

  getTopic(topicName: string): Topic | undefined {
    return this.topics.get(topicName.toLowerCase());
  }

  getAllTopicNames(): string[] {
    return Array.from(this.topics.keys());
  }

  getRandomQuestion(topicName: string): Question | null {
    const topic = this.getTopic(topicName);
    if (!topic || topic.questions.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * topic.questions.length);
    return topic.questions[randomIndex];
  }

  getRandomQuestions(count: number): Question[] {
    const allQuestions: Question[] = [];

    this.topics.forEach((topic) => {
      allQuestions.push(...topic.questions);
    });

    const shuffled = allQuestions.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  getQuestionsByDifficulty(difficulty: "easy" | "medium" | "hard"): Question[] {
    const questions: Question[] = [];

    this.topics.forEach((topic) => {
      const filtered = topic.questions.filter(
        (q) => q.difficulty === difficulty
      );
      questions.push(...filtered);
    });

    return questions;
  }
}

export default new DataService();
