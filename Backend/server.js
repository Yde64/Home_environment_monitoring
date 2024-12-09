const express = require("express");
const cors = require("cors");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand, PutCommand } = require("@aws-sdk/lib-dynamodb");
require('dotenv').config({ path: '../.env' });

const app = express();
app.use(cors());
app.use(express.json());

// Configure DynamoDB Client
const ddbClient = new DynamoDBClient({ 
  region: process.env.AWS_REGION || "eu-north-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
 });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient); // Document Client for convenience

const tableName = "SensorData";

// Root Route
app.get("/", (req, res) => {
  res.send("Welcome to the Sensor Data API!");
});

// API to fetch all data
app.get("/data", async (req, res) => {
  try {
    // Extract the time range from query params (default to 1 hour)
    const timeRange = parseInt(req.query.timeRange || "3600", 10); // Default to 3600 seconds (1 hour)
    const currentTime = Math.floor(Date.now() / 1000); // Current Unix time in seconds
    const startTime = currentTime - timeRange; // Calculate start time

    let items = [];
    let lastEvaluatedKey;

    do {
      const params = {
        TableName: tableName,
        FilterExpression: "#timestamp >= :startTime",
        ExpressionAttributeNames: {
          "#timestamp": "timestamp",
        },
        ExpressionAttributeValues: {
          ":startTime": startTime,
        },
        ExclusiveStartKey: lastEvaluatedKey,
      };

      const command = new ScanCommand(params);
      const data = await ddbDocClient.send(command);

      items = items.concat(data.Items || []);
      lastEvaluatedKey = data.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    console.log("Fetched data:", items); // Log the filtered data
    res.json(items); // Return the filtered data
  } catch (error) {
    console.error("Error fetching data:", error); // Log the error
    res.status(500).json({ error: "Could not retrieve data", details: error.message });
  }
});

  
  

// API to insert new data
app.post("/data", async (req, res) => {
  const { timestamp, co2, temperature, humidity } = req.body;
  const params = {
    TableName: tableName,
    Item: { timestamp, co2, temperature, humidity },
  };

  try {
    const command = new PutCommand(params);
    await ddbDocClient.send(command);
    res.status(201).json({ message: "Data added successfully" });
  } catch (error) {
    console.error("Error inserting data:", error);
    res.status(500).json({ error: "Could not insert data" });
  }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
