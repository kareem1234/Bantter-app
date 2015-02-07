function View (EventEmitter){
	var E = EventEmitter;
	var that = this;
	var menuSet = false;
	var inboxSet = false;
	var myLikesSet = false;
	var likersSet = false;
	var prevSelected = undefined;
	var playing = false;
	var optionsVisible = false;
	this.streamLoading = false;
	var domain = 'https://s3.amazonaws.com/bantter-downloads/';
	this.currentView ="";
	this.init = function(){
		initVidControll();
		$("#mainPage_likes_controlBut").bind("tap",function(){
			E.EMIT("view_likesControll_taped");
		});
		$('#loadingContainer_background, #loadingContainer_play').bind("tap",function(){
			if(that.currentView=="streamView"){
				console.log("video taped");
				if(playing == false){
					console.log("video not playing");
					displayVidLoad(false);
					var vid = $('#mainPage_selfies_selfieVid').get(0);
					setTimeout(function(){
						vid.load();
						vid.play();
						playing = true;
					},1);
				}
			}
		});
		$("#videoPopUpModal, #popUpOverlay_background, popUpOverlay_play").bind("tap",function(){
			console.log("video taped");
			if(playing == false){
				console.log("video not playing");
				var vid = $("#videoPopUp").get(0);
				displayVidLoad(true);
				setTimeout(function(){
					vid.load();
					vid.play();
					playing = true;
				},1);
			}else
				console.log("video is playing");
		});
	}
	function initVidControll(){
		$("#videoPopUp").bind("timeupdate",function(){
			var vid = $(this).get(0);
			if(vid.currentTime > 0)
				removeVidLoad(true);
		}).bind("ended",function(){
			$(this).get(0).currentTime=0;
			$(this).get(0).play();
		}).get(0).loop=false;
		$("#mainPage_selfies_selfieVid").bind("ended",function(){
			$(this).get(0).currentTime=0;
			$(this).get(0).play();
			enableThumbs();
		}).bind("timeupdate",function(){
			var vid = $(this).get(0);
			if(vid.currentTime > 0)
				removeVidLoad(false);
		}).get(0).loop=false;
	}
	function clearBox(){
		$("#mainPage_likes_menuAction1").unbind("tap").text("");
		$("#mainPage_likes_menuAction2").unbind("tap").text("");

	}
	this.setLoadingView = function(){
		that.currentView='loadingView';
		$("#loginPage").addClass("notActive");
		$("#mainPage").addClass("notActive");
		$("#loadingPage").removeClass("notActive");
	}
	this.streamViewDisplayNext = function(user){
		console.log("video url is: "+user.refs[0].Url);
		$("#loadingContainer_background").attr("src",user.refs[0].ImageUrl);
		displayVidLoad(false);
		$("#mainPage_selfies_city").text(user.City);
		$("#mainPage_selfies_name").text(user.Name+","+" "+user.Age);
		var vid = $("#mainPage_selfies_selfieVid");
		if(user.refs[0].Url.indexOf("file") == -1)
			vid.get(0).src=domain+user.refs[0].Url;
		else
			vid.get(0).src=user.refs[0].Url;
		setTimeout(function(){
			vid.get(0).load();
			vid.get(0).play();
			//scaleToFill();
			disableThumbs();
		},0);

	}
	this.toggleOptionsMenu = function(){
		var options = $("#optionsMenu");
		if (optionsVisible == true){
			console.log("hiding options menu");
			optionsVisible = false;
			options.addClass("notActive");
		}
		else{
			console.log("showing options menu");
			optionsVisible=true;
			options.removeClass("notActive");
		}
	}
	function disableThumbs(){
		$("#mainPage_selfies_thumbsUp").hide(0);
		$("#mainPage_selfies_thumbsDown").hide(0);
	}
	function enableThumbs(){
		$("#mainPage_selfies_thumbsUp").show(0);
		$("#mainPage_selfies_thumbsDown").show(0);
	}
	function displayVidLoad(popUpBool){
		console.log("display vid load");
		if(!popUpBool){
			$("#mainPage_selfies_loadingContainer").removeClass("notActive");
			$("#loadingContainer_play").addClass("notActive");
			$("#loadSpinner").removeClass("notActive");
		}
		else{
			$("#popUpOverlay").removeClass("notActive");
			$("#popUpOverlay_play").addClass("notActive");
			$("#loadSpinner2").removeClass("notActive");
		}

	}
	function scaleToFill() {
		var vid = document.getElementById('mainPage_selfies_selfieVid');
	    var $video = $(vid),
	        videoRatio = vid.videoWidth / vid.videoHeight,
	        tagRatio = $video.width() / $video.height();
	    if (videoRatio < tagRatio) {
	            $video.css('-webkit-transform','scaleX(' + tagRatio / videoRatio  + ')');
	            $video.css('-moz-transform','scaleX(' + tagRatio / videoRatio  + ')');
	            $video.css('-ms-transform','scaleX(' + tagRatio / videoRatio  + ')');
	            $video.css('transform','scaleX(' + tagRatio / videoRatio  + ')');
	    } else if (tagRatio < videoRatio) {
	            $video.css('-webkit-transform','scaleY(' + videoRatio / tagRatio  + ')');
	            $video.css('-moz-transform','scaleY(' + videoRatio / tagRatio  + ')');
	            $video.css('-ms-transform','scaleY(' + videoRatio / tagRatio  + ')');
	            $video.css('transform','scaleY(' + videoRatio / tagRatio  + ')');
	    }
}
	function removeVidLoad(popUpBool){
		if(!popUpBool)
			$("#mainPage_selfies_loadingContainer").addClass("notActive");
		else
			$("#popUpOverlay").addClass("notActive");
	}
	function displayVidPlay(imageUrl,popUpBool){
		console.log("display vid play called");
		if(!popUpBool){
			var loadingContainer = $("#loadingContainer_background");
			$("#mainPage_selfies_loadingContainer").removeClass("notActive");
			loadingContainer.removeClass("notActive");
			$("#loadSpinner").addClass("notActive");
			$("#loadingContainer_play").removeClass("notActive");
			loadingContainer.attr("src",imageUrl);
		}else{
			console.log("else reached");
			var loadingContainer = $("#popUpOverlay_background");
			$("#popUpOverlay").removeClass("notActive");
			loadingContainer.removeClass("notActive");
			$("#loadSpinner2").addClass("notActive");
			$("#popUpOverlay_play").removeClass("notActive");
			loadingContainer.attr("src", imageUrl);
		}
	}
	this.displayInfo = function(text){
		$("#modal-title2").html(text);
		$("#infoPopUp").modal('show');
		setTimeout(function(){
			$("#infoPopUp").modal("hide");
		},4000);

	}
	this.streamViewRemoveLoading = function(){
		that.streamLoading = false;
		$(".spinner").addClass("notActive");
		$("#mainPage_selfies_thumbsUp").removeClass("disabled");
		$("#mainPage_selfies_thumbsDown").removeClass("disabled");
	}
	this.streamViewDisplayLoading = function(){
		that.streamLoading = true;
		$(".spinner").removeClass("notActive");
		$("#mainPage_selfies_thumbsUp").addClass("disabled");
		$("#mainPage_selfies_thumbsDown").addClass("disabled");
	}
	this.setUserViewPopUp = function(user){
		var vid = $("#videoPopUp");
		if(that.currentView ==="inboxView"){
			vid.get(0).src=domain+user.refs.Url;
			displayVidPlay(user.refs.ImageUrl,true);
		}
		else{
			vid.get(0).src=domain+user.refs[0].Url;
			displayVidPlay(user.refs[0].ImageUrl,true);
		}
		playing = false;
		$("#videoPopUpModal").modal('toggle');
	}
	this.setSelfViewPopUp = function(imageUrl,vidUrl){
		var vid = $("#videoPopUp");
		vid.get(0).src=domain+vidUrl;
		displayVidPlay(imageUrl,true);
		playing = false;
		$("#videoPopUpModal").modal('toggle');
	}
	this.setLoginView = function(loginFunc){
		that.currentView='loginView';
		$("#mainPage").addClass("notActive");
		$("#loadingPage").addClass("notActive");
		$("#loginPage").removeClass("notActive");
		$("#loginPage_fbLogin").bind("click",loginFunc);
	}
	this.setMenu = function(){
		if(!menuSet){
			menuSet = true;
			$("#mainPage_menu_likes").bind("tap",function(){
				E.EMIT("viewMenu_likes_taped");
			});
			$("#mainPage_menu_selfies").bind("tap",function(){
				E.EMIT("viewMenu_selfies_taped");
			});
			$("#mainPage_menu_inbox").bind("tap",function(){
				E.EMIT("viewMenu_inbox_taped");
			});
			$("#mainPage_menu_vidIcon").bind("tap",function(){
				E.EMIT("viewMenu_vidIcon_taped");
			});
			$("#mainPage_menu_optionsIcon").bind('touchstart',function(){
				E.EMIT("viewMenu_options_taped");
			});
			$("#profileVidLink").bind('touchstart',function(){
				E.EMIT("viewMenu_profileLink_taped");
			});
		}
	}
	this.setStreamView = function(user){
		console.log("video url is: "+user.refs[0].Url);
		that.currentView='streamView';
		$("#mainPage_selfies").removeClass("notActive");
		$("#mainPage_people").addClass("notActive");
		$("#loginPage").addClass("notActive");
		$("#loadingPage").addClass("notActive");
		$("#mainPage_selfies_thumbsUp").unbind('tap').bind("tap",function(){
			playing = false;
			if( ! $(this).hasClass('disabled'))
				E.EMIT("streamView_thumbsUp_taped");
		});
		$("#mainPage_selfies_thumbsDown").unbind('tap').bind("tap",function(){
			playing = false;
			if( ! $(this).hasClass('disabled'))
				E.EMIT("streamView_thumbsDown_taped");
		});
		that.setMenu();
		$("#mainPage_selfies_name").text(user.Name+","+" "+user.Age);
		$("#mainPage_selfies_city").text(user.City);
		var vid = $("#mainPage_selfies_selfieVid");
		if(user.refs[0].Url.indexOf("file") == -1)
			vid.get(0).src=domain+user.refs[0].Url;
		else
			vid.get(0).src=user.refs[0].Url;
		displayVidPlay(user.refs[0].ImageUrl,false);
		playing = false;
		disableThumbs();
		$("#mainPage").removeClass("notActive");
	}
	this.displayPeopleLoading = function(inbox){
		that.currentView='peopleLoading';
		$("#loginPage").addClass("notActive");
		$("#loadingPage").addClass("notActive");
		$("#mainPage_likes_controlCont").addClass("notActive");
		$("#mainPage_selfies").addClass("notActive");
		$("#mainPage_people_myLikes").addClass("notActive");
		$("#mainPage_people_likers").addClass("notActive");
		$("#mainPage_people_menu").addClass("notActive");
		$("#mainPage_people_inbox").addClass("notActive");
		//$(".spinner3").addClass("notActive");

				// adding to view
		if(!inbox)
			$("#mainPage_likes_controlCont").removeClass("notActive");
		$("#mainPage").removeClass("notActive");
		$("#mainPage_people").removeClass("notActive");
		$(".spinner3").removeClass("notActive");
	}
	this.updateInboxView = function(){
		that.currentView='inboxView';
		that.setMenu();
		clearBox();
		// removing from view
		$("#loginPage").addClass("notActive");
		$("#loadingPage").addClass("notActive");
		$("#mainPage_likes_controlCont").addClass("notActive");
		$("#mainPage_selfies").addClass("notActive");
		$("#mainPage_people_myLikes").addClass("notActive");
		$("#mainPage_people_likers").addClass("notActive");
		$(".spinner3").addClass("notActive");

				// adding to view
		$("#mainPage_likes_controlCont").removeClass("notActive").css("visibility","hidden");
		$("#mainPage").removeClass("notActive");
		$("#mainPage_people_menu").removeClass("notActive");
		$("#mainPage_people").removeClass("notActive");
		$("#mainPage_people_inbox").removeClass("notActive");

		//
		$("#mainPage_likes_menuTitle").html("My Inbox");
	}
	this.updateMyLikesView = function(){
		that.currentView ='myLikesView';
		that.setMenu();
		clearBox();

		// removing from view
		$("#loginPage").addClass("notActive");
		$("#loadingPage").addClass("notActive");
		$("#mainPage_likes_controlCont").addClass("notActive");
		$("#mainPage_selfies").addClass("notActive");
		$("#mainPage_people_inbox").addClass("notActive");
		$("#mainPage_people_likers").addClass("notActive");
		$(".spinner3").addClass("notActive");

				// adding to view
		$("#mainPage_likes_controlCont").removeClass("notActive").css("visibility","visible");
		$("#mainPage").removeClass("notActive");
		$("#mainPage_people_menu").removeClass("notActive");
		$("#mainPage_people").removeClass("notActive");
		$("#mainPage_people_myLikes").removeClass("notActive");

		//
		$("#mainPage_likes_menuTitle").html("My Likes");
	}
	this.updateLikersView = function(){
		that.currentView='likersView';
		that.setMenu();
		clearBox();
		// removing from view
		$("#loginPage").addClass("notActive");
		$("#loadingPage").addClass("notActive");
		$("#mainPage_likes_controlCont").addClass("notActive");
		$("#mainPage_selfies").addClass("notActive");
		$("#mainPage_people_myLikes").addClass("notActive");
		$("#mainPage_people_inbox").addClass("notActive");
		$(".spinner3").addClass("notActive");

				// adding to view
		$("#mainPage_likes_controlCont").removeClass("notActive").css("visibility","visible");
		$("#mainPage").removeClass("notActive");
		$("#mainPage_people_menu").removeClass("notActive");
		$("#mainPage_people").removeClass("notActive");
		$("#mainPage_people_likers").removeClass("notActive");

		//
		$("#mainPage_likes_menuTitle").html("My Fans");
	}
	this.setInboxView = function(inboxUsers,viewFunction){
			inboxSet = true;
			that.updateInboxView();
			$("#mainPage_people_inbox").empty().on('scroll',checkScroll);
			console.log("inboxusers.length is: "+inboxUsers.length);
			console.log("visible height is:"+ $('#mainPage_people').height() );
			for(var i = 0; i<inboxUsers.length;i++){
				console.log("iteration");
				var likesRowDiv = document.createElement("div");
				likesRowDiv.className = "likesRow row row-xs-height";
				var picDiv = document.createElement("div");
				picDiv.className = "col-xs-3 col-xs-height col-top";
				var picDivImg = document.createElement("img");
				picDivImg.className ="mainPage_likes_profilePic";
				picDivImg.src="http://graph.facebook.com/" + inboxUsers[i].FbId+"/picture?type=square";
				var nameDiv = document.createElement("div");
				nameDiv.className = "col-xs-7 col-xs-height col-top";
				nameDiv.innerHTML = inboxUsers[i].Name;
				var iconDiv = document.createElement("div");
				iconDiv.className ="col-xs-2 col-xs-height col-top";
				if(that.mediaLoader.checkViewable(inboxUsers[i].refs.Url)){
					var iconImage = document.createElement("img");
					iconImage.className ="newInboxIcon";
					iconImage.src ="./img/starIcon.jpg";
					iconDiv.appendChild(iconImage);
				}
				picDiv.appendChild(picDivImg);
				likesRowDiv.appendChild(picDiv);
				likesRowDiv.appendChild(nameDiv);
				likesRowDiv.appendChild(iconDiv);
				document.getElementById("mainPage_people_inbox").appendChild(likesRowDiv);
			}
			$(".likesRow").bind("tap",function(e){
				e.preventDefault();
				if(prevSelected)
					prevSelected.removeClass("selectedLikesRow");
				prevSelected = $(this);
				prevSelected.addClass("selectedLikesRow");
				var index = prevSelected.index();
				var actionBut1 = $("#mainPage_likes_menuAction1");
				if(that.mediaLoader.checkViewable(inboxUsers[index].refs.Url)){
					actionBut1.text("View");
					actionBut1.unbind("tap").bind("tap",function(e){
						e.preventDefault();
						viewFunction(index);
					});
				}else{
					actionBut1.text(" ");
				}
				var actionBut = $("#mainPage_likes_menuAction2");
				actionBut.unbind("tap").bind("tap",function(e){
					e.preventDefault();
					E.EMIT("inboxView_reply",index);
				});
				actionBut.text("Reply");		
			});
	}
	this.setMyLikesView = function(viewFunction){
			myLikesSet = true;
			that.updateMyLikesView();
			$("#mainPage_people_myLikes").empty().on('scroll',checkScroll);
			console.log("visible height is:"+ $('#mainPage_people').height() );
			for(var i = 0; i < that.mediaLoader.myLikes.length; i++){
				var likesRowDiv = document.createElement("div");
				likesRowDiv.className = "likesRow row row-xs-height";
				if(that.mediaLoader.myLikes[i].refs === undefined)
						likesRowDiv.className +=" disabled";
				var picDiv = document.createElement("div");
				picDiv.className = "col-xs-3 col-xs-height col-top";
				var picDivImg = document.createElement("img");
				picDivImg.className ="mainPage_likes_profilePic";
				picDivImg.src="http://graph.facebook.com/" + that.mediaLoader.myLikes[i].FbId+"/picture?type=square";
				var nameDiv = document.createElement("div");
				nameDiv.className = "col-xs-9 col-xs-height col-top";
				nameDiv.innerHTML = that.mediaLoader.myLikes[i].Name;
				picDiv.appendChild(picDivImg);
				likesRowDiv.appendChild(picDiv);
				likesRowDiv.appendChild(nameDiv);
				document.getElementById("mainPage_people_myLikes").appendChild(likesRowDiv);
			}
			$(".likesRow").bind("tap",function(e){
				e.preventDefault();
				if(prevSelected)
					prevSelected.removeClass("selectedLikesRow");
				prevSelected = $(this);
				if(prevSelected.hasClass("disabled"))
						return;
				prevSelected.addClass("selectedLikesRow");
				var index = prevSelected.index();
				var actionBut1 = $("#mainPage_likes_menuAction1");
				actionBut1.text("View");
				actionBut1.unbind("tap").bind("tap",function(e){
						e.preventDefault();
						viewFunction(index);
				});
				var actionBut = $("#mainPage_likes_menuAction2");
				actionBut.unbind("tap").bind("tap",function(e){
					e.preventDefault();
					E.EMIT("myLikesView_message",index);
				});
				actionBut.text("Message");		
			});
	}
	this.enableRow = function(index){
		$(".likesRow:eq("+index+")").removeClass("disabled");
	}
	this.setLikersView = function(viewFunction){
			likersSet = true;
			that.updateLikersView();
			$("#mainPage_people_likers").empty().bind("scroll",checkScroll);
			console.log("visible height is:"+ $('#mainPage_people').height() );
			for(var i = 0; i < that.mediaLoader.likers.length; i++){
				var likesRowDiv = document.createElement("div");
				likesRowDiv.className = "likesRow row row-xs-height";
				if(that.mediaLoader.likers[i].refs === undefined)
					likesRowDiv.className+=" disabled ";
				var picDiv = document.createElement("div");
				picDiv.className = "col-xs-3 col-xs-height col-top";
				var picDivImg = document.createElement("img");
				picDivImg.className ="mainPage_likes_profilePic";
				picDivImg.src="http://graph.facebook.com/" + that.mediaLoader.likers[i].FbId+"/picture?type=square";
				var nameDiv = document.createElement("div");
				nameDiv.className = "col-xs-9 col-xs-height col-top";
				nameDiv.innerHTML = that.mediaLoader.myLikes[i].Name;
				picDiv.appendChild(picDivImg);
				likesRowDiv.appendChild(picDiv);
				likesRowDiv.appendChild(nameDiv);
				document.getElementById("mainPage_people_likers").appendChild(likesRowDiv);
			}
			$(".likesRow").bind("tap",function(e){
				e.preventDefault();
				if(prevSelected)
					prevSelected.removeClass("selectedLikesRow");
				prevSelected = $(this);
				if(prevSelected.hasClass("disabled"))
						return;
				prevSelected.addClass("selectedLikesRow");
				var index = prevSelected.index();
				var actionBut1 = $("#mainPage_likes_menuAction1");
				actionBut1.text("View");
				actionBut1.unbind("tap").bind("tap",function(e){
						e.preventDefault();
						viewFunction(index);
				});
				var actionBut = $("#mainPage_likes_menuAction2");
				actionBut.unbind("tap").bind("tap",function(e){
					e.preventDefault();
					E.EMIT("likersView_message",index);
				});
				actionBut.text("Message");		
			});
	}
	function checkScroll(){
    	if ($(this).innerHeight() + $(this).scrollTop() >= $(this).scrollHeight()*0.15)
        	E.EMIT("likesView_scrolled");
	}

}

/// extra utility for button dropdown on login page
 $(function(){

    $(".dropdown-menu li a").click(function(){
      console.log("hello");
      $(".btn:first-child").text($(this).text());
      $(".btn:first-child").val($(this).text());

   });

});


