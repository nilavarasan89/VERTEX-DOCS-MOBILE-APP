/**
 * Vertex Docs Mobile - Image to PDF Screen
 * Company: JM Vertex Technologies
 * 
 * High-fidelity conversion of one or multiple images into a customized PDF
 * with customizable page sizes, orientation, margins, image placement,
 * reordering, preview, and sharing.
 */

import React, { useState } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { HeaderBar } from '../components/common/HeaderBar';
import {
  imageToPdfService,
  SelectedImageItem,
  ImageToPdfOptions,
  ImageToPdfResult,
  PdfPageSize,
  PdfOrientation,
  ImagePlacement,
  PdfMargin,
  ImageQuality,
} from '../services/imageToPdfService';
import { formatBytes } from '../constants/formatMatrix';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../constants/theme';
import { ScreenType } from '../types';

interface ImageToPdfScreenProps {
  onBack: () => void;
  onNavigateScreen?: (screen: ScreenType) => void;
}

export const ImageToPdfScreen: React.FC<ImageToPdfScreenProps> = ({
  onBack,
  onNavigateScreen,
}) => {
  const insets = useSafeAreaInsets();

  // State
  const [images, setImages] = useState<SelectedImageItem[]>([]);
  const [pageSize, setPageSize] = useState<PdfPageSize>('a4');
  const [orientation, setOrientation] = useState<PdfOrientation>('portrait');
  const [placement, setPlacement] = useState<ImagePlacement>('fit');
  const [margin, setMargin] = useState<PdfMargin>('none');
  const [quality, setQuality] = useState<ImageQuality>('high');
  const [customFileName, setCustomFileName] = useState('');

  // Conversion Status
  const [isConverting, setIsConverting] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [result, setResult] = useState<ImageToPdfResult | null>(null);

  // Rename modal
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameInput, setRenameInput] = useState('');

  // Pick one or multiple images
  const handlePickImages = async () => {
    try {
      const pickResult = await DocumentPicker.getDocumentAsync({
        type: ['image/jpeg', 'image/png', 'image/webp', 'image/*'],
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (pickResult.canceled || !pickResult.assets || pickResult.assets.length === 0) {
        return;
      }

      const newItems: SelectedImageItem[] = pickResult.assets.map((asset, index) => {
        const size = asset.size || 1024 * 100;
        return {
          id: `img_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`,
          uri: asset.uri,
          name: asset.name,
          size,
        };
      });

      setImages((prev) => [...prev, ...newItems]);
      setResult(null);
    } catch (err: any) {
      Alert.alert('Image Picker Error', err?.message || 'Unable to open file picker.');
    }
  };

  // Reorder controls
  const handleMoveImage = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= images.length) return;
    const updated = [...images];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setImages(updated);
  };

  // Remove single image
  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Clear all images
  const handleClearAll = () => {
    setImages([]);
    setResult(null);
  };

  // Convert to PDF
  const handleStartConversion = async () => {
    if (images.length === 0) {
      Alert.alert('No Images', 'Please select at least one image to convert.');
      return;
    }

    setIsConverting(true);
    setProgressPercent(10);
    setProgressText('Preparing images for PDF packaging...');
    setResult(null);

    const options: ImageToPdfOptions = {
      pageSize,
      orientation,
      placement,
      margin,
      quality,
      customFileName: customFileName.trim() || undefined,
    };

    try {
      const conversionResult = await imageToPdfService.convertImagesToPdf(
        images,
        options,
        (pct, text) => {
          setProgressPercent(pct);
          setProgressText(text);
        }
      );
      setResult(conversionResult);
    } catch (err: any) {
      Alert.alert('Conversion Failed', err?.message || 'Could not create PDF from images.');
    } finally {
      setIsConverting(false);
    }
  };

  // Share
  const handleShareResult = async () => {
    if (!result) return;
    const ok = await imageToPdfService.sharePdf(result.uri, result.fileName);
    if (!ok) {
      Alert.alert('Sharing Unavailable', 'Share dialog could not be opened on this platform.');
    }
  };

  // Rename generated PDF
  const handleConfirmRename = async () => {
    if (!result || !renameInput.trim()) {
      setShowRenameModal(false);
      return;
    }

    const cleanName = renameInput.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const newFileName = cleanName.endsWith('.pdf') ? cleanName : `${cleanName}.pdf`;

    const dir = result.uri.substring(0, result.uri.lastIndexOf('/') + 1);
    const newUri = `${dir}${newFileName}`;

    try {
      await FileSystem.moveAsync({
        from: result.uri,
        to: newUri,
      });

      setResult({
        ...result,
        uri: newUri,
        fileName: newFileName,
      });
      setShowRenameModal(false);
      Alert.alert('File Renamed', `Document renamed to "${newFileName}".`);
    } catch (err: any) {
      Alert.alert('Rename Error', err?.message || 'Could not rename file.');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <HeaderBar
        title="Image to PDF"
        subtitle="Combine & Format Photos into PDF"
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
        {/* Step 1: Image Selection Area */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>1</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Select Images</Text>
              <Text style={styles.cardSubtitle}>
                Choose JPG, PNG, or WebP photos from your device
              </Text>
            </View>

            {images.length > 0 && (
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={handleClearAll}
              >
                <Text style={styles.clearBtnText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>

          {images.length === 0 ? (
            <TouchableOpacity
              style={styles.uploadDottedBox}
              onPress={handlePickImages}
              activeOpacity={0.7}
            >
              <View style={styles.uploadIconContainer}>
                <Ionicons name="images" size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.uploadDottedTitle}>Select Photos from Device</Text>
              <Text style={styles.uploadDottedSubtitle}>
                Tap to pick one or multiple photos to convert into PDF pages
              </Text>
              <View style={styles.browseButton}>
                <Ionicons name="add" size={18} color="#FFFFFF" />
                <Text style={styles.browseButtonText}>Select Images</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View>
              {/* Image List with Reorder Controls */}
              <View style={styles.imagesListHeader}>
                <Text style={styles.imagesCountText}>
                  {images.length} {images.length === 1 ? 'Image' : 'Images'} Selected (Order = PDF Page Sequence):
                </Text>
                <TouchableOpacity
                  style={styles.addMoreBtn}
                  onPress={handlePickImages}
                >
                  <Ionicons name="add-circle" size={16} color={COLORS.primary} />
                  <Text style={styles.addMoreBtnText}>Add More</Text>
                </TouchableOpacity>
              </View>

              {images.map((item, index) => (
                <View key={item.id} style={styles.imageItemRow}>
                  <View style={styles.pageBadge}>
                    <Text style={styles.pageBadgeText}>{index + 1}</Text>
                  </View>

                  <Image source={{ uri: item.uri }} style={styles.imageThumb} resizeMode="cover" />

                  <View style={styles.imageDetails}>
                    <Text style={styles.imageName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.imageMeta}>
                      Page {index + 1} of {images.length} • {formatBytes(item.size || 0)}
                    </Text>
                  </View>

                  {/* Reorder Buttons */}
                  <View style={styles.reorderGroup}>
                    <TouchableOpacity
                      style={[styles.reorderBtn, index === 0 && styles.reorderBtnDisabled]}
                      onPress={() => handleMoveImage(index, 'up')}
                      disabled={index === 0}
                    >
                      <Ionicons
                        name="arrow-up"
                        size={14}
                        color={index === 0 ? '#9CA3AF' : COLORS.navy}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.reorderBtn, index === images.length - 1 && styles.reorderBtnDisabled]}
                      onPress={() => handleMoveImage(index, 'down')}
                      disabled={index === images.length - 1}
                    >
                      <Ionicons
                        name="arrow-down"
                        size={14}
                        color={index === images.length - 1 ? '#9CA3AF' : COLORS.navy}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => handleRemoveImage(index)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Step 2: PDF Page Customization (Visible when images selected) */}
        {images.length > 0 && !result && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.stepBadge, { backgroundColor: '#7C3AED' }]}>
                <Text style={styles.stepBadgeText}>2</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>PDF Page Customization</Text>
                <Text style={styles.cardSubtitle}>
                  Page sizes, margins, orientation, and layout fit
                </Text>
              </View>
            </View>

            {/* Page Size Option */}
            <Text style={styles.optionLabel}>Page Size:</Text>
            <View style={styles.optionRow}>
              {(
                [
                  { key: 'a4', label: 'A4' },
                  { key: 'letter', label: 'Letter' },
                  { key: 'legal', label: 'Legal' },
                  { key: 'original', label: 'Original' },
                ] as const
              ).map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.optionChip,
                    pageSize === opt.key && styles.optionChipActive,
                  ]}
                  onPress={() => setPageSize(opt.key)}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      pageSize === opt.key && styles.optionChipTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Orientation Option (Only if not original) */}
            {pageSize !== 'original' && (
              <>
                <Text style={styles.optionLabel}>Page Orientation:</Text>
                <View style={styles.optionRow}>
                  {(
                    [
                      { key: 'portrait', label: 'Portrait' },
                      { key: 'landscape', label: 'Landscape' },
                    ] as const
                  ).map((opt) => (
                    <TouchableOpacity
                      key={opt.key}
                      style={[
                        styles.optionChip,
                        orientation === opt.key && styles.optionChipActive,
                      ]}
                      onPress={() => setOrientation(opt.key)}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          orientation === opt.key && styles.optionChipTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Image Placement Option */}
            <Text style={styles.optionLabel}>Image Placement on Page:</Text>
            <View style={styles.optionRow}>
              {(
                [
                  { key: 'fit', label: 'Fit to Page' },
                  { key: 'fill', label: 'Fill Page' },
                  { key: 'original', label: 'Original Scale' },
                ] as const
              ).map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.optionChip,
                    placement === opt.key && styles.optionChipActive,
                  ]}
                  onPress={() => setPlacement(opt.key)}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      placement === opt.key && styles.optionChipTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Margins Option */}
            {pageSize !== 'original' && (
              <>
                <Text style={styles.optionLabel}>Page Margins:</Text>
                <View style={styles.optionRow}>
                  {(
                    [
                      { key: 'none', label: 'None (0)' },
                      { key: 'small', label: 'Small' },
                      { key: 'medium', label: 'Medium' },
                      { key: 'large', label: 'Large' },
                    ] as const
                  ).map((opt) => (
                    <TouchableOpacity
                      key={opt.key}
                      style={[
                        styles.optionChip,
                        margin === opt.key && styles.optionChipActive,
                      ]}
                      onPress={() => setMargin(opt.key)}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          margin === opt.key && styles.optionChipTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Quality Setting */}
            <Text style={styles.optionLabel}>Image Quality & Optimization:</Text>
            <View style={styles.optionRow}>
              {(
                [
                  { key: 'high', label: 'High (100%)' },
                  { key: 'medium', label: 'Balanced (75%)' },
                  { key: 'compact', label: 'Compact (50%)' },
                ] as const
              ).map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.optionChip,
                    quality === opt.key && styles.optionChipActive,
                  ]}
                  onPress={() => setQuality(opt.key)}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      quality === opt.key && styles.optionChipTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* File Name */}
            <Text style={styles.optionLabel}>Custom Output File Name (Optional):</Text>
            <TextInput
              style={styles.fileNameInput}
              value={customFileName}
              onChangeText={setCustomFileName}
              placeholder="e.g. My_Photo_Document"
              placeholderTextColor={COLORS.muted}
            />
          </View>
        )}

        {/* Convert Action Button */}
        {images.length > 0 && !isConverting && !result && (
          <TouchableOpacity
            style={styles.convertButton}
            onPress={handleStartConversion}
            activeOpacity={0.8}
          >
            <Ionicons name="document-text" size={20} color="#FFFFFF" />
            <Text style={styles.convertButtonText}>
              Convert {images.length} {images.length === 1 ? 'Image' : 'Images'} to PDF
            </Text>
          </TouchableOpacity>
        )}

        {/* Conversion Progress Card */}
        {isConverting && (
          <View style={styles.card}>
            <View style={styles.progressHeader}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.progressTitle}>Generating PDF Document</Text>
              <Text style={styles.progressPercent}>{progressPercent}%</Text>
            </View>

            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(100, Math.max(10, progressPercent))}%` },
                ]}
              />
            </View>

            <Text style={styles.progressStepText}>{progressText}</Text>
          </View>
        )}

        {/* Result Card */}
        {result && (
          <View style={[styles.card, styles.resultCard]}>
            <View style={styles.resultHeader}>
              <View style={styles.resultIconBox}>
                <Ionicons name="checkmark-circle" size={32} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.resultTitle}>PDF Successfully Created!</Text>
                <Text style={styles.resultSubtitle}>
                  Ready to preview, share, or store on device
                </Text>
              </View>
            </View>

            {/* Result Stats Box */}
            <View style={styles.resultStatsBox}>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Document Name</Text>
                <Text style={styles.statVal} numberOfLines={1}>
                  {result.fileName}
                </Text>
              </View>
              <View style={styles.statDividerVertical} />
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Pages</Text>
                <Text style={styles.statVal}>{result.pageCount}</Text>
              </View>
              <View style={styles.statDividerVertical} />
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>File Size</Text>
                <Text style={styles.statVal}>{formatBytes(result.size)}</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.resultActionsRow}>
              <TouchableOpacity
                style={styles.actionBtnPrimary}
                onPress={handleShareResult}
              >
                <Ionicons name="share-social-outline" size={18} color="#FFFFFF" />
                <Text style={styles.actionBtnPrimaryText}>Share PDF</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtnSecondary}
                onPress={() => {
                  setRenameInput(result.fileName.replace(/\.pdf$/i, ''));
                  setShowRenameModal(true);
                }}
              >
                <Ionicons name="create-outline" size={18} color={COLORS.primary} />
                <Text style={styles.actionBtnSecondaryText}>Rename</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.convertAnotherBtn}
              onPress={() => {
                setImages([]);
                setResult(null);
                setCustomFileName('');
              }}
            >
              <Ionicons name="refresh" size={16} color={COLORS.primary} />
              <Text style={styles.convertAnotherBtnText}>Convert More Images</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Rename Modal */}
      <Modal
        visible={showRenameModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRenameModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.renameModalBox}>
            <Text style={styles.renameModalTitle}>Rename PDF Document</Text>
            <TextInput
              style={styles.renameInput}
              value={renameInput}
              onChangeText={setRenameInput}
              placeholder="Enter file name"
              autoFocus={true}
            />
            <View style={styles.renameModalBtns}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowRenameModal(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleConfirmRename}
              >
                <Text style={styles.modalSaveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.subtle,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  stepBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 16.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  cardSubtitle: {
    fontSize: 13.5,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  clearBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearBtnText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '600',
  },
  uploadDottedBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    marginTop: 8,
  },
  uploadIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  uploadDottedTitle: {
    fontSize: 16.5,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  uploadDottedSubtitle: {
    fontSize: 13.5,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    gap: 8,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  imagesListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  imagesCountText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addMoreBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.primary,
  },
  imageItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pageBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.navy,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  pageBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  imageThumb: {
    width: 52,
    height: 52,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
    marginRight: 10,
  },
  imageDetails: {
    flex: 1,
  },
  imageName: {
    fontSize: 14.5,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  imageMeta: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  reorderGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reorderBtn: {
    padding: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reorderBtnDisabled: {
    opacity: 0.3,
  },
  removeBtn: {
    padding: 6,
    marginLeft: 2,
  },
  optionLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 10,
    marginBottom: 6,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  optionChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  fileNameInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14.5,
    color: COLORS.textPrimary,
  },
  convertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    gap: 8,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  convertButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
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
    color: COLORS.primary,
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
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressStepText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  resultCard: {
    borderColor: '#A7F3D0',
    backgroundColor: '#F0FDF4',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  resultIconBox: {
    marginRight: 10,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065F46',
  },
  resultSubtitle: {
    fontSize: 12,
    color: '#047857',
    marginTop: 2,
  },
  resultStatsBox: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginBottom: 3,
  },
  statVal: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statDividerVertical: {
    width: 1,
    height: '100%',
    backgroundColor: '#E2E8F0',
  },
  resultActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  actionBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 6,
  },
  actionBtnSecondaryText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  convertAnotherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 10,
    gap: 6,
  },
  convertAnotherBtnText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  renameModalBox: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.card,
  },
  renameModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  renameInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 16,
  },
  renameModalBtns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  modalCancelBtnText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  modalSaveBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  modalSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
