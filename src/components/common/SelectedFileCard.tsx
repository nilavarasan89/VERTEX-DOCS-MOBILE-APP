/**
 * Vertex Docs Mobile - Selected File Card Component
 * Displays the automatically detected file details (name, format, size) with change option
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../constants/theme';

interface SelectedFileCardProps {
  fileName: string;
  fileSizeFormatted: string;
  detectedFormat: string;
  onRemoveOrChange?: () => void;
  changeButtonLabel?: string;
  highlightSize?: boolean;
}

export const SelectedFileCard: React.FC<SelectedFileCardProps> = ({
  fileName,
  fileSizeFormatted,
  detectedFormat,
  onRemoveOrChange,
  changeButtonLabel = 'Change',
  highlightSize = false,
}) => {
  const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(detectedFormat.toLowerCase());
  const iconName = isImage ? 'image' : 'document-text';

  return (
    <View style={styles.card}>
      <View style={styles.contentRow}>
        <View style={styles.iconBox}>
          <Ionicons name={iconName} size={24} color={COLORS.primary} />
        </View>

        <View style={styles.detailsBox}>
          <Text style={styles.fileName} numberOfLines={1}>
            {fileName}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{detectedFormat.toUpperCase()}</Text>
            </View>
            <Text style={[styles.fileSize, highlightSize && styles.highlightSizeText]}>
              {fileSizeFormatted}
            </Text>
          </View>
        </View>

        {onRemoveOrChange && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onRemoveOrChange}
            activeOpacity={0.7}
          >
            <Ionicons name="swap-vertical" size={14} color={COLORS.primary} />
            <Text style={styles.actionBtnText}>{changeButtonLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
    marginVertical: SPACING.sm,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  detailsBox: {
    flex: 1,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#EEF2F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    marginRight: SPACING.sm,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  fileSize: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  highlightSizeText: {
    fontWeight: '700',
    color: '#0F172A',
    fontSize: 14,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs + 2,
    backgroundColor: '#F1F5F9',
    borderRadius: RADIUS.md,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 4,
  },
});

