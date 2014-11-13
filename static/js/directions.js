function findPlaces(evt) {
	event.preventDefault();

	route = new Route(
		document.getElementById('start').value,
		document.getElementById('end').value,
		document.getElementById('keyword').value
	);

	clearMap(route);

	getDirections(route)
		.then(
			function (response) {
				return pointifyPolyline(response, route);
			},
			function (status) {
				console.log(status);
			}
		)
		.then(function (searchCriteria) {
				searchPoints = searchCriteria[0];
				radius = searchCriteria[1];
				searchPlaces(searchPoints, radius, route);
			}
		);

}


function getDirections(route) {
	// Creates directions request
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
}


function pointifyPolyline(directions, route) {
	var NUMPOINTS = 10;

	// Decodes directions polyline and identifies search points and radius
	route['polyline'] = google.maps.geometry.encoding.decodePath(directions.routes[0].overview_polyline);
	route['initialDuration'] = directions.routes[0].legs[0].duration.value;
	route['initialDistance'] = directions.routes[0].legs[0].distance.value;

	pointsInPolyline = route.polyline.length;
	increment = Math.ceil(pointsInPolyline / NUMPOINTS);

	var radius = route.initialDistance / NUMPOINTS;
	if (radius > 50000) {
		radius = 50000;
	}

	searchPoints = [];
	for (i = 0; i < pointsInPolyline; i = i + increment) {
		searchPoints.push(route.polyline[i]);
	}

	return [searchPoints, radius];
}


function searchPlaces(searchPoints, radius, route) {
	var placesService = new google.maps.places.PlacesService(map);
	var numSearches = searchPoints.length;
	var counter = 0;

	// Find places for each search point. When the increment variable
	// exceeds the number of search points, end the loop.
	for (var i = 0; i < numSearches; i++){
		var request = new placesRequest(searchPoints[i], radius, route.keyword);
		// displayPoint(searchPoints[i], radius);

		placesService.nearbySearch(request, function(results, status) {

			processPlaces(results, status, route);

			counter++;
			if (counter >= numSearches) {
				// console.log(Object.keys(route.places).length);
				getAddedDistance(route);
			}
		});
	}
}


function callPlaces(request, route, counter) {
	var placesService = new google.maps.places.PlacesService(map);
	placesService.nearbySearch(request, function(results, status) {
		if (status == google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
			console.log("retry");
			setTimeout(function() {
				callPlaces(request, route)
			}, 1000);
		}
		else {
			processPlaces(results, status, route);
			counter--;
			return counter;
		}
	})
}


function processPlaces(results, status, route) {
	// For each place return, create new Place object and add to allPlaces
	if (status == google.maps.places.PlacesServiceStatus.OK) {
		for (var j = 0; j < results.length; j++) {
			
			var placeID = results[j].place_id;
			var name = results[j].name;
			var lat = results[j].geometry.location.k;
			var lng = results[j].geometry.location.B; 
			var location = results[j].geometry.location;
			var latlng = new google.maps.LatLng(lat, lng);

			route.places[latlng] = {};
			// allPlaces[latlng] = {};
			route.places[latlng]["place"] = new Place(name, placeID, lat, lng, location);

			// displayPlace(results[j].geometry.location);
		}
	}
}


function getAddedDistance(route) {

	var service = new google.maps.DistanceMatrixService();
	
	placeList = [];
	$.each(route.places, function(latlng, Place) {
		placeList.push(latlng);
	});

	// var numPlaces = placeList.length;
	// var numRequests = Math.ceil(numPlaces / 25);
	// // counter = numRequests * 2;
	// var placeListCopy = placeList.slice(0);
	// var counter = 0;

	// limitRequest(placeListCopy, numRequests, counter, route, service);
	
	var requestStart = new distanceMatrixRequest([route.start], placeList.slice(0,25), google.maps.TravelMode.DRIVING);
	var requestEnd = new distanceMatrixRequest(placeList.slice(0,25), [route.end], google.maps.TravelMode.DRIVING);

	service.getDistanceMatrix(requestStart, function(response, status) {
		processDistancesFromStart(response, status, route, requestStart);

		service.getDistanceMatrix(requestEnd, function(response, status) {
			processDistancesToEnd(response, status, route, requestEnd);

			returnTopTen(route, placeList.slice(0,25));
		});
	});
}


function limitRequest (placeListCopy, numRequests, counter, route, service) {
	// Limits requests to Distance Matrix to 25 items per API quotas
	var requestList = [];
	if (placeListCopy.length > 25) {
		// for (var j = 0; j < 25 || placeList.length == 0; j++) {
		for (var j = 0; j < 25; j++) {				
			var item = placeListCopy.pop();
			requestList.push(item);
		}
	}
	else {
		requestList = placeListCopy;
	}

	console.log("requestList: ", requestList.length);

	var requestStart = new distanceMatrixRequest([route.start], requestList, google.maps.TravelMode.DRIVING);
	var requestEnd = new distanceMatrixRequest(requestList, [route.end], google.maps.TravelMode.DRIVING);

	service.getDistanceMatrix(requestStart, 
		function(response, status) {
			processDistancesFromStart(response, status, route, requestStart);
			
			service.getDistanceMatrix(requestEnd,
				function(response, status) {
					processDistancesToEnd(response, status, route, requestEnd);

					counter++;
					if (counter == numRequests) {
						returnTopTen(route, placeList);
					}
					else {
						setTimeout(function() {
							limitRequest(placeListCopy, numRequests, counter, route, service)
						}, 500);
					}
				})
		}
	);
}


function processDistancesFromStart (response, status, route, request) {
	// console.log(status);
	if (status == google.maps.DistanceMatrixStatus.OK) {
		// console.log(request.destinations.length);
		for (var i = 0; i < request.destinations.length; i++) {
			var distance = response.rows[0].elements[i].distance.value;
			var duration = response.rows[0].elements[i].duration.value;
			route.places[request.destinations[i]]['duration'] = duration;
			route.places[request.destinations[i]]['distance'] = distance;
		}
	}
}


function processDistancesToEnd (response, status, route, request) {
	if (status == google.maps.DistanceMatrixStatus.OK) {
		for (var i = 0; i < response.rows.length; i++) {
			var distance = response.rows[i].elements[0].distance.value;
			var duration = response.rows[i].elements[0].duration.value;
			route.places[request.origins[i]]['duration'] = route.places[request.origins[i]]['duration'] + duration;
			route.places[request.origins[i]]['distance'] = route.places[request.origins[i]]['distance'] + distance;
		}
	}
}


function returnTopTen (route, placeList) {
	var sortedPlaces = [];
	for (var i = 0; i < placeList.length; i++) {
		sortedPlaces.push([route.places[placeList[i]].duration, route.places[placeList[i]].place.location, placeList[i]]);
	}
	sortedPlaces.sort();
	displayTopTen(route, sortedPlaces);
}


function displayTopTen (route, sortedPlaces) {
	for (var i = 0; i < 10 ; i++) {
	// for (var i = 0; i < sortedPlaces.length; i++) {
		place = route.places[sortedPlaces[i][2]].place;
		displayPlace(place.location, i * 200, place);
		var durationAdded = Math.ceil((sortedPlaces[i][0] - route.initialDuration) / 60);

		if (durationAdded <= 0) {
			$("#list-container").append("<div class='list-item' id='" + place.id + "'><strong>" + place.name + "</strong><br><em>No travel time added.</em></div>");
			// $("#"+place.id).on('mouseenter', toggleIcon(place.marker)).on('mouseleave', toggleIcon(place.marker));
		}
		else {
			$("#list-container").append("<div class='list-item' id='" + place.id + "'><strong>" + place.name + "</strong><br><em>" + durationAdded + " min added to route.</em></div>");
			// $("#"+place.id).on('mouseenter', toggleIcon(place.marker)).on('mouseleave', toggleIcon(place.marker));
		}
	}
}

function displayDirections (place) {
	var waypoint = new Waypoint(place.location)
	route.waypoints.push(waypoint);

	getDirections(route)
		.then(
			function (response) {
				$("#list-container").empty();
				$("#directions").empty();
				$("#directions").append("<div><h4>" + place.name + "</h4></div>");

				var legs = response.routes[0].legs;
				for (var i = 0; i < legs.length; i++) {

					var steps = response.routes[0].legs[i].steps;
					for (var j = 0; j < steps.length; j++) {
						$("#directions").append("<div class=step-instructions>" + (j + 1) + ") " + steps[j].instructions + "</div>");
					}

					$("#directions").append("<br>");
				}
			},
			function (status) {
				console.log(status);
			}
		);
}

// AJAX CALL TO MY SERVER-SIDE SCRIPTS
// function ajaxCall(route, radius) {
// 			var polylineArray = [];

// 			for (i = 0; i < route.polyline.length; i++) {
// 				var latlng = (route.polyline[i].k + "," + route.polyline[i].B)
// 				polylineArray.push(latlng);
// 			}

// 			$.get("/getplaces", {
// 	 					'polyline': JSON.stringify(polylineArray),
// 	 					'initialDuration': route.initialDuration,
// 	 					'initialDistance': route.initialDistance,
// 	 					'start': route.start,
// 	 					'end': route.end,
// 	 					'keyword': route.keyword,
// 	 					'radius': radius
// 	 				},
// 	  				function(result) {
// 						console.log(result);
// 					});
// }

