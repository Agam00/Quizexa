import { prisma } from "@/lib/db";
import {
  generateQuestionsOrThrow,
  QuestionGenerationError,
  type McqQuestion,
  type OpenQuestion,
} from "@/lib/generate-questions";
import { getAuthSession } from "@/lib/nextauth";
import { getSessionUserId } from "@/lib/session-user";
import { quizCreationSchema } from "@/schemas/forms/quiz";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  let gameId: string | null = null;

  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to create a game." },
        { status: 401 }
      );
    }

    const userId = await getSessionUserId(session);
    if (!userId) {
      return NextResponse.json(
        {
          error:
            "Your account was not found in the database. Please sign out and sign in again.",
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { topic, type, amount } = quizCreationSchema.parse(body);
    const game = await prisma.game.create({
      data: {
        gameType: type,
        timeStarted: new Date(),
        userId,
        topic,
      },
    });
    gameId = game.id;

    await prisma.topic_count.upsert({
      where: { topic },
      create: { topic, count: 1 },
      update: { count: { increment: 1 } },
    });

    const questions = await generateQuestionsOrThrow({ amount, topic, type });

    if (type === "mcq") {
      const manyData = (questions as McqQuestion[]).map((question) => {
        const options = [
          question.option1,
          question.option2,
          question.option3,
          question.answer,
        ].sort(() => Math.random() - 0.5);

        return {
          question: question.question,
          answer: question.answer,
          options: JSON.stringify(options),
          gameId: game.id,
          questionType: "mcq" as const,
        };
      });

      await prisma.question.createMany({ data: manyData });
    } else {
      await prisma.question.createMany({
        data: (questions as OpenQuestion[]).map((question) => ({
          question: question.question,
          answer: question.answer,
          gameId: game.id,
          questionType: "open_ended" as const,
        })),
      });
    }

    return NextResponse.json({ gameId: game.id }, { status: 200 });
  } catch (error) {
    if (gameId) {
      await prisma.game.delete({ where: { id: gameId } }).catch(() => {});
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }

    if (error instanceof QuestionGenerationError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        {
          error:
            "Your account was not found in the database. Please sign out and sign in again.",
        },
        { status: 401 }
      );
    }

    console.error("Game creation error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to create a game." },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const gameId = url.searchParams.get("gameId");
    if (!gameId) {
      return NextResponse.json(
        { error: "You must provide a game id." },
        { status: 400 }
      );
    }

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: { questions: true },
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found." }, { status: 404 });
    }

    return NextResponse.json({ game }, { status: 200 });
  } catch (error) {
    console.error("Game fetch error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
