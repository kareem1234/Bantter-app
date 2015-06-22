
function Notifier(eventEmitter, request){
	var E = eventEmitter;
	var R  = request;

	var that = this;

	this.notify = function(type,user){
		var name;
		var now = new Date().getTime()
		if(!user){
			name = "default";
		}
		else{
			 name =  user.Name;
		}
		if(type === 'inbox'){
			console.log("notifying");
			cordova.plugins.notification.local.schedule({
		        id: 1,
		        title: "New Message!",
		        at: now,
		        text: name +" sent you a selfie"
	    	});
		}
	};
	this.load = function(){
		console.log("loading");
		cordova.plugins.notification.local.on("click", function(notification) {
			 if( notification.id == 1){
			 	E.EMIT("notifier_inboxClicked");
			 }
		});
		cordova.plugins.notification.local.on("schedule", function(notification) {
    		console.log("scheduled: " + notification.id);
		});
	}
}