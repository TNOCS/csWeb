@echo off
start /B atom  . ../csComp ../csServerComp
nodemon server.js
start http://localhost:3456