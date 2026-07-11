import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { AIStackParamList } from "../../navigation/types";
import { Ionicons } from "@expo/vector-icons";
import {
  ChatService,
  Conversation,
  Message,
} from "../../services/chat/ChatService";
import { fileRepository } from "../../repository/FileRepository";

type ChatScreenRouteProp = RouteProp<AIStackParamList, "AIChat">;

export const ChatScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<ChatScreenRouteProp>();
  const { fileId } = route.params;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<
    number | null
  >(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showConversationList, setShowConversationList] = useState(false);
  const [fileName, setFileName] = useState<string>("");

  const chatService = new ChatService();
  const flatListRef = useRef<FlatList>(null);

  // Load file name
  useEffect(() => {
    const loadFileName = async () => {
      try {
        const file = await fileRepository.getFileById(fileId);
        if (file) setFileName(file.name);
      } catch (error) {
        console.warn("Failed to load file name:", error);
      }
    };
    loadFileName();
  }, [fileId]);

  // Load conversations
  const loadConversations = async () => {
    try {
      const convs = await chatService.getConversations(fileId);
      setConversations(convs);
      if (convs.length > 0) {
        // Load the most recent conversation
        setCurrentConversationId(convs[0].id!);
        await loadMessages(convs[0].id!);
      } else {
        // Create a new conversation
        const newId = await chatService.createConversation(fileId);
        setCurrentConversationId(newId);
        setMessages([]);
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
      Alert.alert("Error", "Could not load conversations.");
    }
  };

  const loadMessages = async (conversationId: number) => {
    try {
      const msgs = await chatService.getMessages(conversationId);
      setMessages(msgs);
    } catch (error) {
      console.error("Failed to load messages:", error);
      Alert.alert("Error", "Could not load messages.");
    }
  };

  const refreshAll = async () => {
    setIsRefreshing(true);
    await loadConversations();
    setIsRefreshing(false);
  };

  useEffect(() => {
    refreshAll();
  }, [fileId]);

  const sendMessage = async () => {
    if (!inputText.trim() || !currentConversationId) return;
    const userMsg = inputText.trim();
    setInputText("");
    // Optimistically add user message
    const userMessage: Message = { role: "user", content: userMsg };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    try {
      const result = await chatService.sendMessage(
        currentConversationId,
        userMsg,
      );
      // Add assistant message
      const assistantMessage: Message = {
        role: "assistant",
        content: result.response,
        citations: result.citations,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      // Update conversation list (update updatedAt)
      await loadConversations();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to get response.");
      // Remove the optimistic user message
      setMessages((prev) =>
        prev.filter((_, index) => index !== prev.length - 1),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const startNewConversation = async () => {
    try {
      const newId = await chatService.createConversation(fileId);
      setCurrentConversationId(newId);
      setMessages([]);
      setShowConversationList(false);
      await loadConversations();
    } catch (error) {
      console.error("Failed to create conversation:", error);
      Alert.alert("Error", "Could not create new conversation.");
    }
  };

  const switchConversation = async (conversationId: number) => {
    setCurrentConversationId(conversationId);
    await loadMessages(conversationId);
    setShowConversationList(false);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === "user";
    return (
      <View
        style={[
          styles.messageRow,
          isUser ? styles.userRow : styles.assistantRow,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            {
              backgroundColor: isUser
                ? theme.colors.primary
                : theme.colors.surface,
              borderColor: isUser ? theme.colors.primary : theme.colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.messageText,
              { color: isUser ? "white" : theme.colors.text },
            ]}
          >
            {item.content}
          </Text>
          {item.citations && item.citations.length > 0 && (
            <View style={styles.citationsContainer}>
              {item.citations.map((cit, idx) => (
                <Text
                  key={idx}
                  style={[
                    styles.citationText,
                    { color: isUser ? "#ddd" : theme.colors.primary },
                  ]}
                >
                  📄 Page {cit.page}
                </Text>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={[
        styles.convItem,
        currentConversationId === item.id && {
          backgroundColor: theme.colors.primarySurface,
        },
      ]}
      onPress={() => switchConversation(item.id!)}
    >
      <View style={styles.convItemContent}>
        <Text
          style={[styles.convTitle, { color: theme.colors.text }]}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <Text style={[styles.convMeta, { color: theme.colors.textSecondary }]}>
          {item.messageCount || 0} messages ·{" "}
          {new Date(item.updatedAt!).toLocaleDateString()}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => {
          Alert.alert(
            "Delete Conversation",
            "Are you sure you want to delete this conversation?",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                  // We'll need a delete method in ChatService – for now, just remove from list.
                  // In a full implementation, add chatService.deleteConversation(id)
                },
              },
            ],
          );
        }}
      >
        <Ionicons
          name="trash-outline"
          size={20}
          color={theme.colors.iconSecondary}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerCenter}
          onPress={() => setShowConversationList(!showConversationList)}
        >
          <Text
            style={[styles.headerTitle, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            {fileName || "Chat"}
          </Text>
          <Ionicons
            name={showConversationList ? "chevron-up" : "chevron-down"}
            size={20}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={startNewConversation}
          style={styles.headerButton}
        >
          <Ionicons
            name="add-circle-outline"
            size={28}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Conversation List Dropdown */}
      {showConversationList && (
        <View
          style={[
            styles.conversationList,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id!.toString()}
            renderItem={renderConversationItem}
            ItemSeparatorComponent={() => <View style={styles.convSeparator} />}
            contentContainerStyle={styles.convListContent}
          />
        </View>
      )}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshAll}
            tintColor={theme.colors.primary}
          />
        }
      />

      {/* Input Bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View
          style={[
            styles.inputContainer,
            { borderTopColor: theme.colors.border },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
              },
            ]}
            placeholder="Ask a question about the document..."
            placeholderTextColor={theme.colors.textPlaceholder}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={2000}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Ionicons name="send" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 8,
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    marginHorizontal: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginRight: 4,
    maxWidth: "80%",
  },
  conversationList: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    zIndex: 10,
    borderBottomWidth: 1,
    maxHeight: 250,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  convListContent: {
    paddingVertical: 8,
  },
  convItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  convItemContent: {
    flex: 1,
    marginRight: 8,
  },
  convTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  convMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  convSeparator: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 16,
  },
  messageList: {
    padding: 16,
    paddingBottom: 20,
    flexGrow: 1,
  },
  messageRow: {
    marginBottom: 12,
    flexDirection: "row",
  },
  userRow: {
    justifyContent: "flex-end",
  },
  assistantRow: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "85%",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  citationsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  citationText: {
    fontSize: 12,
    marginRight: 8,
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 8,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 120,
    marginRight: 8,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
