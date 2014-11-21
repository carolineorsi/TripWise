from flask import Flask, request, session, render_template, g, redirect, url_for, flash
from flask import session as flask_session
import jinja2
import os
import model
import map_data
import phone
import users
import json

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
        return "Enter email"
    if password == "":
        # flash("Must enter password.")
        # return redirect(url_for("login"))
        return "Enter password"

    user = model.session.query(model.User).filter_by(email=email).first()

    if user is None:
        # flash("User does not exist.")
        # return redirect(url_for("login"))
        return "No user by that name."
    else:
        # TODO: check password
        flask_session['id'] = user.id
        flask_session['firstname'] = user.firstname
        return user.firstname


# @app.route("/create", methods=["GET"])
# def show_create():
#     return render_template("create.html")


@app.route("/create", methods=["POST"])
def create_account():
    firstname = request.form.get("firstname")
    lastname = request.form.get("lastname")
    email = request.form.get("email").lower() 
    password = request.form.get("password")
    phone = request.form.get("phone").replace(".","").replace("/","")

    new_user = users.create_new_user(firstname, lastname, email, password, phone)

    if new_user:
        flask_session['id'] = new_user.id
        flask_session['firstname'] = new_user.firstname
        return new_user.firstname
    else:
        return "User Exists"



# @app.route("/save", methods=["GET"])
# def show_save():
#     return render_template("save.html")


@app.route("/save", methods=["POST"])
def save_route():
    route = users.save_route_to_db(request.form.get("name"),
                                request.form.get("start"),
                                request.form.get("end"),
                                request.form.get("travel_mode"),
                                flask_session['id'])
    status = users.save_waypoints_to_db(route, request.form.get("places"), flask_session['id'])

    return status


@app.route("/list")
def list_routes():
    route_list = users.get_routes_by_user(flask_session['id'])
    return render_template("list.html", route_list=route_list)



@app.route("/logout")
def logout():
    flask_session.clear()
    return redirect(url_for("index"))




if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, port=port)
