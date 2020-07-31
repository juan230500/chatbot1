const express = require('express');
const bodyParser = require('body-parser');

const twilioRouter = require('./routes/twilio')

const app = express();

app.use(bodyParser.json());

app.use('/bot',twilioRouter)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Our app is running on port ${ PORT }`);
});

//https://timberwolf-mastiff-9776.twil.io/demo-reply