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
	var fetching = false;
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
			fetching = false;
			if(userStream.length<6)
				userStream = userStream.concat(userBackup);
			onUserAddedCount = 0;
			userBackup = [];
		}
		if(userStream.length > 0)
			E.EMIT("userStream_ready");
		else{
			E.EMIT("userStream_notReady");
		}
		
	}
	this.load = function(){
		window.localStorage.getItem("UserStreamLoader_time",JSON.stringify(_time));
	}
	this.save = function(){
		window.localStorage.setItem("UserStreamLoader_time", JSON.stringify(_time));
	}
	// make the request to get users
	//  increment currentRange and make subsequent request
	//  after make one request to get any particular user
	this.getUsers = function(){
		fetching = true;
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
		shuffle(userStream);
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
	function shuffle(o){
		for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
		return o;
	}

}