import { useState } from 'react'
import type { FlashcardType } from '../types/types'

function Flashcard(props: FlashcardType) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  //const [submitted, setSubmitted] = useState(false);

  const handleOptionClick = (optionIndex: number) => {
    setSelectedOption(optionIndex);
    props.onAnswerSelect(optionIndex);
  }

  console.log('Flashcard props:', {
    disabled: props.disabled,
    cardId: props.cardId
  });

  return (
    <div> 
    <div className="card">
      <h3>{props.question}</h3>
      <div> 
      <input
      type="radio"
      disabled={props.disabled}
      id={`option0-${props.cardId}`}
      name={`flashcard-options-${props.cardId}`}
      value="0"
      onChange={() => handleOptionClick(0)}
      />
      <label htmlFor="option0">{props.options[0]}</label>
      </div>

      <div> 
      <input
      type="radio"
      disabled={props.disabled}
      id={`option1-${props.cardId}`}
      name={`flashcard-options-${props.cardId}`}
      value="1"
      onChange={() => handleOptionClick(1)}
      />
      <label htmlFor="option1">{props.options[1]}</label>
      </div>

      <div> 
      <input
      type="radio"
      disabled={props.disabled}
      id={`option2-${props.cardId}`}
      name={`flashcard-options-${props.cardId}`}
      value="2"
      onChange={() => handleOptionClick(2)}
      />
      <label htmlFor="option2">{props.options[2]}</label>
      </div>

      <div> 
      <input
      type="radio"
      disabled={props.disabled}
      id={`option3-${props.cardId}`}
      name={`flashcard-options-${props.cardId}`}
      value="3"
      onChange={() => handleOptionClick(3)}
      />
      <label htmlFor="option3">{props.options[3]}</label>
    </div>
    </div>

    {/* <button onClick={handleSubmit} disabled={selectedOption === null}>
      Submit
    </button>

    {submitted && (
      <div style={{
        color: selectedOption === props.correctAnswer ? 'green' : 'red',
        fontWeight: 'bold',
        marginTop: '10px'
      }}>
        {selectedOption === props.correctAnswer ? 'Correct!' : 'Wrong!'}
     </div>
    )} */}
    </div>
  )
}

export default Flashcard;