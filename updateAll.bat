@echo off
REM Run npm and bower update, and start gulp
REM As they are all commands, I need to call them, otherwise the script will exit automatically after each program.
cd csServerComp
call tsc
REM cd ../csComp
REM call npm install
call tsc
cd ../example
call npm install
cd public
call bower install
cd ..
call gulp all
call tsc
call gulp built_csComp.d.ts
cd ../test
call tsc 
cd ../example
call karma start ../test/karma.conf.js
