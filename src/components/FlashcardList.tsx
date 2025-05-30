import Flashcard from "./Flashcard";
import type { FlashcardType } from '../types/types'
import { useState, useEffect } from 'react'

type FlashcardListProps = {
    cards: FlashcardType[];
    topicName: string;
}
function FlashcardList(props: FlashcardListProps) {
    const [selections, setSelections] = useState<(number | null)[]> ([]);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        setSubmitted(false);
        setSelections([]); // Also reset selections
    }, [props.cards]);

    const handleAnswerSelect = (cardIndex: number, selectedOption: number) => {
        const newSelections = [...selections];
        while (newSelections.length < cardIndex) {
            newSelections.push(null);
        }
        newSelections[cardIndex] = selectedOption;
        setSelections(newSelections);
    }

    const handleSubmit = async () => {
        setSubmitted(true);
        
        // Calculate how many they got correct
        const correctCount = selections.reduce((count, selection, index) => {
            if (selection !== null && selection === props.cards[index].correctAnswer) {
                return count + 1;
            }
            return count;
        }, 0);
        
        // Send results to backend
        try {
            const response = await fetch('http://localhost:8000/submit-review', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    topic_name: props.topicName,
                    total_questions: props.cards.length,
                    correct_answers: correctCount
                }),
            });
            
            const result = await response.json();
            console.log('Review recorded:', result);
        } catch (error) {
            console.error('Failed to record review:', error);
        }
    };

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
                disabled={submitted} 
/>  
                </div>
            ))}

                <button 
                onClick={handleSubmit}  // Change from () => setSubmitted(true) to handleSubmit
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