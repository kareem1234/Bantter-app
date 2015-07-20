 function fileDownloader(EventEmitter,Request){
 	var domain = "https://s3.amazonaws.com/bantter-downloads/";
 	var R = Request;
 	var E = EventEmitter;

  var waintingImageUrls = new Array();
  var maxImageBuff = 2;
  var numImgDl = 0;
  var containerNum= 1;
  var waitingUrls = new Array();
 	var numDownloaded = 0;
 	var maxBuff = 6;
 	var that = this;

 	function randomExtension(){
 		return Math.random().toString(36).substring(7);
 	}
 	this.dlImage = function(ImageUrl){
    if(numImgDl >=maxImageBuff){
      waintingImageUrls.push(ImageUrl);
      return;
    }else{
      var ft = new FileTransfer();
      var url =  domain+ImageUrl;
      var newFileUrl = cordova.file.dataDirectory+"/"+randomExtension()+"_"+ImageUrl;
      ft.download(url,newFileUrl,function(entry){
        var data = {fileUrl: "",imageUrl:""};
        data.fileUrl = entry.toURL();
        data.imageUrl = ImageUrl;
        E.EMIT("fileDl_gotImageFile",data);
      },function(error){
        var data = {fileUrl: "",imageUrl:""};
        data.fileUrl = ImageUrl;
        data.imageUrl = ImageUrl;
        console.log(JSON.stringify(error));
        numImgDl--;
        console.log("background image download failed");
        E.EMIT("fileDL_ImageFail",data);
      });
    }


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
 			ft.download(url,newFileUrl,function(entry){
 				var data = {fileUrl: "",vidUrl:""};
 				data.fileUrl = entry.toURL();
 				data.vidUrl = vidRefUrl;
 				E.EMIT("fileDl_gotFile",data);
 			},function(error){
        var data = {fileUrl: "",vidUrl:""};
        data.fileUrl = vidRefUrl;
        data.vidUrl = vidRefUrl;
        console.log(JSON.stringify(error));
        numDownloaded--;
        console.log("background video download failed");
        E.EMIT("fileDL_fail",data);
      });
 		}

 	}
 	// delete a video file using the provided fileUrl
 	this.deleteVid = function(fileUrl){
    function loadNext(){
      if(fileUrl.indexOf(".mp4")=== -1){
          console.log("loading next image");
          numImgDl--;
          if(numImgDl < maxImageBuff)
            if(waintingImageUrls.length >0)
                that.dlImage(waintingImageUrls.shift());
      }else{
        console.log("loading next video");
        numDownloaded--;
        if(numDownloaded < maxBuff)
            if(waitingUrls.length>0)
                that.dlVid(waitingUrls.shift());
        }
    }
    function onSuccess(directory) {
        var directoryReader = directory.createReader();
        directoryReader.readEntries(success,onError);
    }
    function success(entries) {
        for (var i=0; i<entries.length; i++) {
            if(entries[i].toURL() === fileUrl){
              entries[i].remove(function(){ 
                  console.log("deleted: "+fileUrl);
                  loadNext();
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
        console.log(" attempting to delete file: "+fileUrl);
        window.resolveLocalFileSystemURL(cordova.file.dataDirectory, onSuccess,onError);
    }
    else
      console.log("is web url not deleting");
 	}

 	// callback on deleting fail
 }