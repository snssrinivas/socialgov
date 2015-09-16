angular.module('starter.controllers', ['ngCordova', 'ionic'])

.controller('DashboardCtrl', function($scope, $http, $ionicLoading, NotificationService, LogService, ActivityService) {
  $scope.activityError=null;
  $scope.debateList=[];
  $scope.argumentMessageList=[];
  var user=Parse.User.current();
  var residency=user.get("residency");

  $ionicLoading.show({
    template: "<ion-spinner></ion-spinner> Finding activity in " + residency
  });

  // $scope.activities=ActivityService.getMockData();  
  var Activity=Parse.Object.extend("Activity");
  var query=new Parse.Query(Activity);
  query.equalTo("regionUniqueName", residency);
  query.include("user");
  query.descending("createdAt");
  query.find({
    success: function(activityList) {

        if(activityList!=null && activityList.length>0) {
          $scope.activities=activityList;  

          var UserActivity = Parse.Object.extend("UserActivity");
          var userActivityQuery=new Parse.Query(UserActivity);
          userActivityQuery.equalTo("user", user);
          userActivityQuery.find({
            success: function(userActivityList) {
              $scope.$apply(function(){ 
                if(userActivityList!=null) {
                  $scope.userActivityList=userActivityList;
                  for(var k=0;k<activityList.length;k++) {
                    $scope.argumentMessageList.push("");
                    $scope.debateList.push(null);
                  }
                } else {
                  $scope.userActivityList=[];
                }
              });
              $ionicLoading.hide();              
            },
            error: function(error) {
              console.log("Unable to get activities : " + error.message);
              $scope.activityError="Unable to get activities.";              
              $ionicLoading.hide();
            }
          });

        } else {
          $scope.activityError="No activity found in your region.";
          $ionicLoading.hide();          
        }
    }, 
    error: function(error) {
      $scope.$apply(function(){
        console.log("Unable to get activities : " + error.message);
        $scope.activityError="Unable to get activities.";
        $ionicLoading.hide();
      });
    }
  });

  $scope.beginDebate=function(activityId, index) {
    if(!$scope.isDebateRequested(activityId, index)) {
      var Debate = Parse.Object.extend("Debate");
      var query = new Parse.Query(Debate);
      query.equalTo("activity", $scope.activities[index]);
      query.include("user");
      query.descending("createdAt");
      query.find({
        success: function(debates) {
          $scope.$apply(function(){
            if(debates!=null && debates.length>0) {
              console.log("Deabte notes : " + JSON.stringify(debates));
              $scope.debateList[index]=debates;
            } else {
              console.log("No arguments found for activity " + activityId);
              $scope.debateList[index]=[];
            }
          });
        },
        error: function(activity, error) {
          console.log("Error retrieving arguments of a debate " + error.message);
        }
      });          
    }
  };

  $scope.isDebateRequested=function(activityId, index) {
    if($scope.debateList[index]!=null) {
      return true;
    } else {
      return false;
    }

    // for(var i=0;i<$scope.debateList.length;i++) {
    //   if(activityId==$scope.debateList[i]) {
    //     return true;
    //   }
    // }
    // return false;
  };

  
  $scope.postDebateArgument=function(activityId, index) {
    var activity=$scope.activities[index];

    var Debate = Parse.Object.extend("Debate");
    var debate = new Debate();
    debate.set("user", Parse.User.current());
    debate.set("activity", activity);
    debate.set("argument", $scope.argumentMessageList[index]);
    
    debate.save(null, {
      success: function(newDebate) {
        $scope.$apply(function(){
          activity.increment("debate", 1);
          activity.save();              
          $scope.argumentMessageList[index]="";
          console.log("newly added debate entry : " + JSON.stringify(newDebate));
          $scope.debateList[index].unshift(newDebate);
          console.log("Successfully added debate entry");
        });
      },
      error: function(debate, error) {
        console.log("Error adding debate entry " + error.message);
      }
    });          

  };

  $scope.isThisActionChosen=function(activityId, action) {
    for(var j=0;j<$scope.userActivityList.length;j++) {
      if($scope.userActivityList[j].get("activity").id==activityId) {
        if($scope.userActivityList[j].get("action")==ActivityService.getActionCode(action)) {
          if(action=="support") {
            return "calm";
          } else {
            return "assertive";
          }
        } else {
          return;
        }
      }
    }
    return;
  };

  $scope.respond=function(activityId, action) {
    var activities=$scope.activities;
    for(i=0; i<activities.length; i++) {
      if(activities[i].id==activityId) {

        var previousUserActivity=null;
        var userActivityList=$scope.userActivityList;
        for(var j=0;j<userActivityList.length;j++) {
          if(userActivityList[j].get("activity").id==activities[i].id) {
            previousUserActivity=userActivityList[j];
            break;
          }
        }

        if(previousUserActivity==null) {
          // User has did an action on this activity for first time, add UserActivity and then increment action
          var UserActivity = Parse.Object.extend("UserActivity");
          var userActivity = new UserActivity();
          userActivity.set("user", Parse.User.current());
          userActivity.set("activity", activities[i]);
//          userActivity.set("actionType", "V");  // Possible values, V- VOTE & D - DBAT
          userActivity.set("action", ActivityService.getActionCode(action));
          
          userActivity.save(null, {
            success: function(userActivity) {
              $scope.$apply(function(){
                $scope.userActivityList.push(userActivity);
                activities[i].increment(action, 1);
                activities[i].save();              
                console.log("Successfully associated user with activity");
              });
            },
            error: function(activity, error) {
              console.log("Error associating user with activity " + error.message);
            }
          });          

        } else if(previousUserActivity.get("action")==ActivityService.getActionCode(action)) {
          console.log("Selected same option. so ignoring the option");
        } else {
          // User is chaning his previous stance, Update user activity and then decrement and increment
          var previousAction=previousUserActivity.get("action");
          // console.log("About to update user activity : " + ActivityService.getActionCode(action));
          // console.log("Previous activity before update : " + JSON.stringify(previousUserActivity));
          previousUserActivity.set("action", ActivityService.getActionCode(action));
          previousUserActivity.save({
            success: function(userActivity) {
              // console.log("Success 1 : " + JSON.stringify(userActivity));
            },
            error: function(error) {
              console.log("Error while updating user activity : " + JSON.stringify(error));
            }
          });
          // console.log("Activity before update : " + JSON.stringify(activities[i]));
          // console.log("About to decrement user action : " + ActivityService.getAction(previousAction));
          activities[i].increment(ActivityService.getAction(previousAction), -1);
          // console.log("About to increment user action : " + action);
          activities[i].increment(action, 1);
          activities[i].save({
            success: function(activity) {
              // console.log("Success 2 : " + JSON.stringify(activity));
            },
            error: function(error) {
              console.log("Error while incrementing counters : " + JSON.stringify(error));
            }
          });    
          // console.log("All is well with changing option");
        }
        return;
      }
    }
    console.log("unable to find activity id " + activityId + " to perform " + action);
  };

})

.controller('ActivityCtrl', function($scope, $http, $stateParams, NotificationService, LogService, ActivityService) {
  $scope.activityDetailError=null;
  var Activity=Parse.Object.extend("Activity");
  var query=new Parse.Query(Activity);
  query.include("user");
  query.get($stateParams.activityId, {
    success: function(result) {
      $scope.$apply(function(){
          $scope.activity=result;  
      });
    }, 
    error: function(error) {
      $scope.$apply(function(){
        console.log("Unable to load this activity : " + error.message);
        $scope.activityDetailError="Unable to load this activity.";
      });
    }
  });

  $scope.respond=function(activityId, action) {
    var activity=$scope.activity;
    activity.increment(action);
    activity.save();
  };

})

.controller('PostActivityCtrl', function($scope, $http, $state, NotificationService, LogService, RegionService, ActivityService) {
  var user=Parse.User.current();  
  $scope.post={"notifyMessage": ""};

  $scope.allowedActivities=ActivityService.getAllowedActivities(user.get("role"));
  $scope.selectedActivityType=$scope.allowedActivities[0];

  $scope.allowedRegions=ActivityService.getAllowedRegions(user.get("residency"));
  $scope.selectedRegion=$scope.allowedRegions[0];

  $scope.postErrorMessage=null;
  $scope.submitPost=function() {
    if($scope.post.notifyMessage!=null && $scope.post.notifyMessage.length>10 && $scope.post.notifyMessage.length<2048) {
      $scope.post.activityType=$scope.selectedActivityType.id;
      $scope.post.regionUniqueName=$scope.selectedRegion.id;   
      $scope.post.support=0;
      $scope.post.oppose=0;
      $scope.post.debate=0;
      $scope.post.user=Parse.User.current();

      //alert(JSON.stringify($scope.post));
      var Activity = Parse.Object.extend("Activity");
      var activity = new Activity();
      activity.save($scope.post, {
        success: function(activity) {
          // Send the push notification
          NotificationService.pushNotification($scope.post.regionUniqueName, $scope.post.notifyMessage, function(response) {
            console.log("Response from pushNotification : " + JSON.stringify(response));
            LogService.log({type:"INFO", message: "Push notification is success " + JSON.stringify(response)}); 
          }, function(error) {
            console.log("Error from pushNotification : " + JSON.stringify(error));
            LogService.log({type:"ERROR", message: "Push notification is failed " + JSON.stringify(error)}); 
          });

          // Push the new activity to the top of activity chart, probably through Activity service
          $scope.$apply(function(){
            $state.go("tab.dash");  
          });
        },
        error: function(activity, error) {
          // Notify user that post has failed
          console.log("Error in posting message " + error.message);
          $scope.postError=true;
          $scope.postErrorMessage=error.message;
          $scope.$apply();
        }
      });
    } else {
      $scope.postErrorMessage="Message should be minimum 10 and maximum 2048 characters.";
    }
  };

  $scope.cancelPost=function(){
    $state.go("tab.dash");
  };

})

.controller('RegionListCtrl', function($scope, $http, RegionService) {
  RegionService.all(function(data) {
    $scope.regionList=data;
  });
})

.controller('RegionDetailCtrl', function($scope, $stateParams, RegionService) {
  RegionService.all(function(data) {
    $scope.region=RegionService.get(data, $stateParams.regionUniqueName);
  });
})

.controller('RegisterCtrl', function($scope, $state, $cordovaPush, LogService) {

  $scope.user={countryCode: "91", residency: "dowlaiswaram"};
  $scope.userRegistered=true;
  $scope.registerErrorMessage=null;

  $scope.authPhoneNum=function() {
    if($scope.user.phoneNum!=null && $scope.user.phoneNum.length==10) {
      var userName=$scope.user.countryCode+""+$scope.user.phoneNum;
      Parse.User.logIn(userName, "custom", {
        success: function(user) {
          console.log("User exists in the system. Skipping registration flow.");
          $scope.$apply(function(){
            $state.go("tab.dash");
          });
        },
        error: function(user, error) {
          console.log("User does not exists, continue with singup flow. Error login : " + error.code + " message : " + error.message);
          $scope.userRegistered=false;
          $scope.registerErrorMessage=null;          
          $scope.$apply();
        }
      });
    } else {
      $scope.registerErrorMessage="Please enter 10 digit phone number.";
    }

  };

  $scope.register=function() {
    // TODO :: Please use angular form validation to validate all the fields
    if($scope.user.phoneNum!=null && $scope.user.phoneNum.length==10) {
      if($scope.user.firstName!=null && $scope.user.firstName.length>0 && $scope.user.lastName!=null && $scope.user.lastName.length>0) {
        var user=new Parse.User();
        var userName=$scope.user.countryCode+""+$scope.user.phoneNum;
        user.set("username", userName);
        user.set("password", "custom");
        user.set("firstName", $scope.user.firstName);
        user.set("lastName", $scope.user.lastName);
        user.set("residency", $scope.user.residency);
        user.set("phoneNum", $scope.user.phoneNum);
        user.set("countryCode", $scope.user.countryCode);
        user.set("role", "CTZEN");
        user.set("notifySetting", true);

        user.signUp(null, {
          success: function(user) {
            console.log("Signup is success");        
            if(ionic.Platform.isAndroid()) {
              // Register with GCM
              var androidConfig = {
                "senderID": "927589908829",
              };

              $cordovaPush.register(androidConfig).then(function(result) {
                console.log("Register Success : " + result);
                LogService.log({type:"INFO", message: "Register attempt to GCM is success " + JSON.stringify(result)}); 
              }, function(err) {
                console.log("Register error : " + err);
                LogService.log({type:"ERROR", message: "Error registration attempt to GCM " + JSON.stringify(err)}); 
              });
            }
            $scope.$apply(function(){
              $state.go("tab.dash");
            });
          },
          error: function(user, error) {
            console.log("Signup error  : " + error.code + " " + error.message);
            $scope.registerErrorMessage=error.message;
            $scope.apply();
          }
        });
      } else {
        $scope.registerErrorMessage="Please enter first and last name.";  
      }
    } else {
      $scope.registerErrorMessage="Please enter 10 digit phone number.";
    }

  }
})

.controller('AccountCtrl', function($scope, $state) {
  $scope.user = Parse.User.current();
  $scope.settings={notifications: $scope.user.get("notifySetting")}; 

  $scope.isLogoutAllowed=function() {
    if(ionic.Platform.isAndroid()) {
      return false;
    } else {
      return true;
    }
  };

  $scope.logout=function() {    
      Parse.User.logOut();
      $scope.user=null;
      $state.go("register");    
  };

  $scope.notifySettingChanged=function(settingName, settingValue) {
    var user=Parse.User.current();
    user.set(settingName, settingValue);
    user.save(null, {
      success: function(user) {
        console.log(settingName + " changed to " + settingValue);        
        $scope.user=user;
        $scope.$apply();
      }
    });
  };

});
