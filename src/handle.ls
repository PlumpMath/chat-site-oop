
log = -> console?.log?.apply console, arguments
delay = -> set-timeout &1, &0

$ ->
  socket = io.connect "ws://192.168.1.19:3006"
  socket.on "greet", -> log "greet"

  element =
    mount: {}
    tmpl: ""
    bind: (data) ->
    render: (data) ->
      log @
      @mount.html tmpl @tmpl data
      user.state = @id
      @bind data

  # hanle login/logout

  login-element =
    state: ""
    __proto__: element
    mount: $ '#user'

  user =
    login:
      id: "login"
      __proto__: login-element
      tmpl: ->
        ".login":
          * span: "login"
          * ".menu":
              * ".line":
                  "span": "Username"
                  "input/username": ""
              * ".line":
                  "span": "Password"
                  "input/password": ""
              * "button.submit": "Submit"
      bind: ->
        @mount .click (click) ->
          if click.target.class-name is "submit"
            username = $ '#username' .val!
            password = $ '#password' .val!
            socket.emit "login", {username, password}
            user.loading.render!
    loading:
      id: "loading"
      __proto__: login-element
      tmpl: ->
        ".loading":
          * span: "Loading"
          * ".menu":
              "img src='pic/loading.gif'": ""
      bind: ->
        delay 5000, ->
          log user.state
          if user.state is "loading"
            user.failed.render!
    logout:
      "id": "logout"
      __proto__: login-element
      tmpl: (data) ->
        ".logout":
          * span: "Logout"
          * ".menu":
              * "/line":
                  "img src='#{data.avatar}'": ""
              * ".line":
                  span: data.username
              * ".line":
                  "button.click": "Logout"
      bind: ->
        @mount .click (click) ->
          log click
          if click.target.class-name is "click"
            socket.emit "logout"
            user.login.render!
    failed:
      id: "failed"
      __proto__: login-element
      tmpl: ->
        "./failed": "Failed"
      bind: ->
        delay 2000, ->
          user.login.render()

  user.login.render()
  socket.on "login", (data) ->
    log "login", data
    if data.state is "success"
      user.logout.render data.data
    else
      user.failed.render!

  # handle topic list and posts

  page-element =
    __proto__: element
    mount: $ '#paper'
    unit: (item) ->
      info =
        * ".name": item.name
        * ".time": item.time
      if item.reply?
        info.unshift ".reply stamp='#{item.stamp}'":
          item.reply.to-string!
      ".unit":
        * "img.avatar src='#{item.avatar}'": ""
        * ".text": item.text
        * ".info": info
    check-string: (str, f) ->
      if str.length > 0 then f!
      else notify.insert text: "dont send empty string!"
    placeholder: "placeholder='write here'"
    stamp: ""

  main =
    state: ""
    topic:
      __proto__: page-element
      id: "topic"
      tmpl: (data) ->
        ".topic":
          * ".submit-area":
              * ".line":
                  * "textarea/say #{@placeholder}": "Nothing yet."
                  * "button.submit": "Submit"
          * ".list": data.map @unit
      bind: ->
        log "mount", @mount
        self = @
        @mount .find ".topic" .click (click) ->
          switch click.target.class-name
            when "submit"
              text = self.mount .find 'textarea' .val!
              page-element.check-string text, ->
                socket.emit "create-topic", text
                self.mount .find 'textarea' .val ""
            when "reply"
              stamp = $ click.target .attr "stamp"
              log "stamp-->", stamp
              page-element.stamp = stamp
              log page-element.stamp
              socket.emit "load-topic", stamp
      insert: (item) ->
        log "insert", @
        @mount .find '.list' .prepend (tmpl @unit item)
    post:
      __proto__: page-element
      id: "post"
      tmpl: (data) ->
        ".post":
          * ".list": data.map @unit
          * ".submit-area":
              * "textarea.reply #{@placeholder}": ""
              * "button.submit": "Submit"
      bind: ->
        self = @
        @mount .find '.post' .click (click) ->
          if click.target.class-name is "submit"
            text = self.mount .find ".reply" .val!
            page-element.check-string text, ->
              data =
                text: text
                stamp: page-element.stamp
              log "data:", data
              socket.emit "add-reply", data
              self.mount .find ".reply" .val ""

  log main.topic
  demo =
    list:
      * text: "one"
      * text: "two"
      * text: "three"
  
  $ '#home' .click -> socket.emit "topics"
  socket.on "topics", (list) -> main.topic.render list
  $ '#home' .click!

  socket.on "create-topic", (item) ->
    main.topic.insert item

  socket.on "load-topic", (list) ->
    log "list", list
    main.post.render list

  # render notifications

  notify =
    __proto__: element
    mount: $ '#notify'
    unit: (item) ->
      "p": item.text
    stack: []
    tmpl: ->
      log "tmpl:", @stack
      ".msg":
        * "span": "Msg"
        * "span.count": "#{@stack.length}"
        * ".menu":
            * ".list": @stack.map @unit
            * "button.clear": "Clear"
    insert: (item) ->
      @stack.push item
      @render!
    bind: ->
      @mount .click (click) ->
        if click.target.class-name is "clear"
          notify.stack = []
          notify.render!

  notify.stack = [text: "hello"]
  notify.render!
  socket.on "notify", (item) -> notify.insert item