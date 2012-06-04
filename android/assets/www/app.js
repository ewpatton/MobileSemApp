var app_base = "file:///android_asset/www/";
var api = "http://aquarius.tw.rpi.edu/projects/semtech2012/";
var curloc = null;

////////////////////
//// Take Photo
////////////////////
function finishGeoloc(pos) {
	curloc = pos;
	$.getJSON("http://api.geonames.org/findNearbyPostalCodesJSON",
	            {"lat":position.coords.latitude,
	             "lng":position.coords.longitude,
	             "maxRows":"1",
	             "username":"mobilesemtech2011"},
	            function(data,status,xhr) {

		      var x=null;

		      // Verify that we've got results
		      if(typeof(data.postalCodes.length)!==undefined &&
	                 data.postalCodes.length > 0)
	                x = data.postalCodes[0];
		      if(!x) return;

		      // Update the local store
		      window.store.getAt(0).set('text',"Location: "+x.placeName+
						", "+x.adminName1);

		      // From postal code, attempt to get to DBpedia URI
		      getGeonamesId(x.placeName,x.adminCode1,x.countryCode,function(str) {
		    	  window.dbpediaUri=str;
		      });
	      });
}

function startGeoloc() {
	navigator.geolocation.getCurrentPosition(finishGeoloc);
}

function saveMetadata(url, data) {
	$.ajax(url+"?metadata", {async: true, contentType: "text/turtle",
		data:data, processData: false, type: "PUT", success:function() {
			window.alert("Image saved!");
			window.location.href="index.html";
		}});
}

function handlePicture(data) {
	if(curloc != null) {
		var sha1 = Crypto.SHA1(data, {asString: true});
		var url = api+"images/"+sha1+".jpg";
		var desc = window.prompt("Caption","");
		var rdf="@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .\n";
		rdf += "@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .\n";
		rdf += "@prefix foaf: <http://xmlns.com/foaf/0.1/> .\n";
		rdf += "@prefix dc: <http://purl.org/dc/terms/> .\n";
		rdf += "@prefix sioc: <http://rdfs.org/sioc/ns#> .\n";
		rdf += "@prefix geo: <http://www.w3.org/2003/01/geo/wgs84_pos#> .\n";
		rdf += "@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .\n";
		rdf += "@prefix : <http://aquarius.tw.rpi.edu/projects/semtech2012/> .\n";
		rdf += "<"+url+"> a foaf:Image ; " +
				"dc:created \""+"\" ; " +
				"dc:creator <"+api+"user/"+localStorage.getItem("webcapsule.user")+"> ; " +
				"dc:description \"\"\""+desc+"\"\"\" ; " +
				"taken_at [ " +
				"geo:lat \""+curloc.coords.latitude+"\"^^xsd:double ; " +
				"geo:long \""+curloc.coords.longitude+"\"^^xsd:double ; " +
				(window.dbpediaUri?"located_in <"+window.dbpediaUri+">":"") +
				"] ; " +
				".";
		$.ajax(url, {async: true, contentType: "image/jpeg;base64", data:data,
			processData: false, type:"PUT", success:function() {
				saveMetadata(url, rdf);
			}});
		
	}
}

function cameraError(msg) {
	window.alert(msg);
}

function showCamera() {
	navigatorcamera.getPicture(handlePicture, cameraError,
			{ quality: 50, destinationType: Camera.DestinationType.DATA_URL,
		sourceType: Camera.PictureSourceType.CAMERA,
		allowEdit: true,
		encodingType: Camera.EncodingType.JPEG,
		targetWidth: 256,
		targetHeight: 256});
}

function take_photo_init() {
	$("#take_photo #save_photo");
	$("#take_photo #discard").click(function() {
		window.location.href = "index.html";
	});
	startGeoloc();
	showCamera();
}

////////////////////
//// Settings
////////////////////
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

////////////////////
//// Main Menu
////////////////////
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

////////////////////
//// Generic
////////////////////
function init(page) {
	eval(page+'_init();');
}

function doNothing() {}
