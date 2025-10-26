import { CommandContext, Context } from "grammy";
import dataService from "../services/dataService";

export async function startCommand(ctx: CommandContext<Context>) {
  const topics = dataService.getAllTopicNames();
  const topicList = topics.map((t) => `• ${t}`).join("\n");

  const message = `
👋 Welcome to the Interview Preparation Bot!

I'll help you prepare for technical interviews by asking questions about:

${topicList}

📚 Available Commands:
/start - Show this message
/topic <name> - Get a random question from a topic
/mockinterview - Start a mock interview session
/topics - List all available topics

Example: /topic playwright
  `;

  await ctx.reply(message);
}
