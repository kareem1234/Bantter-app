
function Request(EventEmitter){
	/*var domain = "http://localhost:3000";*/
	var domain = "https://bantter.herokuapp.com";
	var me;
	var E = EventEmitter;
	var that = this;
	var timeout = 1000;
	var tries = 3;
	// set internal user object
	this.setUser = function(user){
		console.log("setting user");
		console.log("my id: "+user.FbId);
		me = user;
		me.VidRef = null;
		me.FromFbId = null;
		me.Type = null;
		me.Range= null;
		me.Time =null;
		me.Like = null;
		console.log(JSON.stringify(me));
		//
	}
	// return internal user object
	this.getUser = function(){
		return me;
		//
	}
	// make a request to the server
	/// try  request again on fail
	// ideally with exponential timeout retries
	function makeRequest(Type,URL,Data){
		const requestData = Data;
		$.ajax({
			url: domain+URL,
			type: Type,
			data: requestData
		}).done(function(response){
			if(timeout > 0){
				tries = 0;
				timeout = 2000;
			}
			E.EMIT("complete"+URL,{res:response,req:requestData});
		}).fail(function(error){
				console.log(JSON.stringify(error));
				timeout += timeout;
			E.EMIT("failed"+URL,error);
			setTimeout(function(){
				makeRequest(Type,URL,requestData);
			},timeout);
		});
	}
	// attach data to request and set type depending on url
	this.request = function(string,data){
		switch(string){
			case "insertLike" :
				me.Like = data;
				makeRequest("POST","/"+string,me)
				break;
			case "getPolicy" :
					me.VidRef = data;
					makeRequest("POST","/"+string,me);
					break;
			case "insertVidRef" :
					me.VidRef = data;
					makeRequest("POST","/"+string,me);
					break;
			case "insertUser" :
					makeRequest("POST","/"+string,me);
					break;
			case "findWhoLikedMe" :
					makeRequest("GET","/"+string,me);
					break;
			case 'findWhoILike' :
					makeRequest("GET","/"+string,me);
					break;
			case  'getVideoRefs' :
				   me.FromFbId = data.FromFbId;
				   me.Type = data.Type;
				   makeRequest("GET","/"+string,me);
				   break;
			case  "findUsers" :
					me.Range = data.range;
					me.Time	 = data.time;
					makeRequest('GET',"/"+string,me);
					break;
			case 'getInbox' :
				   makeRequest("GET","/"+string,me);
				   break;
			case "findInboxUsers" :
					console.log(me.Id);
					console.log(me.FbId);
					makeRequest("GET","/"+string,me);
					break;
			case "getGps":
					makeRequest("GET","/"+string,me);
					break;
		}
	}

}

