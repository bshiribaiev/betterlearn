import { useState, useEffect } from 'react';

type Topic = {
  id: number;
  name: string;
  status: string;
  next_review_at: string | null;
  current_interval: number;
  total_reviews: number;
  review_status: string;
  days_until_review: number;
};

function TopicsDashboard() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const response = await fetch('http://localhost:8000/topics');
      const data = await response.json();
      setTopics(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch topics:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'great': return 'green';
      case 'good': return 'orange';
      case 'bad': return 'red';
      case 'new': return 'blue';
      default: return 'gray';
    }
  };

  if (loading) return <div>Loading topics...</div>;

  return (
    <div>
      <h2>Topics Dashboard</h2>
      {topics.map(topic => (
        <div key={topic.id} style={{
          border: '1px solid #ccc',
          margin: '10px 0',
          padding: '15px',
          borderRadius: '5px'
        }}>
          <h3>{topic.name}</h3>
          <p style={{ color: getStatusColor(topic.status), fontWeight: 'bold' }}>
            Status: {topic.status.toUpperCase()}
          </p>
          <p>Reviews completed: {topic.total_reviews}</p>
          <p>
            {topic.review_status === 'new' 
              ? 'Never reviewed' 
              : topic.days_until_review < 1 
                ? 'Due for review!' 
                : `Next review in ${Math.ceil(topic.days_until_review)} days`
            }
          </p>
        </div>
      ))}
    </div>
  );
}

export default TopicsDashboard;