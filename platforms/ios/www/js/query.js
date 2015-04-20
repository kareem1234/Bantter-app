
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
		me = user;
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
			tries ++;
			if(tries %4 == 0)
				timeout = timeout + 7000;
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
					makeRequest("GET","/"+string,me);
					break;
			case "getGps":
					makeRequest("GET","/"+string,me);
					break;
		}
	}

}

