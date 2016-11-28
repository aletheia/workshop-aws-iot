(function($) {

    // Initialize credentials and endpoints
    var AWS_IOT_ENDPOINT = 'YOUR_IOT_ENDPOINT';
    AWS.config.region = 'eu-west-1'; // Region
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: 'YOUR_COGNITO_POOL_ID',
    });

    AWS.config.credentials.get(function(err) {
        if (err) {
            return console.error("Cognito credentials error", err);
        }
        console.log("Obtrained Cognito credentials");
        initMQTTClient();
    });

    function initMQTTClient() {
        var clientID = newUUID(),
            requestURL = SigV4Utils.getSignedUrl(AWS_IOT_ENDPOINT, AWS.config.region, AWS.config.credentials),
            client = new Paho.MQTT.Client(requestURL, clientID),
            connectOptions = {
                useSSL: true,
                timeout: 3,
                mqttVersion: 4,
                onSuccess: function() {
                    console.log('[MQTT Client] connected');
                    initSimulatorDOM(client);
                },
                onFailure: function(err) {
                    console.error('connect failed', err);
                    alert("Something went wrong with the MQTT Client");
                }
            };

        client.connect(connectOptions);

        client.onConnectionLost = function(error) {
            console.error('[MQTT Client] connection lost ', error);
        };

    }

    function initSimulatorDOM(MQTTClient) {

        var $field = $("#field"),
            $drones = $field.find('.drone'),
            $newDrone = $("#new-drone"),
            field = new Field($field);

        field.onDroneMove = function(drone) {
            var msgBody = {
                XPosition: drone.getX(),
                YPosition: drone.getY(),
                XSpeed: drone.xSpeed,
                YSpeed: drone.ySpeed,
                IrrigationPower: drone.power
            };
            var message = new Paho.MQTT.Message(JSON.stringify(msgBody));
            message.destinationName = 'myapp/simulation/drones/' + drone.id;
            MQTTClient.send(message);
        };

        MQTTClient.subscribe('myapp/simulation/commands');

        MQTTClient.onMessageArrived = function(message) {
            var topic = message.destinationName,
                payload = JSON.parse(message.payloadString),
                ID = payload.ID;

            if (ID === 'all') {
                field.notifyDrones(payload);
            } else {
                field.notifyDrone(ID, payload);
            }
        };

        field.initDrones($drones);

        $newDrone.on('click', function(e) {
            e.preventDefault();
            var $el = $("<div/>").addClass('drone');
            $el.appendTo($field);
            field.initDrones($el);
        });

        // debug
        window.MQTTClient = MQTTClient;
        window.field = field;

    }

})(window.jQuery);