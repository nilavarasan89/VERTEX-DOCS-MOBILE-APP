/**
 * Vertex Docs Mobile - Document Translator Screen (Module 2)
 * Company: JM Vertex Technologies
 */

import React, { useState, useEffect } from 'react';
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

  // Modal State
  const [pickerMode, setPickerMode] = useState<'source' | 'target' | null>(null);
  const [showEditor, setShowEditor] = useState(false);

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
    } catch (e) {
      Alert.alert('Error', 'Translation engine encountered an issue.');
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
    } catch (e) {
      Alert.alert('File Picker', 'Unable to access device document storage.');
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
    Alert.alert(
      'Document Exported',
      `"${translationJob?.resultFileName || 'Document'}" has been generated in ${getLanguageByCode(targetLang).name} and saved to your device.`
    );
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
          icon: 'time-outline',
          onPress: () => onNavigateScreen && onNavigateScreen('history'),
        }}
      />

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

        {/* Text Extraction & OCR View */}
        <TextExtractionView
          documentTitle={docTitle}
          extractedText={rawText}
          wordCount={rawText.trim().split(/\s+/).length}
          detectedLanguageName={srcMeta.name}
          onEditText={() => setShowEditor(true)}
        />

        {/* Translate CTA Button */}
        {!translationJob && (
          <TouchableOpacity
            style={[styles.translateButton, isTranslating && styles.translateButtonDisabled]}
            disabled={isTranslating}
            onPress={handleStartTranslation}
            activeOpacity={0.8}
          >
            <Ionicons name="language" size={20} color="#FFFFFF" />
            <Text style={styles.translateButtonText}>
              {isTranslating
                ? 'Translating Document...'
                : `Translate to ${tgtMeta.name}`}
            </Text>
          </TouchableOpacity>
        )}

        {/* Translation Progress */}
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
                Translate Another File or Adjust Languages
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
        initialText={
          translationJob?.translatedText || rawText
        }
        onSave={handleSaveEditedText}
        onClose={() => setShowEditor(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    marginBottom: SPACING.sm,
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
    fontSize: 14,
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
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  formatBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  documentWordsText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  emptyDocState: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  emptyDocIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  emptyDocTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  emptyDocSubtitle: {
    fontSize: 12,
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
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  emptyPickFileBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyTextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 6,
  },
  emptyTextBtnText: {
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
  cardSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 8,
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
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
  },
  langButtonTarget: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  langButtonSmall: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  langButtonMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  langFlag: {
    fontSize: 16,
  },
  langName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
  },
  langNameTarget: {
    color: '#065F46',
  },
  swapButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  translateButton: {
    backgroundColor: '#0EA5A4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    gap: 8,
    marginVertical: SPACING.md,
    ...SHADOWS.subtle,
  },
  translateButtonDisabled: {
    opacity: 0.6,
  },
  translateButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: '#99F6E4',
    marginVertical: SPACING.sm,
    ...SHADOWS.subtle,
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
    fontWeight: '800',
    color: '#0EA5A4',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
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
    fontWeight: '500',
  },
  pickFileSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 4,
  },
  pickFileSmallBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  cardSectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
    fontSize: 10,
    color: '#065F46',
    fontWeight: '500',
  },
  translateAnotherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 6,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  translateAnotherButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
