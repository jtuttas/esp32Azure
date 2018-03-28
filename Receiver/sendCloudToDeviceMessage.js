'use strict';

var Client = require('azure-iothub').Client;
var Message = require('azure-iot-common').Message;
var connectionString = 'HostName=TuttasHub.azure-devices.net;SharedAccessKeyName=iothubowner;SharedAccessKey=PB9IOkKm+8xv51BWp5XM5PfCXx6JB4SFWdYyxv2+2ak=';
var targetDevice = 'esp32_35D9D4';

var serviceClient = Client.fromConnectionString(connectionString);

var EventHubClient = require('azure-event-hubs').Client;
var printError = function (err) {
    console.log(err.message);
};

var printMessage = function (message) {
    console.log('Message received: ');
    console.log(JSON.stringify(message.body));
    console.log('');
};
var client = EventHubClient.fromConnectionString(connectionString);
client.open()
    .then(client.getPartitionIds.bind(client))
    .then(function (partitionIds) {
        return partitionIds.map(function (partitionId) {
            return client.createReceiver('$Default', partitionId, { 'startAfterTime' : Date.now()}).then(function(receiver) {
                console.log('Created partition receiver: ' + partitionId)
                receiver.on('errorReceived', printError);
                receiver.on('message', printMessage);
            });
        });
    })
    .catch(printError);

function printResultFor(op) {
    return function printResult(err, res) {
        if (err) console.log(op + ' error: ' + err.toString());
        if (res) console.log(op + ' status: ' + res.constructor.name);
    };
}

function receiveFeedback(err, receiver) {
    receiver.on('message', function (msg) {
        console.log('Feedback message:')
        console.log(msg.getData().toString('utf-8'));
    });
}

  /*
  serviceClient.open(function (err) {
    if (err) {
      console.error('Could not connect: ' + err.message);
    } else {
      console.log('Service client connected');
      serviceClient.getFeedbackReceiver(receiveFeedback);
      var message = new Message('{state:1}');
      message.ack = 'full';
      message.messageId = "My Message ID";
      console.log('Sending message: ' + message.getData());
      serviceClient.send(targetDevice, message, printResultFor('send'));

      console.log('Weiter gehts');

    }
  });
*/
  