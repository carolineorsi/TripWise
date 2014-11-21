from flask import Flask, request, session, render_template, g, redirect, url_for, flash
from flask import session as flask_session
import jinja2
import os
import model
import map_data
import phone
import users

app = Flask(__name__)
app.secret_key = 'kbegw*^6^Fhjkh'

@app.route("/")
def index():
    """This is the 'cover' page of the site"""
    return render_template("directions.html")


@app.route("/send_to_phone", methods=["GET"])
def send_to_phone():
    message = request.args.get('message')
    saddr = request.args.get('start')
    daddr = request.args.get('destination')
    directionsmode = request.args.get('directionsmode')

    url = phone.build_url(saddr, daddr, directionsmode)
    phone.send_message(message, url)
    return url


# @app.route("/login", methods=["GET"])
# def show_login():
#     return render_template("login.html")


@app.route("/login", methods=["POST"])
def login():
    email = request.form.get("email").lower()
    password = request.form.get("password")

    if email == "":
        # flash("Must enter email address.")
        # return redirect(url_for("login"))
        return "didn't work"
    if password == "":
        # flash("Must enter password.")
        # return redirect(url_for("login"))
        return "didn't work"

    user = model.session.query(model.User).filter_by(email=email).first()

    if user is None:
        # flash("User does not exist.")
        # return redirect(url_for("login"))
        return "didn't work"
    else:
        # TODO: check password
        flask_session['id'] = user.id
        flask_session['firstname'] = user.firstname
        print flask_session['firstname']
        return "done"


# @app.route("/create", methods=["GET"])
# def show_create():
#     return render_template("create.html")


@app.route("/create", methods=["POST"])
def create_account():
    firstname = request.form.get("first-name")
    lastname = request.form.get("last-name")
    email = request.form.get("email").lower()
    password = request.form.get("password")
    phone = request.form.get("phone")

    status = users.create_new_user(firstname, lastname, email, password, phone)
    if status == "Exists":
        flash("Email already in database.")
        return redirect(url_for("create_account"))
    elif status == "Success":
        flash("New user created. Please log in.")
        return redirect(url_for("login"))


@app.route("/save", methods=["GET"])
def show_save():
    return render_template("save.html")




@app.route("/logout")
def logout():
    flask_session.clear()
    return redirect(url_for("index"))




if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, port=port)
