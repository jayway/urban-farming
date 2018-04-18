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

let freq = 5000;
let topic = 'urban/' + Cfg.get('device.id');
let showerSubTopic = 'urban/' + Cfg.get('device.id') + '/shower';
let forkPin = 34;
let dhtPin = 22;
let showerPin = 21;
let mock = 5;	//built-in led pin on Lolin32 board
let mydht = DHT.create(dhtPin, DHT.DHT11);
//let btn = 17; //if button is connected to the board


// Enable pins at start. Built in led pin 5 turns on when low and off att high
GPIO.set_mode(showerPin, GPIO.MODE_OUTPUT);
GPIO.set_mode(mock, GPIO.MODE_OUTPUT);
GPIO.write(mock, 0);
GPIO.write(showerPin, 0);
ADC.enable(forkPin);

// Initialize Adafruit_TSL2561 library
let tsl = Adafruit_TSL2561.create();
print('Adafruit_TSL2561.TSL2561_GAIN_16X -> ',Adafruit_TSL2561.TSL2561_GAIN_16X);
tsl.setGain(Adafruit_TSL2561.TSL2561_GAIN_0X);
tsl.setIntegrationTime(Adafruit_TSL2561.TSL2561_INTEGRATIONTIME_402MS);
tsl.begin();

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



let getSensorData = function() {
  let dhtData = dhtGetData();
  let tslData = tslGetData();
  let forkData = ADC.read(forkPin);
  let id = Cfg.get('device.id');
  let time = Timer.now();
  let fullTime = Timer.fmt("%c", time);
  let sensors = {
    dht: dhtData,
    tsl: tslData,
    fork: forkData,
    deviceId: id,
    time: time,
    timestamp: fullTime
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
    let data = {
      vis: vis,
      ir: ir,
      lux: lux
    };
    return data;
};

let send = function() {
  let msg = JSON.stringify(getSensorData());
  let ok = MQTT.pub(topic, msg, 1);
  print('Published:', ok, topic, '->', msg);
};

MQTT.sub(showerSubTopic, function(conn, topic, msg) {
     print('Topic:', topic, 'message:', msg);
     shower(JSON.parse(msg).milliSecs);
}, null);

let shower = function(milliSecs) {
	GPIO.write(showerPin, 1);
	GPIO.write(mock, 1);
	//print('Showering');
	Timer.set(milliSecs, 0, function() {
   		GPIO.write(mock, 0);
   		GPIO.write(showerPin, 0);
   		//print('Done showering');
 	}, null);
};

//Frequently send data to AWS IoT with sensordata
Timer.set(freq, Timer.REPEAT, function() {
      send();
}, null);

//If button connected
GPIO.set_button_handler(btn, GPIO.PULL_UP, GPIO.INT_EDGE_NEG, 200, function() {
  foo();
}, null);
