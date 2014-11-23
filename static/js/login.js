$(document).ready(function () {
	$("#login-user-dropdown").submit(handleLogin);
	$("#create-new-user").submit(handleCreate);
	$("#save-route").submit(handleSaveRoute);

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


