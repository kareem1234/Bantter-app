function UserStreamLoader(eventEmitter,Request){
	var E = eventEmitter;
	var R = Request;
	var idHash = {};
	var userStream = new Array();
	var userBackup  = new Array();
	var _time = 1;
	var userRange = {};
	var maxRange = 10;
	var onUserAddedCount = 0;
	this.save = function(){
		window.localStorage.setItem("userStreamLoader_userStream",JSON.stringify(userStream));
		window.localStorage.setItem("userStreamLoader_userBackup",JSON.stringify(userBackup));
	}
	this.load = function(){
		var newStream = JSON.parse(window.localStorage.getItem("userStreamLoader_userStream"));
		if(newStream != null)
			userStream = userStream.concat(newStream);
		var newBackup = JSON.parse(window.localStorage.getItem("userStreamLoader_userBackup"));
		if(newBackup != null)
			userBackup = userBackup.concat(newBackup);
	}
	// when request come in call this function an addUsers
	// to appropiate users
	this.addUsers = function(users){
		onUserAddedCount++;
		for(var i=0; i<users.length; i++){
			if(checkHash(users[i].FbId) && checkRange(users[i]))
				userStream.push(users[i]);
			else
				userBackup.push(users[i]);
			
			if(users[i].TimeStamp > _time)
				_time = users[i].TimeStamp;
		}
		if(onUserAddedCount === 2){
			userStream = userStream.concat(userBackup);
			onUserAddedCount = 0;
			userBackup = [];
		}
		if(userStream.length > 0)
			E.EMIT("userStream_ready");
		else{
			console.log(userStream.length + " therefore not rdy");
			E.EMIT("userStream_notReady");
		}
		
	}
	// make the request to get users
	//  increment currentRange and make subsequent request
	//  after make one request to get any particular user
	this.getUsers = function(){
		R.request('findUsers',{
			time:  _time,
			range :  maxRange
		});
		R.request('findUsers',{
			time:  1,
			range :  100
		});
	}
	// return the userStream array to the userLoader
	this.returnStream = function(){
		var returnArray = userStream;
		userStream= [];
		E.EMIT("userStream_notReady");
		return returnArray;
	}
	// check to see if given user is within maxRange
	function checkRange(user){
		if( Math.abs(user.Lat-userRange.Lat) > maxRange)
			return false;
		if( Math.abs(user.Lgt-userRange.Lgt) > maxRange)
			return false;
		return true;
	}
	// setRange variables depending on user
	this.setRange = function(){
		var me = Request.getUser();
		userRange.Lat = me.Lat;
		userRange.Lgt = me.Lgt;
	}

	// check if this user has already beeen added to the stream
	// or the users most recent upload has been seen before
	function checkHash(user){
		if( idHash[user.FbId] === undefined){
			idHash[user.FbId] = user.TimeStamp ;
			return true;
		}
		if(idHash[user.FbId] < user.TimeStamp){
			idHash[user.FbId] = user.TimeStamp ;
			return true;
		}
		return false;
	}

}