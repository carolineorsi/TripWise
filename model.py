from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import create_engine
from sqlalchemy import Column, Integer, Float, String, Boolean, Text, and_, or_
from sqlalchemy.orm import sessionmaker, relationship, backref
from sqlalchemy.orm import scoped_session
from sqlalchemy import ForeignKey

engine = create_engine("sqlite:///tripwise.db", echo=False)
session = scoped_session(sessionmaker(bind=engine, autocommit=False, autoflush=False))

Base = declarative_base()
Base.query = session.query_property()


class User(Base):
	__tablename__ = "users"

	id = Column(Integer, primary_key=True)
	email = Column(String(64), nullable=False)
	password = Column(String(64), nullable=False) # Probably need to change this.
	firstname = Column(String(30))
	lastname = Column(String(30))
	phone = Column(String(10))


class Route(Base):
	__tablename__ = "routes"

	id = Column(Integer, primary_key=True)
	name = Column(String(60), nullable=False)
	user_id = Column(Integer, ForeignKey('users.id'))
	start_name = Column(String(250), nullable=False)
	start_lat = Column(Float, nullable=False)
	start_lng = Column(Float, nullable=False)
	end_name = Column(String(250), nullable=False)
	end_lat = Column(Float, nullable=False)
	end_lng = Column(Float, nullable=False)
	travel_mode = Column(String(10))

	# __table_args__ = (CheckConstraint(travel_mode.in_(["driving","biking","walking"])))

	user = relationship("User", backref=backref("users", order_by=id))


class Waypoint(Base):
	__tablename__ = "waypoints"

	id = Column(Integer, primary_key=True)
	name = Column(String(120), nullable=False)
	route_id = Column(Integer, ForeignKey('routes.id'))
	user_id = Column(Integer, ForeignKey('users.id'))
	lat = Column(Float, nullable=False)
	lng = Column(Float, nullable=False)
	google_id = Column(String(60))
	stopnum = Column(Integer)
	stopover = Column(Boolean)

	route = relationship("Route", backref=backref("routes", order_by=id))
	user = relationship("Route", backref=backref("users", order_by=id))


def connect():
	global ENGINE
	global Session

	ENGINE = create_engine("sqlite:///tripwise.db", echo=False)
	Session = sessionmaker(bind=ENGINE)
	return Session()


def main():
	pass


if __name__ == "__main__":
	main()







		