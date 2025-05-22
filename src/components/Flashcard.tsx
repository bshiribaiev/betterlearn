type flashcardProps = {
  question: string;
  answer: string;
};

function Flashcard(props: flashcardProps) {
  return (
    <div className="card">
      <h3>{props.question}</h3>
      <p>{props.answer}</p>
    </div>
  )
}

export default Flashcard;