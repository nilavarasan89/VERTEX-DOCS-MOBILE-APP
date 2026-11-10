/**
 * Vertex Docs Mobile - Main Dashboard Screen (Phase 1 Redesign)
 * Company: JM Vertex Technologies
 * 
 * Features:
 * 1. Clean Header with Vertex Docs logo, title, and profile/settings icon.
 * 2. Welcome section: "What would you like to do today?" + "Manage your documents in one place."
 * 3. 4 Main Feature Cards in a balanced 2-column grid:
 *    - Converter: Convert documents and images into different formats.
 *    - Compress: Reduce file sizes without unnecessary quality loss.
 *    - Merge: Combine multiple files into one document.
 *    - AI: Explore smart document assistance.
 * 4. Recent files section with filename, type badge, date, file size, Open and Share actions.
 * 5. Simple, consistent 3-tab Bottom Navigation: Home, Recent, Settings.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { AppHeader } from '../components/common/AppHeader';
import { FeatureCard } from '../components/common/FeatureCard';
import { MOCK_DOCUMENTS, MOCK_USER } from '../constants/mockData';
import { historyService } from '../services/historyService';
import { fileViewerService } from '../services/fileViewerService';
import { DashboardTab, DocumentItem, ScreenType } from '../types';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../constants/theme';
import { formatBytes } from '../constants/formatMatrix';

interface DashboardScreenProps {
  userEmail?: string;
  onLogout: () => void;
  onNavigateScreen?: (screen: ScreenType) => void;
  onNavigateToTranslator?: (documentTitle: string, rawText?: string, format?: string) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  userEmail,
  onLogout,
  onNavigateScreen,
  onNavigateToTranslator,
}) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'home' | 'recent' | 'settings'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pdf' | 'docx' | 'image'>('all');

  // Derive user info
  const derivedName = useMemo(() => {
    if (!userEmail) return MOCK_USER.name;
    const namePart = userEmail.split('@')[0];
    return namePart
      .split(/[._-]/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }, [userEmail]);

  // Combine real history and seeded mock documents for a rich initial experience
  const allRecentFiles = useMemo(() => {
    const historyItems = historyService.getAll();
    const mappedHistory: DocumentItem[] = historyItems.map((h) => ({
      id: h.id,
      title: h.resultFileName || h.title,
      format: (h.meta?.targetFormat || h.sourceBadge?.toLowerCase() || 'pdf') as any,
      size: h.fileSizeFormatted || '1.2 MB',
      updatedAt: h.date || 'Recent',
      isTranslated: h.type === 'translation',
      isFavorite: false,
      resultUri: h.resultUri,
    }));

    // Seeded initial docs if history is empty
    return mappedHistory.length > 0 ? mappedHistory : MOCK_DOCUMENTS;
  }, [activeTab]);

  // Filtered files for the Recent tab
  const filteredRecentFiles = useMemo(() => {
    return allRecentFiles.filter((doc) => {
      if (filterType !== 'all') {
        if (filterType === 'image') {
          if (!['jpg', 'jpeg', 'png', 'webp'].includes(doc.format.toLowerCase())) {
            return false;
          }
        } else if (doc.format.toLowerCase() !== filterType) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          doc.title.toLowerCase().includes(q) ||
          doc.format.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allRecentFiles, filterType, searchQuery]);

  // Handle open document directly in native viewer (Word, Docs, PDF viewer)
  const handleOpenDoc = async (doc: DocumentItem) => {
    if (doc.resultUri) {
      const info = await FileSystem.getInfoAsync(doc.resultUri);
      if (info.exists) {
        await fileViewerService.openFile(doc.resultUri, doc.title, doc.format);
        return;
      }
    }

    Alert.alert(
      doc.title,
      `Format: ${doc.format.toUpperCase()}\nSize: ${doc.size}\nUpdated: ${doc.updatedAt}`,
      [
        { text: 'Close', style: 'cancel' },
        {
          text: 'Translate This Document',
          onPress: () => {
            if (onNavigateToTranslator) {
              onNavigateToTranslator(doc.title, undefined, doc.format);
            } else if (onNavigateScreen) {
              onNavigateScreen('translator');
            }
          },
        },
      ]
    );
  };

  // Handle share document
  const handleShareDoc = async (doc: DocumentItem) => {
    if (doc.resultUri) {
      const info = await FileSystem.getInfoAsync(doc.resultUri);
      if (info.exists) {
        await fileViewerService.shareFile(doc.resultUri, doc.title, doc.format);
        return;
      }
    }

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      Alert.alert('Share Document', `Document "${doc.title}" can be shared after processing.`);
    } else {
      Alert.alert('Share', 'Sharing dialog is not available on this device.');
    }
  };

  // RENDER: Home Tab Content
  const renderHomeTab = () => (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* 2. Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeGreeting}>What would you like to do today?</Text>
        <Text style={styles.welcomeSubtitle}>
          Manage your documents in one place.
        </Text>
      </View>

      {/* 3. Main Feature Section (2-Column Grid) */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionHeading}>Core Utilities</Text>

        <View style={styles.featureGridRow}>
          <FeatureCard
            title="Converter"
            description="Convert documents and images into different formats."
            icon="swap-horizontal"
            accentColor="#2563EB"
            onPress={() => onNavigateScreen && onNavigateScreen('converter')}
          />
          <FeatureCard
            title="Compress"
            description="Reduce file sizes without unnecessary quality loss."
            icon="contract"
            accentColor="#D97706"
            onPress={() => onNavigateScreen && onNavigateScreen('compress')}
          />
        </View>

        <View style={styles.featureGridRow}>
          <FeatureCard
            title="Merge"
            description="Combine multiple files into one document."
            icon="layers"
            accentColor="#4F46E5"
            onPress={() => onNavigateScreen && onNavigateScreen('merge')}
          />
          <FeatureCard
            title="AI"
            description="Explore smart document assistance."
            icon="sparkles"
            accentColor="#059669"
            badge="NEW"
            onPress={() => onNavigateScreen && onNavigateScreen('ai')}
          />
        </View>
      </View>

      {/* Secondary Quick Utilities Banner (Image to PDF & PDF to Image) */}
      <View style={styles.quickUtilitySection}>
        <Text style={styles.sectionHeading}>Dedicated Photo & PDF Tools</Text>
        <View style={styles.quickUtilityRow}>
          <TouchableOpacity
            style={styles.quickUtilityChip}
            onPress={() => onNavigateScreen && onNavigateScreen('image_to_pdf')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickUtilityIcon, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="images-outline" size={18} color="#2563EB" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.quickUtilityTitle}>Image to PDF</Text>
              <Text style={styles.quickUtilitySub}>A4/Letter layouts</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickUtilityChip}
            onPress={() => onNavigateScreen && onNavigateScreen('pdf_to_image')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickUtilityIcon, { backgroundColor: '#FDF4FF' }]}>
              <Ionicons name="image-outline" size={18} color="#9333EA" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.quickUtilityTitle}>PDF to Image</Text>
              <Text style={styles.quickUtilitySub}>PNG/JPG export</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 4. Recent Files Section */}
      <View style={styles.recentSection}>
        <View style={styles.recentHeaderRow}>
          <Text style={styles.sectionHeading}>Recent Files</Text>
          <TouchableOpacity
            onPress={() => setActiveTab('recent')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.seeAllText}>See all ({allRecentFiles.length})</Text>
          </TouchableOpacity>
        </View>

        {allRecentFiles.slice(0, 4).map((file) => (
          <View key={file.id} style={styles.fileCard}>
            <View style={styles.fileIconBox}>
              <Ionicons
                name={
                  ['jpg', 'jpeg', 'png'].includes(file.format.toLowerCase())
                    ? 'image'
                    : 'document-text'
                }
                size={22}
                color={COLORS.primary}
              />
            </View>

            <View style={styles.fileDetails}>
              <Text style={styles.fileName} numberOfLines={1}>
                {file.title}
              </Text>
              <View style={styles.fileMetaRow}>
                <View style={styles.formatBadge}>
                  <Text style={styles.formatBadgeText}>{file.format.toUpperCase()}</Text>
                </View>
                <Text style={styles.fileMetaText}>
                  {file.size} • {file.updatedAt}
                </Text>
              </View>
            </View>

            <View style={styles.fileActionsRow}>
              <TouchableOpacity
                style={styles.actionIconBtn}
                onPress={() => handleOpenDoc(file)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="eye-outline" size={18} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionIconBtn}
                onPress={() => handleShareDoc(file)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="share-social-outline" size={18} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {allRecentFiles.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={36} color="#CBD5E1" />
            <Text style={styles.emptyStateTitle}>No recent files</Text>
            <Text style={styles.emptyStateSub}>
              Files you convert, compress, or merge will appear here.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  // RENDER: Recent Tab Content
  const renderRecentTab = () => (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.recentSearchBox}>
        <Ionicons name="search" size={18} color="#94A3B8" />
        <TextInput
          style={styles.recentSearchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search recent files..."
          placeholderTextColor="#94A3B8"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={16} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <View style={styles.filterChipsRow}>
        {(['all', 'pdf', 'docx', 'image'] as const).map((ft) => (
          <TouchableOpacity
            key={ft}
            style={[styles.filterChip, filterType === ft && styles.filterChipActive]}
            onPress={() => setFilterType(ft)}
          >
            <Text
              style={[
                styles.filterChipText,
                filterType === ft && styles.filterChipTextActive,
              ]}
            >
              {ft === 'all' ? 'All Files' : ft.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Full Files List */}
      {filteredRecentFiles.map((file) => (
        <View key={file.id} style={styles.fileCard}>
          <View style={styles.fileIconBox}>
            <Ionicons
              name={
                ['jpg', 'jpeg', 'png'].includes(file.format.toLowerCase())
                  ? 'image'
                  : 'document-text'
              }
              size={22}
              color={COLORS.primary}
            />
          </View>

          <View style={styles.fileDetails}>
            <Text style={styles.fileName} numberOfLines={1}>
              {file.title}
            </Text>
            <View style={styles.fileMetaRow}>
              <View style={styles.formatBadge}>
                <Text style={styles.formatBadgeText}>{file.format.toUpperCase()}</Text>
              </View>
              <Text style={styles.fileMetaText}>
                {file.size} • {file.updatedAt}
              </Text>
            </View>
          </View>

          <View style={styles.fileActionsRow}>
            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={() => handleOpenDoc(file)}
            >
              <Ionicons name="eye-outline" size={18} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={() => handleShareDoc(file)}
            >
              <Ionicons name="share-social-outline" size={18} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {filteredRecentFiles.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={40} color="#CBD5E1" />
          <Text style={styles.emptyStateTitle}>No matching documents</Text>
          <Text style={styles.emptyStateSub}>Try adjusting your search query or filter.</Text>
        </View>
      )}
    </ScrollView>
  );

  // RENDER: Settings Tab Content
  const renderSettingsTab = () => (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{derivedName.slice(0, 2).toUpperCase()}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{derivedName}</Text>
          <Text style={styles.profileEmail}>{userEmail || MOCK_USER.email}</Text>
          <Text style={styles.profileRole}>{MOCK_USER.company}</Text>
        </View>
      </View>

      {/* Application Settings Section */}
      <View style={styles.settingsSection}>
        <Text style={styles.settingsSectionHeading}>APPLICATION PREFERENCES</Text>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => onNavigateScreen && onNavigateScreen('translator')}
          activeOpacity={0.7}
        >
          <View style={[styles.settingIconBox, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="language" size={20} color="#059669" />
          </View>
          <View style={styles.settingTextBox}>
            <Text style={styles.settingTitle}>Translation Engine</Text>
            <Text style={styles.settingSub}>Tamil • English • Multilingual</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => onNavigateScreen && onNavigateScreen('ai')}
          activeOpacity={0.7}
        >
          <View style={[styles.settingIconBox, { backgroundColor: '#EEF2FF' }]}>
            <Ionicons name="sparkles" size={20} color="#4F46E5" />
          </View>
          <View style={styles.settingTextBox}>
            <Text style={styles.settingTitle}>AI Document Tools</Text>
            <Text style={styles.settingSub}>Summarizer, Q&A, and Extractor</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => {
            Alert.alert(
              'Clear History',
              'Are you sure you want to clear your local processing history?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Clear',
                  style: 'destructive',
                  onPress: () => {
                    historyService.clear();
                    Alert.alert('History Cleared', 'Your history has been cleared.');
                  },
                },
              ]
            );
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.settingIconBox, { backgroundColor: '#FEF2F2' }]}>
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </View>
          <View style={styles.settingTextBox}>
            <Text style={styles.settingTitle}>Clear Processing History</Text>
            <Text style={styles.settingSub}>Free up temporary storage</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* About Section */}
      <View style={styles.settingsSection}>
        <Text style={styles.settingsSectionHeading}>ABOUT VERTEX DOCS</Text>
        <View style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>Vertex Docs Mobile v2.0</Text>
          <Text style={styles.aboutSub}>
            Crafted with precision by JM Vertex Technologies. Complete on-device document utilities, conversion, compression, and multilingual intelligence.
          </Text>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        <Text style={styles.logoutBtnText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 1. Header */}
      <AppHeader
        title="Vertex Docs"
        subtitle="JM Vertex Technologies"
        showBack={false}
        showSettings={true}
        onSettingsPress={() => setActiveTab('settings')}
      />

      {/* Tab Content */}
      <View style={styles.mainContent}>
        {activeTab === 'home' && renderHomeTab()}
        {activeTab === 'recent' && renderRecentTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </View>

      {/* 5. Bottom Navigation */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => setActiveTab('home')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'home' ? 'home' : 'home-outline'}
            size={22}
            color={activeTab === 'home' ? COLORS.primary : '#94A3B8'}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'home' && styles.tabLabelActive,
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => setActiveTab('recent')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'recent' ? 'time' : 'time-outline'}
            size={22}
            color={activeTab === 'recent' ? COLORS.primary : '#94A3B8'}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'recent' && styles.tabLabelActive,
            ]}
          >
            Recent
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => setActiveTab('settings')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'settings' ? 'settings' : 'settings-outline'}
            size={22}
            color={activeTab === 'settings' ? COLORS.primary : '#94A3B8'}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'settings' && styles.tabLabelActive,
            ]}
          >
            Settings
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mainContent: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl * 2,
  },
  welcomeSection: {
    marginVertical: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  welcomeGreeting: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  featuresSection: {
    marginBottom: SPACING.lg,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  featureGridRow: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
  },
  quickUtilitySection: {
    marginBottom: SPACING.lg,
  },
  quickUtilityRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  quickUtilityChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: SPACING.sm + 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
  },
  quickUtilityIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  quickUtilityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  quickUtilitySub: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  recentSection: {
    marginBottom: SPACING.xl,
  },
  recentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.xs + 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
  },
  fileIconBox: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  fileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  formatBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  formatBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  fileMetaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  fileActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionIconBtn: {
    padding: 8,
    borderRadius: RADIUS.sm,
    backgroundColor: '#F8FAFC',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
  },
  emptyStateSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: SPACING.lg,
  },
  recentSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: SPACING.sm,
    gap: 8,
  },
  recentSearchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: SPACING.xs + 2,
    marginBottom: SPACING.md,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  profileRole: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  settingsSection: {
    marginBottom: SPACING.lg,
  },
  settingsSectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.xs + 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
  },
  settingIconBox: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  settingTextBox: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  settingSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  aboutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  aboutTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  aboutSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    gap: 8,
    marginTop: SPACING.md,
    marginBottom: SPACING.xxl,
  },
  logoutBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EF4444',
  },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});
