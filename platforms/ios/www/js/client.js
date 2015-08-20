function User(eventEmitter, request) {
        // User properties
        var Age, Gender, Id, FbId, Lat, Lgt, TimeStamp, Name;
        var R = request;
        var E = eventEmitter;
        var that = this;
        var gpsSet = false;

        // function for returning user object
        this.returnUser = function() {
            var me = {};
            me.Age = Age;
            me.Gender = Gender;
            me.Name = Name;
            me.Id = Id;
            me.FbId = FbId;
            me.Lat = Lat;
            me.Lgt = Lgt;
            me.TimeStamp = TimeStamp;
            return me;
        }
        this.isGpsSet = function(){
            if(Lat != undefined)
                return true;
            return false;
        }
        this.isDataSet = function(){
            if(Age != undefined)
                return true;
            return false;
        }
        this.updateTimeStamp = function() {
                TimeStamp = new Date().getTime();
            }
            // save user object into local storage
        this.save = function() {
            if (!Age)
                return;
            else {
                window.localStorage.setItem("me", JSON.stringify(that.returnUser()));
            }
         }
         this.validate = function(name,age,gender){

         	function isAgebtween13and100(n) {
  				return  n>13 && n<=100 && n%1===0;
			}
			function isgender(g){
				if(g === "Female" || g === "Male")
					return true;
				else
					return false;
			}
            //proper name check to implement http://stackoverflow.com/questions/15673482/php-judge-a-string-as-a-human-name-or-other-text
         	var properName = /^[A-Za-z\s]+$/.test(name);
         	var properAge = isAgebtween13and100(age);
         	var properGender = isgender(gender);

         	if(!properName)
         		return "Enter a real name that does not include numbers";
         	else if(!properAge)
         		return "Must be between 13 and 100 years old";
         	else if(!properGender)
         		return "Please select a gender";
         	else
         		return true;
         }

            // function loading user object out of local storage
        this.load = function() {
                var me = window.localStorage.getItem("me");
                if (!me) {
                    return false;
                } else {
                    console.log(JSON.stringify(me));
                    me = JSON.parse(me);
                    Age = me.Age;
                    Gender = me.Gender;
                    City = me.City;
                    Name = me.Name;
                    Id = me.Id;
                    console.log(Id);
                    FbId = me.FbId;
                    console.log(FbId);
                    Lat = me.Lat;
                    Lgt = me.Lgt;
                    TimeStamp = me.TimeStamp;
                    console.log("user loaded");
                    return me;
                }
            }

         function distance2TransportTimeMap(distance) {
                function toWalkTime(returnObj) {
                    returnObj.Time = (distance / 5) * 60;
                    returnObj.Hours = Math.floor(returnObj.Time / 60);
                    returnObj.Minutes = Math.floor(returnObj.Time % 60);
                    returnObj.Method = "walk";

                    // dont expose very close distances
                    if(returnObj.Hours  === 0 && returnObj.Minutes < 15)
                        returnObj.Minutes = 15;
                    return returnObj;
                };

                function toDriveTime(returnObj) {
                    returnObj.Time = (distance / 60) * 60;
                    returnObj.Hours = Math.floor(returnObj.Time / 60);
                    returnObj.Minutes = Math.floor(returnObj.Time  % 60);
                    returnObj.Method = "car";
                    return returnObj;
                };

                function toFlyTime(returnObj) {
                    returnObj.Time = (distance / 400) * 60;
                    returnObj.Hours = Math.floor(returnObj.Time / 60);
                    returnObj.Minutes = Math.floor(returnObj.Time % 60);
                    returnObj.Method = "plane";
                    return returnObj;
                };
                var mapObj = {
                    Time: undefined,
                    Method: undefined
                };
                if (distance < 6) {
                    return toWalkTime(mapObj);
                } else if (distance < 201) {
                    return toDriveTime(mapObj);
                } else
                    return toFlyTime(mapObj);


            }
        this.onGeoIp = function(data){
            console.log("printing gps data");
            console.log(JSON.stringify(data));
            if(data == null){
                console.log("unable to find ip location setting false lat lgt");
                Lat = 0;
                Lgt = 0;

            }else if(gpsSet === true){
                console.log("already have more accurate gps");
            }else{
                Lat = data.ll[0];
                Lgt = data.ll[1];
                if(gpsSet === false){
                    gpsSet = true;
                    E.EMIT("user_gotGps");
                }
            }
        }
        this.getDistance = function(lat2, lgt2) {
                    lat2 = Number(lat2);
                    var R = 6371000; // metres
                    var φ1 = Lat.toRadians();
                    var φ2 = lat2.toRadians();
                    var Δφ = (lat2-Lat).toRadians();
                    var Δλ = (lgt2-Lgt).toRadians();

                    var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                            Math.cos(φ1) * Math.cos(φ2) *
                            Math.sin(Δλ/2) * Math.sin(Δλ/2);
                    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

                    var d = R * c;
                    return distance2TransportTimeMap(d/1000);
            }

        function generateId() {
                function s4() {
                    return Math.floor((1 + Math.random()) * 0x10000)
                        .toString(16)
                        .substring(1);
                }
                return s4() + s4() + s4() + s4() + s4() + s4() + s4() + s4();
            }

            // send user object to server
        this.insertUser = function() {
                    var _user = that.returnUser();
                    R.request("insertUser", _user);
                }
                // extract age from

            // extract all strings and set variables;
        this.setData = function(data) {
                FbId = generateId();
                Gender = data.gender;
                Name = capitalizeFirstLetter(data.name);
                Age = data.age;
                Id = generateId();
                TimeStamp = 0;
        }
        function capitalizeFirstLetter(string) {
             return string.charAt(0).toUpperCase() + string.slice(1);
        }
        this.getGpsData = function() {
                function gotGps(position) {
                    console.log("got gps data");
                    Lat = position.coords.latitude;
                    Lgt = position.coords.longitude;
                    if(gpsSet === false){
                        gpsSet = true;
                        E.EMIT("user_gotGps");
                    }
                };

                function failedGps() {
                    console.log("gps failed");
                    R.request("getGps");
                    E.EMIT("user_failedGps");
                };
                console.log('attempting to retrieve gps');
                navigator.geolocation.getCurrentPosition(gotGps, failedGps);
                R.request("getGps");
            }
        }
