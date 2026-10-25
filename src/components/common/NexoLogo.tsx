import React, { useContext } from 'react';
import {
  Image,
  ImageStyle,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import ThemeContext from '../../contexts/ThemeContext';

export type NexoLogoVariant = 'icon' | 'full';

export interface NexoLogoProps {
  variant?: NexoLogoVariant;
  size?: number;
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle | ImageStyle>;
  accessibilityLabel?: string;
  forceTheme?: 'light' | 'dark';
}

const NEXO_ICON_LIGHT_PNG = require('../../../assets/images/nexo-icon-transparent-light.png');
const NEXO_ICON_DARK_PNG = require('../../../assets/images/nexo-icon-transparent-dark.png');
const NEXO_LOGO_LIGHT_PNG = require('../../../assets/images/nexo-logo-transparent-light.png');
const NEXO_LOGO_DARK_PNG = require('../../../assets/images/nexo-logo-transparent-dark.png');

export const NexoLogo: React.FC<NexoLogoProps> = ({
  variant = 'full',
  size,
  width,
  height,
  style,
  accessibilityLabel,
  forceTheme,
}) => {
  const themeContext = useContext(ThemeContext);
  const isDark = forceTheme
    ? forceTheme === 'dark'
    : (themeContext?.isDark ?? false);

  const isIcon = variant === 'icon';

  const defaultSize = isIcon ? (size ?? 28) : (size ?? 180);
  const targetWidth = width ?? defaultSize;
  const targetHeight =
    height ?? (isIcon ? (size ?? 28) : Math.round(targetWidth * 0.8));

  const imageSource = isIcon
    ? isDark
      ? NEXO_ICON_DARK_PNG
      : NEXO_ICON_LIGHT_PNG
    : isDark
      ? NEXO_LOGO_DARK_PNG
      : NEXO_LOGO_LIGHT_PNG;

  const defaultLabel = isIcon
    ? 'Símbolo nexo'
    : 'Logo nexo — Controle Financeiro Pessoal';

  return (
    <View
      accessible={true}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel || defaultLabel}
      style={[
        styles.container,
        { width: targetWidth, height: targetHeight, backgroundColor: 'transparent' },
        style as StyleProp<ViewStyle>,
      ]}
    >
      <Image
        source={imageSource}
        style={{
          width: targetWidth,
          height: targetHeight,
        }}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
});

export default NexoLogo;
