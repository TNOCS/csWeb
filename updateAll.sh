tsc -p csServerComp
(cd csComp && npm update)
tsc -p csComp
(cd example && npm update)
(cd example/public && bower install)
(cd example/ && gulp all)
tsc -p example
tsc -p test
