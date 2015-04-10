module csComp.Services {

   

    declare var JSON;
    declare var io;

    export class ConnectionService {
        
        public static $inject = [                       
            'messageBusService',
            'layerService'
              
        ];
        
        constructor(
            private $messageBusService: Services.MessageBusService,
            private $layerService: Services.LayerService) {  

            // connectie opzetten
            // toegang tot primus/socket.io object
            // mb.

            
            
               
        }
        
       

        
    }

}