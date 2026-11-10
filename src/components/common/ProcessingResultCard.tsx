/**
 * Vertex Docs Mobile - Processing Result Card Component
 * Clean result view with file stats, Open, Share, Save, and restart actions
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../constants/theme';

interface ProcessingResultCardProps {
  title?: string;
  outputFileName: string;
  originalSizeFormatted?: string;
  finalSizeFormatted: string;
  reductionPercentage?: number;
  onOpen: () => void;
  onShare: () => void;
  onSave?: () => void;
  onRestart: () => void;
  restartLabel?: string;
}

export const ProcessingResultCard: React.FC<ProcessingResultCardProps> = ({
  title = 'File Processed Successfully',
  outputFileName,
  originalSizeFormatted,
  finalSizeFormatted,
  reductionPercentage,
  onOpen,
  onShare,
  onSave,
  onRestart,
  restartLabel = 'Convert Another File',
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.successIconBox}>
        <Ionicons name="checkmark-circle" size={48} color="#10B981" />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.fileName} numberOfLines={2}>
        {outputFileName}
      </Text>

      {/* Stats container */}
      <View style={styles.statsContainer}>
        {originalSizeFormatted ? (
          <View style={styles.statColumn}>
            <Text style={styles.statLabel}>Original</Text>
            <Text style={styles.statValue}>{originalSizeFormatted}</Text>
          </View>
        ) : null}

        <View style={styles.statColumn}>
          <Text style={styles.statLabel}>Final Size</Text>
          <Text style={[styles.statValue, styles.highlightValue]}>{finalSizeFormatted}</Text>
        </View>

        {reductionPercentage !== undefined ? (
          <View style={styles.statColumn}>
            <Text style={styles.statLabel}>Reduced</Text>
            <Text style={[styles.statValue, { color: '#059669' }]}>
              -{Math.round(reductionPercentage)}%
            </Text>
          </View>
        ) : null}
      </View>

      {/* Primary Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.primaryBtn} onPress={onOpen} activeOpacity={0.8}>
          <Ionicons name="eye-outline" size={18} color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>Open</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={onShare} activeOpacity={0.8}>
          <Ionicons name="share-social-outline" size={18} color={COLORS.primary} />
          <Text style={styles.secondaryBtnText}>Share</Text>
        </TouchableOpacity>

        {onSave && (
          <TouchableOpacity style={styles.secondaryBtn} onPress={onSave} activeOpacity={0.8}>
            <Ionicons name="download-outline" size={18} color={COLORS.primary} />
            <Text style={styles.secondaryBtnText}>Save</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Restart / Another Action */}
      <TouchableOpacity style={styles.restartBtn} onPress={onRestart} activeOpacity={0.7}>
        <Ionicons name="refresh" size={16} color={COLORS.textSecondary} />
        <Text style={styles.restartBtnText}>{restartLabel}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.md,
    marginVertical: SPACING.md,
  },
  successIconBox: {
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  fileName: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statColumn: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  highlightValue: {
    color: COLORS.primary,
  },
  actionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm + 4,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: SPACING.sm + 4,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 6,
  },
  secondaryBtnText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  restartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    gap: 6,
  },
  restartBtnText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
});

