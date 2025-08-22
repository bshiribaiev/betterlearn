import { useState } from 'react'
import TopicForm from './components/TopicForm'
import FlashcardList from './components/FlashcardList'
import type { FlashcardType } from './types/types'
import './App.css'
import TopicsDashboard from './components/TopicsDashboard'
import Navbar from './components/Navbar'


function App() {
  const [flashcards, setFlashcards] = useState<FlashcardType[]>([]);
  const [currentTopic, setCurrentTopic] = useState<string>('');
  const [currentView, setCurrentView] = useState('dashboard');

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

  const handleStartReview = async (topicName: string) => {
    try {
      const response = await fetch(`http://localhost:8000/review/${topicName}`);
      const data = await response.json();
      
      if (data.error) {
        console.error('Error loading flashcards:', data.error);
        return;
      }
      
      setFlashcards(data);
      setCurrentTopic(topicName);
      setCurrentView('generate'); // Switch to flashcard view
    } catch (error) {
      console.error('Failed to load flashcards for review:', error);
    }
  };

  return (
    <>
      <Navbar currentView={currentView} onViewChange={setCurrentView} />
      
      <div style={{ paddingTop: '80px', padding: '80px 20px 20px 20px' }}>
        <h1>Boost Your Learning</h1>
        
        {currentView === 'dashboard' && (
          <TopicsDashboard onStartReview={handleStartReview} />
        )}
        {currentView === 'generate' && (
          <>
            <TopicForm onSubmit={handleTopicSubmit} />
            <FlashcardList cards={flashcards} topicName={currentTopic} />
          </>
        )}
      </div>
    </>
  );
}

export default App
