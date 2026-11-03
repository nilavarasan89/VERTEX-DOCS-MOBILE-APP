/**
 * Vertex Docs Mobile - Translation Comparison & Alignment View
 * Company: JM Vertex Technologies
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TranslationJob } from '../../types/translator';
import { getLanguageByCode } from '../../constants/languages';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../constants/theme';

interface TranslationComparisonViewProps {
  job: TranslationJob;
  onEdit: () => void;
  onShare: () => void;
  onExport: () => void;
}

type ViewMode = 'bilingual' | 'translated' | 'original';

export const TranslationComparisonView: React.FC<TranslationComparisonViewProps> = ({
  job,
  onEdit,
  onShare,
  onExport,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('bilingual');

  const srcLang = getLanguageByCode(job.sourceLanguage);
  const tgtLang = getLanguageByCode(job.targetLanguage);

  return (
    <View style={styles.container}>
      {/* View Mode Segmented Controls */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, viewMode === 'bilingual' && styles.segmentBtnActive]}
          onPress={() => setViewMode('bilingual')}
        >
          <Text
            style={[
              styles.segmentBtnText,
              viewMode === 'bilingual' && styles.segmentBtnTextActive,
            ]}
          >
            Bilingual
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, viewMode === 'translated' && styles.segmentBtnActive]}
          onPress={() => setViewMode('translated')}
        >
          <Text
            style={[
              styles.segmentBtnText,
              viewMode === 'translated' && styles.segmentBtnTextActive,
            ]}
          >
            {tgtLang.name}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, viewMode === 'original' && styles.segmentBtnActive]}
          onPress={() => setViewMode('original')}
        >
          <Text
            style={[
              styles.segmentBtnText,
              viewMode === 'original' && styles.segmentBtnTextActive,
            ]}
          >
            Original
          </Text>
        </TouchableOpacity>
      </View>

      {/* Language Header Strip */}
      <View style={styles.langHeaderStrip}>
        <View style={styles.langBadge}>
          <Text style={styles.flagEmoji}>{srcLang.flag}</Text>
          <Text style={styles.langBadgeText}>{srcLang.name}</Text>
        </View>

        <Ionicons name="arrow-forward" size={16} color={COLORS.textSecondary} />

        <View style={[styles.langBadge, styles.langBadgeTarget]}>
          <Text style={styles.flagEmoji}>{tgtLang.flag}</Text>
          <Text style={[styles.langBadgeText, styles.langBadgeTextTarget]}>
            {tgtLang.name}
          </Text>
        </View>
      </View>

      {/* Content Rendering by Section */}
      <ScrollView style={styles.contentScroll} nestedScrollEnabled={true}>
        {job.sections.map((section, idx) => {
          const isHeading = section.type === 'heading';

          return (
            <View key={section.id || idx} style={styles.sectionCard}>
              {/* If Bilingual View */}
              {viewMode === 'bilingual' && (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionNumber}>Section {idx + 1}</Text>
                    {isHeading && <Text style={styles.headingBadge}>Heading</Text>}
                  </View>

                  <View style={styles.bilingualBoxOriginal}>
                    <Text style={styles.boxTagOriginal}>{srcLang.name}</Text>
                    <Text
                      style={[
                        styles.originalText,
                        isHeading && styles.originalTextHeading,
                      ]}
                    >
                      {section.originalText}
                    </Text>
                  </View>

                  <View style={styles.bilingualBoxTranslated}>
                    <Text style={styles.boxTagTranslated}>{tgtLang.name}</Text>
                    <Text
                      style={[
                        styles.translatedText,
                        isHeading && styles.translatedTextHeading,
                      ]}
                    >
                      {section.translatedText}
                    </Text>
                  </View>
                </>
              )}

              {/* If Translated Only */}
              {viewMode === 'translated' && (
                <View style={styles.singleViewBox}>
                  <Text
                    style={[
                      styles.translatedText,
                      isHeading && styles.translatedTextHeading,
                    ]}
                  >
                    {section.translatedText}
                  </Text>
                </View>
              )}

              {/* If Original Only */}
              {viewMode === 'original' && (
                <View style={styles.singleViewBox}>
                  <Text
                    style={[
                      styles.originalText,
                      isHeading && styles.originalTextHeading,
                    ]}
                  >
                    {section.originalText}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Action Toolbar */}
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolBtn} onPress={onEdit}>
          <Ionicons name="create-outline" size={18} color={COLORS.primary} />
          <Text style={styles.toolBtnText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.toolBtn} onPress={onExport}>
          <Ionicons name="download-outline" size={18} color={COLORS.primary} />
          <Text style={styles.toolBtnText}>Export</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.toolBtnPrimary} onPress={onShare}>
          <Ionicons name="share-social-outline" size={18} color="#FFFFFF" />
          <Text style={styles.toolBtnPrimaryText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.md,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: RADIUS.md,
    padding: 3,
    marginBottom: SPACING.sm,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: RADIUS.sm,
  },
  segmentBtnActive: {
    backgroundColor: COLORS.card,
    ...SHADOWS.subtle,
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  segmentBtnTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  langHeaderStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.sm,
    paddingVertical: 8,
    marginBottom: SPACING.sm,
    gap: 8,
  },
  langBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  langBadgeTarget: {
    backgroundColor: '#ECFDF5',
  },
  flagEmoji: {
    fontSize: 14,
  },
  langBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  langBadgeTextTarget: {
    color: '#059669',
  },
  contentScroll: {
    maxHeight: 400,
    marginBottom: SPACING.sm,
  },
  sectionCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
    ...SHADOWS.subtle,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  headingBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  bilingualBoxOriginal: {
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.sm,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#94A3B8',
  },
  boxTagOriginal: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  originalText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 19,
  },
  originalTextHeading: {
    fontSize: 14,
    fontWeight: '700',
  },
  bilingualBoxTranslated: {
    backgroundColor: '#F0FDF4',
    borderRadius: RADIUS.sm,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  boxTagTranslated: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  translatedText: {
    fontSize: 13,
    color: '#064E3B',
    lineHeight: 20,
    fontWeight: '500',
  },
  translatedTextHeading: {
    fontSize: 14,
    fontWeight: '800',
  },
  singleViewBox: {
    paddingVertical: 4,
  },
  toolbar: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: 4,
  },
  toolBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 4,
  },
  toolBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  toolBtnPrimary: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    gap: 4,
    ...SHADOWS.subtle,
  },
  toolBtnPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
