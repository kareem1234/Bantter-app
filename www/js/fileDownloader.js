 function fileDownloader(EventEmitter,Request){
 	var domain = "https://s3.amazonaws.com/bantter-downloads/";
 	var R = Request;
 	var E = EventEmitter;
 	var waitingUrls = new Array();
 	var inProgressUrls = new Array();
 	var duplicateUrls = new Array();
 	var fileUrls = new Array();
 	var numDownloaded = 0;
 	var maxBuff = 4;
 	var that = this;


 	function remove_arr(array,string){
 		var index = array.indexOf(string);
 		array.splice(index,1);
 	}
 	function removeDuplicate(vidRefUrl){
 		setTimeout(function(){
 			for(var i=0;i<duplicateUrls.length;i++){
 				if(duplicateUrls[i]=== vidRefUrl){
 					duplicateUrls.splice(i,1);
 					that.dlVid(vidRefUrl);
 				}
 			}
 		},0);
 	}
 	this.dlImage = function(ImageUrl){
 		var image = new Image();
 		image.onload = function () {
  	 		console.log("image is loaded");
		};
 		image.src = domain+ImageUrl;
 	}
 	this.save = function(){
 		window.localStorage.setItem("fileDownloader_fileUrls",JSON.stringify(that.fileUrls));
 	}
 	this.load = function(){
 		var trashUrls = JSON.parse(window.localStorage.getItem("fileDownloader_fileUrls"));
 		//var newNum = JSON.parse(window.localStorage.getItem("mediaCapture_num"));
 	}
 	// download a video using the provided url and save it to the file system
 	// stores urls for later download if we have exceeded maxbuff
 	this.dlVid = function(vidRefUrl){
 		// add to waiting urls if we are fully buffed
 		if(fileUrls.length >= maxBuff){
 			waitingUrls.push(vidRefUrl);
 			return;
 		}
 		// if we have already downloaded the file
 		// add it to list of urls and emit event
 		for(var i=0;i< fileUrls.length; i++){
 				if(fileUrls[i].indexOf(vidRefUrl) > -1){
 					fileUrls.push(fileUrls[i]);
 					var data = {fileUrl: "",vidUrl:""};
 					data.fileUrl = fileUrls[i];
 					data.vidUrl = vidRefUrl;
 					E.EMIT("fileDl_gotFile",data);
 					return;
 				}
 		}
 		// if this file download is in progress
 		// and it to duplicate urls
 		for(var i=0;i< inProgressUrls.length; i++){
 			if(inProgressUrls[i].indexOf(vidRefUrl) > -1){
 				duplicateUrls.push(vidRefUrl);
 			}
 		}
 		function gotFS(fileSystem){
 			var ft = new FileTransfer();
 			var url =  domain+vidRefUrl;
 			ft.download(url,cordova.file.dataDirectory+"/"+vidRefUrl,function(entry){
 				fileUrls.push(entry.toURL());
 				remove_arr(inProgressUrls,vidRefUrl);
 				removeDuplicate(vidRefUrl);
 				var data = {fileUrl: "",vidUrl:""};
 				data.fileUrl = entry.toURL();
 				data.vidUrl = vidRefUrl;
 				E.EMIT("fileDl_gotFile",data);
 			},fail);
 		}
 		inProgressUrls.push(vidRefUrl);
 		window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, gotFS, fail);
 	}
 	// delete a video file using the provided fileUrl
 	this.deleteVid = function(fileUrl){
 		console.log("attempting to delete:"+fileUrl);
 		function onFS(fileSystem){
 			fileSystem.root.getFile(fileUrl,{create: false, exclusive: false},
 				onFileEntry,deleteFail);
 		}
 		function onFileEntry(entry){
 			entry.remove(function(){
 				console.log("file removed.... donwloading next file in line");
 				fileUrls.shift();
 				if(fileUrls.length<maxBuff)
 					that.dlVid(waitingUrls.shift());
 			},deleteFail);
 		}
 		// check for duplicate fileurls in the array and remove 1
 		var index = fileUrls.indexOf(fileUrl);
 		if(index > -1){
 			if(fileUrls.indexOf(fileUrl,index) > -1){
 				fileUrls.shift();
 				return;
 			}
 		}
 		// if no duplicates found delete file
 		if(fileUrl.indexOf("file") != -1)
 			window.requestFileSystem(LocalFileSystem.PERSISTENT,0,onFS,deleteFail);
 	}
 	// callback on general fail
 	function fail(){
 		console.log("background video download failed");
 		E.EMIT("fileDL_fail");
 	}
 	// callback on deleting fail
 	function deleteFail(){
 		console.log("background video delete failed, WARNING  this may cause unecessary file storage");
 		E.EMIT("fileDL_delete_fail");
 	}
 }