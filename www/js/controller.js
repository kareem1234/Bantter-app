
   
// document.addEventListener('deviceready', this.onDeviceReady, false);

function Controller(){
    var that = this;
    var waitingFor = undefined;
    var currentUser = undefined;
    this.load = function(){
        //that.view.displayInfo("Internet Connectivity lost,<br> app will not function properly",true);
        function onUserLoad(userStatus){
            that.user.getGpsData();
            if(!userStatus){
                window.analytics.trackView('LoginPage');
                setTimeout(function(){
                    that.view.setLoginView();
                },1000);
            }
            else{
                console.log("starting");
                that.request.setUser(userStatus);
                that.mediaLoader.start();
            }
        };
        that.view.setLoadingView();
        that.likes.load();
        that.mediaCapture.load();
        that.mediaLoader.load();
        var userStatus = that.user.load();
        onUserLoad(userStatus);
     }
    // call all setup methods
    this.setup = function(){
        console.log("setting up device");
        navigator.splashscreen.hide();
        that.view.setLoadingView();
        window.analytics.startTrackerWithId('UA-63324411-1');
        that.initCallbacks();
        that.load();
        that.view.init(that.mediaCapture.selfImageUrl);
        that.setOnPause();
        that.setOnResume();
        setInterval(function(){
            that.save();
        },1000*60);

        ///
    }
    this.save = function(){
        that.likes.save();
        that.user.save();
        that.mediaLoader.save();
        that.mediaCapture.save();
    }
    this.initCallbacks = function(){
        initModelCallbacks();
        initQueryCallbacks();
        initFailCallbacks();
        initViewCallbacks();
    }
    this.setOnPause = function(){
        document.addEventListener("pause", function(){
            that.mediaLoader.pause();
            that.view.pauseVideo();
        }, false);
    }
    this.setOnResume = function(){
        document.addEventListener("resume",function(){
            console.log("resuming");
            that.mediaLoader.resume();
        },false);
    }
    this.setConnectivity = function(){
        document.addEventListener("offline",function(){
            that.mediaLoader.pause();
            that.view.displayInfo("Connectivity lost, videos may not load...",false);
        },false);
        document.addEventListener("online",function(){
            that.view.displayInfo("Connectivity resumed",false);
            that.mediaLoader.resume();
        },false);
    }
    var likersView_view = function(index){
        index = convertIndex(index,that.mediaLoader.likers);
        that.view.setUserViewPopUp(that.mediaLoader.likers[index]);
    };
    var myLikesView_view = function(index){
         index = convertIndex(index,that.mediaLoader.myLikes);
        that.view.setUserViewPopUp(that.mediaLoader.myLikes[index]);
    };
    var inboxView_view = function(index){
            index = convertIndex(index,that.mediaLoader.inboxUsers);
            that.mediaLoader.markedViewed(that.mediaLoader.inboxUsers[index].refs);
            that.view.setUserViewPopUp(that.mediaLoader.inboxUsers[index]);
    };
    var likesWarning = function(){
        that.view.displayInfo("You cant like anyone until you record a selfie",false);
    };
    var convertIndex = function(index,array){
       return array.length - index -1;
    };
    // listen for call backs initated by the model objects
    function initModelCallbacks(){
        that.event.LISTEN("media_ready",function(){
            console.log("media is ready setting streamView");
            if(that.view.currentView ==="loadingView"){
                that.mediaLoader.setMode("findUsers");
                currentUser = that.mediaLoader.getNext();
                var distance = that.user.getDistance(currentUser.Lat,currentUser.Lgt);
                setTimeout(function(){
                    that.view.setStreamView(currentUser,distance);
                },2000);
                window.analytics.trackView('selfiesPage');
            }
            else if(that.view.currentView ==='streamView'){
              if(that.view.streamLoading){
                that.view.streamViewRemoveLoading();
                var nextUser = that.mediaLoader.getNext();
                var distance = that.user.getDistance(nextUser.Lat,nextUser.Lgt);
                setTimeout(function(){
                    that.view.setStreamView(currentUser,distance);
                },2000);
                that.view.preloadVidPoster(that.mediaLoader.getNextImage());
                currentUser = nextUser;
              }
            }
        });
        that.event.LISTEN("media_notReady",function(){
            
        });
        that.event.LISTEN("notifier_inboxClicked",function(){
             window.analytics.trackView('inboxPage');
            that.view.setInboxView(that.mediaLoader.inboxUsers,inboxView_view);
        });
        that.event.LISTEN('user_failedGps',function(){
            that.view.displayInfo("Please turn on GPS for more accurate results",false);
        });
        that.event.LISTEN("user_gotGps",function(){
            if(that.user.isDataSet())
                that.user.insertUser();
        });
        that.event.LISTEN("userStream_notReady",function(){
        });
        that.event.LISTEN("userStream_ready",function(){
            that.mediaLoader.onStreamReady();
        });
        that.event.LISTEN("mediaCapture_captureError",function(){
            that.view.displayInfo("something went wrong recording video",false);
        });
        that.event.LISTEN("mediaCapture_cap",function(){
            that.mediaCapture.getPolicy();
            that.view.displayInfo("video uploading in background ...",true);
        });
        that.event.LISTEN("mediaCapture_uploadSuccess",function(){
            that.mediaCapture.incUpload();
            that.user.updateTimeStamp();
        });
        that.event.LISTEN("mediaCapture_uploadError",function(){
            that.view.displayInfo("something whent wrong, video upload failed",false);
        });
        that.event.LISTEN("fileDl_gotFile",function(data){
            if(!that.mediaLoader.onVidDl(data)){
                console.log("to late video already played");
                console.log(data.fileUrl);
                that.mediaLoader.fileDl.deleteVid(data.fileUrl);
            }
        });
        that.event.LISTEN("media_myLikes_loaded",function(){
             if(that.view.currentView ==="myLikesView"){
                that.view.setMyLikesView(myLikesView_view);
            }           
        });
        that.event.LISTEN("media_inbox_loaded",function(){
            if(that.view.currentView ==="inboxView"){
                that.view.setInboxView(that.mediaLoader.inboxUsers,inboxView_view);
            }
        });
        that.event.LISTEN("media_inbox_newMessages",function(){
            that.view.setNewInboxIcon();
        });
        that.event.LISTEN("media_likers_loaded",function(){
            if(that.view.currentView ==="likersView"){
                that.view.setLikersView(likersView_view);
            }
        });      
    }
    // listen for call backs initated by the query/request object
    function initQueryCallbacks(){
        console.log("initating query call backs");
        that.event.LISTEN("complete/insertLike",function(){
            //
        });
        that.event.LISTEN("complete/insertVidRef",function(data){
            that.mediaCapture.toggleProgress();
            that.view.displayInfo("video uploaded succesfully",true);
        });
        that.event.LISTEN("complete/insertUser",function(data){
            console.log("user data saved on server");
            that.mediaLoader.start();
        });
        that.event.LISTEN("complete/getGps",function(data){
            that.user.onGeoIp(data.res);
        })
        that.event.LISTEN("complete/findWhoLikedMe",function(data){
            that.mediaLoader.onUserLoad(data.res,"findWhoLikedMe");
        });
        that.event.LISTEN("complete/findWhoILike",function(data){
            that.mediaLoader.onUserLoad(data.res,"findWhoILike");
        });
        that.event.LISTEN("complete/getPolicy",function(data){
            that.mediaCapture.onPolicyReturn(data.res);
        })
        that.event.LISTEN("complete/getVideoRefs",function(data){
            //console.log(JSON.stringify(data));
            that.mediaLoader.onRefLoad(data.res.Refs,data.res.Type);
        });
        that.event.LISTEN("complete/findUsers",function(data){
            that.mediaLoader.onUserLoad(data.res,"findUsers");
        });
        that.event.LISTEN("complete/getInbox",function(data){
            that.mediaLoader.onInboxRefLoad(data.res);
        });
        that.event.LISTEN("complete/findInboxUsers",function(data){
            that.mediaLoader.onUserLoad(data.res,"findInboxUsers");
            if(that.waitingFor ==="findInboxUsers"){
                that.view.setInboxView(that.mediaLoader.inboxUsers,inboxView_view);
            }
        });
    }
    // listen for call backs initated by failure events
    function initFailCallbacks(){
        var failureCallback = function(err){
            console.log(err);
        };
        that.event.LISTEN("failed/insertLike",function(){
            failureCallback("failed insertLike");
        });
        that.event.LISTEN("failed/insertVidRef",function(){
            failureCallback("failed insertVidRef");
        });
        that.event.LISTEN("failed/insertUser",function(){
            failureCallback("failed insert user");
        });
        that.event.LISTEN("failed/findWhoILike",function(){
            failureCallback("failed findWhoILike");
        });
        that.event.LISTEN("failed/findWhoLikedMe",function(){
            failureCallback("failed findWhoLikedMe");
        });
        that.event.LISTEN("failed/getVideoRefs",function(){
            failureCallback("failed getVideoRefs");
        });
        that.event.LISTEN("failed/findUsers",function(){
            failureCallback("failed findUsers");
        });
        that.event.LISTEN("failed/getInbox",function(){
            failureCallback("failed getInbox");
        });
        that.event.LISTEN("failed/findInboxUsers",function(){
            failureCallback("failed findInboxUsers");
        });
    }
    //// listen for call backs initated by the view
    function initViewCallbacks(){
        that.event.LISTEN("myLikesView_message",function(index){
            if(that.mediaCapture.num === 0)
                that.view.displayInfo("You have to upload a selfie before you can message someone",false);
            else{
                 index = convertIndex(index,that.mediaLoader.myLikes);
                that.mediaCapture.getVideo(that.mediaLoader.myLikes[index].FbId);
            }
        });
        that.event.LISTEN("likersView_message",function(index){
            if(that.mediaCapture.num === 0)
                that.view.displayInfo("You have to upload a selfie before you can message someone",false);
            else{
                 index = convertIndex(index,that.mediaLoader.likers);
                that.mediaCapture.getVideo(that.mediaLoader.likers[index].FbId);
            }
        });
        that.event.LISTEN("inboxView_reply",function(index){
            if(that.mediaCapture.num === 0)
                that.view.displayInfo("You have to upload a selfie before you can message someone",false);
            else{
                 index = convertIndex(index,that.mediaLoader.inboxUsers);
                 that.mediaCapture.getVideo(that.mediaLoader.inboxUsers[index].Id);
            }           
        });
        that.event.LISTEN("view_login_clicked",function(){
            var data = that.view.getLoginFormData();
            var isValid = that.user.validate(data.name,data.age,data.gender);
            if(! (isValid === true)){
                that.view.displayInfo(isValid,false);
                that.view.resetForms();
            }else{
                that.view.setLoadingView();
                that.user.setData(data);
                that.save();
                that.request.setUser(that.user.returnUser());
                if(that.user.isGpsSet()){
                    that.user.insertUser();
                }
                else
                    that.view.displayInfo("waiting on GPS",false);
            }
        });
        that.event.LISTEN("viewMenu_likes_taped",function(){
            window.analytics.trackView('likesPage');
            that.waitingFor = undefined;
            that.mediaLoader.setMode("myLikes");
            if(that.mediaLoader.myLikes){
                that.view.setMyLikesView(myLikesView_view);
                 if(that.mediaCapture.num === 0)
                    that.view.displayInfo("You cant like anyone until you record a selfie",false);
               
            }
            else{
                that.waitingFor = "myLikes"
                that.view.displayPeopleLoading();
            }
        });
        that.event.LISTEN("viewMenu_selfies_taped",function(){
            window.analytics.trackView('selfiesPage');
            that.waitingFor = undefined;
            that.mediaLoader.setMode("findUsers");
            var distance = that.user.getDistance(currentUser.Lat,currentUser.Lgt);
            that.view.setStreamView(currentUser,distance);
            if(!that.mediaLoader.readyStatus){
                that.waitingFor = 'findUsers'; 
                that.view.streamViewDisplayLoading();
            }
        });
        that.event.LISTEN("viewMenu_inbox_taped",function(){
            window.analytics.trackView('inboxPage');
            that.waitingFor = undefined;
            if(that.mediaLoader.inboxUsers){
                that.view.setInboxView(that.mediaLoader.inboxUsers,inboxView_view);
                if(that.mediaCapture.num === 0)
                    that.view.displayInfo("Upload a selfie to recieve messages",false);
            }else{
                that.view.displayPeopleLoading('inbox');
                that.waitingFor = 'inboxUsers';
            }
        });
        that.event.LISTEN("view_likesControll_taped",function(){
            that.waitingFor = undefined;
            if(that.view.currentView ==="likersView" || that.view.currentView ==="peopleLoading"){
                if(that.mediaLoader.myLikes){
                    that.view.setMyLikesView(myLikesView_view);
                    that.mediaLoader.setMode("findWhoILike");
                    if(that.mediaCapture.num === 0){
                        that.view.displayInfo("No one can like you until you record a selfie",false);
                    }
                }else{
                    that.waitingFor="myLikes";
                    that.view.displayPeopleLoading();
                }

            }else if(that.view.currentView ==="myLikesView"|| that.view.currentView ==="peopleLoading"){
                if(that.mediaLoader.likers){
                    that.view.setLikersView(likersView_view);
                    that.mediaLoader.setMode("findWhoLikedMe");
                    if(that.mediaCapture.num === 0){
                        that.view.displayInfo("No one can like you until you record a selfie",false);
                    }
                }else{
                    that.waitingFor="likers";
                    that.view.displayPeopleLoading();
                }
            }
        });
        that.event.LISTEN("viewMenu_vidIcon_taped",function(){
            that.mediaCapture.getVideo();
        });
        that.event.LISTEN("streamView_thumbsUp_taped",function(){
            that.mediaLoader.fileDl.deleteVid(currentUser.refs[0].Url);
            var nextUser = that.mediaLoader.getNext();
            if(nextUser){
                 var distance = that.user.getDistance(nextUser.Lat,nextUser.Lgt);
                that.view.streamViewDisplayNext(nextUser,distance);
                that.view.preloadVidPoster(that.mediaLoader.getNextImage());
                currentUser  = nextUser;
                if(that.mediaCapture.num > 0){
                    that.likes.addLike(currentUser.FbId);
                    that.mediaLoader.pushLikedUser(currentUser);
                }else{
                    likesWarning();
                }
            }else{
                that.view.streamViewDisplayLoading();
                that.waitingFor = "findUsers";
            }

        });
        that.event.LISTEN("streamView_thumbsDown_taped",function(){
            var nextUser = that.mediaLoader.getNext();
            that.mediaLoader.fileDl.deleteVid(currentUser.refs[0].Url);
            if(nextUser){
                var distance = that.user.getDistance(nextUser.Lat,nextUser.Lgt);
                that.view.streamViewDisplayNext(nextUser,distance);
                that.view.preloadVidPoster(that.mediaLoader.getNextImage());
                currentUser = nextUser;
            }else{
                that.view.streamViewDisplayLoading();
                that.waitingFor = "findUsers";
            }
        });
        that.event.LISTEN("likesView_scrolled",function(){
            that.mediaLoader.callBuffer();
        });
        that.event.LISTEN("viewMenu_options_taped",function(){
            that.view.toggleOptionsMenu(that.mediaCapture.selfImageUrl);
        });
        that.event.LISTEN("viewMenu_profileLink_taped",function(){
            that.view.toggleOptionsMenu(that.mediaCapture.selfImageUrl);
            if(that.mediaCapture.num > 0 && (!that.mediaCapture.inProgress)){
                that.view.setSelfViewPopUp(that.mediaCapture.selfImageUrl,that.mediaCapture.selfVidUrl);
            }else{
                if(that.mediaCapture.inProgress){
                    that.view.displayInfo("Video still uploading...",false);
                }else{
                    that.view.displayInfo("You havent recorded a profile video yet",false);
                }
            }
        });
        
    }

// end of declaration
}
// Controller Prototype declaration
// this gives all inheriters of controller acces to its static variables
Controller.prototype.event = new EventEmitter();
Controller.prototype.request = new Request(Controller.prototype.event);
Controller.prototype.likes = new Likes(Controller.prototype.event,Controller.prototype.request);
Controller.prototype.mediaLoader = new MediaLoader(Controller.prototype.event,Controller.prototype.request);
Controller.prototype.mediaCapture = new MediaCapture(Controller.prototype.event,Controller.prototype.request);
Controller.prototype.user  = new User(Controller.prototype.event,Controller.prototype.request);
Controller.prototype.view = new View(Controller.prototype.event);
View.prototype.mediaLoader = Controller.prototype.mediaLoader;
var c = new Controller();
window.localStorage.clear();
document.addEventListener("deviceready",c.setup,false);







