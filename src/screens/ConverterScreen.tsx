/**
 * Vertex Docs Mobile - Document & Image Converter Screen (Phase 2)
 * Company: JM Vertex Technologies
 * 
 * Requirements:
 * 1. Automatic file type detection (name, extension, MIME, size).
 * 2. Displays selected file card with detected badge.
 * 3. Shows ONLY supported target formats dynamically for selected file type.
 * 4. Genuine on-device conversion with progress tracking.
 * 5. Result view with stats, Open, Share, Save, and Convert Another.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { AppHeader } from '../components/common/AppHeader';
import { SelectedFileCard } from '../components/common/SelectedFileCard';
import { ProcessingResultCard } from '../components/common/ProcessingResultCard';
import { converterService } from '../services/converterService';
import { fileViewerService } from '../services/fileViewerService';
import {
  SelectedFile,
  SourceFormat,
  TargetFormat,
  ConversionJob,
} from '../types/converter';
import {
  CONVERSION_MATRIX,
  getFormatFromFileName,
  formatBytes,
} from '../constants/formatMatrix';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../constants/theme';
import { ScreenType } from '../types';

interface ConverterScreenProps {
  onBack: () => void;
  onNavigateScreen?: (screen: ScreenType) => void;
  onNavigateToTranslator?: (title: string, text?: string, format?: string) => void;
}

export const ConverterScreen: React.FC<ConverterScreenProps> = ({
  onBack,
  onNavigateScreen,
  onNavigateToTranslator,
}) => {
  const insets = useSafeAreaInsets();

  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [targetFormat, setTargetFormat] = useState<TargetFormat | null>(null);
  const [conversionJob, setConversionJob] = useState<ConversionJob | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [completedJob, setCompletedJob] = useState<ConversionJob | null>(null);

  // Pick file and automatically detect format
  const handlePickFile = async () => {
    try {
      const file = await converterService.pickDocument();
      if (file) {
        setSelectedFile(file);
        setCompletedJob(null);
        setConversionJob(null);

        // Auto-select first supported target format
        const supported = getSupportedTargets(file.format);
        if (supported.length > 0) {
          setTargetFormat(supported[0].format);
        } else {
          setTargetFormat(null);
        }
      }
    } catch (err: any) {
      Alert.alert('File Picker', err?.message || 'Unable to open file picker.');
    }
  };

  // Get only supported target formats from CONVERSION_MATRIX
  const getSupportedTargets = (sourceFmt: SourceFormat) => {
    return CONVERSION_MATRIX[sourceFmt] || [];
  };

  // Execute genuine conversion
  const handleStartConversion = async () => {
    if (!selectedFile || !targetFormat) {
      Alert.alert('Incomplete Selection', 'Please select a file and a target format.');
      return;
    }

    setIsConverting(true);
    setCompletedJob(null);

    try {
      const job = await converterService.convertDocument(
        selectedFile,
        targetFormat,
        (progressJob) => {
          setConversionJob({ ...progressJob });
        }
      );

      setIsConverting(false);
      setConversionJob(job);
      setCompletedJob(job);

      if (job.status === 'failed') {
        Alert.alert('Conversion Failed', job.errorMessage || 'Unknown error occurred.');
      }
    } catch (error: any) {
      setIsConverting(false);
      Alert.alert('Conversion Error', error?.message || 'Failed to convert file.');
    }
  };

  // Open output file with native viewer (Microsoft Word, Google Docs, etc.)
  const handleOpenFile = async () => {
    if (!completedJob?.resultUri) return;
    await fileViewerService.openFile(
      completedJob.resultUri,
      completedJob.resultFileName || 'Document',
      completedJob.targetFormat
    );
  };

  // Share output file
  const handleShareFile = async () => {
    if (!completedJob?.resultUri) return;
    await fileViewerService.shareFile(
      completedJob.resultUri,
      completedJob.resultFileName || 'Document',
      completedJob.targetFormat
    );
  };

  // Save to Documents folder
  const handleSaveFile = async () => {
    if (!completedJob?.resultUri) return;
    try {
      const docDir = FileSystem.documentDirectory;
      if (docDir) {
        const dest = `${docDir}${completedJob.resultFileName || 'Converted_File'}`;
        await FileSystem.copyAsync({
          from: completedJob.resultUri,
          to: dest,
        });
        Alert.alert(
          'Saved to Device',
          `"${completedJob.resultFileName || 'Document'}" is safely saved in your Vertex Docs storage folder.`
        );
      }
    } catch (err: any) {
      Alert.alert('Save Error', err?.message || 'Could not copy file to storage.');
    }
  };

  const handleRestart = () => {
    setSelectedFile(null);
    setTargetFormat(null);
    setConversionJob(null);
    setCompletedJob(null);
  };

  const supportedTargets = selectedFile ? getSupportedTargets(selectedFile.format) : [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AppHeader
        title="Document Converter"
        subtitle="Universal file format conversion"
        showBack={true}
        onBack={onBack}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Step 1: Select File */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Select File</Text>
          <Text style={styles.sectionSubtitle}>
            Choose a document or image to automatically identify its format
          </Text>

          {selectedFile ? (
            <SelectedFileCard
              fileName={selectedFile.name}
              fileSizeFormatted={selectedFile.sizeFormatted}
              detectedFormat={selectedFile.format}
              onRemoveOrChange={handlePickFile}
              changeButtonLabel="Change"
            />
          ) : (
            <TouchableOpacity
              style={styles.pickerBox}
              onPress={handlePickFile}
              activeOpacity={0.8}
            >
              <View style={styles.pickerIconCircle}>
                <Ionicons name="cloud-upload-outline" size={28} color={COLORS.primary} />
              </View>
              <Text style={styles.pickerTitle}>Choose a file to convert</Text>
              <Text style={styles.pickerSub}>
                Supports PDF, DOCX, TXT, XLSX, JPG, PNG, WebP
              </Text>
              <View style={styles.browseButton}>
                <Ionicons name="folder-open" size={16} color="#FFFFFF" />
                <Text style={styles.browseButtonText}>Browse Files</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Step 2: Target Format Selection (Only shown when file is selected) */}
        {selectedFile && !completedJob && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Choose Output Format</Text>
            <Text style={styles.sectionSubtitle}>
              Available formats compatible with {selectedFile.format.toUpperCase()}
            </Text>

            {supportedTargets.length > 0 ? (
              <View style={styles.formatGrid}>
                {supportedTargets.map((item) => {
                  const isSelected = targetFormat === item.format;
                  return (
                    <TouchableOpacity
                      key={item.format}
                      style={[
                        styles.formatChip,
                        isSelected && styles.formatChipActive,
                      ]}
                      onPress={() => setTargetFormat(item.format)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.chipIconBox,
                          isSelected && styles.chipIconBoxActive,
                        ]}
                      >
                        <Ionicons
                          name="document-text"
                          size={18}
                          color={isSelected ? '#FFFFFF' : COLORS.primary}
                        />
                      </View>
                      <View style={styles.chipTextContainer}>
                        <Text
                          style={[
                            styles.chipTitle,
                            isSelected && styles.chipTitleActive,
                          ]}
                        >
                          {item.label}
                        </Text>
                        <Text style={styles.chipEngine} numberOfLines={1}>
                          {item.description}
                        </Text>
                      </View>
                      {isSelected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color={COLORS.primary}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.unsupportedCard}>
                <Ionicons name="alert-circle" size={20} color="#F59E0B" />
                <Text style={styles.unsupportedText}>
                  No direct conversion available for this file type on this device.
                </Text>
              </View>
            )}

            {/* Convert Button */}
            {targetFormat && !isConverting && (
              <TouchableOpacity
                style={styles.convertBtn}
                onPress={handleStartConversion}
                activeOpacity={0.8}
              >
                <Ionicons name="swap-horizontal" size={20} color="#FFFFFF" />
                <Text style={styles.convertBtnText}>
                  Convert to {targetFormat.toUpperCase()} Now
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Step 3: Conversion Progress */}
        {isConverting && (
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.progressTitle}>Converting Document...</Text>
              <Text style={styles.progressPercent}>
                {conversionJob?.progress || 35}%
              </Text>
            </View>

            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${conversionJob?.progress || 35}%` },
                ]}
              />
            </View>

            <Text style={styles.progressStepText}>
              {conversionJob?.currentStepText || 'Processing file structure and data...'}
            </Text>
          </View>
        )}

        {/* Step 4: Completed Result Card */}
        {completedJob && completedJob.status === 'completed' && (
          <ProcessingResultCard
            title="Conversion Complete"
            outputFileName={completedJob.resultFileName || 'Converted Document'}
            originalSizeFormatted={selectedFile?.sizeFormatted}
            finalSizeFormatted={completedJob.resultSizeFormatted || '1.0 MB'}
            onOpen={handleOpenFile}
            onShare={handleShareFile}
            onSave={handleSaveFile}
            onRestart={handleRestart}
            restartLabel="Convert Another File"
          />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl * 2,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm + 2,
  },
  pickerBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginVertical: SPACING.xs,
  },
  pickerIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  pickerSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    gap: 8,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  formatGrid: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  formatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
  },
  formatChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0F9FF',
  },
  chipIconBox: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  chipIconBoxActive: {
    backgroundColor: COLORS.primary,
  },
  chipTextContainer: {
    flex: 1,
  },
  chipTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  chipTitleActive: {
    color: COLORS.primary,
  },
  chipEngine: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  unsupportedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
  },
  unsupportedText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
  },
  convertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    gap: 8,
    ...SHADOWS.md,
    marginTop: SPACING.sm,
  },
  convertBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.md,
    marginVertical: SPACING.md,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  progressTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginLeft: 8,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginVertical: SPACING.sm,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
  },
  progressStepText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});
