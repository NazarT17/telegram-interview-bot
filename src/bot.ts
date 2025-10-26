import { Bot } from "grammy";
import dotenv from "dotenv";
import { startCommand } from "./commands/start";
import { topicCommand } from "./commands/topic";
import { topicsCommand } from "./commands/topics";
import {
  mockInterviewCommand,
  handleInterviewResponse,
} from "./commands/mockInterview";

dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  throw new Error("TELEGRAM_BOT_TOKEN is not defined in .env file");
}

const bot = new Bot(BOT_TOKEN);

bot.command("start", startCommand);
bot.command("topic", topicCommand);
bot.command("topics", topicsCommand);
bot.command("mockinterview", mockInterviewCommand);

bot.on("message:text", handleInterviewResponse);

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
