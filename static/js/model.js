function Route(start, end) {
	this.start = start;
	this.end = end;
	this.waypoints = [];
	this.polyline = [];
	this.initialDuration = null;
	this.initialDistance = null;

	this.getDirections = function () {
		var request = new directionsRequest(route.start, route.end, google.maps.TravelMode.DRIVING, route.waypoints);
		var deferred = Q.defer();

		directionsService.route(request, function(response, status){
			if (status == google.maps.DirectionsStatus.OK) {

				// Displays route on map.
				directionsDisplay.setMap(map);
				directionsDisplay.setDirections(response);

				deferred.resolve(response);
			}
			else {
				console.log(status);
            	deferred.reject(status);
			}
		});
		return deferred.promise;
	};

	this.getPolyline = function (directions) {
		// Decodes directions polyline and identifies search points and radius
		this.polyline = google.maps.geometry.encoding.decodePath(directions.routes[0].overview_polyline);
		this.initialDuration = directions.routes[0].legs[0].duration.value;
		this.initialDistance = directions.routes[0].legs[0].distance.value;
	};
}


function Place(name, id, lat, lng, location) {
	this.name = name;
	this.id = id;
	this.lat = lat;
	this.lng = lng;
	this.location = location;
	this.rank = null;
}

function Search(keyword) {
	this.keyword = keyword;		// User's search keyword
	this.places = {}; 			// Contains Place objects
	this.rankedPlaceList = [];  // List of places, sorted by rank
	this.searchPoints = []; 	// List of points from route that are used for Places API call
	this.radius = null;
	this.sortedPlaces = [];

	this.getSearchPoints = function (route) {
		var NUMPOINTS = 10;

		pointsInPolyline = route.polyline.length;
		increment = Math.ceil(pointsInPolyline / NUMPOINTS);

		this.radius = route.initialDistance / NUMPOINTS;
		if (this.radius > 50000) {
			this.radius = 50000;
		}

		this.searchPoints = [];
		for (i = 0; i < pointsInPolyline; i = i + increment) {
			this.searchPoints.push(route.polyline[i]);
		}
	};

	this.getPlaces = function () {
		var placesService = new google.maps.places.PlacesService(map);
		var numSearches = this.searchPoints.length;
		var counter = 0;

		// Find places for each search point. When the increment variable
		// exceeds the number of search points, end the loop.
		for (var i = 0; i < numSearches; i++){
			var request = new placesRequest(this.searchPoints[i], this.radius, this.keyword);
			// displayPoint(this.searchPoints[i], this.radius);

			placesService.nearbySearch(request, function(results, status) {
				if (status == google.maps.places.PlacesServiceStatus.OK) {
					processPlaces(results, request.location);  // This doesn't work because request.location only sends last point.
				}
				else {
					// TODO: handle error.
				}

				counter++;
				if (counter >= numSearches) {
					getAddedDistance(route);
				}
			});
		}
	}
}


function distanceMatrixRequest(origins, destinations, travelMode) {
	this.origins = origins;
	this.destinations = destinations;
	this.travelMode = travelMode;
}


function placesRequest(location, radius, keyword) {
	this.location = location;
	this.radius = radius;
	this.rankby = 'distance';
	this.keyword = keyword;
	this.openNow = document.getElementById('opennow').checked;
}


function directionsRequest(origin, destination, travelMode, waypoints) {
	this.origin = origin;
	this.destination = destination;
	this.travelMode = travelMode;
	this.waypoints = waypoints;
}


function Waypoint(location) {
	this.location = location;
	stopover = true;
}
