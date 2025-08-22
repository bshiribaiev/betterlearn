import { useState } from 'react'

type TopicFormProps = {
    onSubmit: (topic: string) => void;
}

function TopicForm(props: TopicFormProps) {
    const [topic, setTopic] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTopic(e.target.value);
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        props.onSubmit(topic)
    }

    return (
        <div> 
            <form onSubmit={handleSubmit}>
                <input 
                type = "text" 
                value={topic}
                onChange={handleChange}
                placeholder='Enter your topic'
                />
                <button type="submit">Generate</button>
            </form>
        </div>
    )
}
export default TopicForm;