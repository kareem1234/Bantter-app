//// global emit and listen functions
function EventEmitter(){

	var EVENTLIST= []; 

	this.EMIT = function (eventName, data){
		if(!eventName){
			console.log('error no eventname specified');
			return;
		}
		if(EVENTLIST.indexOf(eventName) === -1)
			console.log();
		else{
			//console.log('event emmitted: '+eventName);
			if(data === null || data === undefined){
				var m = new CustomEvent (eventName);
				setTimeout(function(){
					document.dispatchEvent(m);
				},0);
			}else{
				var m = new CustomEvent (eventName,{"detail": data});
				setTimeout(function(){
					document.dispatchEvent(m);
				},0);
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