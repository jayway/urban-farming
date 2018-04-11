# urban-farming-mongoose

An application running on Mongoose OS on a ESP32 micro controller.
The application reads sensor data and publishes its values through MQTT.

| Sensors      |
| --------- |
| Soil moisture sensor |
| Humidity  |
| Light sensor |

## Step-by-step installation guide

- [Install Mongoose OS](https://mongoose-os.com/software.html) and run mos

This will start Mongoose GUI on your web browser.

- Go to ’Projects’, press +New and add dummy name project (to get folder .mos/apps-1.xx)

### Git
- Clone repo [urban-farming-mongoose](https://github.com/jayway/urban-farming-mongoose.git)
```bash
https://github.com/jayway/urban-farming-mongoose.git
```
- Copy folder into _~/.mos/apps-1.xx_
- Refresh Mos-GUI and the project __urban-farming-mongoose__ should be seen under ’_My Apps_’ in ’_Projects_’

- Rebuild app firmware

- Flash app firmware to device

## Hardware

| Micro Controllers      |
| --------- |
| ESP32  |

| Sensors      |
| --------- |
| Soil moisture sensor  |
| Humidity [DHT11](https://www.indiamart.com/proddetail/humidity-and-temperature-sensor-dht-11-14742150312.html) |
| Light sensor [TSL2561](https://www.adafruit.com/product/439)|


| ESP32  | TSL2561     | DHT11 | Soil fork | Shower |
| --------- |--------- |--------- |--------- |--------- |
| Gnd  |  Gnd | Gnd | Gnd | Gnd |
| 3.3V  | 3vo | | Vcc | |
| 5V  | | Vcc ||
| SCK/18  | | Signal ||
| A4/32  | SDA |||
| A5/33  | SCL |||
| A6/34  ||| AO ||
| MISO/19||||Signal|
