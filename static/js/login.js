$(document).ready(function () {
	$("#login-user-dropdown").submit(handleLogin);
	$("#create-new-user").submit(handleCreate);

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
			$(".logged-in").show();
			$(".logged-out").hide();
			$("#user-firstname").html("<a>Hi " + response + "!</a>");
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