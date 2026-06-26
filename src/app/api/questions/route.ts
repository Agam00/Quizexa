import {
  generateQuestionsOrThrow,
  QuestionGenerationError,
} from "@/lib/generate-questions";
import { getAuthSession } from "@/lib/nextauth";
import { getQuestionsSchema } from "@/schemas/questions";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to create a game." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { amount, topic, type } = getQuestionsSchema.parse(body);
    const questions = await generateQuestionsOrThrow({ amount, topic, type });

    return NextResponse.json({ questions }, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }

    if (error instanceof QuestionGenerationError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.error("Question generation error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
