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
	var request = {
		origin: route.start,
		destination: route.end,
		travelMode: google.maps.TravelMode.DRIVING
	};

	directionsService.route(request, function(response, status){
		if (status == google.maps.DirectionsStatus.OK) {
			// Displays route on map.
			directionsDisplay.setMap(map);
			directionsDisplay.setDirections(response);

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
			increment = Math.ceil(pointsInPolyline / 11);
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

			// For each search point, display it on the map and find places.
			// When the increment variable exceeds the number of points in 
			// the polyline, end the loop.
			var i = increment;
			while (i < pointsInPolyline) {
				point = route.polyline[i];
				// displayPoint(point, radius);
				getPlacesByPoint(point, route, radius);
				i = (i + increment);
			}

			setTimeout( function () {
				getAddedDistance(route);
			}, 500 );
}


function defineRadius(distance) {
	// Defines radius of search area based on total distance of initial route.
	var radius = distance / 10;
	if (radius > 50000) {
		radius = 50000;
	}
	return radius;
}


function getPlacesByPoint(point, route, radius) {
	var placesService = new google.maps.places.PlacesService(map);

	// Create Places request
	var request = {
		location: point,
		radius: radius,
		rankby: 'distance',
		keyword: route.keyword
	}

	// Make places request. 
	placesService.nearbySearch(request, function(results, status) {
		processPlaces(results, status, route);
	});
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
	// counter = numRequests * 2;
	// var placeListCopy = placeList;
	
	// // Limits requests to Distance Matrix to 25 items per API quotas
	// for (var i = 0; i < numRequests; i++) {
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

	// var requestStart = new distanceMatrixRequest([route.start], requestList, google.maps.TravelMode.DRIVING);
	// var requestEnd = new distanceMatrixRequest(requestList, [route.end], google.maps.TravelMode.DRIVING);

	// 	service.getDistanceMatrix(requestStart, 
	// 		function(response, status) {
	// 			processDistancesFromStart(response, status, route, requestStart);
	// 		}
	// 	);

	// 	setTimeout(function() {
	// 		service.getDistanceMatrix(requestEnd,
	// 			function(response, status) {
	// 				processDistancesToEnd(response, status, route, requestEnd)
	// 			}
	// 		);
	// 	}, 500);
	// }

	var requestStart = new distanceMatrixRequest([route.start], placeList.slice(0,25), google.maps.TravelMode.DRIVING);
	var requestEnd = new distanceMatrixRequest(placeList.slice(0,25), [route.end], google.maps.TravelMode.DRIVING);

	service.getDistanceMatrix(requestStart, function(response, status) {
		processDistancesFromStart(response, status, route, requestStart);
	});

	setTimeout(function() {
		service.getDistanceMatrix(requestEnd, function(response, status) {
			processDistancesToEnd(response, status, route, requestEnd);
		});
	}, 500);

	setTimeout(function() {
		returnTopTen(route, placeList.slice(0,25));
	}, 1000);
}


function processDistancesFromStart (response, status, route, request) {
	if (status == google.maps.DistanceMatrixStatus.OK) {
		for (var i = 0; i < response.rows[0].elements.length; i++) {
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
		displayPlace(sortedPlaces[i][1], i * 200, route.places[sortedPlaces[i][2]].place.name);

		$("#place-list").append("<li>" + route.places[sortedPlaces[i][2]].place.name + "</li>");
	}
}