
   
// document.addEventListener('deviceready', this.onDeviceReady, false);

function Controller(){
    var that = this;
    var waitingFor = undefined;
    var currentUser = undefined;
    this.load = function(){
        //that.view.displayInfo("Internet Connectivity lost,<br> app will not function properly",true);
        function onUserLoad(userStatus){
            that.user.getGpsData();
            if(!userStatus)
                that.view.setLoginView();
            else{
                that.request.setUser(userStatus);
                that.mediaLoader.start();
            }
        }
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
        that.initCallbacks();
        that.load();
        that.view.init();
        that.setSave();

        ///
    }
    this.initCallbacks = function(){
        initModelCallbacks();
        initQueryCallbacks();
        initFailCallbacks();
        initViewCallbacks();
    }
    this.setSave = function(){
        document.addEventListener("pause", function(){
            that.likes.save();
            that.user.save();
            that.mediaLoader.save();
            that.mediaCapture.save();
        }, false);
    }
    var likersView_view = function(index){
        that.view.setUserViewPopUp(that.mediaLoader.likers[index]);
    };
    var myLikesView_view = function(index){
        that.view.setUserViewPopUp(that.mediaLoader.myLikes[index]);
    };
    // listen for call backs initated by the model objects
    function initModelCallbacks(){
        that.event.LISTEN("media_ready",function(){
            console.log("media is ready setting streamView");
            if(that.view.currentView ==="loadingView"){
                that.mediaLoader.setMode("findUsers");
                currentUser = that.mediaLoader.getNext();
                var distance = that.user.getDistance(currentUser.Lat,currentUser.Lgt);
                console.log("distance object: "+JSON.stringify(distance));
                that.view.setStreamView(currentUser,distance);
            }
            else if(that.view.currentView ==='streamView'){
              if(that.view.streamLoading){
                that.view.removeStreamLoading();
                var nextUser = that.mediaLoader.getNext();
                that.view.streamViewDisplayNext(nextUser);
                currentUser = nextUser;
              }
            }
        });
        that.event.LISTEN("media_notReady",function(){
            
        });
        that.event.LISTEN('user_failedGps',function(){
            that.view.displayInfo("Please turn on GPS and restart app");
        });
        that.event.LISTEN("user_gotGps",function(){
            if(that.user.isDataSet())
                that.user.insertUser();
        })
        that.event.LISTEN("userStream_notReady",function(){
        });
        that.event.LISTEN("userStream_ready",function(){
            that.mediaLoader.onStreamReady();
        });
        that.event.LISTEN("mediaCapture_captureError",function(){
            that.view.displayInfo("something went wrong recording video");
        });
        that.event.LISTEN("mediaCapture_cap",function(){
            that.mediaCapture.getPolicy();
        });
        that.event.LISTEN("mediaCapture_uploadSuccess",function(){
            that.view.displayInfo("video uploaded!");
            that.user.updateTimeStamp();
        });
        that.event.LISTEN("mediaCapture_uploadError",function(){
            that.view.displayInfo("something whent wrong, video upload failed");
        });
        that.event.LISTEN("fileDl_gotFile",function(data){
            that.mediaLoader.onVidDl(data);
        })
    }
    // listen for call backs initated by the query/request object
    function initQueryCallbacks(){
        that.event.LISTEN("complete/insertLike",function(){
            //
        });
        that.event.LISTEN("complete/insertVidRef",function(data){
            that.view.displayInfo("video uploaded succesfully");
        });
        that.event.LISTEN("complete/insertUser",function(data){
            console.log("user data saved on server");
            that.mediaLoader.start();
        });
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
            console.log("got video refs: "+JSON.stringify(data));
            that.mediaLoader.onRefLoad(data.res.Refs,data.res.Type);
        });
        that.event.LISTEN("complete/findUsers",function(data){
            that.mediaLoader.onUserLoad(data.res,"findUsers");
        });
        that.event.LISTEN("complete/getInbox",function(data){
            console.log("completed got inbox refs");
            that.mediaLoader.onInboxRefLoad(data.res);
        });
        that.event.LISTEN("complete/findInboxUsers",function(data){
            that.mediaLoader.onUserLoad(data.res,"findInboxUsers");
        });
        that.event.LISTEN("media_myLikes_loaded",function(){
             if(that.view.currentView ==="myLikesView"){
                that.view.setMyLikesView(myLikesView_view);
            }           
        });
        that.event.LISTEN("media_likers_loaded",function(){
            if(that.view.currentView ==="likersView"){
                that.view.setLikersView(likersView_view);
            }
        });
    }
    // listen for call backs initated by failure events
    function initFailCallbacks(){
        var failureCallback = function(err){
            console.log(err);
        }
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
            that.mediaCapture.getVideo(that.mediaLoader.myLikes[index].Id);
        });
        that.event.LISTEN("likersView_message",function(index){
            that.mediaCapture.getVideo(that.mediaLoader.likers[index].Id);
        });
        var inboxView_view = function(index){
            that.view.setUserViewPopUp(that.mediaLoader.inboxUsers[index]);
            that.mediaLoader.markedViewed(that.mediaLoader.inboxUsers[index].refs);
            that.view.setInboxView(that.mediaLoader.inboxUsers);
        };
        that.event.LISTEN("inboxView_reply",function(index){
             that.mediaCapture.getVideo(that.mediaLoader.inboxUsers[index].Id);           
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
                that.request.setUser(that.user.returnUser());
                if(that.user.isGpsSet()){
                    console.log()
                    that.user.insertUser();
                }
                else
                    that.view.displayInfo("waiting on GPS");
            }
        });
        that.event.LISTEN("viewMenu_likes_taped",function(){
            that.waitingFor = undefined;
            if(that.view.currentView ==="myLikesView" || that.view.currentView === "likersView")
                    return;
            else{
                that.mediaLoader.setMode("myLikes");
                if(that.mediaLoader.myLikes)
                    that.view.setMyLikesView(myLikesView_view);
                else{
                    that.waitingFor = "myLikes"
                    that.view.displayPeopleLoading();
                }
            }
        });
        that.event.LISTEN("viewMenu_selfies_taped",function(){
            that.waitingFor = undefined;
            that.mediaLoader.setMode("findUsers");
            if(that.view.currentView ==="streamView")
                return;
            else{
                that.view.setStreamView(currentUser);
                if(!that.mediaLoader.readyStatus){
                    that.waitingFor = 'findUsers'; 
                    that.view.streamViewDisplayLoading();
                }
            }
        });
        that.event.LISTEN("viewMenu_inbox_taped",function(){
            that.waitingFor = undefined;
            if(that.view.currentView ==="inboxView")
                return;
            else{
                if(that.mediaLoader.inboxUsers)
                    that.view.setInboxView(that.mediaLoader.inboxUsers,inboxView_view);
                else{
                    that.view.displayPeopleLoading('inbox');
                    that.waitingFor = 'inboxUsers';
                }
            }
        });
        that.event.LISTEN("view_likesControll_taped",function(){
            that.waitingFor = undefined;
            if(that.view.currentView ==="likersView" || that.view.currentView ==="peopleLoading"){
                if(that.mediaLoader.myLikes){
                    that.view.setMyLikesView(myLikesView_view);
                    that.mediaLoader.setMode("findWhoILike");
                }else{
                    that.waitingFor="myLikes";
                    that.view.displayPeopleLoading();
                }

            }else if(that.view.currentView ==="myLikesView"|| that.view.currentView ==="peopleLoading"){
                if(that.mediaLoader.likers){
                    that.view.setLikersView(likersView_view);
                    that.mediaLoader.setMode("findWhoLikedMe");
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
            that.likes.addLike(currentUser.FbId);
            that.mediaLoader.pushLikedUser(currentUser);
            that.mediaLoader.fileDl.deleteVid(currentUser.refs[0].Url);
            var nextUser = that.mediaLoader.getNext();
            if(nextUser){
                 var distance = that.user.getDistance(nextUser.Lat,nextUser.Lgt);
                that.view.streamViewDisplayNext(nextUser,distance);
                currentUser  = nextUser;
            }else{
                that.view.streamViewDisplayLoading();
                that.waitingFor = "findUsers";
            }
        });
        that.event.LISTEN("streamView_thumbsDown_taped",function(){
            var nextUser = that.mediaLoader.getNext();
            that.mediaLoader.fileDl.deleteVid(currentUser.refs[0].Url);
            if(nextUser){
                that.view.streamViewDisplayNext(nextUser);
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
            console.log("options taped");
            that.view.toggleOptionsMenu();
        });
        that.event.LISTEN("viewMenu_profileLink_taped",function(){
            console.log("view profile video taped");
            that.view.toggleOptionsMenu();
            if(that.mediaCapture.num > 0){
                that.view.setSelfViewPopUp(that.mediaCapture.selfImageUrl,that.mediaCapture.selfVidUrl);
                that.event.EMIT("viewMenu_likes_taped");
            }else{
                that.view.displayInfo("You havent recorded a profile video yet");
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







