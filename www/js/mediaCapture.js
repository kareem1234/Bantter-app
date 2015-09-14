
function MediaCapture(eventEmitter,request){
	var E = eventEmitter;
	var R = request;
	var toId = null;
	var androidFilePath = "";
	var imageExtension = "00001.png";
	var android43Location = "file:///storage/emulated/0/DCIM/Camera";
	var android43Location2 = "file:///storage/emulated/0/";
	this.num = 0;
	var mediaFilePath;
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
		console.log("id is: "+id);
		var lim;
		if(id){
			toId = id;
			lim = 15;
		}else{
			toId = "ALL";
			lim = 7;
		}
		function callback(mediaFiles){
			console.log("vid captured");
			that.inProgress = true;
			mediaFilePath = mediaFiles[0].fullPath;
			if(window.device.platform === "Android"){
				contentType = 'video/3gp';
				var androidVersion = parseFloat(window.device.version);
				if(androidVersion === 4.3){
					getAndroidDCIMPath(function(){
						E.EMIT("mediaCapture_cap");
					});
				}else{
					E.EMIT("mediaCapture_cap");
				}
			}
			else{
				console.log("platform is not android");
				E.EMIT("mediaCapture_cap");
			}
		};
		var options = {
			limit: 1,
			duration: lim,
			highquality: true,
			frontcamera: true,
		};
		if(window.device.platform === "Android"){
			var androidVersion = parseFloat(window.device.version);
			if(androidVersion != 4.3){
				window.plugins.videocaptureplus.captureVideo(callback,captureError,options);
			}else{
				console.log("using stock capture");
				window.plugins.videocaptureplus.captureVideo(callback,captureError,options);
				//navigator.device.capture.captureVideo(callback, captureError, {duration:lim});
			}
		}else{
			window.plugins.videocaptureplus.captureVideo(callback,captureError,options);
		}
	}
	this.getPolicy = function(){
		var vidExtension = ".mp4";
		var me = R.getUser();
		var time = new Date().getTime();
		var vidurl = me.FbId +"_"+ time;
		var imageurl =me.FbId +"_"+ time;
		console.log("sending video to: "+toId);
		vidRef = {
			FbId: me.FbId,
			Url: vidurl+vidExtension,
			ImageUrl:imageurl,
			Num: that.num + 1,
			To: toId,
			Type: contentType
		};
		console.log(JSON.stringify(vidRef));
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
        var path = mediaFilePath;
        console.log(path);
        /*
        if(window.device.platform == "Android")
        	path = androidFilePath;
        */
        options.params = {
                    "key": vidRef.Url,
                    "AWSAccessKeyId": pol.awsKey,
                    "acl": "public-read",
                    "policy": pol.policy,
                    "signature": pol.signature
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
			console.log(vidRef);
         	R.request("insertVidRef",vidRef);
         	//clear();
         	E.EMIT("mediaCapture_uploadSuccess");
         },function(error){
         	console.log("upload failed");
         	console.log(JSON.stringify(error));
         	console.log("retrying upload");
         	timeout+=timeout;
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
	function getAndroidDCIMPath(callback){
		function onDr(directory){
			var directoryReader = directory.createReader();
    		directoryReader.readEntries(function(entries){
    			console.log("dcim folder length: "+entries.length);
   				mediaFilePath = android43Location2+entries[entries.length-1].fullPath;
   				callback();
    		},onDrF);
		};
		function onDrF(){
			console.log("failed read/getting directory");
		};
		
		window.resolveLocalFileSystemURL(android43Location, onDr, onDrF);
	}














}