/**
 * Vertex Docs Mobile - Type Definitions
 * Company: JM Vertex Technologies
 */

export * from './converter';
export * from './translator';
export * from './history';

export type ScreenType =
  | 'login'
  | 'register'
  | 'forgot_password'
  | 'dashboard'
  | 'converter'
  | 'compress'
  | 'merge'
  | 'ai'
  | 'translator'
  | 'history'
  | 'image_to_pdf'
  | 'pdf_to_image';

export type DashboardTab =
  | 'home'
  | 'recent'
  | 'settings'
  | 'files'
  | 'converter'
  | 'compress'
  | 'merge'
  | 'ai'
  | 'translator'
  | 'history'
  | 'pdf_studio'
  | 'language_bridge'
  | 'profile'
  | 'image_to_pdf'
  | 'pdf_to_image';

export interface UserProfile {
  name: string;
  email: string;
  company: string;
  role: string;
  avatarUrl?: string;
  initials: string;
}

export type DocumentFormat = 'pdf' | 'docx' | 'pptx' | 'txt' | 'jpg' | 'png' | 'scan';

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
  resultUri?: string;
}

export interface QuickActionItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  badge?: string;
  route: DashboardTab;
  screenTarget?: ScreenType;
}
