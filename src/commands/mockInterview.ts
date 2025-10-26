import { CommandContext, Context, InlineKeyboard } from "grammy";
import dataService from "../services/dataService";
import { MockInterviewState, QuestionResult } from "../types";

const interviewSessions = new Map<number, MockInterviewState>();
const QUESTION_TIME_LIMIT = 120; // 2 minutes per question in seconds

export async function startMockInterview(ctx: Context, topicName: string) {
  const userId = ctx.from?.id;
  if (!userId) return;

  const questions = dataService.getQuestionsByTopic(topicName);

  if (!questions || questions.length === 0) {
    return ctx.reply(
      `❌ No questions found for topic: "${topicName}"\n\n` +
        `📚 Use /topics to see all available topics.`
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
    `🎯 MOCK INTERVIEW STARTED!\n\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `📚 Topic: ${topicName.toUpperCase()}\n` +
      `📝 Questions: ${selectedQuestions.length}\n` +
      `⏱️ Time limit: ${QUESTION_TIME_LIMIT} seconds per question\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `📌 Instructions:\n` +
      `  • Select the correct answer from 3 options\n` +
      `  • Each question has only 1 correct answer\n` +
      `  • Click the button to submit your choice\n\n` +
      `💡 Your answers will be scored automatically!\n\n` +
      `Ready? Let's go! 🚀`
  );

  await showCurrentQuestion(ctx, userId);
}

export async function mockInterviewCommand(ctx: CommandContext<Context>) {
  const userId = ctx.from?.id;
  if (!userId) return;

  // Get topic from command argument
  const commandText = ctx.message?.text || "";
  const topicName = commandText.split(" ")[1]?.toLowerCase();

  if (!topicName) {
    return ctx.reply(
      `⚠️ Please specify a topic!\n\n` +
        `📝 Usage: /mockinterview <topic>\n\n` +
        `💡 Example:\n` +
        `   /mockinterview typescript\n` +
        `   /mockinterview playwright\n` +
        `   /mockinterview qa\n\n` +
        `📚 Use /topics to see all available topics.`
    );
  }

  await startMockInterview(ctx, topicName);
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
      `⏰ TIME'S UP!\n\n` +
        `You exceeded the ${session.timeLimit}s time limit.\n\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `✅ CORRECT ANSWER:\n\n${currentQuestion.answer}\n` +
        `━━━━━━━━━━━━━━━━━━`
    );
  } else if (userAnswer.toLowerCase() === "skip") {
    session.results.push({
      question: currentQuestion,
      userAnswer: "SKIPPED",
      isCorrect: false,
      timeTaken,
    });

    await ctx.reply(
      `⏭️ QUESTION SKIPPED\n\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `✅ CORRECT ANSWER:\n\n${currentQuestion.answer}\n` +
        `━━━━━━━━━━━━━━━━━━`
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
      const encouragement = getEncouragement(true);
      await ctx.reply(
        `${encouragement} ⏱️ ${timeTaken}s\n\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `📖 REFERENCE ANSWER:\n\n${currentQuestion.answer}\n` +
          `━━━━━━━━━━━━━━━━━━`
      );
    } else {
      const encouragement = getEncouragement(false);
      await ctx.reply(
        `${encouragement} ⏱️ ${timeTaken}s\n\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `✅ CORRECT ANSWER:\n\n${currentQuestion.answer}\n` +
          `━━━━━━━━━━━━━━━━━━`
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
    await ctx.reply(`\n⬇️ NEXT QUESTION ⬇️\n`);
    await showCurrentQuestion(ctx, userId);
  }
}

function getEncouragement(isCorrect: boolean): string {
  const correct = [
    "✅ Excellent answer!",
    "✅ Great job!",
    "✅ Well done!",
    "✅ Perfect!",
    "✅ Spot on!",
    "✅ Nice work!",
  ];

  const incorrect = [
    "❌ Not quite, but good try!",
    "❌ Close, but not exactly!",
    "❌ Keep practicing!",
    "❌ Not quite right!",
    "❌ Almost there!",
  ];

  const messages = isCorrect ? correct : incorrect;
  return messages[Math.floor(Math.random() * messages.length)];
}

async function showCurrentQuestion(ctx: Context, userId: number) {
  const session = interviewSessions.get(userId);
  if (!session) return;

  const question = session.questions[session.currentQuestionIndex];
  const progress = session.currentQuestionIndex + 1;
  const total = session.questions.length;
  const progressBar = "█".repeat(progress) + "░".repeat(total - progress);

  const difficultyEmoji = {
    easy: "🟢",
    medium: "🟡",
    hard: "🔴",
  };

  // Display all options in the message
  let optionsText = "";
  question.options.forEach((option, index) => {
    const label = String.fromCharCode(65 + index); // A, B, C
    optionsText += `${label}) ${option}\n\n`;
  });

  // Create inline keyboard with just letter labels
  const keyboard = new InlineKeyboard();
  question.options.forEach((option, index) => {
    const label = String.fromCharCode(65 + index); // A, B, C
    keyboard.text(`${label}`, `answer_${question.id}_${index}`);
  });
  keyboard.row(); // Start new row for navigation

  await ctx.reply(
    `━━━━━━━━━━━━━━━━━━\n` +
      `📊 Progress: ${progressBar} ${progress}/${total}\n` +
      `${
        difficultyEmoji[question.difficulty]
      } Difficulty: ${question.difficulty.toUpperCase()}\n` +
      `⏱️ Time limit: ${session.timeLimit}s\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `❓ QUESTION:\n\n${question.question}\n\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `${optionsText}` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `👇 Select your answer:`,
    { reply_markup: keyboard }
  );
}

async function showTestResults(ctx: Context, session: MockInterviewState) {
  const totalQuestions = session.results.length;
  const correctAnswers = session.results.filter((r) => r.isCorrect).length;
  const percentage = Math.round((correctAnswers / totalQuestions) * 100);
  const totalTime = Math.floor((Date.now() - session.startTime) / 1000);
  const avgTime = Math.floor(totalTime / totalQuestions);

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

  // Grade emoji
  const gradeEmoji =
    percentage >= 90
      ? "🏆"
      : percentage >= 80
      ? "🥇"
      : percentage >= 70
      ? "🥈"
      : percentage >= 60
      ? "🥉"
      : "📝";

  let resultMessage =
    `\n${gradeEmoji} TEST COMPLETED! ${gradeEmoji}\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📊 OVERALL PERFORMANCE\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `✅ Correct Answers: ${correctAnswers}/${totalQuestions}\n` +
    `📈 Score: ${percentage}%\n` +
    `⏱️ Total Time: ${Math.floor(totalTime / 60)}m ${totalTime % 60}s\n` +
    `⚡ Avg per Question: ${avgTime}s\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📚 PERFORMANCE BY DIFFICULTY\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  Object.entries(byDifficulty).forEach(([level, stats]) => {
    if (stats.total > 0) {
      const emoji = level === "easy" ? "🟢" : level === "medium" ? "🟡" : "🔴";
      const percent = Math.round((stats.correct / stats.total) * 100);
      const bar =
        "█".repeat(Math.floor(percent / 10)) +
        "░".repeat(10 - Math.floor(percent / 10));
      resultMessage += `${emoji} ${level.toUpperCase()}: ${stats.correct}/${
        stats.total
      }\n`;
      resultMessage += `   ${bar} ${percent}%\n\n`;
    }
  });

  resultMessage +=
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📝 QUESTION BREAKDOWN\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

  session.results.forEach((result, index) => {
    const emoji = result.isCorrect ? "✅" : "❌";
    const status =
      result.userAnswer === "SKIPPED"
        ? "⏭️ Skipped"
        : result.userAnswer === "TIME OUT"
        ? "⏰ Timeout"
        : result.isCorrect
        ? "Correct"
        : "Incorrect";

    const diffEmoji =
      result.question.difficulty === "easy"
        ? "🟢"
        : result.question.difficulty === "medium"
        ? "🟡"
        : "🔴";

    resultMessage +=
      `\n${index + 1}. ${emoji} ${status} (${
        result.timeTaken
      }s) ${diffEmoji}\n` +
      `   ${result.question.question.substring(0, 65)}${
        result.question.question.length > 65 ? "..." : ""
      }\n`;
  });

  resultMessage += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

  // Performance feedback with tips
  if (percentage >= 90) {
    resultMessage +=
      `\n🏆 OUTSTANDING!\n` +
      `You're absolutely crushing it! You have a strong understanding of ${session.topicName}.\n` +
      `💡 Tip: Challenge yourself with harder topics or teach others!`;
  } else if (percentage >= 80) {
    resultMessage +=
      `\n🥇 EXCELLENT WORK!\n` +
      `Great performance! You have a solid grasp of ${session.topicName}.\n` +
      `💡 Tip: Review the questions you missed to reach 90%+!`;
  } else if (percentage >= 70) {
    resultMessage +=
      `\n🥈 GOOD JOB!\n` +
      `You're doing well! Keep practicing ${session.topicName}.\n` +
      `💡 Tip: Focus on medium and hard difficulty questions.`;
  } else if (percentage >= 60) {
    resultMessage +=
      `\n🥉 NOT BAD!\n` +
      `You're making progress! More practice will help.\n` +
      `💡 Tip: Review the correct answers and try /topic ${session.topicName} for practice.`;
  } else {
    resultMessage +=
      `\n💪 KEEP LEARNING!\n` +
      `Everyone starts somewhere! Don't give up.\n` +
      `💡 Tip: Use /topic ${session.topicName} to study, then retry the interview!`;
  }

  resultMessage +=
    `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` + `Choose what to do next:`;

  const keyboard = new InlineKeyboard()
    .text("🔄 Retry Test", `test_${session.topicName}`)
    .text("📚 Practice", `practice_${session.topicName}`)
    .row()
    .text("🏠 Home", "back_to_start");

  await ctx.reply(resultMessage, { reply_markup: keyboard });
}

export async function handleAnswerSelection(
  ctx: Context,
  questionId: number,
  selectedOption: number
) {
  const userId = ctx.from?.id;
  if (!userId) return;

  const session = interviewSessions.get(userId);
  if (!session) {
    await ctx.answerCallbackQuery({
      text: "No active interview session!",
    });
    return;
  }

  const currentQuestion = session.questions[session.currentQuestionIndex];

  // Verify this is the current question
  if (currentQuestion.id !== questionId) {
    await ctx.answerCallbackQuery({
      text: "Please answer the current question!",
    });
    return;
  }

  const timeTaken = Math.floor((Date.now() - session.questionStartTime) / 1000);

  // Check if time limit exceeded
  if (timeTaken > session.timeLimit) {
    session.results.push({
      question: currentQuestion,
      userAnswer: "TIME OUT",
      isCorrect: false,
      timeTaken: session.timeLimit,
    });

    await ctx.answerCallbackQuery();
    await ctx.reply(
      `⏰ TIME'S UP!\n\n` +
        `You exceeded the ${session.timeLimit}s time limit.\n\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `✅ CORRECT ANSWER:\n\n${
          currentQuestion.options[currentQuestion.correctOption]
        }\n` +
        `━━━━━━━━━━━━━━━━━━`
    );
  } else {
    // Check if answer is correct
    const isCorrect = selectedOption === currentQuestion.correctOption;
    const selectedLabel = String.fromCharCode(65 + selectedOption);
    const correctLabel = String.fromCharCode(
      65 + currentQuestion.correctOption
    );

    session.results.push({
      question: currentQuestion,
      userAnswer: `${selectedLabel}) ${currentQuestion.options[selectedOption]}`,
      isCorrect,
      timeTaken,
    });

    await ctx.answerCallbackQuery();

    if (isCorrect) {
      const encouragement = getEncouragement(true);
      await ctx.reply(
        `${encouragement} ⏱️ ${timeTaken}s\n\n` +
          `Your answer: ${selectedLabel}) ${currentQuestion.options[selectedOption]}\n\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `📖 EXPLANATION:\n\n${currentQuestion.answer}\n` +
          `━━━━━━━━━━━━━━━━━━`
      );
    } else {
      const encouragement = getEncouragement(false);
      await ctx.reply(
        `${encouragement} ⏱️ ${timeTaken}s\n\n` +
          `Your answer: ${selectedLabel}) ${currentQuestion.options[selectedOption]}\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `✅ CORRECT ANSWER:\n\n${correctLabel}) ${
            currentQuestion.options[currentQuestion.correctOption]
          }\n\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `📖 EXPLANATION:\n\n${currentQuestion.answer}\n` +
          `━━━━━━━━━━━━━━━━━━`
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
    await ctx.reply(`\n⬇️ NEXT QUESTION ⬇️\n`);
    await showCurrentQuestion(ctx, userId);
  }
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
