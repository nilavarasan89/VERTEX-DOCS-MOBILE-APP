/**
 * Vertex Docs Mobile - Forgot Password Screen UI Prototype
 * JM Vertex Technologies
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../constants/theme';
import { HeaderBar } from '../components/common/HeaderBar';
import { CustomInput } from '../components/common/CustomInput';
import { CustomButton } from '../components/common/CustomButton';

interface ForgotPasswordScreenProps {
  onBackToLogin: () => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  onBackToLogin,
}) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSendLink = () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError('Please enter your work or registered email');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBar
        title="Password Recovery"
        subtitle="Vertex Docs Security"
        onBackPress={onBackToLogin}
      />

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            {/* Visual Header */}
            <View style={styles.iconCircle}>
              <Ionicons
                name={isSuccess ? 'mail-open-outline' : 'key-outline'}
                size={30}
                color={isSuccess ? COLORS.success : COLORS.primary}
              />
            </View>

            <Text style={styles.title}>
              {isSuccess ? 'Check Your Inbox' : 'Reset Your Password'}
            </Text>

            <Text style={styles.subtitle}>
              {isSuccess
                ? `A password reset link has been dispatched to ${email}. Please check your inbox and follow the instructions.`
                : 'Enter your registered email address and we will send you a secure link to reset your account password.'}
            </Text>

            {isSuccess ? (
              <View style={styles.successActions}>
                <View style={styles.successBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                  <Text style={styles.successBadgeText}>Link sent successfully</Text>
                </View>

                <CustomButton
                  title="Return to Sign In"
                  onPress={onBackToLogin}
                  variant="primary"
                  leftIcon="arrow-back"
                  style={styles.primaryBtn}
                />

                <TouchableOpacity
                  style={styles.resendBtn}
                  onPress={() => {
                    setIsSuccess(false);
                    setEmail('');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.resendText}>Try another email</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.formSection}>
                <CustomInput
                  label="Registered Email Address"
                  placeholder="name@company.com"
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    if (emailError) setEmailError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon="mail-outline"
                  error={emailError}
                />

                <CustomButton
                  title="Send Reset Instructions"
                  onPress={handleSendLink}
                  variant="primary"
                  loading={isLoading}
                  rightIcon="paper-plane-outline"
                  style={styles.primaryBtn}
                />

                <TouchableOpacity
                  style={styles.backLink}
                  onPress={onBackToLogin}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-back" size={16} color={COLORS.textSecondary} />
                  <Text style={styles.backLinkText}>Back to Sign In</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.sm,
  },
  formSection: {
    width: '100%',
  },
  primaryBtn: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  successActions: {
    width: '100%',
    alignItems: 'center',
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.xl,
  },
  successBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.success,
    marginLeft: 6,
  },
  resendBtn: {
    paddingVertical: SPACING.sm,
  },
  resendText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
});
