/**
 * Vertex Docs Mobile - Text Extraction & OCR View
 * Company: JM Vertex Technologies
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../constants/theme';

interface TextExtractionViewProps {
  documentTitle: string;
  extractedText: string;
  wordCount: number;
  ocrConfidence?: number;
  detectedLanguageName?: string;
  onEditText?: () => void;
}

export const TextExtractionView: React.FC<TextExtractionViewProps> = ({
  documentTitle,
  extractedText,
  wordCount,
  ocrConfidence = 99.2,
  detectedLanguageName,
  onEditText,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const previewSnippet =
    extractedText.length > 250 && !isExpanded
      ? extractedText.substring(0, 250) + '...'
      : extractedText;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Ionicons name="scan-outline" size={20} color={COLORS.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Extracted Document Content</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {documentTitle}
          </Text>
        </View>

        <View style={styles.ocrBadge}>
          <Ionicons name="shield-checkmark" size={12} color="#059669" />
          <Text style={styles.ocrBadgeText}>OCR {ocrConfidence}%</Text>
        </View>
      </View>

      {/* Meta Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Words</Text>
          <Text style={styles.statValue}>{wordCount}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Characters</Text>
          <Text style={styles.statValue}>{extractedText.length}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Script / Lang</Text>
          <Text style={styles.statValue}>{detectedLanguageName || 'English'}</Text>
        </View>
      </View>

      {/* Content Preview Box */}
      <View style={styles.previewBox}>
        <Text style={styles.previewText}>{previewSnippet}</Text>
      </View>

      {/* Footer controls: expand / edit */}
      <View style={styles.footerRow}>
        {extractedText.length > 250 && (
          <TouchableOpacity
            style={styles.expandButton}
            onPress={() => setIsExpanded(!isExpanded)}
          >
            <Text style={styles.expandButtonText}>
              {isExpanded ? 'Show Less' : 'Show Full Extracted Text'}
            </Text>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={COLORS.primary}
            />
          </TouchableOpacity>
        )}

        {onEditText && (
          <TouchableOpacity style={styles.editButton} onPress={onEditText}>
            <Ionicons name="create-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.editButtonText}>Edit Content</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginVertical: SPACING.sm,
    ...SHADOWS.subtle,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  ocrBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  ocrBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: SPACING.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.border,
  },
  previewBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 19,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
    paddingTop: 6,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expandButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});
