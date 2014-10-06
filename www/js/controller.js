
   
// document.addEventListener('deviceready', this.onDeviceReady, false);

function Controller(){
    var that = this;
    var waitingFor = undefined;
    var currentUser = undefined;
    this.load = function(){
        that.view.setLoadingView();
        that.likes.load();
        that.mediaCapture.load();
        that.mediaLoader.load();
        var userStatus = that.user.load();
        onUserLoad(userStatus);

     }
    function onUserLoad(userStatus){
        if(!userStatus)
            that.view.setLoginView(that.user.login);
        else{
            that.request.setUser(userStatus);
            that.mediaLoader.start();
        }
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
    function initModelCallbacks(){
        that.event.LISTEN("signedUp",function(){
            that.view.setLoadingView();
            that.user.getFbData();
            that.view.displayInfo('Fetching facebook data');
        });
        that.event.LISTEN("deniedSignUp",function(){
            console.log("user denied sign up");
            that.view.displayInfo("We do not share your data with third parties");
        });
        that.event.LISTEN("loadedFbData",function(){
            var usr = that.user.returnUser();
            that.request.setUser(usr);
            console.log("controller inserting user");
            that.request.request('insertUser');
            that.view.displayInfo("saving data");
        });
        that.event.LISTEN("media_ready",function(){
            console.log("media is ready setting streamView");
            if(that.view.currentView ==="loadingView"){
                that.mediaLoader.setMode("findUsers");
                currentUser = that.mediaLoader.getNext();
                setTimeout(function(){
                    that.view.setStreamView(currentUser);
                },2000);
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
        that.event.LISTEN("userStream_notReady",function(){
        });
        that.event.LISTEN("userStream_ready",function(){
            that.mediaLoader.onStreamReady();
        });
        that.event.LISTEN("mediaCapture_captureError",function(){
            that.view.displayInfo("something whent wrong recording video");
        });
        that.event.LISTEN("mediaCapture_cap",function(){
            that.mediaCapture.getPolicy();
        });
        that.event.LISTEN("mediaCapture_uploadSuccess",function(){
            that.view.displayInfo("video uploaded!");
        });
        that.event.LISTEN("mediaCapture_uploadError",function(){
            that.view.displayInfo("something whent wrong, video upload failed");
        });
    }
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
            that.view.displayInfo("finding people in your area");
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
        });
        that.event.LISTEN("media_myLikes_loaded",function(){
            if(that.waitingFor === "myLikes"){
                that.waitingFor = undefined;
                that.view.setMyLikesView(myLikesView_view);
            }
        });
        that.event.LISTEN("media_likers_loaded",function(){
            if(that.waitingFor === "likers"){
                that.waitingFor = undefined;
                that.view.setLikersView(likersView_view);
            }
        });
    }
    function initFailCallbacks(){
        var failureCallback = function(err){
            console.log(err);
        }
        that.event.LISTEN("failed/insertLike",failureCallback);
        that.event.LISTEN("failed/insertVidRef",failureCallback);
        that.event.LISTEN("failed/insertUser",failureCallback);
        that.event.LISTEN("failed/findWhoLikedMe",failureCallback);
        that.event.LISTEN("failed/findWhoILike",failureCallback);
        that.event.LISTEN("failed/getVideoRefs",failureCallback);
        that.event.LISTEN("failed/findUsers",failureCallback);
        that.event.LISTEN("failed/getInbox",failureCallback);
        that.event.LISTEN("failed/findInboxUsers",failureCallback);
    }
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
            var nextUser = that.mediaLoader.getNext();
            if(nextUser){
                that.view.streamViewDisplayNext(nextUser);
                currentUser = nextUser;
            }else{
                that.view.streamViewDisplayLoading();
                that.waitingFor = "findUsers";
            }
        });
        that.event.LISTEN("streamView_thumbsDown_taped",function(){
            var nextUser = that.mediaLoader.getNext();
            if(nextUser){
                that.view.streamViewDisplayNext(nextUser);
                currentUser = nextUser;
            }else{
                that.view.streamViewDisplayLoading();
            }
        });
        that.event.LISTEN("likesView_scrolled",function(){
            that.mediaLoader.callBuffer();
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
document.addEventListener("deviceready",c.setup,false);






