import { CommandContext, Context, InlineKeyboard } from "grammy";
import dataService from "../services/dataService";

export async function startCommand(ctx: CommandContext<Context>) {
  const topics = dataService.getAllTopicNames();
  const topicList = topics.map((t) => `  • ${t.toUpperCase()}`).join("\n");

  const message = `
👋 Welcome to Interview Prep Bot!

🎯 Your personal interview coach is ready to help you ace your next technical interview!

📚 Available Topics:
${topicList}

� What would you like to do?

🎓 Practice Mode:
/topic <name> - Get a random question with instant answer
   Example: /topic typescript

🔥 Test Mode:
/mockinterview <topic> - Take a timed test with scoring
   Example: /mockinterview playwright

📋 Browse:
/topics - View all topics with question counts

💡 Tip: Start with practice mode to learn, then test yourself with mock interviews!
  `;

  const keyboard = new InlineKeyboard()
    .text("🎓 Practice Mode", "practice_mode")
    .text("🔥 Test Mode", "test_mode")
    .row()
    .text("📚 View Topics", "view_topics")
    .text("ℹ️ Help", "show_help");

  await ctx.reply(message, { reply_markup: keyboard });
}
