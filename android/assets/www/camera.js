
function takePicture() {
	navigator.camera.getPicture(handlePicture, cameraError,
		{ quality: 50, destinationType: Camera.DestinationType.DATA_URL, 
		sourceType: Camera.PictureSourceType.CAMERA, 
		allowEdit: true,
		encodingType: Camera.EncodingType.JPEG,
		targetWidth: 256,
		targetHeight: 256});
}

function handlePicture(data) {
	document.getElementById("image").src="data:image/jpeg;base64,"+data;
}

function cameraError(msg) {
	console.log(msg);
}