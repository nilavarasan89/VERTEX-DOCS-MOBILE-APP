/**
 * Vertex Docs Mobile - Document Translator Screen (Module 2)
 * Company: JM Vertex Technologies
 * 
 * Features:
 * 1. Multilingual translation with high-fidelity Tamil Unicode support
 * 2. Multi-tier engine architecture (Google Neural Engine, MyMemory, Custom Enterprise API)
 * 3. In-app API configuration modal with live connection test
 * 4. Dual language comparison (bilingual, translated, original)
 * 5. Full-text editor modal and export to Word (.docx), PDF (.pdf), or Plain Text (.txt)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { HeaderBar } from '../components/common/HeaderBar';
import { LanguagePickerModal } from '../components/translator/LanguagePickerModal';
import { TextExtractionView } from '../components/translator/TextExtractionView';
import { TranslationComparisonView } from '../components/translator/TranslationComparisonView';
import { TranslationEditorModal } from '../components/translator/TranslationEditorModal';
import {
  LanguageCode,
  TranslationJob,
} from '../types/translator';
import { getLanguageByCode, detectLanguageFromText } from '../constants/languages';
import { translatorService } from '../services/translatorService';
import { converterService } from '../services/converterService';
import { formatBytes } from '../constants/formatMatrix';
import { TRANSLATION_CONFIG, TranslationProvider } from '../services/apiConfig';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../constants/theme';
import { ScreenType } from '../types';

interface DocumentTranslatorScreenProps {
  initialDocumentTitle?: string;
  initialRawText?: string;
  initialFormat?: string;
  onBack: () => void;
  onNavigateScreen?: (screen: ScreenType) => void;
}

export const DocumentTranslatorScreen: React.FC<DocumentTranslatorScreenProps> = ({
  initialDocumentTitle,
  initialRawText,
  initialFormat,
  onBack,
  onNavigateScreen,
}) => {
  const insets = useSafeAreaInsets();

  // Document Details
  const [docTitle, setDocTitle] = useState(initialDocumentTitle || '');
  const [docFormat, setDocFormat] = useState(
    initialFormat ? initialFormat.toUpperCase() : 'PDF'
  );
  const [rawText, setRawText] = useState(initialRawText || '');

  // Languages State (Default: Auto Detect -> Tamil)
  const [sourceLang, setSourceLang] = useState<LanguageCode>('auto');
  const [targetLang, setTargetLang] = useState<LanguageCode>('ta');

  // Modal States
  const [pickerMode, setPickerMode] = useState<'source' | 'target' | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);

  // API Config State
  const [selectedProvider, setSelectedProvider] = useState<TranslationProvider>(
    TRANSLATION_CONFIG.provider
  );
  const [customKey, setCustomKey] = useState(TRANSLATION_CONFIG.customApiKey);
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [apiTestResult, setApiTestResult] = useState<string | null>(null);

  // Job & Progress State
  const [translationJob, setTranslationJob] = useState<TranslationJob | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  // Sync if props update
  useEffect(() => {
    if (initialDocumentTitle) {
      setDocTitle(initialDocumentTitle);
    }
    if (initialRawText) {
      setRawText(initialRawText);
    }
    if (initialFormat) {
      setDocFormat(initialFormat.toUpperCase());
    }
  }, [initialDocumentTitle, initialRawText, initialFormat]);

  // Swap Languages
  const handleSwapLanguages = () => {
    if (sourceLang === 'auto') {
      setSourceLang(targetLang);
      setTargetLang('en');
    } else {
      const prevSource = sourceLang;
      setSourceLang(targetLang);
      setTargetLang(prevSource);
    }
    setTranslationJob(null);
  };

  // Run Translation
  const handleStartTranslation = async () => {
    if (!rawText.trim()) {
      Alert.alert('Empty Content', 'Please select a document or enter text to translate.');
      return;
    }

    setIsTranslating(true);
    setTranslationJob(null);

    try {
      const completed = await translatorService.translateDocument(
        docTitle || 'Document.txt',
        rawText,
        sourceLang,
        targetLang,
        (progressJob) => {
          setTranslationJob(progressJob);
        }
      );
      setTranslationJob(completed);

      if (completed.status === 'failed') {
        Alert.alert('Translation Error', completed.errorMessage || 'Translation failed.');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Translation engine encountered an issue.');
    } finally {
      setIsTranslating(false);
    }
  };

  // Pick document directly from device storage
  const handlePickDocument = async () => {
    try {
      const file = await converterService.pickDocument();
      if (file) {
        setDocTitle(file.name);
        setDocFormat(file.format.toUpperCase());
        const extracted = await converterService.extractTextForTranslation(file);
        setRawText(extracted);
        setTranslationJob(null);
      }
    } catch (e: any) {
      Alert.alert('File Picker', e?.message || 'Unable to access device document storage.');
    }
  };

  // Save edited translation
  const handleSaveEditedText = (newText: string) => {
    if (!docTitle) {
      setDocTitle('Document.txt');
      setDocFormat('TXT');
    }
    setRawText(newText);

    if (translationJob) {
      const updated = {
        ...translationJob,
        translatedText: newText,
        sections: [
          {
            id: 'edited_1',
            type: 'paragraph' as const,
            originalText: translationJob.originalText,
            translatedText: newText,
          },
        ],
      };
      setTranslationJob(updated);
    }
    Alert.alert('Saved', 'Document text updated successfully.');
  };

  // Share
  const handleShare = async () => {
    if (!translationJob) return;
    const ok = await translatorService.shareTranslation(translationJob);
    if (!ok) {
      Alert.alert('Share', 'Sharing dialog is not available on this platform.');
    }
  };

  // Export
  const handleExport = () => {
    if (!translationJob) return;
    Alert.alert(
      'Export Translated Document',
      'Choose the target format to generate and save on your device:',
      [
        {
          text: 'Word (.docx)',
          onPress: async () => {
            try {
              const res = await translatorService.exportTranslatedDocument(translationJob, 'docx');
              Alert.alert(
                'DOCX Generated',
                `Saved as "${res.fileName}" (${formatBytes(res.size)}).`,
                [
                  { text: 'Close', style: 'cancel' },
                  { text: 'Share File', onPress: () => translatorService.shareDocument(res.uri, res.fileName) },
                ]
              );
            } catch (err: any) {
              Alert.alert('Export Error', err?.message || 'Failed to export DOCX.');
            }
          },
        },
        {
          text: 'PDF Document',
          onPress: async () => {
            try {
              const res = await translatorService.exportTranslatedDocument(translationJob, 'pdf');
              Alert.alert(
                'PDF Generated',
                `Saved as "${res.fileName}" (${formatBytes(res.size)}).`,
                [
                  { text: 'Close', style: 'cancel' },
                  { text: 'Share File', onPress: () => translatorService.shareDocument(res.uri, res.fileName) },
                ]
              );
            } catch (err: any) {
              Alert.alert('Export Error', err?.message || 'Failed to export PDF.');
            }
          },
        },
        {
          text: 'Plain Text (.txt)',
          onPress: async () => {
            try {
              const res = await translatorService.exportTranslatedDocument(translationJob, 'txt');
              Alert.alert(
                'Text File Generated',
                `Saved as "${res.fileName}" (${formatBytes(res.size)}).`,
                [
                  { text: 'Close', style: 'cancel' },
                  { text: 'Share File', onPress: () => translatorService.shareDocument(res.uri, res.fileName) },
                ]
              );
            } catch (err: any) {
              Alert.alert('Export Error', err?.message || 'Failed to export TXT.');
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Test API in modal
  const handleTestApi = async () => {
    setIsTestingApi(true);
    setApiTestResult(null);
    try {
      // Temporarily set configuration to test
      TRANSLATION_CONFIG.provider = selectedProvider;
      TRANSLATION_CONFIG.customApiKey = customKey;

      const testInput = 'Hi I am Nilavarasan';
      const result = await translatorService.translateText(testInput, 'en', 'ta');
      setApiTestResult(`Test Success!\n"${testInput}"\n➔ "${result}"`);
    } catch (err: any) {
      setApiTestResult(`Connection Failed: ${err?.message || err}`);
    } finally {
      setIsTestingApi(false);
    }
  };

  const handleSaveApiSettings = () => {
    TRANSLATION_CONFIG.provider = selectedProvider;
    TRANSLATION_CONFIG.customApiKey = customKey;
    setShowApiModal(false);
    Alert.alert('Settings Saved', `Translation engine set to: ${selectedProvider.toUpperCase()}`);
  };

  const srcMeta = getLanguageByCode(sourceLang);
  const tgtMeta = getLanguageByCode(targetLang);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <HeaderBar
        title="Document Translator"
        subtitle="Tamil • English • Multilingual Translation"
        showBack={true}
        onBack={onBack}
        rightAction={{
          icon: 'settings-outline',
          onPress: () => setShowApiModal(true),
        }}
      />

      {/* Engine Status Banner */}
      <TouchableOpacity
        style={styles.apiBanner}
        onPress={() => setShowApiModal(true)}
        activeOpacity={0.8}
      >
        <View style={styles.apiStatusDot} />
        <Text style={styles.apiBannerText}>
          Engine: {selectedProvider === 'google' ? 'Google Neural Engine' : selectedProvider.toUpperCase()} (Online)
        </Text>
        <View style={styles.apiConfigBadge}>
          <Text style={styles.apiConfigBadgeText}>API Config</Text>
          <Ionicons name="settings-sharp" size={12} color={COLORS.primary} />
        </View>
      </TouchableOpacity>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Document Header Card or Empty File Selector */}
        <View style={styles.documentCard}>
          {docTitle || rawText.trim() ? (
            <View style={styles.documentHeaderRow}>
              <View style={styles.documentIconBox}>
                <Ionicons name="document-text" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.documentDetails}>
                <Text style={styles.documentTitle} numberOfLines={1}>
                  {docTitle || 'Custom Text Document'}
                </Text>
                <View style={styles.documentMetaRow}>
                  <View style={styles.formatBadge}>
                    <Text style={styles.formatBadgeText}>{docFormat}</Text>
                  </View>
                  <Text style={styles.documentWordsText}>
                    {rawText.trim() ? rawText.trim().split(/\s+/).length : 0} Words
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.pickFileSmallBtn}
                onPress={handlePickDocument}
                activeOpacity={0.7}
              >
                <Ionicons name="swap-vertical" size={14} color={COLORS.primary} />
                <Text style={styles.pickFileSmallBtnText}>Change</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyDocState}>
              <View style={styles.emptyDocIconBox}>
                <Ionicons name="cloud-upload-outline" size={28} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyDocTitle}>Select Document to Translate</Text>
              <Text style={styles.emptyDocSubtitle}>
                Pick a document from your device storage or type text directly
              </Text>
              <View style={styles.emptyDocActionsRow}>
                <TouchableOpacity
                  style={styles.emptyPickFileBtn}
                  onPress={handlePickDocument}
                  activeOpacity={0.8}
                >
                  <Ionicons name="folder-open" size={15} color="#FFFFFF" />
                  <Text style={styles.emptyPickFileBtnText}>Pick Document</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.emptyTextBtn}
                  onPress={() => setShowEditor(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="create-outline" size={15} color={COLORS.primary} />
                  <Text style={styles.emptyTextBtnText}>Type Text</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Language Selection Card */}
        <View style={styles.languageCard}>
          <View style={styles.cardSectionHeaderRow}>
            <Text style={styles.cardSectionLabel}>Language Pair</Text>
            {sourceLang === 'auto' && (
              <View style={styles.autoDetectedBanner}>
                <Ionicons name="sparkles" size={11} color="#059669" />
                <Text style={styles.autoDetectedText}>
                  Detected: {getLanguageByCode(detectLanguageFromText(rawText)).name}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.langSelectorRow}>
            {/* Source Language Button */}
            <TouchableOpacity
              style={styles.langButton}
              onPress={() => setPickerMode('source')}
              activeOpacity={0.7}
            >
              <Text style={styles.langButtonSmall}>From</Text>
              <View style={styles.langButtonMain}>
                <Text style={styles.langFlag}>{srcMeta.flag}</Text>
                <Text style={styles.langName} numberOfLines={1}>
                  {srcMeta.name}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Swap Button */}
            <TouchableOpacity
              style={styles.swapButton}
              onPress={handleSwapLanguages}
              activeOpacity={0.7}
            >
              <Ionicons name="swap-horizontal" size={20} color={COLORS.primary} />
            </TouchableOpacity>

            {/* Target Language Button */}
            <TouchableOpacity
              style={[styles.langButton, styles.langButtonTarget]}
              onPress={() => setPickerMode('target')}
              activeOpacity={0.7}
            >
              <Text style={styles.langButtonSmall}>To</Text>
              <View style={styles.langButtonMain}>
                <Text style={styles.langFlag}>{tgtMeta.flag}</Text>
                <Text style={[styles.langName, styles.langNameTarget]} numberOfLines={1}>
                  {tgtMeta.name}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Top Primary Translate Action Button (Right below Language Pair for Instant Visibility) */}
        {Boolean(rawText.trim()) && !translationJob && (
          <TouchableOpacity
            style={[styles.translateButton, isTranslating && styles.translateButtonDisabled]}
            disabled={isTranslating}
            onPress={handleStartTranslation}
            activeOpacity={0.8}
          >
            <Ionicons name="language" size={20} color="#FFFFFF" />
            <Text style={styles.translateButtonText}>
              {isTranslating ? 'Translating Document...' : `Translate to ${tgtMeta.name} Now`}
            </Text>
          </TouchableOpacity>
        )}

        {/* Text Extraction & OCR View */}
        <TextExtractionView
          documentTitle={docTitle}
          extractedText={rawText}
          wordCount={rawText.trim().split(/\s+/).length}
          detectedLanguageName={srcMeta.name}
          onEditText={() => setShowEditor(true)}
        />

        {/* Bottom Translate CTA Button (if user scrolled down) */}
        {Boolean(rawText.trim()) && !translationJob && (
          <TouchableOpacity
            style={[styles.translateButton, isTranslating && styles.translateButtonDisabled]}
            disabled={isTranslating}
            onPress={handleStartTranslation}
            activeOpacity={0.8}
          >
            <Ionicons name="language" size={20} color="#FFFFFF" />
            <Text style={styles.translateButtonText}>
              {isTranslating ? 'Translating Document...' : `Translate to ${tgtMeta.name}`}
            </Text>
          </TouchableOpacity>
        )}

        {/* Translation Progress Indicator */}
        {isTranslating && translationJob && (
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Ionicons name="sync" size={20} color="#0EA5A4" />
              <Text style={styles.progressTitle}>Translating Document</Text>
              <Text style={styles.progressPercent}>
                {Math.round(translationJob.progress)}%
              </Text>
            </View>

            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(100, Math.max(10, translationJob.progress))}%` },
                ]}
              />
            </View>

            <Text style={styles.progressStepText}>
              {translationJob.currentStepText}
            </Text>
          </View>
        )}

        {/* Error State Card */}
        {!isTranslating && translationJob && translationJob.status === 'failed' && (
          <View style={styles.errorCard}>
            <View style={styles.errorHeader}>
              <Ionicons name="alert-circle" size={28} color="#DC2626" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.errorTitle}>Translation Unsuccessful</Text>
                <Text style={styles.errorDesc}>
                  {translationJob.errorMessage || 'Unable to connect to the translation engine.'}
                </Text>
              </View>
            </View>

            <View style={styles.errorActionsRow}>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={handleStartTranslation}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={16} color="#FFFFFF" />
                <Text style={styles.retryBtnText}>Retry Translation</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingsBtn}
                onPress={() => setShowApiModal(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="settings-outline" size={16} color={COLORS.primary} />
                <Text style={styles.settingsBtnText}>API Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Completed Translation: Comparison & Editing View */}
        {!isTranslating && translationJob && translationJob.status === 'completed' && (
          <>
            <TranslationComparisonView
              job={translationJob}
              onEdit={() => setShowEditor(true)}
              onShare={handleShare}
              onExport={handleExport}
            />

            <TouchableOpacity
              style={styles.translateAnotherButton}
              onPress={() => setTranslationJob(null)}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={15} color={COLORS.primary} />
              <Text style={styles.translateAnotherButtonText}>
                Translate Another Document or Change Language
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Language Picker Modal */}
      {pickerMode && (
        <LanguagePickerModal
          visible={Boolean(pickerMode)}
          mode={pickerMode}
          selectedCode={pickerMode === 'source' ? sourceLang : targetLang}
          onSelect={(code) => {
            if (pickerMode === 'source') setSourceLang(code);
            else setTargetLang(code);
            setTranslationJob(null);
          }}
          onClose={() => setPickerMode(null)}
        />
      )}

      {/* Translation Editor Modal */}
      <TranslationEditorModal
        visible={showEditor}
        documentTitle={docTitle}
        initialText={translationJob?.translatedText || rawText}
        onSave={handleSaveEditedText}
        onClose={() => setShowEditor(false)}
      />

      {/* API Engine Settings Modal */}
      <Modal
        visible={showApiModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowApiModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Translation API Configuration</Text>
                <Text style={styles.modalSubtitle}>
                  Choose or configure your translation provider & credentials
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowApiModal(false)}>
                <Ionicons name="close-circle" size={26} color={COLORS.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.apiOptionGroupTitle}>Select Translation Engine:</Text>

              {/* Provider Option 1: Google Neural Engine */}
              <TouchableOpacity
                style={[
                  styles.providerCard,
                  selectedProvider === 'google' && styles.providerCardActive,
                ]}
                onPress={() => setSelectedProvider('google')}
              >
                <Ionicons
                  name={selectedProvider === 'google' ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={selectedProvider === 'google' ? COLORS.primary : COLORS.muted}
                />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.providerName}>
                    Google Neural Engine (Default)
                  </Text>
                  <Text style={styles.providerDesc}>
                    High accuracy, fluent Tamil Unicode rendering, fast response, no API key needed.
                  </Text>
                </View>
                <View style={styles.activePill}>
                  <Text style={styles.activePillText}>Active</Text>
                </View>
              </TouchableOpacity>

              {/* Provider Option 2: Custom Google Cloud Translation API */}
              <TouchableOpacity
                style={[
                  styles.providerCard,
                  selectedProvider === 'custom' && styles.providerCardActive,
                ]}
                onPress={() => setSelectedProvider('custom')}
              >
                <Ionicons
                  name={selectedProvider === 'custom' ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={selectedProvider === 'custom' ? COLORS.primary : COLORS.muted}
                />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.providerName}>
                    Custom Google Cloud Translation API
                  </Text>
                  <Text style={styles.providerDesc}>
                    Use your company's Google Cloud Translation API Key for enterprise quotas and SLAs.
                  </Text>
                </View>
              </TouchableOpacity>

              {selectedProvider === 'custom' && (
                <View style={styles.customKeyBox}>
                  <Text style={styles.customKeyLabel}>Google Cloud API Key:</Text>
                  <TextInput
                    style={styles.customKeyInput}
                    value={customKey}
                    onChangeText={setCustomKey}
                    placeholder="AIzaSy..."
                    placeholderTextColor={COLORS.muted}
                    autoCapitalize="none"
                  />
                  <Text style={styles.customKeyHelp}>
                    Your key is stored locally on this device only and is never shared.
                  </Text>
                </View>
              )}

              {/* Provider Option 3: MyMemory API */}
              <TouchableOpacity
                style={[
                  styles.providerCard,
                  selectedProvider === 'mymemory' && styles.providerCardActive,
                ]}
                onPress={() => setSelectedProvider('mymemory')}
              >
                <Ionicons
                  name={selectedProvider === 'mymemory' ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={selectedProvider === 'mymemory' ? COLORS.primary : COLORS.muted}
                />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.providerName}>MyMemory Multi-Language Service</Text>
                  <Text style={styles.providerDesc}>
                    Crowdsourced translation memory service (subject to daily free tier limits).
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Live Test Connection Button */}
              <TouchableOpacity
                style={styles.testApiBtn}
                onPress={handleTestApi}
                disabled={isTestingApi}
              >
                {isTestingApi ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <>
                    <Ionicons name="flash-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.testApiBtnText}>
                      Test API Connection (Live English ➔ Tamil)
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {apiTestResult && (
                <View
                  style={[
                    styles.apiTestResultBox,
                    apiTestResult.includes('Success')
                      ? { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }
                      : { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
                  ]}
                >
                  <Text
                    style={[
                      styles.apiTestResultText,
                      apiTestResult.includes('Success')
                        ? { color: '#065F46' }
                        : { color: '#991B1B' },
                    ]}
                  >
                    {apiTestResult}
                  </Text>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.saveSettingsBtn}
              onPress={handleSaveApiSettings}
            >
              <Text style={styles.saveSettingsBtnText}>Save & Apply Engine</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  apiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
    gap: 8,
  },
  apiStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  apiBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  apiConfigBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  apiConfigBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  documentCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.subtle,
  },
  documentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentIconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  documentDetails: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  documentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  formatBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  formatBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.primary,
  },
  documentWordsText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  emptyDocState: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  emptyDocIconBox: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  emptyDocTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  emptyDocSubtitle: {
    fontSize: 13.5,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  emptyDocActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  emptyPickFileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  emptyPickFileBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  emptyTextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 6,
  },
  emptyTextBtnText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  pickFileSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  pickFileSmallBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  languageCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.subtle,
  },
  cardSectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  cardSectionLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  autoDetectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  autoDetectedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  langSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langButton: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  langButtonTarget: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  langButtonSmall: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  langButtonMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  langFlag: {
    fontSize: 20,
  },
  langName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
  },
  langNameTarget: {
    color: '#15803D',
  },
  swapButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  translateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    marginVertical: SPACING.sm,
    gap: 8,
    ...SHADOWS.card,
  },
  translateButtonDisabled: {
    opacity: 0.6,
  },
  translateButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  progressCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
    marginLeft: 8,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0EA5A4',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0EA5A4',
    borderRadius: 4,
  },
  progressStepText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#991B1B',
  },
  errorDesc: {
    fontSize: 12,
    color: '#B91C1C',
    marginTop: 3,
    lineHeight: 18,
  },
  errorActionsRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 10,
  },
  retryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    gap: 6,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  settingsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 6,
  },
  settingsBtnText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  translateAnotherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: RADIUS.md,
    gap: 6,
    marginTop: SPACING.sm,
  },
  translateAnotherButtonText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '85%',
    padding: SPACING.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  modalScroll: {
    marginBottom: 16,
  },
  apiOptionGroupTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#F8FAFC',
    marginBottom: 8,
  },
  providerCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#EFF6FF',
  },
  providerName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  providerDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  activePill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  customKeyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.sm,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  customKeyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  customKeyInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
  },
  customKeyHelp: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  testApiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginVertical: 10,
    gap: 6,
  },
  testApiBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  apiTestResultBox: {
    borderRadius: RADIUS.sm,
    padding: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  apiTestResultText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  saveSettingsBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  saveSettingsBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
