import { CommandContext, Context } from "grammy";
import dataService from "../services/dataService";

export async function topicCommand(ctx: CommandContext<Context>) {
  const topicName = ctx.match;

  if (!topicName) {
    const topics = dataService.getAllTopicNames();
    return ctx.reply(
      `Please specify a topic.\n\nAvailable topics:\n${topics
        .map((t) => `• ${t}`)
        .join("\n")}\n\nExample: /topic playwright`
    );
  }

  const question = dataService.getRandomQuestion(topicName);

  if (!question) {
    return ctx.reply(
      `❌ Topic "${topicName}" not found. Use /topics to see available topics.`
    );
  }

  const difficultyEmoji = {
    easy: "🟢",
    medium: "🟡",
    hard: "🔴",
  };

  const message = `
${
  difficultyEmoji[question.difficulty]
} Difficulty: ${question.difficulty.toUpperCase()}

❓ Question:
${question.question}

💡 Answer:
${question.answer}

---
Want another? Try /topic ${topicName} again!
  `;

  await ctx.reply(message);
}
