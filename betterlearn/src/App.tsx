import { useState } from 'react'
import './App.css'

function App() {
  const [userInput, setInput] = useState<string>("")
  const [results, setResults] = useState<{question: string; answer: string}[]>([])

  const handleSubmit = async(e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent page reload
    console.log("Loading: ", userInput);

    // Send the userInput to the backend later
    const res = await fetch("http://localhost:8000/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({topic: userInput})
    })

    const data = await res.json()

    setResults(data)
  }

  return (
    <>
      <div className="topicIn">
        <form onSubmit={handleSubmit}> 
          <input
            type = "text"
            value = {userInput}
            onChange = {(e) => setInput(e.target.value)}
            placeholder='Enter a topic...'
            />
            <button type = "submit">Generate Flashcards</button>
        </form>
      </div>

    </>
  )
}

export default App
