displayView = function () {
	var token = localStorage.getItem("token");
	var view;
	if (token == null) {
		view = document.getElementById("welcomeview").innerHTML;
	}
	else {
		view = document.getElementById("profileview").innerHTML;
	}

    document.getElementById("maincontainer").innerHTML = view;
    attachHandlers();
};

submitLoginForm = function () {
	var form = document.getElementById("login");
	if (validatePasswordLength(form)) {
        var params = "email="+form.email.value+"&"+
                "password="+form.pword.value;
        sendPOST('/signin', params, function () {
            if (this.success) {
                var token = this.data;
                localStorage.setItem("token", token);
                localStorage.setItem("my_email", form.email.value);
			    displayView();
                displayHome();
                newSocket();
            }
            else {
                document.getElementById("errormessage").innerHTML = this.message;
            }
        });
	}

};

//lägg in websocketkod
// skicka token, om det finns en email for den, signa ut
newSocket = function () {
    console.log("setting up new socket");
    var ws = new WebSocket("ws://" + document.domain + ":8000/api");
    ws.onopen = function () {
        console.log("ws opened");
        ws.send(localStorage.getItem("token"));
        console.log("token= " + localStorage.getItem("token"));
    };

    ws.onmessage = function (event) {
        console.log(event.data);
        var data = JSON.parse(event.data);
        if (data.action == "signout") {
            console.log(data.message);
            signOut(data.message);
            document.getElementById("errormessage").innerHTML = data.message;
            document.getElementById("successmessage").innerHTML = "";
            //ws.close();
        }

        // if a message is posted, updates message chart
        if (data.action == "updatemessages") {
            console.log("updating messages");
            var messages = [0,0,0,0,0,0,0];
            for (i in data.data) {
                messages[data.data[i][4]-1] += 1;
            }
            updateMessageStats(messages);
        }

        // when a user signs out or in, updates male/female chart
        if (data.action == "updategender") {
            console.log("updategender msg recieved via socket")
            updateGenderPie(data.data);
        }

        if (data.action == "updatesearchvalue") {
            console.log("updatesearchvalue msg recieved via socket")
            updateProfileViewStats(data.data)
        }
    };

    ws.onclose = function () {
        console.log("ws closed");
    };
};

attachHandlers = function () {
    var welcome = document.getElementById("welcome");
    if (welcome != null) {
		var signUpForm = document.getElementById("signup");
		var loginForm = document.getElementById("login");
        var loginButton = document.getElementById("loginbutton");
		var signUpButton = document.getElementById("signupbutton");
        loginButton.addEventListener("click", function () {
			loginForm.setAttribute("onsubmit", "submitLoginForm();return false;");
        });
		
        signUpButton.addEventListener("click", function () {
            signUpForm.setAttribute("onsubmit", "submitSignUpForm();return false;");
		});
    }

    var profile = document.getElementById("profile");
    if (profile != null) {
        var changePwordButton = document.getElementById("changepwordbutton");
        var changePwordForm = document.getElementById("changepwordform");
        changePwordButton.addEventListener("click", function () {
            changePwordForm.setAttribute("onsubmit", "changePassword(this);return false");
        });

        document.getElementById("signoutbutton").onclick = function () {
            signOut();
        };

        document.getElementById("search").onclick = function () {
            var email = document.getElementById("accountsearch").value;
            if (email != null && email != "") {
                searchForUser(email);
            }
        };

        document.getElementById("homebutton").onclick = function () {
            displayHome();
        };

        document.getElementById("browsebutton").onclick = function () {
            displayBrowse();
        };

        document.getElementById("accountbutton").onclick = function () {
            clearErrorMessages();
            document.getElementById("statsbutton").style.background = "#f2f2f2";
            document.getElementById("accountbutton").style.background = "#555";
            document.getElementById("homebutton").style.background = "#f2f2f2";
            document.getElementById("browsebutton").style.background = "#f2f2f2";
            document.getElementById("account").style.display = "block";
            document.getElementById("home").style.display = "none";
            document.getElementById("browse").style.display = "none";
            document.getElementById("stats").style.display = "none";
        };

        document.getElementById("statsbutton").onclick = function () {
            displayStats();
        };

        document.getElementById("browsereload").onclick = function () {
            var email = document.getElementById("bemail").textContent;
            if (email != "" && email != null) {
                getMessages(email);
            }
        };

        document.getElementById("browsepost").onclick = function () {
            var email = document.getElementById("bemail").textContent;
            if (email != null) {
                postOnWall(email, "browsepostmessage");
                getMessages(email);
            }
        };

        document.getElementById("reload").onclick = function () {
            getMessages(null);
        };

        document.getElementById("post").onclick = function () {
            postOnWall(null, "postmessage");
            getMessages(null);
        };
        displayHome();
    }
};

signOut = function (msg) {
    var token = localStorage.getItem("token");
    var params = "token="+token;
    localStorage.removeItem("token");
    localStorage.removeItem("my_email");
    sendPOST('/signout', params, function () {
        if (msg != null) {
            document.getElementById("errormessage").innerHTML = msg;
            document.getElementById("successmessage").innerHTML = "";
        }
        else {
            if (this.success) {
                document.getElementById("errormessage").innerHTML = "";
                document.getElementById("successmessage").innerHTML = this.message;
            }
            else {
                document.getElementById("errormessage").innerHTML = this.message;
                document.getElementById("successmessage").innerHTML = "";
            }
        }
    });

    displayView();
};

displayHome = function () {
    clearErrorMessages();
    getMessages(null);
    fillInUserInfo(null);
    document.getElementById("account").style.display = "none";
    document.getElementById("home").style.display = "block";
    document.getElementById("browse").style.display = "none";
    document.getElementById("stats").style.display = "none";
    document.getElementById("homebutton").style.background = "#555";
    document.getElementById("accountbutton").style.background = "#f2f2f2";
    document.getElementById("browsebutton").style.background = "#f2f2f2";
    document.getElementById("statsbutton").style.background = "#f2f2f2";
};

displayBrowse = function () {
    clearErrorMessages();
    document.getElementById("browsebutton").style.background = "#555";
    document.getElementById("accountbutton").style.background = "#f2f2f2";
    document.getElementById("homebutton").style.background = "#f2f2f2";
    document.getElementById("statsbutton").style.background = "#f2f2f2";
    document.getElementById("account").style.display = "none";
    document.getElementById("home").style.display = "none";
    document.getElementById("browse").style.display = "block";
    document.getElementById("stats").style.display = "none";
    if (document.getElementById("bemail").textContent) {
        var email = document.getElementById("bemail").textContent;
        getMessages(email);
    }
};

updateGenderPie = function (data) {
    console.log("updating gender pie");

    var genderCanvas = document.getElementById("genderpie");
    var genderPie = new Chart(genderCanvas, {
        type: 'pie',
        data: {
            labels: ["male", "female"],
            datasets: [{
                label: 'users online',
                data: data
            }]
        }
    });
};

updateMessageStats = function (data) {
    console.log("updating message stats");
    var messageCanvas = document.getElementById("messagechart");
    var messageChart = new Chart(messageCanvas, {
        type: 'bar',
        data: {
            labels: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
            datasets: [{
                label: 'messages posted on my wall',
                data: data
            }]
        }
    });
};

updateProfileViewStats = function (data) {
    console.log("updating gender pie");

    var profileCanvas = document.getElementById("profilepie");
    var profilePie = new Chart(profileCanvas, {
        type: 'pie',
        data: {
            labels: ["profile views", "profiles viwed"],
            datasets: [{
                data: data
            }]
        }
    });
}

// show number of signed in users,
// messages posted on my wall,
// number of views of my page
displayStats = function () {
    clearErrorMessages();
    document.getElementById("browsebutton").style.background = "#f2f2f2";
    document.getElementById("accountbutton").style.background = "#f2f2f2";
    document.getElementById("homebutton").style.background = "#f2f2f2";
    document.getElementById("statsbutton").style.background = "#555";
    document.getElementById("account").style.display = "none";
    document.getElementById("home").style.display = "none";
    document.getElementById("browse").style.display = "none";
    document.getElementById("stats").style.display = "block";

};

postOnWall = function (email, messagebox) {
    var message = document.getElementById(messagebox).value;
    var token = localStorage.getItem("token");
    var postEmail;
    var day = new Date().getDay();
    if (email == null) {
        postEmail = localStorage.getItem("my_email");
    }
    else {
        postEmail = email;
    }

    var params = "token="+token+"&"+"message="+message+"&"+"email="+postEmail+"&"+"day="+day;
    sendPOST('/postmessage', params, function () {
        if (this.success) {
            document.getElementById("errormessage").innerHTML = "";
            document.getElementById("successmessage").innerHTML = this.message;
        }
        else {
            document.getElementById("errormessage").innerHTML = this.message;
            document.getElementById("successmessage").innerHTML = "";
        }
    });
    document.getElementById(messagebox).value = "";
};

clearErrorMessages = function () {
    document.getElementById("successmessage").innerHTML = "";
    document.getElementById("errormessage").innerHTML = "";
};

searchForUser = function (email) {
    var token = localStorage.getItem("token");
    if (email != null) {
        sendPOST('/usersearchedfor', "email="+email+"&my_email="+localStorage.getItem("my_email"), null);
        sendGET('/getuserdatabyemail/'+token+'/'+email, function () {
            if (this.success) {
                document.getElementById("errormessage").innerHTML = "";
                document.getElementById("successmessage").innerHTML = this.message;
                document.getElementById("accountsearch").value = "";
                fillInUserInfo(email);
            }
            else {
                document.getElementById("successmessage").innerHTML = "";
                document.getElementById("errormessage").innerHTML = this.message;
            }
        });
    }
};

getMessages = function (email) {
    var messages;
    var token = localStorage.getItem("token");
    if (email == null) {
        sendGET('/getusermessagesbytoken/'+token, function () {
            if (this.success) {
                messages = this.data;
                document.getElementById("textarea").value = "";
                var textarea = document.getElementById("textarea");
                if (messages != null) {
                    var i = messages.length-1;
                    while (i != -1) {
                        textarea.value += messages[i][2] + ": " + messages[i][3] + "\n";
                        i--;
                    }
                }
            }
        });
    }
    else {
        sendGET('/getusermessagesbyemail/'+token+'/'+email, function () {
            if (this.success) {
                messages = this.data;
                document.getElementById("browsetextarea").value = "";
                var textarea = document.getElementById("browsetextarea");
                if (messages != null) {
                    var i = messages.length-1;
                    while (i != -1) {
                        textarea.value += messages[i][2] + ": " + messages[i][3] + "\n";
                        i--;
                    }
                }
            }
        });
    }
};

fillInUserInfo = function (email) {
    var user = null;
    var token = localStorage.getItem("token");
    if (email == null) {
        sendGET('/getuserdatabytoken/'+token, function () {
            if (this.success) {
                user = this;
                document.getElementById("fname").innerHTML = user.data.firstname;
                document.getElementById("lname").innerHTML = user.data.familyname;
                document.getElementById("gender").innerHTML = user.data.gender;
                document.getElementById("city").innerHTML = user.data.city;
                document.getElementById("country").innerHTML = user.data.country;
                document.getElementById("email").innerHTML = user.data.email;
            }
        });
    }
    else {
        sendGET('/getuserdatabyemail/'+token+'/'+email, function () {
            if (this.success) {
                user = this;
                document.getElementById("bfname").innerHTML = user.data.firstname;
                document.getElementById("blname").innerHTML = user.data.familyname;
                document.getElementById("bgender").innerHTML = user.data.gender;
                document.getElementById("bcity").innerHTML = user.data.city;
                document.getElementById("bcountry").innerHTML = user.data.country;
                document.getElementById("bemail").innerHTML = user.data.email;
            }
        });
    }
};

changePassword = function (form) {
    if (validatePassword(form)) {
		var token = localStorage.getItem("token");
        var params = "token="+token+"&"+
                "old_password="+form.opword.value+"&"+
                "new_password="+form.pword.value;

        sendPOST('/changepassword', params, function () {
            if (this.success) {
                form.reset();
			    document.getElementById("errormessage").innerHTML = "";
		    	document.getElementById("successmessage").innerHTML = this.message;
            }
            else {
		    	form.reset();
		    	document.getElementById("successmessage").innerHTML = "";
		    	document.getElementById("errormessage").innerHTML = this.message;
		    }
        });
    }
};

submitSignUpForm = function () {
	var form = document.getElementById("signup");
	if (validatePassword(form)) {
		var g = document.getElementById("gender");
		
        var params = "email="+form.email.value+"&"+
                "password="+form.pword.value+"&"+
                "firstname="+form.fname.value+"&"+
                "familyname="+form.lname.value+"&"+
                "gender="+g.options[g.selectedIndex].value+"&"+
                "city="+form.city.value+"&"+
                "country="+form.country.value+"&";

        sendPOST('/signup', params, function () {
            if (this.success) {
                document.getElementById("errormessage").innerHTML = "";
                document.getElementById("successmessage").innerHTML = this.message;
			    form.reset();
            }
            else {
                document.getElementById("successmessage").innerHTML = "";
			    document.getElementById("errormessage").innerHTML = this.message;
		    }
        });
	}
};

validatePasswordLength = function (form) {
	if (form.pword.value.length < 6) {
		document.getElementById("errormessage").innerHTML = "Password must be at least 6 characters long!";
		return false;
    }
	else {
		document.getElementById("errormessage").innerHTML = "";
		return true;
	}
};

validatePassword = function (form) {
    if (form.pword.value != form.rpword.value) {
		document.getElementById("successmessage").innerHTML = "";
		document.getElementById("errormessage").innerHTML = "Passwords does not match!";
		return false;
    }
	
	return validatePasswordLength(form);
};

sendGET = function (url, callback) {
    var con = new XMLHttpRequest();
    con.onreadystatechange = function () {
	if (con.readyState == 4 && con.status == 200) {
            callback.call(JSON.parse(con.responseText));
        }
    };
    con.open("GET", url, true);
    con.send(null);
};

sendPOST = function (url, params, callback) {
    var con = new XMLHttpRequest();
    con.onreadystatechange = function () {
        if (con.readyState == 4 && con.status == 200) {
            callback.call(JSON.parse(con.responseText));
        }
    };
    con.open("POST", url, true);
    con.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    con.send(params);
};

window.onload = function () {
    displayView();
};
