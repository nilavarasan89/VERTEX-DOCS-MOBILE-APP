/**
 * Vertex Docs Mobile - Login Screen UI Prototype
 * Company: JM Vertex Technologies
 * Platform: Android First (Compatible with iOS)
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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, SHADOWS, TYPOGRAPHY } from '../constants/theme';
import { BrandLogo } from '../components/common/BrandLogo';
import { CustomInput } from '../components/common/CustomInput';
import { CustomButton } from '../components/common/CustomButton';
import { Checkbox } from '../components/common/Checkbox';

interface LoginScreenProps {
  onLoginSuccess: (userEmail: string) => void;
  onNavigateToRegister: () => void;
  onNavigateToForgotPassword: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onNavigateToRegister,
  onNavigateToForgotPassword,
}) => {
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Validation & Feedback State
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formBanner, setFormBanner] = useState<{
    type: 'info' | 'error' | 'success';
    message: string;
  } | null>(null);

  // Email regex validation
  const validateEmail = (input: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(input.trim());
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) setEmailError('');
    if (formBanner) setFormBanner(null);
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (passwordError) setPasswordError('');
    if (formBanner) setFormBanner(null);
  };

  // Submission handler with clean email sign-in
  const handleSignIn = () => {
    setEmailError('');
    setPasswordError('');
    setFormBanner(null);

    const trimmedEmail = email.trim();

    // Validate email
    if (!trimmedEmail) {
      setEmailError('Please enter your email ID to sign in');
      return;
    } else if (!validateEmail(trimmedEmail)) {
      setEmailError('Please enter a valid email address (e.g. yourname@gmail.com)');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(trimmedEmail);
    }, 400);
  };

  // Google Sign-In Option
  const handleGoogleSignInPress = () => {
    onLoginSuccess(email.trim() || 'google.user@vertexdocs.app');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* A. Brand Header */}
          <View style={styles.brandHeaderContainer}>
            <BrandLogo size="standard" showSubtitle={true} showCompanyTag={true} />
          </View>

          {/* Main Card Container */}
          <View style={styles.cardContainer}>
            {/* B. Welcome Section */}
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeTitle}>Sign In with Your Email</Text>
              <Text style={styles.welcomeSubtitle}>
                Enter your email ID to convert, translate, and manage documents independently.
              </Text>
            </View>

            {/* Banner feedback if any */}
            {formBanner && (
              <View
                style={[
                  styles.banner,
                  formBanner.type === 'info' && styles.bannerInfo,
                  formBanner.type === 'error' && styles.bannerError,
                ]}
              >
                <Ionicons
                  name={
                    formBanner.type === 'info'
                      ? 'information-circle-outline'
                      : 'alert-circle-outline'
                  }
                  size={16}
                  color={formBanner.type === 'info' ? COLORS.primary : COLORS.error}
                />
                <Text
                  style={[
                    styles.bannerText,
                    formBanner.type === 'info'
                      ? styles.bannerInfoText
                      : styles.bannerErrorText,
                  ]}
                >
                  {formBanner.message}
                </Text>
              </View>
            )}

            {/* C. Login Form */}
            <View style={styles.formContainer}>
              {/* Email Address Field */}
              <CustomInput
                label="Email ID"
                placeholder="yourname@gmail.com"
                value={email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                leftIcon="mail-outline"
                error={emailError}
              />

              {/* Password Field with Show/Hide Toggle (Optional) */}
              <CustomInput
                label="Password (Optional)"
                placeholder="Optional password"
                value={password}
                onChangeText={handlePasswordChange}
                isPassword={true}
                showPasswordToggle={true}
                leftIcon="lock-closed-outline"
                error={passwordError}
              />

              {/* Remember Me & Forgot Password Row */}
              <View style={styles.optionsRow}>
                <Checkbox
                  checked={rememberMe}
                  onToggle={setRememberMe}
                  label="Remember me"
                />

                <TouchableOpacity
                  onPress={onNavigateToForgotPassword}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Forgot Password"
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              {/* Sign In Primary Button */}
              <View style={styles.signInButtonContainer}>
                <CustomButton
                  title="Sign In with Email"
                  onPress={handleSignIn}
                  variant="primary"
                  loading={isLoading}
                  rightIcon="arrow-forward"
                />
              </View>

              {/* Direct Access Quick Button */}
              <TouchableOpacity
                style={styles.directConverterButton}
                onPress={() => onLoginSuccess(email.trim() || 'user@vertexdocs.app')}
                activeOpacity={0.8}
              >
                <Ionicons name="repeat-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                <Text style={styles.directConverterButtonText}>
                  Direct Access: Open Document Converter
                </Text>
              </TouchableOpacity>

              {/* D. Alternative Login (OR Divider + Google Prototype) */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <CustomButton
                title="Continue with Google"
                onPress={handleGoogleSignInPress}
                variant="google"
                customIcon={
                  <Ionicons name="logo-google" size={17} color="#EA4335" />
                }
              />
            </View>
          </View>

          {/* E. Registration Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerPrompt}>Don't have an account? </Text>
            <TouchableOpacity
              onPress={onNavigateToRegister}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <Text style={styles.registerLink}>Create account</Text>
            </TouchableOpacity>
          </View>

          {/* F. Footer */}
          <View style={styles.footerContainer}>
            <View style={styles.secureBadgeRow}>
              <Ionicons name="lock-closed" size={12} color={COLORS.muted} />
              <Text style={styles.footerText}>Secure access to your documents</Text>
            </View>
            <Text style={styles.footerSubtext}>
              JM Vertex Technologies • v1.0.0
            </Text>
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
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xl,
    justifyContent: 'center',
  },
  brandHeaderContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  cardContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  welcomeSection: {
    marginBottom: SPACING.lg,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.navy,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  bannerInfo: {
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  bannerError: {
    backgroundColor: COLORS.errorLight,
    borderWidth: 1,
    borderColor: COLORS.errorBorder,
  },
  bannerText: {
    fontSize: 12,
    marginLeft: 6,
    flex: 1,
  },
  bannerInfoText: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  bannerErrorText: {
    color: COLORS.error,
    fontWeight: '500',
  },
  formContainer: {
    width: '100%',
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    marginBottom: SPACING.lg,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  signInButtonContainer: {
    marginBottom: SPACING.sm,
  },
  directConverterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  directConverterButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.muted,
    paddingHorizontal: SPACING.md,
    letterSpacing: 0.5,
  },
  registerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },
  registerPrompt: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  footerContainer: {
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  secureBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.muted,
    marginLeft: 5,
    fontWeight: '500',
  },
  footerSubtext: {
    fontSize: 11,
    color: '#CBD5E1',
  },
});
