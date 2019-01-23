/*
  This application collects values from sensors measuring light,
  temperature, pH, EC and flow within a Hydroponics hardware system.
  It is connected to a backend in AWS, which operates as the controller in the system.
  The backend can turn water and light on or off through MQTT message,
  or by using the AWS IoT shadow.

  The values are presented in a built Web application. In the app, the user can see realtime
  and historic data, and also make configurations of the system.

  Author: David Tran
  Date:   sept 2018
*/
load('api_config.js');
load('api_events.js');
load('api_gpio.js');
load('api_mqtt.js');
load('api_net.js');
load('api_sys.js');
load('api_timer.js');
load('api_arduino_tsl2561.js');
load("api_adc.js");
load("api_math.js");
load('api_shadow.js');

/*********INFORMATION*********
  relay1 controls pH voltage
  relay2 controls pump voltage
  relay3 controls ec voltage
******************************/

/**** PINS ****/
let phPin = 36;
let ecPin = 39;
let relay1 = 15;    //into relay slot 1
let relay2 = 2;     //into relay slot 8
let relay3 = 4;     //into relay slot 6
let led = 5;	//built-in led pin on Lolin32 board
let pumpOnPin = 17; //if button is connected to the board

/**** FREQUENTCYS and CONSTANTS****/
let freqSend = 5000;
let freqPH = 120000;
let countPh = 10;
let countEc = 10;
let phWait = 10000;
let ecWait = 10000;

/**** MQTT TOPICS ****/
let topic = 'hydro/' + Cfg.get('device.id') + '/sensorData';
let pumpOnTopic =    'hydro/' + Cfg.get('device.id') + '/pumpOn';
let pumpOffTopic =   'hydro/' + Cfg.get('device.id') + '/pumpOff';
let setEcTopic = 'hydro/' + Cfg.get('device.id') + '/setEc';
let setPhOffsetTopic = 'hydro/' + Cfg.get('device.id') + '/setPhOffset';
let setPumpOnTopic = 'hydro/' + Cfg.get('device.id') + '/setPumpOnTime';
let setPumpOffTopic = 'hydro/' + Cfg.get('device.id') + '/setPumpOffTime';
let setConfigTopic = 'hydro/' + Cfg.get('device.id') + '/setConfig';

/**** AWS SHADOW STATE ****/
let state = {
  relay1: false,
  relay2: false};

/**** INITIAL PH AND EC VALUES ****/
let latestPh = 7;
let latestEc = 100;

/**** TIMER IDS ****/
let measurePhId = -1;
let measureEcId = -1;
let pumpId = -1;
let pumpOffId = -1;

// Enable pins at start. Built in led pin 5 turns on when low and off att high
GPIO.set_mode(led, GPIO.MODE_OUTPUT);
GPIO.set_mode(relay1, GPIO.MODE_OUTPUT);
GPIO.set_mode(relay2, GPIO.MODE_OUTPUT);
GPIO.set_mode(relay3, GPIO.MODE_OUTPUT);
GPIO.set_mode(pumpOnPin, GPIO.MODE_INPUT);
GPIO.set_pull(pumpOnPin, GPIO.PULL_UP);

ADC.enable(phPin);
ADC.enable(ecPin);
GPIO.write(led, 0);
GPIO.write(relay1, 1);
GPIO.write(relay2, 1);
GPIO.write(relay3, 1);

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

// Initialize Adafruit_TSL2561 library
let tsl = Adafruit_TSL2561.create();
print('Adafruit_TSL2561.TSL2561_GAIN_16X -> ',Adafruit_TSL2561.TSL2561_GAIN_16X);
tsl.setGain(Adafruit_TSL2561.TSL2561_GAIN_0X);
tsl.setIntegrationTime(Adafruit_TSL2561.TSL2561_INTEGRATIONTIME_402MS);
tsl.begin();

let getSensorData = function() {
  let temp = 23;
  let pump = getPumpStatus();
  let vis = tsl.getVisible();
  let ir = tsl.getInfrared();
  let lux = tsl.calculateLux(vis, ir);
  let id = Cfg.get('device.id');
  let time = Timer.now();
  let fullTime = Timer.fmt("%c", time);
  let sensors = {
    ph: latestPh,
    ec: latestEc,
    temp: temp,
    pump: pump,
    lux: lux,
    deviceId: id,
    timeStamp: time,
    time: fullTime
  };
  return sensors;
};

let getPumpStatus = function() {
  return GPIO.read(pumpOnPin) ? 'OFF' : 'ON';
};

let send = function() {
  let msg = JSON.stringify(getSensorData());
  let ok = MQTT.pub(topic, msg, 1);
  print('Published:', ok, topic, '->', msg);
};

/************* Relay test on topics ******/
MQTT.sub(pumpOnTopic, function(conn, topic, msg) {
     GPIO.write(relay2, 0);
}, null);

MQTT.sub(pumpOffTopic, function(conn, topic, msg) {
     GPIO.write(relay2, 1);
}, null);

MQTT.sub(setEcTopic, function(conn, topic, msg) {
    let ec = JSON.parse(msg).ec;
    Cfg.set({hydro: {ecMax: ec}}, true);
    Sys.reboot(0);
}, null);

MQTT.sub(setPhOffsetTopic, function(conn, topic, msg) {
  let ph = JSON.parse(msg).ph;
  Cfg.set({hydro: {phOffset: ph}}, true);
  Sys.reboot(0);
}, null);

MQTT.sub(setPumpOnTopic, function(conn, topic, msg) {
    let time = JSON.parse(msg).on;
    time = time < 15000 ? 15000 : time;
    Cfg.set({hydro: {pumpOnTime: time}}, true);
    Sys.reboot(0);
}, null);

MQTT.sub(setPumpOffTopic, function(conn, topic, msg) {
    let time = JSON.parse(msg).off;
    time = time < 15000 ? 15000 : time;
    Cfg.set({hydro: {pumpOffTime: time}}, true);
    Sys.reboot(0);
}, null);

MQTT.sub(setConfigTopic, function(conn, topic, msg) {
    let config = JSON.parse(msg);
    let off = config.off;
    let on = config.on;
    on = on < 15000 ? 15000 : on;
    off = off < 15000 ? 15000 : off;
    Cfg.set({hydro: {pumpOffTime: off}}, true);
    Cfg.set({hydro: {pumpOnTime: on}}, true);
    Sys.reboot(0);
}, null);
/**************************************************/

//Frequently send data to AWS IoT with sensordata
Timer.set(freqSend, Timer.REPEAT, function() {
  send();
}, null);

//Frequently measure ph level
Timer.set(freqPH, Timer.REPEAT, function() {
  print('Meauring pH value');
  measurePH();
}, null);

Timer.set(2000, Timer.REPEAT, function() {
      GPIO.toggle(led);
}, null);

let startPumpTimers = function() {
  //turn on pump and wait
  GPIO.write(relay2, 0);
  Timer.set(Cfg.get('hydro.pumpOnTime'), false, function() {
    // Turn off pump and wait.
    GPIO.write(relay2, 1);
    Timer.set(Cfg.get('hydro.pumpOffTime'), false, function() {
      startPumpTimers();
    }, null);
  }, null);
};

let measurePH = function() {
  //turn on power to pH probe
  GPIO.write(relay1, 0);
  print('Turned on pH relay. Now waiting 10 secs');
  //wait for x seconds
  Timer.set(phWait, 0, function() {
    print('Waiting done, time to measure pH');
    let userData = {
    count: countPh,
    phArray: []
    };
    measurePhId = Timer.set(1000, true, function (arg) {
        if (0 === arg.count) {
            Timer.del(measurePhId);
            print('Measured all values, time to take average');
            let phSum = 0;
            //measure values [countPh] times
            for(let i = 0; i < countPh; i++) {
              phSum = phSum + arg.phArray[i];
              print('Ph value stored in array: ', arg.phArray[i], i);
            }
            //set the average value in latestPh
            latestPh = phSum / countPh;
            print('Average pH measured: ', latestPh);
            //turn off power to pH probe
            GPIO.write(relay1, 1);
            print('Turned OFF pH relay');
            measureEc();
        } else {
          let phVal = ADC.read(phPin);
          print('ph adc value: ', phVal, arg.count);
          let ph = phVal * 3.3 / 4096 * 3.5 + Cfg.get('hydro.phOffset');
          print('PH value: ', ph);
          arg.phArray.push(ph);
          if (arg.count > 0) {
              arg.count--;
          }
        }
    }, userData);
  },null);
};

let measureEc = function() {
  //turn on power to pH probe
  GPIO.write(relay3, 0);
  print('Turned on EC relay. Now waiting 10 secs');
  Timer.set(ecWait, 0, function() {
    print('Waiting done, time to measure EC');
    let userData = {
    count: countEc,
    ecArray: []
    };
    measureEcId = Timer.set(1000, true, function (arg) {
        if (0 === arg.count) {
            Timer.del(measureEcId);
            print('Measured all ec values, time to take average');
            let ecSum = 0;
            //measure values [countEc] times
            for(let i = 0; i < countEc; i++) {
              ecSum = ecSum + arg.ecArray[i];
              print('EC value stored in array: ', arg.ecArray[i], i);
            }
            //set the average value in latestPh
            latestEc = ecSum / countEc;
            print('Average EC measured: ', latestEc);
            //turn off power to EC probe
            GPIO.write(relay3, 1);
            print('Turned OFF EC relay');
        } else {
          let ecVal = ADC.read(ecPin);
          print('EC adc value: ', ecVal, arg.count);
          let ec = ecVal / Cfg.get('hydro.ecMax') * 100;
          print('EC value: ', ec);
          arg.ecArray.push(ec);
          if (arg.count > 0) {
              arg.count--;
          }
        }

    }, userData);
  },null);
};

// Set up Shadow handler to synchronise device state with the shadow state
Shadow.addHandler(function(event, obj) {
  if (event === 'CONNECTED') {
    // Connected to shadow - report our current state.
    Shadow.update(0, state);
  } else if (event === 'UPDATE_DELTA') {
    // Got delta. Iterate over the delta keys, handle those we know about.
    print('Got delta:', JSON.stringify(obj));
    for (let key in obj) {
      if (key === 'relay1') {
        // Shadow wants us to change local state - do it.
        state.relay1 = obj.relay1;
        //GPIO.set_mode(relay, GPIO.MODE_OUTPUT); done already earlier
        GPIO.write(relay1, state.relay1 ? 0 : 1);
        print('LED on ->', state.relay1);
      }
      if (key === 'relay2') {
        // Shadow wants us to change local state - do it.
        state.relay2 = obj.relay2;
        //GPIO.set_mode(relay, GPIO.MODE_OUTPUT); done already earlier
        GPIO.write(relay2, state.relay2 ? 0 : 1);
        print('LED on ->', state.relay2);
      }
    }
    // Once we've done synchronising with the shadow, report our state.
    Shadow.update(0, state);
  }
});

//initial start functions
startPumpTimers();
measurePH();
