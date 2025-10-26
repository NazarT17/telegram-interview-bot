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
    answers: new Array(selectedQuestions.length).fill(undefined),
    correctAnswers: 0,
  });

  await ctx.reply(
    `🎯 MOCK INTERVIEW STARTED!\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📚 Topic: ${topicName.toUpperCase()}\n` +
      `📝 Total Questions: ${selectedQuestions.length}\n` +
      `⏱️ Time per Question: ${QUESTION_TIME_LIMIT}s (2 min)\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `� HOW IT WORKS:\n\n` +
      `  1️⃣ Read the question carefully\n` +
      `  2️⃣ Choose from 3 options (A, B, C)\n` +
      `  3️⃣ Get instant feedback\n` +
      `  4️⃣ Click "Next" when ready\n\n` +
      `� Your score will be calculated at the end!\n\n` +
      `Good luck! 🍀`
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
  const percentage = Math.round((progress / total) * 100);

  const difficultyEmoji = {
    easy: "🟢",
    medium: "🟡",
    hard: "🔴",
  };

  // Display all options in the message
  let optionsText = "";
  question.options.forEach((option, index) => {
    const label = String.fromCharCode(65 + index); // A, B, C
    optionsText += `  ${label}) ${option}\n\n`;
  });

  // Create inline keyboard with just letter labels
  const keyboard = new InlineKeyboard();
  question.options.forEach((option, index) => {
    const label = String.fromCharCode(65 + index); // A, B, C
    keyboard.text(`  ${label}  `, `answer_${question.id}_${index}`);
  });
  keyboard.row().text("🚫 Exit Test", `exit_test_${userId}`);

  await ctx.reply(
    `\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📊 Question ${progress} of ${total}\n` +
      `${progressBar} ${percentage}%\n` +
      `${difficultyEmoji[question.difficulty]} ${
        question.difficulty.charAt(0).toUpperCase() +
        question.difficulty.slice(1)
      } | ⏱️ ${session.timeLimit}s\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `❓ ${question.question}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `${optionsText}` +
      `👇 Choose your answer:`,
    { reply_markup: keyboard }
  );
}

async function showTestResults(ctx: Context, session: MockInterviewState) {
  const totalQuestions = session.questions.length;
  const correctAnswers = session.correctAnswers;
  const percentage =
    totalQuestions > 0
      ? Math.round((correctAnswers / totalQuestions) * 100)
      : 0;
  const totalTime = Math.floor((Date.now() - session.startTime) / 1000);
  const avgTime =
    totalQuestions > 0 ? Math.floor(totalTime / totalQuestions) : 0;

  // Calculate by difficulty
  const byDifficulty = {
    easy: { correct: 0, total: 0 },
    medium: { correct: 0, total: 0 },
    hard: { correct: 0, total: 0 },
  };

  session.questions.forEach((question, index) => {
    const diff = question.difficulty;
    byDifficulty[diff].total++;

    // Check if this question was answered correctly
    const userAnswer = session.answers[index];
    if (userAnswer !== undefined && userAnswer === question.correctOption) {
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
    `\n${gradeEmoji} TEST COMPLETED!\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📊 OVERALL PERFORMANCE\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `✅ Correct: ${correctAnswers}/${totalQuestions}\n` +
    `📈 Score: ${percentage}%\n` +
    `⏱️ Time: ${Math.floor(totalTime / 60)}m ${totalTime % 60}s\n` +
    `⚡ Avg: ${avgTime}s/question\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📚 BY DIFFICULTY\n` +
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

  session.questions.forEach((question, index) => {
    const userAnswer = session.answers[index];
    const isCorrect =
      userAnswer !== undefined && userAnswer === question.correctOption;
    const emoji = isCorrect ? "✅" : "❌";
    const status =
      userAnswer === undefined
        ? "⏭️ Skipped"
        : isCorrect
        ? "Correct"
        : "Incorrect";

    const diffEmoji =
      question.difficulty === "easy"
        ? "🟢"
        : question.difficulty === "medium"
        ? "🟡"
        : "🔴";

    resultMessage +=
      `\n${index + 1}. ${emoji} ${status} ${diffEmoji}\n` +
      `   ${question.question.substring(0, 65)}${
        question.question.length > 65 ? "..." : ""
      }\n`;
  });

  resultMessage += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

  // Performance feedback with tips
  if (percentage >= 90) {
    resultMessage +=
      `\n🏆 OUTSTANDING!\n\n` +
      `You're crushing it! Strong mastery of ${session.topicName}.\n\n` +
      `💡 Next: Challenge yourself with harder topics!`;
  } else if (percentage >= 80) {
    resultMessage +=
      `\n🥇 EXCELLENT!\n\n` +
      `Great job! Solid understanding of ${session.topicName}.\n\n` +
      `💡 Next: Review missed questions to reach 90%+`;
  } else if (percentage >= 70) {
    resultMessage +=
      `\n🥈 GOOD JOB!\n\n` +
      `You're doing well! Keep practicing.\n\n` +
      `💡 Next: Focus on medium/hard questions`;
  } else if (percentage >= 60) {
    resultMessage +=
      `\n🥉 NICE TRY!\n\n` +
      `Making progress! More practice will help.\n\n` +
      `💡 Next: Review answers and practice mode`;
  } else {
    resultMessage +=
      `\n💪 KEEP GOING!\n\n` +
      `Everyone starts somewhere!\n\n` +
      `💡 Next: Use practice mode, then retry`;
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
  questionId: string,
  selectedOption: number
) {
  const userId = ctx.from?.id;
  if (!userId) return;

  const session = interviewSessions.get(userId);
  if (!session) {
    await ctx.answerCallbackQuery({
      text: "⚠️ Session not found. Please start a new test.",
    });
    return;
  }

  // Verify this is the current question
  const currentQuestion = session.questions[session.currentQuestionIndex];
  if (currentQuestion.id.toString() !== questionId) {
    await ctx.answerCallbackQuery({
      text: "⚠️ Please answer the current question.",
    });
    return;
  }

  // Check if already answered
  if (session.answers[session.currentQuestionIndex] !== undefined) {
    await ctx.answerCallbackQuery({
      text: "⚠️ You already answered this question!",
    });
    return;
  }

  // Record answer
  session.answers[session.currentQuestionIndex] = selectedOption;

  // Check if correct
  const isCorrect = selectedOption === currentQuestion.correctOption;
  if (isCorrect) {
    session.correctAnswers++;
  }

  // Prepare feedback message
  const selectedLabel = String.fromCharCode(65 + selectedOption);
  const correctLabel = String.fromCharCode(65 + currentQuestion.correctOption);
  const correctAnswer = currentQuestion.options[currentQuestion.correctOption];

  let feedbackMessage = "";
  if (isCorrect) {
    feedbackMessage =
      `✅ Correct!\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `Your answer: ${selectedLabel}) ${currentQuestion.options[selectedOption]}\n\n` +
      `� Explanation:\n${currentQuestion.answer}`;
  } else {
    feedbackMessage =
      `❌ Incorrect\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `Your answer: ${selectedLabel}) ${currentQuestion.options[selectedOption]}\n\n` +
      `✓ Correct answer: ${correctLabel}) ${correctAnswer}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `� Explanation:\n${currentQuestion.answer}`;
  }

  // Send feedback with Next Question button
  const keyboard = new InlineKeyboard().text(
    "➡️ Next Question",
    `next_test_question_${userId}`
  );

  await ctx.reply(feedbackMessage, { reply_markup: keyboard });
  await ctx.answerCallbackQuery();
}
export async function handleNextQuestion(ctx: Context, userId: number) {
  const session = interviewSessions.get(userId);
  if (!session) {
    await ctx.answerCallbackQuery({
      text: "No active interview session!",
    });
    return;
  }

  await ctx.answerCallbackQuery();

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
