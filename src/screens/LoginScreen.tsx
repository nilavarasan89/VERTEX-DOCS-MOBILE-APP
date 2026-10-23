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
import { DEMO_CREDENTIALS } from '../constants/mockData';
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

  // Quick 1-tap demo credentials autofill for reviewer
  const handleFillDemoCredentials = () => {
    setEmail(DEMO_CREDENTIALS.email);
    setPassword(DEMO_CREDENTIALS.password);
    setEmailError('');
    setPasswordError('');
    setFormBanner({
      type: 'info',
      message: 'Demo credentials pre-filled for JM Vertex reviewer.',
    });
  };

  // Submission handler with comprehensive validation
  const handleSignIn = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setFormBanner(null);

    const trimmedEmail = email.trim();

    // Validate email
    if (!trimmedEmail) {
      setEmailError('Please enter your email address');
      isValid = false;
    } else if (!validateEmail(trimmedEmail)) {
      setEmailError('Please enter a valid email address (e.g., name@domain.com)');
      isValid = false;
    }

    // Validate password
    if (!password) {
      setPasswordError('Please enter your password');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    if (!isValid) {
      return;
    }

    // Begin Simulated Authentication
    setIsLoading(true);

    // Mock API delay (1.2 seconds for realistic SaaS feel)
    setTimeout(() => {
      setIsLoading(false);

      // Check if credentials match demo or are generally well-formed for demo purposes
      onLoginSuccess(trimmedEmail);
    }, 1200);
  };

  // Google Sign-In Prototype Notice
  const handleGoogleSignInPress = () => {
    Alert.alert(
      'Google Sign-In Prototype',
      'Google authentication is a visual prototype in this internship demo build. Please use the direct Sign In button or 1-tap demo credentials.',
      [
        {
          text: 'Fill Demo Account',
          onPress: handleFillDemoCredentials,
        },
        { text: 'Got It', style: 'cancel' },
      ]
    );
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
          {/* Top Demo Bar / Quick Fill Pill */}
          <View style={styles.demoBarWrapper}>
            <TouchableOpacity
              style={styles.demoPill}
              onPress={handleFillDemoCredentials}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Fill demo credentials"
            >
              <Ionicons name="flash-outline" size={13} color={COLORS.primary} />
              <Text style={styles.demoPillText}>Auto-Fill Demo Account</Text>
            </TouchableOpacity>
          </View>

          {/* A. Brand Header */}
          <View style={styles.brandHeaderContainer}>
            <BrandLogo size="standard" showSubtitle={true} showCompanyTag={true} />
          </View>

          {/* Main Card Container */}
          <View style={styles.cardContainer}>
            {/* B. Welcome Section */}
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeTitle}>Welcome Back!</Text>
              <Text style={styles.welcomeSubtitle}>
                Sign in to access your documents and continue where you left off.
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
                label="Email Address"
                placeholder="name@company.com"
                value={email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                leftIcon="mail-outline"
                error={emailError}
              />

              {/* Password Field with Show/Hide Toggle */}
              <CustomInput
                label="Password"
                placeholder="Enter your password"
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
                  title="Sign In"
                  onPress={handleSignIn}
                  variant="primary"
                  loading={isLoading}
                  rightIcon="arrow-forward"
                />
              </View>

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
  demoBarWrapper: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  demoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  demoPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 5,
    letterSpacing: 0.1,
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
    marginBottom: SPACING.lg,
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
