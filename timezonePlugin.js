var Boom = require('boom');
var https = require('https');
var db = require('./db');
var socketIo = require('socket.io');

var timezonePlugin = {
  register: function (server, options, next) {
    console.log('Options are:', options);
    var api = server.select('timezone');
    var io = socketIo(server.listener);

    api.route({
      method: 'GET',
      path: '/timezone',
      handler: function (request, reply) {
        db.find().exec(function(err, timezones){
          if(err) reply(Boom.badImplementation(['Database error'], [err]));
          reply(null, timezones);
        });
      }
    });

    api.route({
      method: 'POST',
      path: '/timezone',
      handler: function (request, reply) {
        if(request.payload.lat == null ||
           request.payload.lng == null ||
           request.payload.placeId == null){
          return reply(Boom.badRequest('Invalid request'));
        }

        db.findOne({placeId: request.payload.placeId}, function(err, place){
          if(err) return reply(Boom.badImplementation(['Database error'], [err]));
          if(!place){
            getTimezone(request.payload.lat, request.payload.lng,
              function (timezone) {
                if(timezone.status !== 'OK'){
                  return reply(
                      Boom.badImplementation(['Couldn\'t fetch timezone']));
                }
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

    api.route({
      method: 'DELETE',
      path: '/timezone/{id}',
      handler: function (request, reply) {
        db.findByIdAndRemove(request.params.id, function (err) {
          if(err) return reply(Boom.badImplementation(['Database error'], [err]));
          reply();
        });
      }
    });

    api.route({
      method: 'GET',
      path: '/timezone/{id}',
      handler: function (request, reply) {
        db.findById(request.params.id, function (err, item) {
          if(err) return reply(Boom.badImplementation(['Database error'], [err]));
          reply(item);
        });
      }
    });


    // Make call to google api and get timezone info
    var getTimezone = function (lat, lng, cb) {
      var str = '';
      var httpsOptions = {
        host: 'maps.googleapis.com',
        path:'/maps/api/timezone/json?location=' +
          lat + ',' + lng + '&timestamp=' + Math.floor(Date.now()/1000) +
          '&key=' + options.googleMapsKey,
        method: 'GET',
        port: 443
      };

      var req = https.request(httpsOptions, function (res) {
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

    next();
  }
};

  timezonePlugin.register.attributes = {
    name: 'timezonePlugin',
    version: '1.0.0'
  };

module.exports = timezonePlugin
