var log, delay;
log = function(){
  var ref$;
  return typeof console != 'undefined' && console !== null ? (ref$ = console.log) != null ? ref$.apply(console, arguments) : void 8 : void 8;
};
delay = function(){
  return setTimeout(arguments[1], arguments[0]);
};
$(function(){
  var socket, element, loginElement, user, pageElement, main, demo, notify;
  socket = io.connect("ws://192.168.1.19:3006");
  socket.on("greet", function(){
    return log("greet");
  });
  element = {
    mount: {},
    tmpl: "",
    bind: function(data){},
    render: function(data){
      log(this);
      this.mount.html(tmpl(this.tmpl(data)));
      user.state = this.tag;
      return this.bind(data);
    }
  };
  loginElement = {
    state: "",
    __proto__: element,
    mount: $('#user')
  };
  user = {
    login: {
      tag: "login",
      __proto__: loginElement,
      tmpl: function(){
        return {
          ".login": [
            {
              span: "login"
            }, {
              ".menu": [
                {
                  ".line": {
                    "span": "Username",
                    "input/username": ""
                  }
                }, {
                  ".line": {
                    "span": "Password",
                    "input/password": ""
                  }
                }, {
                  "button.submit": "Submit"
                }
              ]
            }
          ]
        };
      },
      bind: function(){
        return this.mount.click(function(click){
          var username, password;
          if (click.target.className === "submit") {
            username = $('#username').val();
            password = $('#password').val();
            socket.emit("login", {
              username: username,
              password: password
            });
            return user.loading.render();
          }
        });
      }
    },
    loading: {
      tag: "loading",
      __proto__: loginElement,
      tmpl: function(){
        return {
          ".loading": [
            {
              span: "Loading"
            }, {
              ".menu": {
                "img src='pic/loading.gif'": ""
              }
            }
          ]
        };
      },
      bind: function(){
        return delay(5000, function(){
          log(user.state);
          if (user.state === "loading") {
            return user.failed.render();
          }
        });
      }
    },
    logout: {
      "tag": "logout",
      __proto__: loginElement,
      tmpl: function(data){
        var ref$;
        return {
          ".logout": [
            {
              span: "Logout"
            }, {
              ".menu": [
                {
                  "/line": (ref$ = {}, ref$["img src='" + data.avatar + "'"] = "", ref$)
                }, {
                  ".line": {
                    span: data.username
                  }
                }, {
                  ".line": {
                    "button.click": "Logout"
                  }
                }
              ]
            }
          ]
        };
      },
      bind: function(){
        return this.mount.click(function(click){
          log(click);
          if (click.target.className === "click") {
            socket.emit("logout");
            return user.login.render();
          }
        });
      }
    },
    failed: {
      tag: "failed",
      __proto__: loginElement,
      tmpl: function(){
        return {
          "./failed": "Failed"
        };
      },
      bind: function(){
        return delay(2000, function(){
          return user.login.render();
        });
      }
    }
  };
  user.login.render();
  socket.on("login", function(data){
    log("login", data);
    if (data.state === "success") {
      return user.logout.render(data.data);
    } else {
      return user.failed.render();
    }
  });
  pageElement = {
    __proto__: element,
    mount: $('#paper')
  };
  main = {
    state: "",
    topic: {
      __proto__: pageElement,
      unit: function(item){
        var ref$;
        return {
          ".unit": [
            (ref$ = {}, ref$["img.avatar src='" + item.avatar + "'"] = "", ref$), {
              ".text": item.text
            }, {
              ".info": [
                {
                  ".name": item.name
                }, {
                  ".time": item.time
                }
              ]
            }
          ]
        };
      },
      tmpl: function(data){
        return {
          ".topic": [
            {
              ".submit-area": {
                ".line": [
                  {
                    "textarea/say placeholder='write here'": "Nothing yet."
                  }, {
                    "button.submit": "Submit"
                  }
                ]
              }
            }, {
              ".list": data.map(this.unit)
            }
          ]
        };
      },
      bind: function(){
        log("mount", this.mount);
        return this.mount.click(function(click){
          var text;
          switch (click.target.className) {
          case "submit":
            text = $(this).find('textarea').val();
            socket.emit("create-topic", text);
            return $(this).find('textarea').val("");
          }
        });
      },
      insert: function(item){
        log("insert", this);
        return this.mount.find('.list').prepend(tmpl(this.unit(item)));
      }
    }
  };
  log(main.topic);
  demo = {
    list: [
      {
        text: "one"
      }, {
        text: "two"
      }, {
        text: "three"
      }
    ]
  };
  $('#home').click(function(){
    return socket.emit("topics");
  });
  socket.on("topics", function(list){
    return main.topic.render(list);
  });
  $('#home').click();
  socket.on("create-topic", function(item){
    return main.topic.insert(item);
  });
  notify = {
    __proto__: element,
    mount: $('#notify'),
    unit: function(item){
      return {
        "p": item.text
      };
    },
    stack: [],
    tmpl: function(){
      log("tmpl:", this.stack);
      return {
        ".msg": [
          {
            "span": "Msg"
          }, {
            "span.count": this.stack.length + ""
          }, {
            ".menu": {
              ".list": this.stack.map(this.unit)
            }
          }
        ]
      };
    },
    insert: function(item){
      this.stack.push(item);
      return this.render();
    },
    bind: function(){}
  };
  notify.stack = [{
    text: "hello"
  }];
  notify.render();
  return notify.insert({
    text: "world"
  });
});