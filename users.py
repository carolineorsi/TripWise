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
		return None
	else:
		new_user = model.User()
		new_user.firstname = firstname
		new_user.lastname = lastname
		new_user.email = email
		new_user.password = password
		new_user.phone = phone
		model.session.add(new_user)
		model.session.commit()
		status = "Success"
		return new_user