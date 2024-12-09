# Home Environment Monitoring

This project is designed around a custom sensor box that gathers the following parameters:
- **CO2** (ppm)
- **Temperature** (°C)
- **Particles** (2.5 µg/m³ & 10 µg/m³)
- **Humidity** (RH%)

It is flexible and can be adjusted to include, remove, or modify parameters as needed.

---

## Prerequisites
1. A Raspberry Pi (RPI) with:
   - WiFi enabled
   - SSH enabled
2. `.env` file containing necessary keys, which can be acquired from AWS DynamoDB. 
3. AWS certificate for IOT core. can be acquired for free at https://aws.amazon.com/iot-core/. Note must be in the Users home directory
3. Docker and Docker Compose plugin installed on the Raspberry Pi.

---

## Quick Setup

### Step 1: Adjust `server.js`
Modify the `server.js` file to set the correct URL. Update the hardcoded URL with the IP address of your Raspberry Pi.

### Step 2: Copy the Project to Raspberry Pi
Use `scp` to transfer the project folder to the Raspberry Pi:
```bash
scp -r /path/to/Home_environment_monitoring <RPI_IP>:
```

### Step 3: Place .env File
Ensure the .env file with necessary keys is placed in the Home_environment_monitoring directory on the Raspberry Pi.

### Step 4: Run Docker
Navigate to the project directory on the Raspberry Pi and build the Docker container:
```bash
docker-compose up --build -d
```

### Step 5: Test
Access the application using the following URLs in your browser:

Frontend: http://<RPI_IP>:4200
Backend: http://<RPI_IP>:3000

If you run this locally on wsl, you replace the RPI_IP with localport

### Notes
Both the sensor script and the Docker container can be configured to start automatically on boot. Use the following command to edit the crontab:
```bash
crontab -e
```
Ensure your Raspberry Pi has the necessary dependencies and permissions set correctly for Docker and network configurations