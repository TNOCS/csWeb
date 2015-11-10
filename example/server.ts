import Winston = require('winston');
import * as csweb from "csweb";


Winston.remove(Winston.transports.Console);
Winston.add(Winston.transports.Console, <Winston.ConsoleTransportOptions>{
    colorize: true,
    prettyPrint: true
});



var cs = new csweb.csServer(__dirname);
cs.start(() => {
    console.log('started');
});
