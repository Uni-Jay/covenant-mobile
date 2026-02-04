import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Clipboard,
} from 'react-native';
import { donationsService } from '../services';
import { colors } from '../theme/colors';

export default function GiveScreen() {
  const [amount, setAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [purpose, setPurpose] = useState('Tithe');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const purposes = ['Tithe', 'Offering', 'Building Fund', 'Missions', 'Special Project', 'Other'];
  const quickAmounts = ['1000', '5000', '10000', '20000', '50000'];

  const bankDetails = {
    bankName: 'First Bank Nigeria',
    accountName: 'Word of Covenant Church',
    accountNumber: '1234567890',
  };

  const handleCopyAccount = () => {
    Clipboard.setString(bankDetails.accountNumber);
    Alert.alert('Copied', 'Account number copied to clipboard');
  };

  const handleSubmit = async () => {
    if (!amount || !donorName || !donorEmail) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await donationsService.submit({
        amount: parseFloat(amount),
        donorName,
        donorEmail,
        purpose,
        paymentMethod: 'Bank Transfer',
        isAnonymous,
      });

      Alert.alert(
        'Thank You!',
        'Your giving has been recorded. May God bless you abundantly!',
        [
          {
            text: 'OK',
            onPress: () => {
              setAmount('');
              setDonorName('');
              setDonorEmail('');
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to record giving. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Give to God's Work</Text>
        <Text style={styles.headerSubtitle}>
          "Give, and it will be given to you..." - Luke 6:38
        </Text>
      </View>

      {/* Bank Details */}
      <View style={styles.bankCard}>
        <Text style={styles.bankTitle}>Bank Account Details</Text>
        <View style={styles.bankDetail}>
          <Text style={styles.bankLabel}>Bank Name:</Text>
          <Text style={styles.bankValue}>{bankDetails.bankName}</Text>
        </View>
        <View style={styles.bankDetail}>
          <Text style={styles.bankLabel}>Account Name:</Text>
          <Text style={styles.bankValue}>{bankDetails.accountName}</Text>
        </View>
        <View style={styles.bankDetail}>
          <Text style={styles.bankLabel}>Account Number:</Text>
          <View style={styles.accountRow}>
            <Text style={styles.bankValue}>{bankDetails.accountNumber}</Text>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopyAccount}
            >
              <Text style={styles.copyText}>Copy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Giving Form */}
      <View style={styles.form}>
        <Text style={styles.formTitle}>Record Your Giving</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Purpose *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {purposes.map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.purposeButton,
                  purpose === p && styles.purposeButtonActive,
                ]}
                onPress={() => setPurpose(p)}
              >
                <Text
                  style={[
                    styles.purposeText,
                    purpose === p && styles.purposeTextActive,
                  ]}
                >
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Amount (₦) *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickAmounts}>
            {quickAmounts.map((qa) => (
              <TouchableOpacity
                key={qa}
                style={styles.quickAmountButton}
                onPress={() => setAmount(qa)}
              >
                <Text style={styles.quickAmountText}>₦{qa}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Your name"
            value={donorName}
            onChangeText={setDonorName}
            editable={!isAnonymous}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            placeholder="your.email@example.com"
            value={donorEmail}
            onChangeText={setDonorEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          style={styles.anonymousContainer}
          onPress={() => setIsAnonymous(!isAnonymous)}
        >
          <View style={[styles.checkbox, isAnonymous && styles.checkboxActive]}>
            {isAnonymous && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.anonymousText}>Give anonymously</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Recording...' : 'Record Giving'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.info}>
        <Text style={styles.infoText}>
          After making your bank transfer, please fill this form to help us track and acknowledge
          your giving.
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
  bankCard: {
    backgroundColor: colors.white,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gold[700],
  },
  bankTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 16,
  },
  bankDetail: {
    marginBottom: 12,
  },
  bankLabel: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: 4,
  },
  bankValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  copyButton: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    elevation: 2,
    shadowColor: colors.primary[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  copyText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  form: {
    padding: 16,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 16,
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
  quickAmounts: {
    marginTop: 8,
  },
  quickAmountButton: {
    backgroundColor: colors.gray[200],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  quickAmountText: {
    fontSize: 14,
    color: colors.gray[700],
    fontWeight: '600',
  },
  purposeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.gray[200],
    marginRight: 8,
  },
  purposeButtonActive: {
    backgroundColor: colors.primary[800],
  },
  purposeText: {
    fontSize: 14,
    color: colors.gray[700],
  },
  purposeTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  anonymousContainer: {
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
    backgroundColor: colors.primary[800],
    borderColor: colors.primary[800],
  },
  checkmark: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  anonymousText: {
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
  infoText: {
    fontSize: 14,
    color: colors.gray[600],
    lineHeight: 20,
  },
});
