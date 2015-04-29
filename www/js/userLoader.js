function MediaLoader(eventEmitter,request){
	var that = this;
	var E = eventEmitter;
	var R = request;

	var usLoader = new UserStreamLoader(E,R);
	var notifier = new Notifier(E,R);
	this.fileDl = new fileDownloader(E,R);

	var userStream = new Array();
	this.myLikes = new Array();
	this.likers = new Array();
	this.inboxUsers = new Array();
	this.inboxRefs = undefined;

	this.polllingId = -1;
	var lastUser = null;
	var mode ='findUsers';
	var inboxRefHash = {};
	var inboxViewedHash = {};
	that.readyStatus = false;

	// loads all user arrays
	// and any other cached data
	this.load = function(){
		usLoader.load();
		notifier.load();
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

		lastUser = JSON.parse(window.localStorage.getItem("media_lastUser"));
		if(lastUser){
			that.fileDl.deleteVid(lastUser.refs[0].Url);
		}
		checkStatus();
	}
	// saves all user arrays 
	// and any other cached data
	this.save = function(){
		window.localStorage.setItem("media_userStream",JSON.stringify(userStream));
		window.localStorage.setItem("media_myLikes",JSON.stringify(that.myLikes));
		window.localStorage.setItem("media_likers",JSON.stringify(that.likers));
		window.localStorage.setItem("media_inboxUsers",JSON.stringify(that.inboxUsers));
		window.localStorage.setItem("media_inboxViewedHash",JSON.stringify(inboxViewedHash));
		window.localStorage.setItem("media_inboxRefHash",JSON.stringify(inboxRefHash));
		window.localStorage.setItem("media_lastUser",JSON.stringify(lastUser));
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
		that.myLikes.push(User);
		buffer();
	}
	// sets whethere or not the inbox ref has been viewed
	this.markedViewed = function(vidRef){
		inboxViewedHash[vidRef.Url] = true;
		//
	}
	// check whether an inbox ref has been viewed
	this.checkViewable = function(url){
		return !inboxViewedHash[url];
		//
	}
	// get mylikes likers and finduser stream
	this.getAllUsers = function(){
		if(userStream.length<10)
			usLoader.getUsers();

			R.request('findWhoILike');
			R.request('findWhoLikedMe');
			R.request('getInbox');
			R.request("findInboxUsers");
		that.pollingId = setInterval(function(){
			R.request('findWhoLikedMe');
			R.request('getInbox');
			R.request("findInboxUsers");
		},300000); // 5 minitues

	}
	that.pause = function(){
		//
		clearInterval(that.pollingId);
	}
	that.resume = function(){
		that.pollingId = setInterval(function(){
			R.request('findWhoLikedMe');
			R.request('getInbox');
			R.request("findInboxUsers");
		},1000*120);
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
		if(userStream.length === 1){
			setTimeout(function(){
				usLoader.getUsers();
			},0);
		}
		if(userStream.length === 0 )
			return null;
		else{
			lastUser = userStream.shift();
			return lastUser;
		}
	}
	// manual code to call buffer
	this.callBuffer = function(){
		buffer();
		//
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
		buffer();
	}
	// set the viewing mode to 
	// findUsers/ findWhoILike, findWhoLikedMe
	this.setMode = function(modeType){
		mode = modeType;
		checkStatus();
		buffer();
	}
	// update a video referene url with the new fileurl
	this.onVidDl = function(data){
		for(var i = 0; i< userStream.length; i++){
			if(userStream[i].refs[0].Url == data.vidUrl){
					userStream[i].refs[0].WebUrl = data.vidUrl;
					userStream[i].refs[0].Url = data.fileUrl;
					userStream[i].refs[0].Type = 'fileUrl';
					return;
				}	
		}
		checkStatus();
	}

	function move2back(index,array){
		array.push(array.splice(index,index+1)[0]);
	};
	// attach videoReference array to  the matching user object
	// then call checkStatus() 
	this.onRefLoad = function(refArray,type){
		for(var x = 0 ; x<refArray.length; x++){
			var refs =  new Array(refArray[x]); // backwards compatibility
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
						move2back(i,that.myLikes);
						return;

					}
				}	
			}else if(type === "findWhoLikedMe"){
				console.log(JSON.stringify(that.likers));
				for(var i = 0; i< that.likers.length; i++){
					if(that.likers[i].FbId === refs[0].FbId){
						that.likers[i].refs = refs;
						move2back(i,that.likers);
					}
				}			
			}
		}
		checkStatus();
	}
	// callback for when inboxreferences are returned from server
	// hashes them and sets wether viewable property
	this.onInboxRefLoad = function(refs){
		for(var i =0; i < refs.length; i++){
			hashInboxRef(refs[i]);
			if(inboxViewedHash[refs[i].url])
				refs[i].viewable = false;
			else
				refs[i].viewable = true;
		}
		that.inboxRefs = refs;
		if(that.inboxRefs && that.inboxUsers)
				that.setInboxUsers();
	}
	// callback when both inbox users and inbox refs are loaded
	// attaches inboxrefs to inboxusers
	this.setInboxUsers = function(){
		for(var i = 0; i <that.inboxUsers.length; i++){
			that.inboxUsers[i].refs = inboxRefHash[that.inboxUsers[i].FbId.toString()];
		}
		sortInbox();
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
			that.myLikes = users;
			buffer();
			E.EMIT("media_myLikes_loaded");
		}else if(type === "findWhoLikedMe"){
			addLikers(users);
			buffer();
			E.EMIT("media_likers_loaded");
		}else if(type === 'findInboxUsers'){
			console.log("got inbox users");
			console.log(JSON.stringify(users));
			addInboxUsers(users);
			if(that.inboxRefs && that.inboxUsers)
				that.setInboxUsers();
		}
	}
	//COULD BE EXPENSIVE FUNCTION
	function addLikers(userarray){
		var onlyInUsers = userarray.filter(function(current_us){
    			return that.likers.filter(function(current_ls){
        			return current_us.FbId == current_ls.FbId;
    		}).length == 0;
		});
		that.likers = that.likers.concat(onlyInUsers);
	};
	function addInboxUsers(userarray){
		var onlyInUsers = userarray.filter(function(current_us){
    			return that.inboxUsers.filter(function(current_ls){
        			return current_us.FbId == current_ls.FbId;
    		}).length == 0;
		});
		that.inboxUsers = that.inboxUsers.concat(onlyInUsers);
		if(onlyInUsers.length > 0){
			that.notifier.notify("inbox",onlyInUsers[0]);
		}
	}
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
			if(that.readyStatus)
				E.EMIT("media_ready");
			else
				E.EMIT("media_notReady");
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
		if(temp.length > 0)
			R.request('getVideoRefs',{FromFbId: temp ,Type:"findUsers"});
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