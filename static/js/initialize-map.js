$(document).ready(function () {

	initializeMap();

	directionsService = new google.maps.DirectionsService();
	directionsDisplay = new google.maps.DirectionsRenderer();
	allPlaces = {};
	markersArray = [];
	// allPlacesList = [];
	directionsDisplay.setMap(map);

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

function clearMap(){
	directionsDisplay.setMap(null);
	for (var i = 0; i < markersArray.length; i++) {
		markersArray[i].setMap(null);
	}
	markersArray.length = 0;

}