import model

def authenticate_user(email, password):
	# email = email.lower()
	# user = model.session.query(model.User).filter_by(email = email).first()

	# if user is None:
	# 	flash("User does not exist.")
	# 	return redirect(url_for("login"))


	# if email != "blah":
	# 	flash("Invalid email")
	# 	return redirect(url_for("login"))
	pass


def create_new_user(firstname, lastname, email, password, phone):
	if model.session.query(model.User).filter_by(email = email).first() is not None:
		status = "Exists"
	else:
		newUser = model.User()
		newUser.firstname = firstname
		newUser.lastname = lastname
		newUser.email = email
		newUser.password = password
		newUser.phone = phone
		model.session.add(newUser)
		model.session.commit()
		status = "Success"

	return status