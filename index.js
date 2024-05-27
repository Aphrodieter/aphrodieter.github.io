const express = require('express');
const app = express();
const http = require('http');
const fs = require('node:fs');

const server = http.createServer(app);
const { Server } = require("socket.io");

let data = JSON.parse(fs.readFileSync('./remaining_items.json'));

const io = new Server(server);

io.on('connection', (socket) => {
  socket.on('decreaseItemCount', (item) => {
    console.log('winningItem: ' + item);
    if (data[item] <= 0){
      console.log(`no ${item} anymore`);
      return;
    }
    data[item]--;
    console.log(data);
    console.log('REMOVE NODEMON BEFORE STARTING SERVER');

    writeJson();
  });

  socket.on('increaseItemCount', (item) => {
    console.log('increaseItem : ' + item);
    data[item]++;
    writeJson();

  })

  socket.on('getRemainingItems', (callback) => {
    callback(data);
  });

  console.log('a user connected');
});


function writeJson(){
  fs.writeFile("./remaining_items.json", JSON.stringify(data, null, 1), err => {
    if (err) {
      console.error(err);
    } else {
      // file written successfully
    }
  });
}





app.use(express.static('frontend'));

server.listen(5000, "0.0.0.0", () => {
  console.log('listening on *:5000');
});