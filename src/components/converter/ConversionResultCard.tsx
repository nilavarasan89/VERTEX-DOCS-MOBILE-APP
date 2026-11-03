/**
 * Vertex Docs Mobile - Conversion Result Card
 * Company: JM Vertex Technologies
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ConversionJob } from '../../types/converter';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../constants/theme';

interface ConversionResultCardProps {
  job: ConversionJob;
  onShare: () => void;
  onSave: () => void;
  onTranslateNow: (job: ConversionJob) => void;
  onReset: () => void;
}

export const ConversionResultCard: React.FC<ConversionResultCardProps> = ({
  job,
  onShare,
  onSave,
  onTranslateNow,
  onReset,
}) => {
  const isSuccess = job.status === 'completed';

  if (!isSuccess) {
    return (
      <View style={[styles.card, styles.cardError]}>
        <View style={styles.errorHeader}>
          <Ionicons name="alert-circle" size={32} color="#EF4444" />
          <View style={styles.errorTextContainer}>
            <Text style={styles.errorTitle}>Conversion Failed</Text>
            <Text style={styles.errorMessage}>
              {job.errorMessage || 'An unexpected error occurred during processing.'}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.retryButton} onPress={onReset}>
          <Ionicons name="refresh" size={16} color="#FFFFFF" />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {/* Success Badge */}
      <View style={styles.successHeader}>
        <View style={styles.successIconBox}>
          <Ionicons name="checkmark-circle" size={24} color="#10B981" />
        </View>
        <View style={styles.successTextContainer}>
          <Text style={styles.successTitle}>Conversion Complete!</Text>
          <Text style={styles.successSubtitle}>Document is ready to use</Text>
        </View>
        <View style={styles.formatPill}>
          <Text style={styles.formatPillText}>{job.targetFormat.toUpperCase()}</Text>
        </View>
      </View>

      {/* Converted File Info Box */}
      <View style={styles.fileBox}>
        <View style={styles.fileIconBox}>
          <Ionicons name="document-text" size={24} color={COLORS.primary} />
        </View>
        <View style={styles.fileDetails}>
          <Text style={styles.fileName} numberOfLines={1}>
            {job.resultFileName || job.fileName}
          </Text>
          <View style={styles.fileMetaRow}>
            <Text style={styles.fileSizeText}>{job.resultSizeFormatted || job.fileSizeFormatted}</Text>
            <Text style={styles.fileMetaDivider}>•</Text>
            <Text style={styles.fileMetaStatus}>High Quality Render</Text>
          </View>
        </View>
      </View>

      {/* Primary Actions: Share & Save */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionButtonSecondary} onPress={onSave}>
          <Ionicons name="download-outline" size={16} color={COLORS.textPrimary} />
          <Text style={styles.actionButtonSecondaryText}>Save</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButtonSecondary} onPress={onShare}>
          <Ionicons name="share-social-outline" size={16} color={COLORS.textPrimary} />
          <Text style={styles.actionButtonSecondaryText}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Chained Workflow: Document Converter -> Document Translator */}
      <View style={styles.translatorPromoCard}>
        <View style={styles.translatorPromoHeader}>
          <View style={styles.translatorIconBox}>
            <Ionicons name="language" size={18} color="#0EA5A4" />
          </View>
          <View style={styles.translatorPromoTextContainer}>
            <Text style={styles.translatorPromoTitle}>Step 2: Document Translator</Text>
            <Text style={styles.translatorPromoSubtitle}>
              Translate this converted document into Tamil or English
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.translateNowButton}
          onPress={() => onTranslateNow(job)}
          activeOpacity={0.8}
        >
          <Text style={styles.translateNowButtonText}>Translate This Document</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Convert Another File */}
      <TouchableOpacity style={styles.resetButton} onPress={onReset}>
        <Text style={styles.resetButtonText}>Convert Another Document</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    marginVertical: SPACING.md,
    ...SHADOWS.card,
  },
  cardError: {
    borderColor: '#FECACA',
    backgroundColor: '#FFF5F5',
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  errorTextContainer: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#DC2626',
  },
  errorMessage: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  retryButton: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  successHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  successIconBox: {
    marginRight: SPACING.sm,
  },
  successTextContainer: {
    flex: 1,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#065F46',
  },
  successSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  formatPill: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  formatPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46',
  },
  fileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  fileIconBox: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.sm,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  fileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  fileSizeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  fileMetaDivider: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  fileMetaStatus: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  actionButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  actionButtonSecondaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  translatorPromoCard: {
    backgroundColor: '#F0FDFA',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: '#99F6E4',
    marginBottom: SPACING.md,
  },
  translatorPromoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  translatorIconBox: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: '#CCFBF1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  translatorPromoTextContainer: {
    flex: 1,
  },
  translatorPromoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F766E',
  },
  translatorPromoSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  translateNowButton: {
    backgroundColor: '#0EA5A4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    gap: 6,
    ...SHADOWS.subtle,
  },
  translateNowButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  resetButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  resetButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
});
