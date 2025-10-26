import { CommandContext, Context } from "grammy";
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

🎓 Practice a topic:
/topic <name>

🔥 Take a mock interview:
/mockinterview <topic>

Example: /mockinterview typescript
  `;

  await ctx.reply(message);
}
