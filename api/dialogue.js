const express = require("express");
const mongoose = require("mongoose");
const MongoStore = require("connect-mongo");
const session = require("express-session");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");

// Express.js config -------------------------------
const router = express.Router();
router.use(
  cors({
    origin: "http://localhost:8080",
    credentials: true,
  })
);
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

// Database for session management -------------------------------
const dbOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

// Session config -------------------------------

router.use(
  session({
    secret: "some secret",
    resave: false,
    name: "dgep",
    saveUninitialized: true,
    store: MongoStore.create({
      collectionName: "sessions",
      mongoOptions: dbOptions,
      mongoUrl: "mongodb://mongo_daas:27017/daas",
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      // secure: false,
      // httpOnly: true
    },
  })
);

/*
 * Routes -------------------------------
 */

/*
 * Configuration endpoint. Sets session variables using passed data
 * @param {string} map_numbers - The AIFdb map numbers to use
 */
router.post("/config", function (req, res) {
  let sess = req.session;

  sess.map_numbers = req.body.map_numbers;
  sess.present_counter = 0;

  res.status(200).send("Success");
});

/*
 * View the currently configured variables
 * @returns {JSON} data - A JSON object of the current variables
 */
router.get("/view_config", function (req, res) {
  res.status(200).send(JSON.stringify(req.session.map_numbers));
});

/*
 * Endpoint for instantiating moves with content using argql and AIFdb
 * @param {JSON} data - A JSON object containing the current move content
 * @returns {JSON} response - A JSON object containing the instantiated move text
 */
router.post("/argql/moves", async function (req, res) {
  let sess = req.session;

  let moveID = req.body.move.moveID;
  let query_text = "";
  let map_numbers = sess.map_numbers;
  let search_type = "";
  let current_argument_counter = 0; // Assigned to sess var and passed to argql function so the next argument in a map can be retrieved

  if (moveID === "Present") {
    query_text = "match ?a back ?b:< ?pr, ?c > return ?b";
    search_type = "conclusion";
    current_argument_counter = sess.present_counter;
    sess.present_counter++;
    // console.log("Present counter " + sess.present_counter);
  } else if (moveID === "Source" || moveID === "WhyPremise") {
    // let conclusion_text = `"Point 1 ''As the incidence of Bell’s palsy symptoms in both the Pfizer and Moderna vaccine trial participants was similar to the incidence of Bell’s palsy in the general U.S. population, it’s very likely not an issue of causality'' is a good concluding point to use"`;
    // console.log(req.session.conclusion_text);
    let conclusion_text = sess.conclusion_text;
    // console.log("Conclusion text: " + conclusion_text);
    query_text =
      'match ?a back ?b:< ?pr, "' + conclusion_text + '" > return ?b';

    // console.log(query_text);
  } else if (moveID === "SourcePremise") {
    let conclusion_text = sess.conclusion_text;
    // console.log("Conclusion text: " + conclusion_text);
    query_text = 'match ?a :< ?pr, "' + conclusion_text + '" > return ?a';
  }

  try {
    let response_text = await argql_move(
      query_text,
      map_numbers,
      search_type,
      current_argument_counter
    );
    // console.log(response_text);

    sess.conclusion_text = response_text;
    let response = {
      move_text: response_text,
    };

    res.status(200).send(response);
  } catch (error) {
    res.status(500).send(error);
  }
});

/*
 * Calls the ArgQL endpoint and returns argument content if found.
 * @param {string} query - The argql query to use
 * @param {string} maps - The maps to search for argumentative content. Can be a single map "21140", comma seperate list "21140, 21141", or range "21140-21150"
 * @returns {string} move_text - The extracted text from the argql result
 */
async function argql_move(query, maps = '""', search_type, counter) {
  let argql_url = "http://tomcat.arg.tech/ArgQL_ARGTech/argql/query/exec";
  let argql_data = { query: query, maps: maps, offset: 0, resultStartingNo: 0 };

  console.log(argql_data);

  try {
    let argql_response = await axios.post(argql_url, argql_data);
    let result = argql_response.data;
    // console.log(result);
    result = result["results"];

    // Different regex is required for extracting conclusions vs premises.
    let regex = "";
    if (search_type === "conclusion") {
      regexp = `}, "([^"]*)"`;
    } else {
      regexp = `"([^"]*)"`;
    }

    const array = [...result.matchAll(regexp)];

    let move_text = array[counter][0].replace("}, ", "");

    if (move_text[0] === '"' && move_text[move_text.length - 1] === '"') {
      move_text = move_text.slice(1, -1);
    }
    return move_text;
  } catch (error) {
    console.log("Error: " + error);
    throw error;
  }
}

module.exports = router;
