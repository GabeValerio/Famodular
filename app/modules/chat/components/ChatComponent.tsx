import React, { useState, useEffect, useRef } from 'react';
import { FamilyMember, Message } from '../types';
import { Send, Sparkles, Bot, User } from 'lucide-react';

interface ChatComponentProps {
  messages: Message[];
  members: FamilyMember[];
  currentUser: FamilyMember;
  onSendMessage: (text: string) => Promise<void>;
  onDeleteMessage?: (id: string) => Promise<void>;
}

export const ChatComponent: React.FC<ChatComponentProps> = ({ messages, members, currentUser, onSendMessage, onDeleteMessage }) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    await onSendMessage(inputText);
    setInputText('');
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Chat Header */}
      <div className="bg-white border-b border-slate-100 p-4 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            Family Chat
          </h3>
          <p className="text-xs text-slate-400">
            {members.length} members • AI Assistant active
          </p>
        </div>
        <div className="flex -space-x-2">
           {members.map(m => (
             <img key={m.id} src={m.avatar} alt={m.name} className="w-8 h-8 rounded-full border-2 border-white" />
           ))}
           <div className="w-8 h-8 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center text-indigo-600">
             <Bot size={16} />
           </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => {
          const isCurrentUser = message.senderId === currentUser.id;
          const isAI = message.senderId === 'ai';
          const sender = isAI ? { name: 'Family Assistant', avatar: '' } : members.find(m => m.id === message.senderId);

          if (!sender) return null;

          return (
            <div key={message.id} className={`flex gap-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
              {!isCurrentUser && (
                <div className="flex-shrink-0">
                  {isAI ? (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                      <Bot size={16} />
                    </div>
                  ) : (
                    <img src={sender.avatar} alt={sender.name} className="w-8 h-8 rounded-full" />
                  )}
                </div>
              )}

              <div className={`max-w-[70%] ${isCurrentUser ? 'order-first' : ''}`}>
                {!isCurrentUser && (
                  <div className="text-xs text-slate-500 mb-1 flex items-center gap-2">
                    {isAI ? (
                      <>
                        <Bot size={12} className="text-indigo-600" />
                        {sender.name}
                      </>
                    ) : (
                      sender.name
                    )}
                    <span className="text-slate-400">•</span>
                    <span>{formatTime(message.timestamp)}</span>
                  </div>
                )}

                <div className={`rounded-2xl px-4 py-2 ${
                  isAI
                    ? 'bg-indigo-50 border border-indigo-100 text-indigo-900'
                    : isCurrentUser
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-800'
                }`}>
                  <p className="text-sm leading-relaxed">{message.text}</p>
                </div>

                {isCurrentUser && (
                  <div className="text-xs text-slate-400 mt-1 text-right">
                    {formatTime(message.timestamp)}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-100 p-4">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message... (mention 'ai' for AI help)"
              className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              type="button"
              className="absolute right-2 top-2 p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Trigger AI response"
            >
              <Sparkles size={16} />
            </button>
          </div>
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};
