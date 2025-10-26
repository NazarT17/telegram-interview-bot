import { Bot, InlineKeyboard } from "grammy";
import dotenv from "dotenv";
import { startCommand } from "./commands/start";
import { topicCommand } from "./commands/topic";
import { topicsCommand } from "./commands/topics";
import { menuCommand, helpCommand } from "./commands/menu";
import {
  mockInterviewCommand,
  startMockInterview,
  handleAnswerSelection,
} from "./commands/mockInterview";
import dataService from "./services/dataService";

dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  throw new Error("TELEGRAM_BOT_TOKEN is not defined in .env file");
}

const bot = new Bot(BOT_TOKEN);

bot.command("start", startCommand);
bot.command("menu", menuCommand);
bot.command("help", helpCommand);
bot.command("topic", topicCommand);
bot.command("topics", topicsCommand);
bot.command("mockinterview", mockInterviewCommand);

// Callback query handlers for inline buttons
bot.callbackQuery("practice_mode", async (ctx) => {
  await ctx.answerCallbackQuery();
  const topics = dataService.getAllTopicNames();

  const keyboard = new InlineKeyboard();
  topics.forEach((topic) => {
    keyboard.text(`📚 ${topic.toUpperCase()}`, `practice_${topic}`).row();
  });
  keyboard.text("🔙 Back", "back_to_start");

  await ctx.editMessageText(
    "🎓 Practice Mode\n\n" +
      "Select a topic to get a random question with instant answer:",
    { reply_markup: keyboard }
  );
});

bot.callbackQuery("test_mode", async (ctx) => {
  await ctx.answerCallbackQuery();
  const topics = dataService.getAllTopicNames();

  const keyboard = new InlineKeyboard();
  topics.forEach((topic) => {
    keyboard.text(`🔥 ${topic.toUpperCase()}`, `test_${topic}`).row();
  });
  keyboard.text("🔙 Back", "back_to_start");

  await ctx.editMessageText(
    "🔥 Test Mode\n\n" +
      "Select a topic for a timed mock interview with scoring:",
    { reply_markup: keyboard }
  );
});

bot.callbackQuery("view_topics", async (ctx) => {
  await ctx.answerCallbackQuery();
  await topicsCommand(ctx as any);
});

bot.callbackQuery("show_help", async (ctx) => {
  await ctx.answerCallbackQuery();
  await helpCommand(ctx as any);
});

bot.callbackQuery("back_to_start", async (ctx) => {
  await ctx.answerCallbackQuery();
  await startCommand(ctx as any);
});

// Handle practice mode topic selection
bot.callbackQuery(/^practice_(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const topic = ctx.match[1];

  const question = dataService.getRandomQuestion(topic);

  if (!question) {
    return ctx.reply("❌ No questions found for this topic.");
  }

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

  const message = `
📚 Topic: ${topic.toUpperCase()}
${
  difficultyEmoji[question.difficulty]
} Difficulty: ${question.difficulty.toUpperCase()}

━━━━━━━━━━━━━━━━━━

❓ QUESTION:

${question.question}

━━━━━━━━━━━━━━━━━━

${optionsText}━━━━━━━━━━━━━━━━━━

👇 Select your answer:
  `;

  // Create answer buttons with just labels
  const keyboard = new InlineKeyboard();
  question.options.forEach((option, index) => {
    const label = String.fromCharCode(65 + index); // A, B, C
    keyboard.text(
      `${label}`,
      `practice_answer_${question.id}_${index}_${topic}`
    );
  });
  keyboard
    .row()
    .text("🔄 Another Question", `practice_${topic}`)
    .text("🏠 Home", "back_to_start");

  await ctx.reply(message, { reply_markup: keyboard });
});

// Handle practice mode answer selection
bot.callbackQuery(/^practice_answer_(\d+)_(\d+)_(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const questionId = parseInt(ctx.match[1]);
  const selectedOption = parseInt(ctx.match[2]);
  const topic = ctx.match[3];

  const topicData = dataService.getTopic(topic);
  const question = topicData?.questions.find((q) => q.id === questionId);

  if (!question) {
    return ctx.reply("❌ Question not found.");
  }

  const difficultyEmoji = {
    easy: "🟢",
    medium: "🟡",
    hard: "🔴",
  };

  const isCorrect = selectedOption === question.correctOption;
  const selectedLabel = String.fromCharCode(65 + selectedOption);
  const correctLabel = String.fromCharCode(65 + question.correctOption);

  let optionsText = "";
  question.options.forEach((option, index) => {
    const label = String.fromCharCode(65 + index);
    let marker = "  ";
    if (index === question.correctOption) {
      marker = "✅";
    } else if (index === selectedOption && !isCorrect) {
      marker = "❌";
    }
    optionsText += `${marker} ${label}) ${option}\n`;
  });

  const resultEmoji = isCorrect ? "🎉" : "💡";
  const resultText = isCorrect ? "CORRECT!" : "INCORRECT";

  const message = `
${resultEmoji} ${resultText}

📚 Topic: ${topic.toUpperCase()}
${
  difficultyEmoji[question.difficulty]
} Difficulty: ${question.difficulty.toUpperCase()}

━━━━━━━━━━━━━━━━━━

❓ QUESTION:

${question.question}

━━━━━━━━━━━━━━━━━━

${optionsText}
━━━━━━━━━━━━━━━━━━

${
  isCorrect
    ? `✅ You selected: ${selectedLabel} - That's right!`
    : `❌ You selected: ${selectedLabel}\n✅ Correct answer: ${correctLabel}`
}

💡 EXPLANATION:

${question.answer}

━━━━━━━━━━━━━━━━━━
  `;

  const keyboard = new InlineKeyboard()
    .text("🔄 Another Question", `practice_${topic}`)
    .row()
    .text("🔥 Start Test", `test_${topic}`)
    .text("🏠 Home", "back_to_start");

  await ctx.editMessageText(message, { reply_markup: keyboard });
});

// Handle test mode topic selection
bot.callbackQuery(/^test_(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const topic = ctx.match[1];

  await startMockInterview(ctx, topic);
});

// Handle answer selection in mock interviews
bot.callbackQuery(/^answer_(\d+)_(\d+)$/, async (ctx) => {
  const questionId = parseInt(ctx.match[1]);
  const selectedOption = parseInt(ctx.match[2]);

  await handleAnswerSelection(ctx, questionId, selectedOption);
});

bot.catch((err) => {
  console.error("Error in bot:", err);
});

// Graceful shutdown for cloud platforms
process.once("SIGINT", () => {
  console.log("🛑 Bot stopping (SIGINT)...");

  bot.stop();
});

process.once("SIGTERM", () => {
  console.log("🛑 Bot stopping (SIGTERM)...");

  bot.stop();
});

console.log("🤖 Bot is starting...");
console.log("Environment:", process.env.NODE_ENV || "development");
bot.start();
