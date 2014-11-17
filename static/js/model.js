function Route(start, end, travelMode) {
	this.start = start;  			// User's starting point
	this.end = end;					// User's ending point
	this.travelMode = travelMode;	// User's travel mode
	this.waypoints = [];			// Waypoints along route; populated when user chooses a Place
	this.polyline = [];				// Array of latlngs that comprise the route polyline
	this.initialDuration = null;	// Initial route duration
	this.initialDistance = null;	// Initial route distance

	this.getDirections = function getDirections() {
		// Build and send directions request 
		var request = new directionsRequest(route.start, route.end, route.waypoints);
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

	this.getPolyline = function getPolyline(directions) {
		// Decodes directions polyline and identifies search points and radius
		this.polyline = google.maps.geometry.encoding.decodePath(directions.routes[0].overview_polyline);
		this.initialDuration = directions.routes[0].legs[0].duration.value;
		this.initialDistance = directions.routes[0].legs[0].distance.value;
	};
}


function Place(name, id, lat, lng, location) {
	this.name = name;			// Place name from Places response
	this.id = id;				// Unique place ID
	this.lat = lat;
	this.lng = lng;
	this.location = location;	// Google latlng object
	this.rank = null;			// Rank based on distance from route
}

function Search(keyword, opennow) {
	this.keyword = keyword;		// User's search keyword
	this.places = {}; 			// Contains Place objects
	this.placeList = [];  		// List of places, sorted by rank
	this.searchPoints = []; 	// List of points from route that are used for Places API call
	this.radius = null;			// Radius of Places search
	this.sortedPlaces = [];		// List of sorted places returned from distance matrix request
	this.unreturnedPlaces = []; // List of latlng objects, sorted by rank, that have not yet been returned to the user

	this.getSearchPoints = function (route) {
		// Identifies 10 points along polyline for Places search, stored in search object
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
					// console.log(results);
					processPlaces(results); 
				}
				else {
					console.log(status);
				}

				// Counter tracks whether all Places requests have returned.
				counter++;
				if (counter >= numSearches) {
					// Checks if there are search results:
					if (Object.keys(search.places).length == 0) {
						$("#list-container")
							.append("<strong>There are no places that match your search.</strong>")
							.addClass("text-alert");
					}
					else {
						getAddedDistance(route);
					}
				}
			});
		}
	}
}


function distanceMatrixRequest(origins, destinations) {
	// Build distance matrix API request
	this.origins = origins;
	this.destinations = destinations;
	this.travelMode = route.travelMode;
}


function placesRequest(location, radius, keyword) {
	// Build places API request
	this.location = location;
	this.radius = radius;
	this.rankby = google.maps.places.RankBy.PROMINENCE;
	this.keyword = keyword;
	this.openNow = document.getElementById('opennow').checked;
}


function directionsRequest(origin, destination, waypoints) {
	// Build directions API request
	this.origin = origin;
	this.destination = destination;
	this.travelMode = route.travelMode;
	this.waypoints = waypoints;
}


function Waypoint(location) {
	// Waypoint object; created when user chooses a Place
	this.location = location;
	this.stopover = true;
}

