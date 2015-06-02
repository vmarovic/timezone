mongoose = require('mongoose');

var schema = new mongoose.Schema({
  location: {
    lat: {type: Number},
    lng: {type: Number}
  },
  name: {type: String},
  timezone: {type: String},
  placeId: {type: String}
});

mongoose.connect('mongodb://localhost/timezone');
var db = mongoose.model('timezone', schema);

module.exports = db;
