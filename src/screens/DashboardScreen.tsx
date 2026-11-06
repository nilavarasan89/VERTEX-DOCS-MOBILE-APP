/**
 * Vertex Docs Mobile - Premium SaaS Dashboard
 * Company: JM Vertex Technologies
 * Platform: Android First (Compatible with iOS & Web)
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../constants/theme';
import {
  MOCK_DOCUMENTS,
  MOCK_QUICK_ACTIONS,
  MOCK_DASHBOARD_STATS,
  MOCK_USER,
  MOCK_NOTIFICATIONS,
} from '../constants/mockData';
import { DashboardTab, DocumentItem, ScreenType } from '../types';
import { converterService } from '../services/converterService';

interface DashboardScreenProps {
  userEmail?: string;
  onLogout: () => void;
  onNavigateScreen?: (screen: ScreenType) => void;
  onNavigateToTranslator?: (documentTitle: string, rawText?: string, format?: string) => void;
}

type FileFilter = 'all' | 'pdf' | 'docx' | 'translated' | 'favorites';

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  userEmail,
  onLogout,
  onNavigateScreen,
  onNavigateToTranslator,
}) => {
  const insets = useSafeAreaInsets();

  // Navigation & Data State
  const [activeTab, setActiveTab] = useState<DashboardTab>('home');
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<FileFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Dynamically compute user profile details from signed-in email
  const derivedUserName = useMemo(() => {
    if (!userEmail) return 'Vertex User';
    const namePart = userEmail.split('@')[0];
    return namePart
      .split(/[._-]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, [userEmail]);

  const derivedInitials = useMemo(() => {
    if (!userEmail) return 'VU';
    const namePart = userEmail.split('@')[0];
    const parts = namePart.split(/[._-]/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return namePart.slice(0, 2).toUpperCase();
  }, [userEmail]);

  // Modals
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Toggle favorite status
  const toggleFavorite = (docId: string) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === docId ? { ...doc, isFavorite: !doc.isFavorite } : doc
      )
    );
  };

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Filter by chip
      if (activeFilter === 'pdf' && doc.format !== 'pdf') return false;
      if (activeFilter === 'docx' && doc.format !== 'docx') return false;
      if (activeFilter === 'translated' && !doc.isTranslated) return false;
      if (activeFilter === 'favorites' && !doc.isFavorite) return false;

      // Filter by search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          doc.title.toLowerCase().includes(query) ||
          (doc.sourceLanguage && doc.sourceLanguage.toLowerCase().includes(query)) ||
          (doc.targetLanguage && doc.targetLanguage.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [documents, activeFilter, searchQuery]);

  // Pick document directly from user's device storage
  const handlePickUserFile = async () => {
    try {
      const file = await converterService.pickDocument();
      if (file) {
        const newDoc: DocumentItem = {
          id: `doc-${Date.now()}`,
          title: file.name,
          format: (file.format.toLowerCase() === 'docx' ? 'docx' : 'pdf') as 'pdf' | 'docx',
          size: file.sizeFormatted,
          updatedAt: 'Just now',
          isTranslated: false,
          isFavorite: false,
        };
        setDocuments((prevDocs) => [newDoc, ...prevDocs]);
        Alert.alert(
          'Document Loaded',
          `"${file.name}" (${file.sizeFormatted}) selected from device storage.\n\nChoose an action:`,
          [
            { text: 'Keep on Dashboard', style: 'cancel' },
            {
              text: 'Convert Document',
              onPress: () => onNavigateScreen && onNavigateScreen('converter'),
            },
            {
              text: 'Translate Document',
              onPress: () => {
                if (onNavigateToTranslator) {
                  onNavigateToTranslator(file.name, undefined, file.format);
                } else if (onNavigateScreen) {
                  onNavigateScreen('translator');
                }
              },
            },
          ]
        );
      }
    } catch (e) {
      Alert.alert('File Picker', 'Unable to access device document storage.');
    }
  };

  const handleConfirmLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of Vertex Docs?',
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

  // ==========================================
  // SUB-TAB SCREENS
  // ==========================================

  // Files Tab Screen
  const renderFilesTab = () => (
    <View style={styles.subTabContainer}>
      <View style={styles.searchBarContainer}>
        <Ionicons name="search-outline" size={18} color={COLORS.iconColor} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search all files and folders..."
          placeholderTextColor={COLORS.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={16} color={COLORS.muted} />
          </TouchableOpacity>
        ) : null}
      </View>

      <Text style={styles.subSectionTitle}>Cloud Directories</Text>
      <View style={styles.folderRow}>
        <TouchableOpacity style={styles.folderCard} activeOpacity={0.7}>
          <View style={[styles.folderIconWrap, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="folder" size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.folderTitle} numberOfLines={1}>Financial Audits</Text>
          <Text style={styles.folderCount}>8 files</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.folderCard} activeOpacity={0.7}>
          <View style={[styles.folderIconWrap, { backgroundColor: '#F0FDF4' }]}>
            <Ionicons name="folder" size={20} color="#16A34A" />
          </View>
          <Text style={styles.folderTitle} numberOfLines={1}>Legal & Contracts</Text>
          <Text style={styles.folderCount}>14 files</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.folderCard} activeOpacity={0.7}>
          <View style={[styles.folderIconWrap, { backgroundColor: '#F0FDFA' }]}>
            <Ionicons name="folder" size={20} color={COLORS.teal} />
          </View>
          <Text style={styles.folderTitle} numberOfLines={1}>Tamil Vault</Text>
          <Text style={styles.folderCount}>12 files</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filesListHeader}>
        <Text style={styles.subSectionTitle}>All Documents ({filteredDocuments.length})</Text>
        <Text style={styles.filesSortText}>Sorted by Date</Text>
      </View>

      <View style={styles.documentListCard}>
        {filteredDocuments.map((doc, index) => renderDocumentRow(doc, index === filteredDocuments.length - 1))}
      </View>
    </View>
  );

  // PDF Studio Tab Screen
  const renderPdfStudioTab = () => (
    <View style={styles.subTabContainer}>
      <View style={styles.studioHeaderCard}>
        <View style={styles.studioTopBar}>
          <View style={styles.studioDocTitleRow}>
            <Ionicons name="document-text" size={18} color="#DC2626" />
            <Text style={styles.studioDocTitle} numberOfLines={1}>
              Annual_Financial_Audit_2026.pdf
            </Text>
          </View>
          <View style={styles.studioBadge}>
            <Text style={styles.studioBadgeText}>Page 3 of 18</Text>
          </View>
        </View>

        {/* Studio Tools Bar */}
        <View style={styles.studioToolbar}>
          <TouchableOpacity
            style={styles.studioToolBtn}
            onPress={() => onNavigateScreen && onNavigateScreen('converter')}
            activeOpacity={0.7}
          >
            <Ionicons name="pencil-outline" size={17} color={COLORS.navy} />
            <Text style={styles.studioToolLabel}>Edit / Pages</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.studioToolBtn}
            onPress={() => onNavigateScreen && onNavigateScreen('converter')}
            activeOpacity={0.7}
          >
            <Ionicons name="layers-outline" size={17} color={COLORS.navy} />
            <Text style={styles.studioToolLabel}>Merge</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.studioToolBtn}
            onPress={() => onNavigateScreen && onNavigateScreen('converter')}
            activeOpacity={0.7}
          >
            <Ionicons name="resize-outline" size={17} color={COLORS.navy} />
            <Text style={styles.studioToolLabel}>Compress</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.studioToolBtn} activeOpacity={0.7}>
            <Ionicons name="search-outline" size={17} color={COLORS.navy} />
            <Text style={styles.studioToolLabel}>Search</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.studioToolBtn, styles.studioTranslateToolBtn]}
            onPress={() => setActiveTab('language_bridge')}
            activeOpacity={0.7}
          >
            <Ionicons name="swap-horizontal" size={17} color={COLORS.teal} />
            <Text style={[styles.studioToolLabel, { color: COLORS.teal }]}>Translate</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* PDF Viewport Mockup */}
      <View style={styles.pdfViewportCard}>
        <View style={styles.pdfPageSheet}>
          <View style={styles.pdfSkeletonHeader} />
          <View style={styles.pdfSkeletonLineLong} />
          <View style={styles.pdfSkeletonLineMedium} />
          <View style={styles.pdfSkeletonLineShort} />
          
          <View style={styles.pdfHighlightBox}>
            <View style={styles.pdfHighlightBadge}>
              <Text style={styles.pdfHighlightBadgeText}>Tamil Translation Note</Text>
            </View>
            <Text style={styles.pdfHighlightText}>
              "நிதியாண்டு 2026-ன் தணிக்கை அறிக்கை மற்றும் நிதி அறிக்கைகள் சரிபார்க்கப்பட்டன."
            </Text>
            <Text style={styles.pdfHighlightTranslation}>
              [Verified Translation]: "Financial Year 2026 audit reports and statements have been verified."
            </Text>
          </View>

          <View style={styles.pdfSkeletonLineLong} />
          <View style={styles.pdfSkeletonLineMedium} />
        </View>

        <View style={styles.pdfFloatingControls}>
          <TouchableOpacity style={styles.pdfControlBtn}>
            <Ionicons name="remove-outline" size={18} color={COLORS.navy} />
          </TouchableOpacity>
          <Text style={styles.pdfZoomText}>100%</Text>
          <TouchableOpacity style={styles.pdfControlBtn}>
            <Ionicons name="add-outline" size={18} color={COLORS.navy} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Language Bridge Tab Screen
  const renderLanguageBridgeTab = () => (
    <View style={styles.subTabContainer}>
      <View style={styles.langBridgeCard}>
        <View style={styles.langBridgeHeader}>
          <View style={styles.langIconPill}>
            <Ionicons name="language" size={18} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.langBridgeTitle}>Vertex Neural Language Bridge</Text>
            <Text style={styles.langBridgeSub}>Tamil ⇄ English Document Translation</Text>
          </View>
          <View style={styles.aiPill}>
            <Text style={styles.aiPillText}>v2.4 AI</Text>
          </View>
        </View>

        {/* Language Selector Pair */}
        <View style={styles.langSelectorRow}>
          <View style={styles.langBox}>
            <Text style={styles.langBoxLabel}>Source</Text>
            <Text style={styles.langBoxValue}>தமிழ் (Tamil)</Text>
          </View>
          <View style={styles.langSwapCircle}>
            <Ionicons name="swap-horizontal" size={18} color={COLORS.primary} />
          </View>
          <View style={styles.langBox}>
            <Text style={styles.langBoxLabel}>Target</Text>
            <Text style={styles.langBoxValue}>English (US)</Text>
          </View>
        </View>

        {/* Selected Document for Translation */}
        <View style={styles.langDocSelectCard}>
          <Ionicons name="document-text" size={20} color="#DC2626" />
          <View style={{ flex: 1, marginHorizontal: 10 }}>
            <Text style={styles.langDocName} numberOfLines={1}>
              Tamil_Project_Report.pdf
            </Text>
            <Text style={styles.langDocMeta}>2.4 MB • 14 Pages • Preserving Tables</Text>
          </View>
          <View style={styles.langReadyBadge}>
            <Text style={styles.langReadyBadgeText}>Ready</Text>
          </View>
        </View>

        {/* Translation Preview Box */}
        <View style={styles.translationPreviewBox}>
          <Text style={styles.translationPreviewHeader}>Sample Side-by-Side Verification</Text>
          <View style={styles.translationSplitRow}>
            <View style={styles.translationColumn}>
              <Text style={styles.translationColTitle}>Source (Tamil)</Text>
              <Text style={styles.translationText}>
                இத்திட்டம் தமிழ் ஆவணங்களை துல்லியமாக மொழிபெயர்க்க உருவாக்கப்பட்டுள்ளது.
              </Text>
            </View>
            <View style={styles.translationColDivider} />
            <View style={styles.translationColumn}>
              <Text style={[styles.translationColTitle, { color: COLORS.primary }]}>Target (English)</Text>
              <Text style={styles.translationText}>
                This system has been engineered to translate Tamil documents with contextual fidelity.
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.translateActionBtn}
          onPress={() =>
            onNavigateToTranslator &&
            onNavigateToTranslator(
              'Tamil_Project_Report.pdf',
              'இத்திட்டம் தமிழ் ஆவணங்களை துல்லியமாக மொழிபெயர்க்க உருவாக்கப்பட்டுள்ளது.\n\nThis system has been engineered to translate Tamil documents with contextual fidelity.',
              'pdf'
            )
          }
          activeOpacity={0.8}
        >
          <Ionicons name="flash" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.translateActionBtnText}>Launch Document Translator</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Profile Tab Screen
  const renderProfileTab = () => (
    <View style={styles.subTabContainer}>
      <View style={styles.profileCard}>
        <View style={styles.profileHeaderRow}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>{derivedInitials}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: SPACING.md }}>
            <Text style={styles.profileName}>{derivedUserName}</Text>
            <Text style={styles.profileEmail}>{userEmail || 'user@vertexdocs.app'}</Text>
            <View style={styles.profileCompanyBadge}>
              <View style={styles.companyDot} />
              <Text style={styles.profileCompanyText}>Vertex Workspace</Text>
            </View>
          </View>
        </View>

        {/* Cloud Storage Usage */}
        <View style={styles.storageSection}>
          <View style={styles.storageHeader}>
            <Text style={styles.storageLabel}>Cloud Storage</Text>
            <Text style={styles.storageAmount}>0.2 GB of 15 GB (1%)</Text>
          </View>
          <View style={styles.storageTrack}>
            <View style={[styles.storageBar, { width: '1%' }]} />
          </View>
        </View>

        {/* Settings Menu Options */}
        <View style={styles.settingsGroup}>
          <TouchableOpacity
            style={styles.settingsRow}
            activeOpacity={0.7}
            onPress={() => onNavigateScreen && onNavigateScreen('translator')}
          >
            <View style={styles.settingsIconBox}>
              <Ionicons name="language-outline" size={18} color={COLORS.navy} />
            </View>
            <Text style={styles.settingsLabel}>Tamil & Multilingual Translation Models</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsRow}
            activeOpacity={0.7}
            onPress={() => onNavigateScreen && onNavigateScreen('converter')}
          >
            <View style={styles.settingsIconBox}>
              <Ionicons name="repeat-outline" size={18} color={COLORS.navy} />
            </View>
            <Text style={styles.settingsLabel}>Document Converter Options</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsRow}
            activeOpacity={0.7}
            onPress={() => onNavigateScreen && onNavigateScreen('history')}
          >
            <View style={styles.settingsIconBox}>
              <Ionicons name="time-outline" size={18} color={COLORS.navy} />
            </View>
            <Text style={styles.settingsLabel}>Audit & Processing History</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.profileLogoutBtn}
          onPress={handleConfirmLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
          <Text style={styles.profileLogoutText}>Sign Out of Vertex Docs</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ==========================================
  // HOME DASHBOARD RENDERER
  // ==========================================

  // Document row renderer
  const renderDocumentRow = (doc: DocumentItem, isLast: boolean) => {
    const isPdf = doc.format === 'pdf';
    return (
      <TouchableOpacity
        key={doc.id}
        style={[styles.docRow, !isLast && styles.docRowDivider]}
        onPress={() => setSelectedDoc(doc)}
        activeOpacity={0.7}
      >
        {/* Document Icon */}
        <View style={[styles.docFormatBadge, isPdf ? styles.pdfBadge : styles.docxBadge]}>
          <Ionicons
            name={isPdf ? 'document-text' : 'document'}
            size={18}
            color={isPdf ? '#DC2626' : COLORS.primary}
          />
          <Text style={[styles.docFormatTag, { color: isPdf ? '#DC2626' : COLORS.primary }]}>
            {doc.format.toUpperCase()}
          </Text>
        </View>

        {/* Document Details */}
        <View style={styles.docInfo}>
          <Text style={styles.docTitle} numberOfLines={1}>
            {doc.title}
          </Text>
          <View style={styles.docMetaRow}>
            <Text style={styles.docMetaText}>
              {doc.format.toUpperCase()} • {doc.size} • {doc.updatedAt}
            </Text>
            {doc.isTranslated && (
              <View style={styles.inlineTranslationTag}>
                <View style={styles.translationDot} />
                <Text style={styles.inlineTranslationText}>
                  {doc.sourceLanguage} ⇄ {doc.targetLanguage}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Favorite Icon */}
        <TouchableOpacity
          style={styles.docFavBtn}
          onPress={() => toggleFavorite(doc.id)}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={doc.isFavorite ? 'star' : 'star-outline'}
            size={18}
            color={doc.isFavorite ? '#F59E0B' : COLORS.muted}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderHomeContent = () => (
    <>
      {/* 5. Refined Upload Document Section (Clean White Card, Restrained Blue Accents) */}
      <View style={styles.uploadCard}>
        <View style={styles.uploadCardHeader}>
          <View style={styles.uploadIconWrap}>
            <Ionicons name="cloud-upload-outline" size={22} color={COLORS.primary} />
          </View>
          <View style={styles.uploadHeaderContent}>
            <Text style={styles.uploadHeading}>Upload a document</Text>
            <Text style={styles.uploadSubtext}>
              PDFs, Word files and Tamil documents
            </Text>
          </View>
        </View>

        <View style={styles.uploadButtonsRow}>
          <TouchableOpacity
            style={styles.primaryUploadBtn}
            onPress={handlePickUserFile}
            activeOpacity={0.8}
          >
            <Ionicons name="folder-open" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.primaryUploadBtnText}>Choose a file</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryScanBtn}
            onPress={() => onNavigateScreen && onNavigateScreen('converter')}
            activeOpacity={0.7}
          >
            <Ionicons name="repeat-outline" size={16} color={COLORS.navy} style={{ marginRight: 4 }} />
            <Text style={styles.secondaryScanBtnText}>Document Converter</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 6. Document Statistics Section */}
      <View style={styles.statsRowCard}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{documents.length}</Text>
          <Text style={styles.statLabel}>Total files</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: COLORS.teal }]}>
            {documents.filter((d) => d.isTranslated).length}
          </Text>
          <Text style={styles.statLabel}>Translated</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{documents.filter((d) => d.isFavorite).length}</Text>
          <Text style={styles.statLabel}>Favorites</Text>
        </View>
      </View>

      {/* 7. Redesigned Quick Actions (Clean 3-card Grid) */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
      </View>

      <View style={styles.quickActionsGrid}>
        {MOCK_QUICK_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.quickActionCard}
            onPress={() => {
              if (action.screenTarget && onNavigateScreen) {
                onNavigateScreen(action.screenTarget);
              } else {
                setActiveTab(action.route);
              }
            }}
            activeOpacity={0.7}
          >
            <View style={styles.quickActionHeader}>
              <View style={styles.quickActionIconBox}>
                <Ionicons
                  name={action.icon as keyof typeof Ionicons.glyphMap}
                  size={18}
                  color={COLORS.primary}
                />
              </View>
              {action.badge && (
                <View style={[styles.actionBadge, action.badge === 'AI' && styles.actionBadgeAI]}>
                  <Text style={[styles.actionBadgeText, action.badge === 'AI' && styles.actionBadgeAIText]}>
                    {action.badge}
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.quickActionLabel} numberOfLines={1}>
              {action.title}
            </Text>
            <Text style={styles.quickActionDesc} numberOfLines={2}>
              {action.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 8. Recent Files Section (Realistic File Manager List) */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Recent Files</Text>
        <TouchableOpacity onPress={() => setActiveTab('files')} activeOpacity={0.7}>
          <Text style={styles.seeAllLink}>See all</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterChipScroll}
      >
        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'all' && styles.filterChipActive]}
          onPress={() => setActiveFilter('all')}
        >
          <Text style={[styles.filterChipText, activeFilter === 'all' && styles.filterChipTextActive]}>
            All ({documents.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'pdf' && styles.filterChipActive]}
          onPress={() => setActiveFilter('pdf')}
        >
          <Text style={[styles.filterChipText, activeFilter === 'pdf' && styles.filterChipTextActive]}>
            PDFs
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'docx' && styles.filterChipActive]}
          onPress={() => setActiveFilter('docx')}
        >
          <Text style={[styles.filterChipText, activeFilter === 'docx' && styles.filterChipTextActive]}>
            Word (.docx)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'translated' && styles.filterChipActive]}
          onPress={() => setActiveFilter('translated')}
        >
          <Text style={[styles.filterChipText, activeFilter === 'translated' && styles.filterChipTextActive]}>
            Tamil ⇄ English
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'favorites' && styles.filterChipActive]}
          onPress={() => setActiveFilter('favorites')}
        >
          <Text style={[styles.filterChipText, activeFilter === 'favorites' && styles.filterChipTextActive]}>
            Favorites
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Document List Container */}
      <View style={styles.documentListCard}>
        {filteredDocuments.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={32} color={COLORS.muted} />
            <Text style={styles.emptyStateTitle}>No matching documents</Text>
            <Text style={styles.emptyStateSub}>Try clearing filters or uploading a new file.</Text>
          </View>
        ) : (
          filteredDocuments.map((doc, index) =>
            renderDocumentRow(doc, index === filteredDocuments.length - 1)
          )
        )}
      </View>
    </>
  );

  return (
    <View style={styles.screenContainer}>
      {/* 4. Refined Compact Header */}
      <View style={[styles.topHeader, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.headerLeft}>
          <View style={styles.brandTagRow}>
            <View style={styles.brandMiniDot} />
            <Text style={styles.brandCompanyText}>JM VERTEX TECHNOLOGIES</Text>
          </View>
          <Text style={styles.greetingTitle}>Hello, {derivedUserName}</Text>
          <Text style={styles.greetingSub}>Manage your documents in one place.</Text>
        </View>

        <View style={styles.headerRightActions}>
          {/* Notifications Button */}
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => setShowNotificationsModal(true)}
            activeOpacity={0.7}
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={20} color={COLORS.navy} />
            <View style={styles.notifBadgeDot} />
          </TouchableOpacity>

          {/* User Avatar */}
          <TouchableOpacity
            style={styles.headerAvatarBtn}
            onPress={() => setActiveTab('profile')}
            activeOpacity={0.7}
            accessibilityLabel="Open Profile"
          >
            <Text style={styles.headerAvatarText}>{derivedInitials}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Scrollable Content */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 70 }]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'home' && renderHomeContent()}
        {activeTab === 'files' && renderFilesTab()}
        {activeTab === 'pdf_studio' && renderPdfStudioTab()}
        {activeTab === 'language_bridge' && renderLanguageBridgeTab()}
        {activeTab === 'profile' && renderProfileTab()}
      </ScrollView>

      {/* 9. Fixed 5-Item Bottom Navigation Bar */}
      <View style={[styles.bottomNavContainer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <TouchableOpacity
          style={styles.navTab}
          onPress={() => setActiveTab('home')}
          activeOpacity={0.7}
        >
          <View style={[styles.navIconBox, activeTab === 'home' && styles.navIconBoxActive]}>
            <Ionicons
              name={activeTab === 'home' ? 'home' : 'home-outline'}
              size={20}
              color={activeTab === 'home' ? COLORS.primary : COLORS.iconColor}
            />
          </View>
          <Text
            style={[styles.navLabel, activeTab === 'home' && styles.navLabelActive]}
            numberOfLines={1}
          >
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navTab}
          onPress={() => {
            if (onNavigateScreen) {
              onNavigateScreen('converter');
            } else {
              setActiveTab('home');
            }
          }}
          activeOpacity={0.7}
        >
          <View style={styles.navIconBox}>
            <Ionicons
              name="repeat-outline"
              size={20}
              color={COLORS.iconColor}
            />
          </View>
          <Text style={styles.navLabel} numberOfLines={1}>
            Convert
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navTab}
          onPress={() => {
            if (onNavigateScreen) {
              onNavigateScreen('translator');
            } else {
              setActiveTab('language_bridge');
            }
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.navIconBox, activeTab === 'language_bridge' && styles.navIconBoxActive]}>
            <Ionicons
              name="language-outline"
              size={20}
              color={activeTab === 'language_bridge' ? COLORS.primary : COLORS.iconColor}
            />
          </View>
          <Text
            style={[styles.navLabel, activeTab === 'language_bridge' && styles.navLabelActive]}
            numberOfLines={1}
          >
            Translate
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navTab}
          onPress={() => {
            if (onNavigateScreen) {
              onNavigateScreen('history');
            } else {
              setActiveTab('home');
            }
          }}
          activeOpacity={0.7}
        >
          <View style={styles.navIconBox}>
            <Ionicons
              name="time-outline"
              size={20}
              color={COLORS.iconColor}
            />
          </View>
          <Text style={styles.navLabel} numberOfLines={1}>
            History
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navTab}
          onPress={() => setActiveTab('profile')}
          activeOpacity={0.7}
        >
          <View style={[styles.navIconBox, activeTab === 'profile' && styles.navIconBoxActive]}>
            <Ionicons
              name={activeTab === 'profile' ? 'person' : 'person-outline'}
              size={20}
              color={activeTab === 'profile' ? COLORS.primary : COLORS.iconColor}
            />
          </View>
          <Text
            style={[styles.navLabel, activeTab === 'profile' && styles.navLabelActive]}
            numberOfLines={1}
          >
            Profile
          </Text>
        </TouchableOpacity>
      </View>

      {/* ==========================================
          MODALS & SHEETS
          ========================================== */}

      {/* Document Details Modal */}
      <Modal
        visible={Boolean(selectedDoc)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedDoc(null)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setSelectedDoc(null)}
        >
          <View style={styles.sheetContainer} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />

            {selectedDoc && (
              <>
                <View style={styles.sheetHeader}>
                  <View
                    style={[
                      styles.sheetDocBadge,
                      selectedDoc.format === 'pdf' ? styles.pdfBadge : styles.docxBadge,
                    ]}
                  >
                    <Ionicons
                      name={selectedDoc.format === 'pdf' ? 'document-text' : 'document'}
                      size={24}
                      color={selectedDoc.format === 'pdf' ? '#DC2626' : COLORS.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sheetDocTitle} numberOfLines={2}>
                      {selectedDoc.title}
                    </Text>
                    <Text style={styles.sheetDocMeta}>
                      {selectedDoc.format.toUpperCase()} • {selectedDoc.size} • Modified {selectedDoc.updatedAt}
                    </Text>
                  </View>
                </View>

                {selectedDoc.isTranslated && (
                  <View style={styles.sheetTranslationRow}>
                    <Ionicons name="swap-horizontal" size={14} color={COLORS.teal} />
                    <Text style={styles.sheetTranslationText}>
                      Bi-directional Tamil ⇄ English verified by Vertex AI
                    </Text>
                  </View>
                )}

                <View style={styles.sheetActionsList}>
                  <TouchableOpacity
                    style={styles.sheetActionItem}
                    onPress={() => {
                      setSelectedDoc(null);
                      if (onNavigateScreen) {
                        onNavigateScreen('converter');
                      }
                    }}
                  >
                    <Ionicons name="repeat-outline" size={20} color={COLORS.primary} />
                    <Text style={styles.sheetActionText}>Convert Document (PDF, Word, PPTX, Images)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.sheetActionItem}
                    onPress={() => {
                      const docTitleToTranslate = selectedDoc.title;
                      const docFormatToTranslate = selectedDoc.format;
                      setSelectedDoc(null);
                      if (onNavigateToTranslator) {
                        onNavigateToTranslator(docTitleToTranslate, undefined, docFormatToTranslate);
                      } else if (onNavigateScreen) {
                        onNavigateScreen('translator');
                      } else {
                        setActiveTab('language_bridge');
                      }
                    }}
                  >
                    <Ionicons name="language-outline" size={20} color={COLORS.teal} />
                    <Text style={styles.sheetActionText}>Translate Document (Tamil ⇄ English & Multilingual)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.sheetActionItem}
                    onPress={() => {
                      setSelectedDoc(null);
                      setActiveTab('pdf_studio');
                    }}
                  >
                    <Ionicons name="eye-outline" size={20} color={COLORS.primary} />
                    <Text style={styles.sheetActionText}>Open in PDF Studio</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.sheetActionItem}
                    onPress={() => {
                      toggleFavorite(selectedDoc.id);
                      setSelectedDoc((prev) => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
                    }}
                  >
                    <Ionicons
                      name={selectedDoc.isFavorite ? 'star' : 'star-outline'}
                      size={20}
                      color={selectedDoc.isFavorite ? '#F59E0B' : COLORS.navy}
                    />
                    <Text style={styles.sheetActionText}>
                      {selectedDoc.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.sheetActionItem}
                    onPress={() => {
                      Alert.alert('Share', `Sharing link generated for ${selectedDoc.title}`);
                    }}
                  >
                    <Ionicons name="share-outline" size={20} color={COLORS.navy} />
                    <Text style={styles.sheetActionText}>Share Document</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.sheetCloseBtn}
                  onPress={() => setSelectedDoc(null)}
                >
                  <Text style={styles.sheetCloseBtnText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Upload File Modal */}
      <Modal
        visible={showUploadModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUploadModal(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => !uploadProgress && setShowUploadModal(false)}
        >
          <View style={styles.sheetContainer} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />
            <Text style={styles.uploadModalHeading}>Choose Document</Text>
            <Text style={styles.uploadModalSub}>
              Select a file from your device or open a processing workflow:
            </Text>

            <View>
              <View style={styles.uploadActionButtonsBox}>
                <TouchableOpacity
                  style={styles.workflowUploadBtn}
                  onPress={() => {
                    setShowUploadModal(false);
                    handlePickUserFile();
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="folder-open" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.workflowUploadBtnText}>Browse Device Storage</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.workflowUploadBtnSec}
                  onPress={() => {
                    setShowUploadModal(false);
                    if (onNavigateScreen) {
                      onNavigateScreen('converter');
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="repeat-outline" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.workflowUploadBtnSecText}>Open Document Converter</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.workflowUploadBtnSec}
                  onPress={() => {
                    setShowUploadModal(false);
                    if (onNavigateScreen) {
                      onNavigateScreen('translator');
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="language-outline" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.workflowUploadBtnSecText}>Open Document Translator</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.sheetCloseBtn}
              onPress={() => setShowUploadModal(false)}
              disabled={uploadProgress !== null}
            >
              <Text style={styles.sheetCloseBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Notifications Modal */}
      <Modal
        visible={showNotificationsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNotificationsModal(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowNotificationsModal(false)}
        >
          <View style={styles.sheetContainer} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />
            <Text style={styles.uploadModalHeading}>Notifications</Text>
            <View style={styles.notifList}>
              {MOCK_NOTIFICATIONS.map((notif) => (
                <View key={notif.id} style={styles.notifItem}>
                  <View style={styles.notifIconCircle}>
                    <Ionicons name="document-text-outline" size={16} color={COLORS.primary} />
                  </View>
                  <View style={{ flex: 1, marginHorizontal: 10 }}>
                    <Text style={styles.notifTitle}>{notif.title}</Text>
                    <Text style={styles.notifDesc}>{notif.description}</Text>
                  </View>
                  <Text style={styles.notifTime}>{notif.time}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={styles.sheetCloseBtn}
              onPress={() => setShowNotificationsModal(false)}
            >
              <Text style={styles.sheetCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // 4. Refined Header Styles
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flex: 1,
  },
  brandTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  brandMiniDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.teal,
    marginRight: 5,
  },
  brandCompanyText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.teal,
    letterSpacing: 0.6,
  },
  greetingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.navy,
    letterSpacing: -0.3,
  },
  greetingSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBadgeDot: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  headerAvatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  scrollContent: {
    padding: SPACING.lg,
  },

  // 5. Refined Upload Document Card (White card, subtle border, restrained blue)
  uploadCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: SPACING.md,
    ...SHADOWS.subtle,
  },
  uploadCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  uploadIconWrap: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  uploadHeaderContent: {
    flex: 1,
  },
  uploadHeading: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.navy,
    marginBottom: 2,
  },
  uploadSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  uploadButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryUploadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    height: 38,
    borderRadius: RADIUS.md,
  },
  primaryUploadBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  secondaryScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#D9E2EF',
    height: 38,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
  },
  secondaryScanBtnText: {
    color: COLORS.navy,
    fontSize: 13,
    fontWeight: '600',
  },

  // 6. Statistics Section (Compact, Elegant Row)
  statsRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: SPACING.lg,
    ...SHADOWS.subtle,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#E2E8F0',
  },

  // 7. Quick Actions (Clean 3-Card Grid)
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
    letterSpacing: -0.2,
  },
  seeAllLink: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginBottom: SPACING.lg,
  },
  quickActionCard: {
    width: '48.5%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.subtle,
  },
  quickActionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  quickActionIconBox: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  actionBadgeAI: {
    backgroundColor: '#E6FFFA',
  },
  actionBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.navy,
  },
  actionBadgeAIText: {
    color: COLORS.teal,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 2,
  },
  quickActionDesc: {
    fontSize: 10,
    color: COLORS.textSecondary,
    lineHeight: 13,
  },

  // 8. Recent Files List Styles
  filterChipScroll: {
    gap: 6,
    paddingBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  documentListCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...SHADOWS.subtle,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
  },
  docRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  docFormatBadge: {
    width: 38,
    height: 40,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  pdfBadge: {
    backgroundColor: '#FEF2F2',
  },
  docxBadge: {
    backgroundColor: '#EFF6FF',
  },
  docFormatTag: {
    fontSize: 8,
    fontWeight: '800',
    marginTop: 1,
  },
  docInfo: {
    flex: 1,
  },
  docTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  docMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  docMetaText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  inlineTranslationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6FFFA',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  translationDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.teal,
    marginRight: 4,
  },
  inlineTranslationText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.teal,
  },
  docFavBtn: {
    padding: 6,
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyStateTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.navy,
    marginTop: 8,
  },
  emptyStateSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // 9. Fixed Bottom Navigation Bar Styles
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 6,
    paddingHorizontal: 2,
    ...SHADOWS.subtle,
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 2,
  },
  navIconBox: {
    width: 32,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.full,
  },
  navIconBoxActive: {
    backgroundColor: '#EFF6FF',
  },
  navLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '500',
    textAlign: 'center',
  },
  navLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },

  // SubTab Shared Styles
  subTabContainer: {
    paddingTop: 4,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: RADIUS.md,
    height: 42,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
    marginLeft: 8,
    paddingVertical: 0,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 8,
  },
  folderRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.lg,
  },
  folderCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: RADIUS.md,
    padding: 10,
    alignItems: 'center',
  },
  folderIconWrap: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  folderTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.navy,
    textAlign: 'center',
  },
  folderCount: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  filesListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  filesSortText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },

  // PDF Studio Tab Styles
  studioHeaderCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  studioTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  studioDocTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  studioDocTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.navy,
    marginLeft: 6,
    flex: 1,
  },
  studioBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  studioBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.navy,
  },
  studioToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: SPACING.sm,
  },
  studioToolBtn: {
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  studioToolLabel: {
    fontSize: 10,
    color: COLORS.navy,
    marginTop: 3,
    fontWeight: '500',
  },
  studioTranslateToolBtn: {
    backgroundColor: '#E6FFFA',
    borderRadius: RADIUS.sm,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  pdfViewportCard: {
    backgroundColor: '#64748B',
    borderRadius: RADIUS.lg,
    padding: 12,
    position: 'relative',
  },
  pdfPageSheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.sm,
    padding: SPACING.lg,
    minHeight: 280,
  },
  pdfSkeletonHeader: {
    height: 14,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    width: '60%',
    marginBottom: 12,
  },
  pdfSkeletonLineLong: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    width: '100%',
    marginBottom: 6,
  },
  pdfSkeletonLineMedium: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    width: '80%',
    marginBottom: 6,
  },
  pdfSkeletonLineShort: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    width: '45%',
    marginBottom: 14,
  },
  pdfHighlightBox: {
    backgroundColor: '#FEF9C3',
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
    padding: 10,
    borderRadius: 4,
    marginVertical: 10,
  },
  pdfHighlightBadge: {
    backgroundColor: '#FEF08A',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  pdfHighlightBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#854D0E',
  },
  pdfHighlightText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 16,
  },
  pdfHighlightTranslation: {
    fontSize: 10,
    color: '#475569',
    marginTop: 4,
    fontStyle: 'italic',
  },
  pdfFloatingControls: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.subtle,
  },
  pdfControlBtn: {
    padding: 4,
  },
  pdfZoomText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.navy,
    marginHorizontal: 8,
  },

  // Language Bridge Tab Styles
  langBridgeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: SPACING.md,
  },
  langBridgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  langIconPill: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  langBridgeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
  },
  langBridgeSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  aiPill: {
    backgroundColor: '#E6FFFA',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  aiPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.teal,
  },
  langSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: SPACING.md,
  },
  langBox: {
    flex: 1,
    alignItems: 'center',
  },
  langBoxLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  langBoxValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.navy,
  },
  langSwapCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langDocSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: SPACING.md,
  },
  langDocName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.navy,
  },
  langDocMeta: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  langReadyBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  langReadyBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A',
  },
  translationPreviewBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: SPACING.md,
  },
  translationPreviewHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 6,
  },
  translationSplitRow: {
    flexDirection: 'row',
    gap: 8,
  },
  translationColumn: {
    flex: 1,
  },
  translationColTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  translationColDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
  },
  translationText: {
    fontSize: 11,
    color: COLORS.textPrimary,
    lineHeight: 16,
  },
  translateActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    height: 42,
    borderRadius: RADIUS.md,
  },
  translateActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  // Profile Tab Styles
  profileCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: SPACING.lg,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
  },
  profileEmail: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  profileCompanyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  companyDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.teal,
    marginRight: 4,
  },
  profileCompanyText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.teal,
  },
  storageSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: SPACING.lg,
  },
  storageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  storageLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.navy,
  },
  storageAmount: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  storageTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  storageBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  settingsGroup: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginBottom: SPACING.lg,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  settingsIconBox: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  settingsLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.navy,
  },
  profileLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    height: 42,
    borderRadius: RADIUS.md,
  },
  profileLogoutText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.error,
    marginLeft: 6,
  },

  // Modals Shared Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(11, 21, 51, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: Platform.OS === 'ios' ? 36 : SPACING.xl,
    maxHeight: '80%',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sheetDocBadge: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sheetDocTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
  },
  sheetDocMeta: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sheetTranslationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6FFFA',
    padding: 8,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.md,
    gap: 6,
  },
  sheetTranslationText: {
    fontSize: 11,
    color: COLORS.teal,
    fontWeight: '600',
  },
  sheetActionsList: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginBottom: SPACING.md,
  },
  sheetActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  sheetActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.navy,
  },
  sheetCloseBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    height: 40,
    borderRadius: RADIUS.md,
    marginTop: 4,
  },
  sheetCloseBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  uploadModalHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 4,
  },
  uploadModalSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  uploadActionButtonsBox: {
    gap: 8,
    marginBottom: SPACING.md,
  },
  workflowUploadBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    ...SHADOWS.subtle,
  },
  workflowUploadBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  workflowUploadBtnSec: {
    backgroundColor: '#EFF6FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  workflowUploadBtnSecText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  sampleUploadSectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  sampleUploadList: {
    gap: 8,
    marginBottom: SPACING.md,
  },
  sampleUploadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  sampleIconBox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sampleDocTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.navy,
  },
  sampleDocSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  uploadProgressBox: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  uploadProgressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.navy,
    marginBottom: 10,
  },
  progressBarTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  uploadProgressPct: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  notifList: {
    gap: 8,
    marginBottom: SPACING.md,
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: RADIUS.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notifIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.navy,
  },
  notifDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  notifTime: {
    fontSize: 10,
    color: COLORS.muted,
  },
});
