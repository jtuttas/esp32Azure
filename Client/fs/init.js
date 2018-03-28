load('api_config.js');
load('api_mqtt.js');
load('api_sys.js');
load('api_timer.js');
load('api_rpc.js');
load('api_gpio.js');
load('api_arduino_onewire.js');
load('api_arduino_dallas_temp.js');

let topic = 'devices/' + Cfg.get('device.id') + '/messages/events/';
let subtopic = 'devices/' + Cfg.get('device.id') + '/sub/events/#';
let oneWirePin = 5;
let pin = 4;
let ledstate = 0;

// Initialize 1-Wire bus
let ow = OneWire.create(oneWirePin);
// Initialize DallasTemperature library
let dt = DallasTemperature.create(ow);
// Start up the library
dt.begin();
// Number of sensors found on the 1-Wire bus
let n = 0;
// Sensors addresses
let sens = [];
let sekCounter = 0;

GPIO.set_mode(pin, GPIO.MODE_OUTPUT);

// This function reads data from the DS sensors every 2 seconds
Timer.set(1000 /* milliseconds */, Timer.REPEAT, function () {
  if (n === 0) {
    n = dt.getDeviceCount();
    print('Sensors found:', n);

    for (let i = 0; i < n; i++) {
      sens[i] = '01234567';
      if (dt.getAddress(sens[i], i) === 1) {
        print('Sensor#', i, 'address:', dt.toHexStr(sens[i]));
      }
    }
  }

  dt.requestTemperatures();
  for (let i = 0; i < n; i++) {
    print('Sensor#', i, 'Temperature:', dt.getTempC(sens[i]), '*C');
  }
  // Jede Minute die Daten in die Cloud
  if (sekCounter % 60 === 0) {
    let msg = JSON.stringify({ state: ledstate, temp: dt.getTempC(sens[0]) });
    let ok = MQTT.pub(topic, msg, 1);
    print(ok, topic, '->', msg);
  }
  sekCounter++;


}, null);

// Receive MQTT Messages from Azure
MQTT.sub('devices/' + Cfg.get('device.id') + '/messages/devicebound/#', function (conn, topic, msg) {
  print('Topic:', topic, 'message:', msg);
  let obj = JSON.parse(msg);
  ledstate = obj.state
  GPIO.write(pin, obj.state);
}, null);


RPC.addHandler('App.SetState', function (args) {
  print("App.SetState")
  GPIO.write(pin, args.state);
  ledstate = args.state;
  // Message Senden
  let msg = JSON.stringify({ state: ledstate, temp: dt.getTempC(sens[0]) });
  let ok = MQTT.pub(topic, msg, 1);
  print(ok, topic, '->', msg);
  return { state: ledstate, temp: dt.getTempC(sens[0]) };
});

RPC.addHandler('App.GetTemp', function (args) {
  let msg = JSON.stringify({ state: ledstate, temp: dt.getTempC(sens[0]) });
  let ok = MQTT.pub(topic, msg, 1);
  print(ok, topic, '->', msg);
  return { state: ledstate, temp: dt.getTempC(sens[0]) };
});

