
function Notifier(eventEmitter, request){
	var E = eventEmitter;
	var R  = request;

	var that = this;

	this.notify = function(type,user){
		if(type === 'inbox'){
			cordova.plugins.notification.local.schedule({
		        id: 1,
		        title: "New Message!",
		        text: user.Name +" sent you a selfie"
	    	});
		}
	}
	this.load = function(){
		cordova.plugins.notification.local.on("click", function(notification) {
			 if( notification.id == 1){
			 	E.EMIT("notifier_inboxClicked")
			 }
		});
	}
}