var log, delay;
log = function(){
  var ref$;
  return typeof console != 'undefined' && console !== null ? (ref$ = console.log) != null ? ref$.apply(console, arguments) : void 8 : void 8;
};
delay = function(){
  return setTimeout(arguments[1], arguments[0]);
};
$(function(){
  var socket, element, loginElement, index;
  socket = io.connect("ws://192.168.1.19:3006");
  socket.on("greet", function(){
    return log("greet");
  });
  element = {
    mount: {},
    tmpl: "",
    bind: function(){},
    render: function(data){
      log(this);
      this.mount.html(tmpl(this.tmpl(data)));
      index.state = this.tag;
      return this.bind();
    }
  };
  loginElement = {
    state: "",
    __proto__: element,
    mount: $('#paper')
  };
  index = {
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
        return $('#paper .login').click(function(click){
          var username, password;
          if (click.target.className === "submit") {
            username = $('#username').val();
            password = $('#password').val();
            socket.emit("login", {
              username: username,
              password: password
            });
            return index.loading.render();
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
          log(index.state);
          if (index.state === "loading") {
            return index.failed.render();
          }
        });
      }
    },
    logout: {
      "tag": "logout",
      __proto__: loginElement,
      tmpl: function(data){
        return {
          ".logout": [
            {
              span: "Logout"
            }, {
              ".menu": [
                {
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
        return $('#paper .logout').click(function(click){
          log(click);
          if (click.target.className === "click") {
            socket.emit("logout");
            return index.login.render();
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
          return index.login.render();
        });
      }
    }
  };
  index.login.render();
  return socket.on("login", function(data){
    log("login", data);
    if (data.state === "success") {
      return index.logout.render(data.data);
    } else {
      return index.failed.render();
    }
  });
});