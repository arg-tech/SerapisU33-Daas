const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const port = 8075;

// Other endpoint files
const dialogue = require("./dialogue");

// Express.js configuration
app.use(
  cors({
    origin: ["http:localhost:8075/"],
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// DaaS endpoints (dialogue.js)
app.use("/dialogue", dialogue);

// Default endpoint
app.get("/", (req, res) => {
  res.status(200).send("DaaS running");
});

// Listen on assigned port
let index = app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

module.exports = index;
