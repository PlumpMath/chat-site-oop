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
      user.state = this.id;
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
      id: "login",
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
      id: "loading",
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
      "id": "logout",
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
      id: "failed",
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
    mount: $('#paper'),
    unit: function(item){
      var info, ref$;
      info = [
        {
          ".name": item.name
        }, {
          ".time": item.time
        }
      ];
      if (item.reply != null) {
        info.unshift((ref$ = {}, ref$[".reply stamp='" + item.stamp + "'"] = item.reply.toString(), ref$));
      }
      return {
        ".unit": [
          (ref$ = {}, ref$["img.avatar src='" + item.avatar + "'"] = "", ref$), {
            ".text": item.text
          }, {
            ".info": info
          }
        ]
      };
    },
    checkString: function(str, f){
      if (str.length > 0) {
        return f();
      } else {
        return notify.insert({
          text: "dont send empty string!"
        });
      }
    },
    placeholder: "placeholder='write here'",
    stamp: ""
  };
  main = {
    state: "",
    topic: {
      __proto__: pageElement,
      id: "topic",
      tmpl: function(data){
        var ref$;
        return {
          ".topic": [
            {
              ".submit-area": {
                ".line": [
                  (ref$ = {}, ref$["textarea/say " + this.placeholder] = "Nothing yet.", ref$), {
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
        var self;
        log("mount", this.mount);
        self = this;
        return this.mount.find(".topic").click(function(click){
          var text, stamp;
          switch (click.target.className) {
          case "submit":
            text = self.mount.find('textarea').val();
            return pageElement.checkString(text, function(){
              socket.emit("create-topic", text);
              return self.mount.find('textarea').val("");
            });
          case "reply":
            stamp = $(click.target).attr("stamp");
            log("stamp-->", stamp);
            pageElement.stamp = stamp;
            log(pageElement.stamp);
            return socket.emit("load-topic", stamp);
          }
        });
      },
      insert: function(item){
        log("insert", this);
        return this.mount.find('.list').prepend(tmpl(this.unit(item)));
      }
    },
    post: {
      __proto__: pageElement,
      id: "post",
      tmpl: function(data){
        var ref$;
        return {
          ".post": [
            {
              ".list": data.map(this.unit)
            }, {
              ".submit-area": [
                (ref$ = {}, ref$["textarea.reply " + this.placeholder] = "", ref$), {
                  "button.submit": "Submit"
                }
              ]
            }
          ]
        };
      },
      bind: function(){
        var self;
        self = this;
        return this.mount.find('.post').click(function(click){
          var text;
          if (click.target.className === "submit") {
            text = self.mount.find(".reply").val();
            return pageElement.checkString(text, function(){
              var data;
              data = {
                text: text,
                stamp: pageElement.stamp
              };
              log("data:", data);
              socket.emit("add-reply", data);
              return self.mount.find(".reply").val("");
            });
          }
        });
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
  socket.on("load-topic", function(list){
    log("list", list);
    return main.post.render(list);
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
            ".menu": [
              {
                ".list": this.stack.map(this.unit)
              }, {
                "button.clear": "Clear"
              }
            ]
          }
        ]
      };
    },
    insert: function(item){
      this.stack.push(item);
      return this.render();
    },
    bind: function(){
      return this.mount.click(function(click){
        if (click.target.className === "clear") {
          notify.stack = [];
          return notify.render();
        }
      });
    }
  };
  notify.stack = [{
    text: "hello"
  }];
  notify.render();
  return socket.on("notify", function(item){
    return notify.insert(item);
  });
});