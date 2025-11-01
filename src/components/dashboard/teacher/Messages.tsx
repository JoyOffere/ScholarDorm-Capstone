import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Send, Search, MoreVertical, Phone, Video,
  Paperclip, Smile, User, Circle, Clock, Check, CheckCheck,
  Star, Archive, Trash2, Filter, UserPlus, Settings,
  Image, File, Download, Eye, MessageSquare, Users
} from 'lucide-react';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'announcement';
  attachment_url?: string;
  attachment_name?: string;
  attachment_type?: string;
  sent_at: string;
  is_read: boolean;
  sender: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
    role: string;
  };
}

interface Conversation {
  id: string;
  title?: string;
  type: 'direct' | 'group' | 'class';
  last_message?: Message;
  unread_count: number;
  participants: ConversationParticipant[];
  created_at: string;
  updated_at: string;
}

interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  user: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
    role: string;
  };
}

interface NewConversation {
  title: string;
  type: 'direct' | 'group' | 'class';
  participants: string[];
}

export const TeacherMessages: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<Array<{
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
    role: string;
  }>>([]);

  const [newConversationData, setNewConversationData] = useState<NewConversation>({
    title: '',
    type: 'direct',
    participants: []
  });

  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    fetchConversations();
    fetchAvailableUsers();
    
    // Set up real-time subscriptions
    const conversationsSubscription = supabase
      .channel('conversations')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'conversations' },
        () => fetchConversations()
      )
      .subscribe();

    const messagesSubscription = supabase
      .channel('messages')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMessage = payload.new as any;
          if (activeConversation && newMessage.conversation_id === activeConversation.id) {
            fetchMessages(activeConversation.id);
          }
          fetchConversations(); // Update last message and unread counts
        }
      )
      .subscribe();

    return () => {
      conversationsSubscription.unsubscribe();
      messagesSubscription.unsubscribe();
    };
  }, [activeConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      // Since messaging tables don't exist yet, create conversations from students
      // that are enrolled in the teacher's courses
      const { data: teacherCourses, error: coursesError } = await supabase
        .from('teacher_course_assignments')
        .select('course_id')
        .eq('teacher_id', user.id);

      if (coursesError) throw coursesError;

      const courseIds = teacherCourses?.map(tc => tc.course_id) || [];

      if (courseIds.length === 0) {
        setConversations([]);
        return;
      }

      // Get students enrolled in teacher's courses
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select(`
          user_id,
          users!user_id(
            id,
            full_name,
            email,
            avatar_url,
            role
          )
        `)
        .in('course_id', courseIds)
        .eq('users.role', 'student');

      if (enrollmentsError) throw enrollmentsError;

      // Create mock conversations with each student
      const mockConversations: Conversation[] = enrollments?.map((enrollment) => {
        const student = Array.isArray(enrollment.users) ? enrollment.users[0] : enrollment.users;
        return {
          id: `conv_${user.id}_${student.id}`,
          title: student.full_name,
          type: 'direct' as const,
          last_message: {
            id: `msg_${Date.now()}`,
            conversation_id: `conv_${user.id}_${student.id}`,
            sender_id: student.id,
            content: 'Hello! I have a question about the course...',
            message_type: 'text' as const,
            sent_at: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
            is_read: Math.random() > 0.3,
            sender: {
              id: student.id,
              full_name: student.full_name,
              email: student.email,
              avatar_url: student.avatar_url,
              role: student.role
            }
          } as Message,
          unread_count: Math.floor(Math.random() * 4),
          participants: [
            {
              id: `participant_${user.id}`,
              conversation_id: `conv_${user.id}_${student.id}`,
              user_id: user.id,
              role: 'admin' as const,
              joined_at: new Date().toISOString(),
              user: {
                id: user.id,
                full_name: user.email?.split('@')[0] || 'Teacher',
                email: user.email || '',
                avatar_url: undefined,
                role: 'teacher'
              }
            },
            {
              id: `participant_${student.id}`,
              conversation_id: `conv_${user.id}_${student.id}`,
              user_id: student.id,
              role: 'member' as const,
              joined_at: new Date().toISOString(),
              user: {
                id: student.id,
                full_name: student.full_name,
                email: student.email,
                avatar_url: student.avatar_url,
                role: student.role
              }
            }
          ],
          created_at: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
          updated_at: new Date().toISOString()
        };
      }) || [];

      // Sort by last message time
      mockConversations.sort((a, b) => {
        const aTime = a.last_message?.sent_at || a.updated_at;
        const bTime = b.last_message?.sent_at || b.updated_at;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

      setConversations(mockConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      // Since messaging tables don't exist, generate mock messages for the conversation
      const conversation = conversations.find(c => c.id === conversationId);
      if (!conversation) return;

      const otherParticipant = conversation.participants.find(p => p.user_id !== user?.id);
      if (!otherParticipant) return;

      // Generate mock conversation messages
      const mockMessages: Message[] = [
        {
          id: `msg_1_${conversationId}`,
          conversation_id: conversationId,
          sender_id: otherParticipant.user_id,
          content: "Hello! I have a question about the latest assignment.",
          message_type: 'text',
          sent_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          is_read: true,
          sender: otherParticipant.user
        },
        {
          id: `msg_2_${conversationId}`,
          conversation_id: conversationId,
          sender_id: user?.id || '',
          content: "Hi! I'd be happy to help. What specifically are you having trouble with?",
          message_type: 'text',
          sent_at: new Date(Date.now() - 86400000 * 2 + 3600000).toISOString(),
          is_read: true,
          sender: {
            id: user?.id || '',
            full_name: user?.email?.split('@')[0] || 'Teacher',
            email: user?.email || '',
            avatar_url: undefined,
            role: 'teacher'
          }
        },
        {
          id: `msg_3_${conversationId}`,
          conversation_id: conversationId,
          sender_id: otherParticipant.user_id,
          content: "I'm not sure how to approach problem #3. Could you provide some guidance?",
          message_type: 'text',
          sent_at: new Date(Date.now() - 86400000 + 7200000).toISOString(),
          is_read: true,
          sender: otherParticipant.user
        },
        {
          id: `msg_4_${conversationId}`,
          conversation_id: conversationId,
          sender_id: user?.id || '',
          content: "Sure! For problem #3, try breaking it down into smaller steps. Start by identifying what information you have and what you need to find.",
          message_type: 'text',
          sent_at: new Date(Date.now() - 86400000 + 10800000).toISOString(),
          is_read: true,
          sender: {
            id: user?.id || '',
            full_name: user?.email?.split('@')[0] || 'Teacher',
            email: user?.email || '',
            avatar_url: undefined,
            role: 'teacher'
          }
        }
      ];

      setMessages(mockMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchAvailableUsers = async () => {
    if (!user) return;

    try {
      // Get all students for now - in a real app you'd want to filter by teacher's courses
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, avatar_url, role')
        .eq('role', 'student')
        .limit(20);

      if (error) throw error;

      setAvailableUsers(data || []);
    } catch (error) {
      console.error('Error fetching available users:', error);
    }
  };

  const selectConversation = (conversation: Conversation) => {
    setActiveConversation(conversation);
    fetchMessages(conversation.id);
  };

  const sendMessage = async () => {
    if (!user || !activeConversation || !newMessage.trim()) return;
    
    try {
      setIsSending(true);

      // Create a new mock message
      const newMockMessage: Message = {
        id: `msg_${Date.now()}_${Math.random()}`,
        conversation_id: activeConversation.id,
        sender_id: user.id,
        content: newMessage.trim(),
        message_type: 'text',
        sent_at: new Date().toISOString(),
        is_read: false,
        sender: {
          id: user.id,
          full_name: user.email?.split('@')[0] || 'Teacher',
          email: user.email || '',
          avatar_url: undefined,
          role: 'teacher'
        }
      };

      // Add the message to the current messages
      setMessages(prev => [...prev, newMockMessage]);
      
      // Update the conversation's last message
      setConversations(prev => prev.map(conv => 
        conv.id === activeConversation.id 
          ? { ...conv, last_message: newMockMessage, updated_at: new Date().toISOString() }
          : conv
      ));

      setNewMessage('');
      
      // Simulate a response from the student after a short delay
      setTimeout(() => {
        if (activeConversation) {
          const otherParticipant = activeConversation.participants.find(p => p.user_id !== user.id);
          if (otherParticipant) {
            const responseMessage: Message = {
              id: `msg_${Date.now() + 1}_${Math.random()}`,
              conversation_id: activeConversation.id,
              sender_id: otherParticipant.user_id,
              content: "Thank you for your help! That really clarifies things for me.",
              message_type: 'text',
              sent_at: new Date().toISOString(),
              is_read: false,
              sender: otherParticipant.user
            };
            
            setMessages(prev => [...prev, responseMessage]);
            setConversations(prev => prev.map(conv => 
              conv.id === activeConversation.id 
                ? { ...conv, last_message: responseMessage, updated_at: new Date().toISOString() }
                : conv
            ));
          }
        }
      }, 2000);

    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const createConversation = async () => {
    if (!user || !newConversationData.participants.length) return;

    try {
      // For now, just alert that this feature needs messaging tables
      alert('Creating new conversations requires proper messaging tables to be implemented in the database.');
      
      // Reset form and close modal
      setNewConversationData({
        title: '',
        type: 'direct',
        participants: []
      });
      setShowNewConversation(false);
    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Failed to create conversation');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getConversationTitle = (conversation: Conversation) => {
    if (conversation.title) return conversation.title;
    
    const otherParticipants = conversation.participants.filter(p => p.user_id !== user?.id);
    if (otherParticipants.length === 1) {
      return otherParticipants[0].user.full_name;
    }
    return `Group (${otherParticipants.length} members)`;
  };

  const getConversationAvatar = (conversation: Conversation) => {
    const otherParticipants = conversation.participants.filter(p => p.user_id !== user?.id);
    if (otherParticipants.length === 1 && otherParticipants[0].user.avatar_url) {
      return otherParticipants[0].user.avatar_url;
    }
    return null;
  };

  const filteredConversations = conversations.filter(conversation =>
    searchQuery === '' || 
    getConversationTitle(conversation).toLowerCase().includes(searchQuery.toLowerCase()) ||
    conversation.last_message?.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <DashboardLayout role="teacher" title="Messages">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading conversations...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="teacher" title="Messages">
      <div className="h-[calc(100vh-8rem)] flex bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Conversations Sidebar */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
              <button
                onClick={() => setShowNewConversation(true)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <UserPlus size={20} />
              </button>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search conversations..."
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Conversations</h3>
                <p className="text-gray-600">Start a new conversation with your students</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredConversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => selectConversation(conversation)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                      activeConversation?.id === conversation.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative flex-shrink-0">
                        {getConversationAvatar(conversation) ? (
                          <img
                            src={getConversationAvatar(conversation)!}
                            alt=""
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            {conversation.type === 'group' ? (
                              <Users className="w-5 h-5 text-gray-500" />
                            ) : (
                              <User className="w-5 h-5 text-gray-500" />
                            )}
                          </div>
                        )}
                        {conversation.unread_count > 0 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                            <span className="text-xs text-white font-medium">
                              {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {getConversationTitle(conversation)}
                          </h3>
                          {conversation.last_message && (
                            <span className="text-xs text-gray-500">
                              {formatTime(conversation.last_message.sent_at)}
                            </span>
                          )}
                        </div>
                        {conversation.last_message && (
                          <p className="text-sm text-gray-600 truncate mt-1">
                            {conversation.last_message.sender_id === user?.id ? 'You: ' : ''}
                            {conversation.last_message.message_type === 'text' 
                              ? conversation.last_message.content
                              : `Sent ${conversation.last_message.message_type === 'image' ? 'an image' : 'a file'}`}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getConversationAvatar(activeConversation) ? (
                    <img
                      src={getConversationAvatar(activeConversation)!}
                      alt=""
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      {activeConversation.type === 'group' ? (
                        <Users className="w-5 h-5 text-gray-500" />
                      ) : (
                        <User className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {getConversationTitle(activeConversation)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {activeConversation.participants.length} participant{activeConversation.participants.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <Phone size={20} />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <Video size={20} />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreVertical size={20} />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                <AnimatePresence>
                  {messages.map((message) => {
                    const isOwnMessage = message.sender_id === user?.id;
                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                          {!isOwnMessage && (
                            <div className="flex-shrink-0">
                              {message.sender.avatar_url ? (
                                <img
                                  src={message.sender.avatar_url}
                                  alt=""
                                  className="w-6 h-6 rounded-full"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                  <User className="w-3 h-3 text-gray-500" />
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className={`px-4 py-2 rounded-lg ${
                            isOwnMessage 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-100 text-gray-900'
                          }`}>
                            {message.message_type === 'image' && message.attachment_url && (
                              <div className="mb-2">
                                <img
                                  src={message.attachment_url}
                                  alt={message.attachment_name}
                                  className="max-w-full h-auto rounded"
                                />
                              </div>
                            )}
                            
                            {message.message_type === 'file' && message.attachment_url && (
                              <div className="mb-2 flex items-center space-x-2 p-2 bg-black bg-opacity-10 rounded">
                                <File size={16} />
                                <span className="text-sm truncate">{message.attachment_name}</span>
                                <a
                                  href={message.attachment_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-300 hover:text-blue-100"
                                >
                                  <Download size={14} />
                                </a>
                              </div>
                            )}
                            
                            <p className="text-sm">{message.content}</p>
                            
                            <div className={`flex items-center justify-end space-x-1 mt-1 ${
                              isOwnMessage ? 'text-blue-200' : 'text-gray-500'
                            }`}>
                              <span className="text-xs">
                                {formatTime(message.sent_at)}
                              </span>
                              {isOwnMessage && (
                                message.is_read ? (
                                  <CheckCheck size={12} />
                                ) : (
                                  <Check size={12} />
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                {attachmentFile && (
                  <div className="mb-3 p-2 bg-gray-50 rounded flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {attachmentFile.type.startsWith('image/') ? (
                        <Image size={16} className="text-gray-500" />
                      ) : (
                        <File size={16} className="text-gray-500" />
                      )}
                      <span className="text-sm text-gray-700 truncate">{attachmentFile.name}</span>
                    </div>
                    <button
                      onClick={() => setAttachmentFile(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <label className="cursor-pointer p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <input
                      type="file"
                      onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.txt"
                    />
                    <Paperclip size={20} />
                  </label>
                  
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Type a message..."
                      disabled={isSending}
                    />
                  </div>
                  
                  <button
                    onClick={sendMessage}
                    disabled={isSending || (!newMessage.trim() && !attachmentFile)}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Conversation</h3>
                <p className="text-gray-600">Choose a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>

        {/* New Conversation Modal */}
        {showNewConversation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">New Conversation</h2>
                  <button
                    onClick={() => setShowNewConversation(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <ArrowLeft size={24} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Conversation Type
                  </label>
                  <select
                    value={newConversationData.type}
                    onChange={(e) => setNewConversationData(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="direct">Direct Message</option>
                    <option value="group">Group Chat</option>
                    <option value="class">Class Discussion</option>
                  </select>
                </div>

                {newConversationData.type !== 'direct' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Conversation Title
                    </label>
                    <input
                      type="text"
                      value={newConversationData.title}
                      onChange={(e) => setNewConversationData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter conversation title"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Participants
                  </label>
                  <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md">
                    {availableUsers.map((user) => (
                      <label
                        key={user.id}
                        className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={newConversationData.participants.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewConversationData(prev => ({
                                ...prev,
                                participants: [...prev.participants, user.id]
                              }));
                            } else {
                              setNewConversationData(prev => ({
                                ...prev,
                                participants: prev.participants.filter(id => id !== user.id)
                              }));
                            }
                          }}
                          className="mr-3"
                        />
                        <div className="flex items-center space-x-3">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt=""
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-500" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                            <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    onClick={() => setShowNewConversation(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createConversation}
                    disabled={!newConversationData.participants.length}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create Conversation
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};