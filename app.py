from flask import Flask, request, session, render_template, g, redirect, url_for, flash
import jinja2
import os
import model
import map_data

app = Flask(__name__)
app.secret_key = 'kbegw*^6^Fhjkh'

@app.route("/")
def index():
    """This is the 'cover' page of the site"""
    return render_template("index.html")

@app.route("/directions")
def list_directions():
    """Prints out directions from user input"""
    origin = request.args.get("origin")
    destination = request.args.get("destination")

    route = model.Route(origin, destination)
    route.get_directions()


    # Checks that valid results were returned from Google Directions API
    if route.directions['status'] == 'OK':
        direction_steps = []
        for step in route.directions['routes'][0]['legs'][0]['steps']:
            direction_steps.append(step['html_instructions'])
        
        return render_template("test.html", direction_steps=direction_steps)

    else:
        direction_steps = ["It didn't work"]
        return render_template("test.html", direction_steps=direction_steps)


# @app.route("/melon/<int:id>")
# def show_melon(id):
#     """This page shows the details of a given melon, as well as giving an
#     option to buy the melon."""
#     melon = model.get_melon_by_id(id)
#     print melon
#     return render_template("melon_details.html",
#                   display_melon = melon)

# @app.route("/cart")
# def shopping_cart():
#     """TODO: Display the contents of the shopping cart. The shopping cart is a
#     list held in the session that contains all the melons to be added. Check
#     accompanying screenshots for details."""
#     return render_template("cart.html")

# @app.route("/add_to_cart/<int:id>")
# def add_to_cart(id):
#     """TODO: Finish shopping cart functionality using session variables to hold
#     cart list.

#     Intended behavior: when a melon is added to a cart, redirect them to the
#     shopping cart page, while displaying the message
#     "Successfully added to cart" """

#     session["cart"] = {}
#     session["cart"].get(id, 1) + 1
#     print session["cart"]

#     #return "Oops! This needs to be implemented!"


# @app.route("/login", methods=["GET"])
# def show_login():
#     return render_template("login.html")


# @app.route("/login", methods=["POST"])
# def process_login():
#     """TODO: Receive the user's login credentials located in the 'request.form'
#     dictionary, look up the user, and store them in the session."""
#     return "Oops! This needs to be implemented"


# @app.route("/checkout")
# def checkout():
#     """TODO: Implement a payment system. For now, just return them to the main
#     melon listing page."""
#     flash("Sorry! Checkout will be implemented in a future version of ubermelon.")
#     return redirect("/melons")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, port=port)
