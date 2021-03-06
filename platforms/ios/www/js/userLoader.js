function MediaLoader(eventEmitter,request){
	var that = this;
	var E = eventEmitter;
	var R = request;

	var usLoader = new UserStreamLoader(E,R);
	//var notifier = new Notifier(E,R);
	this.fileDl = new fileDownloader(E,R);

	var userStream = new Array();
	this.myLikes = new Array();
	this.likers = new Array();
	this.inboxUsers = new Array();
	this.inboxRefs = undefined;

	this.polllingId = -1;
	var newMessages = false;
	var mode ='findUsers';
	var inboxRefHash = {};
	var inboxViewedHash = {};
	var inboxDlHash = {};
	that.readyStatus = false;

	// loads all user arrays
	// and any other cached data
	this.load = function(){
		usLoader.load();
		var newStream = JSON.parse(window.localStorage.getItem("media_userStream"));
		if(newStream)
			userStream = userStream.concat(newStream);
		var newLikers = JSON.parse(window.localStorage.getItem('media_likers'));
		if(newLikers)
			that.likers = that.likers.concat(newLikers);
		var newInboxUsers = JSON.parse(window.localStorage.getItem('media_inboxUsers'));
		if(newInboxUsers)
			that.inboxUsers = that.inboxUsers.concat(newInboxUsers);
		var newMyLikes = JSON.parse(window.localStorage.getItem('media_myLikes'));
		if(newMyLikes)
			that.myLikes = newMyLikes;
		var newViewedHash = JSON.parse(window.localStorage.getItem("media_inboxViewedHash"));
		if(newViewedHash)
			inboxViewedHash = newViewedHash;
		var newInboxRefHash = JSON.parse(window.localStorage.getItem("media_inboxRefHash"));
		if(newInboxRefHash)
			inboxRefHash = newInboxRefHash;
		var newInboxDlHash = JSON.parse(window.localStorage.getItem("media_inboxDlHash"));
		if(newInboxDlHash)
			inboxDlHash = newInboxDlHash;

		resetStream();
		checkStatus();
		that.fileDl.load();
	}
	// saves all user arrays 
	// and any other cached data
	this.save = function(){
		usLoader.save();
		window.localStorage.setItem("media_userStream",JSON.stringify(userStream));
		window.localStorage.setItem("media_myLikes",JSON.stringify(that.myLikes));
		window.localStorage.setItem("media_likers",JSON.stringify(that.likers));
		window.localStorage.setItem("media_inboxUsers",JSON.stringify(that.inboxUsers));
		window.localStorage.setItem("media_inboxViewedHash",JSON.stringify(inboxViewedHash));
		window.localStorage.setItem("media_inboxRefHash",JSON.stringify(inboxRefHash));
		window.localStorage.setItem("media_inboxDlHash",JSON.stringify(inboxDlHash));
	}
	this.quickSave = function(){
		window.localStorage.setItem("media_userStream",JSON.stringify(userStream));
	}
	//should be called on startup to load cached data
	// and begin fetching user references
	this.start = function(){
		checkStatus();
		that.getAllUsers();
	}
	// returns the current mode
	this.getMode = function(){
		return mode;
		//
	}
	this.pushLikedUser= function(User){
		that.myLikes.unshift(User);
		removeDuplicates(that.myLikes);
		if(that.myLikes.length > 20)
			that.myLikes.pop();
		window.localStorage.setItem("media_myLikes",JSON.stringify(that.myLikes));
		buffer();
	}
	// sets whethere or not the inbox rf has been viewed
	this.markedViewed = function(vidRef){
		inboxViewedHash[vidRef.Url] = true;
		that.save();
		//
	}
	function markSeen(url){
			inboxDlHash[url] = true;
	}
	function checkSeen(url){
		console.log(inboxDlHash[url]);
		if(inboxDlHash[url])
			return true;
		else
			return false;
	}
	// check whether an inbox ref can be viewed
	this.checkViewable = function(url){
		console.log(url);
		var r = !inboxViewedHash[url];
		console.log(r);
		return r;
		//
	}
	// get mylikes likers and finduser stream
	this.getAllUsers = function(){
			usLoader.getUsers();
			R.request('findWhoLikedMe');
			R.request('getInbox');
			R.request("findInboxUsers");
		that.pollingId = setInterval(function(){
			R.request('findWhoLikedMe');
			R.request('getInbox');
			R.request("findInboxUsers");
		},60000); // 5 minitues

	}
	that.pause = function(){
		//
		clearInterval(that.pollingId);
	}
	that.resume = function(){
		var restart = function(){
			that.pollingId = setInterval(function(){
				R.request('findWhoLikedMe');
				R.request('getInbox');
				R.request("findInboxUsers");
			},1000*120);
		};
		restart();
	}
	// only get the finduser stream
	this.getUsers = function(){
		usLoader.getUsers();
		//
	}
	// return the next user in que
	// depending on the mode
	this.getNext = function(){
		checkStatus();
		if(userStream.length <= 3){
			setTimeout(function(){
				usLoader.getUsers();
			},0);
		}
		if(userStream.length === 0 )
			return null;
		else{
			return userStream.shift();
		}
	}
	// manual code to call buffer
	this.callBuffer = function(){
		buffer();
	}
	// save inbox ref in object
	// for easy tracking of viewed property
	function hashInboxRef(ref){
		inboxRefHash[ref.FbId.toString()] = ref;
		//
	}
	// when the findUserStream is ready to be process
	// this function takes users out the stream
	// then proceeds to call buffer()
	this.onStreamReady = function(){
		userStream = userStream.concat(usLoader.returnStream());
		removeDuplicates(userStream);
		for(var i=0;i<userStream.length;i++)
			console.log(userStream[i].FbId);
		buffer();
	}
	function removeDuplicates(array){
		var ids = new Array();
		for(var i =0; i<array.length;i++){
			if(ids.indexOf(array[i].FbId) === -1)
				ids.push(array[i].FbId);
			else{
				array.splice(i,1);
				i--;
			}
		}
	}
	this.getNextImage = function(){
		if(userStream[0]){
			return userStream[0].refs[0].ImageUrl;
		}else{
			return null;
		} 
	}
	// set the viewing mode to 
	// findUsers/ findWhoILike, findWhoLikedMe
	this.setMode = function(modeType){
		mode = modeType;
		checkStatus();
		buffer();
	}
	// used to add a user to the front of the stream list if its video has been downloaded to make
	// fast playable stream
	this.move2Front = function(i){
		if(userStream.length < 4 )
			return;
		function getIndex(){
			var index;
			for(var i=0;i<userStream.length;i++)
				if(!userStream[i].refs[0].WebUrl){
					index =i+1;
					console.log("setting index to: "+i);
					break;
				}
			return index;
		}
		userStream.splice(getIndex(), 0, userStream.splice(i, 1)[0]);
	}
	this._debug_checkNumFileVids = function(){
		var indexes = new Array();
		for(var i = 0; i< userStream.length;i++){
			if(userStream[i].refs[0].WebUrl)
				indexes.push(i);
		}
		console.log(JSON.stringify(indexes));
	}
	// update a video referene url with the new fileurl
	this.onVidDl = function(data){
		for(var i = 0; i< userStream.length; i++){
			if(userStream[i].refs[0].Url == data.vidUrl){
					userStream[i].refs[0].WebUrl = data.vidUrl;
					userStream[i].refs[0].Url = data.fileUrl;
					userStream[i].refs[0].Type = 'fileUrl';
					console.log("moving to front...");
					that.move2Front(i);
					that._debug_checkNumFileVids();
					checkStatus();
					return true;
				}	
		}
		console.log("could not attach vid reference");
		return false;
	}
	this.onImageDl = function(data){
		for(var i = 0; i< userStream.length; i++){
			if(userStream[i].refs[0].ImageUrl == data.imageUrl){
					userStream[i].refs[0].WebImageUrl = data.imageUrl;
					userStream[i].refs[0].ImageUrl = data.fileUrl;
					userStream[i].refs[0].Type = 'fileUrl';
					return true;
				}	
		}
		console.log("could not attach image file");
		return false;		
	}
	function getFileUrls(){
		var urls = new Array();
		for(var i=0; i<userStream.length;i++){
			if(userStream[i].refs && (userStream[i].refs[0].Type === 'fileUrl')){
				urls.push(userStream[i].refs[0].Url)
			}
		}
		return urls;
	}
	// attach videoReference array to  the matching user object
	// then call checkStatus() 
	this.onRefLoad = function(refArray,type){
		for(var x = 0 ; x<refArray.length; x++){
			var refs =  new Array(); // backwards compatibility
			refs.push(refArray[x]);
			if(type === "findUsers"){
				for(var i = 0; i< userStream.length; i++){
					if(userStream[i].FbId === refs[0].FbId && userStream[i].refs === null){
						userStream[i].refs = refs;
						that.fileDl.dlVid(userStream[i].refs[0].Url);
						that.fileDl.dlImage(userStream[i].refs[0].ImageUrl);
					}
				}
			}else if(type === "findWhoILike"){
				for(var i = 0; i< that.myLikes.length; i++){
					if(that.myLikes[i].FbId === refs[0].FbId){
						that.myLikes[i].refs = refs;
						//move2back(i,that.myLikes);
					}
				}	
			}else if(type === "findWhoLikedMe"){
				for(var i = 0; i< that.likers.length; i++){
					if(that.likers[i].FbId === refs[0].FbId){
						that.likers[i].refs = refs;
						//move2back(i,that.likers);
					}
				}			
			}
		}
		checkStatus();
	}
	// callback for when inboxreferences are returned from server
	// hashes them and sets wether viewable property
	this.onInboxRefLoad = function(refs){
		newMessages = false;
		console.log("got inbox refs: "+JSON.stringify(refs));
		for(var i =0; i < refs.length; i++){
			hashInboxRef(refs[i]);
			if(!checkSeen(refs[i].Url)){
				newMessages = true;
			}
			markSeen(refs[i].Url);
		}
		that.inboxRefs = refs;
		if(that.inboxRefs && that.inboxUsers){
				that.setInboxUsers();
			}
		that.save();
	}
	// callback when both inbox users and inbox refs are loaded
	// attaches inboxrefs to inboxusers
	this.setInboxUsers = function(){
		console.log("inbox user length: "+that.inboxUsers.length);
		for(var i = 0; i <that.inboxUsers.length; i++){
			that.inboxUsers[i].refs = [];
			that.inboxUsers[i].refs[0] = inboxRefHash[that.inboxUsers[i].FbId.toString()];
		}
		sortInbox();
		if(newMessages){
			E.EMIT("media_inbox_newMessages");
			newMessages = false;
		}
		E.EMIT("media_inbox_loaded");
	}
	function sortInbox(){
		// new messages from people i have replied to first
		// then new messages
		// then old convos
	}
	// when a user array response comes from the server
	// call the appropiate action and call buffer if needed
	this.onUserLoad = function(users,type){
		if(type === "findUsers"){
			usLoader.addUsers(users);
		}else if(type === "findWhoILike"){
			that.myLikes = addUsers(users,that.myLikes);
			buffer();
			E.EMIT("media_myLikes_loaded");
		}else if(type === "findWhoLikedMe"){
			that.likers = addUsers(users,that.likers);
			buffer();
			E.EMIT("media_likers_loaded");
		}else if(type === 'findInboxUsers'){
			that.inboxUsers = addUsers(users,that.inboxUsers);
			if(that.inboxRefs && that.inboxUsers){
				that.setInboxUsers();
			}
		}
	}
	//COULD BE EXPENSIVE FUNCTION
	// not properly adding to inbxousers
	function addUsers(newUsers, oldUsers){
		var onlyInUsers = newUsers.filter(function(current_us){
    		return oldUsers.filter(function(current_ls){
        			return current_us.FbId == current_ls.FbId;
    			}).length == 0;
		});
		oldUsers = oldUsers.concat(onlyInUsers);
		removeDuplicates(oldUsers);
		return oldUsers;
	};
	// check if getNext can be called
	//  and set that.readyStatus variable accordingly
	function checkStatus(){
		var status = that.readyStatus;
		if(mode === "findUsers"){
			if(userStream[0] && userStream[0].refs && userStream[0].refs[0].WebUrl)
				that.readyStatus = true;
			else{
				that.readyStatus = false;
			}
		}else if(mode === "findWhoILike"){
			if(that.myLikes  && that.myLikes[0].refs)
				that.readyStatus = true;
			else
				that.readyStatus = false;
		}else if(mode === "findWhoLikedMe"){
			if(that.likers && that.likers[0] && that.likers[0].refs)
				that.readyStatus = true;
			else
				that.readyStatus = false;
		}
		if(! (status && that.readyStatus)){
			if(that.readyStatus){
				console.log("media is ready...");
				E.EMIT("media_ready");
			}
			else{
				console.log("media is NOT ready...");
				E.EMIT("media_notReady");
			}
		}
	}
	function resetStream(){
		for(var i=0;i<userStream.length;i++){
			if(userStream[i].refs === null)
				userStream[i].refs = undefined;
			if(userStream[i].refs && userStream[i].refs[0].Url){
				if(!userStream[i].refs[0].WebUrl){
						that.fileDl.dlVid(userStream[i].refs[0].Url);
				}
				if(!userStream[i].refs[0].WebImageUrl){
						that.fileDl.dlImage(userStream[i].refs[0].ImageUrl);
				}
			}

		}
	}
	// call individual buffer functions
	function buffer(){
		bufferStream();
		if(that.likers)
			bufferLikers();
		if(that.myLikes)
			bufferMyLikes();
	}
	// buffer the findUserStream
	// by retrieving associated video refs
	function bufferStream(){
		var temp = new Array();
		for(var i = 0; i< userStream.length; i++){
			if(userStream[i].refs === undefined){
				userStream[i].refs = null;
				temp.push(userStream[i].FbId);
				//R.request('getVideoRefs',{FromFbId: userStream[i].FbId,Type:"findUsers"});
			}
		}
		if(temp.length > 0){
			R.request('getVideoRefs',{FromFbId: temp ,Type:"findUsers"});
		}
	}
	// buffer the MyLikes
	// by retrieving associated video refs  
	function bufferMyLikes(){
		var temp = new Array();
		for(var i = 0; i< that.myLikes.length; i++){
			if(that.myLikes[i].refs === undefined){
				that.myLikes[i].refs = null;
				//R.request('getVideoRefs',{FromFbId:that.myLikes[i].FbId,Type:"findWhoILike"});
				temp.push(that.myLikes[i].FbId);
			}
		}
		if(temp.length > 0)
			R.request('getVideoRefs',{FromFbId:temp,Type:"findWhoILike"})
	}
	// buffer the likers
	// by retrieving associated video refs
	function bufferLikers(){
		var temp = new Array();
		for(var i = 0; i< that.likers.length; i++){
			if(that.likers[i].refs === undefined){
				that.likers[i].refs = null;
				temp.push(that.likers[i].FbId);
				//R.request('getVideoRefs',{FromFbId:that.likers[i].FbId,Type:"findWhoLikedMe"});
			}
		}
		if(temp.length > 0)
			R.request('getVideoRefs',{FromFbId:temp,Type:"findWhoLikedMe"});
	}	
}