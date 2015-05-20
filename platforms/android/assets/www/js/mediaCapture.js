
function MediaCapture(eventEmitter,request){
	var E = eventEmitter;
	var R = request;
	var toId = null;
	var androidFilePath = "";
	var imageExtension = "00001.png";
	this.num = 0;
	var mediaFile;
	var outBoxHash = {};
	var contentType;
	var policy;
	this.inProgress = false;
	var timeout = 1000;
	this.selfImageUrl = null;
	this.selfVidUrl = null;
	var vidRef = null;
	var that = this;
	this.save = function(){
		window.localStorage.setItem("mediaCapture_num",JSON.stringify(that.num));
		window.localStorage.setItem("mediaCapture_outBoxHash",JSON.stringify(outBoxHash));
		window.localStorage.setItem("mediaCapture_selfImage",JSON.stringify(that.selfImageUrl));
		window.localStorage.setItem("mediaCapture_selfVid",JSON.stringify(that.selfVidUrl));
	}
	this.load = function(){
		var newNum = JSON.parse(window.localStorage.getItem("mediaCapture_num"));
		if(newNum)
			that.num = newNum;
		var newImageUrl = JSON.parse(window.localStorage.getItem("mediaCapture_selfImage"));
		if(newImageUrl)
			that.selfImageUrl= newImageUrl;
		var newVidUrl = JSON.parse(window.localStorage.getItem("mediaCapture_selfVid"));
		if(newVidUrl)
			that.selfVidUrl = newVidUrl;
		var newOutBoxHash = JSON.parse(window.localStorage.getItem("mediaCapture_outBoxHash"));
		if(newOutBoxHash)
			outBoxHash = newOutBoxHash;
		console.log("mediacapture loaded");
	}
	var captureError = function(error){
		console.log("video captureError" + error);
		console.log(JSON.stringify(error));
		E.EMIT("mediaCapture_captureError");
	}
	that.toggleProgress = function(){
		that.inProgress = !that.inProgress;
	}
	this.getVideo= function(id){
		if(id){
			toId = id;
		}else{
			toId = "ALL";
		}
		window.plugins.videocaptureplus.captureVideo(function(mediaFiles){
			console.log("vid captured");
			that.inProgress = true;
			mediaFile = mediaFiles[0];
			if(window.device.platform === "Android"){
				contentType = 'video/3gp';
				E.EMIT("mediaCapture_cap");
			}
			else{
				console.log("platform is not android");
				E.EMIT("mediaCapture_cap");
			}
		},captureError,{
			limit: 1,
			duration: 6,
			highquality: false,
			frontcamera: true,

		});
	}
	this.getPolicy = function(){
		var vidExtension = ".mp4";
		var me = R.getUser();
		var time = new Date().getTime();
		var vidurl = me.FbId +"_"+ time;
		var imageurl =me.FbId +"_"+ time;
		vidRef = {
			FbId: me.FbId,
			Url: vidurl+vidExtension,
			ImageUrl:imageurl,
			Num: that.num + 1,
			To: toId,
			Type: contentType
		}
		R.request('getPolicy',vidRef);
	}
	this.onPolicyReturn = function(pol){
		console.log("policy returned");
		var ft = new FileTransfer();
		var options = new FileUploadOptions();
		options.fileKey = "file";
        options.fileName = vidRef.Url;
        options.mimeType = contentType;
        options.chunkedMode = false;
        var path = mediaFile.fullPath;
        /*
        if(window.device.platform == "Android")
        	path = androidFilePath;
        */
        options.params = {
                    "key": vidRef.Url,
                    "AWSAccessKeyId": pol.awsKey,
                    "acl": "public-read",
                    "policy": pol.policy,
                    "signature": pol.signature,
                    "Content-Type": contentType
                };
         upload(ft,path,pol,options);
	}
	function upload(ft,path,pol,options){
		 ft.upload(path,"https://" + pol.bucket + ".s3.amazonaws.com/",function(result){
         	var imageExtension = "00001.png";
         	vidRef.ImageUrl+= imageExtension;
         	if(toId == "ALL"){
	         	that.selfVidUrl = vidRef.Url;
				that.selfImageUrl = vidRef.ImageUrl;
				console.log(that.selfVidUrl);
				console.log(that.selfImageUrl);
			}
         	R.request("insertVidRef",vidRef);
         	clear();
         	E.EMIT("mediaCapture_uploadSuccess");
         },function(error){
         	console.log("upload failed");
         	console.log(JSON.stringify(error));
         	console.log("retrying upload");
         	timeout += timeout;
         	setTimeout(function(){
         		upload(ft,path,pol,options);
         	},timeout);
         	E.EMIT("mediaCapture_uploadError",error);
         },options);
         ft.onprogress = function(progressEvent) {
    		if (progressEvent.lengthComputable) 
    			console.log(progressEvent.loaded / progressEvent.total);
    	}
	}
	that.incUpload = function(){
		that.num++;
	}
	function clear(){
		vidRef = undefined;
		mediaFile = undefined;
		toId = undefined;
	}

}