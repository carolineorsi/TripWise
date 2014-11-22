$(document).ready(function () {
	$("#login-user-dropdown").submit(handleLogin);
	$("#create-new-user").submit(handleCreate);
	$("#save-route").submit(handleSaveRoute);

	$("#logout").click(function() {
		$(".logged-in").hide();
		$(".logged-out").show();
	})
});


function handleLogin(evt) {
	evt.preventDefault();

	var email = $("#email").val();
	var password = $("#password").val();

	$.post(
		"/login",
		{'email': email, 'password': password},
		function(response) {
			if (response.status == "warning") {
				$("#sent-result").removeClass("alert-success");
	   			$("#sent-result").addClass("alert-warning");
				displayResultStatus(response.message);
			}
			else if (response.status == "success") {
				$("#sent-result").removeClass("alert-warning");
				$("#sent-result").addClass("alert-success");
				displayResultStatus(response.message);
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

	if (email == "") {
		$("#login-alert").html("Please enter an email address.");
	}
	else if (password == "") {
		$("#login-alert").html("Please enter a password.");
	}
	else if (phone == "") {
		$("#login-alert").html("Please enter a phone number.");
	}
	else {
		$.post(
			"/create",
			{'email': email,
			'password': password,
			'firstname': firstname,
			'lastname': lastname,
			'phone': phone},
			function(response) {
				if (response == "User Exists") {
					$("#login-alert").html("User with that email already exists.");
				}
				else {
					alert("User added!")
					$(".logged-in").show();
					$(".logged-out").hide();
					$("#user-firstname").html("<a>Hi " + response + "!</a>");
				}
			}
		);
	} 
}

function handleSaveRoute(evt) {
	evt.preventDefault();

	// TODO: Handle case where route hasn't been defined yet.
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
			if (response == "Success") {
				alert("Your route has been added!");
			}
			else {
				console.log(response);
			}
		}
	);

}

function displayResultStatus(resultMsg) {
    var notificationArea = $("#sent-result");
    notificationArea.text(resultMsg);
    notificationArea.slideDown(function () {
        setTimeout(function() {
            $(this).slideUp();
        }, 2000);
    });
}



