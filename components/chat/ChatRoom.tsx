import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Send, Paperclip, X, ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import ChatMessage from '@/components/ui/ChatMessage';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

type Message = {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    avatar?: string | null;
  };
  timestamp: Date;
  isCurrentUser: boolean;
  attachments?: Array<{
    type: 'image' | 'pdf';
    url: string;
    name?: string;
  }>;
};

type ChatMessage = {
  id: string;
  content: string;
  sent_at: string;
  sender_user_id: string;
  sender_role: 'student' | 'teacher';
  attachment_info: {
    type: 'image' | 'pdf';
    url: string;
    name?: string;
  } | null;
  students: {
    full_name: string;
    avatar_url: string | null;
  } | null;
  teachers: {
    full_name: string;
    avatar_url: string | null;
  } | null;
};

type ChatRoomProps = {
  chatGroupId: string;
};

export default function ChatRoom({ chatGroupId }: ChatRoomProps) {
  const { user, userRole } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<Array<{
    type: 'image' | 'pdf';
    url: string;
    name?: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  
  useEffect(() => {
    fetchMessages();
    setupRealtimeSubscription();
  }, [chatGroupId]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('chat_messages')
        .select(`
          id,
          content,
          sent_at,
          sender_user_id,
          sender_role,
          attachment_info
        `)
        .eq('chat_group_id', chatGroupId)
        .order('sent_at', { ascending: true })
        .returns<ChatMessage[]>();

      if (queryError) throw queryError;

      const formattedMessages = data.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender: {
          id: msg.sender_user_id,
          name: msg.sender_role === 'student' ? '生徒' : '講師',
          avatar: null, // 暫定的にnull
        },
        timestamp: new Date(msg.sent_at),
        isCurrentUser: msg.sender_user_id === user?.id,
        attachments: msg.attachment_info ? [msg.attachment_info] : [],
      }));

      setMessages(formattedMessages);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('メッセージの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel(`chat_messages:${chatGroupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_group_id=eq.${chatGroupId}`,
        },
        async (payload) => {
          const newMessage = payload.new;
          
          // 送信者の情報（暫定）
          const senderName = newMessage.sender_role === 'student' ? '生徒' : '講師';

          const message: Message = {
            id: newMessage.id,
            content: newMessage.content,
            sender: {
              id: newMessage.sender_user_id,
              name: senderName,
              avatar: null,
            },
            timestamp: new Date(newMessage.sent_at),
            isCurrentUser: newMessage.sender_user_id === user?.id,
            attachments: newMessage.attachment_info ? [newMessage.attachment_info] : [],
          };

          setMessages(prev => [...prev, message]);
          
          // スクロールを最下部に移動
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const handleSend = async () => {
    if ((inputText.trim() === '' && attachments.length === 0) || !user) return;

    try {
      setSending(true);

      // 添付ファイルがある場合はSupabase Storageにアップロード
      let attachmentInfo = null;
      if (attachments.length > 0) {
        const attachment = attachments[0];
        const file = await fetch(attachment.url);
        const blob = await file.blob();
        
        const fileExt = attachment.type === 'image' ? 'jpg' : 'pdf';
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `chat-attachments/${chatGroupId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('chat-files')
          .upload(filePath, blob);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('chat-files')
          .getPublicUrl(filePath);

        attachmentInfo = {
          type: attachment.type,
          url: publicUrl,
          name: attachment.name,
        };
      }

      // メッセージを保存
      const { error: insertError } = await supabase
        .from('chat_messages')
        .insert({
          chat_group_id: chatGroupId,
          content: inputText.trim(),
          sender_user_id: user.id,
          sender_role: userRole,
          attachment_info: attachmentInfo,
        });

      if (insertError) throw insertError;

      // 入力欄をクリア
      setInputText('');
      setAttachments([]);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('メッセージの送信に失敗しました');
    } finally {
      setSending(false);
    }
  };

  const handleAttachFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      const fileSize = file.size || 0;

      if (fileSize > 10 * 1024 * 1024) { // 10MB
        setError('ファイルサイズは10MB以下にしてください');
        return;
      }

      const type = file.mimeType?.startsWith('image/') ? 'image' : 'pdf';
      setAttachments([{
        type,
        url: file.uri,
        name: file.name,
      }]);
    } catch (err) {
      console.error('Error picking file:', err);
      setError('ファイルの選択に失敗しました');
    }
  };

  const removeAttachment = (index: number) => {
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };

  const handleAttachmentPress = (url: string, type: string) => {
    // ファイルを開く処理（必要に応じて実装）
    console.log(`Opening ${type} file:`, url);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>チャット</Text>
      </View>
      
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
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

      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.attachButton}
          onPress={handleAttachFile}
          disabled={sending}
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
          editable={!sending}
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            (inputText.trim() === '' && attachments.length === 0) && styles.sendButtonDisabled
          ]}
          onPress={handleSend}
          disabled={inputText.trim() === '' && attachments.length === 0 || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Send size={20} color="#FFFFFF" />
          )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
  },
  chatContainer: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    textAlign: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
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
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
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