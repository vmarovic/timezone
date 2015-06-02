var Hapi = require('hapi');
var Boom = require('boom');
var https = require('https');
var db = require('./db');
var socketIo = require('socket.io');

var server = new Hapi.Server();
server.connection({ port: 3000 });

server.route({
  method: 'GET',
  path: '/{param*}',
  handler: {
    directory: {
      path: 'public'
    }
  }
});

server.route({
  method: 'GET',
  path: '/timezone',
  handler: function (request, reply) {
    db.find().exec(function(err, timezones){
      console.log(timezones);
      reply(null, timezones);
    });
  }
});

server.route({
  method: 'POST',
  path: '/timezone',
  handler: function (request, reply) {
    if(request.payload.lat == null || request.payload.lng == null){
      return reply(Boom.badRequest('no location'));
    }

    db.findOne({placeId: request.payload.placeId}, function(err, place){
      if(!place){
        getTimezone(request.payload.lat, request.payload.lng,
          function (timezone) {
            console.log(timezone);
            var tz = new db();
            tz.placeId = request.payload.placeId;
            tz.location = {lat: request.payload.lat, lng: request.payload.lng};
            tz.name = request.payload.name;
            tz.timezone = timezone.timeZoneName;
            tz.save( function (err, savedTz) {
              io.emit('newItem', savedTz);
              reply();
            });
        });
      }else{
        reply('exists');
      }
    });
  }
});

// Make call to google api and get timezone info
var getTimezone = function (lat, lng, cb) {
  var str = '';
  var options = {
    host: 'maps.googleapis.com',
    path:'/maps/api/timezone/json?location=' +
      lat + ',' + lng + '&timestamp=' + Math.floor(Date.now()/1000) +
      '&key=AIzaSyB8QOhutNAeuO3Nxmx2fzSk5QASCoTOySc',
    method: 'GET',
    port: 443
  };

  var req = https.request(options, function (res) {
    console.log(res.statusCode);
    res.on('data', function (d) {
      str += d;
    });
    res.on('end', function () {
      var response = JSON.parse(str);
      cb(response);
    });
  });
  req.end();
};

server.start(function () {
      console.log('Server running at:', server.info.uri);
});

var io = socketIo(server.listener);
