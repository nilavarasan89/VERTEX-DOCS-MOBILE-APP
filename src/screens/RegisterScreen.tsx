/**
 * Vertex Docs Mobile - Register Screen UI Prototype
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
import { Checkbox } from '../components/common/Checkbox';

interface RegisterScreenProps {
  onBackToLogin: () => void;
  onRegisterSuccess: (userEmail: string) => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onBackToLogin,
  onRegisterSuccess,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    const emailTrimmed = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailTrimmed) {
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(emailTrimmed)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!agreeTerms) {
      newErrors.terms = 'Please accept the Terms of Service to continue';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = () => {
    if (!validate()) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onRegisterSuccess(email.trim());
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBar
        title="Create Account"
        subtitle="Join Vertex Docs"
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
            <View style={styles.titleSection}>
              <Text style={styles.title}>Start Simplifying Docs</Text>
              <Text style={styles.subtitle}>
                Create an account to manage files, view PDFs, and translate Tamil documents.
              </Text>
            </View>

            <View style={styles.form}>
              <CustomInput
                label="Full Name"
                placeholder="e.g. Alex Morgan"
                value={fullName}
                onChangeText={(val) => {
                  setFullName(val);
                  if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
                }}
                leftIcon="person-outline"
                error={errors.fullName}
              />

              <CustomInput
                label="Work Email"
                placeholder="name@company.com"
                value={email}
                onChangeText={(val) => {
                  setEmail(val);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon="mail-outline"
                error={errors.email}
              />

              <CustomInput
                label="Password"
                placeholder="Create a strong password"
                value={password}
                onChangeText={(val) => {
                  setPassword(val);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                }}
                isPassword={true}
                showPasswordToggle={true}
                leftIcon="lock-closed-outline"
                error={errors.password}
              />

              <CustomInput
                label="Confirm Password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChangeText={(val) => {
                  setConfirmPassword(val);
                  if (errors.confirmPassword)
                    setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                }}
                isPassword={true}
                showPasswordToggle={true}
                leftIcon="shield-checkmark-outline"
                error={errors.confirmPassword}
              />

              <View style={styles.termsWrapper}>
                <Checkbox
                  checked={agreeTerms}
                  onToggle={(val) => {
                    setAgreeTerms(val);
                    if (errors.terms) setErrors((prev) => ({ ...prev, terms: '' }));
                  }}
                  label="I agree to JM Vertex Terms & Privacy Policy"
                />
                {errors.terms && (
                  <Text style={styles.termsErrorText}>{errors.terms}</Text>
                )}
              </View>

              <CustomButton
                title="Create Account"
                onPress={handleRegister}
                variant="primary"
                loading={isLoading}
                rightIcon="checkmark-circle-outline"
                style={styles.submitBtn}
              />
            </View>

            <View style={styles.loginRow}>
              <Text style={styles.loginPrompt}>Already have an account? </Text>
              <TouchableOpacity onPress={onBackToLogin} activeOpacity={0.7}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
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
    ...SHADOWS.card,
  },
  titleSection: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  form: {
    width: '100%',
  },
  termsWrapper: {
    marginVertical: SPACING.sm,
  },
  termsErrorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 4,
    paddingLeft: 28,
  },
  submitBtn: {
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginPrompt: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
