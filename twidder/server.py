import database_helper as dh
#from twidder import app
#from gevent import pywsgi
from gevent.pywsgi import WSGIServer
from geventwebsocket.handler import WebSocketHandler
from random import randint
from flask import request, Flask
import json

app = Flask(__name__, static_url_path='/static')
app.debug = True
logged_in_users = {}
websockets  = {}

@app.route('/')
def index():
    return app.send_static_file('client.html')

@app.route('/api')
def api():
    if request.environ.get('wsgi.websocket'):
        ws = request.environ['wsgi.websocket']
        while True:
            token = ws.receive()
            if token in logged_in_users:
                email = logged_in_users[token]
                websockets[email] = ws
                init_stats(email)

    return

def init_stats(email):
    ws = websockets[email]
    update_gender_stats()
    update_search_value(email)
    data = dh.get_user_messages(email)
    ws.send(json.dumps({"action": "updatemessages", "message": "Messages stats updated", "data": data}))

@app.route('/signin', methods=['POST'])
def sign_in():
    email = request.form['email']
    if email in websockets:
        print "signed in from different browser"
        ws = websockets[email]
        ws.send(json.dumps({"action": "signout", "message": "You signed in from another browser"}))

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

def get_online_users():
    male = 0
    female = 0
    for token in logged_in_users:
        print "logged in users token= " + token
        data = dh.get_user_data(logged_in_users[token])
        if data[4] == "male":
            male += 1
        if data[4] == "female":
            female += 1

    return [male, female]

def update_gender_stats():
    num_users = get_online_users()
    print num_users
    #male = 0
    #female = 0
    #print "email= " + logged_in_users[token]
    #for token in logged_in_users:
      #  print "logged in users token= " + token
     #   data = dh.get_user_data(logged_in_users[token])
      #  if data[4] == "male":
     #       male += 1
     #   if data[4] == "female":
     #       female += 1

    for ws in websockets:
        print "websocket= " + ws
        websockets[ws].send(json.dumps({"action": "updategender", "message": "Updating gender stats", "data": num_users}))

@app.route('/signup', methods=['POST'])
def sign_up():
    email = request.form['email']
    password = request.form['password']
    firstname = request.form['firstname']
    familyname = request.form['familyname']
    gender = request.form['gender']
    city = request.form['city']
    country = request.form['country']
    if not dh.validate_user(email):
        dh.add_user(email, password, firstname, familyname, gender, city, country)
        return json.dumps({"success": True, "message": "Successfully created a new user"}) 

    return json.dumps({"success": False, "message": "User already exists"})
    
@app.route('/signout', methods=['POST'])
def sign_out():
    token = request.form['token']
    if token in logged_in_users:
        email = logged_in_users[token]
        #ws = websockets[email]
        del websockets[email]
        del logged_in_users[token]
        update_gender_stats()
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

@app.route('/usersearchedfor', methods=['POST'])
def user_searched_for():
    email = request.form['email']
    user_email = request.form['my_email']
    dh.increase_search_value(user_email)
    dh.increase_searches_for_value(email)
    update_search_value(user_email, email)
    return ""

def update_search_value(user_email, email=None):
    if email is not None and email in websockets:
        search_for_value1 = dh.get_searched_for_value(email)
        search_value1 = dh.get_search_value(email)
        ws1 = websockets[email]
        ws1.send(json.dumps({"action": "updatesearchvalue", "message": "Updating search value", "data": [search_for_value1, search_value1]}))

    search_for_value2 = dh.get_searched_for_value(user_email)
    search_value2 = dh.get_search_value(user_email)
    ws2 = websockets[user_email]
    ws2.send(json.dumps({"action": "updatesearchvalue", "message": "Updating search value", "data": [search_for_value2, search_value2]}))


@app.route('/getuserdatabytoken/<token>', methods=['GET'])
def get_user_data_by_token(token):
    if token in logged_in_users:
        email = logged_in_users[token]
        return get_user_data(email)

    return json.dumps({"success": False, "message": "You are not signed in"})

@app.route('/getuserdatabyemail/<token>/<email>', methods=['GET'])
def get_user_data_by_email(token, email):
    if token in logged_in_users:
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

@app.route('/getusermessagesbytoken/<token>', methods=['GET'])
def get_user_messages_by_token(token):
    if token in logged_in_users:
        email = logged_in_users[token]
        return get_user_messages(email)
        
    return json.dumps({"success": False, "message": "You are not signed in"})

@app.route('/getusermessagesbyemail/<token>/<email>', methods=['GET'])
def get_user_messages_by_email(token, email):
    if token in logged_in_users:
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
    day = request.form['day']
    if token in logged_in_users:
        sender_email = logged_in_users[token]
        if dh.validate_user(reciever_email):
            print "sending messageupdate with ws"
            dh.add_message(reciever_email, sender_email, message, day)
            if reciever_email in websockets:
                ws = websockets[reciever_email]
                data = dh.get_user_messages(reciever_email)
                ws.send(json.dumps({"action": "updatemessages", "message": "Messages stats updated", "data": data}))
            return json.dumps({"success": True, "message": "Message posted"})
        else:
            return json.dumps({"success": False, "message": "No such user"})

    return json.dumps({"success": False, "message": "You are not signed in"})


    
if __name__ == "__main__":
    #dh.init_db()
    http_server = WSGIServer(('', 8000), app, handler_class=WebSocketHandler)
    http_server.serve_forever()

    app.run()
