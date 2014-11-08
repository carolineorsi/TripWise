function findPlaces(evt) {
	event.preventDefault();

	var route = new Route(
		document.getElementById('start').value,
		document.getElementById('end').value,
		document.getElementById('place').value
	);

	getDirections(route);
}

function Route(start, end, keyword) {
	this.start = start;
	this.end = end;
	this.keyword = keyword;
	// getDirections(this);
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
			directionsDisplay.setDirections(response);

			// Decodes directions polyline and identifies search points and radii
			var polyline = google.maps.geometry.encoding.decodePath(response.routes[0].overview_polyline);
			var initialDuration = response.routes[0].legs[0].duration.value;
			var initialDistance = response.routes[0].legs[0].distance.value;

			var polylineArray = [];

			for (i = 0; i < polyline.length; i++) {
				var latlng = (polyline[i].k + "," + polyline[i].B)
				polylineArray.push(latlng);
			}

			pointsInPolyline = polyline.length;
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
				point = polyline[i];
				displayPoint(point, radius);
				getPlacesByPoint(point, route.keyword, radius);
				i = (i + increment);
			}

			setTimeout( function () {
				getAddedDistance(route);
			}, 500 );

		}
	});
}

function defineRadius(distance) {
	// Defines radius of search area based on total distance of initial route.
	var radius = distance / 10;
	if (radius > 50000) {
		radius = 50000;
	}
	return radius;
}

function displayPoint(point, radius) {
	// Displays search points for purposes of testing.
	var circle = {
			fillColor: '#000',
			fillOpacity: 0.5,
			strokeWeight: 0.3,
			map: map,
			center: point,
			radius: radius
		}
	pointRadius = new google.maps.Circle(circle);
	markersArray.push(circle);	
}

function getPlacesByPoint(point, keyword, radius) {
	var placesService = new google.maps.places.PlacesService(map);

	// Create Places request
	var request = {
		location: point,
		radius: radius,
		rankby: 'distance',
		keyword: keyword
	}

	// Make places request. 
	placesService.nearbySearch(request, processPlaces);
}


function processPlaces(results, status) {
	// For each place return, create new Place object and add  to allPlaces
	if (status == google.maps.places.PlacesServiceStatus.OK) {
		for (var j = 0; j < results.length; j++) {
			
			var placeID = results[j].place_id;
			var name = results[j].name;
			var lat = results[j].geometry.location.k;
			var lng = results[j].geometry.location.B; 
			var location = results[j].geometry.location
			var latlng = new google.maps.LatLng(lat, lng)

			allPlaces[latlng] = {};
			allPlaces[latlng]["place"] = new Place(name, placeID, lat, lng, location);

			// displayPlace(results[j].geometry.location);
		}
	}
}

function displayPlace(location) {
	// Displays marker on map for purposes of testing
	var marker = new google.maps.Marker({
		position: location,
		map: map
	});
	markersArray.push(marker);	
}

function Place(name, id, lat, lng, location) {
	this.name = name;
	this.id = id;
	this.lat = lat;
	this.lng = lng;
	this.location = location;
}

function getAddedDistance(route) {

	var service = new google.maps.DistanceMatrixService();
	
	placeList = [];
	$.each(allPlaces, function(latlng, Place) {
		placeList.push(latlng);
	});

	// var numPlaces = placeList.length;
	
	// // Limits requests to Distance Matrix to 25 items per API quotas
	// for (var i = 0; i < Math.ceil(numPlaces / 25); i++) {
	// 	var requestList = [];
	// 	if (placeList.length >= 25) {
	// 		for (var j = 0; j < 25 || placeList.length == 0; j++) {
	// 			var item = placeList.pop();
	// 			requestList.push(item);
	// 		}
	// 	}
	// 	else {
	// 		requestList = placeList;
	// 	}
	
	// 	var request = {
	// 		origins: [route.start],
	// 		destinations: requestList,
	// 		travelMode: google.maps.TravelMode.DRIVING
	// 	}

	// 	service.getDistanceMatrix(request, function(response, status) {
	// 		processDistances(response, status, requestList);
	// 	});

	// }

	var request = {
		origins: [route.start],
		// API only allows 25 places per call
		destinations: placeList.slice(0,25),
		travelMode: google.maps.TravelMode.DRIVING
	}

	service.getDistanceMatrix(request, function(response, status) {
		processDistancesFromStart(response, status, placeList);
	});

	var request = {
		origins: placeList.slice(0,25),
		destinations: [route.end],
		travelMode: google.maps.TravelMode.DRIVING
	}

	setTimeout(function() {
		service.getDistanceMatrix(request, function(response, status) {
			processDistancesToEnd(response, status, placeList);
		});
	}, 500);

	setTimeout(function() {
		returnTopTen(route, placeList.slice(0,25));
	}, 1000);

}

function processDistancesFromStart (response, status, requestList) {

	if (status == google.maps.DistanceMatrixStatus.OK) {
		for (var i = 0; i < response.rows[0].elements.length; i++) {
			var distance = response.rows[0].elements[i].distance.value;
			var duration = response.rows[0].elements[i].duration.value;
			allPlaces[requestList[i]]['duration'] = duration;
			allPlaces[requestList[i]]['distance'] = distance;
			// console.log(allPlaces[requestList[i]]);
		}
	}
}

function processDistancesToEnd (response, status, requestList) {

	if (status == google.maps.DistanceMatrixStatus.OK) {
		for (var i = 0; i < response.rows.length; i++) {
			var distance = response.rows[i].elements[0].distance.value;
			var duration = response.rows[i].elements[0].duration.value;
			allPlaces[requestList[i]]['duration'] = allPlaces[requestList[i]]['duration'] + duration;
			allPlaces[requestList[i]]['distance'] = allPlaces[requestList[i]]['distance'] + distance;
			// console.log(allPlaces[requestList[i]]);
		}
	}
}

function returnTopTen (route, placeList) {
	var sortedPlaces = [];
	for (var i = 0; i < placeList.length; i++) {
		sortedPlaces.push([allPlaces[placeList[i]].duration, allPlaces[placeList[i]].place.location, placeList[i]]);
	}
	sortedPlaces.sort();

	displayTopTen(sortedPlaces);
}

function displayTopTen (sortedPlaces) {
	for (var i = 0; i < 10; i++) {
		// console.log(sortedPlaces[i][1]);
		displayPlace(sortedPlaces[i][1]);
		$("#place-list").append("<li>" + allPlaces[sortedPlaces[i][2]].place.name + "</li>");
	}
}