
{print} = require "util"
{spawn} = require "child_process"

echo = (child) ->
  child.stderr.pipe process.stderr
  child.stdout.pipe process.stdout

d = __dirname
split = (str) -> str.split " "

queue = [
  "jade -O #{d}/page/ -wP #{d}/src/"
  "livescript -o #{d}/page/ -wbc #{d}/src/"
  "stylus -o #{d}/page/ -w #{d}/src/"
  "doodle #{d}/page #{d}/server/app.ls #{d}/server/get-auth.ls"
  "node-dev #{d}/server/app.ls"
]

task "dev", "watch and convert files", ->
  queue.map(split).forEach (array) ->
    echo (spawn array[0], array[1..])