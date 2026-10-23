/**
 * Vertex Docs Mobile - Type Definitions
 */

export type ScreenType = 'login' | 'register' | 'forgot_password' | 'dashboard';

export type DashboardTab = 'home' | 'files' | 'pdf_studio' | 'language_bridge' | 'profile';

export interface UserProfile {
  name: string;
  email: string;
  company: string;
  role: string;
  avatarUrl?: string;
  initials: string;
}

export type DocumentFormat = 'pdf' | 'docx' | 'txt' | 'scan';

export interface DocumentItem {
  id: string;
  title: string;
  format: DocumentFormat;
  size: string;
  updatedAt: string;
  isTranslated: boolean;
  sourceLanguage?: string;
  targetLanguage?: string;
  isFavorite?: boolean;
}

export interface QuickActionItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  badge?: string;
  route: DashboardTab;
}
