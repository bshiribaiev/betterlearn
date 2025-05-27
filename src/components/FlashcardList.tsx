import Flashcard from "./Flashcard";
import type { FlashcardType } from '../types/types'

type FlashcardListProps = {
    cards: FlashcardType[];
}
function FlashcardList(props: FlashcardListProps) {
    return (
        <div> 
            {props.cards.map(card => (
                <div> 
                <Flashcard 
                    key={card.question}
                    question={card.question}
                    options={card.options} 
                    correctAnswer={card.correctAnswer}
                /> 
                </div>
            ))}
        </div>
    );
}

export default FlashcardList;