function findPlaces(evt) {
	event.preventDefault();
	clearMap();

	route = new Route(
		document.getElementById('start').value,
		document.getElementById('end').value
		// document.getElementById('keyword').value
	);

	search = new Search(
		document.getElementById('keyword').value
	);

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


function rank(place) {
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
	$.each(search.places, function(latlng, Place) {
		search.placeList.push([Place.place.rank, latlng]);
		// placeList.push(latlng);
	});

	search.placeList.sort();

	console.log("got here");
	for (var i = 0; i < search.placeList.length; i++) {
		console.log(search.placeList[i][0]);
	}

	
	var newPlaceList = [];
	for (var i = 0; i < search.placeList.length; i++) {
		newPlaceList.push(search.placeList[i][1]);
	}
	
	return newPlaceList;
}


function getAddedDistance() {
	
	// placeList = buildPlaceList(route);

	search.placeList = [];
	$.each(search.places, function(latlng, Place) {
		// search.placeList.push(latlng);
		search.placeList.push(Place.place);
	});

	search.placeList.sort(function(a, b) {
		return a.rank - b.rank;
	})

	search.unreturnedPlaces = [];
	for (i = 0; i < search.placeList.length; i++) {
		search.unreturnedPlaces.push(new google.maps.LatLng(search.placeList[i].location.k, search.placeList[i].location.B));
	}

	buildRequestList();
}


function buildRequestList() {

	console.log(search.unreturnedPlaces.length);
	requestList = search.unreturnedPlaces.splice(0,10);
	console.log(search.unreturnedPlaces.length);

	callDistanceMatrix(requestList);
}


function callDistanceMatrix(requestList) {
	var distanceAPI = new google.maps.DistanceMatrixService();

	var requestStart = new distanceMatrixRequest([route.start], requestList, google.maps.TravelMode.DRIVING);
	var requestEnd = new distanceMatrixRequest(requestList, [route.end], google.maps.TravelMode.DRIVING);

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


function processDistancesFromStart (response, requestList) {
	for (var i = 0; i < requestList.length; i++) {
		var distance = response.rows[0].elements[i].distance.value;
		var duration = response.rows[0].elements[i].duration.value;
		search.places[requestList[i]]['duration'] = duration;
		search.places[requestList[i]]['distance'] = distance;
	}
}


function processDistancesToEnd (response, requestList) {
	for (var i = 0; i < response.rows.length; i++) {
		var distance = response.rows[i].elements[0].distance.value;
		var duration = response.rows[i].elements[0].duration.value;
		search.places[requestList[i]]['duration'] = search.places[requestList[i]]['duration'] + duration;
		search.places[requestList[i]]['distance'] = search.places[requestList[i]]['distance'] + distance;
	}
}


function returnTopTen (route, requestList) {
	for (var i = 0; i < requestList.length; i++) {
		search.sortedPlaces.push([search.places[requestList[i]].duration, search.places[requestList[i]].place.location, requestList[i]]);
	}
	search.sortedPlaces.sort();

	// TODO: Need to fix the sorting. Sorts alphabetically instead of numerically.

	displayTopTen();
}


function displayTopTen () {
	if (search.sortedPlaces.length < 10) {
		var maxResult = search.sortedPlaces.length;
		$("#find-more").hide();
	}
	else {
		var maxResult = 10;
		$("#find-more").show();
	}

	for (var i = 0; i < maxResult; i++) {
	// for (var i = 0; i < sortedPlaces.length; i++) {
		place = search.places[search.sortedPlaces[i][2]].place;
		displayPlace(place.location, i * 200, place);
		var durationAdded = Math.ceil((search.sortedPlaces[i][0] - route.initialDuration) / 60);

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

