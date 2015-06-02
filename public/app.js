var app = angular.module('app', []);

app.service('map', function(){
  this.map = new google.maps.Map(document.getElementById('map'), {
    center: new google.maps.LatLng(45, 16),
    zoom: 2
  });

  this.placeItem= function (item) {
    var marker = new google.maps.Marker({
      position: new google.maps.LatLng(item.location.lat, item.location.lng),
      title: item.name + '\n' + item.timezone
    });
    marker.setMap(this.map);
  };
  return this;
});

app.service('geocode', function(){
  var geocoder = new google.maps.Geocoder();
  return function(city, callback){
    geocoder.geocode({address: city}, function(address, response){
      if(response!=='OK'){console.error("Couldn't fetch location");}
      callback(address[0]);
    });
  };
});

app.run(function(map, $rootScope){
  var socket = io.connect('localhost:3000');
  socket.on('newItem', function (data) {
    map.placeItem(data);
  });
});

app.controller('inputLocationController', function($scope, geocode, map, $http){
  $http.get('/timezone').success( function (data) {
    for(var i = 0; i < data.length; i++){
      map.placeItem(data[i]);
    }
  });
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
    return false;
  };

});
