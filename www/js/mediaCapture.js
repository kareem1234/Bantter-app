
function MediaCapture(eventEmitter,request){
	var E = eventEmitter;
	var R = request;
	var toId = undefined;
	var androidFilePath = "";
	var num = 0;
	var mediaFile;
	var outBoxHash = {};
	var contentType;
	var recordedSelfie = false;
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
			if(window.device.name === "Android"){
				getAndroidFilePath(function(isDone){
					if(isDone == true)
						E.EMIT("mediaCapture_cap");
				});
			}else{
				E.EMIT("mediaCapture_cap");
			}
		},captureError,{
			limit: 1,
			duration: 7,
			highquality: false,
			frontcamera: true,

		});
	}
	function getAndroidFilePath(callback){
		console.log("fetching getting file path");
		function gotFS(fileSystem){
			var dirReader = fileSystem.root.createReader();
			dirReader.readEntries(gotEntries,fail);
		};
	    function gotEntries(entries) {
	    	for(var i = 0;i <entries.length;i++){
	    		if(entries[i].isFile == true){
	    			if( i == 0){
	    				if(entries[i].fullPath.indexOf(".3gp") >= 0){
	    					androidFilePath = entries[i].fullPath;
	    					console.log("android file path found");
	    					console.log(androidFilePath);
	    					callback(true);
	    				}
	    			}
	    		}else{
	    			var directoryReader = entries[i].fullPath.createReader();
         			directoryReader.readEntries(gotEntries, fail);
	    		}
	    	}
	    	callback(false);
    	};
    	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, gotFS, fail);

	}
	this.getPolicy = function(){
		var me = R.getUser();
		var time = new Date().getTime();
		var vidurl = me.FbId +"_"+ time+".mp4";
		var imageurl =me.FbId +"_"+ time+"-00001.png";
		vidRef = {
			FbId: me.FbId,
			Url: vidurl,
			ImageUrl:imageurl,
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
        var path = mediaFile.fullPath;
        if(window.device == "Android")
        	path = androidFilePath;
        options.params = {
                    "key": vidRef.Url,
                    "AWSAccessKeyId": pol.awsKey,
                    "acl": "public-read",
                    "policy": pol.policy,
                    "signature": pol.signature,
                    "Content-Type": contentType
                };
        ft.upload(path,"https://" + pol.bucket + ".s3.amazonaws.com/",function(result){
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
	}
	function fail(err){
		console.log("failed to find android file path");
	}

}