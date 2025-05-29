export type FlashcardType = {
    question: string;
    options: string[];
    correctAnswer: number;
    onAnswerSelect: (selectedOption: number) => void;
    cardId: number;
    disabled: boolean;
  }