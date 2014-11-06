$(document).ready(function () {

	initializeMap();

	directionsService = new google.maps.DirectionsService();
	placesService = new google.maps.places.PlacesService(map);
	directionsDisplay = new google.maps.DirectionsRenderer();
	directionsDisplay.setMap(map);

	$("#directions-form").submit(findPlaces);	

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