const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const axios = require("axios"); // Include axios for making HTTP requests

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = 3000;
let userCount = 0; // Initialize user count

// Middleware to parse JSON request bodies
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Serve index.html on root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Function to generate a random color in hexadecimal format
function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// Function to check if the message is offensive using the ML API
async function checkMessage(message) {
  try {
    const response = await axios.post('http://localhost:5000/predict_chat', { message: message });
    return response.data.offensive; // Expecting the response to contain an 'offensive' boolean
  } catch (error) {
    console.error('Error checking message:', error);
    return false; // Default to not offensive on error
  }
}

// Handle Socket.IO connections
io.on("connection", (socket) => {
  userCount++; // Increment user count when a new user connects
  const username = `User ${userCount}`; // Assign a unique username
  const userColor = getRandomColor(); // Assign a random color to the user
  console.log(`${username} connected with color ${userColor}`);

  // Inform all clients about the new user
  io.emit("userConnected", { username, userColor });
  io.emit("onlineUsers", userCount); // Update the online user count

  // Listen for chat messages
  socket.on("chatMessage", async (msg) => {
    const isOffensive = await checkMessage(msg); // Check if the message is offensive
    if (isOffensive) {
      // Notify all users that the message was offensive and deleted
      io.emit("chatMessage", {
        user: username,
        message: `⊘message from ${username} was deleted by server because of not following our community guidelines.`,
	 color: userColor
      });
      // Optionally, you can also log the original offensive message if needed
      console.log(`Offensive message from ${username}: "${msg}" deleted.`);
    } else {
      // Broadcast the message to all users
      io.emit("chatMessage", { user: username, message: msg, color: userColor });
    }
  });

  // Listen for user disconnection
  socket.on("disconnect", () => {
    console.log(`${username} disconnected`);
    userCount--; // Decrement user count when a user disconnects
    io.emit("onlineUsers", userCount); // Update the online user count
    socket.broadcast.emit("userDisconnected", username); // Notify other users
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
