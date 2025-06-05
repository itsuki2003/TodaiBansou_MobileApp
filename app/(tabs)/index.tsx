import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Animated,
} from 'react-native';
import DateHeader from '@/components/ui/DateHeader';
import TaskItem from '@/components/ui/TaskItem';
import TeacherComment from '@/components/ui/TeacherComment';

// Mock data for demonstration
const MOCK_TASKS = [
  { id: '1', content: '算数: 図形の問題 10問', completed: false },
  { id: '2', content: '国語: 漢字の練習 20分', completed: false },
  { id: '3', content: '理科: 植物の成長についてノートまとめ', completed: false },
  { id: '4', content: '社会: 歴史年表の暗記', completed: false },
];

const MOCK_TEACHER_COMMENT = "今日もよく頑張りましたね！算数の図形問題は少し難しかったかもしれませんが、解き方のパターンをしっかり覚えておくと良いでしょう。国語は漢字を書く際に、筆順にも気をつけて練習してくださいね。来週のテストに向けて、計画的に復習を進めていきましょう。何か質問があればいつでも聞いてください！";

export default function HomeScreen() {
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [comment, setComment] = useState(MOCK_TEACHER_COMMENT);
  const [celebrateTask, setCelebrateTask] = useState<string | null>(null);
  
  // Animation for celebration
  const celebrationOpacity = React.useRef(new Animated.Value(0)).current;
  const celebrationScale = React.useRef(new Animated.Value(0.5)).current;
  
  const handleTaskToggle = (taskId: string) => {
    setTasks(currentTasks => 
      currentTasks.map(task => 
        task.id === taskId 
          ? { ...task, completed: !task.completed }
          : task
      )
    );
    
    // Find the task that was toggled
    const task = tasks.find(t => t.id === taskId);
    
    // If the task is being marked as completed, show celebration
    if (task && !task.completed) {
      setCelebrateTask(taskId);
      
      // Animate celebration
      Animated.sequence([
        Animated.parallel([
          Animated.timing(celebrationOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(celebrationScale, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(1000),
        Animated.timing(celebrationOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCelebrateTask(null);
        celebrationScale.setValue(0.5);
      });
    }
  };
  
  // Get celebration messages
  const getCelebrationMessage = () => {
    const messages = [
      'クリア！',
      'よくできました！',
      'すごい！',
      'がんばりました！',
      'えらいね！'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>東大伴走</Text>
      </View>
      
      <DateHeader date={new Date()} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>今日のやること</Text>
          
          {tasks.length === 0 ? (
            <Text style={styles.emptyText}>今日のタスクはありません</Text>
          ) : (
            tasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={handleTaskToggle}
              />
            ))
          )}
        </View>
        
        <TeacherComment comment={comment} />
      </ScrollView>
      
      {/* Celebration overlay */}
      {celebrateTask && (
        <Animated.View 
          style={[
            styles.celebrationOverlay,
            {
              opacity: celebrationOpacity,
              transform: [{ scale: celebrationScale }],
            }
          ]}
        >
          <Text style={styles.celebrationText}>
            {getCelebrationMessage()}
          </Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3B82F6',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#94A3B8',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  celebrationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  celebrationText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#3B82F6',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});