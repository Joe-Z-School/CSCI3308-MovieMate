console.log('Script loaded!'); // Check if messagingScript.js is running

const socket = io(); // Connect to the server

const messageInput = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");
const emojiBtn = document.getElementById('emoji-btn');
const fileInput = document.getElementById("file-input"); 
const chatMessages = document.getElementById("chat-messages");

// Join a private room (example room name: "room1")
const room = "room1"; // Replace with a dynamic room ID for each conversation
socket.emit('join-room', room);

// Handle sending a private message
sendBtn.addEventListener('click', () => {
  const message = messageInput.value.trim();
  if (message) {
    const user = "You"; // Replace with the actual username
    socket.emit('private-message', { room, message, user });
    appendMessage({ message, user }); // Add the message to your chat UI
    messageInput.value = ""; // Clear the input field
  }
});

// Handle receiving a private message
socket.on('private-message', (data) => {
  appendMessage(data);
});

// Function to display messages in the chat
function appendMessage({ message, user }) {
  const msgElement = document.createElement('div');
  msgElement.textContent = `${user}: ${message}`;
  chatMessages.appendChild(msgElement);
  chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll to the latest message
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
  
  
  
  

  
