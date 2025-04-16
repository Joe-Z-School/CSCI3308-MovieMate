import { formatDistanceToNow , parseISO } from 'https://cdn.jsdelivr.net/npm/date-fns@latest/index.js';
console.log('Script loaded!'); // Check if messagingScript.js is running

// Check if yourUserId is defined
if (typeof yourUserId === 'undefined') {
  console.error('yourUserId is not defined.');
}

const socket = io(); // Connect to the server

const messageInput = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");
const emojiBtn = document.getElementById('emoji-btn');
const fileInput = document.getElementById("file-input"); 
const chatMessages = document.getElementById("chat-messages");
const friendsContainer = document.getElementById("friends");

if (!friendsContainer) {
  console.error("#friends element not found.");
}
if (!chatMessages) {
  console.error("#chat-messages element not found.");
}

// Globals
let friendId = null;
let friendName = null;
let activeFriendId = null;
let unreadCount = null;

// Initial load of the friends list
updateFriendsList();

// Call this function to request the updated friends list from the server
function updateFriendsList() {
  console.log('Requesting updated friends list for user:', yourUserId);  // Debugging line
  socket.emit('get-friends-list', { userId: yourUserId });
}

function updateFriendsListOnUI(friendsList) {
  // Check if friendsList is undefined or empty
  if (!Array.isArray(friendsList) || friendsList.length === 0) {
    console.error('Invalid or empty friends list:', friendsList);
    return;
  }

  const friendsContainer = document.getElementById("friends");
  friendsContainer.innerHTML = ""; // Clear previous friends list

  if (friendsList.length === 0) {
    // If no friends are found, display message
    const noFriendsMessage = document.createElement("li");
    noFriendsMessage.className = "list-group-item text-muted";
    noFriendsMessage.textContent = "No friends to display.";
    friendsContainer.appendChild(noFriendsMessage);
  }

  // Sort friends: unread messages first, then alphabetically by name
  friendsList.sort((a, b) => {
    const aUnread = a.unread_count || 0;
    const bUnread = b.unread_count || 0;

    if (aUnread > 0 && bUnread === 0) return -1; // a comes first
    if (bUnread > 0 && aUnread === 0) return 1;  // b comes first

    // If both have unread or both have none, sort alphabetically
    return a.name.localeCompare(b.name);
  });

  friendsList.forEach(friend => {
    // Create the list area for all friends
    const listItem = document.createElement("li");
    listItem.className = "list-group-item friend d-flex align-items-center";
    listItem.id = "friend";
    listItem.setAttribute("data-user-id", friend.id);
    listItem.setAttribute("data-user", friend.name);
    listItem.setAttribute("data-user-unreadCount", friend.unread_count);

    // Add profile image to each friend in friends list
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

    // Add friend name
    const friendInfo = document.createElement("div");
    friendInfo.className = "friend-info flex-grow-1";
    const friendName = document.createElement("div");
    friendName.className = "friend-name";
    friendName.textContent = friend.name;

    // Get most recent message from friend
    const recentMessage = document.createElement("div");
    recentMessage.className = "recent-message text-muted";
    const rawMessage = friend.latest_message || "No recent messages";
    // Check if recent message was an image upload, if so, display text and not URL
    const imageMessage = rawMessage.startsWith("https://d32c7xmivzr8hg.cloudfront.net/") ? 'Image uploaded...' : rawMessage;

    // Dont display more than 22 characters in recent messages area for formatting. Add ellipses if longer
    recentMessage.textContent = imageMessage.length > 22 ? imageMessage.slice(0, 22) + "..." : imageMessage;

    friendInfo.appendChild(friendName);
    friendInfo.appendChild(recentMessage);
    listItem.appendChild(friendInfo);

    // Add extra info (timestamp and unread count)
    const extraInfo = document.createElement("div");
    extraInfo.className = "extra-info text-end";

    // date-fns timestamp
    const formattedTimestamp = friend.last_active ? formatDistanceToNow(parseISO(friend.last_active), { addSuffix: true }) : "Not available";
    
    const timestamp = document.createElement("small");
    timestamp.className = "text-muted";
    timestamp.textContent = formattedTimestamp;

    const unreadCount = friend.unread_count || 0; // Default to 0 if undefined

    const unreadBadge = document.createElement("span");
    unreadBadge.className = "badge unread-badge";

    // Hide unread badge counter if there are no unread messages
    if (unreadCount > 0) {
      unreadBadge.textContent = unreadCount;
      unreadBadge.style.display = "inline-block";
    }    
    else {
      unreadBadge.textContent = "0";
      unreadBadge.style.display = "none";
    }
    
    extraInfo.appendChild(timestamp);
    extraInfo.appendChild(unreadBadge);
    listItem.appendChild(extraInfo);

    listItem.addEventListener("click", () => {
      openChat(friend); 
    });

    // Append the new list item to the friends container
    friendsContainer.appendChild(listItem);
  });
}

// When selecting a friend, a chat room should open with selected
// friend, gather the friend information to tie messages to friend
// and reset an unread badge counter if there is one.
function openChat(friend) {
  console.log('Opening chat with friend:', friend);
  friendId = friend.id;
  friendName = friend.name;
  activeFriendId = friend.id;

  // Set the active chat room with friendid
  socket.emit('setActiveChat', friend.id);

  // Gather friend information
  const chatHeader = document.getElementById("chat-user-name");
  const chatProfileIcon = document.getElementById("chat-profile-icon");
  chatHeader.textContent = friendName;
  chatProfileIcon.src = `/resources/img/${friend.profile_icon}`;
  chatProfileIcon.style.display = "block";

  // Clear chat area for room switch and load of new friends chat
  const chatMessages = document.getElementById('chat-messages');
  chatMessages.innerHTML = "";
  
  // Re-enable blocked buttons/typing area
  const messageTypeArea = document.getElementById('message-input');
  messageTypeArea.removeAttribute('disabled') // Re-enable chat typing area
  const sendButton = document.getElementById('send-btn')
  sendButton.removeAttribute('disabled') // Re-enable send button
  const imageUpButton = document.getElementById('file-input')
  imageUpButton.removeAttribute('disabled') // Re-enable image upload button
  const emojiButton = document.getElementById('emoji-btn')  
  emojiButton.removeAttribute('disabled') // Re-enable emoji add button

  // join the chat room with specific friend
  socket.emit('join-room', { senderId: yourUserId, recipientId: friendId });

  // Reset unread counter to 0
  socket.emit('mark-messages-read', { senderId: yourUserId, recipientId: friendId });
  const unreadBadge = document.querySelector(`[data-user-id="${friendId}"] .unread-badge`);
  if (unreadBadge) {
    unreadBadge.textContent = "0";
    unreadBadge.style.display = "none";
  }
}

// Send a private message using send button
sendBtn.addEventListener('click', () => {
  const message = messageInput.value.trim();
  if (message) {
    // Send message details + user info to append to chat
    appendMessage({ 
      message: message, 
      user: 'You',
      profileIcon: `/resources/img/${activeUser.profile_icon}`,
      timestamp: new Date()
    });
    // Send message to friend
    socket.emit('private-message', {
      senderId: yourUserId,
      recipientId: friendId,
      content: message,
      chatOpen: activeFriendId === friendId
    }); 

    // Clear message area
    messageInput.value = "";
  }
  
  else {
    console.error('Message content cannot be empty.');
  }
});
  
// Send messages with Enter and adding new lines with Shift+Enter
messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault(); // Prevent default newline behavior
    sendBtn.click(); // Trigger send button click event
  }
  
  else if (event.key === "Enter" && event.shiftKey) {
    // Allow Shift+Enter to create a new line when textbox on webpage
    messageInput.value += "\n"; // Add a newline to the input field
    event.preventDefault(); // Prevent the default behavior of Enter
  }
});


socket.on('connect', () => {
  // register connection
  socket.emit('register-user', yourUserId);
  
  socket.once('user-registered', () => {
    updateFriendsList(); // load friends
  });
});

// Listen for the updated unread count and update the UI accordingly
socket.on('update-unread-count', ({ senderId, recipientId, unreadCount }) => {
  // Don't update unread count if we're actively chatting with that friend
  if (activeFriendId === senderId) {
    console.log('In chat with sender, skipping unread badge update.');
    return;
  }

  // Get unread counter from friend
  const unreadBadge = document.querySelector(`[data-user-id="${senderId}"] .unread-badge`);
  if (unreadBadge) {
    unreadBadge.textContent = unreadCount;
  }
});

// Increment unread count if message comes from a friend who isn't the active chat
socket.on('increment-unread', ({ from }) => {
  // Get unread counters
  const friendListItem = document.querySelector(`[data-user-id="${from}"]`);
  const unreadBadge = friendListItem?.querySelector('.unread-badge');

  if (unreadBadge) {
    // Get current unread count or default to 0
    let currentCount = parseInt(unreadBadge.textContent, 10);
    if (isNaN(currentCount)) currentCount = 0;

    const newCount = currentCount + 1;
    unreadBadge.textContent = newCount;
    unreadBadge.style.display = "inline-block";
  }
  
  else {
    console.log(`Unread badge for user ${from} not found.`);
  }

});

// When the server sends the updated friends list
socket.on('friends-list-updated', (friendsList) => {
  console.log('Received updated friends list:', friendsList); // Debugging line

  // Check if friendsList is valid
  if (!Array.isArray(friendsList) || friendsList.length === 0) {
    console.error('Received invalid or empty friends list:', friendsList); // Debugging line
    return;
  }

  // Update the friends list on the UI
  updateFriendsListOnUI(friendsList);
});

// Receive a private message
socket.on('private-message', ({ senderId, content }) => {
  // Ignore if receiver not in sender chat
  if (String(senderId) !== String(activeFriendId)) {
    //console.log(`Message from ${senderId} ignored because activeFriendId is ${activeFriendId}.`); // Debug line
    return;
  }

  appendMessage({
    message: content,
    user: friendName,
    profileIcon: `/resources/img/${document.querySelector('[data-user-id="'+friendId+'"] img').getAttribute('src').split('/').pop()}`,
    timestamp: new Date(),
    isImage: content.startsWith("https://d32c7xmivzr8hg.cloudfront.net/")
  });
});

// Load messages for the selected friend
socket.on('load-messages', (messages) => {
  chatMessages.innerHTML = "";

  // Gather all messages between user and friend
  messages.forEach(({ sender_id, content, timestamp }) => {
    const isUser = sender_id === yourUserId;
    appendMessage({
      message: content,
      user: isUser ? 'You' : friendName,
      profileIcon: isUser
        ? `/resources/img/${activeUser.profile_icon}`
        : `/resources/img/${document.querySelector('[data-user-id="'+friendId+'"] img').getAttribute('src').split('/').pop()}`,
      timestamp,
      isImage: content.startsWith("https://d32c7xmivzr8hg.cloudfront.net/")
    });
  });

  // Scroll so latest message is visible
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

function appendMessage({ message, user, profileIcon = null, timestamp = new Date(), isImage = false }) {
  // Check if no message or no user
  if (!message || !user) {
    console.error('Message or user is undefined in appendMessage:', { message, user });
    return;
  }

  // Create chat messaging area
  const msgWrapper = document.createElement('div');
  msgWrapper.classList.add('chat-message');

  // Set user as titled 'You'
  const isSentByUser = user === 'You';
  msgWrapper.classList.add(isSentByUser ? 'sent' : 'received');

  // Add friends profile icon to top for displaying chat room
  const profileImg = document.createElement('img');
  profileImg.src = profileIcon
  profileImg.alt = 'Profile';
  profileImg.classList.add('profile-icon');

  // Message sending/receiving area
  const messageContent = document.createElement('div');
  messageContent.classList.add('message-content');
  const meta = document.createElement('div');
  meta.classList.add('message-meta');
  const formattedTime = formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  meta.textContent = `${user} • ${formattedTime}`;
  
  // Add styled chat bubbles to sends and received messages
  const bubble = document.createElement('div');
  bubble.classList.add('chat-bubble');

  // Check if message sent/received is an image
  if (isImage || message.startsWith("https://d32c7xmivzr8hg.cloudfront.net/")) {
    const img = document.createElement('img');
    img.src = message;
    img.alt = "Sent image";
    img.style.maxWidth = "200px"; // Limit dimensions of image
    img.style.borderRadius = "8px";
    bubble.appendChild(img);
  } 
  else {
    bubble.textContent = message;
  }

  // Add messages in bubble style to chat area
  messageContent.appendChild(meta);
  messageContent.appendChild(bubble);

  // Add chat room friend profile image to top
  msgWrapper.appendChild(profileImg);
  msgWrapper.appendChild(messageContent);

  // Add wrapper to page and scroll messages so newly added is visible
  chatMessages.appendChild(msgWrapper);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  console.log('Styled message appended:', { user, message });
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
    // Create emoji selection window with location
    const emojiElement = document.createElement('div');
    emojiElement.innerHTML = `<emoji-picker></emoji-picker>`;
    emojiElement.style.position = "absolute";
    emojiElement.style.bottom = "90px"; // Position from the bottom
    emojiElement.style.right = "80px"; // Position from the right
    emojiElement.style.zIndex = "1500"; // Ensure it's on top of other elements
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

// Image Upload
document.getElementById('file-input').addEventListener('change', async function () {
  const file = this.files[0];
  if (!file) return;

  const MAX_SIZE = 2 * 1024 * 1024; // 2 MB max image size

  if (file.size > MAX_SIZE) {
    alert('Image too large, Max Image size is 2MB.');
    this.value = ''; // Clear the file input
    return;
  }

  const formData = new FormData();
  formData.append('image', file);

  try {
    // POST image to chat
    const res = await fetch('/upload-chat-image', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (data.success) {

      // Send image URL as message
      sendMessage({ type: 'image', url: data.imageUrl });
    }
    else {
      alert('Upload failed: ' + data.error);
    }
  } catch (err) {
    console.error('Upload error:', err);
    alert('An error occurred during upload. Please try again.');
  }
});



function sendMessage(messageObj) {
  if (!friendId) {
    console.error("No friend selected to send the message.");
    return;
  }

  const isImage = messageObj.type === 'image';

  // Append the message to the chat window
  appendMessage({ 
    message: isImage ? messageObj.url : messageObj.text,
    user: 'You',
    profileIcon: `/resources/img/${activeUser.profile_icon}`,
    timestamp: new Date(),
    isImage
  });

  // Emit message to friend room
  socket.emit('private-message', {
    senderId: yourUserId,
    recipientId: friendId,
    content: isImage ? messageObj.url : messageObj.text,
    type: messageObj.type || 'text',
    chatOpen: activeFriendId === friendId
  });

  if (!isImage) {
    messageInput.value = "";
  }
}



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

// Change emoji icon when mouse hovers over emoji button
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
  }
  
  else {
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
  activeFriendId = null;
  // Set default chat header message
  const chatHeader = document.getElementById('chat-user-name');
  const chatProfileIcon = document.getElementById('chat-profile-icon');
  const messageTypeArea = document.getElementById('message-input');
  const sendButton = document.getElementById('send-btn')
  const imageUpButton = document.getElementById('file-input')
  const emojiButton = document.getElementById('emoji-btn')

  chatHeader.textContent = 'Select A Friend To Start Chatting'; // Default message
  chatProfileIcon.style.display = 'none'; // Hide profile icon by default
  messageTypeArea.setAttribute('disabled', 'true') // Disallow a user from typing until a friend is selected
  sendButton.setAttribute('disabled', 'true') // Disable send button
  imageUpButton.setAttribute('disabled', 'true') // Disable image upload button
  emojiButton.setAttribute('disabled', 'true') // Disable emoji add button
});

setInterval(updateFriendsList, 15000); // 15 seconds

window.addEventListener('beforeunload', () => {
  socket.emit('setActiveChat', null); // Set active chat to Null when leaving page
});
