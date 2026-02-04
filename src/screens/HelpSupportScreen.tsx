import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  TextInput,
} from 'react-native';
import { colors } from '../theme/colors';

export default function HelpSupportScreen({ navigation }: any) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const faqCategories = [
    {
      title: 'Getting Started',
      icon: '🚀',
      questions: [
        {
          q: 'How do I create an account?',
          a: 'Tap "Register" on the login screen, fill in your details including full name, email, phone, password, and select your gender and departments.',
        },
        {
          q: 'How do I reset my password?',
          a: 'On the login screen, tap "Forgot Password" and follow the instructions sent to your email.',
        },
      ],
    },
    {
      title: 'Events & Registration',
      icon: '📅',
      questions: [
        {
          q: 'How do I register for an event?',
          a: 'Navigate to the Events tab, select an event, and tap "Register Now". You can view your registered events in your profile.',
        },
        {
          q: 'Can I cancel my event registration?',
          a: 'Yes, go to Profile > My Events and tap "Cancel" on the event you want to cancel.',
        },
      ],
    },
    {
      title: 'Giving & Donations',
      icon: '💝',
      questions: [
        {
          q: 'How do I make a donation?',
          a: 'Navigate to the Give tab, select or enter the amount, choose your payment method (Bank Transfer or Card), and complete the donation.',
        },
        {
          q: 'Is my donation secure?',
          a: 'Yes, all donations are processed securely. Your payment information is encrypted and protected.',
        },
        {
          q: 'Can I view my giving history?',
          a: 'Yes, go to Profile > Giving History to see all your donations.',
        },
      ],
    },
    {
      title: 'Prayer Requests',
      icon: '🙏',
      questions: [
        {
          q: 'How do I submit a prayer request?',
          a: 'Navigate to the Prayer tab, fill in your request details including category and description, and tap "Submit Request".',
        },
        {
          q: 'Who can see my prayer request?',
          a: 'Your prayer requests are visible to the church community so they can pray for you.',
        },
      ],
    },
    {
      title: 'Live Stream',
      icon: '📹',
      questions: [
        {
          q: 'How do I watch live services?',
          a: 'Navigate to the Live Stream tab. When a service is live, tap "Join Live Stream" to watch.',
        },
        {
          q: 'What are the service times?',
          a: 'Sunday School: 8am-9am, Sunday Service: 9am-11am, Tuesday Prayer: 6pm-7pm, Thursday Bible Study: 6pm-7pm.',
        },
      ],
    },
  ];

  const contactOptions = [
    {
      title: 'Call Us',
      icon: '📞',
      subtitle: '+234 XXX XXX XXXX',
      action: () => Linking.openURL('tel:+234XXXXXXXXXX'),
    },
    {
      title: 'Email Us',
      icon: '✉️',
      subtitle: 'info@wordofcovenant.org',
      action: () => Linking.openURL('mailto:info@wordofcovenant.org'),
    },
    {
      title: 'Visit Our Website',
      icon: '🌐',
      subtitle: 'www.wordofcovenant.org',
      action: () => Linking.openURL('http://localhost:5173'),
    },
    {
      title: 'Visit Church',
      icon: '📍',
      subtitle: 'Ikorodu, Lagos, Nigeria',
      action: () =>
        Alert.alert('Location', 'Word of Covenant Church\nIkorodu, Lagos, Nigeria'),
    },
  ];

  const handleSubmitMessage = async () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter your message');
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Implement API call to submit support message
      await new Promise((resolve) => setTimeout(resolve, 1000));
      Alert.alert('Success', 'Your message has been sent. We will get back to you soon.');
      setMessage('');
    } catch (error) {
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>How can we help you?</Text>
        <Text style={styles.headerSubtitle}>
          Find answers to common questions or contact us directly
        </Text>
      </View>

      {/* Contact Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Us</Text>
        <View style={styles.contactGrid}>
          {contactOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.contactCard}
              onPress={option.action}
            >
              <Text style={styles.contactIcon}>{option.icon}</Text>
              <Text style={styles.contactTitle}>{option.title}</Text>
              <Text style={styles.contactSubtitle}>{option.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* FAQ */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {faqCategories.map((category, categoryIndex) => (
          <View key={categoryIndex} style={styles.faqCategory}>
            <TouchableOpacity
              style={styles.faqCategoryHeader}
              onPress={() =>
                setSelectedCategory(
                  selectedCategory === category.title ? null : category.title
                )
              }
            >
              <View style={styles.faqCategoryLeft}>
                <Text style={styles.faqCategoryIcon}>{category.icon}</Text>
                <Text style={styles.faqCategoryTitle}>{category.title}</Text>
              </View>
              <Text style={styles.faqCategoryArrow}>
                {selectedCategory === category.title ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>

            {selectedCategory === category.title && (
              <View style={styles.faqQuestions}>
                {category.questions.map((item, qIndex) => (
                  <View key={qIndex} style={styles.faqItem}>
                    <Text style={styles.faqQuestion}>{item.q}</Text>
                    <Text style={styles.faqAnswer}>{item.a}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Send Message */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Send Us a Message</Text>
        <View style={styles.messageCard}>
          <Text style={styles.messageLabel}>Your Message</Text>
          <TextInput
            style={styles.messageInput}
            placeholder="Type your question or concern here..."
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmitMessage}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appInfoText}>Word of Covenant Church Mobile App</Text>
        <Text style={styles.appInfoText}>Version 1.0.0</Text>
        <Text style={styles.appInfoText}>© 2026 Word of Covenant Church</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary[800],
    padding: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
    textAlign: 'center',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 16,
  },
  contactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  contactCard: {
    backgroundColor: colors.white,
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary[100],
    elevation: 2,
    shadowColor: colors.primary[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  contactIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 4,
    textAlign: 'center',
  },
  contactSubtitle: {
    fontSize: 12,
    color: colors.primary[700],
    textAlign: 'center',
  },
  faqCategory: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  faqCategoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  faqCategoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  faqCategoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  faqCategoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  faqCategoryArrow: {
    fontSize: 12,
    color: colors.gray[500],
  },
  faqQuestions: {
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  faqItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary[700],
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: colors.gray[700],
    lineHeight: 20,
  },
  messageCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  messageLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 8,
  },
  messageInput: {
    backgroundColor: colors.gray[50],
    borderWidth: 2,
    borderColor: colors.primary[200],
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.gray[900],
    minHeight: 120,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: colors.primary[600],
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.primary[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  appInfo: {
    alignItems: 'center',
    padding: 32,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    marginTop: 16,
  },
  appInfoText: {
    fontSize: 12,
    color: colors.gray[500],
    marginBottom: 4,
  },
});
