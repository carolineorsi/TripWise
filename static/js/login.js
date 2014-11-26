$(document).ready(function () {
	$("#login-user-dropdown").submit(handleLogin);
	$("#create-new-user").submit(handleCreate);
	$("#save-route").submit(handleSaveRoute);
	// $("#my-trips-link").on('mouseenter', showSavedTrips).on('mouseleave', function() {

	// });

	$("#my-trips-link").click(function() {
		if ($("#route-popup").css('display') == 'none') {
			showSavedTrips();
		}
		else {
			$("#route-popup").hide();
		}
	});

	$("#logout").click(function() {
		$(".logged-in").hide();
		$(".logged-out").show();
	});
});


function handleLogin(evt) {
	evt.preventDefault();

	var email = $("#email").val();
	var password = $("#password").val();

	$.post(
		"/login",
		{'email': email, 'password': password},
		function(response) {
			displayResultStatus(response.status, response.message, "#sent-login");
			if (response.status == "success") {
				setTimeout(function(){ 
					$(".logged-in").show();
					$(".logged-out").hide();
					$("#user-firstname").html("<a>Hi " + response.firstname + "!</a>");
					loggedIn = "True";
				}, 1000);
			}
		}
	);
}


function handleCreate(evt) {
	evt.preventDefault();
	$("#login-alert").html("");

	var email = $("#new-email").val();
	var password = $("#new-password").val();
	var firstname = $("#first-name").val();
	var lastname = $("#last-name").val();
	var phone = $("#phone").val();

	$.post(
		"/create",
		{'email': email,
		'password': password,
		'firstname': firstname,
		'lastname': lastname,
		'phone': phone},
		function(response) {
			displayResultStatus(response.status, response.message, "#sent-create");
			if (response.status == "success") {
				user = response.user
				setTimeout(function(){ 
					$(".logged-in").show();
					$(".logged-out").hide();
					$("#user-firstname").html("<a>Hi " + response.firstname + "!</a>");
				}, 1000);
				var loggedIn = $("#logged-status").text();
			}
		}
	);
}

function handleSaveRoute(evt) {
	evt.preventDefault();

	if (route == null) {
		displayResultStatus("warning", "No trip to save. Please start your search.", "#sent-save");
	}
	else {
		var name = $("#route-name").val();

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
			"/save",
			{'name': name,
			'start': route.start,
			'end': route.end,
			'travel_mode': route.travelMode,
			'places': JSON.stringify(places)},
			function(response){
				displayResultStatus(response.status, response.message, "#sent-save");
			}
		);
	}
}


function displayResultStatus(status, resultMsg, alertID) {
	if (status == "warning") {
		$(alertID).removeClass("alert-success");
		$(alertID).addClass("alert-warning");
	}
	else if (status == "success") {
		$(alertID).removeClass("alert-warning");
		$(alertID).addClass("alert-success");
	}

    var notificationArea = $(alertID);
    notificationArea.text(resultMsg);
    notificationArea.slideDown(function () {
        setTimeout(function() {
            $(alertID).slideUp();
        }, 2000);
    });
}


function selectFromList() {
	$(".saved-route-list").on('hover', function() {
		$(this).css({"background-color":"lightblue"});
	});
	$(".saved-route-list").on('click', function() {
		$(this).html("Selected");
	});
}

function showSavedTrips() {
	$("#route-list").empty();
	$.get("/mytrips",
		function(response) {
			$("#route-popup").show();
			for (var i = 0; i < response.object.length; i++) {
				$("#route-list").append(
					"<div id='" + response.object[i].id + "' class='saved-route-list list-group' onclick='rebuildSavedRoute(this.id)'>" +
						// "<a href='/get_route/" + response.object[i].id + "' class='list-group-item'>" +
						"<a class='list-group-item'>" +
							"<h4 class='list-group-item-heading'>" + response.object[i].name + "</h4>" +
							"<strong>Start:</strong> <span class='addresses'>" + response.object[i].start + "</span>" +
							"<p class='list-group-item-text'>" +
								"<ol>" +
								"</ol>" +
							"<strong>End:</strong> <span class='addresses'>" + response.object[i].end + "</span>" +
						"</a>" +
					"</div>"
				);

				for (var j = 0; j < response.object[i].waypoints.length; j++) {
					$("#" + response.object[i].id + " ol").append(
						"<li> Stop " + (j + 1) + ": " + response.object[i].waypoints[j] + "</li>"
					);
				}
			}
		}
	);
}


