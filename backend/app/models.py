from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, Float, Numeric, Date

# 1. Define Base here locally to prevent the circular import error
Base = declarative_base()

# 2. Keep your teammate's table definitions
class Donation(Base):
    __tablename__ = "donations"
    donation_id = Column(Integer, primary_key=True, index=True)
    donor_id = Column(String(50))
    candidate_id = Column(String(50))
    amount = Column(Numeric)
    date = Column(Date)
    election_year = Column(Integer)

class Donor(Base):
    __tablename__ = "donors"
    # Use the teammate's schema but ensure the primary key is clear
    donor_id = Column(String(50), primary_key=True, index=True)
    name = Column(String(255))
    type = Column(String(50))
    industry = Column(String(100))
    home_county = Column(String(100))
    tier = Column(Integer)

class Candidate(Base):
    __tablename__ = "candidates"
    candidate_id = Column(String(50), primary_key=True, index=True)
    full_name = Column(String(255))
    party = Column(String(100))
    position = Column(String(100))
    county = Column(String(100))
    election_year = Column(Integer)

# ... Keep the County, ElectionCycle, and SimulationParameter classes as they were