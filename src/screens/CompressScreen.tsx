/**
 * Vertex Docs Mobile - Document & Image Compression Screen (Phase 3)
 * Company: JM Vertex Technologies
 * 
 * Requirements:
 * 1. File selection: PDF, JPG, PNG.
 * 2. Prominently displays current file size.
 * 3. Target size input in KB/MB with quick suggestions (High Quality, Balanced, Smaller).
 * 4. Genuine compression execution with progress updates.
 * 5. Results showing original vs compressed size, bytes saved, reduction %, Open, Share, Save.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
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
import { imageService, ImageCompressionResult } from '../services/imageService';
import { pdfService } from '../services/pdfService';
import { historyService } from '../services/historyService';
import { SelectedFile } from '../types/converter';
import { formatBytes } from '../constants/formatMatrix';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../constants/theme';

interface CompressScreenProps {
  onBack: () => void;
}

export const CompressScreen: React.FC<CompressScreenProps> = ({ onBack }) => {
  const insets = useSafeAreaInsets();

  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [targetSizeInput, setTargetSizeInput] = useState<string>('');
  const [targetUnit, setTargetUnit] = useState<'KB' | 'MB'>('KB');
  const [selectedPreset, setSelectedPreset] = useState<'high' | 'balanced' | 'small' | null>('balanced');
  const [isCompressing, setIsCompressing] = useState(false);
  const [progressText, setProgressText] = useState('');

  // Result state
  const [compressionResult, setCompressionResult] = useState<{
    uri: string;
    originalSize: number;
    finalSize: number;
    fileName: string;
    reductionPercentage: number;
    mimeType: string;
  } | null>(null);

  // Pick document or image
  const handlePickFile = async () => {
    try {
      const file = await converterService.pickDocument();
      if (file) {
        setSelectedFile(file);
        setCompressionResult(null);

        // Pre-fill target size with 50% balanced preset
        const defaultTargetBytes = Math.round(file.size * 0.5);
        if (defaultTargetBytes >= 1024 * 1024) {
          setTargetSizeInput((defaultTargetBytes / (1024 * 1024)).toFixed(1));
          setTargetUnit('MB');
        } else {
          setTargetSizeInput(Math.round(defaultTargetBytes / 1024).toString());
          setTargetUnit('KB');
        }
        setSelectedPreset('balanced');
      }
    } catch (err: any) {
      Alert.alert('File Picker', err?.message || 'Unable to open file picker.');
    }
  };

  // Quick preset calculation
  const applyPreset = (preset: 'high' | 'balanced' | 'small') => {
    if (!selectedFile) return;
    setSelectedPreset(preset);

    const ratio = preset === 'high' ? 0.75 : preset === 'balanced' ? 0.5 : 0.25;
    const bytes = Math.round(selectedFile.size * ratio);

    if (bytes >= 1024 * 1024) {
      setTargetSizeInput((bytes / (1024 * 1024)).toFixed(1));
      setTargetUnit('MB');
    } else {
      setTargetSizeInput(Math.round(bytes / 1024).toString());
      setTargetUnit('KB');
    }
  };

  // Run genuine compression
  const handleStartCompression = async () => {
    if (!selectedFile) {
      Alert.alert('No File', 'Please select a file to compress.');
      return;
    }

    const numericValue = parseFloat(targetSizeInput);
    if (isNaN(numericValue) || numericValue <= 0) {
      Alert.alert('Invalid Target Size', 'Please enter a valid target size.');
      return;
    }

    const targetBytes =
      targetUnit === 'MB' ? Math.round(numericValue * 1024 * 1024) : Math.round(numericValue * 1024);

    setIsCompressing(true);
    setProgressText('Analyzing file structure and assets...');

    try {
      const fmt = selectedFile.format.toLowerCase();

      if (['jpg', 'jpeg', 'png', 'webp'].includes(fmt)) {
        // Real iterative image compression
        setProgressText('Stepping down image resolution and optimizing quality...');
        const imgFormat = fmt === 'png' ? 'png' : fmt === 'webp' ? 'webp' : 'jpg';

        const result: ImageCompressionResult = await imageService.compressToTargetSize(
          selectedFile.uri,
          targetBytes,
          imgFormat,
          (msg) => setProgressText(msg)
        );

        const mime = fmt === 'png' ? 'image/png' : fmt === 'webp' ? 'image/webp' : 'image/jpeg';
        const reduction = Math.max(
          0,
          ((result.originalSize - result.finalSize) / result.originalSize) * 100
        );

        setCompressionResult({
          uri: result.uri,
          originalSize: result.originalSize,
          finalSize: result.finalSize,
          fileName: result.fileName,
          reductionPercentage: reduction,
          mimeType: mime,
        });

        // Add to history
        historyService.addRecord({
          type: 'conversion',
          title: result.fileName,
          sourceFormat: fmt as any,
          targetFormat: fmt as any,
          status: 'completed',
          fileSize: result.finalSize,
          fileSizeFormatted: formatBytes(result.finalSize),
          uri: result.uri,
        });
      } else if (fmt === 'pdf') {
        // Real PDF stream optimization
        setProgressText('Compressing PDF stream objects and metadata...');
        const outName = `Compressed_${selectedFile.name}`;
        const pdfRes = await pdfService.compressPdf(selectedFile.uri, outName);

        const reduction = Math.max(
          0,
          ((selectedFile.size - pdfRes.size) / selectedFile.size) * 100
        );

        setCompressionResult({
          uri: pdfRes.uri,
          originalSize: selectedFile.size,
          finalSize: pdfRes.size,
          fileName: pdfRes.fileName,
          reductionPercentage: reduction,
          mimeType: 'application/pdf',
        });

        // Add to history
        historyService.addRecord({
          type: 'conversion',
          title: pdfRes.fileName,
          sourceFormat: 'pdf',
          targetFormat: 'pdf',
          status: 'completed',
          fileSize: pdfRes.size,
          fileSizeFormatted: formatBytes(pdfRes.size),
          uri: pdfRes.uri,
        });
      } else {
        Alert.alert(
          'Format Notice',
          `Direct compression is optimized for PDF and image formats (JPG, PNG, WebP).`
        );
      }
    } catch (err: any) {
      Alert.alert('Compression Error', err?.message || 'Failed to compress document.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleOpenFile = async () => {
    if (!compressionResult?.uri) return;
    try {
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(compressionResult.uri, {
          dialogTitle: `Open ${compressionResult.fileName}`,
          mimeType: compressionResult.mimeType,
        });
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not open file.');
    }
  };

  const handleShareFile = async () => {
    if (!compressionResult?.uri) return;
    try {
      await Sharing.shareAsync(compressionResult.uri, {
        dialogTitle: `Share ${compressionResult.fileName}`,
        mimeType: compressionResult.mimeType,
      });
    } catch (err: any) {
      Alert.alert('Share Error', err?.message || 'Could not share file.');
    }
  };

  const handleSaveFile = async () => {
    if (!compressionResult?.uri) return;
    try {
      const docDir = FileSystem.documentDirectory;
      if (docDir) {
        const dest = `${docDir}${compressionResult.fileName}`;
        await FileSystem.copyAsync({
          from: compressionResult.uri,
          to: dest,
        });
        Alert.alert(
          'Saved to Storage',
          `"${compressionResult.fileName}" is saved in your device storage.`
        );
      }
    } catch (err: any) {
      Alert.alert('Save Error', err?.message || 'Could not save file.');
    }
  };

  const handleRestart = () => {
    setSelectedFile(null);
    setCompressionResult(null);
    setTargetSizeInput('');
    setSelectedPreset(null);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AppHeader
        title="File Compressor"
        subtitle="Reduce file size while preserving quality"
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
            Choose a PDF document or image (JPG, PNG, WebP)
          </Text>

          {selectedFile ? (
            <SelectedFileCard
              fileName={selectedFile.name}
              fileSizeFormatted={selectedFile.sizeFormatted}
              detectedFormat={selectedFile.format}
              onRemoveOrChange={handlePickFile}
              highlightSize={true}
            />
          ) : (
            <TouchableOpacity
              style={styles.pickerBox}
              onPress={handlePickFile}
              activeOpacity={0.8}
            >
              <View style={styles.pickerIconCircle}>
                <Ionicons name="contract" size={28} color="#D97706" />
              </View>
              <Text style={styles.pickerTitle}>Choose file to compress</Text>
              <Text style={styles.pickerSub}>
                Supports PDF, JPG, PNG, and WebP
              </Text>
              <View style={[styles.browseButton, { backgroundColor: '#D97706' }]}>
                <Ionicons name="folder-open" size={16} color="#FFFFFF" />
                <Text style={styles.browseButtonText}>Select File</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Step 2: Set Target Size */}
        {selectedFile && !compressionResult && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Target Size & Quality</Text>
            <Text style={styles.sectionSubtitle}>
              Current file size is <Text style={{ fontWeight: '700', color: COLORS.textPrimary }}>{selectedFile.sizeFormatted}</Text>
            </Text>

            {/* Quick Presets */}
            <View style={styles.presetsRow}>
              <TouchableOpacity
                style={[
                  styles.presetBtn,
                  selectedPreset === 'high' && styles.presetBtnActive,
                ]}
                onPress={() => applyPreset('high')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.presetBtnText,
                    selectedPreset === 'high' && styles.presetBtnTextActive,
                  ]}
                >
                  High Quality
                </Text>
                <Text style={styles.presetSub}>75% size</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.presetBtn,
                  selectedPreset === 'balanced' && styles.presetBtnActive,
                ]}
                onPress={() => applyPreset('balanced')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.presetBtnText,
                    selectedPreset === 'balanced' && styles.presetBtnTextActive,
                  ]}
                >
                  Balanced
                </Text>
                <Text style={styles.presetSub}>50% size</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.presetBtn,
                  selectedPreset === 'small' && styles.presetBtnActive,
                ]}
                onPress={() => applyPreset('small')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.presetBtnText,
                    selectedPreset === 'small' && styles.presetBtnTextActive,
                  ]}
                >
                  Smallest
                </Text>
                <Text style={styles.presetSub}>25% size</Text>
              </TouchableOpacity>
            </View>

            {/* Custom Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Custom Target Size:</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.numericInput}
                  value={targetSizeInput}
                  onChangeText={(val) => {
                    setTargetSizeInput(val);
                    setSelectedPreset(null);
                  }}
                  keyboardType="numeric"
                  placeholder="e.g. 500"
                  placeholderTextColor="#94A3B8"
                />

                <View style={styles.unitToggle}>
                  <TouchableOpacity
                    style={[styles.unitBtn, targetUnit === 'KB' && styles.unitBtnActive]}
                    onPress={() => setTargetUnit('KB')}
                  >
                    <Text
                      style={[
                        styles.unitBtnText,
                        targetUnit === 'KB' && styles.unitBtnTextActive,
                      ]}
                    >
                      KB
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.unitBtn, targetUnit === 'MB' && styles.unitBtnActive]}
                    onPress={() => setTargetUnit('MB')}
                  >
                    <Text
                      style={[
                        styles.unitBtnText,
                        targetUnit === 'MB' && styles.unitBtnTextActive,
                      ]}
                    >
                      MB
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Compress CTA */}
            {!isCompressing && (
              <TouchableOpacity
                style={styles.compressBtn}
                onPress={handleStartCompression}
                activeOpacity={0.8}
              >
                <Ionicons name="contract" size={20} color="#FFFFFF" />
                <Text style={styles.compressBtnText}>Compress Now</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Progress Card */}
        {isCompressing && (
          <View style={styles.progressCard}>
            <ActivityIndicator size="small" color="#D97706" style={{ marginBottom: 8 }} />
            <Text style={styles.progressTitle}>Compressing Document...</Text>
            <Text style={styles.progressStepText}>{progressText}</Text>
          </View>
        )}

        {/* Result Card */}
        {compressionResult && (
          <ProcessingResultCard
            title="Compression Complete"
            outputFileName={compressionResult.fileName}
            originalSizeFormatted={formatBytes(compressionResult.originalSize)}
            finalSizeFormatted={formatBytes(compressionResult.finalSize)}
            reductionPercentage={compressionResult.reductionPercentage}
            onOpen={handleOpenFile}
            onShare={handleShareFile}
            onSave={handleSaveFile}
            onRestart={handleRestart}
            restartLabel="Compress Another File"
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
    backgroundColor: '#FEF3C7',
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
  presetsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  presetBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm + 2,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  presetBtnActive: {
    borderColor: '#D97706',
    backgroundColor: '#FFFBEB',
  },
  presetBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  presetBtnTextActive: {
    color: '#D97706',
  },
  presetSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  numericInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: RADIUS.md,
    padding: 3,
  },
  unitBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  unitBtnActive: {
    backgroundColor: '#FFFFFF',
    ...SHADOWS.sm,
  },
  unitBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  unitBtnTextActive: {
    color: COLORS.textPrimary,
  },
  compressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D97706',
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    gap: 8,
    ...SHADOWS.md,
  },
  compressBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.md,
    marginVertical: SPACING.md,
  },
  progressTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  progressStepText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

