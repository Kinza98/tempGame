const http = require('http');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');
let users = [];

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

io.on("connection", socket => {
  socket.on("number-selected", (room, val) => {
    const me = users.find(u => u.id === socket.id);
    if(me && !me.playStart){
      me.playStart = true;
    }
    
    // me.turn = false;
    // console.log(me.partner)
    let findTurn = false
    if (me && me.partner?.length)
    me.partner.forEach((p, i) => {
      let pEle = users.find( u => u.id == p.id);
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
      if(!findTurn && me && me.partner?.length)
        me.partner.forEach((p, i) => {
      let pEle = users.find( u => u.id == p.id);
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


  socket.on("finished", (room, w, name) => {
      socket.to(room).emit("gameEnd", w, name)
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
    if(uID === pId){
      socket.emit("error", "You can't connect to yourself.");
      return
    }
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
    if (!me || !partner){
      socket.emit("error", "Error occurred while connecting");
      return;
    };
    let roomName = me.room || partner.room || `room-${me.id}-${partner.id}`;


    if(me && partner){

      const combined = Array.from(new Set([...me.partner, ... partner.partner]))

      me.partner = [...combined];
      partner.partner = [...combined]
      if (!me.partner.some(p => p.id === partner.id))
        me.partner.push({
          id: partner.id,
          name: partner.name,
        })

        if (!partner.partner.some(p => p.id === me.id)) 
          partner.partner.push({
            id: me.id,
            name: me.name,
          })


      me.room = roomName;
      partner.room = roomName;

      socket.join(roomName);
      let partnerSocket = io.sockets.sockets.get(pId);
      if (partnerSocket) {
        partnerSocket.join(roomName);
        socket.to(roomName).emit("room-connected", roomName, me);
        partnerSocket.to(roomName).emit("room-connected", roomName, partner);
      } else {
        socket.emit("error", "Partner socket not found.");
      }

        me.turn = 0;
        if (me && me.partner?.length)
        me.partner.forEach((p, i) => {
          let pEle = users.find( u => u.id == p.id);
          if(pEle)
            pEle.turn = i+1;
        })
        io.to(roomName).emit("partner-list", [me, ...me.partner.map(p => users.find(u => u.id === p.id))]);
      }else if (tempPartnerSocket)
        tempPartnerSocket.emit("error", "partner not found");
    })

    socket.on("disconnect", () => {
      console.log("disconnected")
      // Find the user who disconnected
      let user = users.find(u => u.id === socket.id);
      console.log(user)

      if (user) {
        const room = user.room;
        if (room) {
          const roomUsers = users.filter(u => u.room === room);

          roomUsers.forEach(u => {
            const socketToNotify = io.sockets.sockets.get(u.id);
            if (socketToNotify && u.id !== socket.id) {
              socketToNotify.emit("partnerDisconnected", user.name);
            }
          });

          // Remove all room users from users[]
          users = users.filter(u => u.room !== room);
        } else {
          // Fallback if user has no room, just remove them
          users = users.filter(u => u.id !== socket.id);
        }
      }

  });

  socket.on('permission-error', (msg, id) => {
    console.log('permission-error', id)
    // const partnerSocket = io.sockets.sockets.get(id);
    // if (partnerSocket) {
      io.to(id).emit('error', msg);
    // } else {
    //   console.log('Target socket not found for ID:', id);
    // }
  });

})
