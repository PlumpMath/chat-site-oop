
io = require("socket.io").listen 3006, origins: "*:*"
io.set "log level", 1
log = console.log
auth = require "./get-auth" .auth

date = require "dateable"
new-date = -> date.format (new Date!), "YY, MM/DD hh:mm "

mongo-url = "mongodb://localhost/chat-site"
db = require "mongo-lite" .connect mongo-url, <[ topics posts ]>
{topics, posts} = db
topics.ensureIndex time: 1, (err) -> throw err if err?

io.sockets.on "connection", (socket) ->
  socket.emit "greet"
  log "a connection"
  profile = {}

  socket.on "index", -> socket.emit "index", []

  socket.on "login", (user) ->
    auth user, (res) ->
      if res.state is "success"
        res.data.avatar = "pic/girl.jpg"
        socket.emit "login", res
        profile := res.data
        log user, res.data

  socket.on "logout", ->
    profile := {}

  socket.on "create-topic", (text) ->
    log "create-topic", text, profile
    if profile.username?
      item =
        name: profile.username
        avatar: profile.avatar
        time: new-date!
        text: text
      topics.save item, ->
      io.sockets.emit "create-topic", item
    else
      socket.emit "notify", "You haven's loggedin"

  socket.on "topics", ->
    topics .sort time:-1 .all (err, docs) ->
      socket.emit "topics", docs