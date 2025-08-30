import { create } from 'zustand';
import { ChatMessage } from '../types';

interface ChatState {
  // Messages
  messages: ChatMessage[];
  isLoading: boolean;
  isTyping: boolean;

  // Conversation state
  conversationId: string | null;
  conversationCompleted: boolean;

  // AI context
  userContext: {
    questionnaireData?: Record<string, unknown>;
    currentPhase?: number;
    painLevel?: number;
    recentExercises?: string[];
  };

  // Actions
  addMessage: (message: ChatMessage) => void;
  addUserMessage: (content: string) => void;
  addAIMessage: (content: string) => void;
  updateLastMessage: (content: string) => void;
  clearMessages: () => void;

  setIsLoading: (loading: boolean) => void;
  setIsTyping: (typing: boolean) => void;

  setConversationId: (id: string | null) => void;
  setConversationCompleted: (completed: boolean) => void;

  updateUserContext: (context: Partial<ChatState['userContext']>) => void;

  // Message helpers
  getLastUserMessage: () => ChatMessage | null;
  getLastAIMessage: () => ChatMessage | null;
  getMessageHistory: () => Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  messages: [],
  isLoading: false,
  isTyping: false,

  conversationId: null,
  conversationCompleted: false,

  userContext: {},

  // Actions
  addMessage: message =>
    set(state => ({
      messages: [...state.messages, message],
    })),

  addUserMessage: content => {
    const message: ChatMessage = {
      id: `user_${Date.now()}`,
      content,
      isUser: true,
      timestamp: new Date().toISOString(),
    };
    get().addMessage(message);
  },

  addAIMessage: content => {
    const message: ChatMessage = {
      id: `ai_${Date.now()}`,
      content,
      isUser: false,
      timestamp: new Date().toISOString(),
    };
    get().addMessage(message);
  },

  updateLastMessage: content =>
    set(state => {
      const messages = [...state.messages];
      if (messages.length > 0) {
        messages[messages.length - 1].content = content;
      }
      return { messages };
    }),

  clearMessages: () =>
    set({
      messages: [],
      conversationId: null,
      conversationCompleted: false,
    }),

  setIsLoading: loading => set({ isLoading: loading }),
  setIsTyping: typing => set({ isTyping: typing }),

  setConversationId: id => set({ conversationId: id }),
  setConversationCompleted: completed =>
    set({ conversationCompleted: completed }),

  updateUserContext: context =>
    set(state => ({
      userContext: { ...state.userContext, ...context },
    })),

  // Message helpers
  getLastUserMessage: () => {
    const { messages } = get();
    const userMessages = messages.filter(m => m.isUser);
    return userMessages.length > 0
      ? userMessages[userMessages.length - 1]
      : null;
  },

  getLastAIMessage: () => {
    const { messages } = get();
    const aiMessages = messages.filter(m => !m.isUser);
    return aiMessages.length > 0 ? aiMessages[aiMessages.length - 1] : null;
  },

  getMessageHistory: () => {
    const { messages } = get();
    return messages.map(message => ({
      role: message.isUser ? ('user' as const) : ('assistant' as const),
      content: message.content,
    }));
  },
}));
