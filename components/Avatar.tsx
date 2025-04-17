import React from 'react';
import { StyleSheet, View, Text, Image, ViewStyle } from 'react-native';
import { colors } from '@/constants/colors';

interface AvatarProps {
  source?: string;
  size?: 'small' | 'medium' | 'large' | number;
  name?: string;
  style?: ViewStyle;
  borderColor?: string;
  isGroup?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  source,
  size = 'medium',
  name,
  style,
  borderColor,
  isGroup = false,
}) => {
  // Determine the size in pixels
  let sizeValue: number;
  switch (size) {
    case 'small':
      sizeValue = 32;
      break;
    case 'medium':
      sizeValue = 48;
      break;
    case 'large':
      sizeValue = 64;
      break;
    default:
      sizeValue = size;
  }

  // Get initials from name
  const getInitials = () => {
    if (!name) return '';
    
    const nameParts = name.split(' ');
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    
    return (
      nameParts[0].charAt(0).toUpperCase() + 
      nameParts[nameParts.length - 1].charAt(0).toUpperCase()
    );
  };

  // Determine font size based on avatar size
  const fontSize = sizeValue * 0.4;

  // Determine background color based on type
  const backgroundColor = isGroup ? colors.groupLight : colors.primaryLight;
  
  // Determine text color based on type
  const textColor = isGroup ? colors.groupPrimary : colors.primary;

  return (
    <View
      style={[
        styles.container,
        {
          width: sizeValue,
          height: sizeValue,
          borderRadius: sizeValue / 2,
          borderColor: borderColor || colors.border,
          backgroundColor,
        },
        style,
      ]}
    >
      {source ? (
        <Image
          source={{ uri: source }}
          style={[
            styles.image,
            { width: sizeValue, height: sizeValue, borderRadius: sizeValue / 2 },
          ]}
        />
      ) : (
        <Text style={[
          styles.initials, 
          { fontSize, color: textColor }
        ]}>
          {getInitials()}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  initials: {
    fontWeight: '600',
  },
});