import Flashcard from "./Flashcard";
import type { FlashcardType } from '../types/types'

type FlashcardListProps = {
    cards: Flashcard[];
};

function FlashcardList(props: FlashcardListProps) {
    return (
        <div> 
            {props.cards.map(card => (
                <div> 
                <Flashcard 
                    key={card.question}
                    question={card.question}
                    answer={card.answer} 
                /> 
                </div>
            ))}
        </div>
    );
}

export default FlashcardList;