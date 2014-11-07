from flask import Flask, request, session, render_template, g, redirect, url_for, flash
import jinja2
import os
import model
import map_data
import urllib2
# import test

app = Flask(__name__)
app.secret_key = 'kbegw*^6^Fhjkh'

@app.route("/")
def index():
    """This is the 'cover' page of the site"""
    return render_template("index.html")

@app.route("/javascript")
def js_index():
    return render_template("test_js_directions.html")

@app.route("/getplaces", methods=["GET"])
def get_places():
    start = request.args.get('start')
    end = request.args.get('end')
    keyword = request.args.get('keyword')
    radius = request.args.get('radius')
    initial_duration = request.args.get('initialDuration')
    initial_distance = request.args.get('initialDistance')

    raw_polyline = request.args.get('polyline')
    polyline = optimize_polyline(raw_polyline)

    route = model.Route(start, end, keyword, float(radius), polyline, int(initial_duration), int(initial_distance))
    
    route.get_places()
    find_top_ten(route)

    return "worked"

    # print polyline
    # return "worked"

def optimize_polyline(raw_polyline):
    polyline = raw_polyline[2:-3].split('","')
    polyline_length = len(polyline)
    increment = polyline_length / 10
    new_polyline = []
    for i in range(increment / 2, polyline_length, increment):
        new_polyline.append(polyline[i])
    return new_polyline


def find_top_ten(route):
    destinations = ""
    for latlng, place in route.places.iteritems():
        destinations += latlng + "|"
    
    url = ('https://maps.googleapis.com/maps/api/distancematrix/json?origins=%s'
        '&destinations=%s'
        '&key=%s') % (route.start, destinations[0:-2], model.AUTH_KEY)

    print "**********"
    print url
    print "**********"
    # response = urllib2.urlopen(url)

    # # Get the response and use the JSON library to decode the JSON
    # json_raw = response.read()
    # json_data = json.loads(json_raw)

    # print json_data["status"]


# @app.route("/directions")
# def list_directions():
#     """Prints out directions from user input"""
#     origin = request.args.get("origin")
#     destination = request.args.get("destination")

#     route = model.Route(origin, destination)
#     route.get_directions()


#     # Checks that valid results were returned from Google Directions API
#     if route.directions['status'] == 'OK':
#         direction_steps = []
#         for step in route.directions['routes'][0]['legs'][0]['steps']:
#             direction_steps.append(step['html_instructions'])
        
#         return render_template("test.html", direction_steps=direction_steps, distance=route.distance, duration=route.duration, polyline=route.polyline)

#     else:
#         direction_steps = ["It didn't work"]
#         return render_template("test.html", direction_steps=direction_steps)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, port=port)
