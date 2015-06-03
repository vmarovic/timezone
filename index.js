var Hapi = require('hapi');

var server = new Hapi.Server();
server.connection({ port: 3000, labels: ['timezone'] });

server.route({
  method: 'GET',
  path: '/{param*}',
  handler: {
    directory: {
      path: 'public'
    }
  }
});

server.register({register: require('./timezonePlugin')}, function (err) {
  if(err) console.error('Failed to load plugin');
});


server.start(function () {
      console.log('Server running at:', server.info.uri);
});
