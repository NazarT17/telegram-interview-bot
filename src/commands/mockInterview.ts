import { CommandContext, Context } from "grammy";
import dataService from "../services/dataService";
import { Question } from "../types";

const interviewSessions = new Map<
  number,
  {
    questions: Question[];
    currentIndex: number;
    showingAnswer: boolean;
  }
>();

export async function mockInterviewCommand(ctx: CommandContext<Context>) {
  const userId = ctx.from?.id;
  if (!userId) return;

  const questions = dataService.getRandomQuestions(5);

  if (questions.length === 0) {
    return ctx.reply("❌ No questions available for mock interview.");
  }

  interviewSessions.set(userId, {
    questions,
    currentIndex: 0,
    showingAnswer: false,
  });

  await ctx.reply(
    `🎯 Mock Interview Started!\n\n` +
      `I'll ask you ${questions.length} questions from various topics.\n` +
      `Reply "answer" to see the answer, or "next" to move to the next question.\n\n` +
      `Let's begin! 🚀`
  );

  await showCurrentQuestion(ctx, userId);
}

export async function handleInterviewResponse(ctx: Context) {
  const userId = ctx.from?.id;
  if (!userId) return;

  const session = interviewSessions.get(userId);
  if (!session) {
    return ctx.reply("No active interview. Start one with /mockinterview");
  }

  const text = ctx.message?.text?.toLowerCase();

  if (text === "answer") {
    if (session.showingAnswer) {
      return ctx.reply('Answer already shown. Reply "next" for next question.');
    }

    const question = session.questions[session.currentIndex];
    session.showingAnswer = true;

    await ctx.reply(
      `💡 Answer:\n\n${question.answer}\n\n---\nReply "next" for the next question.`
    );
  } else if (text === "next") {
    session.currentIndex++;
    session.showingAnswer = false;

    if (session.currentIndex >= session.questions.length) {
      interviewSessions.delete(userId);
      return ctx.reply(
        `✅ Mock Interview Completed!\n\n` +
          `You've answered all ${session.questions.length} questions.\n` +
          `Start a new interview with /mockinterview`
      );
    }

    await showCurrentQuestion(ctx, userId);
  } else {
    await ctx.reply(
      'Reply "answer" to see the answer, or "next" to skip to the next question.'
    );
  }
}

async function showCurrentQuestion(ctx: Context, userId: number) {
  const session = interviewSessions.get(userId);
  if (!session) return;

  const question = session.questions[session.currentIndex];
  const progress = `Question ${session.currentIndex + 1}/${
    session.questions.length
  }`;

  const difficultyEmoji = {
    easy: "🟢",
    medium: "🟡",
    hard: "🔴",
  };

  await ctx.reply(
    `${progress}\n` +
      `${
        difficultyEmoji[question.difficulty]
      } ${question.difficulty.toUpperCase()}\n\n` +
      `❓ ${question.question}\n\n` +
      `---\nReply "answer" to see the answer.`
  );
}
