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
  console.log(req)
  const { body } = req;

  let message;

  if (body.NumMedia > 0) {
    message = new MessagingResponse().message("Thanks for the image! Here's one for you!");
    message.media(goodBoyUrl);
  } else {
    message = new MessagingResponse().message('Send us an image!');
  }

  res.set('Content-Type', 'text/xml');
  res.send(message.toString()).status(200);
});

module.exports = twilioRouter;