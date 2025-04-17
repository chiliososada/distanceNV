import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';
import { useLanguageStore } from '@/store/language-store';

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { translate } = useLanguageStore();
  
  // Map route names to translation keys
  const getTabLabel = (routeName: string) => {
    switch (routeName) {
      case 'index': return 'home';
      case 'explore': return 'explore';
      case 'create': return 'create';
      case 'chat': return 'chat';
      case 'profile': return 'profile';
      default: return routeName;
    }
  };

  return (
    <View style={[
      styles.container, 
      { paddingBottom: Platform.OS === 'ios' ? insets.bottom : 10 }
    ]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = getTabLabel(route.name);
        
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TouchableOpacity
            key={index}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            // Removed the tabBarTestID reference that was causing the error
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tab}
          >
            <View style={styles.tabContent}>
              {options.tabBarIcon && 
                options.tabBarIcon({ 
                  focused: isFocused, 
                  color: isFocused ? colors.primary : colors.textSecondary, 
                  size: 24 
                })
              }
              <Text style={[
                styles.label,
                { color: isFocused ? colors.primary : colors.textSecondary }
              ]}>
                {translate(label as any)}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});