# urban-farming-mongoose

An application running on Mongoose OS on a ESP32 micro controller. 
The application reads sensor data and publishes its values throug MQTT. 

| Sensors      |
| --------- | 
| Soil moisture sensor |
| Humidity  |
| Light sensor |

## Step-by-step installation guide

### Install Mongoose

On Mac terminal: 
```bash
curl -fsSL https://mongoose-os.com/downloads/mos/install.sh | /bin/bash
```
### Start Mongoose 
```bash
~/.mos/bin/mos
```
This will start Mongoose GUI on your web browser.

Go to ’Projects’, press +New and add dummy name project (to get folder .mos/apps-1.xx)

### Git
Clone repo [urban-farming-mongoose](https://github.com/jayway/urban-farming-mongoose.git)
```bash
https://github.com/jayway/urban-farming-mongoose.git
```
Copy folder into _~/.mos/apps-1.xx_
Refresh Mos-GUI and the project __urban-farming-mongoose__ should be seen under ’_My Apps_’ in ’_Projects_’

Rebuild app firmware

Flash app firmware to device

## Hardware

| Micro Controllers      |
| --------- | 
| ESP32  |
| Raspberry Pi |

| Sensors      |
| --------- | 
| Soil moisture sensor  |
| Humidity [DHT11](https://www.indiamart.com/proddetail/humidity-and-temperature-sensor-dht-11-14742150312.html) |
| Light sensor [TSL2561](https://www.adafruit.com/product/439)|

### FAQ
__How to show hidden files on mac?__ 
In terminal:
```bash
$ defaults write com.apple.Finder AppleShowAllFiles true
```
And restart finder
```
$ killall Finder
```




