import { CommandContext, Context } from "grammy";
import dataService from "../services/dataService";

export async function topicCommand(ctx: CommandContext<Context>) {
  const topicName = ctx.match;

  if (!topicName) {
    const topics = dataService.getAllTopicNames();
    return ctx.reply(
      `⚠️ Please specify a topic!\n\n` +
        `📚 Available topics:\n${topics
          .map((t) => `  • ${t}`)
          .join("\n")}\n\n` +
        `💡 Example: /topic playwright`
    );
  }

  const question = dataService.getRandomQuestion(topicName);

  if (!question) {
    return ctx.reply(
      `❌ Topic "${topicName}" not found.\n\n` +
        `Use /topics to see all available topics.`
    );
  }

  const difficultyEmoji = {
    easy: "🟢",
    medium: "🟡",
    hard: "🔴",
  };

  const message = `
📚 Topic: ${topicName.toUpperCase()}
${
  difficultyEmoji[question.difficulty]
} Difficulty: ${question.difficulty.toUpperCase()}

━━━━━━━━━━━━━━━━━━

❓ QUESTION:

${question.question}

━━━━━━━━━━━━━━━━━━

💡 ANSWER:

${question.answer}

━━━━━━━━━━━━━━━━━━

🔄 Get another question: /topic ${topicName}
🔥 Start mock interview: /mockinterview ${topicName}
  `;

  await ctx.reply(message);
}
