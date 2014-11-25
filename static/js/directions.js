function findPlaces(evt) {
	event.preventDefault();
	// clearMap();

	if (!route) {
		// Create route object based on user's input.
		route = new Route(
			document.getElementById('start').value,
			document.getElementById('end').value,
			checkTravelMode()
		);
		// $("#start, #end").attr("disabled", "disabled");
	}

	// Create search object based on user's input.
	search = new Search(
		document.getElementById('keyword').value
	);

	// Get initial directions and use returned value to find Places.
	route.getDirections()
		.then(
			function (response) {
				// route.reorderWaypoints(response.routes[0].waypoint_order);
				route.getPolyline(response);
				return search.getSearchPoints(route);
				// TODO: add intermediate button to confirm route and add keyword before calling getPlaces
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

function processPlaces(results) {
	// For each place return, create new Place object and add to allPlaces
	for (var j = 0; j < results.length; j++) {
		
		var placeID = results[j].place_id;
		var name = results[j].name;
		var lat = results[j].geometry.location.k;
		var lng = results[j].geometry.location.B; 
		var location = results[j].geometry.location;
		var latlng = new google.maps.LatLng(lat, lng);

		if (results[j].rating) {
			var rating = results[j].rating;
		}
		else {
			var rating = "Unrated";
		}

		search.places[latlng] = {};
		search.places[latlng]["place"] = new Place(name, placeID, lat, lng, location, rating);

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
	$("#list-container").show();
	$("#start-over-div").show();
	// Checks if there are fewer than 10 results remaining. If so, removes
	// "Get More Results" button from results div.
	if (search.sortedPlaces.length < 10) {
		var maxResult = search.sortedPlaces.length;
		$("#get-more-results").hide();
	}
	else {
		var maxResult = 10;
		$("#get-more-results").show();
	}

	$(".initial-search").hide();

	// For each of ten places, display in results div and add to map.
	for (var i = 0; i < maxResult; i++) {
		place = search.places[search.sortedPlaces[i][1]].place;
		var durationAdded = Math.ceil((search.sortedPlaces[i][0] - route.initialDuration) / 60);

		if (durationAdded <= 0) {
			$("#list-container")
				// .append("<div class='list-item' id='" + place.id + "'><div class='place-desc'><strong>" + place.name + "</strong><br><em>No travel time added.</em></div><button class='btn btn-default select-button' type='button'>Add</button></div>");
				.append("<div class='list-item' id='" + place.id + "'><strong>" + place.name + "</strong><br><em>No travel time added.</em></div>");
		}
		else {
			$("#list-container")
				// .append("<div class='list-item' id='" + place.id + "'><div class='place-desc'><strong>" + place.name + "</strong><br><em>" + durationAdded + " min added to route.</em></div><button class='btn btn-default select-button' type='button'>Add</button></div>");
				.append("<div class='list-item' id='" + place.id + "'><strong>" + place.name + "</strong><br><em>" + durationAdded + " min added to route.</em></div>");
		}

		displayPlace(place.location, i * 100, place);

	}
}

function displayDirections () {
	// This function is called to show new directions in the control bar.

	route.getDirections()
		.then(
			function (response) {
				$("#list-container").empty();
				$("#directions").empty();
				$("#get-more-results").hide();
				$("#directions").append("<h4>Directions</h4>");
				$("#directions").append("<div class='waypoint'><h5>A: " + route.start + "</h5></div>");

				var alpha = "BCDEFGHIJKLMNOPQRSTUVWYXZ"

				var legs = response.routes[0].legs;
				for (var i = 0; i < legs.length; i++) {

					var steps = response.routes[0].legs[i].steps;
					for (var j = 0; j < steps.length; j++) {
						$("#directions").append("<div class=step-instructions>" + (j + 1) + ") " + steps[j].instructions + "</div>");
					}

					if (i < route.places.length) {
						$("#directions").append("<div class='waypoint' id=dir-" + route.places[i].id + "><h5>" + alpha[i] + ": " + route.places[i].name + "</h5></div>");
					}
					else {
						$("#directions").append("<div class='waypoint'><h5>" + alpha[i] + ": " + route.end +"</h5></div>");
					}
				}

				$("#directions-todo").show();
			},
			function (status) {
				console.log(status);
			}
		);
}

function sendMessage(user_phone) {
	// TODO: send waypoints to create link to/from waypoints instead of route start and end.
	var places = {};
	for (var i = 0; i < route.places.length; i++) {
		places[i] = route.places[i].address;
	}

	var route_data = {'start' : route.start,
		'destination' : route.end,
		'directionsmode' : route.travelMode,
		'places': JSON.stringify(places)}

	if (user_phone) {
		route_data['phone'] = user_phone;	
	}

	$.get("/send_to_phone", 
		route_data,
		function(response) {
				displayResultStatus(response.status, response.message, "#phone-sent");
		}
	);
}

function checkLoggedIn() {
	if (loggedIn == "True") {
		sendMessage(null);
	}
	else {
		$(".phone-loggedin").toggle();
		$("#phone-loggedout").toggle();
		$("#send-loggedout").click(function() {
			user_phone = $("#phone-input").val();
			sendMessage(user_phone);
		});
	}
}

function addStop() {
	removeMarkers();
	$("#list-container").empty().removeClass("text-alert");
	$("#directions").empty().removeClass("text-alert");
	$("#directions-todo").hide();

	$("#get-more-results").hide();
}


function rebuildSavedRoute() {
	var savedStart = $("#route_start_from_server").text();
	var savedEnd = $("#route_end_from_server").text();
	var savedTravelMode = $("#route_travelmode_from_server").text();
	var savedWaypoints = $("#route_waypointlist_from_server").text().replace("[u'", "").replace("']", "").split("', u'");
	var savedWaypointNames = $("#route_waypointnames_from_server").text().replace("[u'", "").replace("']", "").split("', u'");

	route = new Route(savedStart, savedEnd, savedTravelMode);

	for (var i = 0; i < savedWaypoints.length; i++) {
		route.waypoints.push(new Waypoint(savedWaypoints[i]));
		route.places.push(new Waypoint(savedWaypoints[i]));
		route.places[i].name = savedWaypointNames[i];
	}

	displayDirections();
	$(".initial-search").hide();
}

