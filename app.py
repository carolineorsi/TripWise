from flask import Flask, request, session, render_template, g, redirect
from flask import url_for, flash, jsonify, make_response
from flask import session as flask_session
from passlib.hash import sha256_crypt
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
    """ This is the 'cover' page of the site """

    if 'id' in session:
        user_status = True
    else:
        user_status = False

    return render_template("directions.html", user_status=user_status)


@app.route("/send_to_phone", methods=["GET"])
def send_to_phone():
    """ Takes and processes data to send to cell phone. """

    response = {"status": "warning"}

    if 'id' in flask_session:
        user = (model.session.query(model.User)
                .filter_by(id=flask_session['id'])
                .first())
        phone_num = user.phone
    else:
        phone_num = (request.args.get('phone')
                            .replace(".", "")
                            .replace("-", "")
                            .replace("(", "")
                            .replace(")", ""))
        if not phone.validate_phone(phone_num):
            response["message"] = "Not a valid phone number"
            return jsonify(response)

    start = request.args.get('start')
    end = request.args.get('end')
    places = json.loads(request.args.get('places'))
    directionsmode = request.args.get('directionsmode')

    addresses = [start]
    for i in range(len(places.keys())):
        addresses.append(places[unicode(i)])
    addresses.append(end)

    for i in range(len(addresses) - 1):
        url = phone.build_url(addresses[i], addresses[i + 1], directionsmode)
        message = "Leg %d: " % (i + 1)
        twilio_response = phone.send_message(message, url, phone_num)

    if twilio_response == "success":
        response["status"] = "success"
        response["message"] = "Route Sent!"
    else:
        response["message"] = ("Message not sent. "
                               "Please confirm the phone number.")

    return jsonify(response)


@app.route("/login", methods=["POST"])
def login():
    """ Logs user into session and returns user data and success message. """

    email = request.form.get("email").lower()
    response = {"status": "warning"}
    if email == "":
        response["message"] = "Please enter an email address."

    else:
        user = model.session.query(model.User).filter_by(email=email).first()

        if user is None:
            response["message"] = "There is no user with that email address."

        elif sha256_crypt.verify(request.form.get("password"), user.password):
            flask_session['id'] = user.id
            flask_session['firstname'] = user.firstname
            response["status"] = "success"
            response["message"] = "Welcome back!"
            response["firstname"] = user.firstname
            response["user"] = user.id
        else:
            response["message"] = "Invalid password."

    return jsonify(response)


@app.route("/create", methods=["POST"])
def create_account():
    """ Creates new user account and saves to database. """

    firstname = request.form.get("firstname").title()
    lastname = request.form.get("lastname").title()
    email = request.form.get("email").lower()
    password = request.form.get("password")
    phone_num = (request.form.get("phone")
                 .replace(".", "")
                 .replace("-", "")
                 .replace("(", "")
                 .replace(")", ""))

    response = {"status": "warning"}

    if firstname == "":
        response["message"] = "Please enter a first name."
    elif email == "":
        response["message"] = "Please enter an email address."
    elif password == "":
        response["message"] = "Please enter a password."
    elif not phone.validate_phone(phone_num):
        response["message"] = "Not a valid phone number."
    else:
        hashed_password = sha256_crypt.encrypt(password)
        new_user = users.create_new_user(firstname,
                                         lastname,
                                         email,
                                         hashed_password,
                                         phone_num)

        if new_user:
            response["status"] = "success"
            response["message"] = "Account created!"
            response["firstname"] = new_user.firstname
            response["user"] = new_user.id
            flask_session['id'] = new_user.id
            flask_session['firstname'] = new_user.firstname
        else:
            response["message"] = "User with that email already exists."

    return jsonify(response)


@app.route("/save", methods=["POST"])
def save_route():
    """ Saves user route to database. """

    response = {"status": "warning"}
    if request.form.get("name") == "":
        response["message"] = "Please enter a name for your trip."

    else:
        route = users.save_route_to_db(request.form.get("name"),
                                       request.form.get("start"),
                                       request.form.get("end"),
                                       request.form.get("travel_mode"),
                                       flask_session['id'])
        users.save_waypoints_to_db(route,
                                   request.form.get("places"),
                                   flask_session['id'])
        response["status"] = "success"
        response["message"] = "Trip has been saved!"

    return jsonify(response)


@app.route("/mytrips")
def list_routes():
    """ Queries database for routes saved by logged in user
    and returns route data. """

    route_list = users.get_routes_by_user(flask_session['id'])
    response = {}
    routes_to_return = []

    for route in route_list:
        route_data = {}
        route_data['id'] = route.id
        route_data['name'] = route.name
        route_data['start'] = route.start
        route_data['end'] = route.end
        route_data['waypoints'] = []

        for waypoint in route.waypoints:
            route_data['waypoints'].append(waypoint.name)

        routes_to_return.append(route_data)

    response['object'] = routes_to_return

    return jsonify(response)


@app.route("/get_route")
def get_route():
    """ Queries database for a saved route and returns route data """

    route_id = request.args.get("route_id")
    route = model.session.query(model.Route).filter_by(id=route_id).first()

    route_data = {}
    route_data['start'] = route.start
    route_data['end'] = route.end
    route_data['travel_mode'] = route.travel_mode
    route_data['waypoints'] = []
    route_data['waypoint_names'] = []

    for waypoint in route.waypoints:
        route_data['waypoints'].append(waypoint.address)
        route_data['waypoint_names'].append(waypoint.name)

    return jsonify(route_data)


@app.route("/logout")
def logout():
    """ Logs user out of session. """
    flask_session.clear()
    return redirect(url_for("index"))


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, port=port)
