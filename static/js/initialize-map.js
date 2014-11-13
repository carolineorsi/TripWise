$(document).ready(function () {

	initializeMap();

	directionsService = new google.maps.DirectionsService();
	directionsDisplay = new google.maps.DirectionsRenderer();
	markersArray = [];
	counter = null;

	$("#directions-form").submit(function() {
		findPlaces()
	});

	$("#get-more-results").on('click', function() {
		console.log("button clicked");
	});
});


function initializeMap() {
	
	// Set initial map options
	var mapOptions = {
		center: {lat: 37.779372, lng: -122.423356},
		zoom: 14,
		zoomControl: true,
		zoomControlOptions: {
			position: google.maps.ControlPosition.RIGHT_TOP
		},
		panControl: false
	};

	// Create instance of map object, specifying the <div> container and map options
	map = new google.maps.Map(document.getElementById('map-container'), mapOptions);
}


function clearMap(route){
	directionsDisplay.setMap(null);
	for (var i = 0; i < markersArray.length; i++) {
		markersArray[i].setMap(null);
	}
	markersArray.length = 0;
	$("#list-container").empty();
	route = null;
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


function displayPlace(location, delay, place) {
	// Displays marker on map for purposes of testing
	inactive = "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=|4D70B8";
	// active = "//maps.google.com/mapfiles/kml/paddle/blu-blank.png";
	active = "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=|1F2D4A";

	setTimeout ( function() {
		var marker = new google.maps.Marker({
			position: location,
			animation: google.maps.Animation.DROP,
			map: map,
			icon: inactive
		});
		markersArray.push(marker);
		place.marker = marker;

		addInfoWindow(marker, place);

		google.maps.event.addListener(marker, 'click', function(evt) {
			displayDirections(place);
		});
	}, delay);	
}

function addInfoWindow (marker, place) {
	var contentString = place.name;
	var infoWindow = new google.maps.InfoWindow({
		content: contentString
	});
	google.maps.event.addListener(marker, 'mouseover', function(evt) {
		infoWindow.open(map, marker);
		toggleIcon(marker);
	});
	google.maps.event.addListener(marker, 'mouseout', function(evt) {
		infoWindow.close(map, marker);
		toggleIcon(marker);
	});
}

function toggleIcon (marker) {
	if (marker.icon == inactive) {
		marker.setIcon(active);
	}
	else {
		marker.setIcon(inactive);
	}
}
