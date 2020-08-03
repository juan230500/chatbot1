const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
    phone:String,
    token:String,
    state:String,
    registerData:Object,
    regionsData:[Object],
    itemsData:[Object],
    stocksDAta:[Object],
    productsData:[Object]
}, { minimize: false })

const Record = mongoose.model('Record',recordSchema)

module.exports = Record;