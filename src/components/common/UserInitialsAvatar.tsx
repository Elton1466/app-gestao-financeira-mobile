import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { colors, typography } from '../../theme';
import { getUserInitials } from '../../utils/initials';

export type UserInitialsAvatarTone = 'header' | 'light' | 'brand';

export interface UserInitialsAvatarProps {
  name?: string | null;
  size?: number;
  tone?: UserInitialsAvatarTone;
  backgroundColor?: string;
  textColor?: string;
  borderWidth?: number;
  borderColor?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
}

/**
 * Componente Reutilizável de Avatar com Iniciais do Usuário
 * - Substitui 100% o uso de fotos no aplicativo.
 * - Extrai a 1ª letra do 1º nome + 1ª letra do último sobrenome (ex: "ELTON ARAUJO" -> "EA").
 * - Formato circular com borda sutil e tipografia limpa.
 */
export const UserInitialsAvatar: React.FC<UserInitialsAvatarProps> = ({
  name,
  size = 44,
  tone = 'header',
  backgroundColor,
  textColor,
  borderWidth,
  borderColor,
  style,
  textStyle,
  accessibilityLabel,
}) => {
  const initials = getUserInitials(name);
  const fontSize = Math.max(12, Math.round(size * 0.4));

  const resolvedBgColor = (() => {
    if (backgroundColor) return backgroundColor;
    if (tone === 'header') return colors.accent; // Azul-ciano vibrante oficial (#009FE3)
    if (tone === 'brand') return colors.primary; // Azul-marinho oficial (#081F4D)
    return colors.primaryLight; // tone === 'light' (#E0F4FC)
  })();

  const resolvedBorderColor = (() => {
    if (borderColor) return borderColor;
    if (tone === 'header') return '#FFFFFF';
    if (tone === 'brand') return colors.accent;
    return colors.border; // tone === 'light' (#D9E2EA)
  })();

  const resolvedTextColor = (() => {
    if (textColor) return textColor;
    if (tone === 'header' || tone === 'brand') return '#FFFFFF';
    return colors.primary; // tone === 'light'
  })();

  const resolvedBorderWidth = borderWidth ?? (tone === 'header' ? 1.5 : 1.5);

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={
        accessibilityLabel ?? `Avatar com as iniciais ${initials} de ${name || 'usuário'}`
      }
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: resolvedBgColor,
          borderColor: resolvedBorderColor,
          borderWidth: resolvedBorderWidth,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            fontSize,
            lineHeight: Math.round(fontSize * 1.2),
            color: resolvedTextColor,
          },
          textStyle,
        ]}
        numberOfLines={1}
      >
        {initials}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  text: {
    fontFamily: typography.fontFamily.semibold,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
