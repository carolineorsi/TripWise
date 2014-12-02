$(document).ready(function () {
  $('#login-user-dropdown').submit(handleLogin);
  $('#create-new-user').submit(handleCreate);
  $('#save-route').submit(handleSaveRoute);

  $('#my-trips-link').click(function() {
    if ($('#route-popup').css('display') == 'none') {
      getSavedTrips();
    }
    else {
      $('#route-popup').hide();
    }
  });

  $('#logout').click(function() {
    $('.logged-in').hide();
    $('.logged-out').show();
  });
});


function handleLogin(evt) {
  // Sends AJAX GET request to server to log in the user.

  evt.preventDefault();

  $.post(
    '/login',
    {
      'email': $('#email').val(),
      'password': $('#password').val()
    },
    function(response) {
      displayResultStatus(response.status, response.message, '#sent-login');
      if (response.status == 'success') {
        setTimeout(function(){
          $('.logged-in').show();
          $('.logged-out').hide();
          $('#user-firstname').html('<a>Hi ' + response.firstname + '!</a>');
          loggedIn = 'True';
        }, 1000);
      }
    }
  );
};


function handleCreate(evt) {
  // Sends AJAX POST request to server to create a new user account.

  evt.preventDefault();
  $('#login-alert').html('');

  $.post(
    '/create',
    {
      'email': $('#new-email').val(),
      'password': $('#new-password').val(),
      'firstname': $('#first-name').val(),
      'lastname': $('#last-name').val(),
      'phone': $('#phone').val()
    },
    function(response) {
      displayResultStatus(response.status, response.message, '#sent-create');
      if (response.status == 'success') {
        user = response.user
        setTimeout(function(){
          $('.logged-in').show();
          $('.logged-out').hide();
          $('#user-firstname').html('<a>Hi ' + response.firstname + '!</a>');
        }, 1000);
        var loggedIn = $('#logged-status').text();
      }
    }
  );
};

function handleSaveRoute(evt) {
  // Sends AJAX POST request to create a new trip in the database.

  evt.preventDefault();

  if (route == null) {
    displayResultStatus('warning',
                        'No trip to save. Please start your search.',
                        '#sent-save');
  }
  else {
    var name = $('#route-name').val();

    var places = {};
    for (var i = 0; i < route.places.length; i++) {
      places[i] = {
        'name': route.places[i].name,
        'address': route.places[i].address,
        'id': route.places[i].id,
        'lat': route.places[i].lat,
        'lng': route.places[i].lng,
        'stopover': true
      };
    }

    $.post(
      '/save',
      {'name': name,
      'start': route.start,
      'end': route.end,
      'travel_mode': route.travelMode,
      'places': JSON.stringify(places)},
      function(response){
        displayResultStatus(response.status, response.message, '#sent-save');
        if (response.status == 'success') {
          $('#route-name').val('');
        }
      }
    );
  }
};


function displayResultStatus(status, resultMsg, alertID) {
  /* Checks status message in server side responses and pops up alert
  box as appropriate. */

  if (status == 'warning') {
    $(alertID).removeClass('alert-success');
    $(alertID).addClass('alert-warning');
  }
  else if (status == 'success') {
    $(alertID).removeClass('alert-warning');
    $(alertID).addClass('alert-success');
  }

    var notificationArea = $(alertID);
    notificationArea.text(resultMsg);
    notificationArea.slideDown(function () {
        setTimeout(function() {
            $(alertID).slideUp();
        }, 2000);
    });
};


function getSavedTrips() {
  // Sends AJAX GET request to retrieve user's saved trip data.

  $('#route-list').empty();
  $.get('/mytrips')
  .done(populateSavedRouteList);
}


function populateSavedRouteList(savedTripList) {
  /*  Takes saved trip data response from the getSavedTrip function and populates
    the saved trip list div with the list and trip details. */

  $('#route-popup').show();

  _.each(savedTripList.object, function(savedTrip) {
    $('#route-list').append(
      '<div id="' + savedTrip.id + '" class="saved-route-list list-group"' +
      'onclick="rebuildSavedRoute(this.id)">' +
        '<a class="list-group-item">' +
          '<h4 class="list-group-item-heading">' + savedTrip.name + '</h4>' +
          '<strong>Start:</strong> <span class="addresses">' + savedTrip.start +
          '</span>' +
          '<p class="list-group-item-text">' +
            '<ol>' +
            '</ol>' +
          '<strong>End:</strong> <span class="addresses">' + savedTrip.end +
          '</span>' +
        '</a>' +
      '</div>'
    );

    _.each(savedTrip.waypoints, function(waypoint, index) {
      $('#' + savedTrip.id + ' ol').append(
        '<li> Stop ' + (index + 1) + ': ' + waypoint + '</li>'
      );

    });
  });
};
