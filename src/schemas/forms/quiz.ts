import { z } from "zod";
import { QUIZ_QUESTION_LIMITS } from "@/lib/quiz-limits";

export const quizCreationSchema = z.object({
  topic: z
    .string()
    .min(4, {
      message: "Topic must be at least 4 characters long",
    })
    .max(50, {
      message: "Topic must be at most 50 characters long",
    }),
  type: z.enum(["mcq", "open_ended"]),
  amount: z
    .number()
    .int()
    .min(QUIZ_QUESTION_LIMITS.min, {
      message: `At least ${QUIZ_QUESTION_LIMITS.min} question is required`,
    })
    .max(QUIZ_QUESTION_LIMITS.max, {
      message: `Maximum ${QUIZ_QUESTION_LIMITS.max} questions per quiz on the free AI plan`,
    }),
});
