const express = require('express');
const bodyParser = require('body-parser');

const twilioRouter = require('./routes/twilio')

var mongoose = require('mongoose');
mongoose.connect('mongodb+srv://juan230500:alvarado123@cluster0.wtk5m.mongodb.net/TwilioDB?retryWrites=true&w=majority',
{ useNewUrlParser: true, useUnifiedTopology: true },);

const app = express();

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.use('/bot',twilioRouter)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Our app is running on port ${ PORT }`);
});

//https://timberwolf-mastiff-9776.twil.io/demo-reply