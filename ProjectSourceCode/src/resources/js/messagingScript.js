console.log('Script loaded!'); // Check if messagingScript.js is running

const socket = io(); // Connect to the server

const messageInput = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");
const emojiBtn = document.getElementById('emoji-btn');
const fileInput = document.getElementById("file-input"); 
const chatMessages = document.getElementById("chat-messages");
const friendsList = document.querySelectorAll('.friend'); // Select all friends

// Declare friendId globally
let friendId = null;
let friendName = null;

friendsList.forEach(friend => {
  friend.addEventListener('click', () => {
    // Set friendId and friendName when a friend is clicked
    friendId = friend.getAttribute('data-user-id'); // Get the friend's unique ID
    friendName = friend.getAttribute('data-user'); // Get the friend's name
    console.log(`Opening chat room with: ${friendName} (ID: ${friendId})`);

    // Emit join-room event to the server
    socket.emit('join-room', { senderId: yourUserId, recipientId: friendId });

    // Update the chat header
    const chatHeader = document.getElementById('chat-user-name');
    chatHeader.textContent = `Chatting with: ${friendName}`;

    // Clear the chat messages (messages will reload via load-messages)
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.innerHTML = "";
  });
});

// Emit mark-messages-read when joining a room (now friendId will always be defined dynamically)
socket.emit('mark-messages-read', { senderId: yourUserId, recipientId: friendId });

// Handle sending a private message
sendBtn.addEventListener('click', () => {
    const message = messageInput.value.trim();
    if (message) {
      // Emit message to the server
      socket.emit('private-message', { senderId: yourUserId, recipientId: friendId, content: message });
      messageInput.value = ""; // Clear the input field
    } else {
      console.error('Message content cannot be empty.');
    }
  });
  
  
  

// Handle receiving a private message
socket.on('private-message', ({ senderId, content }) => {
    const user = senderId === yourUserId ? 'You' : friendName; // Determine the sender
    if (content && user) {
      appendMessage({ message: content, user }); // Add the message to the chat UI
    } else {
      console.error('Message or user is undefined:', { content, user });
    }
  });
  

// Handle loading messages for the selected room
socket.on('load-messages', (messages) => {
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.innerHTML = ""; // Clear previous messages
  
    messages.forEach(({ sender_id, content, timestamp }) => {
      const sender = sender_id === yourUserId ? 'You' : friendName; // Replace `friendName` dynamically
      const msgElement = document.createElement('div');
      if (!sender_id || !content) {
        console.error('Sender or content is undefined:', { sender_id, content });
      }
      msgElement.textContent = `${sender} (${new Date(timestamp).toLocaleString()}): ${content}`;
      chatMessages.appendChild(msgElement);
    });
  
    chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll to the latest message
  });
  

// Function to display messages in the chat
function appendMessage({ message, user }) {
    const msgElement = document.createElement('div');
    if (!message || !user) {
      console.error('Message or user is undefined:', { message, user });
    }
    msgElement.textContent = `${user}: ${message}`;
    chatMessages.appendChild(msgElement);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll to the latest message
    console.log('Appending message:', { user, message });

  }
  

// Handle Emojis
emojiBtn.addEventListener("click", () => {
  alert("Emoji picker to be implemented!");
});

// File Upload
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  alert(`Selected file: ${file.name}`);
});

// Emojis hover effect
const emojiIcons = [
  'bi-emoji-smile',
  'bi-emoji-grin',
  'bi-emoji-sunglasses',
  'bi-emoji-surprise',
  'bi-emoji-tear',
  'bi-emoji-wink',
  'bi-emoji-neutral'
];

document.addEventListener('DOMContentLoaded', () => {
  const emojiBtn = document.getElementById('emoji-btn');
  if (emojiBtn) {
    emojiBtn.addEventListener('mouseenter', () => {
      const randomIndex = Math.floor(Math.random() * emojiIcons.length);
      const iconElement = emojiBtn.querySelector('i');
      if (iconElement) {
        console.log(`Changing icon to: ${emojiIcons[randomIndex]}`);
        iconElement.className = `bi ${emojiIcons[randomIndex]}`;
      }
    });
  } else {
    console.error('emojiBtn is null or not found.');
  }
});
