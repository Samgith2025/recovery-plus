import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  SafeAreaView,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { theme } from '../styles/theme';
import { useChatStore } from '../store/chat';
import { useAppStore } from '../store';
import { useExerciseStore } from '../store/exercise';
import { chatLogger } from '../services/logger';
import {
  chatService,
  ExerciseRecommendation,
  ChatContext,
} from '../services/chatService';
import { ExerciseRecommendationCard } from '../components/chat/ExerciseRecommendationCard';
import { Exercise } from '../types';
import { aiVideoService } from '../services/aiVideoService';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  exerciseRecommendations?: ExerciseRecommendation[];
  quickReplies?: string[];
}

interface ChatScreenProps {
  onBackPress?: () => void;
  onNavigateToExercise?: (exercise: Exercise) => void;
  isInTabNavigator?: boolean;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  onBackPress,
  onNavigateToExercise,
  isInTabNavigator = false,
}) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const flatListRef = useRef<FlatList>(null);

  const { user } = useAppStore();
  const { recentSessions, startSession } = useExerciseStore();

  // Load chat history and show welcome message
  useEffect(() => {
    loadChatHistory();
  }, [user]);

  const loadChatHistory = async () => {
    if (!user?.id) {
      showWelcomeMessage();
      return;
    }

    try {
      const { success, messages: historyMessages } =
        await chatService.loadChatHistory(user.id);

      if (success && historyMessages && historyMessages.length > 0) {
        // Convert database messages to UI message format
        const convertedMessages: Message[] = historyMessages.map(
          (msg, index) => ({
            id: `history-${index}`,
            text: msg.content,
            isUser: msg.isUser,
            timestamp: new Date(msg.createdAt),
          })
        );
        setMessages(convertedMessages);
      } else {
        showWelcomeMessage();
      }
    } catch (error) {
      chatLogger.warn('Failed to load chat history', { error });
      showWelcomeMessage();
    }
  };

  const showWelcomeMessage = async () => {
    try {
      // Generate AI-powered welcome message based on user context
      let context: ChatContext = {};
      if (user?.id) {
        context = await chatService.getEnhancedUserContext(user.id);
      } else {
        // Minimal context for demo users
        context = {
          currentPhase: 1,
          painLevel: 5,
        };
      }

      // Generate personalized welcome message using AI
      const welcomeResponse = await chatService.generateResponse(
        'Generate a personalized welcome message for a first-time chat session',
        context
      );

      const welcomeMessage: Message = {
        id: 'welcome-1',
        text: welcomeResponse.message,
        isUser: false,
        timestamp: new Date(),
        quickReplies: welcomeResponse.quickReplies,
      };
      setMessages([welcomeMessage]);
    } catch (error) {
      // Fallback if AI welcome fails
      const fallbackMessage: Message = {
        id: 'welcome-fallback',
        text: 'Welcome! I\'m here to support your recovery journey. How can I help you today?',
        isUser: false,
        timestamp: new Date(),
        quickReplies: ['Exercise help', 'Pain guidance', 'Progress check', 'General support'],
      };
      setMessages([fallbackMessage]);
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputText.trim();
    if (!textToSend || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: textToSend,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      let context: ChatContext = {};

      // Get enhanced user context from database if user is logged in
      if (user?.id) {
        context = await chatService.getEnhancedUserContext(user.id);
      } else {
        // AI-generated context for demo users based on session data
        context = {
          currentPhase: 2,
          painLevel: 4,
          recentExercises: recentSessions.slice(0, 3).map(session => ({
            id: session.exerciseId,
            name: session.exerciseName || 'Recent exercise',
          })) as Exercise[],
        };
      }

      // Use enhanced response generation with persistence if user is logged in
      const chatResponse = user?.id
        ? await chatService.generateResponseWithPersistence(
            textToSend,
            user.id,
            context
          )
        : await chatService.generateResponse(textToSend, context);

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        text: chatResponse.message,
        isUser: false,
        timestamp: new Date(),
        exerciseRecommendations: chatResponse.exerciseRecommendations,
        quickReplies: chatResponse.quickReplies,
      };

      setMessages(prev => [...prev, aiMessage]);

      // Auto-scroll to bottom after AI response
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        text: "I'm having trouble connecting right now. Please try again in a moment!",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartExercise = async (
    recommendation: ExerciseRecommendation
  ) => {
    // Get AI-curated videos for this exercise
    const aiVideos = await aiVideoService.getVideosForExercise(recommendation);

    const exercise: Exercise = {
      id: recommendation.id,
      name: recommendation.name,
      description: recommendation.description,
      instructions: recommendation.instructions,
      sets: recommendation.sets || 2,
      reps: recommendation.reps || 10,
      holdTime: recommendation.holdTime,
      level: recommendation.level,
      difficulty: 3,
      type: recommendation.type,
      targetMuscles: recommendation.targetMuscles,
      bodyPart: recommendation.targetMuscles,
      videoUrl:
        aiVideos.length > 0
          ? `https://www.youtube.com/watch?v=${aiVideos[0].id}`
          : undefined,
      videoUrls: aiVideos.map(
        video => `https://www.youtube.com/watch?v=${video.id}`
      ),
      icon: '💪',
      equipment: [],
      duration: '5 mins',
    };

    try {
      const session = startSession(exercise);
      Alert.alert(
        'Exercise Started!',
        `Started ${recommendation.name}. Good luck with your workout!`,
        [
          { text: 'Continue Chat', style: 'cancel' },
          {
            text: 'Go to Exercise',
            onPress: () =>
              onNavigateToExercise && onNavigateToExercise(exercise),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Could not start exercise. Please try again.');
    }
  };

  const handleViewExerciseDetails = (
    recommendation: ExerciseRecommendation
  ) => {
    const detailsMessage: Message = {
      id: `details-${Date.now()}`,
      text: `Here are the details for ${recommendation.name}:\n\n${recommendation.instructions
        .map((instruction, index) => `${index + 1}. ${instruction}`)
        .join(
          '\n'
        )}\n\n${recommendation.sets ? `Sets: ${recommendation.sets}` : ''}${
        recommendation.reps ? ` | Reps: ${recommendation.reps}` : ''
      }${recommendation.holdTime ? ` | Hold: ${recommendation.holdTime}s` : ''}`,
      isUser: false,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, detailsMessage]);
  };

  const renderMessage = ({ item: message }: { item: Message }) => {
    return (
      <View
        style={{
          marginBottom: 16,
          marginHorizontal: 16,
          alignItems: message.isUser ? 'flex-end' : 'flex-start',
        }}
      >
        {/* Message bubble */}
        <View
          style={{
            backgroundColor: message.isUser ? '#007AFF' : '#FFFFFF',
            padding: 12,
            borderRadius: 16,
            maxWidth: '80%',
            borderWidth: message.isUser ? 0 : 1,
            borderColor: '#E5E5E7',
          }}
        >
          <Text
            style={{
              fontSize: 16,
              color: message.isUser ? '#FFFFFF' : '#000000',
              lineHeight: 20,
            }}
          >
            {message.text}
          </Text>
        </View>

        {/* Timestamp */}
        <Text
          style={{
            fontSize: 12,
            color: '#8E8E93',
            marginTop: 4,
            marginHorizontal: 8,
          }}
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>

        {/* Exercise recommendations */}
        {message.exerciseRecommendations &&
          message.exerciseRecommendations.length > 0 &&
          message.exerciseRecommendations.map(recommendation => (
            <View
              key={recommendation.id}
              style={{ marginTop: 8, width: '100%' }}
            >
              <ExerciseRecommendationCard
                recommendation={recommendation}
                onStartExercise={handleStartExercise}
                onViewDetails={handleViewExerciseDetails}
              />
            </View>
          ))}

        {/* Quick replies */}
        {message.quickReplies && message.quickReplies.length > 0 && (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              marginTop: 8,
              width: '100%',
            }}
          >
            {message.quickReplies.slice(0, 3).map((reply, index) => (
              <Pressable
                key={index}
                onPress={() => handleSendMessage(reply)}
                style={{
                  backgroundColor: '#F2F2F7',
                  borderRadius: 16,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  marginRight: 8,
                  marginBottom: 8,
                }}
              >
                <Text style={{ fontSize: 14, color: '#007AFF' }}>{reply}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: '#FFFFFF',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: '#E5E5E7',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {onBackPress && (
            <Pressable
              onPress={onBackPress}
              style={{
                position: 'absolute',
                left: 0,
                padding: 8,
              }}
            >
              <Text style={{ fontSize: 18, color: '#007AFF' }}>←</Text>
            </Pressable>
          )}
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#000000' }}>
            {isInTabNavigator ? 'Coach' : 'Chat'}
          </Text>
        </View>
        <Text
          style={{
            fontSize: 14,
            color: '#8E8E93',
            textAlign: 'center',
            marginTop: 4,
          }}
        >
          AI Fitness Trainer
        </Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />

        {/* Loading indicator */}
        {isLoading && (
          <View
            style={{
              paddingHorizontal: 16,
              paddingBottom: 8,
            }}
          >
            <View
              style={{
                backgroundColor: '#FFFFFF',
                padding: 12,
                borderRadius: 16,
                alignSelf: 'flex-start',
                borderWidth: 1,
                borderColor: '#E5E5E7',
              }}
            >
              <Text style={{ fontSize: 16, color: '#8E8E93' }}>
                AI is typing...
              </Text>
            </View>
          </View>
        )}

        {/* Input area */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: Platform.OS === 'ios' ? 8 : 16,
            borderTopWidth: 1,
            borderTopColor: '#E5E5E7',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              backgroundColor: '#F2F2F7',
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 10,
              minHeight: 44,
              borderWidth: 1,
              borderColor: '#E5E5E7',
            }}
          >
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask about exercises, form, or workout plans..."
              placeholderTextColor="#8E8E93"
              multiline
              maxLength={500}
              style={{
                flex: 1,
                fontSize: 16,
                color: '#000000',
                maxHeight: 100,
                minHeight: 20,
                paddingVertical: Platform.OS === 'ios' ? 0 : 4,
                textAlignVertical: Platform.OS === 'android' ? 'top' : 'center',
              }}
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={() => {
                if (inputText.trim()) {
                  handleSendMessage();
                }
              }}
              onFocus={() => {
                // Scroll to bottom when input is focused
                setTimeout(() => {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }, 300);
              }}
            />
            <Pressable
              onPress={() => handleSendMessage()}
              disabled={!inputText.trim() || isLoading}
              style={{
                backgroundColor: inputText.trim() ? '#007AFF' : '#C7C7CC',
                width: 32,
                height: 32,
                borderRadius: 16,
                justifyContent: 'center',
                alignItems: 'center',
                marginLeft: 12,
              }}
            >
              <Text
                style={{ fontSize: 16, color: '#FFFFFF', fontWeight: '600' }}
              >
                ↑
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export { ChatScreen };
