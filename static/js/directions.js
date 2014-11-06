function findPlaces(evt) {
	event.preventDefault();

	var route = {
		start: document.getElementById('start').value,
		end: document.getElementById('end').value,
		place: document.getElementById('place').value,
		polyline: "",

		getDirections: function() {
			var request = {
				origin: this.start,
				destination: this.end,
				travelMode: google.maps.TravelMode.DRIVING
			};

			directionsService.route(request, function(response, status) {
				if (status == google.maps.DirectionsStatus.OK) {
					this.polyline = response.routes[0].overview_polyline;
					this.distance = response.routes[0].legs[0].distance.value;
					directionsDisplay.setDirections(response);
					getPlaces(this.polyline, this.place.value, this.distance);
					// decodePolyline(this.polyline);
				}
			});
		}
	};

	route.getDirections();
	printPlaces();
}

// function showSteps(directionResult) {
// 	var myRoute = directionResult.routes[0].legs[0];
// 	for (var i = 0; i < myRoute.steps.length; i++) {
// 		$("#instructions-container").append("<li>" + myRoute.steps[i].instructions + "</li>");
// 	}
// }

// function sleep(milliseconds) {
//   var start = new Date().getTime();
//   for (var i = 0; i < 1e7; i++) {
//     if ((new Date().getTime() - start) > milliseconds){
//       break;
//     }
//   }
// }

function getPlaces(polyline, place, distance) {
	// Decode polyline from Google Directions response:
	var decodedPolyline = google.maps.geometry.encoding.decodePath(polyline);
	placeIDs = [];

	var radius = distance / 10;
	if (radius > 50000) {
		radius = 50000;
	}

	pointsInPolyline = decodedPolyline.length;
	increment = Math.ceil(pointsInPolyline / 11);
	// for (var i = 0; i < pointsInPolyline; i++) {
	for (var i = increment/2; i < pointsInPolyline; i = (i + increment)) {

		// allPlaces.push(getPlacesByPoint(decodedPolyline[i], place, i, radius));
		getPlacesByPoint(decodedPolyline[i], place, i, radius);
		// sleep(400);
		
		var circle = {
			fillColor: '#000',
			fillOpacity: 0.5,
			strokeWeight: 0.3,
			map: map,
			center: decodedPolyline[i],
			radius: radius
		}
		pointRadius = new google.maps.Circle(circle);		
	};
}

function getPlacesByPoint(location, place, i, radius) {

	// Create Places request
	var request = {
		location: location,
		radius: radius,
		rankby: 'distance',
		keyword: place
	}

	placesService.nearbySearch(request, function(results, status) {
		// console.log(status);
		// console.log(i);
		// var placesArray = [];
		if (status == google.maps.places.PlacesServiceStatus.OK) {
			for (var j = 0; j < results.length; j++) {
				// console.log(results[j].name);
				
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
