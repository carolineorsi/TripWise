$(document).ready(function () {

	initializeMap();

	directionsService = new google.maps.DirectionsService();
	placesService = new google.maps.places.PlacesService(map);

	$("#directions-form").submit(getInitialDirections);	

});

function initializeMap() {
	
	// Set initial map options
	var mapOptions = {
		center: {lat: 37.779372, lng: -122.423356},
		zoom: 13,
		zoomControl: true,
		zoomControlOptions: {
			position: google.maps.ControlPosition.RIGHT_TOP
		},
		panControl: false
	};

	// Create instance of map object, specifying the <div> container and map options
	map = new google.maps.Map(document.getElementById('map-container'), mapOptions);

}