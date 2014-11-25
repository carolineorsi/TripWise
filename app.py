from flask import Flask, request, session, render_template, g, redirect, url_for, flash, jsonify, make_response
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
    """This is the 'cover' page of the site"""
    if 'id' in session:
        user_status = True
    else:
        user_status = False

    return render_template("directions.html", user_status=user_status)


@app.route("/send_to_phone", methods=["GET"])
def send_to_phone():
    response = {"status": "warning"}

    if 'id' in flask_session:
        user = model.session.query(model.User).filter_by(id=flask_session['id']).first()
        phone_num = user.phone
    else:
        phone_num = request.args.get('phone').replace(".","").replace("-","")

    message = request.args.get('message')
    start = request.args.get('start')
    end = request.args.get('destination')
    places = json.loads(request.args.get('places'))
    directionsmode = request.args.get('directionsmode')

    addresses = [start]
    for i in range(len(places.keys())):
        key = unicode(i)
        addresses.append(places[key])
    addresses.append(end)

    for i in range(len(addresses) - 1):
        url = phone.build_url(addresses[i], addresses[i + 1], directionsmode)
        message = "Leg %d: " % (i + 1)
        phone.send_message(message, url, phone_num)

    response["status"] = "success"
    response["message"] = "Route Sent!"
        
    return jsonify(response)


# @app.route("/login", methods=["GET"])
# def show_login():
#     return render_template("login.html")


@app.route("/login", methods=["POST"])
def login():
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
    # return redirect(url_for("index"))


@app.route("/create", methods=["POST"])
def create_account():
    firstname = request.form.get("firstname").title()
    lastname = request.form.get("lastname").title()
    email = request.form.get("email").lower() 
    password = request.form.get("password")
    phone = request.form.get("phone").replace(".","").replace("-","")

    response = {"status": "warning"}

    if firstname == "":
        response["message"] = "Please enter a first name."
    elif email == "":
        response["message"] = "Please enter an email address."
    elif password == "":
        response["message"] = "Please enter a password."
    else:
        hashed_password = sha256_crypt.encrypt(password)
        new_user = users.create_new_user(firstname, lastname, email, hashed_password, phone)

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


# @app.route("/save", methods=["GET"])
# def show_save():
#     return render_template("save.html")


@app.route("/save", methods=["POST"])
def save_route():
    response = {"status": "warning"}
    if request.form.get("name") == "":
        response["message"] = "Please enter a name for your trip."

    else:
        route = users.save_route_to_db(request.form.get("name"),
                                    request.form.get("start"),
                                    request.form.get("end"),
                                    request.form.get("travel_mode"),
                                    flask_session['id'])
        users.save_waypoints_to_db(route, request.form.get("places"), flask_session['id'])
        response["status"] = "success"
        response["message"] = "Trip has been saved!"

    return jsonify(response)


@app.route("/mytrips")
def list_routes():
    route_list = users.get_routes_by_user(flask_session['id'])
    return render_template("list.html", route_list=route_list)


@app.route("/get_route/<int:route_id>")
def get_route(route_id):
    route = model.session.query(model.Route).filter_by(id=route_id).first()
    # route_data = {}

    # route_data['start'] = route.start
    # route_data['end'] = route.end
    # route_data['travel_mode'] = route.travel_mode
    
    waypoints = []
    waypoint_names = []
    # waypoints = "yo"
    for waypoint in route.waypoints:
        waypoints.append(waypoint.address)
        waypoint_names.append(waypoint.name)

    return render_template("directions.html",
                            start=route.start,
                            end=route.end,
                            travel_mode=route.travel_mode,
                            waypoints=waypoints,
                            waypoint_names=waypoint_names)



@app.route("/logout")
def logout():
    flask_session.clear()
    return redirect(url_for("index"))




if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, port=port)
