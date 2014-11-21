import model
import json

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
		user = model.User()
		user.firstname = firstname
		user.lastname = lastname
		user.email = email
		user.password = password
		user.phone = phone
		model.session.add(user)
		model.session.commit()

		return user


def save_route_to_db(name, start, end, travel_mode, user):

	# Create new route
	route = model.Route()
	route.name = name
	route.user_id = user
	route.start = start
	route.end = end
	route.travel_mode = travel_mode
	model.session.add(route)
	model.session.commit()

	return route


def save_waypoints_to_db(route, places, user):
	places_dict = json.loads(places)
	
	#Create new place for each item in places
	for stopnum, place in places_dict.iteritems():
		waypoint = model.Waypoint()
		waypoint.name = place['name']
		waypoint.address = place['address']
		waypoint.route_id = route.id
		waypoint.user_id = user
		waypoint.lat = place['lat']
		waypoint.lng = place['lng']
		waypoint.google_id = place['id']
		waypoint.stopnum = int(stopnum) + 1
		waypoint.stopover = place['stopover']
		model.session.add(waypoint)

	model.session.commit()
	return "Success"


def get_routes_by_user(user_id):
	user = model.session.query(model.User).filter_by(id=user_id).first()
	routes = user.routes
	for route in routes:
		waypoints = route.waypoints
		print waypoints

