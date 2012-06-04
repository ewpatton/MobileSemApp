var app_base = "file:///android_asset/www/";

var emailRegex = new RegExp("^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*" +
		"@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*" +
		"\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|" +
		"pro|travel|mobi|[a-z][a-z])|" +
		"([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$","i");

function validate_settings() {
	// check settings here
	var username = $("#settings #username").val();
	if(!(/^[a-zA-Z][a-zA-Z]*$/.test(username))) {
		return "Username must start with a letter and contain only letters and numbers.";
	}
	var email = $("#settings #email").val();
	if(email != "" && !(emailRegex.test(email))) {
		return "That email address doesn't look valid. You may want to verify it.";
	}
	if(Modernizr.localstorage) {
		localStorage.setItem("webcapsule.username", username);
		localStorage.setItem("webcapsule.email", email);
	}
	else {
		return "Your browser does not support HTML5 Local Storage. Unable to save settings.";
	}
	return null;
}

function save_settings() {
	var errmsg = validate_settings(); 
	if(!errmsg) {
		window.location.href="index.html";
	}
	else {
		navigator.notification.alert(errmsg, doNothing, "Validation Error", "Dismiss");
	}
}

function settings_init() {
	$("#settings #save_settings").click(save_settings);
	if(Modernizr.localstorage) {
		$("#settings #username").val(localStorage.getItem("webcapsule.username"));
		$("#settings #email").val(localStorage.getItem("webcapsule.email"));
	}
}

function main_menu_init() {
	$("#main_menu #take_photo").addClass("disabled").click(take_photo);
	$("#main_menu #find_photos").addClass("disabled").click(find_photos);
	if(Modernizr.localstorage) {
		if(localStorage.getItem("webcapsule.username")) {
			$("#main_menu>div").removeClass("disabled");
		}
	}
	else {
		window.alert("failure!");
		//navigator.notification.alert("Your browser does not support local storage. This app" +
		//		"will not work properly.", doNothing, "Warning", "Ok");
	}
}

function init(page) {
	eval(page+'_init();');
}

function doNothing() {}
