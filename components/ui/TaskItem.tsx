import React from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Check } from 'lucide-react-native';

interface TaskItemProps {
  task: {
    id: string;
    content: string;
    completed: boolean;
  };
  onToggle: (id: string) => void;
}

export default function TaskItem({ task, onToggle }: TaskItemProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  
  const handleToggle = () => {
    // Animate the task when completed
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    onToggle(task.id);
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        { transform: [{ scale: scaleAnim }] }
      ]}
    >
      <Pressable
        style={styles.checkboxContainer}
        onPress={handleToggle}
        hitSlop={10}
      >
        <View style={[
          styles.checkbox,
          task.completed && styles.checkboxCompleted
        ]}>
          {task.completed && <Check size={16} color="#FFFFFF" />}
        </View>
      </Pressable>
      <Text style={[
        styles.text,
        task.completed && styles.textCompleted
      ]}>
        {task.content}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#3B82F6',
  },
  text: {
    fontSize: 16,
    flex: 1,
    color: '#1E293B',
  },
  textCompleted: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
});