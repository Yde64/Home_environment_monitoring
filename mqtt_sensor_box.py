import time
import struct
import json
import serial
from awscrt import io, mqtt, auth, http
from awsiot import mqtt_connection_builder

# AWS IoT Core configuration
ENDPOINT = "a2jv8rj121onu6-ats.iot.eu-north-1.amazonaws.com"
CLIENT_ID = "Indoor_sensor_box"  # Replace with your actual client ID
CERT_PATH = "/home/morten/Indoor_sensor_box-certificate.pem.crt"
KEY_PATH = "/home/morten/Indoor_sensor_box-private.pem.key"
CA_PATH = "/home/morten/AmazonRootCA1.pem"
TOPIC = "Indoor_sensor_box/environment/sensor"


# UART driver implementation
class UARTDriver:
    def __init__(self, port="/dev/serial0", baudrate=9600, timeout=1):
        self.serial = serial.Serial(port, baudrate=baudrate, timeout=timeout)

    def uartWrite(self, data):
        print("Writing to UART:", data)
        self.serial.write(bytearray(data))

    def uartRead(self):
        print("Reading from UART")
        data = self.serial.read(11)  # Assuming 11 bytes of data
        if data:
            print("Received:", data)
            return list(data)
        return []


# Sensor data handling and communication
class SensorKommunikation:
    def __init__(self):
        self.UARTDriver1 = UARTDriver()

    def transmit(self):
        print("Transmitting")
        wakeup_command = 138
        command = [wakeup_command, wakeup_command]
        self.UARTDriver1.uartWrite(command)

    def receive(self):
        print("Receiving")
        data = self.UARTDriver1.uartRead()
        if data:
            print("Receiving done")
            return data
        print("No data received")
        return []

    def unpackSensorData(self, data):
        sensor_data = {
            "co2": (data[0] << 8) | data[1],
            "particle24": (data[2] << 8) | data[3],
            "particle10": (data[4] << 8) | data[5],
            "SHT_Temp": (data[6] << 8) | data[7],
            "SHT_RH": (data[8] << 8) | data[9],
        }
        return sensor_data

    def dataHandling(self, data):
        scale_factor_rh = 125.0 / (2**16)
        offset_rh = -6.0
        scale_factor_temp = 175.72 / (2**16)
        offset_temp = -46.85

        data["SHT_RH"] = offset_rh + scale_factor_rh * data["SHT_RH"]
        data["SHT_Temp"] = offset_temp + scale_factor_temp * data["SHT_Temp"]
        return data

    def getSensorData(self):
        self.transmit()
        received_data = self.receive()
        if received_data:
            checksum = sum(received_data[:-1]) & 0xFF
            if checksum == received_data[-1]:
                sensor_data = self.unpackSensorData(received_data)
                return self.dataHandling(sensor_data)
            else:
                print("Checksum mismatch")
        return {}


# MQTT publishing function
def publish_to_aws(mqtt_connection, topic, data):
    mqtt_connection.publish(
        topic=topic,
        payload=json.dumps(data),
        qos=mqtt.QoS.AT_LEAST_ONCE,
    )
    print(f"Published to {topic}: {data}")


def main():
    # Initialize AWS IoT MQTT connection
    mqtt_connection = mqtt_connection_builder.mtls_from_path(
        endpoint=ENDPOINT,
        cert_filepath=CERT_PATH,
        pri_key_filepath=KEY_PATH,
        ca_filepath=CA_PATH,
        client_id=CLIENT_ID,
        clean_session=False,
        keep_alive_secs=30,
    )

    print("Connecting to AWS IoT Core...")
    mqtt_connection.connect().result()
    print("Connected!")

    # Initialize SensorKommunikation
    sensor_comm = SensorKommunikation()

    # Define the TTL retention period in seconds (e.g., 7 days = 604800 seconds)
    ttl_retention_period = 7 * 24 * 60 * 60  # 7 days

    try:
        while True:
            sensor_data = sensor_comm.getSensorData()
            if sensor_data:
                # Add timestamp as the first field and include TTL
                current_timestamp = int(time.time())  # Current Unix timestamp
                ttl = current_timestamp + ttl_retention_period
                payload = {
                    "timestamp": current_timestamp,
                    "ttl": ttl,  # Add TTL field
                    "co2": sensor_data["co2"],
                    "particle24": sensor_data["particle24"],
                    "particle10": sensor_data["particle10"],
                    "SHT_Temp": sensor_data["SHT_Temp"],
                    "SHT_RH": sensor_data["SHT_RH"],
                }
                publish_to_aws(mqtt_connection, TOPIC, payload)
            else:
                print("No valid sensor data to publish.")
            time.sleep(20)  # Adjust the interval as needed
    except KeyboardInterrupt:
        print("Disconnecting...")
    finally:
        mqtt_connection.disconnect().result()
        print("Disconnected!")

if __name__ == "__main__":
    main()
