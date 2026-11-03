/**
 * Vertex Docs Mobile - Translation Editor Modal
 * Company: JM Vertex Technologies
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../constants/theme';

interface TranslationEditorModalProps {
  visible: boolean;
  initialText: string;
  documentTitle: string;
  onSave: (newText: string) => void;
  onClose: () => void;
}

export const TranslationEditorModal: React.FC<TranslationEditorModalProps> = ({
  visible,
  initialText,
  documentTitle,
  onSave,
  onClose,
}) => {
  const [text, setText] = useState(initialText);

  useEffect(() => {
    setText(initialText);
  }, [initialText, visible]);

  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const chars = text.length;

  const handleSave = () => {
    if (!text.trim()) {
      Alert.alert('Empty Content', 'Document content cannot be completely empty.');
      return;
    }
    onSave(text);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>Edit Translation</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {documentTitle}
            </Text>
          </View>

          <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Live Counters */}
        <View style={styles.statsBar}>
          <View style={styles.statBox}>
            <Ionicons name="document-text-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.statText}>{words} words</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="keypad-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.statText}>{chars} chars</Text>
          </View>
          <TouchableOpacity
            style={styles.revertBtn}
            onPress={() => setText(initialText)}
          >
            <Ionicons name="refresh" size={12} color={COLORS.primary} />
            <Text style={styles.revertBtnText}>Reset</Text>
          </TouchableOpacity>
        </View>

        {/* Text Area */}
        <ScrollView style={styles.editorScroll} keyboardShouldPersistTaps="handled">
          <TextInput
            style={styles.textInput}
            multiline={true}
            value={text}
            onChangeText={setText}
            placeholder="Edit translated text here..."
            placeholderTextColor={COLORS.textSecondary}
            textAlignVertical="top"
            autoFocus={true}
          />
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: 50,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  cancelBtnText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  titleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    maxWidth: 200,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: RADIUS.full,
  },
  saveBtnText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  revertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  revertBtnText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
  },
  editorScroll: {
    flex: 1,
    padding: SPACING.md,
  },
  textInput: {
    fontSize: 15,
    color: COLORS.textPrimary,
    lineHeight: 24,
    minHeight: 400,
  },
});
