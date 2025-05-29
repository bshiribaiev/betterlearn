import { useState } from 'react'
import TopicForm from './components/TopicForm'
import FlashcardList from './components/FlashcardList'
import type { FlashcardType } from './types/types'
import './App.css'


function App() {
  const [flashcards, setFlashcards] = useState<FlashcardType[]>([]);
  const [currentTopic, setCurrentTopic] = useState<string>(''); // Add this

  const handleTopicSubmit = async (topic: string) => {
    try {
      const res = await fetch('http://localhost:8000/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({topic}),
      });

      const data = await res.json();
      setFlashcards(data);
      setCurrentTopic(topic); // Add this
    } catch (err) {
      console.error("Failed to fetch flashcards", err);
    }
  };

  return (
    <>
      <div>
        <h1>Boost Your Learning</h1>
        <TopicForm onSubmit={handleTopicSubmit} />
        <FlashcardList cards={flashcards} topicName={currentTopic} />
      </div>
    </>
  )
}

export default App
