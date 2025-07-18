import { useChatStore } from "../store/useChatStore";
import { useState, useEffect, useRef } from "react";
import { Edit, Trash2 } from "lucide-react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import axios from "axios";

const EMOJI_LIST = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😍", "🥰", "😘", "😗", "😚", "😙", "😋", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🥵", "🥶", "🥴", "😵", "🤯", "🤠", "🥳", "😎", "🤓", "🧐", "😕", "😟", "🙁", "☹️", "😮", "😯", "😲", "😳", "🥺", "😦", "😧", "😨", "😰", "😥", "😢", "😭", "😱", "😖", "😣", "😞", "😓", "😩", "😫", "🥱", "😤", "😡", "😠", "🤬", "😈", "👿", "💀", "☠️", "💩", "🤡", "👹", "👺", "👻", "👽", "👾", "🤖", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾", "👍", "👎", "👏", "🙏", "💪", "👋", "🤙", "💖", "❤️", "💔", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟"
];

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    deleteMessage,
    editMessage,
  } = useChatStore();
  const { authUser, socket } = useAuthStore();
  const [isTyping, setIsTyping] = useState(false);
  const messageEndRef = useRef(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [openEmojiPicker, setOpenEmojiPicker] = useState(null); // messageId or null
  const [optimisticReactions, setOptimisticReactions] = useState({}); // { [messageId]: reactions[] }

  useEffect(() => {
    getMessages(selectedUser._id);

    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (!socket || !selectedUser) return;
    const handleTyping = ({ senderId }) => {
      if (senderId === selectedUser._id) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 1500);
      }
    };
    socket.on("typing", handleTyping);
    return () => socket.off("typing", handleTyping);
  }, [socket, selectedUser]);

  // Add reaction handler (optimistic update)
  const handleReact = async (message, emoji) => {
    const messageId = message._id;
    const userId = authUser._id;
    // Optimistically update reactions
    let newReactions;
    const currentReactions = optimisticReactions[messageId] || message.reactions || [];
    const existingIndex = currentReactions.findIndex(
      (r) => r.emoji === emoji && r.userId === userId
    );
    if (existingIndex > -1) {
      // Remove reaction
      newReactions = [
        ...currentReactions.slice(0, existingIndex),
        ...currentReactions.slice(existingIndex + 1),
      ];
    } else {
      // Add reaction
      newReactions = [...currentReactions, { emoji, userId }];
    }
    setOptimisticReactions((prev) => ({ ...prev, [messageId]: newReactions }));
    setOpenEmojiPicker(null);
    try {
      await axios.post(
        `/api/messages/${messageId}/react`,
        { emoji },
        { withCredentials: true }
      );
      // Refetch messages to get the latest reactions from the backend
      getMessages(selectedUser._id);
    } catch (error) {
      // Revert on error
      setOptimisticReactions((prev) => ({ ...prev, [messageId]: currentReactions }));
      console.error("Failed to react to message", error);
    }
  };

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto bg-base-200 sm:bg-base-100 min-w-0">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4 min-w-0">
        {messages.map((message) => {
          const reactions = optimisticReactions[message._id] || message.reactions || [];
          return (
            <div
              key={message._id}
              className={`chat ${message.senderId === authUser._id ? "chat-start" : "chat-end"} min-w-0`}
              ref={messageEndRef}
            >
              <div className=" chat-image avatar min-w-0">
                <div className="size-8 sm:size-10 rounded-full border min-w-0">
                  <img
                    src={
                      message.senderId === authUser._id
                        ? authUser.profilePic || "/avatar.png"
                        : selectedUser.profilePic || "/avatar.png"
                    }
                    alt="profile pic"
                  />
                </div>
              </div>
              <div className="chat-header mb-1 flex items-center gap-2 text-xs sm:text-sm min-w-0">
                <time className="opacity-50 ml-1">
                  {formatMessageTime(message.createdAt)}
                </time>
                {message.senderId === authUser._id && (
                  <>
                    <button
                      className="ml-2 text-xs text-blue-500 hover:text-blue-700"
                      onClick={() => {
                        setEditingId(message._id);
                        setEditText(message.text);
                      }}
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      className="ml-1 text-xs text-red-500 hover:text-red-700"
                      onClick={() => deleteMessage(message._id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
              <div className="chat-bubble flex flex-col max-w-[90vw] sm:max-w-[70vw] md:max-w-md lg:max-w-lg xl:max-w-xl text-sm sm:text-base break-words min-w-0">
                {message.image && (
                  <img
                    src={message.image}
                    alt="Attachment"
                    className="max-w-[120px] sm:max-w-[180px] md:max-w-[220px] rounded-md mb-2"
                  />
                )}
                {editingId === message._id ? (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      await editMessage(message._id, editText);
                      setEditingId(null);
                    }}
                    className="flex gap-2 items-center"
                  >
                    <input
                      className="input input-sm"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      autoFocus
                    />
                    <button type="submit" className="btn btn-xs btn-primary">Save</button>
                    <button type="button" className="btn btn-xs" onClick={() => setEditingId(null)}>
                      Cancel
                    </button>
                  </form>
                ) : (
                  message.text && <p>{message.text}</p>
                )}
                {/* Emoji reactions UI */}
                <div className="flex gap-2 mt-2 items-center relative flex-wrap min-w-0">
                  {/* Show current reactions with counts */}
                  {Array.from(new Set(reactions.map((r) => r.emoji))).map((emoji) => {
                    const count = reactions.filter((r) => r.emoji === emoji).length;
                    const reacted = reactions.some(
                      (r) => r.emoji === emoji && r.userId === authUser._id
                    );
                    return (
                      <button
                        key={emoji}
                        className={`text-lg sm:text-xl transition-transform ${reacted ? "scale-125" : "opacity-70 hover:opacity-100"}`}
                        onClick={() => handleReact(message, emoji)}
                        title={emoji}
                      >
                        {emoji} {count > 0 && <span className="text-xs align-super">{count}</span>}
                      </button>
                    );
                  })}
                  {/* Emoji picker dropdown */}
                  <div className="relative min-w-0">
                    <button
                      className="ml-2 text-lg sm:text-xl px-1 py-0.5 rounded hover:bg-base-200"
                      onClick={() => setOpenEmojiPicker(openEmojiPicker === message._id ? null : message._id)}
                      title="Add reaction"
                      type="button"
                    >
                      😀
                    </button>
                    {openEmojiPicker === message._id && (
                      <div className="absolute z-50 bottom-full left-0 mb-2 w-48 sm:w-56 md:w-64 bg-white border border-gray-200 rounded shadow-lg p-2 grid grid-cols-8 gap-1 max-h-32 sm:max-h-40 md:max-h-48 overflow-y-auto min-w-0">
                        {EMOJI_LIST.map((emoji) => (
                          <button
                            key={emoji}
                            className="text-lg sm:text-xl p-1 hover:bg-base-200 rounded"
                            onClick={() => handleReact(message, emoji)}
                            type="button"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="text-xs text-zinc-400 mb-2">Typing...</div>
        )}
      </div>

      <MessageInput />
    </div>
  );
};
export default ChatContainer;