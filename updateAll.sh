tsc -p csServerComp
(cd csComp && npm update)
tsc -p csComp
(cd example && npm update)
(cd example/public && bower install)
(cd example/ && gulp all)
tsc -p example
(cd example/ && gulp built_csComp.d.ts)
tsc -p test
