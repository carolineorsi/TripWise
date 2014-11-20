def authenticate_user(email, password):
	email = email.lower()
    user = model.session.query(model.User).filter_by(email = email).first()

    if user is None:
        flash("User does not exist.")
        return redirect(url_for("login"))


    if email != "blah":
        flash("Invalid email")
        return redirect(url_for("login"))