
log = -> console?.log?.apply console, arguments
delay = -> set-timeout &1, &0

$ ->
  socket = io.connect "ws://192.168.1.19:3006"
  socket.on "greet", -> log "greet"

  element =
    mount: {}
    tmpl: ""
    bind: ->
    render: (data) ->
      log @
      @mount.html tmpl @tmpl data
      index.state = @tag
      @bind!

  login-element =
    state: ""
    __proto__: element
    mount: $ '#paper'

  index =
    login:
      tag: "login"
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
        $ '#paper .login' .click (click) ->
          if click.target.class-name is "submit"
            username = $ '#username' .val!
            password = $ '#password' .val!
            socket.emit "login", {username, password}
            index.loading.render!
    loading:
      tag: "loading"
      __proto__: login-element
      tmpl: ->
        ".loading":
          * span: "Loading"
          * ".menu":
              "img src='pic/loading.gif'": ""
      bind: ->
        delay 5000, ->
          log index.state
          if index.state is "loading"
            index.failed.render!
    logout:
      "tag": "logout"
      __proto__: login-element
      tmpl: (data) ->
        ".logout":
          * span: "Logout"
          * ".menu":
              * ".line":
                  span: data.username
              * ".line":
                  "button.click": "Logout"
      bind: ->
        $ '#paper .logout' .click (click) ->
          log click
          if click.target.class-name is "click"
            socket.emit "logout"
            index.login.render!
    failed:
      tag: "failed"
      __proto__: login-element
      tmpl: ->
        "./failed": "Failed"
      bind: ->
        delay 2000, ->
          index.login.render()

  index.login.render()
  socket.on "login", (data) ->
    log "login", data
    if data.state is "success"
      index.logout.render data.data
    else
      index.failed.render!

  # handle login events