import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity,
  FlatList
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Check } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useLanguageStore } from '@/store/language-store';
import { languageNames, LanguageCode } from '@/constants/i18n';
import { Button } from '@/components/Button';

export default function LanguageSettingsScreen() {
  const router = useRouter();
  const { language: currentLanguage, setLanguage, translate } = useLanguageStore();
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(currentLanguage);
  
  // Convert language names object to array for FlatList
  const languages = Object.entries(languageNames).map(([code, details]) => ({
    code: code as LanguageCode,
    name: details.nativeName,
    region: details.region,
  }));
  
  const handleBack = () => {
    router.back();
  };
  
  const handleLanguageSelect = (code: LanguageCode) => {
    setSelectedLanguage(code);
  };
  
  const handleSave = () => {
    setLanguage(selectedLanguage);
    router.back();
  };
  
  const renderLanguageItem = ({ item }: { item: typeof languages[0] }) => (
    <TouchableOpacity
      style={[
        styles.languageItem,
        selectedLanguage === item.code && styles.selectedLanguageItem
      ]}
      onPress={() => handleLanguageSelect(item.code)}
    >
      <View style={styles.languageInfo}>
        <Text style={styles.languageName}>{item.name}</Text>
        <Text style={styles.languageRegion}>{translate(item.region.toLowerCase() as any)}</Text>
      </View>
      
      {selectedLanguage === item.code && (
        <Check size={20} color={colors.primary} />
      )}
    </TouchableOpacity>
  );
  
  return (
    <>
      <Stack.Screen 
        options={{
          title: translate('languageSettings'),
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
              <ChevronLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <StatusBar style="dark" />
        
        <View style={styles.header}>
          <Text style={styles.title}>{translate('selectLanguage')}</Text>
          <Text style={styles.subtitle}>
            {translate('chooseLanguage')}
          </Text>
        </View>
        
        <FlatList
          data={languages}
          keyExtractor={(item) => item.code}
          renderItem={renderLanguageItem}
          contentContainerStyle={styles.listContent}
        />
        
        <View style={styles.footer}>
          <Button
            title={translate('save')}
            onPress={handleSave}
            disabled={selectedLanguage === currentLanguage}
          />
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerButton: {
    padding: 8,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  listContent: {
    paddingBottom: 24,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectedLanguageItem: {
    backgroundColor: colors.primaryLight,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  languageRegion: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});