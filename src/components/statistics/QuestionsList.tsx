"use client";
import React from "react";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GameType, Question } from "@prisma/client";

type Props = {
  questions: Question[];
  gameType: GameType;
};

const QuestionsList = ({ questions, gameType }: Props) => {
  const isOpenEnded = gameType === "open_ended";

  if (questions.length === 0) {
    return (
      <p className="mt-4 text-muted-foreground">
        No questions were saved for this quiz.
      </p>
    );
  }

  return (
    <Table className="mt-4">
      <TableCaption>End of list.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[10px]">No.</TableHead>
          <TableHead>Question & Correct Answer</TableHead>
          <TableHead>Your Answer</TableHead>

          {isOpenEnded && (
            <TableHead className="w-[10px] text-right">Accuracy</TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        <>
          {questions.map(
            (
              { answer, question, userAnswer, percentageCorrect, isCorrect },
              index
            ) => {
              return (
                <TableRow key={index}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>
                    {question} <br />
                    <br />
                    <span className="font-semibold">{answer}</span>
                  </TableCell>
                  {isOpenEnded ? (
                    <TableCell className="font-semibold">{userAnswer}</TableCell>
                  ) : (
                    <TableCell
                      className={`${
                        isCorrect ? "text-green-600" : "text-red-600"
                      } font-semibold`}
                    >
                      {userAnswer}
                    </TableCell>
                  )}

                  {isOpenEnded && percentageCorrect != null && (
                    <TableCell className="text-right">
                      {percentageCorrect}%
                    </TableCell>
                  )}
                </TableRow>
              );
            }
          )}
        </>
      </TableBody>
    </Table>
  );
};

export default QuestionsList;
