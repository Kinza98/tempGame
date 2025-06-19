const PORT = '3000';
const io = require("socket.io")(PORT, {
  cors: {
    origin:['*', 'http://localhost:5500']
  }
})

const users = [] // <- This is scoped inside `socket.on("connection")`


io.on("connection", socket => {
  socket.on("number-selected", (room, val) => {
    io.to(room).emit("number-received", val )
  })


  socket.on("finished", (room) => {
      io.to(room).emit("gameEnd")
  })


  socket.on("register", (name) => {
    let user = {
      name: name,
      id: socket.id,
      partner: null,
      partnerId: null
    }

    users.push(user);
    socket.emit("yourID", user.id)
  })

  socket.on("askConnection", (uID, pId) => {
    console.log(uID, pId)
    // let tempPartner = users.find(u => u.id === pId);
    let tempuser = users.find(u => u.id === uID);
    let tempPartnerSocket = io.sockets.sockets.get(pId);
      if(tempuser && tempPartnerSocket)
        tempPartnerSocket.emit("connectionRequest", tempuser.id, tempuser.name);
      else
        socket.emit("error", "partner not found");
  })

  socket.on("connectWith", (pId) => {
    const me = users.find(u => u.id === socket.id);
    const partner = users.find(u => u.id === pId);

    if(me && partner){
      me.partner = partner.name;
      me.partnerId = partner.id;

      partner.partner = me.name
      partner.partnerId = me.id;

      const roomName = `room-${me.id}-${partner.id}`;
      socket.join(roomName);
      let partnerSocket = io.sockets.sockets.get(pId);
      if(partnerSocket)
        partnerSocket.join(roomName);
        io.to(roomName).emit("room-connected", roomName, me.name, partner.name)
      }else
      tempPartnerSocket.emit("error", "partner not found");
    })

})

