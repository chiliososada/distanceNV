import React, { useRef, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  Platform,
  Share,
  Dimensions,
  Alert,
  TextInput,
  Clipboard
} from 'react-native';
import { X, Share2, Copy, Check } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { User } from '@/types/auth';
import { Button } from './Button';
import QRCode from 'react-native-qrcode-svg';

interface ProfileQRCodeProps {
  user: User;
  visible: boolean;
  onClose: () => void;
}

export const ProfileQRCode: React.FC<ProfileQRCodeProps> = ({
  user,
  visible,
  onClose
}) => {
  const profileUrl = `https://localtalks.app/profile/${user.id}`;
  const qrSize = Math.min(Dimensions.get('window').width * 0.7, 250);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showManualCopy, setShowManualCopy] = useState(false);
  const textInputRef = useRef<TextInput>(null);
  
  const handleShare = async () => {
    try {
      if (Platform.OS === 'web') {
        // Web sharing
        if (navigator.share) {
          try {
            await navigator.share({
              title: `${user.displayName}'s Profile`,
              text: `Check out ${user.displayName}'s profile on LocalTalks!`,
              url: profileUrl
            });
          } catch (error: any) {
            console.log('Share error:', error);
            // Only show error for non-abort errors
            if (error.name !== 'AbortError') {
              handleCopyToClipboard();
            }
          }
        } else {
          // Fallback for browsers that don't support Web Share API
          handleCopyToClipboard();
        }
      } else {
        // Native sharing
        const shareMessage = `Check out ${user.displayName}'s profile on LocalTalks!

${profileUrl}`;
        
        await Share.share({
          message: shareMessage,
          url: Platform.OS === 'ios' ? profileUrl : undefined,
          title: `${user.displayName}'s Profile`
        });
      }
    } catch (error) {
      console.error('Error sharing profile:', error);
      // Fallback to clipboard if sharing fails
      handleCopyToClipboard();
    }
  };
  
  const handleCopyToClipboard = () => {
    const textToCopy = `${user.displayName}'s profile: ${profileUrl}`;
    
    if (Platform.OS === 'web') {
      // Web clipboard - try multiple approaches
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToCopy)
          .then(() => {
            showCopySuccess();
          })
          .catch(err => {
            console.error('Failed to copy with modern API: ', err);
            // Try fallback method
            copyWithFallback(textToCopy);
          });
      } else {
        // Fallback for older browsers
        copyWithFallback(textToCopy);
      }
    } else {
      // React Native clipboard
      Clipboard.setString(textToCopy);
      showCopySuccess();
    }
  };
  
  const copyWithFallback = (text: string) => {
    try {
      // Create temporary input element
      const textArea = document.createElement('textarea');
      textArea.value = text;
      
      // Make it invisible but part of the document
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      
      // Select and copy
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        showCopySuccess();
      } else {
        // If all else fails, show manual copy UI
        setShowManualCopy(true);
      }
    } catch (err) {
      console.error('Fallback copy failed:', err);
      // Last resort - show manual copy UI
      setShowManualCopy(true);
    }
  };
  
  const showCopySuccess = () => {
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };
  
  const selectManualText = () => {
    if (textInputRef.current) {
      textInputRef.current.focus();
      textInputRef.current.setNativeProps({ selection: { start: 0, end: profileUrl.length } });
    }
  };
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          
          <Text style={styles.title}>{user.displayName}'s Profile</Text>
          <Text style={styles.subtitle}>Scan to view profile</Text>
          
          <View style={styles.qrContainer}>
            {Platform.OS !== 'web' ? (
              <QRCode
                value={profileUrl}
                size={qrSize}
                color={colors.text}
                backgroundColor="white"
                logo={user.avatar ? { uri: user.avatar } : undefined}
                logoSize={qrSize * 0.2}
                logoBackgroundColor="white"
                logoBorderRadius={qrSize * 0.1}
              />
            ) : (
              <View style={[styles.webQrPlaceholder, { width: qrSize, height: qrSize }]}>
                <Text style={styles.webQrText}>QR Code</Text>
                <Text style={styles.webQrSubtext}>(Not available in web preview)</Text>
              </View>
            )}
          </View>
          
          {showManualCopy ? (
            <View style={styles.manualCopyContainer}>
              <Text style={styles.manualCopyLabel}>Copy this link manually:</Text>
              <TouchableOpacity onPress={selectManualText} style={styles.manualCopyInputContainer}>
                <TextInput
                  ref={textInputRef}
                  value={profileUrl}
                  style={styles.manualCopyInput}
                  selectTextOnFocus
                  onFocus={selectManualText}
                />
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.profileUrl}>{profileUrl}</Text>
          )}
          
          <View style={styles.buttonContainer}>
            <Button
              title="Share Profile"
              onPress={handleShare}
              icon={<Share2 size={18} color="white" />}
              iconPosition="left"
              style={styles.shareButton}
            />
            
            <Button
              title={copySuccess ? "Copied!" : "Copy Link"}
              onPress={handleCopyToClipboard}
              icon={copySuccess ? <Check size={18} color="white" /> : <Copy size={18} color="white" />}
              iconPosition="left"
              style={styles.copyButton}
              variant={copySuccess ? "success" : "secondary"}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  qrContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  webQrPlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  webQrText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  webQrSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  profileUrl: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  shareButton: {
    width: '100%',
  },
  copyButton: {
    width: '100%',
  },
  manualCopyContainer: {
    width: '100%',
    marginBottom: 24,
  },
  manualCopyLabel: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  manualCopyInputContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 8,
    backgroundColor: colors.card,
  },
  manualCopyInput: {
    color: colors.text,
    fontSize: 14,
    padding: 4,
  },
});