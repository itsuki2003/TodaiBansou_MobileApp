import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Send, Paperclip, X } from 'lucide-react-native';
import ChatMessage from '@/components/ui/ChatMessage';

// Mock data for demonstration
const MOCK_MESSAGES = [
  {
    id: '1',
    content: 'こんにちは、山田さん。昨日の授業お疲れ様でした。',
    sender: {
      id: 'teacher1',
      name: '田中先生',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    },
    timestamp: new Date(2023, 5, 29, 18, 30),
    isCurrentUser: false,
    attachments: [],
  },
  {
    id: '2',
    content: 'ありがとうございます。少し難しかったのですが、家で復習しました。',
    sender: {
      id: 'student1',
      name: '山田太郎',
    },
    timestamp: new Date(2023, 5, 29, 19, 15),
    isCurrentUser: true,
    attachments: [],
  },
  {
    id: '3',
    content: 'それはよかったです。解き方のポイントをまとめたプリントを添付しておきますね。',
    sender: {
      id: 'teacher1',
      name: '田中先生',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    },
    timestamp: new Date(2023, 5, 29, 19, 30),
    isCurrentUser: false,
    attachments: [
      {
        type: 'pdf',
        url: 'https://example.com/math-tips.pdf',
        name: '算数_解き方のポイント.pdf',
      },
    ],
  },
  {
    id: '4',
    content: '先生、自分で問題を解いてみました。確認していただけますか？',
    sender: {
      id: 'student1',
      name: '山田太郎',
    },
    timestamp: new Date(2023, 5, 30, 14, 20),
    isCurrentUser: true,
    attachments: [
      {
        type: 'image',
        url: 'https://images.pexels.com/photos/4260477/pexels-photo-4260477.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      },
    ],
  },
  {
    id: '5',
    content: '拝見しました。問題3に少し計算ミスがありますが、それ以外はとても良くできています。計算の過程をもう少し丁寧に書くと良いでしょう。',
    sender: {
      id: 'teacher1',
      name: '田中先生',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    },
    timestamp: new Date(2023, 5, 30, 15, 5),
    isCurrentUser: false,
    attachments: [],
  },
];

export default function ChatScreen() {
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<Array<{
    type: 'image' | 'pdf';
    url: string;
    name?: string;
  }>>([]);
  
  const scrollViewRef = useRef<ScrollView>(null);
  
  const handleSend = () => {
    if (inputText.trim() === '' && attachments.length === 0) return;
    
    const newMessage = {
      id: `${messages.length + 1}`,
      content: inputText.trim(),
      sender: {
        id: 'student1',
        name: '山田太郎',
      },
      timestamp: new Date(),
      isCurrentUser: true,
      attachments: attachments,
    };
    
    setMessages([...messages, newMessage]);
    setInputText('');
    setAttachments([]);
    
    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };
  
  const handleAttachFile = () => {
    // In a real app, this would open a file picker
    // For demo purposes, just add a mock attachment
    const mockAttachments = [
      {
        type: 'image' as const,
        url: 'https://images.pexels.com/photos/4260325/pexels-photo-4260325.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      },
      {
        type: 'pdf' as const,
        url: 'https://example.com/document.pdf',
        name: '自習ノート.pdf',
      },
    ];
    
    // Just add one random attachment for demo
    const randomAttachment = mockAttachments[Math.floor(Math.random() * mockAttachments.length)];
    setAttachments([...attachments, randomAttachment]);
  };
  
  const removeAttachment = (index: number) => {
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };
  
  const handleAttachmentPress = (url: string, type: string) => {
    // In a real app, this would open the attachment
    alert(`${type === 'image' ? '画像' : 'PDF'} を開きます: ${url}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>チャット</Text>
      </View>
      
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            onAttachmentPress={handleAttachmentPress}
          />
        ))}
      </ScrollView>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        {attachments.length > 0 && (
          <View style={styles.attachmentsPreview}>
            {attachments.map((attachment, index) => (
              <View key={index} style={styles.attachmentPreview}>
                {attachment.type === 'image' ? (
                  <Image
                    source={{ uri: attachment.url }}
                    style={styles.attachmentImage}
                  />
                ) : (
                  <View style={styles.pdfPreview}>
                    <Text style={styles.pdfName} numberOfLines={1}>
                      {attachment.name || 'Document.pdf'}
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.removeAttachment}
                  onPress={() => removeAttachment(index)}
                >
                  <X size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        
        <View style={styles.inputRow}>
          <TouchableOpacity
            style={styles.attachButton}
            onPress={handleAttachFile}
          >
            <Paperclip size={20} color="#64748B" />
          </TouchableOpacity>
          
          <TextInput
            style={styles.input}
            placeholder="メッセージを入力..."
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
          />
          
          <TouchableOpacity
            style={[
              styles.sendButton,
              (inputText.trim() === '' && attachments.length === 0) && styles.sendButtonDisabled
            ]}
            onPress={handleSend}
            disabled={inputText.trim() === '' && attachments.length === 0}
          >
            <Send size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  attachmentsPreview: {
    padding: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  attachmentPreview: {
    marginRight: 8,
    marginBottom: 8,
    position: 'relative',
  },
  attachmentImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  pdfPreview: {
    width: 100,
    height: 40,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  pdfName: {
    fontSize: 12,
    color: '#1E293B',
  },
  removeAttachment: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    padding: 8,
    alignItems: 'flex-end',
  },
  attachButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    maxHeight: 100,
    marginHorizontal: 8,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#3B82F6',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
});