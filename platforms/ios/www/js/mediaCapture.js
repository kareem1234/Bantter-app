
function MediaCapture(eventEmitter,request){
	var E = eventEmitter;
	var R = request;
	var toId = undefined;
	var num = 0;
	var mediaFile;
	var outBoxHash = {};
	var contentType;
	var caption;
	var recordedSelfie;
	var maxLength = 10;
	var vidRef = undefined;
	this.save = function(){
		window.localStorage.setItem("mediaCapture_num",JSON.stringify(num));
		window.localStorage.setItem("mediaCapture_outBoxHash",JSON.stringify(outBoxHash));
	}
	this.load = function(){
		var newNum = JSON.parse(window.localStorage.getItem("mediaCapture_num"));
		if(newNum)
			num = newNum;
		var newOutBoxHash = JSON.parse(window.localStorage.getItem("mediaCapture_outBoxHash"));
		if(newOutBoxHash)
			outBoxHash = newOutBoxHash;
	}
	this.haveIsent = function(id){
		if(outBoxHash[id.toString()])
			return true;
		else 
			return false;
	}
	var captureError = function(error){
		console.log("video captureError" + error);
		console.dir(error);
		E.EMIT("mediaCapture_captureError");
	}

	this.getVideo= function(id){
		if(id){
			toId = id;
			outBoxHash[id.toString()] = true;
		}else
			recordedSelfie = true;
		window.plugins.videocaptureplus.captureVideo(function(mediaFiles){
			console.log("vid captured");
			mediaFile = mediaFiles[0];
			console.log(mediaFile);
			contentType = 'video/mp4';
			E.EMIT("mediaCapture_cap");
		},captureError,{
			limit: 1,
			duration: 7,
			highquality: false,
			frontcamera: true,

		});
	}
	this.getPolicy = function(){
		var me = R.getUser();
		var time = new Date().getTime();
		var url = me.FbId +"_"+ time;
		vidRef = {
			FbId: me.FbId,
			Url: url,
			Caption: caption,
			Numer: num,
			To: toId,
			Type: contentType
		}
		console.log("getting policy");
		R.request('getPolicy',vidRef);
	}
	this.onPolicyReturn = function(pol){
		console.log("printing policy object");
		console.dir(pol);
		console.log("creating file transfer object");
		var ft = new FileTransfer();
		var options = new FileUploadOptions();
		options.fileKey = "file";
        options.fileName = vidRef.Url;
        options.mimeType = contentType;
        options.chunkedMode = false;
        
        options.params = {
                    "key": vidRef.Url,
                    "AWSAccessKeyId": pol.awsKey,
                    "acl": "public-read",
                    "policy": pol.policy,
                    "signature": pol.signature,
                    "Content-Type": contentType
                };
        console.log("file transfer options set. Starting upload");
        console.log(mediaFile.fullPath);
        ft.upload(mediaFile.fullPath,"https://" + pol.bucket + ".s3.amazonaws.com/",function(result){
         	incUpload();
         	clear();
         	R.request("insertVidRef",vidRef);
         	console.log("upload complete");
         	E.EMIT("mediaCapture_uploadSuccess");
         },function(error){
         	console.log("upload failed");
         	console.log(error.code);
         	E.EMIT("mediaCapture_uploadError",error);
         },options);
	}
	function incUpload(){
		num++;
	}
	function clear(){
		vidRef = undefined;
		mediaFile = undefined;
		toId = undefined;
		caption = undefined;
	}
	// capture video
	// check length and add caption
	// get policy
	// upload video
}