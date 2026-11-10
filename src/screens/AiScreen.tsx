/**
 * Vertex Docs Mobile - AI Document Assistant Screen (Phase 5)
 * Company: JM Vertex Technologies
 * 
 * Features:
 * 1. Dedicated clean "AI Document Assistant" screen.
 * 2. "Smarter document tools are coming soon" status badge.
 * 3. Preview cards for Summarization, Document Q&A, and Data/Table Extraction.
 * 4. Direct prominent launcher for the live Neural Document Translator.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../components/common/AppHeader';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../constants/theme';
import { ScreenType } from '../types';

interface AiScreenProps {
  onBack: () => void;
  onNavigateScreen: (screen: ScreenType) => void;
}

export const AiScreen: React.FC<AiScreenProps> = ({ onBack, onNavigateScreen }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AppHeader
        title="AI Assistant"
        subtitle="Intelligent document intelligence"
        showBack={true}
        onBack={onBack}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner with Status */}
        <View style={styles.heroCard}>
          <View style={styles.badgeRow}>
            <View style={styles.liveBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.liveBadgeText}>SMART TOOLS</Text>
            </View>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonBadgeText}>Next-Gen AI Coming Soon</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>Intelligent Document Processing</Text>
          <Text style={styles.heroSubtitle}>
            Harness generative intelligence for automated summaries, question answering, and high-fidelity multilingual translation.
          </Text>
        </View>

        {/* Live Feature: Neural Document Translator */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACTIVE FEATURE</Text>
          <TouchableOpacity
            style={styles.activeCard}
            onPress={() => onNavigateScreen('translator')}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="language" size={26} color="#059669" />
              </View>
              <View style={styles.activeStatusPill}>
                <Text style={styles.activeStatusText}>Available Now</Text>
              </View>
            </View>

            <Text style={styles.cardTitle}>Neural Document Translator</Text>
            <Text style={styles.cardDescription}>
              Translate documents, scanned PDFs, and text between English, Tamil, Hindi, and 10+ languages with full Unicode support.
            </Text>

            <View style={styles.cardFooterRow}>
              <Text style={styles.openText}>Open Translator</Text>
              <Ionicons name="arrow-forward" size={16} color="#059669" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Upcoming Tools Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PREVIEW OF COMING TOOLS</Text>

          {/* Preview 1: Summarizer */}
          <View style={styles.previewCard}>
            <View style={styles.previewTop}>
              <View style={[styles.iconBox, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="bulb-outline" size={22} color="#4F46E5" />
              </View>
              <View style={styles.previewTag}>
                <Text style={styles.previewTagText}>In Development</Text>
              </View>
            </View>
            <Text style={styles.previewTitle}>Executive Document Summarizer</Text>
            <Text style={styles.previewDescription}>
              Generate high-level summaries, key decision items, and action points from lengthy PDF reports and contracts.
            </Text>
          </View>

          {/* Preview 2: Q&A */}
          <View style={styles.previewCard}>
            <View style={styles.previewTop}>
              <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="chatbubbles-outline" size={22} color="#D97706" />
              </View>
              <View style={styles.previewTag}>
                <Text style={styles.previewTagText}>In Development</Text>
              </View>
            </View>
            <Text style={styles.previewTitle}>Ask Document (Q&A)</Text>
            <Text style={styles.previewDescription}>
              Interactive dialogue with your documents. Ask questions, verify clauses, and find citations instantly.
            </Text>
          </View>

          {/* Preview 3: Table & Data Extraction */}
          <View style={styles.previewCard}>
            <View style={styles.previewTop}>
              <View style={[styles.iconBox, { backgroundColor: '#FDF4FF' }]}>
                <Ionicons name="grid-outline" size={22} color="#9333EA" />
              </View>
              <View style={styles.previewTag}>
                <Text style={styles.previewTagText}>In Development</Text>
              </View>
            </View>
            <Text style={styles.previewTitle}>Smart Table & Data Extractor</Text>
            <Text style={styles.previewDescription}>
              Convert complex tables, receipts, and invoices inside scanned documents into structured Excel / CSV spreadsheets.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl * 2,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
    marginBottom: SPACING.lg,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.md,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    gap: 5,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  comingSoonBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  comingSoonBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  heroTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
  },
  activeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    ...SHADOWS.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeStatusPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  activeStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  openText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  },
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
    marginBottom: SPACING.sm,
  },
  previewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  previewTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  previewTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 4,
    marginBottom: 2,
  },
  previewDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
});

