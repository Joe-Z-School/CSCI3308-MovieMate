import { formatDistanceToNow } from 'https://cdn.jsdelivr.net/npm/date-fns@latest/index.js';
console.log('Script loaded!'); // Check if messagingScript.js is running

const socket = io(); // Connect to the server

const messageInput = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");
const emojiBtn = document.getElementById('emoji-btn');
const fileInput = document.getElementById("file-input"); 
const chatMessages = document.getElementById("chat-messages");
const friendsList = document.querySelectorAll('.friend'); // Select all friends

const friendsContainer = document.getElementById("friends");
if (!friendsContainer) {
  console.error("#friends element not found.");
}
if (!chatMessages) {
  console.error("#chat-messages element not found.");
}


// Declare friendId globally
let friendId = null;
let friendName = null;

friendsList.forEach(friend => {
  friend.addEventListener('click', () => {
    friendId = friend.getAttribute('data-user-id');
    friendName = friend.getAttribute('data-user');
    const friendProfileIcon = friend.querySelector('img').getAttribute('src');

    socket.emit('join-room', { senderId: yourUserId, recipientId: friendId });

    // Update chat header with friend's details
    const chatHeader = document.getElementById('chat-user-name');
    const chatProfileIcon = document.getElementById('chat-profile-icon');
    chatHeader.textContent = friendName;
    chatProfileIcon.src = friendProfileIcon;
    chatProfileIcon.style.display = 'block';

    // Clear chat messages for the new friend
    chatMessages.innerHTML = "";

    // Emit event to mark messages as read
    socket.emit('mark-messages-read', { senderId: yourUserId, recipientId: friendId });
  });
});

function updateFriendsList(friends) {
  const friendsContainer = document.getElementById("friends");
  friendsContainer.innerHTML = ""; // Clear previous friends list

  friends.forEach(friend => {
    const listItem = document.createElement("li");
    listItem.className = "list-group-item friend d-flex align-items-center";
    listItem.setAttribute("data-user-id", friend.id);
    listItem.setAttribute("data-user", friend.name);

    // Add profile image
    const profileContainer = document.createElement("div");
    profileContainer.className = "position-relative me-3";
    const profileImage = document.createElement("img");
    profileImage.src = `/resources/img/${friend.profile_icon}`;
    profileImage.className = "rounded-circle";
    profileImage.alt = "Profile Icon";
    profileImage.width = 50;
    profileImage.height = 50;
    profileContainer.appendChild(profileImage);
    listItem.appendChild(profileContainer);

    // Add friend info
    const friendInfo = document.createElement("div");
    friendInfo.className = "friend-info flex-grow-1";
    const friendName = document.createElement("div");
    friendName.className = "friend-name";
    friendName.textContent = friend.name;
    const recentMessage = document.createElement("div");
    recentMessage.className = "recent-message text-muted";
    recentMessage.textContent = friend.latest_message || "No recent messages";
    friendInfo.appendChild(friendName);
    friendInfo.appendChild(recentMessage);
    listItem.appendChild(friendInfo);

    // Add extra info
    const extraInfo = document.createElement("div");
    extraInfo.className = "extra-info text-end";
    const timestamp = document.createElement("small");
    timestamp.className = "text-muted";
    timestamp.textContent = friend.last_active || "Not available";
    const unreadBadge = document.createElement("span");
    unreadBadge.className = "badge bg-primary unread-badge";
    unreadBadge.textContent = friend.unread_count || 0;
    extraInfo.appendChild(timestamp);
    extraInfo.appendChild(unreadBadge);
    listItem.appendChild(extraInfo);

    // Attach the click event listener
    listItem.addEventListener("click", () => {
      openChat(friend); // Trigger openChat when clicked
    });

    friendsContainer.appendChild(listItem);
  });
}


function openChat(friend) {
  console.log('Opening chat with friend:', friend); // Debug friend object
  friendId = friend.id;
  friendName = friend.name;

  // Update chat header
  const chatHeader = document.getElementById("chat-user-name");
  const chatProfileIcon = document.getElementById("chat-profile-icon");
  chatHeader.textContent = friendName;
  chatProfileIcon.src = `/resources/img/${friend.profile_icon}`;
  chatProfileIcon.style.display = "block";

  // Clear chat messages
  const chatMessages = document.getElementById('chat-messages');
  chatMessages.innerHTML = "";

  // Emit 'join-room' event to server
  socket.emit('join-room', { senderId: yourUserId, recipientId: friendId });
}




// Emit mark-messages-read when joining a room (now friendId will always be defined dynamically)
socket.emit('mark-messages-read', { senderId: yourUserId, recipientId: friendId });

// Send a private message using send button
sendBtn.addEventListener('click', () => {
  const message = messageInput.value.trim();
  if (message) {
    // Emit the message to the server
    socket.emit('private-message', {
      senderId: yourUserId, // Ensure yourUserId is defined correctly on the client
      recipientId: friendId, // Make sure friendId is set when a friend is selected
      content: message
    });
    messageInput.value = ""; // Clear the input field
  } else {
    console.error('Message content cannot be empty.');
  }
});

  
// Send messages with Enter and adding new lines with Shift+Enter
messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault(); // Prevent default newline behavior
    sendBtn.click(); // Trigger send button click event
  } else if (event.key === "Enter" && event.shiftKey) {
    // Allow Shift+Enter to create a new line
    messageInput.value += "\n"; // Add a newline to the input field
    event.preventDefault(); // Prevent the default behavior of Enter
  }
});

// Receive a private message
socket.on('private-message', ({ senderId, content }) => {
  const user = senderId === yourUserId ? 'You' : friendName; // Define sender
  if (content && user) {
    appendMessage({ message: content, user }); // Add the message to the chat box
  } else {
    console.error('Message or user is undefined:', { content, user });
  }
});


// Load messages for the selected friend
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
  if (!message || !user) {
    console.error('Message or user is undefined in appendMessage:', { message, user });
    return;
  }
  const msgElement = document.createElement('div');
  msgElement.textContent = `${user}: ${message}`;
  const chatMessages = document.getElementById('chat-messages');
  if (!chatMessages) {
    console.error('chat-messages container not found.');
    return;
  }
  chatMessages.appendChild(msgElement); // Append the message to the chat window
  chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to the latest message
  console.log('Message appended to chat window:', { user, message });
}



// Send Emojis
emojiBtn.addEventListener("click", () => {
  // Check if emoji-picker is already added
  const existingEmojiPicker = document.querySelector('emoji-picker');
  if (existingEmojiPicker) {
    // If it exists, remove it
    existingEmojiPicker.remove();
    return;
  }
  else{
    const emojiElement = document.createElement('div');
    emojiElement.innerHTML = `<emoji-picker></emoji-picker>`;
    emojiElement.style.position = "absolute";
    emojiElement.style.bottom = "90px"; // Position from the bottom
    emojiElement.style.right = "80px"; // Position from the right
    emojiElement.style.zIndex = "1000"; // Ensure it's on top of other elements
    emojiElement.style.borderRadius = "10px"; // Rounded corners
    emojiElement.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)"; // Shadow effect
    document.body.appendChild(emojiElement);
  }
  
  // Add emoji to the message input
  const emojiPicker = document.querySelector('emoji-picker');
  emojiPicker.addEventListener('emoji-click', (event) => {
    const emoji = event.detail.unicode;
    messageInput.value += emoji; // Append emoji to the message input
  });

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

document.addEventListener("DOMContentLoaded", () => {
  // Initialize all tooltips on the page
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  const tooltipList = tooltipTriggerList.map(tooltipTriggerEl => {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
});

document.addEventListener('DOMContentLoaded', () => {
  // Set default chat header message and hide dropdown
  const chatHeader = document.getElementById('chat-user-name');
  const chatProfileIcon = document.getElementById('chat-profile-icon');

  chatHeader.textContent = 'Select A Friend To Start Chatting'; // Default message
  chatProfileIcon.style.display = 'none'; // Hide profile icon by default
});

