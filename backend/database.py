from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 1. Create the database URL (This creates a file called medical.db)
SQLALCHEMY_DATABASE_URL = "sqlite:///./medical.db"

# 2. Create the Engine (The connection)
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# 3. Create the Session (The tool we use to talk to the DB)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. The Base (All our models will inherit from this)
Base = declarative_base()

# Dependency (Helper to open/close the DB for every request)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()