@echo off
cd ../csServerComp
call tsc
cd ../csComp
call npm update
call tsc
cd ../csDataGatherer
call npm update
call gulp all
call tsc
gulp