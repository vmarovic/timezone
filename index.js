var Hapi = require('hapi');

var server = new Hapi.Server();
server.connection({ port: 3000, labels: ['timezone'] });

// Serve static folder
server.route({
  method: 'GET',
  path: '/{param*}',
  handler: {
    directory: {
      path: 'public'
    }
  }
});

// Register our plugin
server.register({
  register: require('./timezonePlugin'),
  options:{ 
    googleMapsKey: 'AIzaSyB8QOhutNAeuO3Nxmx2fzSk5QASCoTOySc'
  }
}, function (err) {
  if(err) console.error('Failed to load plugin');
});


server.start(function () {
      console.log('Server running at:', server.info.uri);
});
