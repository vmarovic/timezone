var app = angular.module('app', []);

// Service for handling map
app.service('map', function(){
  // Initialize google map
  this.map = new google.maps.Map(document.getElementById('map'), {
    center: new google.maps.LatLng(45, 16),
    zoom: 2
  });

  // Places given item on the map
  this.placeItem= function (item) {
    var marker = new google.maps.Marker({
      position: new google.maps.LatLng(item.location.lat, item.location.lng),
      title: item.name + '\n' + item.timezone
    });
    marker.setMap(this.map);
  };
  return this;
});

// Fetch location coordinates and id from google
app.service('geocode', function(){
  var geocoder = new google.maps.Geocoder();
  return function(city, callback){
    geocoder.geocode({address: city}, function(address, response){
      if(response!=='OK'){console.error("Couldn't fetch location");}
      callback(address[0]);
    });
  };
});

// Upon starting app connect to the sockets and start map
app.run(function(map){
  var socket = io.connect('localhost:3000');
  // When someone adds new item add it to the map
  socket.on('newItem', function (data) {
    map.placeItem(data);
  });
});

// Location controller controls location input form
app.controller('inputLocationController', function($scope, geocode, map, $http){
  // Upon loading fetch all data from db
  $http.get('/timezone').success( function (data) {
    for(var i = 0; i < data.length; i++){
      map.placeItem(data[i]);
    }
  }).error( function () {
    alert('error')
  });

  // On form submit fetch location data from geocode
  // then send fetched data to the server
  // If location exists notify user, otherwise do nothing
  // map will be updated using sockets
  $scope.submit = function (city) {
    geocode(city, function (geo) {
      $http.post('/timezone', {
        lat: geo.geometry.location.lat(),
        lng: geo.geometry.location.lng(),
        placeId: geo.place_id,
        name: geo.formatted_address
      }).success( function (data) {
        if(data==='exists') alert("Already there");
      }).error( function (err) {
        console.error(err.message);
      });
    });
    return false; // Make sure default submit action is disabled
  };

});
