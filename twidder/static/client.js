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
            displayBrowse();
        };

        document.getElementById("accountbutton").onclick = function () {
            clearMessages();
            document.getElementById("accountbutton").style.background = "#555";
            document.getElementById("homebutton").style.background = "#f2f2f2";
            document.getElementById("browsebutton").style.background = "#f2f2f2";
            document.getElementById("account").style.display = "block";
            document.getElementById("home").style.display = "none";
            document.getElementById("browse").style.display = "none";
        };

        displayHome();
    }
};

displayHome = function (email) {
    clearMessages();
    loadWall(email, "textarea");
    fillInUserInfo(email);
    document.getElementById("account").style.display = "none";
    document.getElementById("home").style.display = "block";
    document.getElementById("browse").style.display = "none";
    document.getElementById("homebutton").style.background = "#555";
    document.getElementById("accountbutton").style.background = "#f2f2f2";
    document.getElementById("browsebutton").style.background = "#f2f2f2";
    document.getElementById("reload").onclick = function () {
            loadWall(email, "textarea");
        };

    document.getElementById("post").onclick = function () {
        postOnWall(email, "postmessage");
        loadWall(email, "textarea");
    };
};

postOnWall = function (email, messagebox) {
    var message = document.getElementById(messagebox).value;
    var token = localStorage.getItem("token");
    var postEmail;
    if (email == null) {
        postEmail = serverstub.getUserDataByToken(token).email;
    }
    else {
        postEmail = email;
    }
    serverstub.postMessage(token, message, postEmail);
    document.getElementById(messagebox).value = "";
};

displayBrowse = function () {
    clearMessages();
    var email = document.getElementById("bemail").textContent;
    loadWall(email, "browsewall");
    document.getElementById("browsebutton").style.background = "#555";
    document.getElementById("accountbutton").style.background = "#f2f2f2";
    document.getElementById("homebutton").style.background = "#f2f2f2";
    document.getElementById("account").style.display = "none";
    document.getElementById("home").style.display = "none";
    document.getElementById("browse").style.display = "block";

    document.getElementById("browsereload").onclick = function () {
        var email = document.getElementById("bemail").textContent;
        loadWall(email, "browsetextarea");
    };

    document.getElementById("browsepost").onclick = function () {
        var email = document.getElementById("bemail").textContent;
        postOnWall(email, "browsepostmessage");
        loadWall(email, "browsetextarea");
    };
};

clearMessages = function () {
    document.getElementById("successmessage").innerHTML = "";
    document.getElementById("errormessage").innerHTML = "";
};

searchForUser = function (email) {
    var user = serverstub.getUserDataByEmail(localStorage.getItem("token"), email);
    if (user.success) {
        document.getElementById("errormessage").innerHTML = "";
        displayUserInBrowse(email);
    }
    else {
        document.getElementById("successmessage").innerHTML = "";
        document.getElementById("errormessage").innerHTML = user.message;
    }
};


getMessages = function (email) {
    var messages;
    if (email == null) {
        messages = serverstub.getUserMessagesByToken(localStorage.getItem("token"));
    }
    else {
        messages = serverstub.getUserMessagesByEmail(localStorage.getItem("token"), email);
    }
    return messages
};

loadWall = function (email, id) {
    document.getElementById(id).value = "";

    var messages = getMessages(email);
    var textarea = document.getElementById(id);
    if (messages.success) {
        for (var i = 0; i < messages.data.length; i++) {
            textarea.value += messages.data[i].writer + ": " + messages.data[i].content + "\n";
        }
    }
};

displayUserInBrowse = function (homeEmail) {
    var user = serverstub.getUserDataByEmail(localStorage.getItem("token"), homeEmail);
    document.getElementById("bfname").innerHTML = user.data.firstname;
    document.getElementById("blname").innerHTML = user.data.familyname;
    document.getElementById("bgender").innerHTML = user.data.gender;
    document.getElementById("bcity").innerHTML = user.data.city;
    document.getElementById("bcountry").innerHTML = user.data.country;
    document.getElementById("bemail").innerHTML = user.data.email;
    loadWall(homeEmail, "browsetextarea");
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
		var s = serverstub.changePassword(token, form.opword.value, form.pword.value)
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
    }
};

submitLoginForm = function () {
	var form = document.getElementById("login");
	if (validatePasswordLength(form)) {
		var s = serverstub.signIn(form.email.value, form.pword.value);
		if (s.success) {
			var token = s.data;
			localStorage.setItem("token", token);
			displayView();
		}
        else {
            document.getElementById("errormessage").innerHTML = s.message;
        }
	}
};

submitSignUpForm = function () {
	var form = document.getElementById("signup");
	if (validatePassword(form)) {
		var g = document.getElementById("gender");
		var f = {
			email:form.email.value,
			password:form.pword.value,
			firstname:form.fname.value,
			familyname:form.lname.value,
			gender:g.options[g.selectedIndex].value,
			city:form.city.value,
			country:form.country.value
		};
		
		var s = serverstub.signUp(f);
		if (s.success) {
			document.getElementById("successmessage").innerHTML = s.message;
			form.reset();
		}
		else {
			document.getElementById("errormessage").innerHTML = s.message;
		}
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

window.onload = function () {
    displayView();
};