export const QUIZ_QUESTION_LIMITS = {
  min: 1,
  max: 5,
  default: 3,
} as const;

export const QUIZ_QUESTION_LIMIT_MESSAGE = `You can create ${QUIZ_QUESTION_LIMITS.min}-${QUIZ_QUESTION_LIMITS.max} questions per quiz (optimized for free AI).`;
