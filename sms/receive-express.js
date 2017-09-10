/* Tutorial 2: Webhook for Nexmo SMS incoming messages demo with ExpressJS */

'use strict';

require('dotenv').config({path: __dirname + '/../.env'});

const NEXMO_API_KEY = process.env.NEXMO_API_KEY;
const NEXMO_API_SECRET = process.env.NEXMO_API_SECRET;
const NEXMO_FROM_NUMBER = process.env.NEXMO_FROM_NUMBER;

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const Nexmo = require('nexmo');
const nexmo = new Nexmo({
    apiKey: NEXMO_API_KEY,
    apiSecret: NEXMO_API_SECRET,
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const server = app.listen(process.env.PORT || 3000, () => {
  console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
});

// Persist data storage to store data in the file system w/o a real DB
const storage = require('node-persist');
storage.init();

// Handle both GET and POST requests

app.get('/inbound', (req, res) => {
  handleParams(req.query, res);
});

app.post('/inbound', (req, res) => {
  handleParams(req.body, res);
});

function handleParams(params, res) {
  if (!params.to || !params.msisdn) {
    console.log('This is not a valid inbound SMS message!');
  } else {
    if(params.text.toLowerCase() == "help"){
        sendInstructionText(params.msisdn);
    } else if(params.text.split(";").length == 2) {
        var info = params.text.split(";");
        var number = params.msisdn;
        var name = info[0];
        var loc = info[1];
        postData(number, name, loc);
        sendConfirmationText(number);
    } else {
        sendRetryText(params.msisdn);
    }
    let incomingData = {
      messageId: params.messageId,
      from: params.msisdn,
      text: params.text,
      type: params.type,
      timestamp: params['message-timestamp']
    };
    storage.setItem('id_' + params.messageId, incomingData);
    res.send(incomingData);
  }
  res.status(200).end();
}

function sendInstructionText(receiverNumber) {
    const from = NEXMO_FROM_NUMBER;
    nexmo.message.sendSms(from, receiverNumber, "Reply back with NAME;LOCATION");
}

function postData(number, name, loc) {
}

function sendConfirmationText(number) {
    const from = NEXMO_FROM_NUMBER;
    nexmo.message.sendSms(from, number, "Thank you!");
}

function sendRetryText(number) {
    const from = NEXMO_FROM_NUMBER;
    nexmo.message.sendSms(from, number, "Unsupported operation. Please try again");
}

// Optional: To spit out JSON data for each Message ID
// e.g. http://localhost:3000/inbound/02000000F8835159
app.get('/inbound/:id', (req, res) => {
  try {
    storage.getItem('id_' + req.params.id).then((value) => {
      res.json(value);
    });
  } catch (e) {
    res.status(404).end();
  }
});
