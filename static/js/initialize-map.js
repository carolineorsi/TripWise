$(document).ready(function () {

	initializeMap();

	directionsService = new google.maps.DirectionsService();
	directionsDisplay = new google.maps.DirectionsRenderer();
	allPlaces = {};
	markersArray = [];
	// allPlacesList = [];

	$("#directions-form").submit(function(){
		findPlaces();
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
	$("#place-list").empty();
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


function displayPlace(location, delay) {
	// Displays marker on map for purposes of testing
	setTimeout ( function() {
		var marker = new google.maps.Marker({
			position: location,
			animation: google.maps.Animation.DROP,
			map: map
		});
		markersArray.push(marker);
	}, delay);	
}