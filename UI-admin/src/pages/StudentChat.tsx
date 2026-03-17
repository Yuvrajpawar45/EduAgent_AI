import { useState } from 'react';
import type { FormEvent } from 'react';
import { Loader2, Send, User, Bot } from 'lucide-react';
import Card from '../components/Card';
import { Button, Input } from '../components/FormField';
import { sendChat } from '../lib/api';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const quickPrompts = [
  'When are the upcoming semester exams?',
  'What is the complete fee structure?',
  'What is the minimum attendance requirement?',
  'What scholarships are available for students?',
];

export default function StudentChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Hello! I am EduAgent AI. Ask me anything about exams, fees, attendance, scholarships, admissions, or policies.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (raw?: string) => {
    const message = (raw ?? input).trim();
    if (!message || loading) return;

    setError('');
    setLoading(true);
    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    setInput('');

    try {
      const result = await sendChat(message);
      setMessages((prev) => [...prev, { role: 'assistant', content: result.answer }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message.');
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Could not connect to backend. Check API server and try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await submit();
  };

  return (
    <div className="min-h-screen bg-cream-50">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-800">Student Chat</h1>
            <p className="text-xs text-slate-400 -mt-0.5">EduAgent AI Assistant</p>
          </div>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-8 space-y-6">
        <Card title="Ask EduAgent" subtitle="Powered by your existing local model and agents">
          <div className="space-y-4">
            <div className="h-[460px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-burgundy-500 text-white rounded-br-md'
                        : 'bg-slate-50 text-slate-700 border border-slate-200 rounded-bl-md'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs mb-1 opacity-80">
                      {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                      <span>{msg.role === 'user' ? 'You' : 'EduAgent'}</span>
                    </div>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 text-sm text-slate-600 inline-flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    EduAgent is thinking...
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => submit(prompt)}
                  className="text-xs px-3 py-2 rounded-lg bg-burgundy-50 text-burgundy-600 hover:bg-burgundy-100 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <form className="flex gap-2" onSubmit={onSubmit}>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your academic question..."
              />
              <Button variant="primary" type="submit" disabled={loading}>
                <Send size={14} />
                Send
              </Button>
            </form>

            {error && <p className="text-sm text-danger">{error}</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
