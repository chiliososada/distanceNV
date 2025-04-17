import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Switch,
  ScrollView,
  Alert
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { 
  ChevronLeft, 
  Bell, 
  Lock, 
  Moon, 
  Globe, 
  HelpCircle, 
  FileText, 
  LogOut,
  ChevronRight,
  User,
  Key,
  Languages
} from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/auth-store';
import { useLanguageStore } from '@/store/language-store';
import { languageNames } from '@/constants/i18n';

export default function SettingsScreen() {
  const router = useRouter();
  const { logout, user } = useAuthStore();
  const { language: currentLanguage, translate } = useLanguageStore();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  
  const handleBack = () => {
    router.back();
  };
  
  const handleEditProfile = () => {
    router.push('/profile/edit');
  };
  
  const handleChangePassword = () => {
    router.push('/profile/change-password');
  };
  
  const handleLanguageChange = () => {
    router.push('/settings/language');
  };
  
  const handlePrivacyPolicy = () => {
    router.push('/settings/privacy');
  };
  
  const handleTermsOfService = () => {
    Alert.alert(translate('termsOfService'), translate('readTermsOfService'));
  };
  
  const handleLogout = () => {
    Alert.alert(
      translate('logout'),
      translate('logoutConfirm'),
      [
        {
          text: translate('cancel'),
          style: 'cancel',
        },
        {
          text: translate('logout'),
          onPress: () => {
            logout();
            router.replace('/(auth)/login');
          },
          style: 'destructive',
        },
      ]
    );
  };
  
  return (
    <>
      <Stack.Screen 
        options={{
          title: translate('settings'),
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
        
        <ScrollView>
          <View style={styles.userInfoSection}>
            <Text style={styles.userName}>{user?.displayName}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{translate('account')}</Text>
            
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={handleEditProfile}
            >
              <View style={styles.settingIconContainer}>
                <User size={20} color={colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{translate('editProfile')}</Text>
                <Text style={styles.settingDescription}>
                  {translate('updatePersonalInfo')}
                </Text>
              </View>
              <ChevronRight size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={handleChangePassword}
            >
              <View style={styles.settingIconContainer}>
                <Key size={20} color={colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{translate('changePassword')}</Text>
                <Text style={styles.settingDescription}>
                  {translate('updateAccountPassword')}
                </Text>
              </View>
              <ChevronRight size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{translate('preferences')}</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingIconContainer}>
                <Bell size={20} color={colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{translate('notifications')}</Text>
                <Text style={styles.settingDescription}>
                  {translate('receiveNotifications')}
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: colors.inactive, true: colors.primaryLight }}
                thumbColor={notificationsEnabled ? colors.primary : colors.textLight}
              />
            </View>
            
            <View style={styles.settingItem}>
              <View style={styles.settingIconContainer}>
                <Moon size={20} color={colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{translate('darkMode')}</Text>
                <Text style={styles.settingDescription}>
                  {translate('switchThemes')}
                </Text>
              </View>
              <Switch
                value={darkModeEnabled}
                onValueChange={setDarkModeEnabled}
                trackColor={{ false: colors.inactive, true: colors.primaryLight }}
                thumbColor={darkModeEnabled ? colors.primary : colors.textLight}
              />
            </View>
            
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={handleLanguageChange}
            >
              <View style={styles.settingIconContainer}>
                <Languages size={20} color={colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{translate('language')}</Text>
                <Text style={styles.settingDescription}>
                  {languageNames[currentLanguage].nativeName}
                </Text>
              </View>
              <ChevronRight size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{translate('privacySecurity')}</Text>
            
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={handlePrivacyPolicy}
            >
              <View style={styles.settingIconContainer}>
                <Lock size={20} color={colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{translate('privacySettings')}</Text>
                <Text style={styles.settingDescription}>
                  {translate('manageDataPrivacy')}
                </Text>
              </View>
              <ChevronRight size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{translate('support')}</Text>
            
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingIconContainer}>
                <HelpCircle size={20} color={colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{translate('helpCenter')}</Text>
                <Text style={styles.settingDescription}>
                  {translate('getHelp')}
                </Text>
              </View>
              <ChevronRight size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={handlePrivacyPolicy}
            >
              <View style={styles.settingIconContainer}>
                <FileText size={20} color={colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{translate('privacyPolicy')}</Text>
                <Text style={styles.settingDescription}>
                  {translate('readPrivacyPolicy')}
                </Text>
              </View>
              <ChevronRight size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={handleTermsOfService}
            >
              <View style={styles.settingIconContainer}>
                <FileText size={20} color={colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{translate('termsOfService')}</Text>
                <Text style={styles.settingDescription}>
                  {translate('readTermsOfService')}
                </Text>
              </View>
              <ChevronRight size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <LogOut size={20} color={colors.error} />
            <Text style={styles.logoutText}>{translate('logout')}</Text>
          </TouchableOpacity>
          
          <Text style={styles.versionText}>{translate('version')} 1.0.0</Text>
        </ScrollView>
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
  userInfoSection: {
    padding: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.background,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: colors.card,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
    marginLeft: 8,
  },
  versionText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
});