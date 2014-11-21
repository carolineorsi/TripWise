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
			console.log(response);
			$(".logged-in").show();
			$(".logged-out").hide();
		}
	);
}


function handleCreate(evt) {
	evt.preventDefault();

	var email = $("#email").val();
	var password = $("#password").val();
	var firstname = $("#first-name").val();
	var lastname = $("#last-name").val();
	var phone = $("#phone").val();

	console.log(firstname);

	$.post(
		"/create",
		{'email': email,
		'password': password,
		'firstname': firstname,
		'lastname': lastname,
		'phone': phone},
		function(response) {
			console.log(response);
		}
	);
}