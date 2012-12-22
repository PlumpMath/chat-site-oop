
io = require("socket.io").listen 3006, origins: "*:*"
io.set "log level", 1
log = console.log
auth = require "./get-auth" .auth

io.sockets.on "connection", (socket) ->
  socket.emit "greet"
  log "a connection"
  username = undefined

  socket.on "index", -> socket.emit "index", []

  socket.on "login", (user) ->
    log user
    auth user, (res) ->
      if res.state is "success"
        socket.emit "login", res
        username := res.data.username
        log username

  socket.on "logout", ->
    username := undefined

  