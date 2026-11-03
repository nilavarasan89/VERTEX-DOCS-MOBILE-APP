/**
 * Vertex Docs Mobile - Main Application Entrypoint
 * Company: JM Vertex Technologies
 * Technology: React Native + Expo + TypeScript
 */

import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ScreenType } from './src/types';
import { COLORS } from './src/constants/theme';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { ForgotPasswordScreen } from './src/screens/ForgotPasswordScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { DocumentConverterScreen } from './src/screens/DocumentConverterScreen';
import { DocumentTranslatorScreen } from './src/screens/DocumentTranslatorScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('login');
  const [userEmail, setUserEmail] = useState<string>('');
  const [translatorParams, setTranslatorParams] = useState<{
    documentTitle?: string;
    rawText?: string;
    format?: string;
  }>({});

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

  const handleBackToDashboard = () => {
    setCurrentScreen('dashboard');
  };

  const handleNavigateToTranslator = (
    documentTitle: string,
    rawText?: string,
    format?: string
  ) => {
    setTranslatorParams({ documentTitle, rawText, format });
    setCurrentScreen('translator');
  };

  const handleDirectNavigate = (screen: ScreenType) => {
    setCurrentScreen(screen);
  };

  // Render current active screen
  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return (
          <DashboardScreen
            userEmail={userEmail}
            onLogout={handleLogout}
            onNavigateScreen={handleDirectNavigate}
            onNavigateToTranslator={handleNavigateToTranslator}
          />
        );
      case 'converter':
        return (
          <DocumentConverterScreen
            onBack={handleBackToDashboard}
            onNavigateToTranslator={handleNavigateToTranslator}
            onNavigateScreen={handleDirectNavigate}
          />
        );
      case 'translator':
        return (
          <DocumentTranslatorScreen
            initialDocumentTitle={translatorParams.documentTitle}
            initialRawText={translatorParams.rawText}
            initialFormat={translatorParams.format}
            onBack={handleBackToDashboard}
            onNavigateScreen={handleDirectNavigate}
          />
        );
      case 'history':
        return (
          <HistoryScreen
            onBack={handleBackToDashboard}
            onNavigateToTranslator={handleNavigateToTranslator}
            onNavigateScreen={handleDirectNavigate}
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
        {renderScreen()}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
