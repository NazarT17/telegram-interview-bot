import { CommandContext, Context, InlineKeyboard } from "grammy";

export async function menuCommand(ctx: CommandContext<Context>) {
  const keyboard = new InlineKeyboard()
    .text("🎓 Practice Mode", "practice_mode")
    .text("🔥 Test Mode", "test_mode")
    .row()
    .text("📚 View Topics", "view_topics")
    .row()
    .text("ℹ️ Help", "show_help");

  const message = `
🤖 INTERVIEW BOT MENU

━━━━━━━━━━━━━━━━━━━━━━━━━━

Choose what you'd like to do:

🎓 Practice Mode
   • Get random questions
   • See instant feedback
   • Learn at your own pace

🔥 Test Mode
   • Timed mock interviews
   • 5 questions per test
   • Get scored results

📚 View Topics
   • See all available topics
   • TypeScript, QA, Playwright

━━━━━━━━━━━━━━━━━━━━━━━━━━
  `;

  await ctx.reply(message, { reply_markup: keyboard });
}

export async function helpCommand(ctx: CommandContext<Context>) {
  const message = `
ℹ️ HOW TO USE THIS BOT

━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 AVAILABLE COMMANDS:

/start - Start the bot and see welcome message
/menu - Show the main menu
/topics - List all available topics
/help - Show this help message

━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 MODES:

🎓 PRACTICE MODE
• Get random questions from any topic
• Multiple choice with 3 options
• See immediate feedback
• Learn the correct answers

🔥 TEST MODE
• Take a timed mock interview
• 5 random questions per test
• 2 minutes per question
• Get scored results with breakdown

━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 TOPICS:

✅ TypeScript - 10 questions
✅ QA General - 10 questions  
✅ Playwright - 10 questions

━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 TIPS:

• Use Practice Mode to learn
• Use Test Mode to assess yourself
• Each question has 3 answer options
• Only 1 answer is correct
• Tests show difficulty levels:
  🟢 Easy  🟡 Medium  🔴 Hard

━━━━━━━━━━━━━━━━━━━━━━━━━━

Need help? Just type /menu to start!
  `;

  await ctx.reply(message);
}
