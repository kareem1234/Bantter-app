 function fileDownloader(EventEmitter,Request){
 	var domain = "https://s3.amazonaws.com/bantter-downloads/";
 	var R = Request;
 	var E = EventEmitter;
 	var waitingUrls = new Array();
 	var numDownloaded = 0;
 	var maxBuff = 6;
 	var that = this;
 	var downloadDates = new Array();

 	function randomExtension(){
 		return Math.random().toString(36).substring(7);
 	}
 	this.dlImage = function(ImageUrl){
 		var image = new Image();
 		image.onload = function () {

		};
 		image.src = domain+ImageUrl;
 	}
 	this.save = function(){
 		//window.localStorage.setItem("fileDownloader_fileUrls",JSON.stringify(that.fileUrls));
 	}
 	this.load = function(){
 		//var trashUrls = JSON.parse(window.localStorage.getItem("fileDownloader_fileUrls"));
 		//var newNum = JSON.parse(window.localStorage.getItem("mediaCapture_num"));
 	}
 	// for debugging
 	this.checkIfFileExist = function(fileSource){
    console.log("checkIfFileExist :"+fileSource);
 	  window.resolveLocalFileSystemURL(fileSource, function(){
      console.log("file exists and should load");
    },function(){
      console.log("file does not exist and should not load");
    });
	};
 	// download a video using the provided url and save it to the file system
 	// stores urls for later download if we have exceeded maxbuff
 	this.dlVid = function(vidRefUrl){
   		// add to waiting urls if we are fully buffed
 		if(numDownloaded >= maxBuff){
 			  waitingUrls.push(vidRefUrl);
        console.log("waiting urls size is now: "+waitingUrls.length);
        if(waitingUrls.length >= 10)
          waitingUrls.splice(0,5);
 			  return;
 		}else{
      numDownloaded ++;
 			var ft = new FileTransfer();
 			var url =  domain+vidRefUrl;
 			var newFileUrl = cordova.file.dataDirectory+"/"+randomExtension()+"_"+vidRefUrl;
      console.log(url);
 			ft.download(url,newFileUrl,function(entry){
 				var data = {fileUrl: "",vidUrl:""};
 				data.fileUrl = entry.toURL();
 				data.vidUrl = vidRefUrl;
 				E.EMIT("fileDl_gotFile",data);
 			},fail);
 		}

 	}
 	// delete a video file using the provided fileUrl
 	this.deleteVid = function(fileUrl){
    function onSuccess(directory) {
        var directoryReader = directory.createReader();
        directoryReader.readEntries(success,onError);
    }
    function success(entries) {
        for (var i=0; i<entries.length; i++) {
            if(entries[i].toURL() === fileUrl){
              entries[i].remove(function(){ 
                numDownloaded--;
                if(numDownloaded < maxBuff){
                    that.dlVid(waitingUrls.shift());
                }
              },function(){
                console.log("error deleting last used file");
              });
              ;
            }
        }
    }
    function onError(error){
      console.log("failed to read directory/ retrieve filesystem");
    }
    if(fileUrl.indexOf(cordova.file.dataDirectory) != -1){
        console.log("deleting file: "+fileUrl);
        window.resolveLocalFileSystemURL(cordova.file.dataDirectory, onSuccess,onError);
      }
    else
      console.log("is web url not deleting");
 	}
 	// callback on general fail
  function fail(error){
        console.log(JSON.stringify(error));
        numDownloaded--;
        console.log("background video download failed");
        E.EMIT("fileDL_fail");
    }
 	// callback on deleting fail
 }