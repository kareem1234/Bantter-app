
function Likes(eventEmitter, Request){
	var E = eventEmitter;
	var R = Request;
	var that = this;
	var maxBuffer = 2;
	var likes = new Array();
	this.save = function(){
		window.localStorage.setItem("likes_likesArray",JSON.stringify(likes));
	}
	this.load = function(){
		var newLikes = JSON.parse(window.localStorage.getItem("likes_likesArray"));
		if(newLikes)
			likes = likes.concat(newLikes);
	}
	this.addLike = function(toId){
		var like = {
			From: R.getUser().FbId,
			To: toId
		};
		likes.push(like);
		if(likes.length >= maxBuffer){
			that.upload();
		}
	}
	this.upload = function(){
		R.request('insertLike',likes);
		likes =  new Array();
	}
}