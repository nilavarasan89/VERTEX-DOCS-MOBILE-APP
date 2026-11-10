/**
 * Vertex Docs Mobile - Document & Image Merger Screen (Phase 4)
 * Company: JM Vertex Technologies
 * 
 * Requirements:
 * 1. Multi-file picker with "Add More Files".
 * 2. Reorderable list with Up/Down buttons and remove actions.
 * 3. Automatic merge operation detector (Multiple PDFs -> PDF Merge; Images -> Multi-page PDF).
 * 4. Output filename input and execution progress.
 * 5. Result card with Open, Share, and Save actions.
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
import { ProcessingResultCard } from '../components/common/ProcessingResultCard';
import { converterService } from '../services/converterService';
import { pdfService, PdfOperationResult } from '../services/pdfService';
import { historyService } from '../services/historyService';
import { SelectedFile } from '../types/converter';
import { formatBytes } from '../constants/formatMatrix';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../constants/theme';

interface MergeScreenProps {
  onBack: () => void;
}

export const MergeScreen: React.FC<MergeScreenProps> = ({ onBack }) => {
  const insets = useSafeAreaInsets();

  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [outputName, setOutputName] = useState<string>('Merged_Document.pdf');
  const [isMerging, setIsMerging] = useState(false);
  const [mergeResult, setMergeResult] = useState<PdfOperationResult | null>(null);

  // Pick files and append
  const handleAddFiles = async () => {
    try {
      const picked = await converterService.pickMultipleDocuments();
      if (picked && picked.length > 0) {
        setFiles((prev) => [...prev, ...picked]);
        setMergeResult(null);
      }
    } catch (err: any) {
      Alert.alert('File Picker', err?.message || 'Unable to open file picker.');
    }
  };

  // Move item up
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const updated = [...files];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    setFiles(updated);
  };

  // Move item down
  const handleMoveDown = (index: number) => {
    if (index >= files.length - 1) return;
    const updated = [...files];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    setFiles(updated);
  };

  // Remove file
  const handleRemove = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Detect merge type
  const isAllPdf = files.length > 0 && files.every((f) => f.format === 'pdf');
  const isAllImages =
    files.length > 0 &&
    files.every((f) => ['jpg', 'jpeg', 'png'].includes(f.format.toLowerCase()));

  // Execute Merge
  const handleStartMerge = async () => {
    if (files.length < 2) {
      Alert.alert('Need at least 2 files', 'Please select at least two documents or images to merge.');
      return;
    }

    if (!isAllPdf && !isAllImages) {
      Alert.alert(
        'Mixed Formats',
        'Please select either all PDF files or all image files (JPG/PNG) to combine into a PDF.'
      );
      return;
    }

    setIsMerging(true);
    try {
      const cleanName = outputName.trim().endsWith('.pdf')
        ? outputName.trim()
        : `${outputName.trim()}.pdf`;

      const uris = files.map((f) => f.uri);

      let result: PdfOperationResult;
      if (isAllPdf) {
        result = await pdfService.mergePdfs(uris, cleanName);
      } else {
        result = await pdfService.imagesToPdf(uris, cleanName);
      }

      setMergeResult(result);

      // Add to history
      historyService.addRecord({
        type: 'merge',
        title: result.fileName,
        sourceFormat: isAllPdf ? 'pdf' : 'jpg',
        targetFormat: 'pdf',
        status: 'completed',
        fileSize: result.size,
        fileSizeFormatted: formatBytes(result.size),
        uri: result.uri,
      });
    } catch (err: any) {
      Alert.alert('Merge Failed', err?.message || 'Failed to merge documents.');
    } finally {
      setIsMerging(false);
    }
  };

  const handleOpenFile = async () => {
    if (!mergeResult?.uri) return;
    try {
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(mergeResult.uri, {
          dialogTitle: `Open ${mergeResult.fileName}`,
          mimeType: 'application/pdf',
        });
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not open file.');
    }
  };

  const handleShareFile = async () => {
    if (!mergeResult?.uri) return;
    try {
      await Sharing.shareAsync(mergeResult.uri, {
        dialogTitle: `Share ${mergeResult.fileName}`,
        mimeType: 'application/pdf',
      });
    } catch (err: any) {
      Alert.alert('Share Error', err?.message || 'Could not share file.');
    }
  };

  const handleSaveFile = async () => {
    if (!mergeResult?.uri) return;
    try {
      const docDir = FileSystem.documentDirectory;
      if (docDir) {
        const dest = `${docDir}${mergeResult.fileName}`;
        await FileSystem.copyAsync({
          from: mergeResult.uri,
          to: dest,
        });
        Alert.alert(
          'Saved to Storage',
          `"${mergeResult.fileName}" is saved in your device storage.`
        );
      }
    } catch (err: any) {
      Alert.alert('Save Error', err?.message || 'Could not save file.');
    }
  };

  const handleRestart = () => {
    setFiles([]);
    setMergeResult(null);
    setOutputName('Merged_Document.pdf');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AppHeader
        title="Merge Documents"
        subtitle="Combine multiple files into one document"
        showBack={true}
        onBack={onBack}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Step 1: File selection & reordering */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>1. Select Files ({files.length})</Text>
              <Text style={styles.sectionSubtitle}>
                Add 2 or more files and reorder them as needed
              </Text>
            </View>

            <TouchableOpacity
              style={styles.addFilesBtn}
              onPress={handleAddFiles}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.addFilesBtnText}>Add Files</Text>
            </TouchableOpacity>
          </View>

          {/* Operation Detection Notice */}
          {files.length > 0 && (
            <View
              style={[
                styles.modeBanner,
                {
                  backgroundColor: isAllPdf
                    ? '#EFF6FF'
                    : isAllImages
                    ? '#FDF4FF'
                    : '#FEF3C7',
                },
              ]}
            >
              <Ionicons
                name={isAllPdf || isAllImages ? 'checkmark-circle' : 'alert-circle'}
                size={18}
                color={isAllPdf ? '#2563EB' : isAllImages ? '#9333EA' : '#D97706'}
              />
              <Text
                style={[
                  styles.modeBannerText,
                  {
                    color: isAllPdf ? '#1E40AF' : isAllImages ? '#6B21A8' : '#92400E',
                  },
                ]}
              >
                {isAllPdf
                  ? 'PDF Merge: Combining multiple PDF documents into one'
                  : isAllImages
                  ? 'Image Merge: Combining images into a multi-page PDF'
                  : 'Notice: Please ensure all selected files are either PDFs or images.'}
              </Text>
            </View>
          )}

          {/* Files List */}
          {files.length > 0 ? (
            <View style={styles.filesList}>
              {files.map((file, idx) => (
                <View key={`${file.name}_${idx}`} style={styles.fileRow}>
                  <View style={styles.orderBadge}>
                    <Text style={styles.orderBadgeText}>{idx + 1}</Text>
                  </View>

                  <View style={styles.fileDetails}>
                    <Text style={styles.fileName} numberOfLines={1}>
                      {file.name}
                    </Text>
                    <View style={styles.fileMeta}>
                      <View style={styles.formatBadge}>
                        <Text style={styles.formatBadgeText}>
                          {file.format.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.fileSize}>{file.sizeFormatted}</Text>
                    </View>
                  </View>

                  {/* Up / Down Controls */}
                  <View style={styles.reorderControls}>
                    <TouchableOpacity
                      style={[styles.arrowBtn, idx === 0 && styles.arrowBtnDisabled]}
                      disabled={idx === 0}
                      onPress={() => handleMoveUp(idx)}
                    >
                      <Ionicons
                        name="chevron-up"
                        size={18}
                        color={idx === 0 ? '#CBD5E1' : COLORS.textPrimary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.arrowBtn,
                        idx === files.length - 1 && styles.arrowBtnDisabled,
                      ]}
                      disabled={idx === files.length - 1}
                      onPress={() => handleMoveDown(idx)}
                    >
                      <Ionicons
                        name="chevron-down"
                        size={18}
                        color={idx === files.length - 1 ? '#CBD5E1' : COLORS.textPrimary}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Remove Button */}
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleRemove(idx)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <TouchableOpacity
              style={styles.pickerBox}
              onPress={handleAddFiles}
              activeOpacity={0.8}
            >
              <View style={[styles.pickerIconCircle, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="layers" size={28} color="#4F46E5" />
              </View>
              <Text style={styles.pickerTitle}>Choose files to merge</Text>
              <Text style={styles.pickerSub}>
                Select multiple PDFs or images to combine
              </Text>
              <View style={[styles.browseButton, { backgroundColor: '#4F46E5' }]}>
                <Ionicons name="folder-open" size={16} color="#FFFFFF" />
                <Text style={styles.browseButtonText}>Select Files</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Step 2: Output filename & execution */}
        {files.length >= 2 && !mergeResult && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Output Settings</Text>
            <Text style={styles.sectionSubtitle}>
              Give your merged PDF document a name
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Output File Name:</Text>
              <TextInput
                style={styles.textInput}
                value={outputName}
                onChangeText={setOutputName}
                placeholder="Merged_Document.pdf"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Merge CTA */}
            {!isMerging && (
              <TouchableOpacity
                style={styles.mergeBtn}
                onPress={handleStartMerge}
                activeOpacity={0.8}
              >
                <Ionicons name="layers" size={20} color="#FFFFFF" />
                <Text style={styles.mergeBtnText}>
                  Merge {files.length} Files Now
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Progress Card */}
        {isMerging && (
          <View style={styles.progressCard}>
            <ActivityIndicator size="small" color="#4F46E5" style={{ marginBottom: 8 }} />
            <Text style={styles.progressTitle}>Merging Files into PDF...</Text>
            <Text style={styles.progressStepText}>
              Stitching pages and optimizing document catalog...
            </Text>
          </View>
        )}

        {/* Result Card */}
        {mergeResult && (
          <ProcessingResultCard
            title="Files Merged Successfully"
            outputFileName={mergeResult.fileName}
            finalSizeFormatted={`${formatBytes(mergeResult.size)} • ${mergeResult.pageCount} Pages`}
            onOpen={handleOpenFile}
            onShare={handleShareFile}
            onSave={handleSaveFile}
            onRestart={handleRestart}
            restartLabel="Merge Other Files"
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  addFilesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.md,
    gap: 4,
  },
  addFilesBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  modeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    gap: 8,
    marginBottom: SPACING.sm,
  },
  modeBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  filesList: {
    gap: SPACING.xs + 2,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: SPACING.sm + 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
  },
  orderBadge: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  orderBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4F46E5',
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  fileMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  formatBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  formatBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  fileSize: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  reorderControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 6,
  },
  arrowBtn: {
    padding: 6,
    borderRadius: RADIUS.xs,
    backgroundColor: '#F8FAFC',
  },
  arrowBtnDisabled: {
    opacity: 0.4,
  },
  deleteBtn: {
    padding: 6,
    borderRadius: RADIUS.xs,
    backgroundColor: '#FEF2F2',
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
  textInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  mergeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    gap: 8,
    ...SHADOWS.md,
  },
  mergeBtnText: {
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

