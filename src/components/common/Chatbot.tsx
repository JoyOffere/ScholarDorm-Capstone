import React, { useEffect, useState, useRef } from 'react';
import { SendIcon, XIcon, MinimizeIcon, MaximizeIcon, UserIcon, BotIcon, PaperclipIcon, MicIcon, ThumbsUpIcon, ThumbsDownIcon, MessageSquareIcon } from 'lucide-react';
interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  suggestions?: string[];
}
export const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([{
    id: '1',
    content: "👋 Hello! I'm ScholarBot, your learning assistant. How can I help you today?",
    sender: 'bot',
    timestamp: new Date(),
    suggestions: ['How do I enroll in a course?', 'What are learning streaks?', 'How do I earn badges?', 'Tell me about RSL support']
  }]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatBodyRef = useRef<HTMLDivElement>(null);
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [messages]);
  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, isMinimized]);
  const toggleChatbot = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsMinimized(false);
    }
  };
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!message.trim()) return;
    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsTyping(true);
    // Simulate bot response
    setTimeout(() => {
      const botResponse = generateResponse(message);
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };
  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
    handleSendMessage();
  };
  const generateResponse = (userInput: string): Message => {
    const input = userInput.toLowerCase();
    let content = '';
    let suggestions: string[] = [];
    // Simple response logic based on keywords
    if (input.includes('course') || input.includes('enroll')) {
      content = "To enroll in a course, navigate to the Courses section from your dashboard. Browse available courses, click on one you're interested in, and press the 'Enroll' button. You can track your enrolled courses from your dashboard.";
      suggestions = ['What courses are available?', 'Are there prerequisites?', 'How do I track progress?'];
    } else if (input.includes('streak') || input.includes('daily')) {
      content = "Learning streaks track your daily learning activity. Log in and complete at least one lesson every day to build your streak. You'll earn special badges at 3, 7, 14, and 30-day streaks. Don't break your streak!";
      suggestions = ['What happens if I miss a day?', 'How do streak badges work?', "What's the longest streak record?"];
    } else if (input.includes('badge') || input.includes('achievement')) {
      content = 'Badges are achievements you earn for completing specific goals. Some badges are awarded for course completion, maintaining learning streaks, perfect quiz scores, and other learning milestones. Check your profile to see your earned badges.';
      suggestions = ['How many badges are there?', "What's the rarest badge?", 'Can I share my badges?'];
    } else if (input.includes('rsl') || input.includes('sign language')) {
      content = 'ScholarDorm provides Rwandan Sign Language (RSL) support throughout the platform. You can find RSL videos for courses, toggle RSL features in your accessibility settings, and access comprehensive RSL resources in the dedicated RSL section.';
      suggestions = ['Where are the RSL videos?', 'How do I enable RSL features?', 'Are there RSL learning materials?'];
    } else {
      content = "Thanks for your message! I can help with information about courses, learning features, achievements, and platform navigation. Could you please tell me more about what you're looking for?";
      suggestions = ['Tell me about courses', 'How do achievements work?', 'I need technical help', 'What learning tools are available?'];
    }
    return {
      id: Date.now().toString(),
      content,
      sender: 'bot',
      timestamp: new Date(),
      suggestions
    };
  };
  return <>
      {/* Chat toggle button */}
      <button onClick={toggleChatbot} className={`fixed z-50 bottom-5 right-5 rounded-full shadow-lg p-3.5 transition-all duration-300 flex items-center justify-center ${isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'}`} aria-label={isOpen ? 'Close chat' : 'Open chat'}>
        {isOpen ? <XIcon className="h-6 w-6 text-white" /> : <MessageSquareIcon className="h-6 w-6 text-white" />}
      </button>

      {/* Chat window */}
      {isOpen && <div className={`fixed z-40 transition-all duration-300 shadow-xl rounded-lg overflow-hidden flex flex-col
            ${isMinimized ? 'bottom-20 right-5 w-72 h-14' : 'bottom-20 right-5 w-[95%] sm:w-80 md:w-96 h-[450px] max-h-[80vh]'}`}>
          {/* Header */}
          <div className="bg-blue-600 text-white p-3 flex justify-between items-center">
            <div className="flex items-center">
              <div className="bg-white rounded-full p-1 mr-2">
                <BotIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-sm">ScholarBot</h3>
                {!isMinimized && <p className="text-xs text-blue-100">Learning Assistant</p>}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={toggleMinimize} className="text-white hover:text-blue-100" aria-label={isMinimized ? 'Expand chat' : 'Minimize chat'}>
                {isMinimized ? <MaximizeIcon className="h-4 w-4" /> : <MinimizeIcon className="h-4 w-4" />}
              </button>
              <button onClick={toggleChatbot} className="text-white hover:text-blue-100" aria-label="Close chat">
                <XIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!isMinimized && <>
              {/* Chat body */}
              <div ref={chatBodyRef} className="flex-1 bg-gray-50 p-3 overflow-y-auto flex flex-col space-y-3">
                {messages.map(msg => <div key={msg.id} className={`${msg.sender === 'user' ? 'self-end' : 'self-start'} max-w-[85%]`}>
                    {msg.sender === 'user' ? <div className="bg-blue-600 text-white px-3 py-2 rounded-tl-lg rounded-tr-lg rounded-bl-lg">
                        <p className="text-sm whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      </div> : <div className="space-y-2">
                        <div className="bg-white border border-gray-200 px-3 py-2 rounded-tl-lg rounded-tr-lg rounded-br-lg shadow-sm">
                          <p className="text-sm whitespace-pre-wrap">
                            {msg.content}
                          </p>
                        </div>
                        {msg.suggestions && msg.suggestions.length > 0 && <div className="flex flex-wrap gap-1">
                            {msg.suggestions.map((suggestion, i) => <button key={i} onClick={() => handleSuggestionClick(suggestion)} className="text-xs bg-white border border-gray-300 rounded-full px-2 py-1 hover:bg-gray-100 text-gray-700">
                                {suggestion}
                              </button>)}
                          </div>}
                        <div className="flex items-center space-x-1">
                          <button className="text-gray-400 hover:text-gray-600 p-1">
                            <ThumbsUpIcon className="h-3 w-3" />
                          </button>
                          <button className="text-gray-400 hover:text-gray-600 p-1">
                            <ThumbsDownIcon className="h-3 w-3" />
                          </button>
                        </div>
                      </div>}
                  </div>)}
                {isTyping && <div className="self-start">
                    <div className="bg-white border border-gray-200 px-3 py-2 rounded-tl-lg rounded-tr-lg rounded-br-lg shadow-sm">
                      <div className="flex space-x-1 items-center h-5">
                        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{
                  animationDelay: '0ms'
                }}></div>
                        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{
                  animationDelay: '150ms'
                }}></div>
                        <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{
                  animationDelay: '300ms'
                }}></div>
                      </div>
                    </div>
                  </div>}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <form onSubmit={handleSendMessage} className="bg-white border-t border-gray-200 p-2 flex items-center">
                <div className="flex-1 relative">
                  <input ref={inputRef} type="text" value={message} onChange={e => setMessage(e.target.value)} placeholder="Type your message..." className="w-full border border-gray-300 rounded-l-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" disabled={isTyping} />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                    <button type="button" className="text-gray-400 hover:text-gray-600">
                      <PaperclipIcon className="h-4 w-4" />
                    </button>
                    <button type="button" className="text-gray-400 hover:text-gray-600">
                      <MicIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={!message.trim() || isTyping} className="bg-blue-600 text-white rounded-r-lg py-2 px-3 disabled:opacity-50 hover:bg-blue-700">
                  <SendIcon className="h-4 w-4" />
                </button>
              </form>
            </>}
        </div>}
    </>;
};