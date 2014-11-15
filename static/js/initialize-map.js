$(document).ready(function () {
	initializeMap();

	// When "Get Current Location" checked, calls geolocation API
	$("#geolocation").on('click', function() {
		getLocation();
	});

	// Call jQuery Geocomplete to add autocomplete to start and end fields
	$("#start, #end").geocomplete({details: "form"});

	// Instantiate Google Directions API
	directionsService = new google.maps.DirectionsService();
	directionsDisplay = new google.maps.DirectionsRenderer();
	markersArray = [];

	// When form submitted, initiates Place search
	$("#directions-form").submit(function() {
		findPlaces()
	});

	// When "Get More Results" button clicked, calls function to get next
	// ten results
	$("#get-more-results").on('click', function() {
		callDistanceMatrix();
	});

	// When "Clear Map" button clicked, clears search form, map, route and
	// search objects, results list and directions.
	$("#reset").on('click', function() {
		clearMap();
	});
});

function getLocation() {
	// Checks for geolocation capabilities, gets location, and calls function
	// to set the location in start field.
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(setAsStart);
    } 
    else { 
        alert("Geolocation is not supported by this browser.");
    }
}

function setAsStart(position) {
	// Takes position from geolocation API and reverse geocodes the 
	// lat and lng to populate the "start" field with an address.
	var geocoder = new google.maps.Geocoder();
	var latlng = new google.maps.LatLng(
		position.coords.latitude,
		position.coords.longitude);
	geocoder.geocode( 
		{'latLng' : latlng}, 
		function (response, status) {
			document.getElementById("start").value = (response[0].formatted_address);
		});
}


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
	// Clears directions and markers from map, empties control bar results,
	// and clears search object.
	directionsDisplay.setMap(null);
	for (var i = 0; i < markersArray.length; i++) {
		markersArray[i].setMap(null);
	}
	markersArray.length = 0;
	$("#list-container").empty().removeClass("text-alert");
	$("#directions").empty().removeClass("text-alert");
	search = null;

	$("#find-more").hide();
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
	// Creates and sets marker object for each place.
	inactive = "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=|8AB8E6";
	active = "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=|2E3D4C";

	// Sets timeout to stagger animation of pin drops.
	setTimeout ( function() {
		var marker = new google.maps.Marker({
			position: location,
			animation: google.maps.Animation.DROP,
			map: map,
			icon: inactive
		});

		// Adds marker to global marker array and adds to associated place object.
		markersArray.push(marker);
		place.marker = marker;

		// Add info window to each marker.
		addInfoWindow(marker, place);

		// When marker clicked, directions are updated with marker location/place as waypoint
		google.maps.event.addListener(marker, 'click', function(evt) {
			displayDirections(place);
		});

		handleListHover(place, marker);
	}, delay);
}

function handleListHover(place, marker) {
	// When mouse hovers on list item, changes marker properties to highlight associated marker.
	$("#"+place.id)
		.mouseenter(function () {
			// marker.setAnimation(google.maps.Animation.BOUNCE);
			toggleIcon(marker);
			$(this).css({"background-color": "#EEE"});
		})
		.mouseleave(function () {
			// marker.setAnimation(null);
			toggleIcon(marker);
			$(this).css({"background-color": "transparent"});
		});
}

function addInfoWindow (marker, place) {
	// Create infowindow and open on marker hover.
	var contentString = place.name;
	var infoWindow = new google.maps.InfoWindow({
		content: contentString
	});

	google.maps.event.addListener(marker, 'mouseover', function(evt) {
		infoWindow.open(map, marker);
		toggleIcon(marker);
		$("#"+place.id).css({"background-color": "#EEE"});
	});

	google.maps.event.addListener(marker, 'mouseout', function(evt) {
		infoWindow.close(map, marker);
		toggleIcon(marker);
		$("#"+place.id).css({"background-color": "transparent"});
	});
}

function toggleIcon (marker) {
	// Change marker icon (highlight effect)
	if (marker.icon == inactive) {
		marker.setIcon(active);
	}
	else {
		marker.setIcon(inactive);
	}
}
