import database_helper as dh
from random import randint
from flask import request, Flask
import json

app = Flask(__name__, static_url_path='/static')
app.config.from_object(__name__)

logged_in_users = {}

@app.route('/')
def index():
    print "hEJEJJE"
    return app.send_static_file('client.html')

@app.route('/signin', methods=['POST'])
def sign_in():
    email = request.form['email']
    password = request.form['password']
    if dh.validate_password(email, password):
        letters = "abcdefghiklmnopqrstuvwwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"
        token = ""
        for i in range(36):
          token += letters[randint(0, len(letters)-1)]
          
        logged_in_users[token] = email
        return json.dumps({"success": True, "message": "You are now signed in", "data": token})        
    else:
        return json.dumps({"success": False, "message": "Invalid email or password"})

@app.route('/signup', methods=['POST'])
def sign_up():
    email = request.form['email']
    password = request.form['password']
    firstname = request.form['firstname']
    familyname = request.form['familyname']
    gender = request.form['gender']
    city = request.form['city']
    country = request.form['country']
    if dh.validate_user(email) == False:
        dh.sign_up(email, password, firstname, familyname, gender, city, country)
        return json.dumps({"success": True, "message": "Successfully created a new user"}) 

    return json.dumps({"success": False, "message": "User already exists"})
    
@app.route('/signout', methods=['POST'])
def sign_out():
    token = request.form['token']
    if token in logged_in_users:
        del logged_in_users[token]
        sign_out(token)
        return json.dumps({"success": True, "message": "Successfully signed out"})
    
    return json.dumps({"success": False, "message": "You are not signed in"})

@app.route('/changepassword', methods=['POST'])
def change_password():
    token = request.form['token']
    old_password = request.form['old_password']
    new_password = request.form['new_password']
    if token in logged_in_users:
        email = logged_in_users[token]
        if dh.validate_password(email, old_password):
            dh.update_password(email, new_password)
            return json.dumps({"success": True, "message": "Password changed"})
        else:
            return json.dumps({"success": False, "message": "Wrong password"})

    return json.dumps({"success": False, "message": "You are not signed in"})

@app.route('/getuserdatabytoken', methods=['POST'])
def get_user_data_by_token():
    token = request.form['token']
    if token in logged_in_users:
        email = logged_in_users[token]
        return get_user_data(email)

    return json.dumps({"success": False, "message": "You are not signed in"})

@app.route('/getuserdatabyemail', methods=['POST'])
def get_user_data_by_email():
    token = request.form['token']
    if token in logged_in_users:
        email = request.form['email']
        return get_user_data(email)

    return json.dumps({"success": False, "message": "You are not signed in"})

def get_user_data(email):
    data = dh.get_user_data(email)
    if data:
        user = {
            'email': data[0],
            'firstname': data[2],
            'familyname': data[3],
            'gender': data[4],
            'city': data[5],
            'country': data[6]
        }
        return json.dumps({"success": True, "message": "User data retrieved", "data": user}) 

    return json.dumps({"success": False, "message": "No such user"})

@app.route('/getusermessagesbytoken', methods=['POST'])
def get_user_messages_by_token():
    token = request.form['token']
    if token in logged_in_users:
        email = logged_in_users[token]
        return get_user_messages(email)
        
    return json.dumps({"success": False, "message": "You are not signed in"})

@app.route('/getusermessagesbyemail', methods=['POST'])
def get_user_messages_by_email():
    token = request.form['token']
    if token in logged_in_users:
        email = request.form['email']
        return get_user_messages(email)

    return json.dumps({"success": False, "message": "You are not signed in"})

def get_user_messages(email):
    messages = dh.get_user_messages(email)
    if messages:
        return json.dumps({"success": True, "message": "User messages retrieved", "data": messages})

    return json.dumps({"success": False, "message": "No such user"})

@app.route('/postmessage', methods=['POST'])
def post_message():
    token = request.form['token']
    message = request.form['message']
    reciever_email = request.form['email']
    if token in logged_in_users:
        sender_email = logged_in_users[token]
        if dh.validate_user(reciever_email):
            dh.post_message(reciever_email, sender_email, message)
            return json.dumps({"success": True, "message": "Message posted"})
        else:
            return json.dumps({"success": False, "message": "No such user"})

    return json.dumps({"success": False, "message": "You are not signed in"})
    
if __name__ == "__main__":
    dh.init_db()
    app.run()
