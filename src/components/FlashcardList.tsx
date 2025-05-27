import Flashcard from "./Flashcard";
import type { FlashcardType } from '../types/types'
import { useState } from 'react'

type FlashcardListProps = {
    cards: FlashcardType[];
}
function FlashcardList(props: FlashcardListProps) {
    const [selections, setSelections] = useState<(number | null)[]> ([]);
    const [submitted, setSubmitted] = useState(false);

    const handleAnswerSelect = (cardIndex: number, selectedOption: number) => {
        const newSelections = [...selections];
        while (newSelections.length < cardIndex) {
            newSelections.push(null);
        }
        newSelections[cardIndex] = selectedOption;
        setSelections(newSelections);
    }

    return (
        <div> 
            {props.cards.map((card, index: number) => (
                <div key={card.question}> 
                <Flashcard 
                    question={card.question}
                    options={card.options} 
                    correctAnswer={card.correctAnswer}
                    onAnswerSelect={(selectedOption) => handleAnswerSelect(index, selectedOption)}
                    cardId={index}
                /> 
                </div>
            ))}

            <button 
                onClick={() => setSubmitted(true)} 
                disabled={selections.some(selection => selection === null)}
            >
                Submit
            </button>
            
            {submitted && (
                <div style={{ marginTop: '20px' }}>
                    {props.cards.map((card, index) => (
                        <div key={`result-${index}`} style={{
                        color: selections[index] === card.correctAnswer ? 'green' : 'red',
                        fontWeight: 'bold',
                        margin: '5px 0'
                        }}>
                        Question {index + 1}: {selections[index] === card.correctAnswer ? 'Correct!' : 'Wrong!'}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default FlashcardList;