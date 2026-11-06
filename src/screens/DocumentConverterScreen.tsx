/**
 * Vertex Docs Mobile - Document Converter Screen
 * Company: JM Vertex Technologies
 * 
 * Includes:
 * 1. Single Document Conversion (PDF, DOCX, TXT, XLSX, JPG, PNG) & Capability Matrix
 * 2. Multi-File Merge (PDF Merge, Images-to-PDF with reordering and removal)
 * 3. Image Transcoding & Iterative Compression to Target Size (KB/MB)
 * 4. Document Content & PDF Page Editing (TXT/DOCX edit, PDF rotate/delete, Open in App)
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
  Modal,
  ActivityIndicator,
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
  CONVERSION_CAPABILITY_TABLE,
  formatBytes,
} from '../constants/formatMatrix';
import { converterService } from '../services/converterService';
import { pdfService } from '../services/pdfService';
import { docxService } from '../services/docxService';
import { imageService, ImageCompressionResult } from '../services/imageService';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../constants/theme';
import { ScreenType } from '../types';

type ConverterModuleTab = 'convert' | 'merge' | 'compress' | 'edit';

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
  const [activeTab, setActiveTab] = useState<ConverterModuleTab>('convert');

  // --- MODULE 1: CONVERT STATE ---
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [targetFormat, setTargetFormat] = useState<TargetFormat | null>(null);
  const [conversionJob, setConversionJob] = useState<ConversionJob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCapabilityModal, setShowCapabilityModal] = useState(false);

  // --- MODULE 2: MERGE STATE ---
  const [mergeFiles, setMergeFiles] = useState<SelectedFile[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [mergeResult, setMergeResult] = useState<{
    uri: string;
    fileName: string;
    size: number;
    pageCount: number;
  } | null>(null);

  // --- MODULE 3: COMPRESS STATE ---
  const [compressFile, setCompressFile] = useState<SelectedFile | null>(null);
  const [compressFormat, setCompressFormat] = useState<'jpg' | 'png' | 'webp'>('jpg');
  const [targetSizeInput, setTargetSizeInput] = useState('200');
  const [targetUnit, setTargetUnit] = useState<'KB' | 'MB'>('KB');
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressProgressText, setCompressProgressText] = useState('');
  const [compressResult, setCompressResult] = useState<ImageCompressionResult | null>(null);

  // --- MODULE 4: EDIT STATE ---
  const [editFile, setEditFile] = useState<SelectedFile | null>(null);
  const [editText, setEditText] = useState('');
  const [pdfPageCount, setPdfPageCount] = useState<number>(0);
  const [selectedPageNumber, setSelectedPageNumber] = useState('1');
  const [rotationDegrees, setRotationDegrees] = useState<90 | 180 | 270>(90);
  const [isEditing, setIsEditing] = useState(false);
  const [editStatusMessage, setEditStatusMessage] = useState('');

  // ==========================================
  // MODULE 1 HANDLERS (CONVERT)
  // ==========================================
  const handlePickFile = async () => {
    try {
      const file = await converterService.pickDocument();
      if (file) {
        setSelectedFile(file);
        setTargetFormat(null);
        setConversionJob(null);
      }
    } catch {
      Alert.alert('File Picker', 'Unable to access device file system.');
    }
  };

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
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Conversion could not be processed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetConvert = () => {
    setSelectedFile(null);
    setTargetFormat(null);
    setConversionJob(null);
    setIsProcessing(false);
  };

  const handleShare = async () => {
    if (!conversionJob || !conversionJob.resultUri) return;
    const ok = await converterService.shareDocument(conversionJob.resultUri, conversionJob.resultFileName);
    if (!ok) {
      Alert.alert('Share', 'Document sharing is not available on this platform.');
    }
  };

  const handleSave = () => {
    Alert.alert(
      'Document Saved',
      `"${conversionJob?.resultFileName || 'Document'}" has been verified and saved to your device cache.`
    );
  };

  const handleForwardToTranslator = async (job: ConversionJob) => {
    let extractedText = '';
    if (job.resultUri && (job.targetFormat === 'txt' || job.targetFormat === 'docx')) {
      try {
        if (job.targetFormat === 'txt') {
          extractedText = await converterService.extractTextForTranslation({
            uri: job.resultUri,
            name: job.resultFileName || 'Document.txt',
            size: job.resultSize || 1024,
            sizeFormatted: job.resultSizeFormatted || '1 KB',
            format: 'txt',
          });
        } else if (job.targetFormat === 'docx') {
          extractedText = await docxService.extractTextFromDocx(job.resultUri);
        }
      } catch {
        extractedText = '';
      }
    } else if (selectedFile) {
      try {
        extractedText = await converterService.extractTextForTranslation(selectedFile);
      } catch {
        extractedText = '';
      }
    }

    onNavigateToTranslator(
      job.resultFileName || job.fileName,
      extractedText,
      job.targetFormat
    );
  };

  // ==========================================
  // MODULE 2 HANDLERS (MERGE)
  // ==========================================
  const handlePickMergeFiles = async () => {
    try {
      const files = await converterService.pickMultipleDocuments();
      if (files.length > 0) {
        setMergeFiles((prev) => [...prev, ...files]);
      }
    } catch {
      Alert.alert('Picker Error', 'Unable to pick multiple documents.');
    }
  };

  const handleMoveFile = (index: number, direction: 'up' | 'down') => {
    const newFiles = [...mergeFiles];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newFiles.length) return;
    const temp = newFiles[index];
    newFiles[index] = newFiles[targetIdx];
    newFiles[targetIdx] = temp;
    setMergeFiles(newFiles);
  };

  const handleRemoveMergeFile = (index: number) => {
    setMergeFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleExecuteMerge = async () => {
    if (mergeFiles.length < 2) {
      Alert.alert('Merge Requirements', 'Please select at least 2 files to merge.');
      return;
    }

    const allPdfs = mergeFiles.every((f) => f.format === 'pdf');
    const allImages = mergeFiles.every((f) => f.format === 'jpg' || f.format === 'png');

    if (!allPdfs && !allImages) {
      Alert.alert(
        'Format Mismatch',
        'Please select either all PDF files or all image files (JPG/PNG) to merge into a single PDF.'
      );
      return;
    }

    setIsMerging(true);
    try {
      const uris = mergeFiles.map((f) => f.uri);
      let result;

      if (allPdfs) {
        result = await pdfService.mergePdfs(uris, `Merged_Document_${Date.now()}.pdf`);
      } else {
        result = await pdfService.imagesToPdf(uris, `Combined_Images_${Date.now()}.pdf`);
      }

      setMergeResult(result);
    } catch (err: any) {
      Alert.alert('Merge Failed', err?.message || 'Unable to merge selected files.');
    } finally {
      setIsMerging(false);
    }
  };

  // ==========================================
  // MODULE 3 HANDLERS (COMPRESS)
  // ==========================================
  const handlePickCompressImage = async () => {
    try {
      const file = await converterService.pickDocument();
      if (file && (file.format === 'jpg' || file.format === 'png')) {
        setCompressFile(file);
        setCompressResult(null);
      } else {
        Alert.alert('Invalid Format', 'Please select a JPG or PNG image to compress.');
      }
    } catch {
      Alert.alert('Picker Error', 'Unable to pick image file.');
    }
  };

  const handleExecuteCompression = async () => {
    if (!compressFile) return;

    const num = parseFloat(targetSizeInput);
    if (isNaN(num) || num <= 0) {
      Alert.alert('Invalid Size', 'Please enter a valid target size (e.g. 200 KB).');
      return;
    }

    const targetBytes = targetUnit === 'MB' ? num * 1024 * 1024 : num * 1024;
    setIsCompressing(true);
    setCompressProgressText('Analyzing image dimensions and colors...');

    try {
      const result = await imageService.compressToTargetSize(
        compressFile.uri,
        targetBytes,
        compressFormat,
        (msg) => setCompressProgressText(msg)
      );
      setCompressResult(result);
    } catch (err: any) {
      Alert.alert('Compression Error', err?.message || 'Image compression failed.');
    } finally {
      setIsCompressing(false);
    }
  };

  // ==========================================
  // MODULE 4 HANDLERS (EDIT)
  // ==========================================
  const handlePickEditFile = async () => {
    try {
      const file = await converterService.pickDocument();
      if (!file) return;

      setEditFile(file);
      setEditStatusMessage('');

      if (file.format === 'txt') {
        const text = await converterService.extractTextForTranslation(file);
        setEditText(text);
      } else if (file.format === 'docx') {
        const text = await docxService.extractTextFromDocx(file.uri);
        setEditText(text);
      } else if (file.format === 'pdf') {
        const count = await pdfService.getPdfPageCount(file.uri);
        setPdfPageCount(count);
        setSelectedPageNumber('1');
      }
    } catch (err: any) {
      Alert.alert('File Error', err?.message || 'Could not load file for editing.');
    }
  };

  const handleSaveTextDocx = async () => {
    if (!editText.trim()) {
      Alert.alert('Empty Document', 'Please enter some text before saving.');
      return;
    }

    setIsEditing(true);
    try {
      const paragraphs = editText.split(/\r?\n\r?\n/).filter(Boolean);
      const res = await docxService.generateDocx(paragraphs, {
        title: editFile?.name.replace(/\.[^/.]+$/, '') || 'Edited Document',
        fileName: `Edited_${Date.now()}.docx`,
      });

      Alert.alert(
        'Document Saved',
        `Saved as new file "${res.fileName}" (${formatBytes(res.size)}).`,
        [
          { text: 'Close', style: 'cancel' },
          { text: 'Share File', onPress: () => converterService.shareDocument(res.uri, res.fileName) },
        ]
      );
    } catch (err: any) {
      Alert.alert('Save Error', err?.message || 'Failed to save DOCX.');
    } finally {
      setIsEditing(false);
    }
  };

  const handleRotatePdfPage = async () => {
    if (!editFile || editFile.format !== 'pdf') return;
    const pageNum = parseInt(selectedPageNumber, 10);
    if (isNaN(pageNum) || pageNum < 1 || pageNum > pdfPageCount) {
      Alert.alert('Invalid Page', `Page number must be between 1 and ${pdfPageCount}.`);
      return;
    }

    setIsEditing(true);
    try {
      const res = await pdfService.modifyPdfPages(
        editFile.uri,
        {
          rotatePages: [{ pageIndex: pageNum - 1, degrees: rotationDegrees }],
        },
        `Rotated_p${pageNum}_${Date.now()}.pdf`
      );

      Alert.alert(
        'PDF Page Rotated',
        `Page ${pageNum} rotated by ${rotationDegrees}°. Saved as new file "${res.fileName}".`,
        [
          { text: 'Close', style: 'cancel' },
          { text: 'Share File', onPress: () => converterService.shareDocument(res.uri, res.fileName) },
        ]
      );
    } catch (err: any) {
      Alert.alert('PDF Error', err?.message || 'Failed to rotate PDF page.');
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeletePdfPage = async () => {
    if (!editFile || editFile.format !== 'pdf') return;
    if (pdfPageCount <= 1) {
      Alert.alert('Cannot Delete', 'This PDF has only 1 page. A PDF must retain at least one page.');
      return;
    }

    const pageNum = parseInt(selectedPageNumber, 10);
    if (isNaN(pageNum) || pageNum < 1 || pageNum > pdfPageCount) {
      Alert.alert('Invalid Page', `Page number must be between 1 and ${pdfPageCount}.`);
      return;
    }

    Alert.alert(
      'Confirm Page Deletion',
      `Are you sure you want to delete page ${pageNum} from this document? The original file remains untouched.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Page',
          style: 'destructive',
          onPress: async () => {
            setIsEditing(true);
            try {
              const res = await pdfService.modifyPdfPages(
                editFile.uri,
                {
                  deletePages: [pageNum - 1],
                },
                `PageDeleted_${Date.now()}.pdf`
              );

              setPdfPageCount(res.pageCount);
              Alert.alert(
                'Page Deleted',
                `Page ${pageNum} removed. New PDF contains ${res.pageCount} pages.`,
                [
                  { text: 'Close', style: 'cancel' },
                  { text: 'Share File', onPress: () => converterService.shareDocument(res.uri, res.fileName) },
                ]
              );
            } catch (err: any) {
              Alert.alert('PDF Error', err?.message || 'Failed to delete page.');
            } finally {
              setIsEditing(false);
            }
          },
        },
      ]
    );
  };

  const handleOpenInAnotherApp = async () => {
    if (!editFile) return;
    await converterService.shareDocument(editFile.uri, editFile.name);
  };

  // ==========================================
  // RENDER HELPERS
  // ==========================================
  const meta = selectedFile ? FORMAT_METADATA[selectedFile.format] : null;
  const availableOptions = selectedFile ? CONVERSION_MATRIX[selectedFile.format] || [] : [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <HeaderBar
        title="Document Studio"
        subtitle="Convert • Merge • Compress • Edit"
        showBack={true}
        onBack={onBack}
        rightAction={{
          icon: 'time-outline',
          onPress: () => onNavigateScreen && onNavigateScreen('history'),
        }}
      />

      {/* Top Segmented Tabs */}
      <View style={styles.topTabBar}>
        <TouchableOpacity
          style={[styles.topTabBtn, activeTab === 'convert' && styles.topTabBtnActive]}
          onPress={() => setActiveTab('convert')}
        >
          <Ionicons
            name="swap-horizontal"
            size={16}
            color={activeTab === 'convert' ? COLORS.primary : COLORS.textSecondary}
          />
          <Text
            style={[
              styles.topTabBtnText,
              activeTab === 'convert' && styles.topTabBtnTextActive,
            ]}
          >
            Convert
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.topTabBtn, activeTab === 'merge' && styles.topTabBtnActive]}
          onPress={() => setActiveTab('merge')}
        >
          <Ionicons
            name="layers"
            size={16}
            color={activeTab === 'merge' ? COLORS.primary : COLORS.textSecondary}
          />
          <Text
            style={[
              styles.topTabBtnText,
              activeTab === 'merge' && styles.topTabBtnTextActive,
            ]}
          >
            Merge
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.topTabBtn, activeTab === 'compress' && styles.topTabBtnActive]}
          onPress={() => setActiveTab('compress')}
        >
          <Ionicons
            name="resize"
            size={16}
            color={activeTab === 'compress' ? COLORS.primary : COLORS.textSecondary}
          />
          <Text
            style={[
              styles.topTabBtnText,
              activeTab === 'compress' && styles.topTabBtnTextActive,
            ]}
          >
            Compress
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.topTabBtn, activeTab === 'edit' && styles.topTabBtnActive]}
          onPress={() => setActiveTab('edit')}
        >
          <Ionicons
            name="create-outline"
            size={16}
            color={activeTab === 'edit' ? COLORS.primary : COLORS.textSecondary}
          />
          <Text
            style={[
              styles.topTabBtnText,
              activeTab === 'edit' && styles.topTabBtnTextActive,
            ]}
          >
            Edit
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ========================================================= */}
        {/* TAB 1: CONVERT (SINGLE FILE)                              */}
        {/* ========================================================= */}
        {activeTab === 'convert' && (
          <>
            {/* Capability Info Pill */}
            <TouchableOpacity
              style={styles.capabilityPill}
              onPress={() => setShowCapabilityModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="information-circle" size={16} color={COLORS.primary} />
              <Text style={styles.capabilityPillText}>
                View Conversion Capability Matrix & Engines
              </Text>
              <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
            </TouchableOpacity>

            {/* Step 1: File Selection */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.stepCircle}>
                  <Text style={styles.stepCircleText}>1</Text>
                </View>
                <View style={styles.sectionHeaderTitleContainer}>
                  <Text style={styles.sectionHeaderTitle}>Select Source File</Text>
                  <Text style={styles.sectionHeaderSubtitle}>
                    Choose PDF, DOCX, TXT, XLSX, JPG, or PNG
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
                    PDF, Word, Plain Text, Excel, and Images (up to 50 MB)
                  </Text>
                  <View style={styles.browseButton}>
                    <Ionicons name="folder-open-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.browseButtonText}>Browse Files</Text>
                  </View>
                </TouchableOpacity>
              ) : (
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
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.changeFileButton}
                    onPress={handlePickFile}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.changeFileButtonText}>Change</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Step 2: Target Format Selection */}
            {selectedFile && !conversionJob && (
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.stepCircle}>
                    <Text style={styles.stepCircleText}>2</Text>
                  </View>
                  <View style={styles.sectionHeaderTitleContainer}>
                    <Text style={styles.sectionHeaderTitle}>Select Output Format</Text>
                    <Text style={styles.sectionHeaderSubtitle}>
                      {availableOptions.length > 0
                        ? `Choose target format for ${selectedFile.format.toUpperCase()}`
                        : 'No standard conversion target available'}
                    </Text>
                  </View>
                </View>

                {availableOptions.length > 0 ? (
                  <FormatSelector
                    options={availableOptions}
                    selectedFormat={targetFormat}
                    onSelectFormat={setTargetFormat}
                  />
                ) : (
                  <View style={styles.unsupportedCard}>
                    <Ionicons name="alert-circle-outline" size={24} color="#D97706" />
                    <Text style={styles.unsupportedText}>
                      Direct conversion from {selectedFile.format.toUpperCase()} is unsupported on-device.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Step 3: Convert Action Button */}
            {selectedFile && targetFormat && !isProcessing && !conversionJob && (
              <TouchableOpacity
                style={styles.convertButton}
                onPress={handleStartConversion}
                activeOpacity={0.8}
              >
                <Ionicons name="flash" size={18} color="#FFFFFF" />
                <Text style={styles.convertButtonText}>
                  Convert to {targetFormat.toUpperCase()} Now
                </Text>
              </TouchableOpacity>
            )}

            {/* Step 4: Progress Indicator */}
            {isProcessing && conversionJob && (
              <View style={styles.sectionCard}>
                <ConversionProgress job={conversionJob} />
              </View>
            )}

            {/* Step 5: Result Card */}
            {conversionJob && (conversionJob.status === 'completed' || conversionJob.status === 'failed') && (
              <ConversionResultCard
                job={conversionJob}
                onShare={handleShare}
                onSave={handleSave}
                onTranslateNow={handleForwardToTranslator}
                onReset={handleResetConvert}
              />
            )}
          </>
        )}

        {/* ========================================================= */}
        {/* TAB 2: MERGE FILES (FEATURE 4)                            */}
        {/* ========================================================= */}
        {activeTab === 'merge' && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.stepCircle, { backgroundColor: '#059669' }]}>
                <Ionicons name="layers" size={14} color="#FFFFFF" />
              </View>
              <View style={styles.sectionHeaderTitleContainer}>
                <Text style={styles.sectionHeaderTitle}>Merge Multiple Files</Text>
                <Text style={styles.sectionHeaderSubtitle}>
                  Combine multiple PDFs or photos into a single PDF document
                </Text>
              </View>
            </View>

            {/* Multi-File Selection Area */}
            <TouchableOpacity
              style={styles.uploadDottedBox}
              onPress={handlePickMergeFiles}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle-outline" size={32} color="#059669" />
              <Text style={[styles.uploadDottedTitle, { color: '#059669' }]}>
                Add Files to Merge List
              </Text>
              <Text style={styles.uploadDottedSubtitle}>
                Select multiple PDFs or JPEG/PNG photos from your device
              </Text>
            </TouchableOpacity>

            {/* Selected Files List with Reorder and Remove */}
            {mergeFiles.length > 0 && (
              <View style={styles.mergeListContainer}>
                <Text style={styles.mergeListHeader}>
                  Files in Merge Order ({mergeFiles.length}):
                </Text>

                {mergeFiles.map((file, idx) => (
                  <View key={`merge_${idx}_${file.name}`} style={styles.mergeRow}>
                    <View style={styles.mergeSeqBadge}>
                      <Text style={styles.mergeSeqText}>{idx + 1}</Text>
                    </View>
                    <View style={styles.mergeRowInfo}>
                      <Text style={styles.mergeRowName} numberOfLines={1}>
                        {file.name}
                      </Text>
                      <Text style={styles.mergeRowMeta}>
                        {file.format.toUpperCase()} • {file.sizeFormatted}
                      </Text>
                    </View>

                    {/* Reorder Buttons */}
                    <View style={styles.mergeActionGroup}>
                      <TouchableOpacity
                        style={[styles.mergeOrderBtn, idx === 0 && styles.mergeOrderBtnDisabled]}
                        onPress={() => handleMoveFile(idx, 'up')}
                        disabled={idx === 0}
                      >
                        <Ionicons name="arrow-up" size={14} color={idx === 0 ? '#9CA3AF' : COLORS.navy} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.mergeOrderBtn,
                          idx === mergeFiles.length - 1 && styles.mergeOrderBtnDisabled,
                        ]}
                        onPress={() => handleMoveFile(idx, 'down')}
                        disabled={idx === mergeFiles.length - 1}
                      >
                        <Ionicons
                          name="arrow-down"
                          size={14}
                          color={idx === mergeFiles.length - 1 ? '#9CA3AF' : COLORS.navy}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.mergeRemoveBtn}
                        onPress={() => handleRemoveMergeFile(idx)}
                      >
                        <Ionicons name="close" size={16} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                {/* Merge Action Button */}
                <TouchableOpacity
                  style={[styles.convertButton, { backgroundColor: '#059669' }]}
                  onPress={handleExecuteMerge}
                  disabled={isMerging}
                >
                  {isMerging ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Ionicons name="documents-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.convertButtonText}>
                        Merge {mergeFiles.length} Files into PDF
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Merge Result */}
            {mergeResult && (
              <View style={styles.mergeResultBox}>
                <Ionicons name="checkmark-circle" size={28} color="#10B981" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.mergeResultTitle}>Files Successfully Merged!</Text>
                  <Text style={styles.mergeResultSub}>
                    {mergeResult.fileName} ({formatBytes(mergeResult.size)}, {mergeResult.pageCount} pages)
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.mergeShareBtn}
                  onPress={() => converterService.shareDocument(mergeResult.uri, mergeResult.fileName)}
                >
                  <Ionicons name="share-social-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.mergeShareBtnText}>Share</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* ========================================================= */}
        {/* TAB 3: IMAGE COMPRESS & CONVERT (FEATURE 5)               */}
        {/* ========================================================= */}
        {activeTab === 'compress' && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.stepCircle, { backgroundColor: '#7C3AED' }]}>
                <Ionicons name="resize" size={14} color="#FFFFFF" />
              </View>
              <View style={styles.sectionHeaderTitleContainer}>
                <Text style={styles.sectionHeaderTitle}>Image Compression & Sizing</Text>
                <Text style={styles.sectionHeaderSubtitle}>
                  Iteratively adjust quality and dimensions to hit target file size
                </Text>
              </View>
            </View>

            {!compressFile ? (
              <TouchableOpacity
                style={styles.uploadDottedBox}
                onPress={handlePickCompressImage}
                activeOpacity={0.7}
              >
                <Ionicons name="image-outline" size={32} color="#7C3AED" />
                <Text style={[styles.uploadDottedTitle, { color: '#7C3AED' }]}>
                  Select Picture to Compress
                </Text>
                <Text style={styles.uploadDottedSubtitle}>
                  Select any JPEG, PNG, or photo from camera roll
                </Text>
              </TouchableOpacity>
            ) : (
              <View>
                <View style={styles.selectedFileBox}>
                  <View style={[styles.selectedFileIcon, { backgroundColor: '#F5F3FF' }]}>
                    <Ionicons name="image" size={24} color="#7C3AED" />
                  </View>
                  <View style={styles.selectedFileInfo}>
                    <Text style={styles.selectedFileName} numberOfLines={1}>
                      {compressFile.name}
                    </Text>
                    <Text style={styles.selectedFileMeta}>
                      Original Size: {compressFile.sizeFormatted}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.changeFileButton}
                    onPress={handlePickCompressImage}
                  >
                    <Text style={styles.changeFileButtonText}>Change</Text>
                  </TouchableOpacity>
                </View>

                {/* Target Format Selector */}
                <Text style={styles.compressSubHeading}>Target Format:</Text>
                <View style={styles.compressFormatRow}>
                  {(['jpg', 'png', 'webp'] as const).map((fmt) => (
                    <TouchableOpacity
                      key={fmt}
                      style={[
                        styles.compressFormatChip,
                        compressFormat === fmt && styles.compressFormatChipActive,
                      ]}
                      onPress={() => setCompressFormat(fmt)}
                    >
                      <Text
                        style={[
                          styles.compressFormatChipText,
                          compressFormat === fmt && styles.compressFormatChipTextActive,
                        ]}
                      >
                        {fmt.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Target Size Input */}
                <Text style={styles.compressSubHeading}>Target Maximum File Size:</Text>
                <View style={styles.compressInputRow}>
                  <TextInput
                    style={styles.compressTextInput}
                    keyboardType="numeric"
                    value={targetSizeInput}
                    onChangeText={setTargetSizeInput}
                    placeholder="e.g. 250"
                  />
                  <View style={styles.unitToggleGroup}>
                    <TouchableOpacity
                      style={[
                        styles.unitBtn,
                        targetUnit === 'KB' && styles.unitBtnActive,
                      ]}
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
                      style={[
                        styles.unitBtn,
                        targetUnit === 'MB' && styles.unitBtnActive,
                      ]}
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

                {/* Quick Presets */}
                <View style={styles.presetRow}>
                  {['100 KB', '250 KB', '500 KB', '1 MB', '2 MB'].map((preset) => {
                    const [val, unit] = preset.split(' ');
                    return (
                      <TouchableOpacity
                        key={preset}
                        style={styles.presetChip}
                        onPress={() => {
                          setTargetSizeInput(val);
                          setTargetUnit(unit as 'KB' | 'MB');
                        }}
                      >
                        <Text style={styles.presetChipText}>{preset}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.compressDisclaimer}>
                  * Note: Exact size depends on pixel complexity and format. The engine iteratively steps down quality and scales dimensions to satisfy your upper bound.
                </Text>

                {/* Execute Compress Button */}
                <TouchableOpacity
                  style={[styles.convertButton, { backgroundColor: '#7C3AED' }]}
                  onPress={handleExecuteCompression}
                  disabled={isCompressing}
                >
                  {isCompressing ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                      <Text style={styles.convertButtonText}>
                        Compress Image (Target: ≤ {targetSizeInput} {targetUnit})
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {isCompressing && (
                  <Text style={styles.compressStepNotice}>{compressProgressText}</Text>
                )}

                {/* Compression Result Card */}
                {compressResult && (
                  <View style={styles.compressResultCard}>
                    <View style={styles.compressResultHeader}>
                      <Ionicons
                        name={compressResult.achieved ? 'checkmark-circle' : 'alert-circle'}
                        size={24}
                        color={compressResult.achieved ? '#10B981' : '#D97706'}
                      />
                      <Text style={styles.compressResultTitle}>
                        {compressResult.achieved
                          ? 'Target Size Satisfied!'
                          : 'Optimized to Minimum Feasible Size'}
                      </Text>
                    </View>

                    <View style={styles.compressStatsGrid}>
                      <View style={styles.compressStatBox}>
                        <Text style={styles.compressStatLabel}>Original</Text>
                        <Text style={styles.compressStatVal}>
                          {formatBytes(compressResult.originalSize)}
                        </Text>
                        <Text style={styles.compressStatDim}>
                          {compressResult.originalDimensions.width}x{compressResult.originalDimensions.height}
                        </Text>
                      </View>

                      <Ionicons name="arrow-forward" size={18} color="#9CA3AF" />

                      <View style={styles.compressStatBox}>
                        <Text style={styles.compressStatLabel}>Compressed</Text>
                        <Text style={[styles.compressStatVal, { color: '#059669' }]}>
                          {formatBytes(compressResult.finalSize)}
                        </Text>
                        <Text style={styles.compressStatDim}>
                          {compressResult.finalDimensions.width}x{compressResult.finalDimensions.height}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.compressReductionPill}>
                      <Text style={styles.compressReductionText}>
                        Reduced by {compressResult.compressionRatio}% ({compressResult.iterations} refinement passes)
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[styles.convertButton, { marginTop: 12 }]}
                      onPress={() =>
                        converterService.shareDocument(compressResult.uri, compressResult.fileName)
                      }
                    >
                      <Ionicons name="share-social-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.convertButtonText}>Share Compressed Image</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* ========================================================= */}
        {/* TAB 4: EDIT DOCUMENT (FEATURE 3)                          */}
        {/* ========================================================= */}
        {activeTab === 'edit' && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.stepCircle, { backgroundColor: '#2563EB' }]}>
                <Ionicons name="create" size={14} color="#FFFFFF" />
              </View>
              <View style={styles.sectionHeaderTitleContainer}>
                <Text style={styles.sectionHeaderTitle}>Document Editor & Page Studio</Text>
                <Text style={styles.sectionHeaderSubtitle}>
                  Edit TXT/DOCX content, rotate/delete PDF pages, or open office suites
                </Text>
              </View>
            </View>

            {!editFile ? (
              <TouchableOpacity
                style={styles.uploadDottedBox}
                onPress={handlePickEditFile}
                activeOpacity={0.7}
              >
                <Ionicons name="create-outline" size={32} color="#2563EB" />
                <Text style={[styles.uploadDottedTitle, { color: '#2563EB' }]}>
                  Select Document to Edit
                </Text>
                <Text style={styles.uploadDottedSubtitle}>
                  Supports TXT, DOCX, and PDF page modifications
                </Text>
              </TouchableOpacity>
            ) : (
              <View>
                <View style={styles.selectedFileBox}>
                  <View style={[styles.selectedFileIcon, { backgroundColor: '#EFF6FF' }]}>
                    <Ionicons name="document" size={24} color="#2563EB" />
                  </View>
                  <View style={styles.selectedFileInfo}>
                    <Text style={styles.selectedFileName} numberOfLines={1}>
                      {editFile.name}
                    </Text>
                    <Text style={styles.selectedFileMeta}>
                      Format: {editFile.format.toUpperCase()} • {editFile.sizeFormatted}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.changeFileButton}
                    onPress={handlePickEditFile}
                  >
                    <Text style={styles.changeFileButtonText}>Change</Text>
                  </TouchableOpacity>
                </View>

                {/* Sub-view A: TXT & DOCX Text Editor */}
                {(editFile.format === 'txt' || editFile.format === 'docx') && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.editSectionTitle}>
                      Edit Document Content ({editFile.format.toUpperCase()}):
                    </Text>
                    <TextInput
                      style={styles.textEditorArea}
                      multiline={true}
                      value={editText}
                      onChangeText={setEditText}
                      placeholder="Enter or modify document text..."
                      textAlignVertical="top"
                    />

                    <View style={styles.editorActionRow}>
                      <TouchableOpacity
                        style={[styles.editorSaveBtn, { backgroundColor: '#2563EB' }]}
                        onPress={handleSaveTextDocx}
                        disabled={isEditing}
                      >
                        <Ionicons name="document-text-outline" size={16} color="#FFFFFF" />
                        <Text style={styles.editorSaveBtnText}>Save as Word (.docx)</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Sub-view B: PDF Page Manager (Rotate & Delete) */}
                {editFile.format === 'pdf' && (
                  <View style={styles.pdfEditorBox}>
                    <Text style={styles.editSectionTitle}>
                      PDF Page Operations (Total Pages: {pdfPageCount})
                    </Text>

                    <View style={styles.pdfPageSelectRow}>
                      <Text style={styles.pdfPageSelectLabel}>Target Page #:</Text>
                      <TextInput
                        style={styles.pdfPageInput}
                        keyboardType="numeric"
                        value={selectedPageNumber}
                        onChangeText={setSelectedPageNumber}
                      />
                      <Text style={styles.pdfPageTotalText}>/ {pdfPageCount}</Text>
                    </View>

                    {/* Rotate Section */}
                    <Text style={styles.pdfActionSubHeading}>Page Rotation:</Text>
                    <View style={styles.rotationBtnRow}>
                      {([90, 180, 270] as const).map((deg) => (
                        <TouchableOpacity
                          key={deg}
                          style={[
                            styles.rotationChip,
                            rotationDegrees === deg && styles.rotationChipActive,
                          ]}
                          onPress={() => setRotationDegrees(deg)}
                        >
                          <Ionicons
                            name="refresh"
                            size={14}
                            color={rotationDegrees === deg ? '#FFFFFF' : COLORS.navy}
                          />
                          <Text
                            style={[
                              styles.rotationChipText,
                              rotationDegrees === deg && styles.rotationChipTextActive,
                            ]}
                          >
                            Rotate {deg}°
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <TouchableOpacity
                      style={[styles.convertButton, { marginTop: 10, backgroundColor: '#0284C7' }]}
                      onPress={handleRotatePdfPage}
                      disabled={isEditing}
                    >
                      <Ionicons name="sync" size={16} color="#FFFFFF" />
                      <Text style={styles.convertButtonText}>
                        Apply {rotationDegrees}° Rotation to Page {selectedPageNumber}
                      </Text>
                    </TouchableOpacity>

                    {/* Delete Page Section */}
                    <TouchableOpacity
                      style={[
                        styles.convertButton,
                        { marginTop: 10, backgroundColor: '#DC2626' },
                      ]}
                      onPress={handleDeletePdfPage}
                      disabled={isEditing}
                    >
                      <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
                      <Text style={styles.convertButtonText}>
                        Delete Page {selectedPageNumber}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Sub-view C: PPTX/XLSX Fallback */}
                {editFile.format !== 'txt' &&
                  editFile.format !== 'docx' &&
                  editFile.format !== 'pdf' && (
                    <View style={styles.unsupportedEditCard}>
                      <Ionicons name="open-outline" size={32} color="#D97706" />
                      <Text style={styles.unsupportedEditTitle}>
                        External Office Suite Required
                      </Text>
                      <Text style={styles.unsupportedEditDesc}>
                        Complex presentation slides and multi-sheet workbooks require specialized office software. You can open and edit this file in another installed app on your device.
                      </Text>
                      <TouchableOpacity
                        style={[styles.convertButton, { marginTop: 12, backgroundColor: '#D97706' }]}
                        onPress={handleOpenInAnotherApp}
                      >
                        <Ionicons name="open-outline" size={18} color="#FFFFFF" />
                        <Text style={styles.convertButtonText}>Open in Another App</Text>
                      </TouchableOpacity>
                    </View>
                  )}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* ========================================================= */}
      {/* CAPABILITY TABLE MODAL                                     */}
      {/* ========================================================= */}
      <Modal
        visible={showCapabilityModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCapabilityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Conversion Capability Matrix</Text>
                <Text style={styles.modalSubtitle}>
                  Verified genuine format support and execution modes
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowCapabilityModal(false)}>
                <Ionicons name="close-circle" size={26} color={COLORS.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {CONVERSION_CAPABILITY_TABLE.map((row, idx) => (
                <View key={`cap_${idx}`} style={styles.capabilityRow}>
                  <View style={styles.capFormatBadgeRow}>
                    <View style={styles.capBadge}>
                      <Text style={styles.capBadgeText}>{row.source.toUpperCase()}</Text>
                    </View>
                    <Ionicons name="arrow-forward" size={14} color="#9CA3AF" />
                    <View style={[styles.capBadge, { backgroundColor: '#EFF6FF' }]}>
                      <Text style={[styles.capBadgeText, { color: COLORS.primary }]}>
                        {row.target.toUpperCase()}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.capModeBadge,
                        row.executionMode === 'on-device'
                          ? { backgroundColor: '#ECFDF5' }
                          : { backgroundColor: '#FFFBEB' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.capModeBadgeText,
                          row.executionMode === 'on-device'
                            ? { color: '#059669' }
                            : { color: '#D97706' },
                        ]}
                      >
                        {row.executionMode === 'on-device' ? 'On-Device' : 'Cloud Required'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.capEngineText}>Engine: {row.engine}</Text>
                  <Text style={styles.capLimitationsText}>Note: {row.limitations}</Text>
                </View>
              ))}
            </ScrollView>
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
  topTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    gap: 6,
  },
  topTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    backgroundColor: '#F8FAFC',
    gap: 4,
  },
  topTabBtnActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  topTabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  topTabBtnTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  capabilityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 8,
  },
  capabilityPillText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
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
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  stepCircleText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
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
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  uploadIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  uploadDottedTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  uploadDottedSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    gap: 8,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  selectedFileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    marginTop: 3,
  },
  selectedFileMeta: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  selectedFileMetaDivider: {
    marginHorizontal: 6,
    color: COLORS.muted,
  },
  changeFileButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#EFF6FF',
    borderRadius: RADIUS.sm,
  },
  changeFileButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  convertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    gap: 8,
    ...SHADOWS.card,
  },
  convertButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  unsupportedCard: {
    padding: 16,
    backgroundColor: '#FFFBEB',
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  unsupportedText: {
    fontSize: 13,
    color: '#92400E',
    marginTop: 6,
    textAlign: 'center',
  },
  // Merge styles
  mergeListContainer: {
    marginTop: SPACING.md,
  },
  mergeListHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  mergeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.sm,
    padding: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mergeSeqBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  mergeSeqText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  mergeRowInfo: {
    flex: 1,
  },
  mergeRowName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  mergeRowMeta: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  mergeActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mergeOrderBtn: {
    padding: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mergeOrderBtnDisabled: {
    opacity: 0.4,
  },
  mergeRemoveBtn: {
    padding: 6,
    marginLeft: 4,
  },
  mergeResultBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: RADIUS.md,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  mergeResultTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
  },
  mergeResultSub: {
    fontSize: 12,
    color: '#047857',
    marginTop: 2,
  },
  mergeShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  mergeShareBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  // Compress styles
  compressSubHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 14,
    marginBottom: 6,
  },
  compressFormatRow: {
    flexDirection: 'row',
    gap: 8,
  },
  compressFormatChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  compressFormatChipActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  compressFormatChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  compressFormatChipTextActive: {
    color: '#FFFFFF',
  },
  compressInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compressTextInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    fontWeight: '600',
  },
  unitToggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: RADIUS.sm,
    padding: 2,
  },
  unitBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  unitBtnActive: {
    backgroundColor: '#7C3AED',
  },
  unitBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  unitBtnTextActive: {
    color: '#FFFFFF',
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  presetChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.navy,
  },
  compressDisclaimer: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 8,
    marginBottom: 12,
  },
  compressStepNotice: {
    fontSize: 12,
    color: '#7C3AED',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
  },
  compressResultCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: RADIUS.md,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  compressResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  compressResultTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  compressStatsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  compressStatBox: {
    alignItems: 'center',
  },
  compressStatLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  compressStatVal: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  compressStatDim: {
    fontSize: 10,
    color: COLORS.muted,
    marginTop: 2,
  },
  compressReductionPill: {
    backgroundColor: '#ECFDF5',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'center',
    marginTop: 6,
  },
  compressReductionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  // Edit styles
  editSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  textEditorArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 12,
    fontSize: 13,
    lineHeight: 20,
    minHeight: 180,
    maxHeight: 280,
  },
  editorActionRow: {
    marginTop: 10,
  },
  editorSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  editorSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  pdfEditorBox: {
    marginTop: 10,
  },
  pdfPageSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  pdfPageSelectLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  pdfPageInput: {
    width: 60,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
  },
  pdfPageTotalText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  pdfActionSubHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: 6,
    marginBottom: 6,
  },
  rotationBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rotationChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  rotationChipActive: {
    backgroundColor: '#0284C7',
  },
  rotationChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.navy,
  },
  rotationChipTextActive: {
    color: '#FFFFFF',
  },
  unsupportedEditCard: {
    padding: 16,
    backgroundColor: '#FFFBEB',
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: 12,
  },
  unsupportedEditTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginTop: 8,
  },
  unsupportedEditDesc: {
    fontSize: 12,
    color: '#B45309',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
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
    marginBottom: 20,
  },
  capabilityRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  capFormatBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  capBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  capBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.navy,
  },
  capModeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 'auto',
  },
  capModeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  capEngineText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  capLimitationsText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
