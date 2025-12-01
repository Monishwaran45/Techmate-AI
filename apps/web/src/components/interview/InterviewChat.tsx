import { useState } from 'react';

interface Message {
  role: 'interviewer' | 'candidate';
  content: string;
}

export function InterviewChat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'interviewer', content: 'Hello! Let\'s begin the interview. Tell me about yourself.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const candidateMessage: Message = { role: 'candidate', content: input };
    setMessages([...messages, candidateMessage]);
    setInput('');
    setLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const interviewerMessage: Message = {
        role: 'interviewer',
        content: 'That\'s interesting. Can you elaborate on that?',
      };
      setMessages((prev) => [...prev, interviewerMessage]);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-[600px] bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600">
      <div className="p-4 border-b border-gray-300 dark:border-gray-600">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Mock Interview</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">Practice your interview skills</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'candidate' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === 'candidate'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
              <span className="text-gray-600 dark:text-gray-400">Interviewer is thinking...</span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-300 dark:border-gray-600">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your answer..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
