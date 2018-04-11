load('api_config.js');
load('api_events.js');
load('api_gpio.js');
load('api_mqtt.js');
load('api_net.js');
load('api_sys.js');
load('api_timer.js');
load('api_arduino_tsl2561.js');
load("api_dht.js");
load("api_adc.js");

let sendDataFreq = 5000;
let topic = 'jayway';
let forkPin = 34;
let dhtPin = 18;
let button = 17;
let showerPin = 19;
let mockShowerPin = 5;
let mydht = DHT.create(dhtPin, DHT.DHT11);

GPIO.set_mode(mockShowerPin, GPIO.MODE_OUTPUT);
GPIO.write(mockShowerPin, 1);
ADC.enable(forkPin);
// Monitor network connectivity.
Event.addGroupHandler(Net.EVENT_GRP, function(ev, evdata, arg) {
  let evs = '???';
  if (ev === Net.STATUS_DISCONNECTED) {
    evs = 'DISCONNECTED';
  } else if (ev === Net.STATUS_CONNECTING) {
    evs = 'CONNECTING';
  } else if (ev === Net.STATUS_CONNECTED) {
    evs = 'CONNECTED';
  } else if (ev === Net.STATUS_GOT_IP) {
    evs = 'GOT_IP';
  }
  print('== Net event:', ev, evs);
}, null);

//Initialize Adafruit_TSL2561 library
let tsl = Adafruit_TSL2561.create();
print('Adafruit_TSL2561.TSL2561_GAIN_16X -> ',Adafruit_TSL2561.TSL2561_GAIN_16X);
tsl.setGain(Adafruit_TSL2561.TSL2561_GAIN_0X);
tsl.setIntegrationTime(Adafruit_TSL2561.TSL2561_INTEGRATIONTIME_402MS);
tsl.begin();

let getSensorData = function() {
  let dhtData = dhtGetData();
  let tslData = tslGetData();
  let forkData = ADC.read(forkPin);
  let deviceId = Cfg.get('device.id');
  let time = Timer.now();
  let sensors = {
    dht: dhtData,
    tsl: tslData,
    fork: forkData,
    deviceId: deviceId,
    time: time
  };

  return sensors;
};

let dhtGetData = function() {
  let temp = mydht.getTemp();
  let hum = mydht.getHumidity();
  let data = {
    temp: temp,
    hum: hum
  };
  return data;
};

let tslGetData = function() {
    let vis = tsl.getVisible();
    let ir = tsl.getInfrared();
    let lux = tsl.calculateLux(vis, ir);
    let readings = {
      visread: vis,
      irread: ir,
      luxread: lux
    };
    return readings;
};

let sendData = function() {
  let message = JSON.stringify(getSensorData());
  let ok = MQTT.pub(topic, message, 1);
  print('Published:', ok, topic, '->', message);
};

MQTT.sub('shower', function(conn, topic, msg) {
     print('Topic:', topic, 'message:', msg);
     let message = JSON.parse(msg);
     shower(message.milliSecs);
}, null);

let shower = function(milliSecs) {
	GPIO.write(mockShowerPin, 0);
	print('Showering');
	Timer.set(milliSecs, false, function() {
   		GPIO.write(mockShowerPin, 1);
   		print('Done showering');
 	}, null);
};

/*
//Frequently send data to AWS IoT with sensordata
Timer.set(sendDataFreq, Timer.REPEAT, function() {
      sendData();
}, null);
*/

GPIO.set_button_handler(button, GPIO.PULL_UP, GPIO.INT_EDGE_NEG, 200, function() {
  sendData();
}, null);
