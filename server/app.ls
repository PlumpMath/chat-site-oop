
io = require("socket.io").listen 3006, origins: "*:*"
io.set "log level", 1
log = console.log
auth = require "./get-auth" .auth

date = require "dateable"
new-date = -> date.format (new Date!), "YY, MM/DD hh:mm "
make-stamp = -> (new Date!).get-time!.to-string!

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

  after-auth = (f) ->
    if profile.username? then f!
    else socket.emit "notify", text: "You haven's loggedin"

  socket.on "create-topic", (text) ->
    log "create-topic", text, profile
    after-auth ->
      item =
        name: profile.username
        avatar: profile.avatar
        time: new-date!
        text: text
        stamp: make-stamp!
        reply: 0
      topics.save item, ->
      io.sockets.emit "create-topic", item
      

  socket.on "topics", ->
    topics .sort time:-1 .all (err, docs) ->
      socket.emit "topics", docs

  socket.on "load-topic", (stamp) ->
    posts.all topic: stamp, (err, docs) ->
      throw err if err?
      log "from db:", docs
      socket.emit "load-topic", docs

  socket.on "add-reply", (data) ->
    after-auth ->
      item =
        name: profile.username
        avatar: profile.avatar
        time: new-date!
        text: data.text
        stamp: make-stamp!
        topic: data.stamp
      log "reply:", item
      posts.save item, ->