import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Date;
  isOwn: boolean;
  department?: string;
}

export default function ChatScreen() {
  const { user } = useAuth();
  const [selectedDepartment, setSelectedDepartment] = useState<string>('General');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');

  // Get user's departments plus general chat
  const userDepartments = ['General', ...(user?.departments || [])];

  useEffect(() => {
    loadMessages();
  }, [selectedDepartment]);

  const loadMessages = () => {
    // Mock messages for the selected department
    const mockMessages: Message[] = [
      {
        id: '1',
        senderId: '2',
        senderName: 'Pastor John',
        message: `Welcome to ${selectedDepartment} chat!`,
        timestamp: new Date(Date.now() - 3600000),
        isOwn: false,
        department: selectedDepartment,
      },
    ];
    setMessages(mockMessages);
  };

  const handleSend = () => {
    if (inputText.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        senderId: user?.id?.toString() || '1',
        senderName: user?.fullName || 'You',
        message: inputText.trim(),
        timestamp: new Date(),
        isOwn: true,
        department: selectedDepartment,
      };
      setMessages([...messages, newMessage]);
      setInputText('');
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
        <Text style={styles.senderName}>{item.senderName}</Text>
      )}
      <View
        style={[
          styles.messageBubble,
          item.isOwn ? styles.ownBubble : styles.otherBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            item.isOwn ? styles.ownText : styles.otherText,
          ]}
        >
          {item.message}
        </Text>
        <Text
          style={[
            styles.timestamp,
            item.isOwn ? styles.ownTimestamp : styles.otherTimestamp,
          ]}
        >
          {item.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Department Selector */}
      <View style={styles.departmentSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {userDepartments.map((dept, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.departmentTab,
                selectedDepartment === dept && styles.departmentTabActive,
              ]}
              onPress={() => setSelectedDepartment(dept)}
            >
              <Text
                style={[
                  styles.departmentTabText,
                  selectedDepartment === dept && styles.departmentTabTextActive,
                ]}
              >
                {dept}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        inverted={false}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder={`Message ${selectedDepartment}...`}
          placeholderTextColor={colors.gray[400]}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  departmentSelector: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  departmentTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
  },
  departmentTabActive: {
    backgroundColor: colors.primary[600],
  },
  departmentTabText: {
    fontSize: 14,
    color: colors.gray[700],
    fontWeight: '600',
  },
  departmentTabTextActive: {
    color: colors.white,
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    color: colors.gray[600],
    marginBottom: 4,
    marginLeft: 8,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
  },
  ownBubble: {
    backgroundColor: colors.primary[600],
  },
  otherBubble: {
    backgroundColor: colors.gray[200],
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  ownText: {
    color: colors.white,
  },
  otherText: {
    color: colors.gray[900],
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
  },
  ownTimestamp: {
    color: colors.white,
    opacity: 0.8,
    textAlign: 'right',
  },
  otherTimestamp: {
    color: colors.gray[600],
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: colors.gray[100],
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: colors.gray[400],
  },
  sendButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
