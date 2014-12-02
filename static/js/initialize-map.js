$(document).ready(function() {
  initializeMap();

  // Checks for login status from jinja template.
  loggedIn = $('#logged-status').text();

  // When "Get Current Location" is checked, calls geolocation API
  // Note: not currently used.
  $('#geolocation').on('click', getLocation);

  // Calls jQuery Geocomplete to add autocomplete to start and end fields
  $('#start, #end').geocomplete({details: 'form'});

  // Instantiates Google Directions API and declares global variables.
  directionsService = new google.maps.DirectionsService();
  directionsDisplay = new google.maps.DirectionsRenderer({draggable: true});
  markersArray = [];
  route = null;

  // When form submitted, initiates Place search
  $('#directions-form').submit(function(event) {
    event.preventDefault();
    findPlaces();
  });

  // Handles button clicks
  $('#send-button').click(checkLoggedIn);
  
  // Resets search bar based on button clicks.
  $('#add-stop, #revise-search').click(function() {
    $('#start, #end, #driving, #biking, #walking').attr('disabled', 'disabled');
    clearMap();
  });
  
  $('#reset').click(function() {
    clearMap();
    clearSearch();
  });

  // Checks for route data from Jinja template and calls rebuild function
  // if there is a saved route from the server.
  if ($('#route_start_from_server').text() != '') {
    rebuildSavedRoute();
  };

});


function initializeMap() {
  // Sets initial map options
  var mapOptions = {
    center: {lat: 37.779372, lng: -122.423356},
    zoom: 12,
    zoomControl: true,
    zoomControlOptions: {
      position: google.maps.ControlPosition.RIGHT_TOP
    },
    panControl: false
  };

  /* Creates instance of map object, specifying the <div> container
  and map options */
  map = new google.maps.Map(document.getElementById('map-container'),
                            mapOptions);
};


function clearMap(){
  // Clears markers from map and resets search bar.

  removeMarkers();
  $('#list-container, #directions').empty().removeClass('text-alert');
  $('#directions-todo, #phone-loggedout, #get-more-results').hide();
  $('.initial-search').show();
};


function clearSearch() {
  // Clears directions and resets search and route objects.

  directionsDisplay.setMap(null);
  search = null;
  route = null;
  $('#start, #end, #keyword, #driving, #biking, #walking')
    .removeAttr('disabled')
    .val('');
  $('#start-over-div').hide();
};


function removeMarkers() {
  // Removes all marker objects displayed on map.

  for (var i = 0; i < markersArray.length; i++) {
    markersArray[i].setMap(null);
  }
  markersArray.length = 0;
};


function displaySearchPoint(point, radius) {
  // Displays search bubbles for purposes of testing.

  var circle = {
      fillColor: '#000',
      fillOpacity: 0.3,
      strokeWeight: 0.0,
      map: map,
      center: point,
      radius: radius
    };
  pointRadius = new google.maps.Circle(circle);
  markersArray.push(pointRadius);
};


function displayPlace(location, delay, place) {
  // Creates and sets marker object for each place.

  inactive = 'http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=|8AB8E6';
  active = 'http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=|2E3D4C';

  // Sets timeout to stagger animation of pin drops.
  setTimeout (function() {
    var marker = new google.maps.Marker({
      position: location,
      animation: google.maps.Animation.DROP,
      map: map,
      icon: inactive
    });

    // Adds marker to global marker array and to associated place object.
    markersArray.push(marker);
    place.marker = marker;

    // Add info window to each marker.
    addInfoWindow(place);

    // On mouseover event, opens info window.
    google.maps.event.addListener(marker, 'mouseover', function(evt) {
      place.infoWindow.open(map, marker);
      marker.setIcon(active);
      $('#'+place.id).css({'background-color': '#EEE'});

      // If place details have not already been populated, calls
      // function that makes request to Google Places API for details
      if (!place.address) {
        populatePlaceDetails(place);
      }

      showStars();
    });

    // When mouse leaves the marker, closes info window
    google.maps.event.addListener(marker, 'mouseout', function(evt) {
      place.infoWindow.close(map, marker);
      marker.setIcon(inactive);
      $('#'+place.id).css({'background-color': 'transparent'});
    });

    /* When marker clicked, updates directions with marker location/place
    as waypoint */
    google.maps.event.addListener(marker, 'click', function(evt) {
      addWaypoint(place);
      displayDirections(place);
      marker.setMap(null);
    });

    handleListHover(place, marker);
  }, delay);
};


function addWaypoint(place) {
  // Creates new Waypoint object and stores in route object

  var waypoint = new Waypoint(place.location);
  route.waypoints.push(waypoint);
  route.places.push(place);
};


function handleListHover(place, marker) {
  /*  When mouse hovers on list item, changes marker properties to highlight
    associated marker. On click, add waypoint to the route and display new
    directions */


  $('#'+place.id)
    .mouseenter(function () {
      marker.setIcon(active);
      $(this).css({'background-color': '#EEE'});

      if (!place.address) {
        populatePlaceDetails(place);
      }

      place.infoWindow.open(map, marker);
      showStars();
    })
    .mouseleave(function () {
      marker.setIcon(inactive);
      $(this).css({'background-color': 'transparent'});
      $('#details-'+place.id).hide();
      place.infoWindow.close(map, marker);
    })
    .click(function() {
      addWaypoint(place);
      displayDirections(place);
      place.marker.setMap(null);
    });
}

function populatePlaceDetails(place) {
  /*  Calls function to retrieve place details and then creates content for
    icon infowindows. */

  getPlaceDetails(place)
  .then(
    function(response) {
      if (place.website) {
        var content = '<a href=' + place.website + '>' + place.name +
        '</a><br>' + place.phone + '<br>' + place.address +
        '<span class="stars"><span>' + place.rating + '</span></span>';
      }
      else {
        var content = place.name  + '<br>' + place.phone + '<br>' +
        place.address + '<span class="stars"><span>' +
        place.rating + '</span></span>';
      }

      place.infoWindow.setContent(content);
    }
  );
};

function addInfoWindow(place) {
  // Create infowindow and open on marker hover.

  place.infoWindow = new google.maps.InfoWindow(
    { content: '' }
  );
};


function getPlaceDetails(place) {
  // Call to Google Places Detail API

  var deferred = Q.defer();
  var detailService = new google.maps.places.PlacesService(map);
  var request = {
    placeId: place.id
  };

  detailService.getDetails(request, function(response, status) {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
      place.address = response.formatted_address;
      place.phone = response.formatted_phone_number;
      if (response.website) {
        place.website = response.website;
      }

      deferred.resolve(response);
    }
  });

  return deferred.promise;
};

function showStars() {
  // Shows stars div and resizes based on numeric rating.

  $('.stars span')
    .each(function() {
      var val = parseFloat($(this).html());
      if (val > 0 || val < 5) {
        var size = Math.max(0, (Math.min(5, val))) * 16;
        $(this).empty()
          .css({'width' : size, 'display' : 'block'});
      }
      else {
        $(this).html('<strong>Unrated</strong>')
          .css({'background' : 'none', 'margin-left' : 16.5})
          .show();
      }
    });
  $('.stars').show();

}

function getLocation() {
  /*  Checks for geolocation capabilities, gets location, and calls function
    to set the location in start field. */

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(setAsStart);
    }
    else {
        alert('Geolocation is not supported by this browser.');
    }
};

function setAsStart(position) {
  /* Takes position from geolocation API and reverse geocodes the
    lat and lng to populate the "start" field with an address. */

  var geocoder = new google.maps.Geocoder();
  var latlng = new google.maps.LatLng(
    position.coords.latitude,
    position.coords.longitude);
  geocoder.geocode(
    {'latLng' : latlng},
    function (response, status) {
      document.getElementById('start').value = (response[0].formatted_address);
    }
  );
};
