/**
 * Vertex Docs Mobile - Reusable Button Component
 * JM Vertex Technologies
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'google' | 'text';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  customIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  subtitle?: string;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  customIcon,
  style,
  textStyle,
  subtitle,
}) => {
  const isInteractive = !loading && !disabled;

  const getContainerStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryContainer;
      case 'outline':
        return styles.outlineContainer;
      case 'google':
        return styles.googleContainer;
      case 'text':
        return styles.textButtonContainer;
      case 'primary':
      default:
        return styles.primaryContainer;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'secondary':
      case 'primary':
        return '#FFFFFF';
      case 'outline':
        return COLORS.navy;
      case 'google':
        return COLORS.textPrimary;
      case 'text':
        return COLORS.primary;
      default:
        return '#FFFFFF';
    }
  };

  const getLoadingColor = () => {
    switch (variant) {
      case 'outline':
      case 'google':
        return COLORS.primary;
      case 'text':
        return COLORS.primary;
      default:
        return '#FFFFFF';
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.baseContainer,
        getContainerStyle(),
        disabled && styles.disabledContainer,
        style,
      ]}
      onPress={onPress}
      disabled={!isInteractive}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
    >
      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={getLoadingColor()} />
          <Text style={[styles.loadingText, { color: getTextColor() }]}>
            Please wait...
          </Text>
        </View>
      ) : (
        <View style={styles.contentRow}>
          {customIcon ? (
            <View style={styles.iconSpacing}>{customIcon}</View>
          ) : leftIcon ? (
            <Ionicons
              name={leftIcon}
              size={18}
              color={getTextColor()}
              style={styles.iconSpacing}
            />
          ) : null}

          <View style={styles.labelWrapper}>
            <Text
              style={[
                styles.buttonText,
                { color: getTextColor() },
                variant === 'google' && styles.googleButtonText,
                textStyle,
              ]}
            >
              {title}
            </Text>
            {subtitle && (
              <Text style={styles.subtitleText}>{subtitle}</Text>
            )}
          </View>

          {rightIcon && (
            <Ionicons
              name={rightIcon}
              size={18}
              color={getTextColor()}
              style={styles.rightIconSpacing}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseContainer: {
    height: 50,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    width: '100%',
  },
  primaryContainer: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  secondaryContainer: {
    backgroundColor: COLORS.navy,
  },
  outlineContainer: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.2,
    borderColor: COLORS.border,
  },
  googleContainer: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  textButtonContainer: {
    backgroundColor: 'transparent',
    height: 'auto',
    paddingVertical: SPACING.xs,
    paddingHorizontal: 0,
  },
  disabledContainer: {
    opacity: 0.55,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelWrapper: {
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  googleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  subtitleText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: SPACING.sm,
    fontSize: 14,
    fontWeight: '600',
  },
  iconSpacing: {
    marginRight: SPACING.sm,
  },
  rightIconSpacing: {
    marginLeft: SPACING.sm,
  },
});
