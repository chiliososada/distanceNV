import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity 
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useLanguageStore } from '@/store/language-store';

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const { translate } = useLanguageStore();
  
  const handleBack = () => {
    router.back();
  };
  
  return (
    <>
      <Stack.Screen 
        options={{
          title: translate('privacyPolicy'),
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
        
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>{translate('privacyPolicy')}</Text>
          <Text style={styles.date}>Last Updated: June 15, 2023</Text>
          
          <Text style={styles.sectionTitle}>1. Introduction</Text>
          <Text style={styles.paragraph}>
            Welcome to our Privacy Policy. This document explains how we collect, use, and protect your personal information when you use our application.
          </Text>
          
          <Text style={styles.sectionTitle}>2. Data We Collect</Text>
          <Text style={styles.paragraph}>
            We may collect the following types of information when you use our application:
          </Text>
          <Text style={styles.listItem}>• Identity Data: name, username, and profile information</Text>
          <Text style={styles.listItem}>• Contact Data: email address and phone number</Text>
          <Text style={styles.listItem}>• Technical Data: device information, IP address, and app usage data</Text>
          <Text style={styles.listItem}>• Location Data: geographic location (if permitted)</Text>
          <Text style={styles.listItem}>• Content Data: messages, posts, and other content you create</Text>
          
          <Text style={styles.sectionTitle}>3. How We Use Your Data</Text>
          <Text style={styles.paragraph}>
            We use your personal information for the following purposes:
          </Text>
          <Text style={styles.listItem}>• To provide and maintain our service</Text>
          <Text style={styles.listItem}>• To notify you about changes to our service</Text>
          <Text style={styles.listItem}>• To allow you to participate in interactive features</Text>
          <Text style={styles.listItem}>• To provide customer support</Text>
          <Text style={styles.listItem}>• To gather analysis or valuable information</Text>
          <Text style={styles.listItem}>• To monitor the usage of our service</Text>
          <Text style={styles.listItem}>• To detect, prevent and address technical issues</Text>
          
          <Text style={styles.sectionTitle}>4. Location Data</Text>
          <Text style={styles.paragraph}>
            Our application uses location data to enhance your experience in the following ways:
          </Text>
          <Text style={styles.listItem}>• To show you relevant content based on your location</Text>
          <Text style={styles.listItem}>• To connect you with nearby users and events</Text>
          <Text style={styles.listItem}>• To display distance information</Text>
          <Text style={styles.paragraph}>
            You can disable location services at any time through your device settings, but this may limit certain features of our application.
          </Text>
          
          <Text style={styles.sectionTitle}>5. Data Security</Text>
          <Text style={styles.paragraph}>
            We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
          </Text>
          
          <Text style={styles.sectionTitle}>6. Your Legal Rights</Text>
          <Text style={styles.paragraph}>
            Depending on your location, you may have the following rights regarding your personal information:
          </Text>
          <Text style={styles.listItem}>• Request access to your personal data</Text>
          <Text style={styles.listItem}>• Request correction of your personal data</Text>
          <Text style={styles.listItem}>• Request erasure of your personal data</Text>
          <Text style={styles.listItem}>• Object to processing of your personal data</Text>
          <Text style={styles.listItem}>• Request restriction of processing your personal data</Text>
          <Text style={styles.listItem}>• Request transfer of your personal data</Text>
          <Text style={styles.listItem}>• Right to withdraw consent</Text>
          
          <Text style={styles.sectionTitle}>7. Contact Us</Text>
          <Text style={styles.paragraph}>
            If you have any questions about this Privacy Policy, please contact us at:
          </Text>
          <Text style={styles.contact}>privacy@nearbyapp.com</Text>
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
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 16,
  },
  listItem: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 8,
    paddingLeft: 16,
  },
  contact: {
    fontSize: 16,
    color: colors.primary,
    marginTop: 8,
    fontWeight: '500',
  },
});