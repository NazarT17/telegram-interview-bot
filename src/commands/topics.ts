import { CommandContext, Context } from "grammy";
import dataService from "../services/dataService";

export async function topicsCommand(ctx: CommandContext<Context>) {
  const topics = dataService.getAllTopicNames();

  const topicDetails = topics
    .map((name) => {
      const topic = dataService.getTopic(name);
      return `📚 ${name} - ${topic?.questions.length || 0} questions`;
    })
    .join("\n");

  const message = `
Available Topics:

${topicDetails}

Use /topic <name> to get a question from a specific topic.
Example: /topic playwright
  `;

  await ctx.reply(message);
}
