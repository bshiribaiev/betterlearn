type Flashcard = {
    question: string;
    answer: string;
};

type FlashcardListProps = {
    cards: Flashcard[];
};


function cardList(props: FlashcardListProps) {
    return (
        <div> 
            {props.cards.map(card => (
                <div key = {card.question}>
                    <h3>{card.question}</h3>
                    <p>{card.question}</p>
                </div>
            ))}
        </div>
    )
}

export default cardList