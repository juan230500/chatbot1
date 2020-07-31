const express = require('express');

const twilioRouter = require('./routes/twilio')

const app = express();

app.use('/bot',twilioRouter)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Our app is running on port ${ PORT }`);
});