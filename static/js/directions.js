function findPlaces(evt) {
	event.preventDefault();

	route = new Route(
		document.getElementById('start').value,
		document.getElementById('end').value
		// document.getElementById('keyword').value
	);

	search = new Search(
		document.getElementById('keyword').value
	);

	clearMap(route);

	route.getDirections()
		.then(
			function (response) {
				route.getPolyline(response);
				return search.getSearchPoints(route);
			}
		)
		.then(function () {
				searchPlaces(search.searchPoints, search.radius);
			}
		);

}

function searchPlaces(searchPoints, radius) {
	var placesService = new google.maps.places.PlacesService(map);
	var numSearches = searchPoints.length;
	var counter = 0;

	// Find places for each search point. When the increment variable
	// exceeds the number of search points, end the loop.
	for (var i = 0; i < numSearches; i++){
		var request = new placesRequest(searchPoints[i], radius, search.keyword);
		// displayPoint(searchPoints[i], radius);

		placesService.nearbySearch(request, function(results, status) {
			if (status == google.maps.places.PlacesServiceStatus.OK) {
				processPlaces(results, request.location);  // This doesn't work because request.location only sends last point.
			}
			else {
				// alert("Uh oh! Something went wrong. Please try again.")
				// TODO: handle error.
			}

			counter++;
			if (counter >= numSearches) {
				getAddedDistance(route);
			}
		});
	}
}


// function callPlaces(request, route, counter) {
// 	var placesService = new google.maps.places.PlacesService(map);
// 	placesService.nearbySearch(request, function(results, status) {
// 		if (status == google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
// 			console.log("retry");
// 			setTimeout(function() {
// 				callPlaces(request, route)
// 			}, 1000);
// 		}
// 		else {
// 			processPlaces(results, status, route);
// 			counter--;
// 			return counter;
// 		}
// 	})
// }


function processPlaces(results, searchPoint) {
	// For each place return, create new Place object and add to allPlaces
	for (var j = 0; j < results.length; j++) {
		
		var placeID = results[j].place_id;
		var name = results[j].name;
		var lat = results[j].geometry.location.k;
		var lng = results[j].geometry.location.B; 
		var location = results[j].geometry.location;
		var latlng = new google.maps.LatLng(lat, lng);

		search.places[latlng] = {};
		search.places[latlng]["place"] = new Place(name, placeID, lat, lng, location);

		rank(search.places[latlng]["place"], searchPoint);

		// displayPlace(results[j].geometry.location);
	}
}

function rank(place, searchPoint) {
	// TODO: find some way to rank the place list so best 25 get sent first

	lat1 = searchPoint.k;
	lat2 = place.lat;
	lng1 = searchPoint.B;
	lng2 = place.lng;

	place.rank = getDistanceFromLatLonInKm(lat1, lng1, lat2, lng2);
}

function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
	var R = 6371; // Radius of the earth in km
	var dLat = deg2rad(lat2-lat1);  // deg2rad below
	var dLon = deg2rad(lon2-lon1); 
	var a = 
		Math.sin(dLat/2) * Math.sin(dLat/2) +
		Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
		Math.sin(dLon/2) * Math.sin(dLon/2); 
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
	var d = R * c; // Distance in km
	return d;
}

function deg2rad(deg) {
	return deg * (Math.PI/180)
}

function buildPlaceList(route) {
	placeList = [];
	$.each(search.places, function(latlng, Place) {
		placeList.push([Place.place.rank, latlng]);
		// placeList.push(latlng);
	});

	placeList.sort();
	
	var newPlaceList = [];
	for (var i = 0; i < placeList.length; i++) {
		newPlaceList.push(placeList[i][1]);
	}
	
	return newPlaceList;
}


function getAddedDistance() {
	
	// placeList = buildPlaceList(route);

	search.placeList = [];
	$.each(search.places, function(latlng, Place) {
		search.placeList.push(latlng);
	});

	// requestList = placeList.slice(0,25);

	// var numPlaces = placeList.length;
	// var numRequests = Math.ceil(numPlaces / 25);
	// // counter = numRequests * 2;
	// var placeListCopy = placeList.slice(0);
	// var counter = 0;

	// limitRequest(placeListCopy, numRequests, counter, route, service);

	callDistanceMatrix(buildRequestList());

}

function buildRequestList() {

	requestList = [];
	for (var i = 0; i < 25; i++) {
		var index = Math.floor(Math.random() * search.placeList.length); // Picks random item from list
		requestList.push(search.placeList.splice(index, 1)[0]); // Removes from list and adds to request list
	}

	return requestList
}


function callDistanceMatrix(requestList) {
	var distanceAPI = new google.maps.DistanceMatrixService();

	var requestStart = new distanceMatrixRequest([route.start], requestList, google.maps.TravelMode.DRIVING);
	var requestEnd = new distanceMatrixRequest(requestList, [route.end], google.maps.TravelMode.DRIVING);

	distanceAPI.getDistanceMatrix(requestStart, function(response, status) {
		processDistancesFromStart(response, status, route, requestStart);

		distanceAPI.getDistanceMatrix(requestEnd, function(response, status) {
			processDistancesToEnd(response, status, route, requestEnd);

			returnTopTen(route, requestList);
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
	// console.log(status);
	if (status == google.maps.DistanceMatrixStatus.OK) {
		// console.log(request.destinations.length);
		for (var i = 0; i < request.destinations.length; i++) {
			var distance = response.rows[0].elements[i].distance.value;
			var duration = response.rows[0].elements[i].duration.value;
			search.places[request.destinations[i]]['duration'] = duration;
			search.places[request.destinations[i]]['distance'] = distance;
		}
	}
}


function processDistancesToEnd (response, status, route, request) {
	if (status == google.maps.DistanceMatrixStatus.OK) {
		for (var i = 0; i < response.rows.length; i++) {
			var distance = response.rows[i].elements[0].distance.value;
			var duration = response.rows[i].elements[0].duration.value;
			search.places[request.origins[i]]['duration'] = search.places[request.origins[i]]['duration'] + duration;
			search.places[request.origins[i]]['distance'] = search.places[request.origins[i]]['distance'] + distance;
		}
	}
}


function returnTopTen (route, requestList) {
	var sortedPlaces = [];
	for (var i = 0; i < requestList.length; i++) {
		sortedPlaces.push([search.places[requestList[i]].duration, search.places[requestList[i]].place.location, requestList[i]]);
	}
	sortedPlaces.sort();
	displayTopTen(route, sortedPlaces);
}


function displayTopTen (route, sortedPlaces) {
	if (sortedPlaces.length < 10) {
		var maxResult = sortedPlaces.length;
		$("#find-more").hide();
	}
	else {
		var maxResult = 10;
		$("#find-more").show();
	}

	for (var i = 0; i < maxResult; i++) {
	// for (var i = 0; i < sortedPlaces.length; i++) {
		place = search.places[sortedPlaces[i][2]].place;
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
				$("#find-more").hide();
				$("#directions").append("<h4>Directions</h4>");
				$("#directions").append("<div class='waypoint'><h5>Start: " + route.start + "</h5></div>");

				var legs = response.routes[0].legs;
				for (var i = 0; i < legs.length; i++) {

					var steps = response.routes[0].legs[i].steps;
					for (var j = 0; j < steps.length; j++) {
						$("#directions").append("<div class=step-instructions>" + (j + 1) + ") " + steps[j].instructions + "</div>");
					}

					$("#directions").append("<div class='waypoint'><h5>" + " " +"</h5></div>");
				}
				$("#directions").append("<div class='waypoint'><h5>End: " + route.end +"</h5></div>");
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

