const express = require("express");
const mysql = require("mysql2");
const app = express();
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

app.use(cors());

const server = http.createServer(app);

const db = mysql.createPool({
  connectionLimit: 10, // Adjust as needed
  host: "sql.freedb.tech",
  port: 3306,
  user: "freedb_azzula",
  password: "&j*SyUBhwFXg2Nc",
  database: "freedb_chat-history",
});

// const io = new Server(server, {
//   cors: {
//     origin: "http://localhost:3000",
//   },
// });

const io = new Server(server, {
  cors: {
    origin: "https://frontend-chat-sigma.vercel.app",
  },
});

io.on("connection", (socket) => {
  console.log("User connected: ", socket.id);

  socket.on("join_room", (data) => {
    socket.join(data);
    console.log("User with id: ", socket.id, " joined room: ", data);
  });

  socket.on("send_message", (data) => {
    socket.to(data.room).emit("receive_message", data);

    // Save message to the database
    const { author, message, time } = data;
    const sql =
      "INSERT INTO messages (username, message, time) VALUES (?, ?, ?)";
    db.query(sql, [author, message, time], (err, result) => {
      if (err) {
        console.error("Error saving message to database:", err);
      } else {
        console.log("Message saved to database:", result);
      }
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected: ", socket.id);
  });
});

app.get("/fetch_messages", (req, res) => {
  const sql = "SELECT * FROM messages";

  // Use the getConnection method of the pool to get a connection
  db.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting database connection:", err);
      res.status(500).json({ error: "An error occurred" });
      return;
    }

    // Use the connection for querying
    connection.query(sql, (err, results) => {
      // Release the connection back to the pool
      connection.release();

      if (err) {
        console.error("Error fetching messages:", err);
        res.status(500).json({ error: "An error occurred" });
      } else {
        res.status(200).json(results);
      }
    });
  });
});

server.listen(3001, () => {
  console.log("Server running on port 3001");
});
