function User(eventEmitter,request){
	// User properties
	var Age, Gender,Id,FbId,Lat,Lgt,TimeStamp, Name;
	var R = request;
	var E = eventEmitter;
	var that = this;

	// function for returning user object
	this.returnUser = function(){
		var me = {};
	    me.Age = Age; me.Gender = Gender; me.City = City; me.Name = Name; 
		me.Id = Id; me.FbId = FbId; me.Lat = Lat; me.Lgt = Lgt; me.TimeStamp = TimeStamp;
		return me;
	}
	this.updateTimeStamp = function(){
		TimeStamp = new Date().getTime();
	}
	// save user object into local storage
	this.save = function(){
		if(!Age)
			return;
		else{
			window.localStorage.setItem("me", JSON.stringify(that.returnUser()));
		}
	}
	// function loading user object out of local storage
	this.load = function(){
		var me = window.localStorage.getItem("me");
		if(!me){
			return false;
		}
		else{
			me = JSON.parse(me);
			Age = me.Age; Gender = me.Gender; City = me.City; Name = me.Name;
			Id = me.Id; FbId = me.FbId; Lat = me.Lat; Lgt = me.Lgt; TimeStamp = me.TimeStamp;
			return me;
		}
	}


// Create a unique id for this user
	function generateId(){
 		function s4() {
    		return Math.floor((1 + Math.random()) * 0x10000)
               .toString(16)
               .substring(1);
  		}
    	return s4()+s4()+ s4()+ s4()+s4()+s4()+s4()+s4();
	}

	// send user object to server
	this.insertUser = function (){
		var _user = that.returnUser();
		R.request("insertUser",_user);
	}
	// extract age from

	// extract all strings and set variables;
	this.setData = function(data){
		FbId = generateId();
		Gender = data.gender;
		Name = data.name;
		Age = data.age;
		Id = generateId();
		TimeStamp = 0;
	}
	this.getGpsData = function(){
		function gotGps(position){
			Lat = position.coords.latitude;
			Lgt = position.coords.longitude;
			E.EMIT("user_gotGps");
		};
		function failedGps(){
			E.EMIT("user_failedGps");
		};
		navigator.geolocation.getCurrentPosition(gotGps, failedGps);
	}
}










