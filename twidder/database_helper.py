import sqlite3
import json
from flask import g, Flask

app = Flask(__name__)

DATABASE = '/home/hakgu806/tddd97/twidder/database.db'

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
    return db

@app.teardown_appcontext
def close_connection(exeption):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def init_db():
    with app.app_context():
        db = get_db()
        with app.open_resource('database.schema', mode='r') as f:
            db.cursor().executescript(f.read())
        db.commit()

@app.cli.command('initdb')
def initdb_command():
    init_db()
    print('Initialized the database.')

def validate_user(email):
    c = get_db()
    res = c.execute("SELECT EXISTS(SELECT 1 FROM users WHERE email = ?)", (email,))
    return res.fetchone()[0]

def validate_password(email, password):
    c = get_db()
    res = c.execute("SELECT EXISTS(SELECT 1 FROM users WHERE email = ? AND password = ?)", (email, password))
    return res.fetchone()[0]

def get_user_data(email):
    c = get_db()
    res = c.execute("SELECT * FROM users WHERE email = ?", (email,))
    return res.fetchone()

def get_user_messages(email):
    c = get_db()
    res = c.execute("SELECT * FROM messages WHERE recieveremail = ?", (email,))
    return res.fetchall()

def add_user(email, password, firstname, familyname, gender, city, country):
    c = get_db()
    c.execute("INSERT INTO users (email, password, firstname, familyname, gender, city, country, searches, searches_for) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", (email, password, firstname, familyname, gender, city, country, 0, 0))
    c.commit()

def update_password(email, new_password):
    c = get_db()
    c.execute("UPDATE users SET password = ? WHERE email = ?", (new_password, email))
    c.commit()

def add_message(reciever_email, sender_email, message, day):
    c = get_db()
    c.execute("INSERT INTO messages (recieveremail, senderemail, content, day) VALUES (?, ?, ?, ?)", (reciever_email, sender_email, message, day))
    c.commit()

def increase_search_value(email):
    c = get_db()
    c.execute("UPDATE users SET searches = searches + 1 WHERE email = ?", (email,))
    c.commit()

def increase_searches_for_value(email):
    c = get_db()
    c.execute("UPDATE users SET searches_for = searches_for + 1 WHERE email = ?", (email,))
    c.commit()

def get_search_value(email):
    c = get_db()
    res = c.execute("SELECT searches FROM users WHERE email = ?", (email,))
    return res.fetchone()

def get_searched_for_value(email):
    c = get_db()
    res = c.execute("SELECT searches_for FROM users WHERE email = ?", (email,))
    return res.fetchone()