import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { prayerService } from '../services';
import { colors } from '../theme/colors';

export default function PrayerScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [category, setCategory] = useState('General');
  const [requestText, setRequestText] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = ['General', 'Health', 'Family', 'Work', 'Finances', 'Spiritual', 'Other'];

  const handleSubmit = async () => {
    if (!name || !email || !requestText) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await prayerService.submit({
        name,
        email,
        phoneNumber,
        category,
        requestText,
        isUrgent,
      });
      
      Alert.alert(
        'Prayer Request Submitted',
        'Your prayer request has been received. Our prayer team will be praying for you.',
        [
          {
            text: 'OK',
            onPress: () => {
              setName('');
              setEmail('');
              setPhoneNumber('');
              setRequestText('');
              setIsUrgent(false);
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit prayer request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Submit Prayer Request</Text>
        <Text style={styles.headerSubtitle}>
          "The prayer of a righteous person is powerful and effective." - James 5:16
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Your name"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            placeholder="your.email@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="+234 XXX XXX XXXX"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Category *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryButton,
                  category === cat && styles.categoryButtonActive,
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    category === cat && styles.categoryTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Prayer Request *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Share your prayer request..."
            value={requestText}
            onChangeText={setRequestText}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={styles.urgentContainer}
          onPress={() => setIsUrgent(!isUrgent)}
        >
          <View style={[styles.checkbox, isUrgent && styles.checkboxActive]}>
            {isUrgent && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.urgentText}>Mark as urgent</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Submitting...' : 'Submit Prayer Request'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.info}>
        <Text style={styles.infoTitle}>Prayer Team</Text>
        <Text style={styles.infoText}>
          Our dedicated prayer team reviews and prays over every request. Your request will be
          handled with confidentiality and care.
        </Text>
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
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.gold[500],
    fontStyle: 'italic',
  },
  form: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.gray[900],
  },
  textArea: {
    minHeight: 120,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.gray[200],
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: colors.primary[600],
  },
  categoryText: {
    fontSize: 14,
    color: colors.gray[700],
  },
  categoryTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  urgentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.gray[400],
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  checkmark: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  urgentText: {
    fontSize: 16,
    color: colors.gray[700],
  },
  submitButton: {
    backgroundColor: colors.secondary[600],
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: colors.secondary[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  info: {
    backgroundColor: colors.white,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.gold[700],
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.gray[600],
    lineHeight: 20,
  },
});
