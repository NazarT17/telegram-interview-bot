import { CommandContext, Context, InlineKeyboard } from "grammy";
import dataService from "../services/dataService";

export async function topicsCommand(ctx: CommandContext<Context>) {
  const topics = dataService.getAllTopicNames();

  const topicDetails = topics
    .map((name) => {
      const topic = dataService.getTopic(name);
      const count = topic?.questions.length || 0;
      return `📚 ${name.toUpperCase()}\n   └─ ${count} questions available`;
    })
    .join("\n\n");

  const message = `
📖 Available Topics

${topicDetails}

━━━━━━━━━━━━━━━━━━

Choose a mode below:
  `;

  const keyboard = new InlineKeyboard();

  // Add practice mode buttons
  keyboard.text("🎓 Practice Mode", "practice_mode").row();

  // Add test mode buttons
  keyboard.text("🔥 Test Mode", "test_mode");

  await ctx.reply(message, { reply_markup: keyboard });
}
