const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require('fs');



const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const createPlayer = (id, name = "Player") => ({
  id,
  name,
  score: 0,
  isReady: false,
  difficulty: 1, // Difficulty increases with correct answers
});

let players = [];
let currentQuestion = {};
let gameActive = false;
let questionEndTime = null;
let expectedAnswers = {};
let questionTimeout = null;
let answeredPlayers = {};
const TIMER = 30000;

// Generate division questions
const generateDivision = () => {
  let a = Math.floor(Math.random() * 90) + 10;
  let b = Math.floor(Math.random() * 9) + 1;
  return { a, b };
};

// Send new question
const sendNewQuestion = () => {
  if (!gameActive) return;
  answeredPlayers = {};
  
  currentQuestion = generateDivision();
  questionEndTime = Date.now() + TIMER; // 15 seconds in the future
  expectedAnswers = {};  

  players.forEach((player) => {
    let rawResult = currentQuestion.a / currentQuestion.b;
    let expectedResult;
  
    if (player.difficulty === 1) {
      expectedResult = Math.floor(rawResult).toString();
    } else {
      expectedResult = rawResult.toFixed(player.difficulty - 1);
    }
  
    expectedAnswers[player.id] = expectedResult;
    console.log(`Expected answer for ${player.name}: ${expectedResult}`);
  });
  

  // Log the new question in the file
  const logEntry = `\n# Calcul : ${currentQuestion.a} / ${currentQuestion.b}\n`;
  fs.appendFile("game_log.txt", logEntry, (err) => {
      if (err) {
          console.error("Erreur lors de l'écriture du calcul :", err);
      }
  });

  io.emit("newQuestion", {
    a: currentQuestion.a,
    b: currentQuestion.b,
    endTime: questionEndTime,
  });

  // Clear any existing timer to prevent overlapping
  clearTimeout(questionTimeout);

  // Schedule next question
  questionTimeout = setTimeout(() => {
    if (gameActive) {
      console.log("Time up! Sending new question.");
      sendNewQuestion();
    }
  }, TIMER);
};

io.on("connection", (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Add new player
  if (!players.some((p) => p.id === socket.id)) {
    players.push(createPlayer(socket.id));
  }

  // Set player name
  socket.on("setName", (name) => {
    let player = players.find((p) => p.id === socket.id);
    if (player) {
      player.name = name || "Player " + players.length ;
      io.emit("playerUpdate", players);
    }
  });

  // Ready / unready
  socket.on("ready", () => {
    let player = players.find((p) => p.id === socket.id);
    if (player) {
      player.isReady = true;
      io.emit("playerUpdate", players);
    }
  });

  socket.on("unready", () => {
    let player = players.find((p) => p.id === socket.id);
    if (player) {
      player.isReady = false;
      if (gameActive)
        gameActive = false;
      io.emit("playerUpdate", players);
    }
  });

  // Start game
  socket.on("startGame", () => {
    if (!players.every((p) => p.isReady)) {
      socket.emit("message", "All players must be ready.");
    } else if (players.length < 2) {
      socket.emit("message", "At least two players are required.");
    } else {
      gameActive = true;
      sendNewQuestion();
    }
  });

  // Answer validation
  socket.on("answer", (data) => {
      if (!gameActive) return;
  
      let player = players.find((p) => p.id === socket.id);
      if (!player || answeredPlayers[socket.id] ) return;
  
      let expectedResult = expectedAnswers[socket.id];
  
      if (data.answer == expectedResult) {
          player.score += 1;
          player.difficulty += 1;
  
          answeredPlayers[socket.id] = true;
  
          io.emit("winner", { winner: player.name, score: players });
  
          // Log the answer to a file
          const logEntry = `* Joueur ${player.name} réponse: ${data.answer}\n`;
          fs.appendFile("game_log.txt", logEntry, (err) => {
              if (err) {
                  console.error("Erreur lors de l'écriture dans le fichier :", err);
              }
          });
  
          clearTimeout(questionTimeout);
          setTimeout(() => {
              sendNewQuestion();
          }, 3000);
      } else {
          socket.emit("reponseIncorrecte", { id: socket.id });
  
          // Log the incorrect answer to a file
          const logEntry = `* Joueur ${player.name} réponse incorrecte: ${data.answer}\n`;
          fs.appendFile("game_log.txt", logEntry, (err) => {
              if (err) {
                  console.error("Erreur lors de l'écriture dans le fichier :", err);
              }
          });
      }
  });
  
  // Handle player disconnect
  socket.on("disconnect", () => {
    console.log(`Player disconnected: ${socket.id}`);
    players = players.filter((p) => p.id !== socket.id);

    if (gameActive) {
      io.emit("playerDisconnected", { id: socket.id });
      gameActive = false;
    }

    if (players.length === 0) {
      console.log("All players left. Stopping game.");
      gameActive = false;
      expectedAnswers = {};
      currentQuestion = {};
      questionEndTime = null;
      clearTimeout(questionTimeout);
      io.emit("gameOver", { message: "A player disconnected. Game over." });
    } else {
      io.emit("playerUpdate", players);
    }
  });
});

// Start server
server.listen(3001, "0.0.0.0", () => {
  console.log("Server running on port 3001");
});
