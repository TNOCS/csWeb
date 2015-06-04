cd csServerComp
tsc
cd ../csComp
npm update
tsc
cd ../example
npm update
cd public
bower install
cd ..
gulp all
tsc
