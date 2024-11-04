// Connect to Socket.IO
const socket = io();

// DOM Elements
const messageInput = document.getElementById("message-input");
const messagesContainer = document.getElementById("messages");
const chatForm = document.getElementById("chat-form");
const onlineUsersDisplay = document.getElementById("online-users");

// Track the number of tabs opened by this user
let tabCount = localStorage.getItem('tabCount') ? parseInt(localStorage.getItem('tabCount')) : 0;
tabCount++;
localStorage.setItem('tabCount', tabCount);

// Notify server when a user connects
socket.emit("userConnected");

// Update the online users display
function updateOnlineUsersCount(count) {
    onlineUsersDisplay.textContent = `Online Users: ${count}`;
}
//go back button
document.getElementById("checkoutBtn").addEventListener("click", function() {
    window.location.href = "http://127.0.0.1:5000";
});

// Handle user connection
socket.on("userConnected", ({ username, userColor }) => {
    displayMessage(`${username} joined the chat`, "system", userColor);
    updateOnlineUsersCount(tabCount);
});

// Handle user disconnection
socket.on("userDisconnected", (username) => {
    displayMessage(`${username} left the chat`, "system");
    updateOnlineUsersCount(tabCount);
});

// Send message when form is submitted
chatForm.addEventListener("submit", (e) => {
    e.preventDefault(); // Prevent page refresh

    const message = messageInput.value.trim();
    if (message) {
        socket.emit("chatMessage", message); // Send message to server
        messageInput.value = ""; // Clear input field
    }
});

// Listen for messages from the server
socket.on("chatMessage", (data) => {
    if (data.user === "system") {
        // This is a notification of a deleted message
        displayMessage(data.message, "system", "red");
    } else {
        // This is a regular chat message
        displayMessage(data.message, data.user, data.color);
    }
});

// Function to display message in chat
function displayMessage(message, user, color) {
    const messageElement = document.createElement("div");
    const userElement = document.createElement("div");

    if (user !== "system") {
        userElement.textContent = user; // Display username
        userElement.style.color = color; // Set username color
        userElement.classList.add("font-semibold", "text-sm");
    } else {
        userElement.textContent = ""; // Hide system message username
    }

    const messageText = document.createElement("div");
    messageText.textContent = message;

    // Handle styling for system messages
    if (user === "system") {
        messageElement.classList.add("text-gray-500", "italic"); // Style for system messages
        messageElement.appendChild(userElement); // Append user element
        messageElement.appendChild(messageText); // Append message text
    } else {
        messageElement.classList.add("p-2", "rounded-lg", "mb-2", "bg-gray-200");
        if (user === "You") {
            messageElement.classList.add("ml-auto"); // Align right for the sender
        }
        messageElement.appendChild(userElement); // Append user element
        messageElement.appendChild(messageText); // Append message text
    }

    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight; // Scroll to the newest message
}

// Listen for tab closure to notify server
window.addEventListener('beforeunload', () => {
    tabCount--;
    localStorage.setItem('tabCount', tabCount);
    if (tabCount <= 0) {
        socket.emit("userDisconnected");
    }
});

// Update the online users count
socket.on('onlineUsers', (count) => {
    updateOnlineUsersCount(count);
});
