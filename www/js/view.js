function View (EventEmitter){
	// galxy nexus width: 360, height 570
	// s3 width 360, height 615
	var E = EventEmitter;
	var that = this;
	var menuSet = false;
	var inboxSet = false;
	var myLikesSet = false;
	var likersSet = false;
	var prevSelected = undefined;
	var playing = false;
	var optionsVisible = false;
	var setPauseEvent = false;
	var peopleMenuHidden = false;
	var canUseFileUrls = true;
	this.streamLoading = false;
	var profileImageUrl= null;
	var domain = 'http://s3.amazonaws.com/bantter-downloads/';
	this.currentView = "";
	this.init = function(imageUrl){
		console.log("view init");
		console.log( Math.max(document.documentElement.clientWidth, window.innerWidth || 0));
		console.log(Math.max(document.documentElement.clientHeight, window.innerHeight || 0));
		if(imageUrl)
			$("#optionsIcon_self").attr("src",domain+imageUrl);
		initVidControll();
		$("#mainPage_likes_controlBut").bind("tap",function(){
			E.EMIT("view_likesControll_taped");
		});
		if(window.device.platform ="iOS"){
			StatusBar.overlaysWebView(false);
			StatusBar.styleBlackOpaque();
		}
		$(document).click(function (e){
			    var container = $("#optionsMenu");
			    var container2 = $("#mainPage_menu_optionsIcon");
			    if (!container.is(e.target) // if the target of the click isn't the container...
			        && container.has(e.target).length === 0// ... nor a descendant of the container
			        && !container2.is(e.target)
			        ) 
			    {
			        container.hide(0);
			        optionsVisible = false;
			    }
		});
		$('#loadingContainer_background, #loadingContainer_play').bind("tap",function(){
			if(that.currentView=="streamView"){
				if(playing == false){
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
			if(playing === false){
				var vid = $("#videoPopUp").get(0);
				displayVidLoad(true);
				setTimeout(function(){
					vid.load();
					vid.play();
					playing = true;
				},1);
			}
		});
		if(window.device.platform === "Android"){
			var androidVersion = parseFloat(window.device.version);
			if(androidVersion < 4.2){
				canUseFileUrls = false;
			}
		}
	}
	this.pauseVideo = function(){
		pauseVid();
	}
	function pauseVid(){
		var vid1 = $("#mainPage_selfies_selfieVid").get(0);
		vid1.pause();
		vid1.src="";
		vid1.load();
		vid1 = $("#videoPopUp").get(0);
		vid1.pause();
		vid1.src="";
		vid1.load();
	}
	function initVidControll(){
		function setPauseControls(){
			$("#mainPage_selfies_selfieVid, #videoPopUp").bind("tap",function(){
				var vid = $(this).get(0);
					if(!vid.paused){
						console.log("pausing video");
						setPauseEvent = true;
						vid.pause();
					}else if( setPauseEvent === true){
						console.log("taped again to play");
						vid.play();
					}

			});
		};
		$("#videoPopUp").bind("timeupdate",function(){
			var vid = $(this).get(0);
			if(vid.currentTime > 0 && vid.currentTime< 1){
				removeVidLoad(true);
			}
		}).bind("loadedmetadata",function(){
			/*
			var vid = $(this).get(0);
			actualRatio = vid.videoWidth / vid.videoHeight
   			targetRatio = vid.width()/vid.height()
   			adjustmentRatio = targetRatio/actualRatio
   			$(this).css("-webkit-transform","scaleX("+adjustmentRatio+")");
   			*/
		}).bind("ended",function(){
			$(this).get(0).currentTime=0;
			$(this).get(0).play();
		}).get(0).loop=false;
		$("#mainPage_selfies_selfieVid").bind("ended",function(){
			console.log("video ended");
			$(this).get(0).currentTime=0;
			$(this).get(0).play();
			enableThumbs();
		}).bind("loadedmetadata",function(){

		}).bind("timeupdate",function(){
			var vid = $(this).get(0);
			console.log(vid.currentTime);
			if(vid.currentTime > 0 && vid.currentTime < 1 ){
				removeVidLoad(false);
			}
			if(window.device.platform ==="iOS" && vid.currentTime >= Math.floor(vid.duration))
					enableThumbs();
		}).get(0).loop=false;
		if(window.device.platform === "Android"){
			var androidVersion = parseFloat(window.device.version);
			if(androidVersion >= 4.4){
				setPauseControls()
			}
		}
		if(window.device.platform ==="iOS"){
			$("#videoPopUp").get(0).loop=true;
			$("#mainPage_selfies_selfieVid").get(0).loop=true;
			setPauseControls();
		}
	}
	function clearBox(){
		$("#mainPage_likes_menuAction1").unbind("tap").text("");
		$("#mainPage_likes_menuAction2").unbind("tap").text("");

	}
	this.preloadVidPoster = function (ImageUrl){
		if(ImageUrl){
			$("#bufferContainer_background").attr("src",domain+ImageUrl);
		}
	}
	this.getLoginFormData = function(){
		var formData = {
			age: undefined,
			name: undefined,
			gender: undefined
		};
		formData.name = $("#loginPage_nameInput").val();
		formData.age = $("#loginPage_AgeInput").val();
		formData.gender = $("#loginPage_GenderInput_but").val();
		return formData;

	}
	this.resetForms = function(){
		$("#loginPage_nameInput").val('');
		$("#loginPage_AgeInput").val('');
		$("#loginPage_GenderInput").val('Gender');
	}
	this.setLoadingView = function(){
		that.currentView='loadingView';
		$("#loginPage").addClass("notActive");
		$("#mainPage").addClass("notActive");
		$("#loadingPage").removeClass("notActive");
		$("#loadingPage_icon").fadeIn(0);
		$("#loadingPage_spinner").fadeIn(0);
	}
	function displayDistance(distance){
		if(distance.Method ==="car"){
			$('#mainPage_selfies_transportImg').empty().prepend('<img class="transportImg" src="./img/carIcon.png" />');
		}else if(distance.Method ==="plane"){
			$('#mainPage_selfies_transportImg').empty().prepend('<img class="transportImg" src="./img/planeIcon.png" />');
		}else{
			$('#mainPage_selfies_transportImg').empty().prepend('<img class="transportImg" src="./img/walkIcon.png" />');
		}
		if(distance.Hours === 0)
			$("#mainPage_selfies_time").text(distance.Minutes+" mins");
		else if(distance.Minutes === 0)
			$("#mainPage_selfies_time").text(distance.Hours + " hr");
		else
			$("#mainPage_selfies_time").text(distance.Hours + " hr "+ distance.Minutes+ " mins");
	}
	this.streamViewDisplayNext = function(user,distance){
		$("#loadingContainer_background").attr("src",returnSource(user,true));
		setTimeout(function(){
			displayVidLoad(false);
			displayDistance(distance);
			$("#mainPage_selfies_name").text(user.Name);
			var vid = $("#mainPage_selfies_selfieVid");
			vid.get(0).src=returnSource(user,false);
			vid.get(0).load();
			vid.get(0).play();
			disableThumbs();
		},0);
	}
	function returnSource(user,isImage,useWeb){
		console.log("file directory is:"+cordova.file.documentsDirectory);
		if(isImage){
			if(user.refs[0].ImageUrl.indexOf("file") === -1){
				console.log("setting Image source: "+domain+user.refs[0].ImageUrl);
				return domain+user.refs[0].ImageUrl;
			}
			if((canUseFileUrls === false) || useWeb ){
				if(user.refs[0].WebImageUrl){
					console.log("setting Image source: "+domain+user.refs[0].WebImageUrl);
					return domain+user.refs[0].WebImageUrl;
				}else{
					console.log("setting Image source: "+domain+user.refs[0].ImageUrl);
					return domain+user.refs[0].ImageUrl;
				}
			}
			else{
				console.log("setting Image source: "+user.refs[0].ImageUrl);
				return user.refs[0].ImageUrl;
			}
		}else{
			if(user.refs[0].Url.indexOf("file") === -1){
				console.log("setting video source: "+domain+user.refs[0].Url);
				return domain+user.refs[0].Url;
			}
			if((canUseFileUrls === false) || useWeb){
				if(user.refs[0].WebUrl){
					console.log("setting video source: "+domain+user.refs[0].WebUrl);
					return domain+user.refs[0].WebUrl
				}else{
					console.log("setting video source: "+domain+user.refs[0].Url);
					return domain+user.refs[0].Url;
				}
			}
			else{
				console.log("setting video source: "+user.refs[0].Url);
				return user.refs[0].Url;
			}
		}
	}
	this.toggleOptionsMenu = function(imageUrl,inprogress){
		var options = $("#optionsMenu");
		if (optionsVisible === true){
			optionsVisible = false;
			options.hide(0);
		}
		else{
			if(imageUrl  && !inprogress){
				profileImageUrl = imageUrl;
				$("#optionsIcon_self").attr("src",domain+imageUrl);
			}
			optionsVisible=true;
			options.show(0);
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
		if(!popUpBool){
			$("#mainPage_selfies_loadingContainer").show(0);
			$("#loadingContainer_play").addClass("notActive");
			$("#loadSpinner").removeClass("notActive");
		}
		else{
			$("#popUpOverlay").removeClass("notActive");
			$("#popUpOverlay_play").addClass("notActive");
			$("#loadSpinner2").removeClass("notActive");
		}

	}
	function removeVidLoad(popUpBool){
		if(!popUpBool)
			$("#mainPage_selfies_loadingContainer").fadeOut();
		else{
			$("#popUpOverlay").addClass("notActive");
			$("#popUpOverlay_play").addClass("notActive");
			$("#loadSpinner2").addClass("notActive");
		}
	}
	function displayVidPlay(imageUrl,popUpBool){
		if(!popUpBool){
			var loadingContainer = $("#loadingContainer_background");
			loadingContainer.attr("src",imageUrl);
			$("#mainPage_selfies_loadingContainer").show(0);
			loadingContainer.removeClass("notActive");
			$("#loadSpinner").addClass("notActive");
			$("#loadingContainer_play").removeClass("notActive");
		}else{
			var loadingContainer = $("#popUpOverlay_background");
			loadingContainer.attr("src",imageUrl);
			$("#popUpOverlay").removeClass("notActive");
			loadingContainer.removeClass("notActive");
			$("#loadSpinner2").addClass("notActive");
			$("#popUpOverlay_play").removeClass("notActive");
			togglePeopleMenu("hide");
		}
	}
	this.displayInfo = function(text,warning){
		$(".infoPopUpContent").removeClass("warning ok");
		if(warning === false)
			$(".infoPopUpContent").addClass("warning");
		else
			$(".infoPopUpContent").addClass("ok");
		$("#modal-title2").html(text);
		$("#infoPopUp").modal('show');
		setTimeout(function(){
			$("#infoPopUp").modal("hide");
		},3000);

	}
	this.streamViewRemoveLoading = function(){
		// fix this at somepoint
	}
	this.streamViewDisplayLoading = function(){
		// fix this at somepoint
	}
	this.setUserViewPopUp = function(user){
		console.log(JSON.stringify(user));
		pauseVid();
		var vid = $("#videoPopUp");
		if(that.currentView ==="inboxView"){
			vid.get(0).src=returnSource(user,false,true);
			displayVidPlay(returnSource(user,true),true);
		}
		else{
			vid.get(0).src=returnSource(user,false,true);
			displayVidPlay(returnSource(user,true,true),true);
		}
		playing = false;
		$("#videoPopUpModal").removeClass('notActive');
	}
	this.setSelfViewPopUp = function(imageUrl,vidUrl){
		pauseVid();
		displayVidPlay(domain+imageUrl,true);
		var vid = $("#videoPopUp");
		vid.get(0).src=domain+vidUrl;
		playing = false;
		$("#videoPopUpModal").removeClass('notActive');
	}
	this.setLoginView = function(){
		that.currentView='loginView';
		$("#mainPage").addClass("notActive");
		$("#loadingPage").addClass("notActive");
		$("#loginPage").removeClass("notActive");
		$("#loginPage_fbLogin").bind("click",function(){
			E.EMIT("view_login_clicked");
		});
	}
	this.setNewInboxIcon = function(){
		$("#inboxIcon").attr("src",'./img/newInboxIcon.png');
	}
	function removeNewInboxIcon(){
		$("#inboxIcon").attr("src",'./img/inboxIcon.png');
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
			$("#mainPage_menu_optionsIcon").bind('tap',function(){
				E.EMIT("viewMenu_options_taped");
			});
			$("#profileVidLink").bind('tap',function(){
				E.EMIT("viewMenu_profileLink_taped");
			});
		}
	}
	function togglePeopleMenu(state){
		if(state === "hide"){
			$(".likesRow").addClass("notActive");
			$("#mainPage_people_menu").addClass("notActive");
			$("#mainPage_selfies").addClass("notActive");
		}else{
			$(".likesRow").removeClass("notActive");
			$("#mainPage_people_menu").removeClass("notActive");
			$("#mainPage_selfies").removeClass("notActive");
		}
	}
	this.hidePopUp = function(){
		$("#videoPopUpModal").addClass("notActive");
		//
	}
	this.setStreamView = function(user,distance){
		that.currentView='streamView';
		$("#mainPage_selfies").removeClass("notActive");
		$("#mainPage_people").addClass("notActive");
		$("#loginPage").addClass("notActive");
		$("#loadingPage").addClass("notActive");
		that.hidePopUp();
		pauseVid();

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
		$("#mainPage_selfies_name").text(user.Name);
		displayDistance(distance);
		var vid = $("#mainPage_selfies_selfieVid");
		vid.get(0).src=returnSource(user,false);
		displayVidPlay(returnSource(user,true),false);
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
		pauseVid();
		that.currentView='inboxView';
		that.setMenu();
		clearBox();
		that.hidePopUp();
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
		$("#mainPage_likes_menuTitle").empty();
		$("#mainPage_likes_menuTitle").html("My Inbox");
	}
	this.updateMyLikesView = function(){
		pauseVid();
		that.currentView ='myLikesView';
		that.setMenu();
		clearBox();
		that.hidePopUp();

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
		$("#mainPage_likes_menuTitle").empty();
		$("#mainPage_likes_menuTitle").html("My Likes");
	}
	this.updateLikersView = function(){
		pauseVid();
		that.currentView='likersView';
		that.setMenu();
		clearBox();
		that.hidePopUp();
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
		$("#mainPage_likes_menuTitle").empty();
		$("#mainPage_likes_menuTitle").html("My Fans");
	}
	this.setInboxView = function(inboxUsers,viewFunction){
			removeNewInboxIcon();
			inboxSet = true;
			that.updateInboxView();
			$("#mainPage_people_inbox").empty();
			console.log("inbox user length: "+inboxUsers.length);
			for(var i = 0; i<inboxUsers.length;i++){
				console.log("inbox user length: "+inboxUsers.length);
				var likesRowDiv = document.createElement("div");
				likesRowDiv.className = "likesRow row row-xs-height";
				var picDiv = document.createElement("div");
				picDiv.className = "col-xs-3 col-xs-height col-top";
				var picDivImg = document.createElement("img");
				picDivImg.className ="mainPage_likes_profilePic";
				picDivImg.src=returnSource(inboxUsers[i],true,true);
				var nameDiv = document.createElement("div");
				nameDiv.className = "col-xs-7 col-xs-height col-top";
				nameDiv.innerHTML = inboxUsers[i].Name;
				var iconDiv = document.createElement("div");
				iconDiv.className ="col-xs-2 col-xs-height col-top";
				if(that.mediaLoader.checkViewable(inboxUsers[i].refs[0].Url)){
					var iconImage = document.createElement("img");
					iconImage.className ="newInboxIcon";
					iconImage.src ="./img/starIcon.png";
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
				if(that.mediaLoader.checkViewable(inboxUsers[index].refs[0].Url)){
					console.log("ref is viewable");
					actionBut1.empty().append('<img class="actionIcon" src="./img/viewIcon.png" />');
					actionBut1.unbind("tap").bind("tap",function(e){
						e.preventDefault();
						viewFunction(index);
					});
				}else{
					actionBut1.empty();
				}
				var actionBut = $("#mainPage_likes_menuAction2");
				actionBut.unbind("tap").bind("tap",function(e){
					e.preventDefault();
					E.EMIT("inboxView_reply",index);
				});
				actionBut.empty().append('<img class="actionIcon" src="./img/replyIcon.png" />');		
			});
	}
	function appendUser(user,field){
			if(field === "myLikes"){
				field ="mainPage_people_myLikes";
			}
			else{
				field ="mainPage_people_likers";
			}
			var likesRowDiv = document.createElement("div");
			likesRowDiv.className = "likesRow row row-xs-height";
			var picDiv = document.createElement("div");
			picDiv.className = "col-xs-3 col-xs-height col-top";
			var picDivImg = document.createElement("img");
			picDivImg.className ="mainPage_likes_profilePic";
			picDivImg.src=returnSource(user,true,true);
			var nameDiv = document.createElement("div");
			nameDiv.className = "col-xs-9 col-xs-height col-top";
			nameDiv.innerHTML = user.Name;
			picDiv.appendChild(picDivImg);
			likesRowDiv.appendChild(picDiv);
			likesRowDiv.appendChild(nameDiv);
			$("#"+field).prepend(likesRowDiv);
	}
	function bindLikesRow(field,viewFunction,length){
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
				actionBut1.empty().append('<img class="actionIcon" src="./img/viewIcon.png" />');
				actionBut1.unbind("tap").bind("tap",function(e){
						e.preventDefault();
						viewFunction(index);
				});
				var actionBut = $("#mainPage_likes_menuAction2");
				actionBut.unbind("tap").bind("tap",function(e){
					e.preventDefault();
					E.EMIT(field,index);
				});
				actionBut.empty().append('<img class="actionIcon" src="./img/replyIcon.png" />');		
			});		
	}
	this.setMyLikesView = function(viewFunction){
			myLikesSet = true;
			that.updateMyLikesView();
			$("#mainPage_people_myLikes").empty();
			for(var i =0; i< that.mediaLoader.myLikes.length ; i++){
				if(that.mediaLoader.myLikes[i].refs === null){
					continue;
				}
				appendUser(that.mediaLoader.myLikes[i],"myLikes");
			}
			bindLikesRow('myLikesView_message',viewFunction,that.mediaLoader.myLikes.length);
	}
	this.setLikersView = function(viewFunction){
			that.updateLikersView();
			$("#mainPage_people_likers").empty();
			for(var i = 0; i <that.mediaLoader.likers.length; i++){
				if(that.mediaLoader.likers[i].refs === null)
					continue;
				appendUser(that.mediaLoader.myLikes[i],"likers");
			}
			bindLikesRow("likersView_message",viewFunction,that.mediaLoader.myLikes.length);
	}
}

/// extra utility for button dropdown on login page
 $(function(){
 	$("button").focus(function(){
 		this.blur();
 	});
    $(".dropdown-menu li a").click(function(){
      $("#loginPage_GenderInput_but").text($(this).text());
      $("#loginPage_GenderInput_but").val($(this).text());

   });
   $("#loginPage_GenderInput").click(function(){
    	$(this).css({ opacity: 1 });
    });
    $("input[type='number']").each(function(i, el) {
	    el.type = "text";
	    el.onfocus = function(){this.type="number";};
	    el.onblur = function(){this.type="text";};
	});

});

/// extra utility to hide options menu



