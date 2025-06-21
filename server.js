const http = require('http');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 5000;

// Create the server
const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);

  const extname = path.extname(filePath);
  const contentType = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css'
  }[extname] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});


// Create a Socket.IO server attached to the HTTP server
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
const users = [] // <- This is scoped inside `socket.on("connection")`


io.on("connection", socket => {
  socket.on("number-selected", (room, val) => {
    const me = users.find(u => u.id === socket.id);
    if(!me.playStart){
      me.playStart = true;
    }
    
    // me.turn = false;
    // console.log(me.partner)
    let findTurn = false
    me.partner.forEach((p, i) => {
      let pEle = users.find( u => u.id == p.partnerId);
    //   console.log(pEle)
      if(pEle){
        if(pEle.turn === (me.turn + 1)){
    //     if(i==0){
    //       pEle.turn = true;
          findTurn = true
          let tempPartnerSocket = io.sockets.sockets.get(pEle.id);
          io.to(room).emit("number-received", me.name, val, pEle.name);
          tempPartnerSocket.emit("myTurn");
    //     }
    //     else
    //       pEle.turn = false
        }
        }
      })
      if(!findTurn)
        me.partner.forEach((p, i) => {
      let pEle = users.find( u => u.id == p.partnerId);
      if(pEle){
        if(pEle.turn === 0){
          findTurn = true
          let tempPartnerSocket = io.sockets.sockets.get(pEle.id);
          io.to(room).emit("number-received", me.name, val, pEle.name);
          tempPartnerSocket.emit("myTurn");
        }
        }
      })
  })


  socket.on("finished", (room, w) => {
      socket.to(room).emit("gameEnd", w)
  })


  socket.on("register", (name) => {
    let user = {
      name: name,
      id: socket.id,
      partner: [],
      room: null,
      playStart: false,
    }

    users.push(user);
    socket.emit("yourID", user.id)
  })

  socket.on("askConnection", (uID, pId) => {
    let me = users.find(u => u.id === uID);
    let tempuser = [];
    let temppartner = users.find(u => u.id === pId);
    if(!temppartner)
      socket.emit("error", "No user found under that id");
    else{
      if(temppartner.playStart){
        socket.emit("error", "Can't connect! Partner is in the middle of the game");
      }else{
        if(temppartner.room !== null){
          tempuser = users.filter(u => u.room === temppartner.room);
        }else{
          tempuser = users.filter(u => u.id === uID);
        }
        if(tempuser.length > 1){
          tempuser.forEach(u => {
            let tempPartnerSocket = io.sockets.sockets.get(u.id);
            if(tempuser && tempPartnerSocket)
              tempPartnerSocket.emit("connectionRequest", me.id, me.name);
            else
              socket.emit("error", "partner not found");
          })
        }else if(tempuser.length === 1){
          tempuser.forEach(u => {
            let tempPartnerSocket = io.sockets.sockets.get(temppartner.id);
            if(tempuser && tempPartnerSocket)
              tempPartnerSocket.emit("connectionRequest", u.id, u.name);
            else
              socket.emit("error", "partner not found");
          })
        }
      }
    }
  })

  socket.on("connectWith", (pId) => {
    const me = users.find(u => u.id === socket.id);
    const partner = users.find(u => u.id === pId);
    if (!me || !partner) return;
    let roomName = me.room || partner.room || `room-${me.id}-${partner.id}`;


    if(me && partner){
      me.partner.push({
        partnerId: partner.id,
        partnerName: partner.name,
      })

      partner.partner.push({
        partnerId: me.id,
        partnerName: me.name,
      })

      me.room = roomName;
      partner.room = roomName;

      socket.join(roomName);
      let partnerSocket = io.sockets.sockets.get(pId);
      if(partnerSocket)
        partnerSocket.join(roomName);
        socket.to(roomName).emit("room-connected", roomName, me);
        partnerSocket.to(roomName).emit("room-connected", roomName, partner)
        console.log(me, partner)
        me.turn = 0;
        me.partner.forEach((p, i) => {
          let pEle = users.find( u => u.id == p.partnerId);
          if(pEle)
            pEle.turn = i+1;
        })
        io.to(roomName).emit("partner-list", [me, ...me.partner.map(p => users.find(u => u.id === p.partnerId))]);
      }else
      tempPartnerSocket.emit("error", "partner not found");
    })

    socket.on("disconnect", () => {
      console.log("disconnected")
      // Find the user who disconnected
      const user = users.find(u => u.id === socket.id);
      console.log(user)

      if (user) {
        // Tell partner their partner disconnected
        const partnerSocket = io.sockets.sockets.get(user.partnerId);
        if (partnerSocket) {
          partnerSocket.emit("partnerDisconnected");
        }

        // Remove user from list
        const index = users.indexOf(user);
        if (index !== -1) users.splice(index, 1);
      }
  });

})
