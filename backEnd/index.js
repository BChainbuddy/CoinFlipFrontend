const ethers = require("ethers");
const WebSocket = require("ws");
const ABI = require("../frontEnd/constants/abi.json");
const ADDRESSES = require("../frontEnd/constants/contractAddresses.json");
require("dotenv").config();

// Connect to Ethereum provider
const provider = new ethers.providers.InfuraProvider(
  "sepolia",
  process.env.INFURA_PROVIDER
);

const contractAddress = ADDRESSES["11155111"]; // Your contract address
const abi = ABI; // Your contract ABI

// Connect to contract
const contract = new ethers.Contract(contractAddress, abi, provider);

// Create WebSocket server
const wss = new WebSocket.Server({ port: 8082 });

// Map to store client connections with Ethereum addresses
const clients = new Map();

wss.on("connection", (ws) => {
  console.log("New client connected!");

  ws.on("message", (message) => {
    console.log("Message received!");
    clients.set(message, ws);
    console.log(message);
  });

  ws.on("close", () => {
    console.log("Client has disconnected!");
  });
});

// Listen for Ethereum events
console.log("Listening to an game Created event...");
contract.on("gameCreated", (_gameId, _challenger, _amount, _creatorSymbol) => {
  // Send data to connected WebSocket clients
  let gameCreated = {
    gameId: _gameId,
    challenger: _challenger,
    amount: _amount,
    creatorSymbol: _creatorSymbol,
  };

  //Send data to frontend
  clients.forEach((client, address) => {
    if (address.toLowerCase() === _challenger.toString().toLowerCase()) {
      if (client.readyState === WebSocket.OPEN) {
        console.log(
          `The socket has gotten the request! ${JSON.stringify(
            gameCreated
          )} and sent it to ${address}`
        );
        client.send(JSON.stringify(gameCreated)); // Convert to string before sending
      }
    }
  });
});

console.log("Listening to game started event...");
contract.on(
  "gameStarted",
  (_gameId, _challenger, _joiner, _amount, _creatorSymbol) => {
    // Send data to connected WebSocket clients
    let gameStarted = {
      gameId: _gameId,
      challenger: _challenger,
      joiner: _joiner,
      amount: _amount,
      creatorSymbol: _creatorSymbol,
    };

    //Send data to frontend
    clients.forEach((client, address) => {
      if (
        _challenger.toString().toLowerCase() === address.toLowerCase() ||
        _joiner.toString().toLowerCase() === address.toLowerCase()
      ) {
        if (client.readyState === WebSocket.OPEN) {
          console.log(
            `The socket has gotten the request! ${JSON.stringify(gameStarted)}`
          );
          client.send(JSON.stringify(gameStarted)); // Convert to string before sending
        }
      }
    });
  }
);

console.log("Listening to result event...");
contract.on("coinFlipResult", (_gameId, _winningSymbol) => {
  console.log("Game results!");
  // Send data to connected WebSocket clients
  let results = {
    gameId: _gameId,
    winningSymbol: _winningSymbol,
  };

  //Send data to frontend
  clients.forEach((client, address) => {
    if (client.readyState === WebSocket.OPEN) {
      console.log(
        `The socket has gotten the request! ${JSON.stringify(results)}`
      );
      client.send(JSON.stringify(results)); // Convert to string before sending
    }
  });
});

console.log("Listening to game finished event...");
contract.on("gameFinished", (_gameId, _winner, _loser, _amount) => {
  console.log("Game has finished");
  // Send data to connected WebSocket clients
  let gameFinished = {
    gameId: _gameId,
    winner: _winner,
    loser: _loser,
    amount: _amount,
  };

  //Send data to frontend
  clients.forEach((client, address) => {
    if (
      _winner.toString().toLowerCase() === address.toLowerCase() ||
      _loser.toString().toLowerCase() === address.toLowerCase()
    ) {
      if (client.readyState === WebSocket.OPEN) {
        console.log(
          `The socket has gotten the request! ${JSON.stringify(gameFinished)}`
        );
        client.send(JSON.stringify(gameFinished)); // Convert to string before sending
      }
    }
  });
});

console.log("WebSocket server running on port 8082!");
