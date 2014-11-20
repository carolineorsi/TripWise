$(document).ready(function () {
	$("#login-form").submit(handleLogin);
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
			$("#login").hide();
		}
	);
}