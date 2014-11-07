function MediaLoader(eventEmitter,request){
	var E = eventEmitter;
	var R = request;
	var usLoader = new UserStreamLoader(E,R);
	var that = this;
	var userStream = new Array();
	this.fileDl = new fileDownloader(E,R);
	this.myLikes = null;
	this.likers = null;
	this.inboxUsers = undefined;
	var mode ='findUsers';
	var maxBuff = 10;
	var likesBuff = 2;
	this.inboxRefs = undefined;
	var inboxRefHash = {};
	var inboxViewedHash = {};
	var minBuff = 2;
	that.readyStatus = false;

	// loads all user arrays
	// and any other cached data
	this.load = function(){
		usLoader.load();
		var newStream = JSON.parse(window.localStorage.getItem("media_userStream"));
		if(newStream)
			userStream = userStream.concat(newStream);
		that.likers = JSON.parse(window.localStorage.getItem('media_likers'));
		that.myLikes = JSON.parse(window.localStorage.getItem('media_myLikes'));
		var newViewedHash = JSON.parse(window.localStorage.getItem("media_inboxViewedHash"));
		if(newViewedHash)
			inboxViewedHash = newViewedHash;
		var newInboxRefHash = JSON.parse(window.localStorage.getItem("media_inboxRefHash"));
		if(newInboxRefHash)
			inboxRefHash = newInboxRefHash;
		checkStatus();
	}
	// saves all user arrays 
	// and any other cached data
	this.save = function(){
		window.localStorage.setItem("media_userStream",JSON.stringify(userStream));
		window.localStorage.setItem("media_myLikes",JSON.stringify(that.myLikes));
		window.localStorage.setItem("media_likers",JSON.stringify(that.likers));
		window.localStorage.setItem("media_inboxViewedHash",JSON.stringify(inboxViewedHash));
		window.localStorage.setItem("media_inboxRefHash",JSON.stringify(inboxRefHash));
	}
	//should be called on startup to load cached data
	// and begin fetching user references
	this.start = function(){
		checkStatus();
		that.getAllUsers();
	}

	this.getMode = function(){
		return mode;
		//
	}

	this.markedViewed = function(vidRef){
		inboxViewedHash[vidRef.Url] = true;
		//
	}

	this.checkViewable = function(url){
		return !inboxViewedHash[url];
		//
	}
	// get mylikes likers and finduser stream
	this.getAllUsers = function(){
		usLoader.getUsers();
			R.request('findWhoILike');
			R.request('findWhoLikedMe');
			R.request('getInbox');
			R.request("findInboxUsers");
		setInterval(function(){
			R.request('findWhoILike');
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
			},1000);
		}
		if(userStream.length === 0 )
			return null;
		else
			return userStream.shift();
	}

	this.callBuffer = function(){
		buffer();
		//
	}

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
		likesBuff = 2;
		checkStatus();
		buffer();
	}

	this.onVidDl = function(data){
		console.log("changing from web url to file url");
		for(var i = 0; i< userStream.length; i++){
			if(userStream[i].refs[0].Url == data.vidUrl){
					userStream[i].refs[0].Url = data.fileUrl;
					userStream[i].refs[0].Type = 'fileUrl';
					return;
				}	
		}
		console.log("no matching url found");
	}
	// attach videoReference array to  the matching user object
	// then call checkStatus() 
	this.onRefLoad = function(refs,type){
		if(type === "findUsers"){
			for(var i = 0; i< userStream.length; i++){
				if(userStream[i].FbId === refs[0].FbId && userStream[i].refs === null){
					userStream[i].refs = refs;
					console.log("setting userstream vid ref and calling background video load");
					that.fileDl.dlVid(userStream[i].refs[0].Url);
				}
			}
		}else if(type === "findWhoILike"){
			for(var i = 0; i< that.myLikes.length; i++){
				if(that.myLikes[i].FbId === refs[0].FbId){
					that.myLikes[i].refs = refs;
					E.EMIT("media_myLikes_refLoaded",i);
				}
			}	
		}else if(type === "findWhoLikedMe"){
			for(var i = 0; i< that.likers.length; i++){
				if(that.likers[i].FbId === refs[0].FbId){
					that.likers[i].refs = refs;
					E.EMIT("media_likers_refLoaded",i);
				}
			}			
		}
		checkStatus();
	}

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

	this.setInboxUsers = function(){
		for(var i = 0; i <that.inboxUsers.length; i++){
			that.inboxUsers[i].refs = inboxRefHash[that.inboxUsers[i].FbId.toString()];
		}
		
		E.EMIT("media_inbox_loaded");
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
			that.likers = users;		
			buffer();
			E.EMIT("media_likers_loaded");
		}else if(type === 'findInboxUsers'){
			that.inboxUsers = users;
			if(that.inboxRefs && that.inboxUsers)
				that.setInboxUsers();
		}
	}
	// check if getNext can be called
	//  and set that.readyStatus variable accordingly
	function checkStatus(){
		var status = that.readyStatus;
		if(mode === "findUsers"){
			if(userStream[0] && userStream[0].refs )
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
		console.log("buffering stream of length: "+userStream.length);
		var max;
		if(mode === 'findUsers')
				max = maxBuff;
		else 
			max= minBuff;
		for(var i = 0; i< userStream.length; i++){
			if(i > max )
				return;
			if(userStream[i].refs === undefined){
				userStream[i].refs = null;
				console.log("getting video refs for user: "+userStream[i].FbId);
				R.request('getVideoRefs',{FromFbId: userStream[i].FbId,Type:"findUsers"});
			}
		}

	}
	// buffer the MyLikes
	// by retrieving associated video refs  
	function bufferMyLikes(){
		if(that.mode ==="findWhoILike")
			likesBuff = likesBuff+10;
		for(var i = 0; i< that.myLikes.length; i++){
			if(i > likesBuff )
				return;
			if(that.myLikes[i].refs === undefined){
				that.myLikes[i].refs = null;
				R.request('getVideoRefs',{FromFbId:that.myLikes[i].FbId,Type:"findWhoILike"});
			}
		}
	}
	// buffer the likers
	// by retrieving associated video refs
	function bufferLikers(){
		if(that.mode ==="findWhoLikedMe")
			likesBuff = likesBuff+10;
		for(var i = 0; i< that.likers.length; i++){
			if(i > likesBuff )
				return;
			if(that.likers[i].refs === undefined){
				that.likers[i].refs = null;
				R.request('getVideoRefs',{FromFbId:that.likers[i].FbId,Type:"findWhoLikedMe"});
			}
		}
	}	
}