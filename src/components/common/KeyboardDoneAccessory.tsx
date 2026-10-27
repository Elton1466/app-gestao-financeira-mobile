import React from 'react';
import {
  InputAccessoryView,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { typography } from '../../theme';

export const KEYBOARD_DISMISS_ACCESSORY_ID = 'dismissKeyboard';

export interface KeyboardDoneAccessoryProps {
  nativeID?: string;
  label?: string;
  onPress?: () => void;
}

/**
 * Barra de acessórios de teclado padronizada para iOS (InputAccessoryView).
 * Exibe botão alinhado à direita ("Concluído") na cor ciano oficial (#18A4E0)
 * para recolher teclados numéricos e de data.
 */
export const KeyboardDoneAccessory: React.FC<KeyboardDoneAccessoryProps> = ({
  nativeID = KEYBOARD_DISMISS_ACCESSORY_ID,
  label = 'Concluído',
  onPress,
}) => {
  const { isDark } = useTheme();

  if (Platform.OS !== 'ios') {
    return null;
  }

  const handleDismiss = () => {
    if (onPress) {
      onPress();
    } else {
      Keyboard.dismiss();
    }
  };

  return (
    <InputAccessoryView nativeID={nativeID}>
      <View
        style={[
          styles.accessoryBar,
          {
            backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
            borderTopColor: isDark ? '#334155' : '#E2E8F0',
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleDismiss}
          style={styles.doneButton}
          accessibilityRole="button"
          accessibilityLabel="Concluir e fechar teclado"
          hitSlop={{ top: 8, bottom: 8, left: 16, right: 16 }}
        >
          <Text style={styles.doneButtonText}>{label}</Text>
        </TouchableOpacity>
      </View>
    </InputAccessoryView>
  );
};

const styles = StyleSheet.create({
  accessoryBar: {
    height: 44,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  doneButton: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    fontFamily: typography.fontFamily.bold,
    fontWeight: typography.fontWeight.bold,
    fontSize: 16,
    color: '#18A4E0',
  },
});

export default KeyboardDoneAccessory;
