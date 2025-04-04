const socket = io();

// Elements
const friendLinks = document.querySelectorAll('.list-group-item');
const messageList = document.getElementById('message-list');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');

// Dynamic User ID (assumes it's passed to the page)
const currentUserId = document.getElementById('messagePage').dataset.userId;

// Select friend to start chat
if (friendLinks.length === 0) {
    console.warn('No friends available to chat with.');
} else {
    friendLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();

            const friendId = link.dataset.friendId;
            fetch(`/messages/${friendId}`)
                .then(res => {
                    if (!res.ok) throw new Error('Failed to fetch messages');
                    return res.json();
                })
                .then(data => {
                    messageList.innerHTML = '';
                    data.forEach(message => {
                        addMessageToChat(message, message.sender_id === currentUserId);
                    });
                })
                .catch(error => console.error('Error fetching messages:', error));

            // Clear unread badge
            const badge = link.querySelector('.badge');
            if (badge) badge.remove();
        });
    });
}

// Add messages to chat
function addMessageToChat(message, isSender) {
    // Add message to chat area
    
}