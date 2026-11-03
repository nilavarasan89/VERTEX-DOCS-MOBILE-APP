/**
 * Vertex Docs Mobile - Language Picker Modal
 * Company: JM Vertex Technologies
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LanguageCode, LanguageItem } from '../../types/translator';
import { SOURCE_LANGUAGES, SUPPORTED_LANGUAGES } from '../../constants/languages';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../constants/theme';

interface LanguagePickerModalProps {
  visible: boolean;
  mode: 'source' | 'target';
  selectedCode: LanguageCode;
  onSelect: (code: LanguageCode) => void;
  onClose: () => void;
}

export const LanguagePickerModal: React.FC<LanguagePickerModalProps> = ({
  visible,
  mode,
  selectedCode,
  onSelect,
  onClose,
}) => {
  const [search, setSearch] = useState('');

  const list: LanguageItem[] = mode === 'source' ? SOURCE_LANGUAGES : SUPPORTED_LANGUAGES;

  const filtered = list.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.nativeName.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>
                Select {mode === 'source' ? 'Source Language' : 'Target Language'}
              </Text>
              <Text style={styles.subtitle}>
                {mode === 'source'
                  ? 'Choose source or keep Auto-detect'
                  : 'Translate document into your chosen language'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color={COLORS.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search languages (e.g. Tamil, English, Hindi)..."
              placeholderTextColor={COLORS.textSecondary}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={16} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Languages List */}
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {filtered.map((item) => {
              const isSelected = selectedCode === item.code;

              return (
                <TouchableOpacity
                  key={item.code}
                  style={[styles.itemRow, isSelected && styles.itemRowSelected]}
                  onPress={() => {
                    onSelect(item.code);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.flagText}>{item.flag}</Text>
                  <View style={styles.itemTextContainer}>
                    <Text style={[styles.itemName, isSelected && styles.itemNameSelected]}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemNativeName}>{item.nativeName}</Text>
                  </View>

                  {item.isPopular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularBadgeText}>Popular</Text>
                    </View>
                  )}

                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 21, 51, 0.45)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '80%',
    padding: SPACING.lg,
    ...SHADOWS.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
    height: 42,
    marginBottom: SPACING.md,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  list: {
    marginBottom: SPACING.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: 4,
  },
  itemRowSelected: {
    backgroundColor: '#EFF6FF',
  },
  flagText: {
    fontSize: 22,
    marginRight: SPACING.md,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  itemNameSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  itemNativeName: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  popularBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
