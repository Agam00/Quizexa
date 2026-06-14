import { z } from "zod";
import { QUIZ_QUESTION_LIMITS } from "@/lib/quiz-limits";

export const getQuestionsSchema = z.object({
  topic: z.string(),
  amount: z
    .number()
    .int()
    .min(QUIZ_QUESTION_LIMITS.min)
    .max(QUIZ_QUESTION_LIMITS.max),
  type: z.enum(["mcq", "open_ended"]),
});

export const checkAnswerSchema = z.object({
  userInput: z.string(),
  questionId: z.string(),
});

export const endGameSchema = z.object({
  gameId: z.string(),
});
