import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface BirthdayCardProps {
  firstName: string;
  lastName: string;
  daysUntil: number;
  onPress?: () => void;
  colors: any;
}

const getBirthdayColor = (daysUntil: number) => {
  if (daysUntil === 0) return '#DC2626'; // Today - Red
  if (daysUntil === 1) return '#D97706'; // Tomorrow - Orange
  if (daysUntil <= 7) return '#F59E0B'; // This week - Amber
  return '#8B5CF6'; // Later - Purple
};

const getBirthdayLabel = (daysUntil: number) => {
  if (daysUntil === 0) return 'Today';
  if (daysUntil === 1) return 'Tomorrow';
  if (daysUntil <= 7) return `This week`;
  return `${daysUntil} days away`;
};

export const BirthdayCard: React.FC<BirthdayCardProps> = ({
  firstName,
  lastName,
  daysUntil,
  onPress,
  colors,
}) => {
  const styles = createStyles(colors);
  const bgColor = getBirthdayColor(daysUntil);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.container}
    >
      <View style={[styles.indicator, { backgroundColor: bgColor }]} />
      <View style={styles.content}>
        <Text style={styles.name}>🎂 {firstName} {lastName}</Text>
        <Text style={[styles.label, { color: bgColor }]}>
          {getBirthdayLabel(daysUntil)}
        </Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.white,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    indicator: {
      width: 4,
      height: '100%',
      borderRadius: 2,
      marginRight: 12,
    },
    content: {
      flex: 1,
    },
    name: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.gray[800],
      marginBottom: 2,
    },
    label: {
      fontSize: 12,
      fontWeight: '500',
    },
    arrow: {
      fontSize: 24,
      color: colors.gray[400],
    },
  });
