import { strict_output } from "@/lib/gpt";

export type McqQuestion = {
  question: string;
  answer: string;
  option1: string;
  option2: string;
  option3: string;
};

export type OpenQuestion = {
  question: string;
  answer: string;
};

export type GenerateQuestionsInput = {
  amount: number;
  topic: string;
  type: "mcq" | "open_ended";
};

const normalizeOption = (option: string) =>
  option.trim().toLowerCase().replace(/\s+/g, " ");

const hasUniqueAnswerChoices = (question: McqQuestion) => {
  const choices = [
    question.answer,
    question.option1,
    question.option2,
    question.option3,
  ].map(normalizeOption);

  return new Set(choices).size === choices.length;
};

export async function generateQuestions({
  amount,
  topic,
  type,
}: GenerateQuestionsInput): Promise<(McqQuestion | OpenQuestion)[]> {
  if (type === "open_ended") {
    return strict_output(
      [
        "Generate advanced open-ended quiz questions as a JSON array.",
        "Questions must require analysis, application, comparison, or causal reasoning, not simple recall.",
        "Each question must have exactly one clear answer with no ambiguity.",
        "Keep wording concise, grammatically correct, and consistent in tone.",
        "Answers must be accurate and no more than 15 words.",
      ].join(" "),
      new Array(amount).fill(
        `Generate one challenging open-ended question about ${topic}.`
      ),
      {
        question: "question",
        answer: "answer with max length of 15 words",
      }
    );
  }

  const questions = (await strict_output(
    [
      "Generate advanced multiple-choice quiz questions as a JSON array.",
      "Every question must require deeper understanding, reasoning, or application rather than obvious recall.",
      "Each question must have exactly one unambiguously correct answer.",
      "The answer and all three distractors must be unique; do not repeat or rephrase the same option.",
      "Distractors must be plausible and convincing, not obviously wrong.",
      "Avoid answer-length bias: the correct answer must not be consistently longer, more specific, or more detailed than the distractors.",
      "Keep all four answer choices similar in length, tone, grammar, and level of detail.",
      "Use clear, consistent wording and avoid vague choices such as 'all of the above' or 'none of the above'.",
      "Each answer choice must be no more than 15 words.",
    ].join(" "),
    new Array(amount).fill(
      `Generate one challenging MCQ about ${topic}. Review it for uniqueness, grammar, plausible distractors, and exactly one correct answer.`
    ),
    {
      question: "question",
      answer: "answer with max length of 15 words",
      option1: "option1 with max length of 15 words",
      option2: "option2 with max length of 15 words",
      option3: "option3 with max length of 15 words",
    }
  )) as McqQuestion[];

  return questions.filter(hasUniqueAnswerChoices);
}
