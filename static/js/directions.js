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
			pointsInPolyline = polyline.length;
			increment = Math.ceil(pointsInPolyline / 11);
			var radius = defineRadius(response.routes[0].legs[0].distance.value);

			// For each search point, display it on the map and find places.
			for (var i = increment; i < pointsInPolyline; i = (i + increment)) {
				point = polyline[i];
				displayPoint(point, radius);
				getPlacesByPoint(point, route.keyword, radius);
			}
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
}

function getPlacesByPoint(point, keyword, radius) {

	// Create Places request
	var request = {
		location: point,
		radius: radius,
		rankby: 'distance',
		keyword: keyword
	}

	placesService.nearbySearch(request, function(results, status) {
		if (status == google.maps.places.PlacesServiceStatus.OK) {
			for (var j = 0; j < results.length; j++) {
				
				var placeID = results[j].id;
				var name = results[j].name;
				var lat = results[j].geometry.location.k;
				var lng = results[j].geometry.location.B; 

				allPlaces.placeID = new Place(name, placeID, lat, lng);
				// console.log(allPlaces.placeID);

				var marker = new google.maps.Marker({
					position: results[j].geometry.location,
					map: map
				});
			console.log(allPlaces);

			}
		}
	});
}


function Place(name, id, lat, lng) {
	this.name = name;
	this.id = id;
	this.lat = lat;
	this.lng = lng;
}



// function decodePolyline(polyline) {
// 	var decodePolyline = google.maps.geometry.encoding.decodePath(polyline);
// 	console.log(decodePolyline);
// 	var pointsArray = [];
// 	pointsInPolyline = decodePolyline.length;
// 	for (var i = 0; i < pointsInPolyline; i++) {
// 		latLng = [decodePolyline[i].k, decodePolyline[i].B];
// 		pointsArray.push(latLng);
// 	}
// 	console.log(pointsArray);


// 	$.post("/getplaces", 
// 		 	{'polyline': pointsArray},
// 		  		function(result) {
// 				console.log(result);
// 			});
// }
