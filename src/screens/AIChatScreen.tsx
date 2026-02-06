import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';

const { width } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  imageUrl?: string;
  videoUrl?: string;
  isLoading?: boolean;
  type?: 'text' | 'image' | 'video' | 'mixed';
}

const AIChatScreen = ({ navigation }: any) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "✨ Welcome! I'm your Advanced AI Assistant powered by cutting-edge technology.\n\n🌟 I can help you with:\n\n📖 Biblical Analysis\n• Explain passages in Greek, Hebrew & Aramaic\n• Theological discussions & interpretations\n• Historical & cultural context\n\n🎨 Creative Generation\n• Generate stunning images\n• Create video concepts\n• Visual illustrations\n\n💡 Knowledge & Assistance\n• Answer any question\n• App navigation help\n• Sermon preparation\n• Study materials\n\n🚀 Just ask me anything - I'm here to help!",
      sender: 'ai',
      timestamp: new Date(),
      type: 'text',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Pulse animation for AI thinking
    if (isTyping) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isTyping]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Add loading message
    const loadingMessage: Message = {
      id: Date.now().toString() + '_loading',
      text: '',
      sender: 'ai',
      timestamp: new Date(),
      isLoading: true,
    };
    setMessages((prev) => [...prev, loadingMessage]);

    try {
      const response = await api.post('/ai/chat', {
        message: inputText.trim(),
        history: messages.slice(-10).map((m) => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text,
        })),
      });

      // Remove loading message
      setMessages((prev) => prev.filter((m) => m.id !== loadingMessage.id));

      const aiMessage: Message = {
        id: Date.now().toString(),
        text: response.data.message,
        sender: 'ai',
        timestamp: new Date(),
        imageUrl: response.data.imageUrl,
        videoUrl: response.data.videoUrl,
        type: response.data.type || 'text',
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      // Remove loading message
      setMessages((prev) => prev.filter((m) => m.id !== loadingMessage.id));
      
      Alert.alert('Error', error.response?.data?.message || 'Failed to get response');
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: "I'm sorry, I encountered an error. Please try again.",
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAction = (action: string) => {
    setInputText(action);
  };

  const renderMessage = (message: Message) => {
    if (message.isLoading) {
      return (
        <View key={message.id} style={[styles.messageContainer, styles.aiMessage]}>
          <Animated.View style={[styles.aiAvatar, { transform: [{ scale: pulseAnim }] }]}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.avatarGradient}
            >
              <Text style={styles.avatarText}>🤖</Text>
            </LinearGradient>
          </Animated.View>
          <View style={styles.messageBubble}>
            <View style={styles.typingIndicator}>
              <View style={styles.typingDot} />
              <View style={[styles.typingDot, { marginLeft: 4 }]} />
              <View style={[styles.typingDot, { marginLeft: 4 }]} />
            </View>
            <Text style={styles.typingText}>AI is thinking...</Text>
          </View>
        </View>
      );
    }

    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          message.sender === 'user' ? styles.userMessage : styles.aiMessage,
        ]}
      >
        {message.sender === 'ai' && (
          <View style={styles.aiAvatar}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.avatarGradient}
            >
              <Text style={styles.avatarText}>🤖</Text>
            </LinearGradient>
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            message.sender === 'user' ? styles.userBubble : styles.aiBubble,
          ]}
        >
          {message.sender === 'user' ? (
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.userBubbleGradient}
            >
              <Text style={styles.userText}>{message.text}</Text>
              <Text style={[styles.timestamp, { color: 'rgba(255,255,255,0.7)' }]}>
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </LinearGradient>
          ) : (
            <>
              <Text style={styles.aiText}>{message.text}</Text>
              {message.imageUrl && (
                <View style={styles.mediaContainer}>
                  <Image
                    source={{ uri: message.imageUrl }}
                    style={styles.messageImage}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.3)']}
                    style={styles.imageOverlay}
                  />
                </View>
              )}
              {message.videoUrl && (
                <View style={styles.mediaContainer}>
                  <View style={styles.videoPlaceholder}>
                    <Text style={styles.videoIcon}>▶️</Text>
                    <Text style={styles.videoText}>Video generated</Text>
                  </View>
                </View>
              )}
              <Text style={styles.timestamp}>
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </>
          )}
        </View>
        {message.sender === 'user' && (
          <View style={styles.userAvatar}>
            <LinearGradient
              colors={['#10b981', '#059669']}
              style={styles.avatarGradient}
            >
              <Text style={styles.avatarText}>👤</Text>
            </LinearGradient>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>✨ AI Assistant</Text>
          <Text style={styles.headerSubtitle}>Powered by Advanced AI</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.statusDot} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Enhanced Quick Actions */}
        <LinearGradient
          colors={['#ffffff', '#f3f4f6']}
          style={styles.quickActionsContainer}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsContent}
          >
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleQuickAction('Explain John 3:16 in Greek with full theological context')}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.quickActionGradient}
              >
                <Text style={styles.quickActionIcon}>📖</Text>
                <Text style={styles.quickActionText}>Greek Text</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleQuickAction('Generate a beautiful image of Jesus teaching on the mountain')}
            >
              <LinearGradient
                colors={['#f093fb', '#f5576c']}
                style={styles.quickActionGradient}
              >
                <Text style={styles.quickActionIcon}>🎨</Text>
                <Text style={styles.quickActionText}>Generate Image</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleQuickAction('Create a video concept about the parable of the Good Samaritan')}
            >
              <LinearGradient
                colors={['#4facfe', '#00f2fe']}
                style={styles.quickActionGradient}
              >
                <Text style={styles.quickActionIcon}>🎬</Text>
                <Text style={styles.quickActionText}>Video Concept</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleQuickAction('Explain the theology of grace in Reformed tradition')}
            >
              <LinearGradient
                colors={['#43e97b', '#38f9d7']}
                style={styles.quickActionGradient}
              >
                <Text style={styles.quickActionIcon}>⛪</Text>
                <Text style={styles.quickActionText}>Theology</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleQuickAction('How do I view my attendance records in the app?')}
            >
              <LinearGradient
                colors={['#fa709a', '#fee140']}
                style={styles.quickActionGradient}
              >
                <Text style={styles.quickActionIcon}>🧭</Text>
                <Text style={styles.quickActionText}>Navigation</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </LinearGradient>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(renderMessage)}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask me anything..."
              placeholderTextColor="#9CA3AF"
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim() || isTyping}
            >
              <LinearGradient
                colors={
                  !inputText.trim() || isTyping
                    ? ['#D1D5DB', '#D1D5DB']
                    : ['#667eea', '#764ba2']
                }
                style={styles.sendButtonGradient}
              >
                {isTyping ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.sendIcon}>➤</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  backIcon: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  headerRight: {
    width: 44,
    alignItems: 'flex-end',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  keyboardView: {
    flex: 1,
  },
  quickActionsContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  quickActionsContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  quickActionButton: {
    marginRight: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  quickActionIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  quickActionText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-end',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  aiMessage: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 10,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
  },
  messageBubble: {
    maxWidth: width * 0.75,
    borderRadius: 20,
    overflow: 'hidden',
  },
  userBubble: {
    borderBottomRightRadius: 4,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  userBubbleGradient: {
    padding: 14,
    borderRadius: 20,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  userText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#FFFFFF',
  },
  aiText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1F2937',
  },
  mediaContainer: {
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  messageImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
  },
  videoPlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  videoText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 6,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#667eea',
  },
  typingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 120,
    color: '#1F2937',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sendButton: {
    marginLeft: 10,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  sendIcon: {
    fontSize: 22,
    color: '#FFFFFF',
  },
});

export default AIChatScreen;
