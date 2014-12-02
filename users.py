import model
import json


def create_new_user(firstname, lastname, email, password, phone):
    """ Queries db to ensure user does not already exist. If it does
    not, creates new user in db. """

    if model.session.query(model.User).filter_by(email=email).first():
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
    """ Creates new route object and appends to db. """

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

    # Create new place for each item in places
    for stopnum, place in places_dict.iteritems():
        waypoint = model.Waypoint()
        waypoint.name = place['name']
        waypoint.route_id = route.id
        waypoint.user_id = user
        waypoint.lat = place['lat']
        waypoint.lng = place['lng']
        waypoint.google_id = place['id']
        waypoint.stopnum = int(stopnum) + 1
        waypoint.stopover = place['stopover']

        if 'address' in place:
            waypoint.address = place['address']
        else:
            waypoint.address = ""

        model.session.add(waypoint)

    model.session.commit()


def get_routes_by_user(user_id):
    user = model.session.query(model.User).filter_by(id=user_id).first()
    routes = user.routes

    return routes
