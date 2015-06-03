start /B atom ./ ../csComp ../csServerComp ../test
start gulp
nodemon server.js
start http://localhost:3002