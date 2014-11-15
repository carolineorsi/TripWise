function findPlaces(evt) {
	event.preventDefault();
	clearMap();

	// Create route object based on user's input.
	route = new Route(
		document.getElementById('start').value,
		document.getElementById('end').value,
		checkTravelMode()
	);

	// Create search object based on user's input.
	search = new Search(
		document.getElementById('keyword').value
	);

	// Get initial directions and use returned value to find Places.
	route.getDirections()
		.then(
			function (response) {
				route.getPolyline(response);
				return search.getSearchPoints(route);
			}
		)
		.then(function () {
				search.getPlaces();
			}
		);

}

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

function processPlaces(results) {
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

		rank(search.places[latlng]["place"]);

		// displayPlace(results[j].geometry.location);
	}
}


function rank(place) {
	// Rank place based on direct distance from route polyline. Uses
	// getDistanceFromLatLonInKm to calculate distance.
	place.rank = 1000;
	var polylineLength = route.polyline.length;
	
	for (var i = 0; i < polylineLength; i++) {
		var lat1 = route.polyline[i].k;
		var lat2 = place.lat;
		var lng1 = route.polyline[i].B;
		var lng2 = place.lng;
	
		var distanceFromPolyline = getDistanceFromLatLonInKm(lat1, lng1, lat2, lng2);
		if (distanceFromPolyline < place.rank) {
			place.rank = distanceFromPolyline;
		}
	}
}


function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
	// Taken from http://stackoverflow.com/questions/27928/how-do-i-calculate-distance-between-two-latitude-longitude-points
	var R = 6371; 					// Radius of the earth in km
	var dLat = deg2rad(lat2-lat1);  
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


function getAddedDistance() {
	// Create complete place list and sort by rank. Use sorted list to populated
	// the unreturned places list, which tracks which places have already been 
	// shown to user (displayed on map and results list).
	search.placeList = [];
	$.each(search.places, function(latlng, Place) {
		search.placeList.push(Place.place);
	});

	search.placeList.sort(function(a, b) {
		return a.rank - b.rank;
	})

	search.unreturnedPlaces = [];
	for (i = 0; i < search.placeList.length; i++) {
		search.unreturnedPlaces.push(new google.maps.LatLng(search.placeList[i].location.k, search.placeList[i].location.B));
	}

	callDistanceMatrix();
}


function callDistanceMatrix() {
	// Distance matrix request to calculate the time and distance
	// of each place from the start and to the end points. These values are
	// used to calculate the added time the new waypoint adds to the user's 
	// original route.
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
					returnTopTen(route, requestList);
				}
			});
		}
	});
}


function processDistancesFromStart (response, requestList) {
	// Stores distance and duration from start point in places object.
	for (var i = 0; i < requestList.length; i++) {
		var distance = response.rows[0].elements[i].distance.value;
		var duration = response.rows[0].elements[i].duration.value;
		search.places[requestList[i]]['duration'] = duration;
		search.places[requestList[i]]['distance'] = distance;
	}
}


function processDistancesToEnd (response, requestList) {
	// Adds distance and duration to end point to distance and duration from 
	// start point, getting the total route distance and duration. This is used
	// to compare new route with waypoint from the user's original route.
	for (var i = 0; i < response.rows.length; i++) {
		var distance = response.rows[i].elements[0].distance.value;
		var duration = response.rows[i].elements[0].duration.value;
		search.places[requestList[i]]['duration'] = search.places[requestList[i]]['duration'] + duration;
		search.places[requestList[i]]['distance'] = search.places[requestList[i]]['distance'] + distance;
	}
}


function returnTopTen (route, requestList) {
	// Sorts results returned from distance matrix request.
	search.sortedPlaces = [];
	for (var i = 0; i < requestList.length; i++) {
		search.sortedPlaces.push([search.places[requestList[i]].duration, search.places[requestList[i]].place.location]);
	}
	search.sortedPlaces.sort(function(a, b) {
		return a[0] - b[0];
	});

	displayTopTen();
}


function displayTopTen () {
	// Checks if there are fewer than 10 results remaining. If so, removes
	// "Get More Results" button from results div.
	if (search.sortedPlaces.length < 10) {
		var maxResult = search.sortedPlaces.length;
		$("#find-more").hide();
	}
	else {
		var maxResult = 10;
		$("#find-more").show();
	}

	// For each of ten places, display in results div and add to map.
	for (var i = 0; i < maxResult; i++) {
		place = search.places[search.sortedPlaces[i][1]].place;
		var durationAdded = Math.ceil((search.sortedPlaces[i][0] - route.initialDuration) / 60);

		if (durationAdded <= 0) {
			$("#list-container")
				.append("<div class='list-item' id='" + place.id + "'><strong>" + place.name + "</strong><br><em>No travel time added.</em></div>");
		}
		else {
			$("#list-container")
				.append("<div class='list-item' id='" + place.id + "'><strong>" + place.name + "</strong><br><em>" + durationAdded + " min added to route.</em></div>");
		}

		displayPlace(place.location, i * 200, place);

	}
}

function displayDirections (place) {
	// When a marker is clicked, this function is called to add the point as a
	// waypoint and show new directions in the control bar.
	var waypoint = new Waypoint(place.location)
	route.waypoints.push(waypoint);

	route.getDirections()
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

				$("#send-to-phone").show();
			},
			function (status) {
				console.log(status);
			}
		);
}

function sendMessage() {
	$.get("/send_to_phone", 
		{'start' : route.start,
		'destination' : route.end,
		'directionsmode' : route.travelMode,
		'message' : 'This is your test message from the website!'},
		function(response) {
			console.log(response);
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

