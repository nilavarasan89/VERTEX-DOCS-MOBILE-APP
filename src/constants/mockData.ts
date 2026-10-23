/**
 * Vertex Docs Mobile - Mock Data for Prototype
 * JM Vertex Technologies
 */

import { DocumentItem, QuickActionItem, UserProfile } from '../types';

export const DEMO_CREDENTIALS = {
  email: 'alex.morgan@jmvertex.com',
  password: 'Password123!',
};

export const MOCK_USER: UserProfile = {
  name: 'Alex Morgan',
  email: 'alex.morgan@jmvertex.com',
  company: 'JM Vertex Technologies',
  role: 'Document Operations Lead',
  initials: 'AM',
};

export const MOCK_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc-1',
    title: 'Annual_Financial_Audit_2026.pdf',
    format: 'pdf',
    size: '4.2 MB',
    updatedAt: '2 hours ago',
    isTranslated: true,
    sourceLanguage: 'Tamil',
    targetLanguage: 'English',
    isFavorite: true,
  },
  {
    id: 'doc-2',
    title: 'Legal_Vendor_Agreement_TN.docx',
    format: 'docx',
    size: '1.8 MB',
    updatedAt: 'Yesterday',
    isTranslated: true,
    sourceLanguage: 'English',
    targetLanguage: 'Tamil',
    isFavorite: false,
  },
  {
    id: 'doc-3',
    title: 'Technical_Architecture_Overview.pdf',
    format: 'pdf',
    size: '8.5 MB',
    updatedAt: '3 days ago',
    isTranslated: false,
    sourceLanguage: 'English',
    isFavorite: true,
  },
];

export const MOCK_QUICK_ACTIONS: QuickActionItem[] = [
  {
    id: 'action-files',
    title: 'Files',
    description: 'Browse all documents & folders',
    icon: 'folder-outline',
    route: 'files',
  },
  {
    id: 'action-pdf',
    title: 'PDF Studio',
    description: 'View, annotate, highlight & sign',
    icon: 'document-text-outline',
    badge: 'Pro',
    route: 'pdf_studio',
  },
  {
    id: 'action-lang',
    title: 'Language Bridge',
    description: 'Tamil ⇄ English document translation',
    icon: 'swap-horizontal-outline',
    badge: 'AI',
    route: 'language_bridge',
  },
];

export const MOCK_DASHBOARD_STATS = {
  totalDocs: 34,
  translatedDocs: 12,
  favoriteDocs: 3,
  storageUsed: '1.2 GB of 15 GB',
};
