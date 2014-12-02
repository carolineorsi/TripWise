function Route(start, end, travelMode) {
  this.start = start;       // User's starting point
  this.end = end;         // User's ending point
  this.travelMode = travelMode; // User's travel mode
  this.waypoints = [];      // Waypoints along route; populated when user chooses a Place
  this.places = [];       // Chosen places along route
  this.polyline = [];       // Array of latlngs that comprise the route polyline
  this.initialDuration;     // Initial route duration provided by directions response
  this.initialDistance;     // Initial route distance provided by directions response

  this.getDirections = function getDirections() {
    // Builds and sends directions request to Google Maps API

    var request = new directionsRequest(route.start, route.end, route.waypoints);
    var deferred = Q.defer();

    directionsService.route(request, function(response, status){
      if (status == google.maps.DirectionsStatus.OK) {

        // Displays route on map
        directionsDisplay.setMap(map);
        directionsDisplay.setDirections(response);
        route.reorderWaypoints(response.routes[0].waypoint_order);

        deferred.resolve(response);
      }
      else {
        console.log(status);
        $('#list-container')
          .append('<strong>There was an error with your search.' +
                  'Please try again.</strong>')
          .addClass('text-alert');
        $('.text-alert, #start-over-div').show();
        $('.loading').hide();
              deferred.reject(status);
      }
    });

    return deferred.promise;
  };

  this.getPolyline = function getPolyline(directions) {
    // Decodes directions polyline and identifies search points and radius

    this.polyline = google.maps.geometry.encoding.decodePath(
      directions
      .routes[0]
      .overview_polyline
    );
    this.initialDuration = 0;
    this.initialDistance = 0;

    for (var i = 0; i < directions.routes[0].legs.length; i++) {
      this.initialDuration += directions.routes[0].legs[i].duration.value;
      this.initialDistance += directions.routes[0].legs[i].distance.value;
    }
  };

  this.reorderWaypoints = function reorderWaypoints(order) {
    /*  Uses waypoint_order array from the Google Maps API directions response
      to reorder the route's waypoint list. Waypoints are ordered to optimize
      routing. */

    var templist = [];
    for (var i = 0; i < order.length; i++) {
      templist.push(this.places[order[i]]);
    }
    this.places = templist.slice();
  };
};


function Place(name, id, lat, lng, location, rating) {
  // The Place object stores information about each place returned by Google.

  this.name = name;     // Place name from Places response
  this.id = id;       // Unique place ID
  this.lat = lat;
  this.lng = lng;
  this.location = location; // Google latlng object
  this.rank;          // Rank based on distance from route
  this.rating = rating;   // Business rating from Google Places response
};


function Search(keyword, sortby, opennow) {
  this.keyword = keyword;   // User's search keyword
  this.sortby = sortby;   // User's sorting choice
  this.places = {};       // Contains Place objects
  this.placeList = [];      // List of places, sorted by rank
  this.searchPoints = [];   // List of points from route that are used for Places API call
  this.radius;        // Radius of Places search
  this.sortedPlaces = [];   // List of sorted places returned from distance matrix request
  this.unreturnedPlaces = []; // List of latlng objects, sorted by rank, that have not yet been returned to the user
  this.counter;       // Used to track whether all responses from the Places API have been returned
  this.numSearches;     // Compared with counter to track whether all responses have been returned

  this.getSearchPoints = function(route) {
    pointsInPolyline = route.polyline.length;

    // Sets search radius and checks that it doesn't exceed Google Maps API 50km limit
    this.radius = route.initialDistance / 7;
    if (this.radius > 50000) {    
      this.radius = 50000;
    }

    // Creates list of search points. Search points are spaced at a distance
    // equal to the search radius.
    this.searchPoints.push(route.polyline[0]);
    for (i = 0; i < pointsInPolyline; i++) {
      distanceBetweenPoints = getDistanceFromLatLonInKm(
        route.polyline[i].k,
        route.polyline[i].B,
        this.searchPoints[this.searchPoints.length - 1].k,
        this.searchPoints[this.searchPoints.length - 1].B
      );

      if ((distanceBetweenPoints * 1000) > (this.radius)) {
        this.searchPoints.push(route.polyline[i]);
      }
    }
    this.searchPoints.push(route.polyline[route.polyline.length - 1]);
    
    // Uncomment this to show search bubbles:
    // console.log(this.searchPoints.length);
    // for (var i = 0; i < this.searchPoints.length; i++) {
    //  displaySearchPoint(this.searchPoints[i], this.radius);
    // }
  };

  this.getPlaces = function() {
    this.numSearches = this.searchPoints.length;
    this.counter = 0;

    // Sets delay to throttle Google Places API calls so as not to exceeding query rate limits.
    if (this.numSearches < 35) {
      var delay = this.numSearches * 13;
    }
    else {
      var delay = 450;
    }

    // For each search point, calls Places API.
    for (var i = 0; i < this.numSearches; i++) {
      setTimeout(function() {
        var placesService = new google.maps.places.PlacesService(map);
        var request = new placesRequest(search.searchPoints.pop(),
                        search.radius,
                        search.keyword);

        placesService.nearbySearch(request, function(results, status) {
          if (status == google.maps.places.PlacesServiceStatus.OK) {
            processPlaces(results);
          }
          else {
            // Uncomment for troubleshooting:
            // console.log(status);
          }

          // Counter tracks whether all Places requests have returned.
          search.counter++;
          if (search.counter >= search.numSearches) {

            // Checks if there are search results and alerts user if not.
            if (Object.keys(search.places).length == 0) {
              $('#list-container')
                .append('<strong>There are no places that match your' +
                  'search.</strong>')
                .addClass('text-alert');
              $('.text-alert, #start-over-div').show();
              $('.loading').hide();
            }
            else {
              getAddedDistance(route);
            }
          }
        });
      }, i * delay);
    }
  }
};


function distanceMatrixRequest(origins, destinations) {
  // Distance matrix API request object

  this.origins = origins;
  this.destinations = destinations;
  this.travelMode = route.travelMode;
};


function placesRequest(location, radius, keyword) {
  // Places API request object

  this.location = location;
  this.radius = radius;
  this.rankby = google.maps.places.RankBy.PROMINENCE;
  this.keyword = keyword;
  this.openNow = document.getElementById('opennow').checked;
};


function directionsRequest(origin, destination, waypoints) {
  // Directions API request object

  this.origin = origin;
  this.destination = destination;
  this.travelMode = route.travelMode;
  this.waypoints = waypoints;
  this.optimizeWaypoints = true;
};


function Waypoint(location) {
  // Waypoint object; created when user chooses a Place
  this.location = location;
  this.stopover = true;
};
