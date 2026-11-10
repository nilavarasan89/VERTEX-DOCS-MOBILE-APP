/**
 * Vertex Docs Mobile - PDF to Image Screen
 * Company: JM Vertex Technologies
 * 
 * Hardware-accelerated native PDF page extraction to PNG or JPG images
 * with page range selection, thumbnail previews, custom resolution scales,
 * individual image sharing, and JSZip archive bundle generation.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { HeaderBar } from '../components/common/HeaderBar';
import {
  pdfToImageService,
  PdfInfo,
  PageThumbnailItem,
  ExtractedImageItem,
  PdfToImageResult,
  ImageOutputFormat,
  ImageResolutionScale,
} from '../services/pdfToImageService';
import { formatBytes } from '../constants/formatMatrix';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../constants/theme';
import { ScreenType } from '../types';

interface PdfToImageScreenProps {
  onBack: () => void;
  onNavigateScreen?: (screen: ScreenType) => void;
}

type PageSelectionMode = 'all' | 'first' | 'range' | 'custom';

const SCREEN_WIDTH = Dimensions.get('window').width;

export const PdfToImageScreen: React.FC<PdfToImageScreenProps> = ({
  onBack,
  onNavigateScreen,
}) => {
  const insets = useSafeAreaInsets();

  // Selected PDF state
  const [pdfInfo, setPdfInfo] = useState<PdfInfo | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [thumbnails, setThumbnails] = useState<PageThumbnailItem[]>([]);
  const [isLoadingThumbnails, setIsLoadingThumbnails] = useState(false);

  // Page selection state
  const [selectionMode, setSelectionMode] = useState<PageSelectionMode>('all');
  const [rangeInput, setRangeInput] = useState('');
  const [selectedPageIndices, setSelectedPageIndices] = useState<number[]>([]); // 0-based

  // Output configuration state
  const [outputFormat, setOutputFormat] = useState<ImageOutputFormat>('png');
  const [resolutionScale, setResolutionScale] = useState<ImageResolutionScale>(2.0);
  const [jpgQuality, setJpgQuality] = useState<number>(90);
  const [baseFileName, setBaseFileName] = useState('');

  // Processing state
  const [isConverting, setIsConverting] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [result, setResult] = useState<PdfToImageResult | null>(null);
  const [isZipping, setIsZipping] = useState(false);

  // Full-screen image preview modal
  const [previewImage, setPreviewImage] = useState<ExtractedImageItem | null>(null);

  // Pick PDF file
  const handlePickPdf = async () => {
    try {
      setIsLoadingPdf(true);
      const pickResult = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: true,
      });

      if (pickResult.canceled || !pickResult.assets || pickResult.assets.length === 0) {
        setIsLoadingPdf(false);
        return;
      }

      const asset = pickResult.assets[0];
      const info = await pdfToImageService.getPdfInfo(asset.uri, asset.name);

      setPdfInfo(info);
      setBaseFileName(info.fileName.replace(/\.pdf$/i, ''));
      setResult(null);

      // Default select all pages (0-based)
      const allIndices = Array.from({ length: info.pageCount }, (_, i) => i);
      setSelectedPageIndices(allIndices);
      setSelectionMode('all');

      // Fetch thumbnails in background
      setIsLoadingThumbnails(true);
      try {
        const thumbs = await pdfToImageService.getPageThumbnails(info.fileUri, 240);
        setThumbnails(thumbs);
      } catch (thumbErr) {
        console.warn('Failed to generate thumbnails:', thumbErr);
      } finally {
        setIsLoadingThumbnails(false);
      }
    } catch (err: any) {
      Alert.alert(
        'Unable to Open PDF',
        err?.message || 'The selected file could not be read as a valid PDF.'
      );
    } finally {
      setIsLoadingPdf(false);
    }
  };

  // Helper to parse page range string like "1-3, 5, 7-9" into 0-based indices
  const parsePageRange = (input: string, maxPages: number): number[] => {
    const indices = new Set<number>();
    const parts = input.split(/[,;\s]+/).filter(Boolean);

    for (const part of parts) {
      if (part.includes('-')) {
        const [startStr, endStr] = part.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end)) {
          const from = Math.max(1, Math.min(start, end));
          const to = Math.min(maxPages, Math.max(start, end));
          for (let p = from; p <= to; p++) {
            indices.add(p - 1);
          }
        }
      } else {
        const page = parseInt(part, 10);
        if (!isNaN(page) && page >= 1 && page <= maxPages) {
          indices.add(page - 1);
        }
      }
    }

    return Array.from(indices).sort((a, b) => a - b);
  };

  // Update indices whenever mode or rangeInput changes
  useEffect(() => {
    if (!pdfInfo) return;

    if (selectionMode === 'all') {
      const all = Array.from({ length: pdfInfo.pageCount }, (_, i) => i);
      setSelectedPageIndices(all);
    } else if (selectionMode === 'first') {
      setSelectedPageIndices([0]);
    } else if (selectionMode === 'range') {
      if (rangeInput.trim()) {
        const parsed = parsePageRange(rangeInput, pdfInfo.pageCount);
        setSelectedPageIndices(parsed);
      } else {
        setSelectedPageIndices([0]);
      }
    }
    // 'custom' mode maintains selectedPageIndices directly via thumbnail clicks
  }, [selectionMode, rangeInput, pdfInfo]);

  // Toggle individual page selection
  const togglePageSelection = (pageIndex: number) => {
    setSelectionMode('custom');
    setSelectedPageIndices((prev) => {
      if (prev.includes(pageIndex)) {
        if (prev.length === 1) {
          Alert.alert('Selection Required', 'At least one page must remain selected.');
          return prev;
        }
        return prev.filter((i) => i !== pageIndex);
      } else {
        return [...prev, pageIndex].sort((a, b) => a - b);
      }
    });
  };

  // Execute extraction
  const handleStartConversion = async () => {
    if (!pdfInfo) {
      Alert.alert('No PDF Selected', 'Please choose a PDF document first.');
      return;
    }

    if (selectedPageIndices.length === 0) {
      Alert.alert('No Pages Selected', 'Please select at least one page to extract.');
      return;
    }

    try {
      setIsConverting(true);
      setProgressPercent(10);
      setProgressText('Initializing hardware renderer...');

      const res = await pdfToImageService.renderPdfPages(
        pdfInfo.fileUri,
        selectedPageIndices,
        {
          format: outputFormat,
          quality: jpgQuality,
          scale: resolutionScale,
          baseName: baseFileName.trim() || undefined,
        },
        (progress, text) => {
          setProgressPercent(progress);
          setProgressText(text);
        }
      );

      setResult(res);
      setProgressPercent(100);
      setProgressText('Done!');
    } catch (err: any) {
      Alert.alert(
        'Rendering Failed',
        err?.message || 'An error occurred during PDF page extraction. Please retry.'
      );
    } finally {
      setIsConverting(false);
    }
  };

  // Share ZIP bundle
  const handleShareZip = async () => {
    if (!result || result.images.length === 0) return;

    try {
      setIsZipping(true);
      const zipRes = await pdfToImageService.createZipOfImages(
        result.images,
        `${baseFileName || 'Extracted_Pages'}_Images`
      );
      await pdfToImageService.shareZip(zipRes.uri, zipRes.fileName);
    } catch (err: any) {
      Alert.alert('ZIP Error', err?.message || 'Failed to create ZIP archive.');
    } finally {
      setIsZipping(false);
    }
  };

  // Share single image
  const handleShareSingleImage = async (item: ExtractedImageItem) => {
    try {
      await pdfToImageService.shareImage(item.uri, item.fileName);
    } catch (err: any) {
      Alert.alert('Share Error', err?.message || 'Unable to share image.');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <HeaderBar
        title="PDF to Image"
        subtitle="Extract high-resolution pages as PNG/JPG"
        onBack={onBack}
        rightAction={{
          icon: 'time-outline',
          onPress: () => onNavigateScreen && onNavigateScreen('history'),
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ======================================================== */}
        {/* 1. PDF SOURCE SELECTION                                  */}
        {/* ======================================================== */}
        {!pdfInfo ? (
          <TouchableOpacity
            style={styles.emptyUploadCard}
            onPress={handlePickPdf}
            activeOpacity={0.8}
            disabled={isLoadingPdf}
          >
            {isLoadingPdf ? (
              <View style={styles.emptyInner}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.emptyLoadingText}>Reading PDF document...</Text>
              </View>
            ) : (
              <View style={styles.emptyInner}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="document-text" size={36} color="#DC2626" />
                </View>
                <Text style={styles.emptyTitle}>Select PDF Document</Text>
                <Text style={styles.emptySubtitle}>
                  Choose a PDF file from your device to extract individual pages into sharp images
                </Text>

                <View style={styles.selectBtn}>
                  <Ionicons name="folder-open-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.selectBtnText}>Browse Files</Text>
                </View>

                <View style={styles.featurePillsRow}>
                  <View style={styles.featurePill}>
                    <Ionicons name="checkmark-circle" size={12} color={COLORS.success} />
                    <Text style={styles.featurePillText}>Lossless PNG & JPG</Text>
                  </View>
                  <View style={styles.featurePill}>
                    <Ionicons name="checkmark-circle" size={12} color={COLORS.success} />
                    <Text style={styles.featurePillText}>1x / 2x / 3x Scales</Text>
                  </View>
                  <View style={styles.featurePill}>
                    <Ionicons name="checkmark-circle" size={12} color={COLORS.success} />
                    <Text style={styles.featurePillText}>ZIP Export</Text>
                  </View>
                </View>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.loadedDocCard}>
            <View style={styles.loadedDocHeader}>
              <View style={styles.docIconWrap}>
                <Ionicons name="document-text" size={24} color="#DC2626" />
                <Text style={styles.docExtLabel}>PDF</Text>
              </View>

              <View style={styles.docMetaWrap}>
                <Text style={styles.docTitle} numberOfLines={1}>
                  {pdfInfo.fileName}
                </Text>
                <Text style={styles.docDetails}>
                  {formatBytes(pdfInfo.fileSize)} • {pdfInfo.pageCount} {pdfInfo.pageCount === 1 ? 'Page' : 'Pages'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.changeDocBtn}
                onPress={handlePickPdf}
                activeOpacity={0.7}
              >
                <Ionicons name="swap-horizontal" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
                <Text style={styles.changeDocText}>Change</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ======================================================== */}
        {/* 2. PAGE SELECTION OPTIONS                                */}
        {/* ======================================================== */}
        {pdfInfo && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="layers-outline" size={18} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Select Pages to Convert</Text>
              </View>
              <View style={styles.pageCountBadge}>
                <Text style={styles.pageCountBadgeText}>
                  {selectedPageIndices.length} of {pdfInfo.pageCount} selected
                </Text>
              </View>
            </View>

            {/* Selection Mode Chips */}
            <View style={styles.modeChipsRow}>
              <TouchableOpacity
                style={[styles.modeChip, selectionMode === 'all' && styles.modeChipActive]}
                onPress={() => setSelectionMode('all')}
                activeOpacity={0.7}
              >
                <Text style={[styles.modeChipText, selectionMode === 'all' && styles.modeChipTextActive]}>
                  All Pages ({pdfInfo.pageCount})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeChip, selectionMode === 'first' && styles.modeChipActive]}
                onPress={() => setSelectionMode('first')}
                activeOpacity={0.7}
              >
                <Text style={[styles.modeChipText, selectionMode === 'first' && styles.modeChipTextActive]}>
                  Page 1 Only
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeChip, selectionMode === 'range' && styles.modeChipActive]}
                onPress={() => setSelectionMode('range')}
                activeOpacity={0.7}
              >
                <Text style={[styles.modeChipText, selectionMode === 'range' && styles.modeChipTextActive]}>
                  Custom Range
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeChip, selectionMode === 'custom' && styles.modeChipActive]}
                onPress={() => setSelectionMode('custom')}
                activeOpacity={0.7}
              >
                <Text style={[styles.modeChipText, selectionMode === 'custom' && styles.modeChipTextActive]}>
                  Pick Pages
                </Text>
              </TouchableOpacity>
            </View>

            {/* Custom Range Text Input */}
            {selectionMode === 'range' && (
              <View style={styles.rangeInputBox}>
                <Text style={styles.rangeInputLabel}>Enter page range (e.g. 1-3, 5, 8-10):</Text>
                <TextInput
                  style={styles.rangeTextInput}
                  placeholder={`1-${Math.min(pdfInfo.pageCount, 5)}`}
                  placeholderTextColor={COLORS.muted}
                  value={rangeInput}
                  onChangeText={setRangeInput}
                  keyboardType="numbers-and-punctuation"
                  autoCapitalize="none"
                />
              </View>
            )}

            {/* Visual Thumbnail Grid */}
            <View style={styles.thumbnailSection}>
              <View style={styles.thumbnailHeaderRow}>
                <Text style={styles.thumbnailSubheading}>
                  {selectionMode === 'custom'
                    ? 'Tap page thumbnails to include / exclude:'
                    : 'Page Previews:'}
                </Text>
                {isLoadingThumbnails && (
                  <View style={styles.thumbnailLoadingRow}>
                    <ActivityIndicator size="small" color={COLORS.primary} style={{ marginRight: 4 }} />
                    <Text style={styles.thumbnailLoadingText}>Rendering previews...</Text>
                  </View>
                )}
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.thumbnailScrollContent}
              >
                {Array.from({ length: pdfInfo.pageCount }).map((_, index) => {
                  const isSelected = selectedPageIndices.includes(index);
                  const thumb = thumbnails.find((t) => t.pageIndex === index);

                  return (
                    <TouchableOpacity
                      key={`page_${index}`}
                      style={[
                        styles.thumbnailItemCard,
                        isSelected && styles.thumbnailItemCardSelected,
                      ]}
                      onPress={() => togglePageSelection(index)}
                      activeOpacity={0.75}
                    >
                      {thumb?.uri ? (
                        <Image
                          source={{ uri: thumb.uri }}
                          style={styles.thumbnailImage}
                          resizeMode="contain"
                        />
                      ) : (
                        <View style={styles.thumbnailPlaceholder}>
                          <Ionicons name="document-outline" size={26} color={COLORS.muted} />
                          <Text style={styles.thumbnailPageText}>Page {index + 1}</Text>
                        </View>
                      )}

                      {/* Page number badge */}
                      <View style={[styles.pageBadge, isSelected && styles.pageBadgeSelected]}>
                        <Text style={[styles.pageBadgeText, isSelected && styles.pageBadgeTextSelected]}>
                          P{index + 1}
                        </Text>
                      </View>

                      {/* Selection Checkmark */}
                      <View style={[styles.selectionCheck, isSelected && styles.selectionCheckActive]}>
                        {isSelected && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        )}

        {/* ======================================================== */}
        {/* 3. OUTPUT SETTINGS                                       */}
        {/* ======================================================== */}
        {pdfInfo && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="settings-outline" size={18} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Image Output Settings</Text>
            </View>

            {/* Output Format */}
            <Text style={styles.optionGroupLabel}>Image Format</Text>
            <View style={styles.formatToggleRow}>
              <TouchableOpacity
                style={[styles.formatToggleBtn, outputFormat === 'png' && styles.formatToggleBtnActive]}
                onPress={() => setOutputFormat('png')}
                activeOpacity={0.7}
              >
                <View style={styles.formatToggleTextRow}>
                  <Text style={[styles.formatToggleTitle, outputFormat === 'png' && styles.formatToggleTitleActive]}>
                    PNG
                  </Text>
                  <View style={[styles.qualityPill, outputFormat === 'png' && styles.qualityPillActive]}>
                    <Text style={[styles.qualityPillText, outputFormat === 'png' && styles.qualityPillTextActive]}>
                      Lossless
                    </Text>
                  </View>
                </View>
                <Text style={styles.formatToggleDesc}>Crisp text, diagrams & vector clarity</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.formatToggleBtn, outputFormat === 'jpg' && styles.formatToggleBtnActive]}
                onPress={() => setOutputFormat('jpg')}
                activeOpacity={0.7}
              >
                <View style={styles.formatToggleTextRow}>
                  <Text style={[styles.formatToggleTitle, outputFormat === 'jpg' && styles.formatToggleTitleActive]}>
                    JPG
                  </Text>
                  <View style={[styles.qualityPill, outputFormat === 'jpg' && styles.qualityPillActive]}>
                    <Text style={[styles.qualityPillText, outputFormat === 'jpg' && styles.qualityPillTextActive]}>
                      Compact
                    </Text>
                  </View>
                </View>
                <Text style={styles.formatToggleDesc}>Smaller file size, photo-friendly</Text>
              </TouchableOpacity>
            </View>

            {/* Resolution Scale */}
            <Text style={styles.optionGroupLabel}>Resolution / Scale</Text>
            <View style={styles.scaleGrid}>
              <TouchableOpacity
                style={[styles.scaleCard, resolutionScale === 1.0 && styles.scaleCardActive]}
                onPress={() => setResolutionScale(1.0)}
                activeOpacity={0.7}
              >
                <Text style={[styles.scaleTitle, resolutionScale === 1.0 && styles.scaleTitleActive]}>
                  Standard (1x)
                </Text>
                <Text style={styles.scaleDesc}>72-150 DPI • Quick</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.scaleCard, resolutionScale === 2.0 && styles.scaleCardActive]}
                onPress={() => setResolutionScale(2.0)}
                activeOpacity={0.7}
              >
                <View style={styles.recBadge}>
                  <Text style={styles.recBadgeText}>Best</Text>
                </View>
                <Text style={[styles.scaleTitle, resolutionScale === 2.0 && styles.scaleTitleActive]}>
                  High (2x)
                </Text>
                <Text style={styles.scaleDesc}>300 DPI • Crisp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.scaleCard, resolutionScale === 3.0 && styles.scaleCardActive]}
                onPress={() => setResolutionScale(3.0)}
                activeOpacity={0.7}
              >
                <Text style={[styles.scaleTitle, resolutionScale === 3.0 && styles.scaleTitleActive]}>
                  Ultra (3x)
                </Text>
                <Text style={styles.scaleDesc}>450 DPI • Print</Text>
              </TouchableOpacity>
            </View>

            {/* JPG Quality (Only for JPG) */}
            {outputFormat === 'jpg' && (
              <View style={styles.jpgQualitySection}>
                <Text style={styles.optionGroupLabel}>JPEG Compression Quality</Text>
                <View style={styles.qualityRow}>
                  {[75, 85, 95, 100].map((q) => (
                    <TouchableOpacity
                      key={q}
                      style={[styles.qualityChip, jpgQuality === q && styles.qualityChipActive]}
                      onPress={() => setJpgQuality(q)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.qualityChipText, jpgQuality === q && styles.qualityChipTextActive]}>
                        {q}%
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Custom Output Base Name */}
            <Text style={styles.optionGroupLabel}>Output Base File Name</Text>
            <View style={styles.fileNameInputWrap}>
              <Ionicons name="document-text-outline" size={16} color={COLORS.muted} style={{ marginRight: 6 }} />
              <TextInput
                style={styles.fileNameInput}
                placeholder="Document base name"
                placeholderTextColor={COLORS.muted}
                value={baseFileName}
                onChangeText={setBaseFileName}
                autoCapitalize="none"
              />
              <Text style={styles.fileNameSuffix}>_page_X.{outputFormat}</Text>
            </View>
          </View>
        )}

        {/* ======================================================== */}
        {/* 4. CONVERT BUTTON & PROGRESS                             */}
        {/* ======================================================== */}
        {pdfInfo && !result && (
          <View style={styles.actionSection}>
            {isConverting ? (
              <View style={styles.progressCard}>
                <View style={styles.progressHeader}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={styles.progressStatusText}>{progressText}</Text>
                  <Text style={styles.progressPercentText}>{progressPercent}%</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.convertBtn,
                  selectedPageIndices.length === 0 && styles.convertBtnDisabled,
                ]}
                onPress={handleStartConversion}
                activeOpacity={0.8}
                disabled={selectedPageIndices.length === 0}
              >
                <Ionicons name="images" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.convertBtnText}>
                  Extract {selectedPageIndices.length} {selectedPageIndices.length === 1 ? 'Page' : 'Pages'} to {outputFormat.toUpperCase()}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ======================================================== */}
        {/* 5. EXTRACTION RESULTS & GALLERY                          */}
        {/* ======================================================== */}
        {result && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeaderRow}>
              <View style={styles.successIconBox}>
                <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.resultHeading}>Extraction Complete!</Text>
                <Text style={styles.resultSubtext}>
                  {result.images.length} pages rendered to high-resolution {outputFormat.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Results Metrics */}
            <View style={styles.resultMetricsRow}>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{result.images.length}</Text>
                <Text style={styles.metricLabel}>Images</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{formatBytes(result.totalSize)}</Text>
                <Text style={styles.metricLabel}>Total Size</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{resolutionScale}x</Text>
                <Text style={styles.metricLabel}>Resolution</Text>
              </View>
            </View>

            {/* Primary Action Buttons: Share ZIP & Share All */}
            <View style={styles.resultActionsRow}>
              <TouchableOpacity
                style={styles.zipActionBtn}
                onPress={handleShareZip}
                activeOpacity={0.8}
                disabled={isZipping}
              >
                {isZipping ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="archive-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.zipActionBtnText}>Share All as ZIP</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.newConvertBtn}
                onPress={() => {
                  setResult(null);
                  setPdfInfo(null);
                  setThumbnails([]);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh-outline" size={16} color={COLORS.navy} style={{ marginRight: 4 }} />
                <Text style={styles.newConvertBtnText}>New PDF</Text>
              </TouchableOpacity>
            </View>

            {/* Extracted Images Gallery Grid */}
            <Text style={styles.galleryHeading}>Extracted Page Gallery</Text>
            <View style={styles.galleryGrid}>
              {result.images.map((item) => (
                <View key={item.uri} style={styles.galleryCard}>
                  <TouchableOpacity
                    style={styles.galleryImageContainer}
                    onPress={() => setPreviewImage(item)}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={{ uri: item.uri }}
                      style={styles.galleryImage}
                      resizeMode="cover"
                    />
                    <View style={styles.galleryPageBadge}>
                      <Text style={styles.galleryPageBadgeText}>P{item.pageNumber}</Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.galleryCardFooter}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.galleryCardDim}>
                        {item.width} × {item.height}
                      </Text>
                      <Text style={styles.galleryCardSize}>
                        {formatBytes(item.size)}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.galleryShareBtn}
                      onPress={() => handleShareSingleImage(item)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="share-social-outline" size={16} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ======================================================== */}
      {/* 6. FULLSCREEN PREVIEW MODAL                              */}
      {/* ======================================================== */}
      <Modal
        visible={previewImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPreviewImage(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>
                Page {previewImage?.pageNumber} Preview
              </Text>
              <Text style={styles.modalSubtitle}>
                {previewImage ? `${previewImage.width}×${previewImage.height} • ${formatBytes(previewImage.size)}` : ''}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setPreviewImage(null)}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {previewImage && (
            <View style={styles.modalImageContainer}>
              <Image
                source={{ uri: previewImage.uri }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            </View>
          )}

          {previewImage && (
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalShareBtn}
                onPress={() => {
                  handleShareSingleImage(previewImage);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="share-social" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.modalShareText}>Share Image</Text>
              </TouchableOpacity>
            </View>
          )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },

  // Empty Upload Zone
  emptyUploadCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: '#D9E2EF',
    borderStyle: 'dashed',
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.subtle,
  },
  emptyInner: {
    alignItems: 'center',
    width: '100%',
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  emptyLoadingText: {
    marginTop: 12,
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '600',
  },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
    ...SHADOWS.subtle,
  },
  selectBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  featurePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  featurePillText: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },

  // Loaded Document Banner
  loadedDocCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.subtle,
  },
  loadedDocHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  docIconWrap: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  docExtLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
    marginTop: -2,
  },
  docMetaWrap: {
    flex: 1,
    marginLeft: SPACING.md,
    marginRight: SPACING.sm,
  },
  docTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  docDetails: {
    fontSize: 13.5,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  changeDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
  },
  changeDocText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Sections
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.subtle,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  pageCountBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  pageCountBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // Mode Chips
  modeChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.md,
  },
  modeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modeChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: COLORS.primary,
  },
  modeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  modeChipTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },

  // Range input
  rangeInputBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rangeInputLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  rangeTextInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.textPrimary,
  },

  // Thumbnails
  thumbnailSection: {
    marginTop: 4,
  },
  thumbnailHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  thumbnailSubheading: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  thumbnailLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnailLoadingText: {
    fontSize: 11,
    color: COLORS.primary,
  },
  thumbnailScrollContent: {
    gap: 10,
    paddingVertical: 4,
  },
  thumbnailItemCard: {
    width: 90,
    height: 125,
    borderRadius: RADIUS.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnailItemCardSelected: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  thumbnailPageText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  pageBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  pageBadgeSelected: {
    backgroundColor: COLORS.primary,
  },
  pageBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pageBadgeTextSelected: {
    color: '#FFFFFF',
  },
  selectionCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionCheckActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  // Output format toggle
  optionGroupLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    marginTop: 8,
  },
  formatToggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: SPACING.md,
  },
  formatToggleBtn: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  formatToggleBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: COLORS.primary,
  },
  formatToggleTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  formatToggleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  formatToggleTitleActive: {
    color: COLORS.primary,
  },
  qualityPill: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  qualityPillActive: {
    backgroundColor: '#DBEAFE',
  },
  qualityPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  qualityPillTextActive: {
    color: COLORS.primary,
  },
  formatToggleDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },

  // Resolution scale
  scaleGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.md,
  },
  scaleCard: {
    flex: 1,
    padding: 10,
    borderRadius: RADIUS.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  scaleCardActive: {
    backgroundColor: '#EFF6FF',
    borderColor: COLORS.primary,
  },
  scaleTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  scaleTitleActive: {
    color: COLORS.primary,
  },
  scaleDesc: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  recBadge: {
    position: 'absolute',
    top: -8,
    right: 6,
    backgroundColor: COLORS.teal,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: RADIUS.full,
  },
  recBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },

  // JPG Quality
  jpgQualitySection: {
    marginBottom: SPACING.md,
  },
  qualityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  qualityChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  qualityChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  qualityChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  qualityChipTextActive: {
    color: '#FFFFFF',
  },

  // File Name
  fileNameInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  fileNameInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  fileNameSuffix: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '600',
  },

  // Actions
  actionSection: {
    marginBottom: SPACING.lg,
  },
  convertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    ...SHADOWS.subtle,
  },
  convertBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  convertBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressStatusText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  progressPercentText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },

  // Result Card
  resultCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    ...SHADOWS.subtle,
  },
  resultHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  successIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultHeading: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  resultSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  resultMetricsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  metricLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
  },
  resultActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: SPACING.lg,
  },
  zipActionBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  zipActionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  newConvertBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  newConvertBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.navy,
  },
  galleryHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  galleryCard: {
    width: (SCREEN_WIDTH - SPACING.lg * 2 - SPACING.lg * 2 - 10) / 2,
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  galleryImageContainer: {
    height: 150,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  galleryPageBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  galleryPageBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  galleryCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  galleryCardDim: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  galleryCardSize: {
    fontSize: 9,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  galleryShareBtn: {
    padding: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: RADIUS.sm,
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'space-between',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalFooter: {
    padding: 20,
    paddingBottom: 40,
  },
  modalShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
  },
  modalShareText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
