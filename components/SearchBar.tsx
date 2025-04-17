import React from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useLanguageStore } from '@/store/language-store';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  placeholder?: string;
  compact?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onClear,
  placeholder,
  compact = false,
}) => {
  const { t } = useLanguageStore();
  
  const handleClear = () => {
    onChangeText('');
    if (onClear) {
      onClear();
    }
  };

  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      <Search 
        size={compact ? 18 : 20} 
        color={colors.textSecondary} 
        style={styles.icon} 
      />
      <TextInput
        style={[styles.input, compact && styles.compactInput]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || t('search')}
        placeholderTextColor={colors.textSecondary}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
          <X size={compact ? 16 : 18} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  compactContainer: {
    height: 40,
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    height: '100%',
  },
  compactInput: {
    fontSize: 15,
  },
  clearButton: {
    padding: 4,
  },
});