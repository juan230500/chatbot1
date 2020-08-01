const express = require('express');
const { Router } = require('express');
const { MessagingResponse } = require('twilio').twiml;

const twilioRouter = express.Router();
const goodBoyUrl = 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?'
  + 'ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1350&q=80';

  
twilioRouter.get('/',(req,res,next) => {
    res.json({message:"hello"})
})
  
twilioRouter.post('/', async (req, res) => {
  
  const { body } = req;

  console.log(body)

  let message;

  if (body.Latitude) {
    message = new MessagingResponse().message(`
    Latitude: ${body.Latitude}
    Longitude: ${body.Longitude}`);
    message.media(goodBoyUrl);
  } else {
    message = new MessagingResponse().message('Send a location');
  }

  res.set('Content-Type', 'text/xml');
  res.send(message.toString()).status(200);
});

module.exports = twilioRouter;