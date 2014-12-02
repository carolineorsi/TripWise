from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import create_engine
from sqlalchemy import Column, Integer, Float, String, Boolean, Text, and_, or_
from sqlalchemy.orm import sessionmaker, relationship, backref
from sqlalchemy.orm import scoped_session
from sqlalchemy import ForeignKey

engine = create_engine("sqlite:///tripwise.db", echo=False)
session = scoped_session(sessionmaker(bind=engine,
                                      autocommit=False,
                                      autoflush=False))

Base = declarative_base()
Base.query = session.query_property()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String(64), nullable=False)
    password = Column(String(64), nullable=False)
    firstname = Column(String(30))
    lastname = Column(String(30))
    phone = Column(String(10))


class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True)
    name = Column(String(60), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'))
    start = Column(String(250), nullable=False)
    end = Column(String(250), nullable=False)
    travel_mode = Column(String(10))

    user = relationship("User", backref=backref("routes", order_by=id))


class Waypoint(Base):
    __tablename__ = "waypoints"

    id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False)
    address = Column(String(250))
    route_id = Column(Integer, ForeignKey('routes.id'))
    user_id = Column(Integer, ForeignKey('users.id'))
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    google_id = Column(String(60))
    stopnum = Column(Integer)
    stopover = Column(Boolean)

    route = relationship("Route", backref=backref("waypoints", order_by=id))
    user = relationship("User", backref=backref("waypoints", order_by=id))


def connect():
    """ Used for connecting and creating the database. """

    global ENGINE
    global Session

    ENGINE = create_engine("sqlite:///tripwise.db", echo=False)
    Session = sessionmaker(bind=ENGINE)
    return Session()


def main():
    pass


if __name__ == "__main__":
    main()
