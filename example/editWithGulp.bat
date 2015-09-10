start /B atom ./ ../csComp ../csServerComp ../test
start gulp
nodemon --delay 1000ms server.js
start http://localhost:3002