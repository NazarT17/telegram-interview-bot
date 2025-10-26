import { CommandContext, Context } from "grammy";
import dataService from "../services/dataService";
import { MockInterviewState, QuestionResult } from "../types";

const interviewSessions = new Map<number, MockInterviewState>();
const QUESTION_TIME_LIMIT = 120; // 2 minutes per question in seconds

export async function mockInterviewCommand(ctx: CommandContext<Context>) {
  const userId = ctx.from?.id;
  if (!userId) return;

  // Get topic from command argument
  const commandText = ctx.message?.text || "";
  const topicName = commandText.split(" ")[1]?.toLowerCase();

  if (!topicName) {
    return ctx.reply(
      "❌ Please specify a topic.\n" +
        "Usage: /mockinterview <topic>\n" +
        "Example: /mockinterview typescript\n\n" +
        "Use /topics to see available topics."
    );
  }

  const questions = dataService.getQuestionsByTopic(topicName);

  if (!questions || questions.length === 0) {
    return ctx.reply(
      `❌ No questions found for topic: ${topicName}\n\n` +
        "Use /topics to see available topics."
    );
  }

  // Shuffle and take first 5 questions
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  const selectedQuestions = shuffled.slice(0, Math.min(5, shuffled.length));

  interviewSessions.set(userId, {
    userId,
    topicName,
    currentQuestionIndex: 0,
    questions: selectedQuestions,
    results: [],
    startTime: Date.now(),
    questionStartTime: Date.now(),
    timeLimit: QUESTION_TIME_LIMIT,
  });

  await ctx.reply(
    `🎯 Mock Interview Started!\n\n` +
      `📚 Topic: ${topicName.toUpperCase()}\n` +
      `📝 Questions: ${selectedQuestions.length}\n` +
      `⏱️ Time limit: ${QUESTION_TIME_LIMIT} seconds per question\n\n` +
      `Type your answer to each question.\n` +
      `Type "skip" to skip a question.\n\n` +
      `Let's begin! 🚀`
  );

  await showCurrentQuestion(ctx, userId);
}

export async function handleInterviewResponse(ctx: Context) {
  const userId = ctx.from?.id;
  if (!userId) return;

  const session = interviewSessions.get(userId);
  if (!session) return; // Not in an interview

  const userAnswer = ctx.message?.text?.trim();
  if (!userAnswer) return;

  const currentQuestion = session.questions[session.currentQuestionIndex];
  const timeTaken = Math.floor((Date.now() - session.questionStartTime) / 1000);

  // Check if time limit exceeded
  if (timeTaken > session.timeLimit) {
    session.results.push({
      question: currentQuestion,
      userAnswer: "TIME OUT",
      isCorrect: false,
      timeTaken: session.timeLimit,
    });

    await ctx.reply(
      `⏰ Time's up! (${session.timeLimit}s exceeded)\n\n` +
        `✅ Correct answer:\n${currentQuestion.answer}`
    );
  } else if (userAnswer.toLowerCase() === "skip") {
    session.results.push({
      question: currentQuestion,
      userAnswer: "SKIPPED",
      isCorrect: false,
      timeTaken,
    });

    await ctx.reply(
      `⏭️ Question skipped.\n\n` +
        `✅ Correct answer:\n${currentQuestion.answer}`
    );
  } else {
    // Simple correctness check (contains key points)
    const isCorrect = checkAnswer(userAnswer, currentQuestion.answer);

    session.results.push({
      question: currentQuestion,
      userAnswer,
      isCorrect,
      timeTaken,
    });

    if (isCorrect) {
      await ctx.reply(
        `✅ Good answer! (${timeTaken}s)\n\n` +
          `📖 Reference answer:\n${currentQuestion.answer}`
      );
    } else {
      await ctx.reply(
        `❌ Not quite right. (${timeTaken}s)\n\n` +
          `✅ Correct answer:\n${currentQuestion.answer}`
      );
    }
  }

  // Move to next question
  session.currentQuestionIndex++;

  if (session.currentQuestionIndex >= session.questions.length) {
    await showTestResults(ctx, session);
    interviewSessions.delete(userId);
  } else {
    session.questionStartTime = Date.now();
    await ctx.reply("---\n\nNext question:");
    await showCurrentQuestion(ctx, userId);
  }
}

async function showCurrentQuestion(ctx: Context, userId: number) {
  const session = interviewSessions.get(userId);
  if (!session) return;

  const question = session.questions[session.currentQuestionIndex];
  const progress = `Question ${session.currentQuestionIndex + 1}/${
    session.questions.length
  }`;

  const difficultyEmoji = {
    easy: "🟢",
    medium: "🟡",
    hard: "🔴",
  };

  await ctx.reply(
    `${progress}\n` +
      `${
        difficultyEmoji[question.difficulty]
      } ${question.difficulty.toUpperCase()}\n` +
      `⏱️ Time limit: ${session.timeLimit}s\n\n` +
      `❓ ${question.question}\n\n` +
      `---\nType your answer below or "skip" to skip.`
  );
}

async function showTestResults(ctx: Context, session: MockInterviewState) {
  const totalQuestions = session.results.length;
  const correctAnswers = session.results.filter((r) => r.isCorrect).length;
  const percentage = Math.round((correctAnswers / totalQuestions) * 100);
  const totalTime = Math.floor((Date.now() - session.startTime) / 1000);

  // Calculate by difficulty
  const byDifficulty = {
    easy: { correct: 0, total: 0 },
    medium: { correct: 0, total: 0 },
    hard: { correct: 0, total: 0 },
  };

  session.results.forEach((result) => {
    const diff = result.question.difficulty;
    byDifficulty[diff].total++;
    if (result.isCorrect) {
      byDifficulty[diff].correct++;
    }
  });

  let resultMessage =
    `\n🎉 TEST COMPLETED! 🎉\n\n` +
    `📊 OVERALL SCORE\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `✅ Correct: ${correctAnswers}/${totalQuestions}\n` +
    `📈 Score: ${percentage}%\n` +
    `⏱️ Total time: ${Math.floor(totalTime / 60)}m ${totalTime % 60}s\n\n` +
    `📚 BY DIFFICULTY\n` +
    `━━━━━━━━━━━━━━━━━━\n`;

  Object.entries(byDifficulty).forEach(([level, stats]) => {
    if (stats.total > 0) {
      const emoji = level === "easy" ? "🟢" : level === "medium" ? "🟡" : "🔴";
      const percent = Math.round((stats.correct / stats.total) * 100);
      resultMessage += `${emoji} ${level.toUpperCase()}: ${stats.correct}/${
        stats.total
      } (${percent}%)\n`;
    }
  });

  resultMessage += `\n📝 DETAILED RESULTS\n━━━━━━━━━━━━━━━━━━\n`;

  session.results.forEach((result, index) => {
    const emoji = result.isCorrect ? "✅" : "❌";
    const status =
      result.userAnswer === "SKIPPED"
        ? "⏭️ SKIPPED"
        : result.userAnswer === "TIME OUT"
        ? "⏰ TIME OUT"
        : result.isCorrect
        ? "Correct"
        : "Incorrect";

    resultMessage +=
      `\n${index + 1}. ${emoji} ${status} (${result.timeTaken}s)\n` +
      `   ${result.question.question.substring(0, 60)}${
        result.question.question.length > 60 ? "..." : ""
      }\n`;
  });

  resultMessage += `\n━━━━━━━━━━━━━━━━━━\n`;

  // Performance message
  if (percentage >= 80) {
    resultMessage += `\n🏆 Excellent work! You're doing great!`;
  } else if (percentage >= 60) {
    resultMessage += `\n👍 Good job! Keep practicing!`;
  } else {
    resultMessage += `\n💪 Keep learning! Practice makes perfect!`;
  }

  resultMessage += `\n\nStart a new interview with /mockinterview <topic>`;

  await ctx.reply(resultMessage);
}

function checkAnswer(userAnswer: string, correctAnswer: string): boolean {
  const userLower = userAnswer.toLowerCase();
  const correctLower = correctAnswer.toLowerCase();

  // Extract key words from correct answer (words longer than 4 chars)
  const keyWords = correctLower
    .split(/\W+/)
    .filter((word) => word.length > 4)
    .slice(0, 5); // Top 5 key words

  // Check if user answer contains at least 40% of key words
  const matchedWords = keyWords.filter((word) => userLower.includes(word));
  return matchedWords.length >= Math.ceil(keyWords.length * 0.4);
}
