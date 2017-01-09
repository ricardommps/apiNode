// export function for listening to the socket
module.exports = function (socket) {
    
  socket.on('socket_teste', function (data) {
    console.log(data);
    io.emit(data);
  });
};
