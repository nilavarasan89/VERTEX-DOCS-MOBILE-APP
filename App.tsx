/**
 * Vertex Docs Mobile - Main Application Entrypoint
 * Company: JM Vertex Technologies
 * Technology: React Native + Expo + TypeScript
 */

import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScreenType } from './src/types';
import { COLORS, RADIUS, SPACING } from './src/constants/theme';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { ForgotPasswordScreen } from './src/screens/ForgotPasswordScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('login');
  const [userEmail, setUserEmail] = useState<string>('alex.morgan@jmvertex.com');
  const [showDemoNav, setShowDemoNav] = useState(false);

  // Authentication & Navigation Handlers
  const handleLoginSuccess = (email: string) => {
    setUserEmail(email);
    setCurrentScreen('dashboard');
  };

  const handleRegisterSuccess = (email: string) => {
    setUserEmail(email);
    setCurrentScreen('dashboard');
  };

  const handleLogout = () => {
    setCurrentScreen('login');
  };

  const handleNavigateToRegister = () => {
    setCurrentScreen('register');
  };

  const handleNavigateToForgotPassword = () => {
    setCurrentScreen('forgot_password');
  };

  const handleBackToLogin = () => {
    setCurrentScreen('login');
  };

  // Render current active screen
  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return (
          <DashboardScreen
            userEmail={userEmail}
            onLogout={handleLogout}
          />
        );
      case 'register':
        return (
          <RegisterScreen
            onBackToLogin={handleBackToLogin}
            onRegisterSuccess={handleRegisterSuccess}
          />
        );
      case 'forgot_password':
        return (
          <ForgotPasswordScreen
            onBackToLogin={handleBackToLogin}
          />
        );
      case 'login':
      default:
        return (
          <LoginScreen
            onLoginSuccess={handleLoginSuccess}
            onNavigateToRegister={handleNavigateToRegister}
            onNavigateToForgotPassword={handleNavigateToForgotPassword}
          />
        );
    }
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar style="dark" />

        {/* Current Active Screen View */}
        {renderScreen()}

        {/* Floating Demo Navigator Pill (For Internship Reviewers) */}
        <View style={styles.floatingSwitcherContainer}>
          {showDemoNav ? (
            <View style={styles.demoNavCard}>
              <View style={styles.demoNavHeader}>
                <View style={styles.demoNavHeaderLeft}>
                  <View style={styles.demoDot} />
                  <Text style={styles.demoNavTitle}>Screen Switcher (Reviewer Mode)</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowDemoNav(false)}
                  style={styles.demoCloseBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={16} color={COLORS.navy} />
                </TouchableOpacity>
              </View>

              <View style={styles.demoButtonGrid}>
                <TouchableOpacity
                  style={[
                    styles.demoNavButton,
                    currentScreen === 'login' && styles.demoNavButtonActive,
                  ]}
                  onPress={() => setCurrentScreen('login')}
                >
                  <Text
                    style={[
                      styles.demoNavButtonText,
                      currentScreen === 'login' && styles.demoNavButtonTextActive,
                    ]}
                  >
                    Login
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.demoNavButton,
                    currentScreen === 'dashboard' && styles.demoNavButtonActive,
                  ]}
                  onPress={() => setCurrentScreen('dashboard')}
                >
                  <Text
                    style={[
                      styles.demoNavButtonText,
                      currentScreen === 'dashboard' && styles.demoNavButtonTextActive,
                    ]}
                  >
                    Dashboard
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.demoNavButton,
                    currentScreen === 'forgot_password' && styles.demoNavButtonActive,
                  ]}
                  onPress={() => setCurrentScreen('forgot_password')}
                >
                  <Text
                    style={[
                      styles.demoNavButtonText,
                      currentScreen === 'forgot_password' && styles.demoNavButtonTextActive,
                    ]}
                  >
                    Forgot Pass
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.demoNavButton,
                    currentScreen === 'register' && styles.demoNavButtonActive,
                  ]}
                  onPress={() => setCurrentScreen('register')}
                >
                  <Text
                    style={[
                      styles.demoNavButtonText,
                      currentScreen === 'register' && styles.demoNavButtonTextActive,
                    ]}
                  >
                    Register
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.floatingTriggerPill}
              onPress={() => setShowDemoNav(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="layers-outline" size={13} color="#FFFFFF" />
              <Text style={styles.floatingTriggerText}>Reviewer Mode</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  floatingSwitcherContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 32 : 16,
    right: 16,
    zIndex: 999,
  },
  floatingTriggerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.navy,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  floatingTriggerText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 5,
    letterSpacing: 0.2,
  },
  demoNavCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    width: 280,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  demoNavHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  demoNavHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  demoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.teal,
    marginRight: 6,
  },
  demoNavTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.navy,
  },
  demoCloseBtn: {
    padding: 2,
  },
  demoButtonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  demoNavButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  demoNavButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  demoNavButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  demoNavButtonTextActive: {
    color: '#FFFFFF',
  },
});
