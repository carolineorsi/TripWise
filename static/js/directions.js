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
					directionsDisplay.setDirections(response);
					getPlaces(this.polyline);
				}
			});
		}
	}

	route.getDirections();
}

function showSteps(directionResult) {
	var myRoute = directionResult.routes[0].legs[0];
	for (var i = 0; i < myRoute.steps.length; i++) {
		$("#instructions-container").append("<li>" + myRoute.steps[i].instructions + "</li>");
	}
}

function getPlaces(polyline) {
	// Decode polyline from Google Directions response:
	var decodedPolyline = google.maps.geometry.encoding.decodePath(polyline);

	for (var i = 0; i < decodedPolyline.length; i++) {
		// var marker = new google.maps.Marker({
		//     position: decodedPolyline[i],
		//     map: map
		// });		
		
		// Create Places request
		var request = {
			location: decodedPolyline[i],
			radius: '500',
			rankby: 'distance',
			keyword: 'coffee'
		}
		
		placesService.nearbySearch(request, function(results, status) {
			if (status == google.maps.places.PlacesServiceStatus.OK) {
				for (var j = 0; j < results.length; j++) {
					console.log(results[j].name, j);
					var marker = new google.maps.Marker({
						position: results[j].geometry.location,
						map: map,
			    		icon: {
			        		path: google.maps.SymbolPath.CIRCLE,
			        		scale: 8.5,
			        		fillColor: "#00F",
			        		fillOpacity: 0.4,
			        		strokeWeight: 0.4
			    		},
					});
				}
			}
		});
	};
}
