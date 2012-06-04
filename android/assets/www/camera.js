
function takePicture() {
	navigator.camera.getPicture(handlePicture, cameraError,
		{ quality: 50, destinationType: Camera.DestinationType.DATA_URL, 
		sourceType: Camera.PictureSourceType.CAMERA, 
		allowEdit: true,
		encodingType: Camera.EncodingType.JPEG,
		targetWidth: 256,
		targetHeight: 256});
}

function completed(xhr, status) {
	console.log(status);
	console.log("HTTP Status: "+xhr.status+" "+xhr.statusText);
	if(xhr.status>=500) {
		console.log("Error: "+xhr.responseText);
	}
}

function handlePicture(data) {
	console.log("Camera data received, sending image to server");
	document.getElementById("image").src="data:image/jpeg;base64,"+data;
	jQuery.ajax("http://aquarius.tw.rpi.edu/projects/semtech2012/images/test.jpg",
		{async: true, contentType: "image/jpeg;base64", data:data, 
		 processData: false, type:"PUT"});
	console.log(data);
}

function cameraError(msg) {
	console.log(msg);
}