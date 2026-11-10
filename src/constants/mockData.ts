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
    title: 'Tamil_Project_Report.pdf',
    format: 'pdf',
    size: '2.4 MB',
    updatedAt: 'Yesterday',
    isTranslated: true,
    sourceLanguage: 'Tamil',
    targetLanguage: 'English',
    isFavorite: false,
  },
  {
    id: 'doc-3',
    title: 'Internship_Application.docx',
    format: 'docx',
    size: '850 KB',
    updatedAt: '3 days ago',
    isTranslated: false,
    sourceLanguage: 'English',
    isFavorite: true,
  },
  {
    id: 'doc-4',
    title: 'Legal_Vendor_Contract_TN.pdf',
    format: 'pdf',
    size: '5.1 MB',
    updatedAt: 'May 12, 2026',
    isTranslated: true,
    sourceLanguage: 'English',
    targetLanguage: 'Tamil',
    isFavorite: false,
  },
];

export const MOCK_QUICK_ACTIONS: QuickActionItem[] = [
  {
    id: 'action-image-to-pdf',
    title: 'Image to PDF',
    description: 'Combine multiple images into one PDF',
    icon: 'images-outline',
    badge: 'New',
    route: 'image_to_pdf',
    screenTarget: 'image_to_pdf',
  },
  {
    id: 'action-pdf-to-image',
    title: 'PDF to Image',
    description: 'Extract high quality images from PDF pages',
    icon: 'image-outline',
    badge: 'New',
    route: 'pdf_to_image',
    screenTarget: 'pdf_to_image',
  },
  {
    id: 'action-converter',
    title: 'Document Converter',
    description: 'Convert PDF, Word, PPT & Images in 11+ formats',
    icon: 'repeat-outline',
    badge: 'Module 1',
    route: 'converter',
    screenTarget: 'converter',
  },
  {
    id: 'action-translator',
    title: 'Document Translator',
    description: 'Tamil ⇄ English & multilingual neural translation',
    icon: 'language-outline',
    badge: 'Module 2',
    route: 'translator',
    screenTarget: 'translator',
  },
  {
    id: 'action-history',
    title: 'Conversion History',
    description: 'Track, view, and share all converted documents',
    icon: 'time-outline',
    route: 'history',
    screenTarget: 'history',
  },
  {
    id: 'action-pdf',
    title: 'PDF Studio',
    description: 'View, annotate, highlight & sign',
    icon: 'document-text-outline',
    badge: 'Pro',
    route: 'pdf_studio',
  },
];

export const MOCK_DASHBOARD_STATS = {
  totalDocs: 34,
  translatedDocs: 12,
  favoriteDocs: 3,
  storageUsed: '1.2 GB of 15 GB',
};

export const MOCK_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Translation Complete',
    description: 'Tamil_Project_Report.pdf was translated to English.',
    time: '10m ago',
    unread: true,
  },
  {
    id: 'notif-2',
    title: 'New Shared Document',
    description: 'Annual_Financial_Audit_2026.pdf was shared by Finance Team.',
    time: '2h ago',
    unread: true,
  },
];
