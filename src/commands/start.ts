import { CommandContext, Context, InlineKeyboard } from "grammy";
import dataService from "../services/dataService";

export async function startCommand(ctx: CommandContext<Context>) {
  const topics = dataService.getAllTopicNames();
  const topicList = topics.map((t) => `  • ${t.toUpperCase()}`).join("\n");

  const message = `
👋 Welcome to Interview Prep Bot!

━━━━━━━━━━━━━━━━━━━━━━━━━━

Your personal coach for acing technical interviews!

📚 AVAILABLE TOPICS:

${topicList}

━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 CHOOSE YOUR MODE:

🎓 Practice Mode
   Learn with instant feedback
   → /topic <name>

🔥 Test Mode
   Timed questions with scoring
   → /mockinterview <topic>

📋 Browse Topics
   See all questions available
   → /topics

━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 Pro Tip: Practice first, then test yourself!
  `;

  const keyboard = new InlineKeyboard()
    .text("🎓 Practice", "practice_mode")
    .text("🔥 Test", "test_mode")
    .row()
    .text("📚 Topics", "view_topics")
    .text("ℹ️ Help", "show_help");

  await ctx.reply(message, { reply_markup: keyboard });
}
