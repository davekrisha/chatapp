import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ error: "Message not found" });
    if (!message.senderId.equals(userId)) return res.status(403).json({ error: "Unauthorized" });
    await message.deleteOne();
    // Notify receiver in real time
    const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDeleted", { messageId: id });
    }
    res.status(200).json({ message: "Message deleted", messageId: id });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const editMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user._id;
    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ error: "Message not found" });
    if (!message.senderId.equals(userId)) return res.status(403).json({ error: "Unauthorized" });
    message.text = text;
    await message.save();
    // Notify receiver in real time
    const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageEdited", { messageId: id, text });
    }
    res.status(200).json({ message: "Message edited", messageId: id, text });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const reactToMessage = async (req, res) => {
  try {
    const { id } = req.params; // message id
    const { emoji } = req.body;
    const userId = req.user._id;
    if (!emoji) return res.status(400).json({ error: "Emoji is required" });
    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ error: "Message not found" });

    // Check if user already reacted with this emoji
    const existingReactionIndex = message.reactions.findIndex(
      (r) => r.emoji === emoji && r.userId.toString() === userId.toString()
    );
    if (existingReactionIndex > -1) {
      // Remove reaction
      message.reactions.splice(existingReactionIndex, 1);
    } else {
      // Add reaction
      message.reactions.push({ emoji, userId });
    }
    await message.save();
    res.status(200).json({ message: "Reaction updated", reactions: message.reactions });
  } catch (error) {
    console.log("Error in reactToMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};