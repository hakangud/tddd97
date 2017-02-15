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
            var token = localStorage.getItem("token");
            localStorage.removeItem("token");
            serverstub.signOut(token);
            displayView();
        };

        document.getElementById("search").onclick = function () {
            var email = document.getElementById("accountsearch").value;
            searchForUser(email);
        };

        document.getElementById("homebutton").onclick = function () {
            displayHome();
        };

        document.getElementById("browsebutton").onclick = function () {
            clearMessages();
            displayBrowse();
            document.getElementById("account").style.display = "none";
            document.getElementById("home").style.display = "none";
            document.getElementById("browse").style.display = "block";
        };

        document.getElementById("accountbutton").onclick = function () {
            clearMessages();
            document.getElementById("account").style.display = "block";
            document.getElementById("home").style.display = "none";
            document.getElementById("browse").style.display = "none";
        };

        displayHome();
    }
};

displayHome = function (email) {
    clearMessages();
    loadWall(email);
    fillInUserInfo(email);
    document.getElementById("account").style.display = "none";
    document.getElementById("home").style.display = "block";
    document.getElementById("browse").style.display = "none";
    document.getElementById("reload").onclick = function () {
            loadWall(email);
        };

    document.getElementById("post").onclick = function () {
            var message = document.getElementById("postmessage").value;
            var token = localStorage.getItem("token");
            var postEmail;
            if (email == null) {
                postEmail = serverstub.getUserDataByToken(token).email;
            }
            else {
                postEmail = email;
            }
            serverstub.postMessage(token, message, postEmail);
            document.getElementById("postmessage").value = "";
        };
};

displayBrowse = function () {
    document.getElementById("browse").innerHTML;
};

clearMessages = function () {
    document.getElementById("successmessage").innerHTML = "";
    document.getElementById("errormessage").innerHTML = "";
};

searchForUser = function (email) {
    var user = serverstub.getUserDataByEmail(localStorage.getItem("token"), email);
    if (user.success) {
        document.getElementById("errormessage").innerHTML = "";
        displayHome(email);
    }
    else {
        document.getElementById("successmessage").innerHTML = "";
        document.getElementById("errormessage").innerHTML = user.message;
    }
};

loadWall = function (email) {
    document.getElementById("textarea").value = "";
    var messages;
    if (email == null) {
        messages = serverstub.getUserMessagesByToken(localStorage.getItem("token"));
    }
    else {
        messages = serverstub.getUserMessagesByEmail(localStorage.getItem("token"), email);
    }
    var textarea = document.getElementById("textarea");
    for (var i = 0; i < messages.data.length; i++) {
        textarea.value += messages.data[i].writer + ": " + messages.data[i].content + "\n";
    }
};

displayHomeScreenInBrowse = function (homeEmail) {
    var user = serverstub.getUserDataByEmail(localStorage.getItem("token"), homeEmail);
    document.getElementById("fname").innerHTML = user.data.firstname;
    document.getElementById("lname").innerHTML = user.data.familyname;
    document.getElementById("gender").innerHTML = user.data.gender;
    document.getElementById("city").innerHTML = user.data.city;
    document.getElementById("country").innerHTML = user.data.country;
    document.getElementById("email").innerHTML = user.data.email;

    var userHomeScreen = document.getElementById("home").innerHTML;

    document.getElementById("homedisplay").innerHTML = userHomeScreen;
};

fillInUserInfo = function (email) {
    var user;
    if (email == null) {
        user = serverstub.getUserDataByToken(localStorage.getItem("token"));
    }
    else {
        user = serverstub.getUserDataByEmail(localStorage.getItem("token"), email);
    }
    document.getElementById("fname").innerHTML = user.data.firstname;
    document.getElementById("lname").innerHTML = user.data.familyname;
    document.getElementById("gender").innerHTML = user.data.gender;
    document.getElementById("city").innerHTML = user.data.city;
    document.getElementById("country").innerHTML = user.data.country;
    document.getElementById("email").innerHTML = user.data.email;
};

changePassword = function (form) {
    if (validatePassword(form)) {
		var token = localStorage.getItem("token");	
		//var s = serverstub.changePassword(token, form.opword.value, form.pword.value);

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
        /*
		if (s.success) {	
			form.reset();
			document.getElementById("errormessage").innerHTML = "";
			document.getElementById("successmessage").innerHTML = s.message;
		}
		else {
			form.reset();
			document.getElementById("successmessage").innerHTML = "";
			document.getElementById("errormessage").innerHTML = s.message;
		}
		*/
    }
};

submitLoginForm = function () {
	var form = document.getElementById("login");
	if (validatePasswordLength(form)) {
        var params = "email="+form.email.value+"&"+
                "password="+form.pword.value;

        sendPOST('/signin', params, function () {
            if (this.success) {
                var token = this.data;
                console.log(token);
                localStorage.setItem("token", token);
			    displayView();
            }
            else {
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