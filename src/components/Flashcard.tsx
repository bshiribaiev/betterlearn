import {useState} from 'react'
import type { FlashcardType } from '../types/types'

function Flashcard(props: FlashcardProps) {
  const [showAnswer, setShowAnswer] = useState(false);
  const handleClick= () => {
    setShowAnswer(current => !current);
  }

  return (
    <div className="card">
      <h3>{props.question}</h3>
      
      <button onClick={handleClick}> 
        {showAnswer ? 'Hide answer' : 'Show answer'}
      </button>

      {showAnswer && <p>{props.answer}</p>}
    </div>
  )
}

export default Flashcard;