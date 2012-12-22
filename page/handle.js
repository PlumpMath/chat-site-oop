var log, delay;
log = function(){
  var ref$;
  return typeof console != 'undefined' && console !== null ? (ref$ = console.log) != null ? ref$.apply(console, arguments) : void 8 : void 8;
};
delay = function(){
  return setTimeout(arguments[1], arguments[0]);
};
$(function(){
  var socket, ls, element, loginElement, user, pageElement, main, demo, notify;
  socket = io.connect("ws://192.168.1.19:3006");
  socket.on("greet", function(){
    return log("greet");
  });
  ls = localStorage;
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
        var username, password, ref$;
        username = "value='" + (ls.username || "") + "'";
        password = "value='" + (ls.password || "") + "' type='password'";
        return {
          ".login": [
            {
              span: "login"
            }, {
              ".menu": [
                {
                  ".line": [
                    {
                      "span": "Username"
                    }, (ref$ = {}, ref$["input/username " + username] = "", ref$)
                  ]
                }, {
                  ".line": [
                    {
                      "span": "Password"
                    }, (ref$ = {}, ref$["input/password " + password] = "", ref$)
                  ]
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
            ls.username = username = $('#username').val();
            ls.password = password = $('#password').val();
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
        $('#home').click();
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
      var info, ref$, ref1$;
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
      return ref$ = {}, ref$[".unit stamp='" + item.stamp + "'"] = [
        (ref1$ = {}, ref1$["img.avatar src='" + item.avatar + "'"] = "", ref1$), {
          ".text": item.text
        }, {
          ".info": info
        }
      ], ref$;
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
            }, {
              ".more": "More"
            }
          ]
        };
      },
      bind: function(){
        var self;
        log("mount", this.mount);
        self = this;
        return this.mount.find(".topic").click(function(click){
          var text, stamp, last;
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
          case "more":
            last = self.mount.find(".list").children().last().find(".reply");
            log(last);
            if (last[0] != null) {
              return socket.emit("more-topic", last.attr("stamp"));
            }
          }
        });
      },
      insert: function(item){
        log("insert", this);
        return this.mount.find('.list').prepend(tmpl(this.unit(item)));
      },
      more: function(list){
        var render, html;
        if (list.length > 0) {
          render = compose$([tmpl, this.unit]);
          html = list.map(render).join("");
          return this.mount.find(".list").append(html);
        } else {
          return this.mount.find(".more").remove();
        }
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
              ".more": "More"
            }, {
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
          var text, first;
          switch (click.target.className) {
          case "submit":
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
          case "more":
            first = self.mount.find(".list").children().first();
            log(first);
            if (first[0] != null) {
              return socket.emit("more-post", first.attr("stamp"));
            }
          }
        });
      },
      insert: function(item){
        return this.mount.find(".list").append(tmpl(this.unit(item)));
      },
      more: function(list){
        var render, html;
        if (list.length > 0) {
          render = compose$([tmpl, this.unit]);
          html = list.map(render).join("");
          return this.mount.find(".list").prepend(html);
        } else {
          return this.mount.find(".more").remove();
        }
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
  socket.on("add-reply", function(item){
    return main.post.insert(item);
  });
  socket.on("more-topic", function(list){
    return main.topic.more(list);
  });
  socket.on("more-post", function(list){
    return main.post.more(list);
  });
  notify = {
    __proto__: element,
    mount: $('#notify'),
    unit: function(item){
      var ref$;
      log("unit", item);
      if (item.receiver != null) {
        return ref$ = {}, ref$[".link stamp='" + item.stamp + "'"] = [
          {
            "span.span": item.name
          }, {
            "span.span": item.text
          }
        ], ref$;
      } else {
        return {
          "p": item.text
        };
      }
    },
    stack: [],
    tmpl: function(){
      log("tmpl:", this.stack);
      if (this.stack.length > 0) {
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
      } else {
        return {};
      }
    },
    insert: function(item){
      this.stack.push(item);
      return this.render();
    },
    bind: function(){
      return this.mount.click(function(click){
        var stamp;
        switch (click.target.className) {
        case "clear":
          notify.stack = [];
          notify.render();
          return socket.emit("clear");
        case "link":
          stamp = $(click.target).attr("stamp");
          pageElement.stamp = stamp;
          log(pageElement.stamp);
          return socket.emit("load-topic", stamp);
        case "span":
          return $(click.target).parent().click();
        }
      });
    }
  };
  return socket.on("msgs", function(list){
    notify.stack = list;
    notify.render();
    return log("list", list);
  });
});
function compose$(fs){
  return function(){
    var i, args = arguments;
    for (i = fs.length; i > 0; --i) { args = [fs[i-1].apply(this, args)]; }
    return args[0];
  };
}