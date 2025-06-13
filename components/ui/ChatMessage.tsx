import React from 'react';
import { View, Text, StyleSheet, Image, Pressable, Linking, Alert } from 'react-native';
import { FileText, Download } from 'lucide-react-native';
import Autolink from 'react-native-autolink';

interface ChatMessageProps {
  message: {
    id: string;
    content: string;
    sender: {
      id: string;
      name: string;
      avatar?: string;
    };
    timestamp: Date;
    isCurrentUser: boolean;
    attachments?: Array<{
      type: 'image' | 'pdf';
      url: string;
      name?: string;
    }>;
  };
  onAttachmentPress?: (url: string, type: string) => void;
}

export default function ChatMessage({ message, onAttachmentPress }: ChatMessageProps) {
  // Format time as HH:MM
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  // Handle URL press
  const handleUrlPress = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('エラー', 'このURLを開くことができません');
      }
    } catch (err) {
      // エラーはAlertで表示するため、console.errorは削除
      Alert.alert('エラー', 'URLを開く際にエラーが発生しました');
    }
  };
  
  return (
    <View style={[
      styles.container,
      message.isCurrentUser ? styles.currentUser : styles.otherUser
    ]}>
      {!message.isCurrentUser && (
        <View style={styles.avatarContainer}>
          {message.sender.avatar ? (
            <Image
              source={{ uri: message.sender.avatar }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {message.sender.name.charAt(0)}
              </Text>
            </View>
          )}
        </View>
      )}
      
      <View style={styles.contentColumn}>
        {!message.isCurrentUser && (
          <Text style={styles.senderName}>{message.sender.name}</Text>
        )}
        
        <View style={[
          styles.bubble,
          message.isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble
        ]}>
          <Autolink
            text={message.content}
            style={[
              styles.messageText,
              message.isCurrentUser ? styles.currentUserText : styles.otherUserText
            ]}
            linkStyle={[
              styles.linkText,
              message.isCurrentUser ? styles.currentUserLink : styles.otherUserLink
            ]}
            onPress={handleUrlPress}
          />
          
          {message.attachments && message.attachments.length > 0 && (
            <View style={styles.attachmentsContainer}>
              {message.attachments.map((attachment, index) => (
                <Pressable
                  key={index}
                  style={styles.attachment}
                  onPress={() => onAttachmentPress?.(attachment.url, attachment.type)}
                >
                  {attachment.type === 'image' ? (
                    <Image
                      source={{ uri: attachment.url }}
                      style={styles.attachmentImage}
                    />
                  ) : (
                    <View style={styles.pdfAttachment}>
                      <FileText size={20} color="#F97316" />
                      <Text style={styles.pdfName} numberOfLines={1}>
                        {attachment.name || 'Document.pdf'}
                      </Text>
                      <Download size={16} color="#64748B" />
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          )}
        </View>
        
        <Text style={styles.timestamp}>{formatTime(message.timestamp)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '90%',
  },
  currentUser: {
    alignSelf: 'flex-end',
  },
  otherUser: {
    alignSelf: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    backgroundColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  contentColumn: {
    flex: 1,
  },
  senderName: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  bubble: {
    borderRadius: 16,
    padding: 12,
    maxWidth: '100%',
  },
  currentUserBubble: {
    backgroundColor: '#3B82F6',
    borderBottomRightRadius: 2,
  },
  otherUserBubble: {
    backgroundColor: '#F1F5F9',
    borderBottomLeftRadius: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  currentUserText: {
    color: '#FFFFFF',
  },
  otherUserText: {
    color: '#1E293B',
  },
  timestamp: {
    fontSize: 10,
    color: '#94A3B8',
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  attachmentsContainer: {
    marginTop: 8,
  },
  attachment: {
    marginTop: 4,
  },
  attachmentImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
  },
  pdfAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 8,
  },
  pdfName: {
    flex: 1,
    marginHorizontal: 8,
    fontSize: 12,
    color: '#1E293B',
  },
  linkText: {
    textDecorationLine: 'underline',
  },
  currentUserLink: {
    color: '#BFDBFE', // 水色系の明るい色
  },
  otherUserLink: {
    color: '#3B82F6', // 青色
  },
});