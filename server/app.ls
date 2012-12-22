
io = require("socket.io").listen 3006, origins: "*:*"
io.set "log level", 1
log = console.log
auth = require "./get-auth" .auth

date = require "dateable"
new-date = -> date.format (new Date!), "YY, MM/DD hh:mm "
make-stamp = -> (new Date!).get-time!.to-string!

mongo-url = "mongodb://localhost/chat-site"
db = require "mongo-lite" .connect mongo-url, <[ topics posts msgs ]>
{topics, posts, msgs} = db
topics.ensureIndex time: 1, (err) -> throw err if err?

io.sockets.on "connection", (socket) ->
  socket.emit "greet"
  log "a connection"
  profile = {}
  my-topic = ""

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
    topics .limit 10 .sort time:-1 .all (err, docs) ->
      socket.emit "topics", docs
    if profile.username?
      msgs.all {receiver: that}, {"_id": 0}, (err, docs) ->
        log "msg:", docs
        socket.emit "msgs", docs

  socket.on "load-topic", (stamp) ->
    my-topic := stamp
    q = {topic: stamp}
    posts.sort {stamp: -1} .limit 10 .all q, (err, docs) ->
      throw err if err?
      log "from db:", docs
      socket.emit "load-topic", docs.reverse!

  socket.on "add-reply", (data) ->
    time = new-date!
    name = profile.username
    text = data.text
    stamp = data.stamp
    after-auth ->
      item =
        name: name
        avatar: profile.avatar
        time: time
        text: text
        stamp: make-stamp!
        topic: stamp
      log "reply:", item
      posts.save item, ->
      socket.emit 'add-reply', item
      log "adding replay", item

      mention = data.text.match /@\S+/
      if mention?
        receiver = mention.0[1 to].join ""
        if receiver.length < 20
          msg = {name, time, text, receiver, stamp}
          msgs.save msg, ->

  socket.on "clear", ->
    if profile.username?
      msgs.remove receiver: that, ->

  socket.on "more-topic", (stamp) ->
    q = {stamp: {$lt: stamp}}
    log "q", q
    topics.limit 10 .all q, (err, docs) ->
      socket.emit "more-topic", docs.reverse!

  socket.on "more-post", (stamp) ->
    log "lt:", stamp
    q1 = {topic: my-topic}
    q2 = {stamp: {$lt: stamp}}
    log stamp, q2, my-topic
    posts.find q1 .sort {stamp: 1} .limit 10 .all q2, (err, docs) ->
      socket.emit "more-post", docs
      log "docs:", docs
