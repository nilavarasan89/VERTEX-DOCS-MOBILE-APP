/**
 * Vertex Docs Mobile - Brand Logo Component
 * JM Vertex Technologies
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

interface BrandLogoProps {
  size?: 'compact' | 'standard' | 'large';
  showSubtitle?: boolean;
  showCompanyTag?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'standard',
  showSubtitle = true,
  showCompanyTag = true,
}) => {
  const isLarge = size === 'large';
  const isCompact = size === 'compact';

  const iconContainerSize = isLarge ? 68 : isCompact ? 44 : 56;
  const iconSize = isLarge ? 34 : isCompact ? 22 : 28;
  const titleSize = isLarge ? 28 : isCompact ? 18 : 24;

  return (
    <View style={styles.container}>
      {showCompanyTag && (
        <View style={styles.companyTagContainer}>
          <View style={styles.companyDot} />
          <Text style={styles.companyTagText}>JM VERTEX TECHNOLOGIES</Text>
        </View>
      )}

      <View style={styles.logoRow}>
        {/* Custom Document & Vertex Mark */}
        <View
          style={[
            styles.iconWrapper,
            { width: iconContainerSize, height: iconContainerSize, borderRadius: RADIUS.lg },
          ]}
        >
          {/* Layered Accent Badge */}
          <View style={styles.accentBadge}>
            <View style={styles.accentCorner} />
          </View>
          <Ionicons name="document-text" size={iconSize} color="#FFFFFF" />
          <View style={styles.tealDot} />
        </View>

        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text style={[styles.brandTitleVertex, { fontSize: titleSize }]}>Vertex</Text>
            <Text style={[styles.brandTitleDocs, { fontSize: titleSize }]}> Docs</Text>
          </View>

          {showSubtitle && (
            <Text style={styles.brandSubtitle}>Your documents. Simplified.</Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  companyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.teal,
    marginRight: 6,
  },
  companyTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.navy,
    letterSpacing: 0.8,
  },
  logoRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    position: 'relative',
    shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(37, 99, 235, 0.4)',
  },
  accentBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 14,
    height: 14,
    overflow: 'hidden',
  },
  accentCorner: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderRightWidth: 12,
    borderTopWidth: 12,
    borderRightColor: 'transparent',
    borderTopColor: COLORS.teal,
  },
  tealDot: {
    position: 'absolute',
    bottom: 6,
    right: 7,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.teal,
  },
  textContainer: {
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitleVertex: {
    fontWeight: '800',
    color: COLORS.navy,
    letterSpacing: -0.5,
  },
  brandTitleDocs: {
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginTop: 2,
    letterSpacing: 0.2,
  },
});
