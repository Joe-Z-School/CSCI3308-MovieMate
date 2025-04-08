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
    friendId = friend.getAttribute('data-user-id'); // Get the friend's ID
    friendName = friend.getAttribute('data-user'); // Get the friend's name
    const friendProfileIcon = friend.querySelector('img').getAttribute('src'); // Get the profile icon URL
    console.log(`Opening chat room with: ${friendName} (ID: ${friendId})`);

    // Emit join-room event to the server
    socket.emit('join-room', { senderId: yourUserId, recipientId: friendId });

    // Update the chat header with the friend's profile icon, name, and dropdown
    const chatHeaderIcon = document.getElementById('chat-profile-icon');
    const chatHeaderName = document.getElementById('chat-user-name');

    chatHeaderIcon.src = friendProfileIcon; // Set the profile picture
    chatHeaderName.textContent = friendName; // Set the friend's name

    // Clear the chat messages (messages will reload via load-messages)
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.innerHTML = "";
  });
});


function updateFriendsList(friends) {
  const unreadList = document.getElementById("unread");
  const favoritesList = document.getElementById("favorites");
  unreadList.innerHTML = "";
  favoritesList.innerHTML = "";

  friends.forEach(friend => {
    const listItem = document.createElement("li");
    listItem.className = "list-group-item friend d-flex align-items-center";
    listItem.setAttribute("data-user-id", friend.id);
    listItem.setAttribute("data-user", friend.name);

    const profileContainer = document.createElement("div");
    profileContainer.className = "position-relative me-2";

    const profileImage = document.createElement("img");
    profileImage.src = friend.profileIcon;
    profileImage.className = "rounded-circle";
    profileImage.alt = "Profile Icon";
    profileImage.width = 40;
    profileImage.height = 40;
    profileContainer.appendChild(profileImage);

    if (friend.isUnread) {
      const unreadBadge = document.createElement("span");
      unreadBadge.className = "badge bg-danger position-absolute top-0 end-0";
      profileContainer.appendChild(unreadBadge);
      unreadList.appendChild(listItem);
    }

    listItem.appendChild(profileContainer);

    const nameSpan = document.createElement("span");
    nameSpan.className = "ms-2";
    nameSpan.textContent = friend.name;
    listItem.appendChild(nameSpan);

    const dropdownContainer = document.createElement("div");
    dropdownContainer.className = "dropdown ms-auto";

    const dropdownButton = document.createElement("button");
    dropdownButton.className = "btn btn-secondary btn-sm dropdown-toggle";
    dropdownButton.setAttribute("type", "button");
    dropdownButton.setAttribute("data-bs-toggle", "dropdown");
    dropdownButton.textContent = "Actions";
    dropdownContainer.appendChild(dropdownButton);

    const dropdownMenu = document.createElement("ul");
    dropdownMenu.className = "dropdown-menu";

    const viewProfile = document.createElement("li");
    viewProfile.innerHTML = `<a class="dropdown-item" href="#">View Profile</a>`;
    dropdownMenu.appendChild(viewProfile);

    const addRemoveFavorites = document.createElement("li");
    addRemoveFavorites.innerHTML = friend.isFavorite ?
      `<a class="dropdown-item" href="#">Remove from Favorites</a>` :
      `<a class="dropdown-item" href="#">Add to Favorites</a>`;
    dropdownMenu.appendChild(addRemoveFavorites);

    const blockUser = document.createElement("li");
    blockUser.innerHTML = `<a class="dropdown-item text-danger" href="#">Block User</a>`;
    dropdownMenu.appendChild(blockUser);

    dropdownContainer.appendChild(dropdownMenu);
    listItem.appendChild(dropdownContainer);
  });
}



// Emit mark-messages-read when joining a room (now friendId will always be defined dynamically)
socket.emit('mark-messages-read', { senderId: yourUserId, recipientId: friendId });

// Send a private message using send button
sendBtn.addEventListener('click', () => {
    const message = messageInput.value.trim();
    if (message) {
      // Emit message to the server
      socket.emit('private-message', { senderId: yourUserId, recipientId: friendId, content: message });
      messageInput.value = ""; // Clear the input area
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
    const msgElement = document.createElement('div');
    if (!message || !user) {
      console.error('Message or user is undefined:', { message, user });
    }
    msgElement.textContent = `${user}: ${message}`;
    chatMessages.appendChild(msgElement);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll to the latest message
    console.log('Appending message:', { user, message });

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
  const chatDropdown = document.getElementById('chat-dropdown');

  chatHeader.textContent = 'Select A Friend To Start Chatting'; // Default message
  chatProfileIcon.style.display = 'none'; // Hide profile icon by default
  chatDropdown.style.display = 'none'; // Hide dropdown by default
});

friendsList.forEach(friend => {
  friend.addEventListener('click', () => {
    // Set friendId, friendName, and profileIcon
    friendId = friend.getAttribute('data-user-id');
    friendName = friend.getAttribute('data-user');
    const friendProfileIcon = friend.querySelector('img').getAttribute('src');

    // Update the chat header with friend's profile icon and name
    const chatHeader = document.getElementById('chat-user-name');
    const chatProfileIcon = document.getElementById('chat-profile-icon');
    const chatDropdown = document.getElementById('chat-dropdown');

    chatHeader.textContent = friendName; // Display friend's name
    chatProfileIcon.src = friendProfileIcon; // Set friend's profile picture
    chatProfileIcon.style.display = 'block'; // Make profile icon visible
    chatDropdown.style.display = 'block'; // Make dropdown visible

    // Clear chat messages for the selected friend
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.innerHTML = "";
  });
});



