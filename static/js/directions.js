function findPlaces(evt) {
	event.preventDefault();

	var route = new Route(
		document.getElementById('start').value,
		document.getElementById('end').value,
		document.getElementById('place').value
	);

	clearMap(route);
	getDirections(route);
}


function getDirections(route) {
	// Creates directions request
	var request = new directionsRequest(route.start, route.end, google.maps.TravelMode.DRIVING);

	directionsService.route(request, function(response, status){
		if (status == google.maps.DirectionsStatus.OK) {
			// Displays route on map.
			directionsDisplay.setMap(map);
			directionsDisplay.setDirections(response);

			// Calls function to break polyline into points for Places search.
			processDirections(response, route)
		}
	});
}


function processDirections(response, route) {
			// Decodes directions polyline and identifies search points and radii
			route['polyline'] = google.maps.geometry.encoding.decodePath(response.routes[0].overview_polyline);
			route['initialDuration'] = response.routes[0].legs[0].duration.value;
			route['initialDistance'] = response.routes[0].legs[0].distance.value;

			// var polylineArray = [];

			// for (i = 0; i < polyline.length; i++) {
			// 	var latlng = (polyline[i].k + "," + polyline[i].B)
			// 	polylineArray.push(latlng);
			// }

			pointsInPolyline = route.polyline.length;
			increment = Math.ceil(pointsInPolyline / 10);
			var radius = defineRadius(response.routes[0].legs[0].distance.value);

// AJAX CALL TO MY SERVER-SIDE SCRIPTS
			// $.get("/getplaces", {
	 	// 				'polyline': JSON.stringify(polylineArray),
	 	// 				'initialDuration': initialDuration,
	 	// 				'initialDistance': initialDistance,
	 	// 				'start': route.start,
	 	// 				'end': route.end,
	 	// 				'keyword': route.keyword,
	 	// 				'radius': radius
	 	// 			},
	  // 				function(result) {
			// 			console.log(result);
			// 		});

			var placesService = new google.maps.places.PlacesService(map);
			var counter = pointsInPolyline / increment;

			// For each search point, display it on the map and find places.
			// When the increment variable exceeds the number of points in 
			// the polyline, end the loop.
			for (i = 0; i < pointsInPolyline; i = i + increment){
				// displayPoint(route.polyline[i], radius);
				var request = new placesRequest(route.polyline[i], radius, route.keyword);
				placesService.nearbySearch(request, function(results, status) {
					// while (status == google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
					// 	setTimeout(function () {
					// 		placesService.nearbySearch(request, function(results, status) {
					// 			console.log("retry", status);
					// 			processPlaces(results, status, route);
					// 		});
					// 	}, 1000);
					// }
					
					processPlaces(results, status, route);

					counter--;
					if (counter <= 0) {
						// console.log(Object.keys(route.places).length);
						getAddedDistance(route);
					}
				});
			}
}


function defineRadius(distance) {
	// Defines radius of search area based on total distance of initial route.
	var radius = distance / 10;
	if (radius > 50000) {
		radius = 50000;
	}
	return radius;
}


function processPlaces(results, status, route) {
	// For each place return, create new Place object and add to allPlaces
	if (status == google.maps.places.PlacesServiceStatus.OK) {
		for (var j = 0; j < results.length; j++) {
			
			var placeID = results[j].place_id;
			var name = results[j].name;
			var lat = results[j].geometry.location.k;
			var lng = results[j].geometry.location.B; 
			var location = results[j].geometry.location
			var latlng = new google.maps.LatLng(lat, lng)

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


// function limitRequest (placeListCopy, numRequests, counter, route, service) {
// 	// Limits requests to Distance Matrix to 25 items per API quotas
// 	var requestList = [];
// 	if (placeListCopy.length > 25) {
// 		// for (var j = 0; j < 25 || placeList.length == 0; j++) {
// 		for (var j = 0; j < 25; j++) {				
// 			var item = placeListCopy.pop();
// 			requestList.push(item);
// 		}
// 	}
// 	else {
// 		requestList = placeListCopy;
// 	}

// 	console.log("requestList: ", requestList.length);

// 	var requestStart = new distanceMatrixRequest([route.start], requestList, google.maps.TravelMode.DRIVING);
// 	var requestEnd = new distanceMatrixRequest(requestList, [route.end], google.maps.TravelMode.DRIVING);

// 	service.getDistanceMatrix(requestStart, 
// 		function(response, status) {
// 			processDistancesFromStart(response, status, route, requestStart);
			
// 			service.getDistanceMatrix(requestEnd,
// 				function(response, status) {
// 					processDistancesToEnd(response, status, route, requestEnd);

// 					counter++;
// 					if (counter == numRequests) {
// 						returnTopTen(route, placeList);
// 					}
// 					else {
// 						setTimeout(function() {
// 							limitRequest(placeListCopy, numRequests, counter, route, service)
// 						}, 500);
// 					}
// 				})
// 		}
// 	);
// }


function processDistancesFromStart (response, status, route, request) {
	console.log(status);
	if (status == google.maps.DistanceMatrixStatus.OK) {
		console.log(request.destinations.length);
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
	for (var i = 0; i < 10; i++) {
	// for (var i = 0; i < sortedPlaces.length; i++) {
		displayPlace(sortedPlaces[i][1], i * 200, route.places[sortedPlaces[i][2]].place.name);
		var durationAdded = Math.ceil((sortedPlaces[i][0] - route.initialDuration) / 60);
		$("#place-list").append("<li>" + route.places[sortedPlaces[i][2]].place.name + ", " + durationAdded + " min added to route</li>");
	}
}