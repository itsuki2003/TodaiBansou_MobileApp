import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Check } from 'lucide-react-native';

export interface TaskItemProps {
  title: string;
  isCompleted: boolean;
  onToggle: (isCompleted: boolean) => void;
}

export default function TaskItem({ title, isCompleted, onToggle }: TaskItemProps) {
  return (
    <TouchableOpacity
      style={[styles.container, isCompleted && styles.completedContainer]}
      onPress={() => onToggle(!isCompleted)}
    >
      <View style={[styles.checkbox, isCompleted && styles.completedCheckbox]}>
        {isCompleted && <Check size={16} color="#fff" />}
      </View>
      <Text style={[styles.title, isCompleted && styles.completedTitle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  completedContainer: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3B82F6',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedCheckbox: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  title: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  completedTitle: {
    color: '#059669',
    textDecorationLine: 'line-through',
  },
});