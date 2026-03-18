import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import { getApiUrl } from '../config/network.config';

const API_URL = getApiUrl();

export default function ForgotPasswordScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { email });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.successContainer}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary[50] }]}>
              <Ionicons name="checkmark-circle" size={80} color={colors.primary[600]} />
            </View>

            <Text style={[styles.title, { color: colors.text }]}>
              Check Your Email
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              We've sent a password reset link to:
            </Text>
            <Text style={[styles.email, { color: colors.primary[600] }]}>
              {email}
            </Text>

            <View style={[styles.infoBox, { backgroundColor: colors.white, borderColor: colors.gray[200] }]}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>
                📧 Next Steps:
              </Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                1. Check your email inbox{'\n'}
                2. Click the reset link in the email{'\n'}
                3. Create a new password{'\n'}
                4. Sign in with your new password
              </Text>
            </View>

            <View style={[styles.tipBox, { backgroundColor: colors.secondary + '15', borderColor: colors.secondary + '30' }]}>
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                <Text style={{ fontWeight: 'bold', color: colors.text }}>Didn't receive the email?</Text>
                {'\n'}Check your spam folder or wait a few minutes and try again.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary[600] }]}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.buttonText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/New_Logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]}>
          Forgot Password?
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          No worries, we'll send you reset instructions
        </Text>

        {/* Error Message */}
        {error ? (
          <View style={[styles.errorContainer, { backgroundColor: colors.error + '20', borderColor: colors.error }]}>
            <Ionicons name="alert-circle" size={20} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        ) : null}

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Email Address
            </Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.white, borderColor: colors.gray[200] }]}>
              <Ionicons name="mail-outline" size={20} color={colors.gray[500]} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="you@example.com"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Enter the email address associated with your account
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary[600] }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Send Reset Link</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
          >
            <Ionicons name="arrow-back" size={16} color={colors.primary[600]} />
            <Text style={[styles.loginText, { color: colors.primary[600] }]}>
              Back to Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 24,
    zIndex: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 100,
    height: 100,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    padding: 20,
    borderRadius: 100,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },
  infoBox: {
    width: '100%',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
  },
  tipBox: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  tipText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
  },
  errorText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
    marginTop: 6,
  },
  button: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  loginText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
