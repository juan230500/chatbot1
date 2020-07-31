const express = require('express');

const twilioRouter = require('./routes/twilio')

const app = express();

app.use('/bot',twilioRouter)


app.listen(3000);