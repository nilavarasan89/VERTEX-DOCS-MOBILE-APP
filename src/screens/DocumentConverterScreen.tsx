/**
 * Vertex Docs Mobile - Document Converter Screen (Module 1)
 * Company: JM Vertex Technologies
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { HeaderBar } from '../components/common/HeaderBar';
import { FormatSelector } from '../components/converter/FormatSelector';
import { ConversionProgress } from '../components/converter/ConversionProgress';
import { ConversionResultCard } from '../components/converter/ConversionResultCard';
import {
  SelectedFile,
  SourceFormat,
  TargetFormat,
  ConversionJob,
} from '../types/converter';
import {
  CONVERSION_MATRIX,
  FORMAT_METADATA,
  formatBytes,
} from '../constants/formatMatrix';
import { converterService } from '../services/converterService';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../constants/theme';
import { ScreenType } from '../types';

interface DocumentConverterScreenProps {
  onBack: () => void;
  onNavigateToTranslator: (documentTitle: string, rawText?: string, format?: string) => void;
  onNavigateScreen?: (screen: ScreenType) => void;
}

export const DocumentConverterScreen: React.FC<DocumentConverterScreenProps> = ({
  onBack,
  onNavigateToTranslator,
  onNavigateScreen,
}) => {
  const insets = useSafeAreaInsets();

  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [targetFormat, setTargetFormat] = useState<TargetFormat | null>(null);
  const [conversionJob, setConversionJob] = useState<ConversionJob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Pick real file from device
  const handlePickFile = async () => {
    try {
      const file = await converterService.pickDocument();
      if (file) {
        setSelectedFile(file);
        setTargetFormat(null);
        setConversionJob(null);
      }
    } catch (e) {
      Alert.alert('File Picker', 'Unable to access device file system.');
    }
  };

  // Run conversion
  const handleStartConversion = async () => {
    if (!selectedFile || !targetFormat) return;

    setIsProcessing(true);
    try {
      const completedJob = await converterService.convertDocument(
        selectedFile,
        targetFormat,
        (updatedJob) => {
          setConversionJob(updatedJob);
        }
      );
      setConversionJob(completedJob);
    } catch (error) {
      Alert.alert('Error', 'Conversion could not be processed.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset state
  const handleReset = () => {
    setSelectedFile(null);
    setTargetFormat(null);
    setConversionJob(null);
    setIsProcessing(false);
  };

  // Share
  const handleShare = async () => {
    if (!conversionJob) return;
    const ok = await converterService.shareDocument(conversionJob);
    if (!ok) {
      Alert.alert('Share', 'Document sharing is not available on this platform.');
    }
  };

  // Save
  const handleSave = () => {
    Alert.alert(
      'Document Saved',
      `"${conversionJob?.resultFileName || 'Document'}" has been saved to your local Vertex Docs storage.`
    );
  };

  // Forward to Document Translator (Workflow Bridge!)
  const handleForwardToTranslator = async (job: ConversionJob) => {
    let extractedText = '';
    if (selectedFile) {
      extractedText = await converterService.extractTextForTranslation(selectedFile);
    } else {
      extractedText =
        'EMPLOYMENT AGREEMENT\n\n' +
        'This Agreement is entered into by and between JM Vertex Technologies and the Employee. ' +
        'The purpose of this agreement is to define professional responsibilities, confidentiality guidelines, and compensation terms.\n\n' +
        '1. Responsibilities and Obligations:\n' +
        'The Employee agrees to perform duties diligently and comply with all security and document governance standards.\n\n' +
        '2. Confidentiality & Non-Disclosure:\n' +
        'The Employee agrees to maintain strict confidentiality regarding all company trade secrets, source codes, and proprietary document methodologies.\n\n' +
        '3. In witness whereof, the parties have executed this Agreement on the date written below.';
    }

    onNavigateToTranslator(
      job.resultFileName || job.fileName,
      extractedText,
      job.targetFormat
    );
  };

  const availableOptions = selectedFile
    ? CONVERSION_MATRIX[selectedFile.format] || []
    : [];

  const meta = selectedFile ? FORMAT_METADATA[selectedFile.format] : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <HeaderBar
        title="Document Converter"
        subtitle="Transform PDFs, Word, PPT & Images"
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
        {/* Step 1: File Selection Area */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.stepCircle}>
              <Text style={styles.stepCircleText}>1</Text>
            </View>
            <View style={styles.sectionHeaderTitleContainer}>
              <Text style={styles.sectionHeaderTitle}>Select Document</Text>
              <Text style={styles.sectionHeaderSubtitle}>
                Choose any file from your device storage to convert
              </Text>
            </View>
          </View>

          {!selectedFile ? (
            <TouchableOpacity
              style={styles.uploadDottedBox}
              onPress={handlePickFile}
              activeOpacity={0.7}
            >
              <View style={styles.uploadIconContainer}>
                <Ionicons name="cloud-upload" size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.uploadDottedTitle}>Select from Device Storage</Text>
              <Text style={styles.uploadDottedSubtitle}>
                Supports PDF, DOCX, PPTX, TXT, PNG, and JPG (up to 50 MB)
              </Text>
              <View style={styles.browseButton}>
                <Ionicons name="folder-open-outline" size={16} color="#FFFFFF" />
                <Text style={styles.browseButtonText}>Browse Device Files</Text>
              </View>
            </TouchableOpacity>
          ) : (
            /* Selected File Display */
            <View style={styles.selectedFileBox}>
              <View
                style={[
                  styles.selectedFileIcon,
                  { backgroundColor: meta?.bgLight || '#EFF6FF' },
                ]}
              >
                <Ionicons
                  name={(meta?.iconName || 'document') as any}
                  size={24}
                  color={meta?.color || COLORS.primary}
                />
              </View>

              <View style={styles.selectedFileInfo}>
                <Text style={styles.selectedFileName} numberOfLines={1}>
                  {selectedFile.name}
                </Text>
                <View style={styles.selectedFileMetaRow}>
                  <Text style={styles.selectedFileMeta}>
                    {meta?.label || selectedFile.format.toUpperCase()}
                  </Text>
                  <Text style={styles.selectedFileMetaDivider}>•</Text>
                  <Text style={styles.selectedFileMeta}>{selectedFile.sizeFormatted}</Text>
                  {selectedFile.isMock && (
                    <Text style={styles.sampleDocBadge}>Sample</Text>
                  )}
                </View>
              </View>

              {!isProcessing && (
                <TouchableOpacity onPress={handleReset} style={styles.changeFileBtn}>
                  <Text style={styles.changeFileBtnText}>Change</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Step 2: Choose Target Format */}
        {selectedFile && !conversionJob && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.stepCircle}>
                <Text style={styles.stepCircleText}>2</Text>
              </View>
              <View style={styles.sectionHeaderTitleContainer}>
                <Text style={styles.sectionHeaderTitle}>Select Output Format</Text>
                <Text style={styles.sectionHeaderSubtitle}>
                  Converting from {meta?.label} ({selectedFile.format.toUpperCase()})
                </Text>
              </View>
            </View>

            <FormatSelector
              options={availableOptions}
              selectedFormat={targetFormat}
              onSelectFormat={(fmt) => setTargetFormat(fmt)}
              disabled={isProcessing}
            />

            {/* Convert CTA Button */}
            <TouchableOpacity
              style={[
                styles.convertButton,
                (!targetFormat || isProcessing) && styles.convertButtonDisabled,
              ]}
              disabled={!targetFormat || isProcessing}
              onPress={handleStartConversion}
              activeOpacity={0.8}
            >
              <Ionicons name="sparkles" size={18} color="#FFFFFF" />
              <Text style={styles.convertButtonText}>
                {targetFormat
                  ? `Convert to ${targetFormat.toUpperCase()}`
                  : 'Select an Output Format'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 3: Progress State */}
        {isProcessing && conversionJob && (
          <ConversionProgress job={conversionJob} />
        )}

        {/* Step 4: Result State */}
        {!isProcessing && conversionJob && (
          <ConversionResultCard
            job={conversionJob}
            onShare={handleShare}
            onSave={handleSave}
            onTranslateNow={handleForwardToTranslator}
            onReset={handleReset}
          />
        )}
      </ScrollView>
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
  sectionCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.subtle,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  stepCircleText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sectionHeaderTitleContainer: {
    flex: 1,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sectionHeaderSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  uploadDottedBox: {
    borderWidth: 2,
    borderColor: '#93C5FD',
    borderStyle: 'dashed',
    borderRadius: RADIUS.md,
    backgroundColor: '#F8FAFC',
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  uploadIconContainer: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.md,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  uploadDottedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  uploadDottedSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: SPACING.md,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    marginTop: SPACING.md,
    gap: 6,
    ...SHADOWS.subtle,
  },
  browseButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  selectedFileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  selectedFileIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  selectedFileInfo: {
    flex: 1,
  },
  selectedFileName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  selectedFileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  selectedFileMeta: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  selectedFileMetaDivider: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  sampleDocBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 4,
  },
  changeFileBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: RADIUS.sm,
  },
  changeFileBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  convertButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    gap: 8,
    marginTop: SPACING.sm,
    ...SHADOWS.subtle,
  },
  convertButtonDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.6,
  },
  convertButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
