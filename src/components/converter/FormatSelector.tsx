/**
 * Vertex Docs Mobile - Format Selector Component
 * Company: JM Vertex Technologies
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TargetFormat, ConversionOption } from '../../types/converter';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../constants/theme';

interface FormatSelectorProps {
  options: ConversionOption[];
  selectedFormat: TargetFormat | null;
  onSelectFormat: (format: TargetFormat) => void;
  disabled?: boolean;
}

export const FormatSelector: React.FC<FormatSelectorProps> = ({
  options,
  selectedFormat,
  onSelectFormat,
  disabled = false,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Choose Target Format</Text>
      <Text style={styles.sectionSubtitle}>
        Select the output file format for your document
      </Text>

      <View style={styles.grid}>
        {options.map((opt) => {
          const isSelected = selectedFormat === opt.format;

          return (
            <TouchableOpacity
              key={opt.format}
              style={[
                styles.card,
                isSelected && styles.cardSelected,
                disabled && styles.cardDisabled,
              ]}
              onPress={() => !disabled && onSelectFormat(opt.format)}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.iconBox,
                    isSelected ? styles.iconBoxSelected : styles.iconBoxDefault,
                  ]}
                >
                  <Ionicons
                    name={opt.icon as any}
                    size={22}
                    color={isSelected ? '#FFFFFF' : COLORS.primary}
                  />
                </View>

                {opt.badge && (
                  <View
                    style={[
                      styles.badge,
                      opt.badge === 'PRO' ? styles.badgePro : styles.badgeDefault,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        opt.badge === 'PRO' ? styles.badgeTextPro : styles.badgeTextDefault,
                      ]}
                    >
                      {opt.badge}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={[styles.formatLabel, isSelected && styles.formatLabelSelected]}>
                {opt.label}
              </Text>
              <Text style={styles.formatExtension}>{opt.extension.toUpperCase()}</Text>

              <Text style={styles.formatDescription} numberOfLines={2}>
                {opt.description}
              </Text>

              <View style={styles.timeRow}>
                <Ionicons name="time-outline" size={12} color={COLORS.textSecondary} />
                <Text style={styles.timeText}>~{opt.estimatedTimeSec}s conversion</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.md,
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
    marginBottom: SPACING.md,
  },
  grid: {
    gap: SPACING.sm,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.subtle,
  },
  cardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0F6FF',
  },
  cardDisabled: {
    opacity: 0.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBoxDefault: {
    backgroundColor: '#EFF6FF',
  },
  iconBoxSelected: {
    backgroundColor: COLORS.primary,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeDefault: {
    backgroundColor: '#E0F2FE',
  },
  badgePro: {
    backgroundColor: '#FEF3C7',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  badgeTextDefault: {
    color: '#0369A1',
  },
  badgeTextPro: {
    color: '#B45309',
  },
  formatLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  formatLabelSelected: {
    color: COLORS.primary,
  },
  formatExtension: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  formatDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
});
