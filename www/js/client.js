function User(eventEmitter,request){
	// User properties
	var Age, Gender,City,Id,FbId,Lat,Lgt,TimeStamp, Name;
	var R = request;
	var E = eventEmitter;
	var that = this;

	// function for returning user object
	this.returnUser = function(){
		console.log("creating user object");
		var me = {};
	    me.Age = Age; me.Gender = Gender; me.City = City; me.Name = Name; 
		me.Id = Id; me.FbId = FbId; me.Lat = Lat; me.Lgt = Lgt; me.TimeStamp = TimeStamp;
		console.log("age is: "+me.Age);
		return me;
	}
	this.updateTimeStamp = function(time){
		TimeStamp = time;
	}
	// save user object into local storage
	this.save = function(){
		if(!Age)
			return;
		else{
			console.log("saving user"+JSON.stringify(that.returnUser()));
			window.localStorage.setItem("me", JSON.stringify(that.returnUser()));
		}
	}
	// function loading user object out of local storage
	this.load = function(){
		var me = window.localStorage.getItem("me");
		if(!me){
			console.log("returning false");
			return false;
		}
		else{
			me = JSON.parse(me);
			Age = me.Age; Gender = me.Gender; City = me.City; Name = me.Name;
			Id = me.Id; FbId = me.FbId; Lat = me.Lat; Lgt = me.Lgt; TimeStamp = me.TimeStamp;
			return me;
		}
	}
	// facebook login function
	this.login = function(){
		console.log("login function called");
		var callback = function(response){
			if(response.authResponse){
				E.EMIT("signedUp");
			}else{
				E.EMIT("deniedSignUp");
			}
		};
 		facebookConnectPlugin.login( ["user_birthday","user_location"], callback,callback);	
 	}
	// get facebook data
	this.getFbData = function(){
		console.log("getting facebook data");
		var callback = function(response){
			if(response.error){
				console.log("error getting data: "+response.error);
				E.EMIT('error',response.error);
			}else{
				console.log("got data response from facebook");
				console.dir(response);
				formatFbData(response);
			}
		};
		facebookConnectPlugin.api( "me/?fields=id,name,birthday,location,gender",
		null,callback,callback);
	}
// Create a unique id for this user
	function generateId(){
 		function s4() {
    		return Math.floor((1 + Math.random()) * 0x10000)
               .toString(16)
               .substring(1);
  		}
    	return s4() + s4() + '-' + s4() + '-' + s4() + '-' +s4();
	}
	// get user  lat ang lgt cordinates
	function getCordinates(cityId){
		var callback = function(response){
			if(response.error){
				E.EMIT('error',response.error);
			}else{
				console.log(response);
				Lat = response.location.latitude;
				Lgt = response.location.longitude;
				console.log(that.returnUser());
				E.EMIT('loadedFbData');
			}
		};
		facebookConnectPlugin.api(cityId.toString(),null,callback,callback);
	}
	// send user object to server
	function insertUser(){
		var _user = that.returnUser();
		console.dir(_user);
		R.request("insertUser",_user);
	}
	// extract age from
	function parseAge(birthdate){
		console.log("birthdate : "+birthdate);
		var i = birthdate.length - 4;
		var year = birthdate.substring(i);
		year = parseInt(year);
		_age =  new Date().getFullYear() -year;
		console.log(_age);
		return _age;
	}
	// extract city from hometown string
	function parseCity(city){
		var i = city.indexOf(",");
		city = city.substring(0,i);
		console.log(city);
		return city;
	}
	function parseName(name){
		var index = name.indexOf(" ");
		name  = name.substring(0,index+2);
		return name;
	}
	function parseGender(gender){
    	return gender.charAt(0).toUpperCase() + gender.slice(1);
	}
	// extract all strings and set variables;
	function formatFbData(data){
		console.log("formatting facebook data");
		FbId = data.id;
		Gender = parseGender(data.gender);
		console.log(Gender);
		Name = parseName(data.name);
		console.log(Name);
		City = parseCity(data.location.name);
		Age = parseAge(data.birthday);
		console.log(Age);
		Id = generateId();
		console.log(Id);
		TimeStamp = 0;
		getCordinates(data.location.id);
	}
}










