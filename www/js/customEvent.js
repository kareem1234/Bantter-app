//// global emit and listen functions
function EventEmitter(){

	var EVENTLIST= []; 

	this.EMIT = function (eventName, data){
		if(!eventName){
			console.log('error no eventname specified');
			return;
		}
		if(EVENTLIST.indexOf(eventName) === -1)
			console.log('error emmited unregistered event: '+ eventName);
		else{
			//console.log('event emmitted: '+eventName);
			if(data === null || data === undefined){
				var m = new CustomEvent (eventName);
  				document.dispatchEvent(m);
			}else{
				var m = new CustomEvent (eventName,{"detail": data});
  				document.dispatchEvent(m);
			}

		}
	};

	this.LISTEN = function(eventName, callback){
		EVENTLIST.push(eventName);
		document.addEventListener(eventName,function(e){
			callback(e.detail);
		});
	};

}