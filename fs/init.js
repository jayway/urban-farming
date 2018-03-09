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

let topic = 'jayway';
let forkPin = 34;
let dhtPin = 5;
let mydht = DHT.create(dhtPin, DHT.DHT11);

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
  let forkData = ADC.read(34);
  let sensors = {
    dht: dhtData,
    tsl: tslData,
    fork: forkData
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

Timer.set(5000 /* 1 sec */, true /* repeat */, sendData, null);