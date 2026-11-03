/**
 * Vertex Docs Mobile - Conversion & Translation History Screen
 * Company: JM Vertex Technologies
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { HeaderBar } from '../components/common/HeaderBar';
import { HistoryItem, HistoryItemType } from '../types/history';
import { historyService } from '../services/historyService';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../constants/theme';
import { ScreenType } from '../types';

interface HistoryScreenProps {
  onBack: () => void;
  onNavigateToTranslator: (documentTitle: string, rawText?: string, format?: string) => void;
  onNavigateScreen?: (screen: ScreenType) => void;
}

type FilterType = 'all' | 'conversion' | 'translation';

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  onBack,
  onNavigateToTranslator,
  onNavigateScreen,
}) => {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<FilterType>('all');
  const [items, setItems] = useState<HistoryItem[]>(historyService.getAll());

  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter);
    setItems(historyService.getByType(newFilter));
  };

  const handleDeleteItem = (id: string, title: string) => {
    Alert.alert(
      'Remove History Entry',
      `Are you sure you want to remove "${title}" from history?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            historyService.removeItem(id);
            setItems(historyService.getByType(filter));
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All History',
      'This will clear all past conversion and translation history logs.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            historyService.clearAll();
            setItems([]);
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <HeaderBar
        title="Conversion & Translation History"
        subtitle="Manage and track past document operations"
        showBack={true}
        onBack={onBack}
        rightAction={{
          icon: 'trash-outline',
          onPress: handleClearAll,
        }}
      />

      {/* Filter Chips */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          onPress={() => handleFilterChange('all')}
        >
          <Text
            style={[styles.filterChipText, filter === 'all' && styles.filterChipTextActive]}
          >
            All Activity
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === 'conversion' && styles.filterChipActive]}
          onPress={() => handleFilterChange('conversion')}
        >
          <Ionicons
            name="swap-horizontal"
            size={14}
            color={filter === 'conversion' ? '#FFFFFF' : COLORS.textSecondary}
          />
          <Text
            style={[
              styles.filterChipText,
              filter === 'conversion' && styles.filterChipTextActive,
            ]}
          >
            Conversions
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === 'translation' && styles.filterChipActive]}
          onPress={() => handleFilterChange('translation')}
        >
          <Ionicons
            name="language"
            size={14}
            color={filter === 'translation' ? '#FFFFFF' : COLORS.textSecondary}
          />
          <Text
            style={[
              styles.filterChipText,
              filter === 'translation' && styles.filterChipTextActive,
            ]}
          >
            Translations
          </Text>
        </TouchableOpacity>
      </View>

      {/* History Items List */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="time-outline" size={36} color={COLORS.textSecondary} />
            </View>
            <Text style={styles.emptyTitle}>No History Found</Text>
            <Text style={styles.emptySubtitle}>
              Documents converted or translated will appear here for easy access.
            </Text>

            <TouchableOpacity
              style={styles.emptyCtaBtn}
              onPress={() => onNavigateScreen && onNavigateScreen('converter')}
            >
              <Ionicons name="sparkles" size={16} color="#FFFFFF" />
              <Text style={styles.emptyCtaBtnText}>Convert a Document Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          items.map((item) => {
            const isConversion = item.type === 'conversion';

            return (
              <View key={item.id} style={styles.historyCard}>
                <View style={styles.cardTopRow}>
                  {/* Type Icon */}
                  <View
                    style={[
                      styles.typeIconBox,
                      isConversion ? styles.typeIconBoxConv : styles.typeIconBoxTrans,
                    ]}
                  >
                    <Ionicons
                      name={isConversion ? 'swap-horizontal' : 'language'}
                      size={18}
                      color={isConversion ? COLORS.primary : '#0EA5A4'}
                    />
                  </View>

                  {/* Title & Subtitle */}
                  <View style={styles.cardTitleBox}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                  </View>

                  {/* Badges Pair */}
                  <View style={styles.badgePair}>
                    <View style={styles.sourceBadge}>
                      <Text style={styles.sourceBadgeText}>{item.sourceBadge}</Text>
                    </View>
                    <Ionicons name="arrow-forward" size={10} color={COLORS.textSecondary} />
                    <View
                      style={[
                        styles.targetBadge,
                        !isConversion && styles.targetBadgeTrans,
                      ]}
                    >
                      <Text
                        style={[
                          styles.targetBadgeText,
                          !isConversion && styles.targetBadgeTextTrans,
                        ]}
                      >
                        {item.targetBadge}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Meta details footer */}
                <View style={styles.cardBottomRow}>
                  <View style={styles.metaLeft}>
                    <Ionicons name="time-outline" size={12} color={COLORS.textSecondary} />
                    <Text style={styles.metaText}>{item.date}</Text>
                    {item.fileSizeFormatted && (
                      <>
                        <Text style={styles.metaDivider}>•</Text>
                        <Text style={styles.metaText}>{item.fileSizeFormatted}</Text>
                      </>
                    )}
                  </View>

                  <View style={styles.actionsGroup}>
                    {/* Share converted/translated document */}
                    {item.resultUri && (
                      <TouchableOpacity
                        style={styles.shareBtn}
                        onPress={async () => {
                          try {
                            const isAvail = await Sharing.isAvailableAsync();
                            if (isAvail && item.resultUri) {
                              await Sharing.shareAsync(item.resultUri, {
                                dialogTitle: `Share ${item.resultFileName || item.title}`,
                              });
                            } else {
                              Alert.alert('Share', `Sharing link generated for ${item.title}`);
                            }
                          } catch (e) {
                            Alert.alert('Share', `Sharing ${item.title}`);
                          }
                        }}
                      >
                        <Ionicons name="share-outline" size={15} color={COLORS.primary} />
                      </TouchableOpacity>
                    )}

                    {/* Chained action: Translate if converted */}
                    {item.canTranslate && (
                      <TouchableOpacity
                        style={styles.translateShortcutBtn}
                        onPress={() =>
                          onNavigateToTranslator(
                            item.resultFileName || item.title,
                            undefined,
                            item.meta?.targetFormat
                          )
                        }
                      >
                        <Ionicons name="language" size={13} color="#0EA5A4" />
                        <Text style={styles.translateShortcutBtnText}>Translate</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDeleteItem(item.id, item.title)}
                    >
                      <Ionicons name="trash-outline" size={15} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: 8,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    backgroundColor: '#F1F5F9',
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  historyCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.subtle,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  typeIconBox: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  typeIconBoxConv: {
    backgroundColor: '#EFF6FF',
  },
  typeIconBoxTrans: {
    backgroundColor: '#F0FDFA',
  },
  cardTitleBox: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  cardSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  badgePair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sourceBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sourceBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  targetBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  targetBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  targetBadgeTrans: {
    backgroundColor: '#ECFDF5',
  },
  targetBadgeTextTrans: {
    color: '#059669',
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 8,
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  metaDivider: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  translateShortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  translateShortcutBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
  },
  deleteBtn: {
    padding: 4,
  },
  shareBtn: {
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: SPACING.lg,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    marginBottom: SPACING.lg,
  },
  emptyCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: RADIUS.md,
    ...SHADOWS.subtle,
  },
  emptyCtaBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
