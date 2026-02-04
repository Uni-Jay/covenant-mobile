import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { primaryColor, accentColor } from '../theme/colors';

type RouteParams = {
  ChatRoom: {
    department: string;
  };
};

interface Message {
  id: string;
  sender: string;
  message: string;
  timestamp: Date;
  isOwn: boolean;
}

const ChatRoomScreen = () => {
  const route = useRoute<RouteProp<RouteParams, 'ChatRoom'>>();
  const { department } = route.params || { department: 'General' };
  const { user } = useAuth();
  
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'Admin',
      message: `Welcome to the ${department} chat!`,
      timestamp: new Date(Date.now() - 3600000),
      isOwn: false,
    },
  ]);
  
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = () => {
    if (message.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        sender: user?.firstName || 'You',
        message: message.trim(),
        timestamp: new Date(),
        isOwn: true,
      };
      
      setMessages((prev) => [...prev, newMessage]);
      setMessage('');
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.isOwn ? styles.ownMessage : styles.otherMessage,
      ]}
    >
      {!item.isOwn && (
        <Text style={styles.senderName}>{item.sender}</Text>
      )}
      <Text style={[styles.messageText, item.isOwn && styles.ownMessageText]}>
        {item.message}
      </Text>
      <Text style={[styles.timestamp, item.isOwn && styles.ownTimestamp]}>
        {item.timestamp.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{department}</Text>
        <Text style={styles.headerSubtitle}>Department Group Chat</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder={`Message ${department}...`}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !message.trim() && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!message.trim()}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    padding: 16,
    backgroundColor: primaryColor,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#e0e7ff',
    marginTop: 2,
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  messageContainer: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: primaryColor,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: accentColor,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#111827',
  },
  ownMessageText: {
    color: '#fff',
  },
  timestamp: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  ownTimestamp: {
    color: '#e0e7ff',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: primaryColor,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
  },
  sendButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ChatRoomScreen;
