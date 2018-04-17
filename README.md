# urban-farming-mongoose

An application running on Mongoose OS on a ESP32/ESP8266 micro controller.
The application reads sensor data and publishes its values through MQTT to AWS IoT.

| Sensors      |
| --------- |
| Soil moisture sensor |
| Humidity  |
| Light sensor |

## Step-by-step installation guide
Follow these instructions in this section only if the device is not configured, since it will flash a new firmware into the device and any old firmware will be overwritten.

- Connect the device to your computer via USB.

- [Install Mongoose OS](https://mongoose-os.com/software.html) and run mos

This will start Mongoose GUI on your web browser.
- In the pop-up modal, choose which USB port the device is connected to, press select and wait for '_Done_' flag pops up on the left.
- Choose Platform, eg. esp32, choose demo-js and flash the device. Wait for '_Done_' flag pops up on the left.
- Configure wifi and press set and wait for '_Done_' flag, and press done.
- In the console log, you will see the IP number for the device. Remember this IP to be able to access the device without USB, explained in next section.

- Go to ’Projects’, press +New and add dummy name project (to get folder .mos/apps-2.xx)

### Git
- Clone repo [urban-farming-mongoose](https://github.com/jayway/urban-farming-mongoose.git) into folder _~/.mos/apps-2.xx_
```bash
https://github.com/jayway/urban-farming-mongoose.git
```
- Refresh Mos-GUI and the project __urban-farming-mongoose__ should be seen under ’_My Apps_’ in ’_Projects_’

- Rebuild app firmware. This builds the target file.

- Flash app firmware to device.

## The code
A firmware with JavaScript loads init.js file after boot, therefore if you need to customize a default app, you need to modify that file and reboot the device. The firmware it self is not modified when editing init.js file.

### Edit init.js via Mos UI
In '_Device Files_' to the left, find init.js, edit and click '_Save+Reboot_' and changes are applied to device.

### Edit init.js via websocket
Click on '_device setup_' on top bar in Mos UI. In the section where port is configured, change to ws://<IP-ADDRESS>/rpc and press 'Select'. The communication is now via websocket, even with the Mos UI.

With websocket it is possible to edit device over the air. Plug it away from USB, attach it to another power source, and you can still reach the device via Mos UI or via terminal.

In terminal, write ```mos --port ws//<IP-ADDRESS>/rpc ls -l``` to list files in the device. To see init.js file: ```mos get init.js```. It is possible to skip the --port part by exporting MOS_PORT:
```
export MOS_PORT=ws://<IP-ADDRESS>/rpc
```

To edit the init.js file, copy the init.js to current destination:
```
mos get init.js > init.js.
```

Open the file in an editor, e.g.
```
atom init.js
```

When done, put it back to the device: ```mos put init.js```

Reboot the device by clicking on the reset button on device.


## Connect to AWS IoT



## Hardware

| Micro Controllers      |
| --------- |
| [ESP32](https://wiki.wemos.cc/products:lolin32:lolin32) |

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
| SCL/22  | | Signal ||
| A4/32  | SDA |||
| A5/33  | SCL |||
| A6/34  ||| AO ||
| SDA/21||||Signal|
