function findPlaces() {

  $('.loading').show();
  $('.initial-search').hide();

  if (!route) {
    // Creates route object based on user's input.
    route = new Route(
      $('#start').val(),
      $('#end').val(),
      checkTravelMode()
    );
  }

  // Creates search object based on user's input.
  search = new Search(
    $('#keyword').val(),
    $('#results-sort').find(':selected').text()
  );

  // Gets initial directions and use returned value to find Places.
  route.getDirections()
    .then(function(response) {
      route.getPolyline(response);
      return search.getSearchPoints(route);
    })
    .then(function() {
      search.getPlaces();
    });
};


function checkTravelMode() {
  // Checks form radio buttons to set travel mode.

  if (document.getElementById('driving').checked) {
    return google.maps.TravelMode.DRIVING;
  }
  else if (document.getElementById('walking').checked) {
    return google.maps.TravelMode.WALKING;
  }
  else if (document.getElementById('biking').checked) {
    return google.maps.TravelMode.BICYCLING;
  }
};


function processPlaces(placeRequestResults) {
  /*  Once place lists are received from the Google Places API, creates place
    objects which are appended to the search object. The Google place IDs are
    used as keys within the search.places object to remove duplicates. */

  _.each(placeRequestResults, function(place) {
    var latlng = new google.maps.LatLng(
      place.geometry.location.k,
      place.geometry.location.D
    );

    if (place.rating) {
      var rating = place.rating;
    }
    else {
      var rating = 'Unrated';
    }

    search.places[latlng] = {};
    search.places[latlng]['place'] = new Place(
      place.name,
      place.place_id,
      place.geometry.location.k,
      place.geometry.location.D,
      latlng,
      rating
    );

    if (search.sortby == 'Distance From Route') {
      rankByDistance(search.places[latlng]['place']);
    }
    else if (search.sortby == 'Highest Rated') {
      rankByRating(search.places[latlng]['place'])
    }
  });
};


function rankByDistance(place) {
  /*  Ranks place based on direct distance from route polyline. Uses
    getDistanceFromLatLonInKm to calculate distance. */

  place.rank = 1000;
  var polylineLength = route.polyline.length;

  for (var i = 0; i < polylineLength; i++) {
    var lat1 = route.polyline[i].k;
    var lat2 = place.lat;
    var lng1 = route.polyline[i].D;
    var lng2 = place.lng;

    var distanceFromPolyline = getDistanceFromLatLonInKm(lat1,
                                                         lng1,
                                                         lat2,
                                                         lng2);
    if (distanceFromPolyline < place.rank) {
      place.rank = distanceFromPolyline;
    }
  }
};

function rankByRating(place) {
  // Ranks places by Google business rating (provided in Places API response)

  if (place.rating == 'Unrated') {
    place.rank = 5.0;
  }
  else {
    place.rank = 5.0 - place.rating;
  }
};


function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  /*  Calculates distance between two points. Formula borrowed from
    http://stackoverflow.com/questions/27928/how-do-i-calculate-distance
    -between-two-latitude-longitude-points */

  var R = 6371;           // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);
  var dLon = deg2rad(lon2-lon1);
  var a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = R * c;
  return d;
};

function deg2rad(deg) {
  return deg * (Math.PI/180)
};


function getAddedDistance() {
  /*  Creates complete place list and sort by rank. Use sorted list to populated
    the unreturned places list, which tracks which places have already been
    shown to user (displayed on map and results list). */

  search.placeList = [];
  $.each(search.places, function(latlng, Place) {
    search.placeList.push(Place.place);
  });

  search.placeList.sort(function(a, b) {
    return a.rank - b.rank;
  })

  search.unreturnedPlaces = _.map(search.placeList, function(item) {
    return new google.maps.LatLng(item.location.k, item.location.D);
  })

  callDistanceMatrix();
};


function callDistanceMatrix() {
  /*  Makes distance matrix request to calculate the time and distance
    of each place from the start and to the end points. These values are
    used to calculate the added time the new waypoint adds to the user's
    original route. */

  requestList = search.unreturnedPlaces.splice(0,10);

  var distanceAPI = new google.maps.DistanceMatrixService();

  var requestStart = new distanceMatrixRequest([route.start], requestList);
  var requestEnd = new distanceMatrixRequest(requestList, [route.end]);

  distanceAPI.getDistanceMatrix(requestStart, function(response, status) {
    if (status == google.maps.DistanceMatrixStatus.OK) {
      processDistancesFromStart(response, requestList);

      distanceAPI.getDistanceMatrix(requestEnd, function(response, status) {
        if (status == google.maps.DistanceMatrixStatus.OK) {
          processDistancesToEnd(response, requestList);
          returnTopTen(requestList);
        }
      });
    }
  });
};


function processDistancesFromStart(response, requestList) {
  // Stores distance and duration of waypoint from trip start point in places object.

  _.each(requestList, function(item, index) {
    search.places[item]['duration'] = response
                                        .rows[0]
                                        .elements[index]
                                        .duration
                                        .value;
    search.places[item]['distance'] = response
                                        .rows[0]
                                        .elements[index]
                                        .distance
                                        .value;
  });
};


function processDistancesToEnd(response, requestList) {
  /*  Sums:
    1) distance and duration from the waypoint to the trip end point
    2) distance and duration to the waypoint from the trip start point
    Resulting in the revised trip total route distance and duration. This is
    used to compare new route with waypoint from the user's original route. */

  _.each(requestList, function(item, index) {
    var distance = response.rows[index].elements[0].distance.value;
    var duration = response.rows[index].elements[0].duration.value;
    search.places[item]['duration'] = search.places[item]['duration'] + duration;
    search.places[item]['distance'] = search.places[item]['distance'] + distance;
  });
};


function returnTopTen (requestList) {
  // Sorts results returned from distance matrix request by amount of time added.

  search.sortedPlaces = _.map(requestList, function(item) {
    return [search.places[item].duration, search.places[item].place.location];
  });

  if (search.sortby == 'Distance From Route') {
    search.sortedPlaces.sort(function(a, b) {
      return a[0] - b[0];
    });
  }

  displayTopTen();
}


function displayTopTen () {
  // Updates sidebar to show the first ten sorted results.

  $('.loading').hide();
  $('#list-container, #start-over-div').show();
  
  /*  Checks if there are fewer than 10 results remaining. If so, removes
    "Get More Results" button from results div. */
  if (search.sortedPlaces.length < 10) {
    var maxResult = search.sortedPlaces.length;
    $('#get-more-results').hide();
  }
  else {
    var maxResult = 10;
    $('#get-more-results').show();
  }

  // For each of ten places, display in results div and add to map.
  for (var i = 0; i < maxResult; i++) {
    place = search.places[search.sortedPlaces[i][1]].place;
    var durationAdded = Math.ceil((search.sortedPlaces[i][0] -
                                   route.initialDuration) / 60);

    if (durationAdded <= 0) {
      $('#list-container')
        .append('<div class="list-item" id="' + place.id + '"><strong>' +
          place.name + '</strong><br><em>No travel time added.</em></div>');
    }
    else {
      $('#list-container')
        .append('<div class="list-item" id="' + place.id + '"><strong>' +
          place.name + '</strong><br><em>' + durationAdded +
          ' min added to your trip.</em></div>');
    }

    displayPlace(place.location, i * 100, place);
  }
};

function displayDirections() {
  // This function is called to show new directions in the control bar.

  route.getDirections()
    .then(
      function(response) {
        $('#list-container, #directions').empty();
        $('#get-more-results').hide();
        $('#directions').append('<h4>Directions</h4>');
        $('#directions').append('<div class="waypoint"><h5>A: ' + route.start +
                                '</h5></div>');

        var alpha = 'BCDEFGHIJKLMNOPQRSTUVWYXZ';

        var legs = response.routes[0].legs;
        _.each(legs, function(leg, legIndex) {
          var steps = response.routes[0].legs[legIndex].steps;
          _.each(steps, function(step, stepIndex) {
            $('#directions').append('<div class="step-instructions">' +
              (stepIndex + 1) + ') ' + step.instructions + '</div>');
          })

          if (legIndex < route.places.length) {
            $('#directions').append('<div class="waypoint" id="dir-' +
              route.places[legIndex].id + '"><h5>' + alpha[legIndex] +
              ': ' + route.places[legIndex].name + '</h5></div>');
          }

          else {
            $('#directions').append('<div class="waypoint"><h5>' +
              alpha[legIndex] + ': ' + route.end +'</h5></div>');
          }

        });

        $('#directions-todo').show();
      },
      function(status) {
        // Uncomment for troubleshooting purposes:
        // console.log(status);
      }
    );
};

function sendMessage(user_phone) {
  /*  Builds route data object and sends AJAX GET request to server-side
    Twilio API function. */

  $("#send-button").attr({"disabled": "disabled"});

  var places = {};
  for (var i = 0; i < route.places.length; i++) {
    places[i] = route.places[i].address;
  }

  var route_data = {
    'start' : route.start,
    'end' : route.end,
    'directionsmode' : route.travelMode,
    'places': JSON.stringify(places)}

  if (user_phone) {
    route_data['phone'] = user_phone;
  }

  $.get('/send_to_phone',
    route_data,
    function(response) {
      displayResultStatus(response.status, response.message, '#phone-sent');
      $("#send-button").removeAttr("disabled");
    }
  );
};

function checkLoggedIn() {
  // When sending route to phone, first checks if user is logged in.
  // If not, prompts for phone number.

  if (loggedIn == 'True') {
    sendMessage(null);
  }
  else {
    $('.phone-loggedin, #phone-loggedout').toggle();
    $('#send-loggedout').click(function() {
      user_phone = $('#phone-input').val();
      sendMessage(user_phone);
    });
  }
};


function rebuildSavedRoute(routeID) {
  // Takes saved route data from server and refreshes the map to show the route.

  removeMarkers();
  $.get('/get_route',
    {'route_id': routeID},
    function(response) {
      console.log(response);
      route = new Route(response.start, response.end, response.travel_mode);

      for (var i = 0; i < response.waypoints.length; i++) {
        route.waypoints.push(new Waypoint(response.waypoints[i]));
        route.places[i] = {};
        route.places[i].location = response.waypoints[i];
        route.places[i].name = response.waypoint_names[i];
      }

    displayDirections();
    $('.initial-search').hide();
    }
  );
};
