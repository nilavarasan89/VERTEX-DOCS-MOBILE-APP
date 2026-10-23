/**
 * Vertex Docs Mobile - Sample Dashboard UI Prototype
 * JM Vertex Technologies
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../constants/theme';
import {
  MOCK_DOCUMENTS,
  MOCK_QUICK_ACTIONS,
  MOCK_DASHBOARD_STATS,
  MOCK_USER,
} from '../constants/mockData';
import { DashboardTab, DocumentItem } from '../types';

interface DashboardScreenProps {
  userEmail?: string;
  onLogout: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  userEmail,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('home');
  const [recentDocs, setRecentDocs] = useState<DocumentItem[]>(MOCK_DOCUMENTS);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);

  const toggleFavorite = (docId: string) => {
    setRecentDocs((prev) =>
      prev.map((doc) =>
        doc.id === docId ? { ...doc, isFavorite: !doc.isFavorite } : doc
      )
    );
  };

  const handleUploadDocument = () => {
    Alert.alert(
      'Upload Document',
      'Choose an action to test document workflow in Vertex Docs Mobile:',
      [
        {
          text: 'Upload PDF for Viewing',
          onPress: () => Alert.alert('PDF Viewer', 'Sample PDF loaded into PDF Studio!'),
        },
        {
          text: 'Translate Tamil ⇄ English',
          onPress: () => {
            setActiveTab('language_bridge');
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleDocumentPress = (doc: DocumentItem) => {
    setSelectedDoc(doc);
    Alert.alert(
      doc.title,
      `Format: ${doc.format.toUpperCase()}\nSize: ${doc.size}\nLast Modified: ${doc.updatedAt}\n${
        doc.isTranslated
          ? `Translation: ${doc.sourceLanguage} ⇄ ${doc.targetLanguage} (Verified)`
          : 'Language: English'
      }`,
      [
        {
          text: 'Open in PDF Studio',
          onPress: () => setActiveTab('pdf_studio'),
        },
        {
          text: 'Open Language Bridge',
          onPress: () => setActiveTab('language_bridge'),
        },
        { text: 'Close', style: 'cancel' },
      ]
    );
  };

  const handleConfirmLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to return to the Login screen?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: onLogout,
        },
      ]
    );
  };

  // Render contextual content when user navigates through tabs
  const renderTabContent = () => {
    if (activeTab === 'files') {
      return (
        <View style={styles.tabPlaceholderCard}>
          <Ionicons name="folder-open-outline" size={44} color={COLORS.primary} />
          <Text style={styles.tabPlaceholderTitle}>Document Repository</Text>
          <Text style={styles.tabPlaceholderDesc}>
            Organize, search, and manage all your enterprise files and cloud storage backups.
          </Text>
          <TouchableOpacity
            style={styles.tabActionBtn}
            onPress={() => setActiveTab('home')}
          >
            <Text style={styles.tabActionBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (activeTab === 'pdf_studio') {
      return (
        <View style={styles.tabPlaceholderCard}>
          <Ionicons name="document-text-outline" size={44} color={COLORS.primary} />
          <Text style={styles.tabPlaceholderTitle}>PDF Studio</Text>
          <Text style={styles.tabPlaceholderDesc}>
            Read, highlight, annotate, bookmark, and digitally sign multi-page PDF documents.
          </Text>
          <TouchableOpacity
            style={styles.tabActionBtn}
            onPress={() => setActiveTab('home')}
          >
            <Text style={styles.tabActionBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (activeTab === 'language_bridge') {
      return (
        <View style={styles.tabPlaceholderCard}>
          <View style={styles.langHeaderIconRow}>
            <View style={styles.langBadgePill}>
              <Text style={styles.langBadgePillText}>தமிழ் (Tamil)</Text>
            </View>
            <Ionicons name="swap-horizontal" size={24} color={COLORS.primary} />
            <View style={styles.langBadgePill}>
              <Text style={styles.langBadgePillText}>English</Text>
            </View>
          </View>
          <Text style={styles.tabPlaceholderTitle}>Language Bridge Engine</Text>
          <Text style={styles.tabPlaceholderDesc}>
            Translating complex legal, financial, and technical documents between Tamil and English while preserving formatting.
          </Text>
          <TouchableOpacity
            style={styles.tabActionBtn}
            onPress={() => setActiveTab('home')}
          >
            <Text style={styles.tabActionBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (activeTab === 'profile') {
      return (
        <View style={styles.tabPlaceholderCard}>
          <View style={styles.profileAvatarLarge}>
            <Text style={styles.profileAvatarLargeText}>{MOCK_USER.initials}</Text>
          </View>
          <Text style={styles.tabPlaceholderTitle}>{MOCK_USER.name}</Text>
          <Text style={styles.tabPlaceholderSub}>
            {userEmail || MOCK_USER.email}
          </Text>
          <Text style={styles.tabPlaceholderDesc}>
            {MOCK_USER.role} • {MOCK_USER.company}
          </Text>
          <TouchableOpacity
            style={[styles.tabActionBtn, { backgroundColor: COLORS.errorLight, borderColor: COLORS.errorBorder }]}
            onPress={handleConfirmLogout}
          >
            <Ionicons name="log-out-outline" size={16} color={COLORS.error} />
            <Text style={[styles.tabActionBtnText, { color: COLORS.error, marginLeft: 6 }]}>
              Sign Out to Login Screen
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Default: Home Dashboard view
    return (
      <>
        {/* Upload Document Card */}
        <View style={styles.uploadCard}>
          <View style={styles.uploadCardHeader}>
            <View style={styles.uploadIconCircle}>
              <Ionicons name="cloud-upload" size={26} color="#FFFFFF" />
            </View>
            <View style={styles.uploadTextContainer}>
              <Text style={styles.uploadCardTitle}>Upload Document</Text>
              <Text style={styles.uploadCardSubtitle}>
                Scan, import PDF, or Tamil document for instant translation
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleUploadDocument}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <Ionicons name="add" size={18} color={COLORS.primary} />
            <Text style={styles.uploadButtonText}>Select File or Scan</Text>
          </TouchableOpacity>

          {/* Quick Metrics */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{MOCK_DASHBOARD_STATS.totalDocs}</Text>
              <Text style={styles.metricLabel}>Total Files</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: COLORS.teal }]}>
                {MOCK_DASHBOARD_STATS.translatedDocs}
              </Text>
              <Text style={styles.metricLabel}>Translated</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{MOCK_DASHBOARD_STATS.favoriteDocs}</Text>
              <Text style={styles.metricLabel}>Favorites</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <Text style={styles.sectionSubtitle}>Productivity tools</Text>
        </View>

        <View style={styles.quickActionsContainer}>
          {MOCK_QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.quickActionCard}
              onPress={() => setActiveTab(action.route)}
              activeOpacity={0.7}
            >
              <View style={styles.quickActionTopRow}>
                <View style={styles.quickActionIconWrapper}>
                  <Ionicons
                    name={action.icon as keyof typeof Ionicons.glyphMap}
                    size={20}
                    color={COLORS.primary}
                  />
                </View>
                {action.badge && (
                  <View
                    style={[
                      styles.actionBadge,
                      action.badge === 'AI' && styles.actionBadgeAI,
                    ]}
                  >
                    <Text
                      style={[
                        styles.actionBadgeText,
                        action.badge === 'AI' && styles.actionBadgeAIText,
                      ]}
                    >
                      {action.badge}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.quickActionTitle}>{action.title}</Text>
              <Text style={styles.quickActionDesc} numberOfLines={2}>
                {action.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Files Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.recentFilesTitleRow}>
            <Text style={styles.sectionTitle}>Recent Files</Text>
            <View style={styles.fileCountBadge}>
              <Text style={styles.fileCountBadgeText}>{recentDocs.length} files</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setActiveTab('files')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.recentFilesList}>
          {recentDocs.map((doc) => {
            const isPdf = doc.format === 'pdf';
            return (
              <TouchableOpacity
                key={doc.id}
                style={styles.fileItemCard}
                onPress={() => handleDocumentPress(doc)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.fileFormatIcon,
                    isPdf ? styles.pdfFormatIcon : styles.docxFormatIcon,
                  ]}
                >
                  <Ionicons
                    name={isPdf ? 'document-text' : 'document'}
                    size={22}
                    color={isPdf ? '#DC2626' : COLORS.primary}
                  />
                  <Text
                    style={[
                      styles.formatTagText,
                      { color: isPdf ? '#DC2626' : COLORS.primary },
                    ]}
                  >
                    {doc.format.toUpperCase()}
                  </Text>
                </View>

                <View style={styles.fileDetails}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {doc.title}
                  </Text>

                  <View style={styles.fileMetaRow}>
                    <Text style={styles.fileMetaText}>{doc.size}</Text>
                    <Text style={styles.fileMetaDot}>•</Text>
                    <Text style={styles.fileMetaText}>{doc.updatedAt}</Text>
                  </View>

                  {doc.isTranslated && (
                    <View style={styles.translationPill}>
                      <Ionicons
                        name="swap-horizontal"
                        size={11}
                        color={COLORS.teal}
                      />
                      <Text style={styles.translationPillText}>
                        {doc.sourceLanguage} ⇄ {doc.targetLanguage}
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.favoriteButton}
                  onPress={() => toggleFavorite(doc.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={doc.isFavorite ? 'star' : 'star-outline'}
                    size={20}
                    color={doc.isFavorite ? '#F59E0B' : COLORS.muted}
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.topHeaderLeft}>
          <View style={styles.companyBadge}>
            <View style={styles.companyDot} />
            <Text style={styles.companyBadgeText}>JM Vertex Technologies</Text>
          </View>
          <Text style={styles.greetingTitle}>Hello, Welcome to Vertex Docs</Text>
          <Text style={styles.greetingSubtitle}>
            Signed in as {userEmail || MOCK_USER.email}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleConfirmLogout}
          activeOpacity={0.7}
          accessibilityLabel="Sign Out"
        >
          <Ionicons name="log-out-outline" size={20} color={COLORS.navy} />
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderTabContent()}

        {/* Demo Notice */}
        <View style={styles.demoNoticeContainer}>
          <Ionicons name="information-circle-outline" size={14} color={COLORS.muted} />
          <Text style={styles.demoNoticeText}>
            Vertex Docs Mobile Prototype • Internship Demonstration
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'home' && styles.navItemActive]}
          onPress={() => setActiveTab('home')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'home' ? 'home' : 'home-outline'}
            size={22}
            color={activeTab === 'home' ? COLORS.primary : COLORS.muted}
          />
          <Text
            style={[
              styles.navLabel,
              activeTab === 'home' && styles.navLabelActive,
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'files' && styles.navItemActive]}
          onPress={() => setActiveTab('files')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'files' ? 'folder' : 'folder-outline'}
            size={22}
            color={activeTab === 'files' ? COLORS.primary : COLORS.muted}
          />
          <Text
            style={[
              styles.navLabel,
              activeTab === 'files' && styles.navLabelActive,
            ]}
          >
            Files
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navItem,
            activeTab === 'pdf_studio' && styles.navItemActive,
          ]}
          onPress={() => setActiveTab('pdf_studio')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'pdf_studio' ? 'document-text' : 'document-text-outline'}
            size={22}
            color={activeTab === 'pdf_studio' ? COLORS.primary : COLORS.muted}
          />
          <Text
            style={[
              styles.navLabel,
              activeTab === 'pdf_studio' && styles.navLabelActive,
            ]}
          >
            PDF Studio
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navItem,
            activeTab === 'language_bridge' && styles.navItemActive,
          ]}
          onPress={() => setActiveTab('language_bridge')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={
              activeTab === 'language_bridge'
                ? 'swap-horizontal'
                : 'swap-horizontal-outline'
            }
            size={22}
            color={activeTab === 'language_bridge' ? COLORS.primary : COLORS.muted}
          />
          <Text
            style={[
              styles.navLabel,
              activeTab === 'language_bridge' && styles.navLabelActive,
            ]}
          >
            Language Bridge
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navItem,
            activeTab === 'profile' && styles.navItemActive,
          ]}
          onPress={() => setActiveTab('profile')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'profile' ? 'person' : 'person-outline'}
            size={22}
            color={activeTab === 'profile' ? COLORS.primary : COLORS.muted}
          />
          <Text
            style={[
              styles.navLabel,
              activeTab === 'profile' && styles.navLabelActive,
            ]}
          >
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  topHeaderLeft: {
    flex: 1,
  },
  companyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  companyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.teal,
    marginRight: 6,
  },
  companyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.teal,
    letterSpacing: 0.5,
  },
  greetingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.navy,
    letterSpacing: -0.3,
  },
  greetingSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  logoutButton: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.md,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  uploadCard: {
    backgroundColor: COLORS.navy,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    ...SHADOWS.card,
  },
  uploadCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  uploadIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  uploadTextContainer: {
    flex: 1,
  },
  uploadCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  uploadCardSubtitle: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 17,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    height: 44,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 6,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    paddingTop: SPACING.md,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  metricLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  recentFilesTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileCountBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    marginLeft: 8,
  },
  fileCountBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.subtle,
  },
  quickActionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  quickActionIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  actionBadgeAI: {
    backgroundColor: COLORS.tealSoft,
  },
  actionBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.navy,
  },
  actionBadgeAIText: {
    color: COLORS.teal,
  },
  quickActionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 4,
  },
  quickActionDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 15,
  },
  recentFilesList: {
    gap: SPACING.sm,
  },
  fileItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.subtle,
  },
  fileFormatIcon: {
    width: 44,
    height: 48,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  pdfFormatIcon: {
    backgroundColor: '#FEF2F2',
  },
  docxFormatIcon: {
    backgroundColor: '#EFF6FF',
  },
  formatTagText: {
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 3,
  },
  fileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileMetaText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  fileMetaDot: {
    fontSize: 11,
    color: COLORS.muted,
    marginHorizontal: 5,
  },
  translationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.tealSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    marginTop: 4,
  },
  translationPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.teal,
    marginLeft: 4,
  },
  favoriteButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  demoNoticeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xl,
    paddingVertical: SPACING.sm,
  },
  demoNoticeText: {
    fontSize: 11,
    color: COLORS.muted,
    marginLeft: 5,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingVertical: 8,
    paddingHorizontal: 4,
    ...SHADOWS.subtle,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  navItemActive: {},
  navLabel: {
    fontSize: 10,
    color: COLORS.muted,
    marginTop: 3,
    fontWeight: '500',
  },
  navLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  tabPlaceholderCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xxxl,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    marginVertical: SPACING.lg,
    ...SHADOWS.card,
  },
  tabPlaceholderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.navy,
    marginTop: SPACING.md,
    marginBottom: 6,
  },
  tabPlaceholderSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  tabPlaceholderDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  tabActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  tabActionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  langHeaderIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: SPACING.sm,
  },
  langBadgePill: {
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  langBadgePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  profileAvatarLarge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  profileAvatarLargeText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
