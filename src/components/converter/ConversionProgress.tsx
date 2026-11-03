/**
 * Vertex Docs Mobile - Conversion Progress Component
 * Company: JM Vertex Technologies
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ConversionJob } from '../../types/converter';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../constants/theme';

interface ConversionProgressProps {
  job: ConversionJob;
  onCancel?: () => void;
}

export const ConversionProgress: React.FC<ConversionProgressProps> = ({ job }) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Converting Document...</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {job.fileName} → {job.targetFormat.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.percentText}>{Math.round(job.progress)}%</Text>
      </View>

      {/* Progress Bar Container */}
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${Math.min(100, Math.max(5, job.progress))}%` }]} />
      </View>

      {/* Current Step Description */}
      <View style={styles.stepContainer}>
        <Ionicons name="sync" size={14} color={COLORS.primary} style={styles.stepIcon} />
        <Text style={styles.stepText} numberOfLines={2}>
          {job.currentStepText}
        </Text>
      </View>

      {/* Step checklist */}
      <View style={styles.checklist}>
        <View style={styles.checkItem}>
          <Ionicons
            name={job.progress >= 20 ? 'checkmark-circle' : 'ellipse-outline'}
            size={14}
            color={job.progress >= 20 ? '#10B981' : COLORS.textSecondary}
          />
          <Text style={[styles.checkText, job.progress >= 20 && styles.checkTextActive]}>
            File validation & format verification
          </Text>
        </View>

        <View style={styles.checkItem}>
          <Ionicons
            name={job.progress >= 60 ? 'checkmark-circle' : 'ellipse-outline'}
            size={14}
            color={job.progress >= 60 ? '#10B981' : COLORS.textSecondary}
          />
          <Text style={[styles.checkText, job.progress >= 60 && styles.checkTextActive]}>
            High-fidelity vector & layout parsing
          </Text>
        </View>

        <View style={styles.checkItem}>
          <Ionicons
            name={job.progress >= 95 ? 'checkmark-circle' : 'ellipse-outline'}
            size={14}
            color={job.progress >= 95 ? '#10B981' : COLORS.textSecondary}
          />
          <Text style={[styles.checkText, job.progress >= 95 && styles.checkTextActive]}>
            Document generation & packaging
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    marginVertical: SPACING.md,
    ...SHADOWS.subtle,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  percentText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  progressBarBackground: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: RADIUS.sm,
  },
  stepIcon: {
    marginRight: 6,
  },
  stepText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  checklist: {
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: SPACING.sm,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  checkTextActive: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
});
