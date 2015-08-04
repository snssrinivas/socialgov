angular.module('starter.controllers', [])

.controller('ActivityCtrl', function($scope, $http) {
  // $http.get("js/activity.json").success(function(data) {
  //   $scope.activities=data;
  // });

  //$scope.activities=[];

  var Activity=Parse.Object.extend("Activity");
  var query=new Parse.Query(Activity);
  query.equalTo("regionUniqueName", "dowlaiswaram");
  query.include("user");
  query.find({
    success: function(results) {
    $scope.activities=results;

      // for(var i=0;i<results.length;i++) {
      //   var object=results[i];
      //   var activity={"activityType": object.get("activityType"), 
      //     "notifyMessage": object.get("notifyMessage"), 
      //     "regionUniqueName": object.get("regionUniqueName"),
      //     "createdAt": object.createdAt};
      //   $scope.activities.push(activity);
      // }


    }, 
    error: function(error) {
      alert("Unable to get activities");
    }
  });
})

.controller('PostActivityCtrl', function($scope, $http, $location) {
  
  $scope.post={"activityType": "NOTF", "notifyMessage": "", "regionUniqueName":"dowlaiswaram"};

  $scope.submitPost=function() {
      //var post=$scope.post;
      // alert(post.activityType + post.message + post.region);

      var Activity = Parse.Object.extend("Activity");
      var activity = new Activity();

      // activity.set("activityType", post.activityType)    
      // activity.set("notifyMessage", post.message);
      // activity.set("regionUniqueName", post.region)

      $scope.post.user=Parse.User.current();
      activity.save($scope.post, {
      success: function(activity) {
        // Push the new notification to the top of activity chart, probably through Activity service
        // alert("Activity ID : " + activity.id);
      },
      error: function(activity, error) {
        // Notify user that post has failed
        $scope.postError=true;
        $scope.postErrorMessage=error;
      }
    });
    $location.path("/tab/dash");
  };

  $scope.cancelPost=function(){
    $location.path("/tab/dash");
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

.controller('AccountCtrl', function($scope) {

  $scope.userLoggedIn=false;
  var currentUser = Parse.User.current();
  if (currentUser) {
    $scope.userLoggedIn=true;
    $scope.user=currentUser;
    if(currentUser.get("email")==null) {
      FB.api('/me', {fields: 'first_name, last_name, email'}, function(response) {
        console.log(response);
        currentUser.set("firstName", response.first_name);
        currentUser.set("lastName", response.last_name);
        currentUser.set("email", response.email);
        currentUser.save(null, {
          success: function(userAgain) {
            $scope.user=userAgain;
          },
          error: function(error) {
          }
        });
      });      
    } 
  } 
  
  $scope.login=function() {
    
    Parse.FacebookUtils.logIn("public_profile,email", {
      success: function(user) {
        $scope.userLoggedIn=true;
        $scope.user=user;
      },
      error: function(user, error) {
        alert("User cancelled the Facebook login or did not fully authorize.");
      }
    });

  };

  // $scope.user={
  //   firstName: 'Suresh', 
  //   lastName: 'Pragada', 
  //   phoneNo: '4088324304', 
  //   residency: {name: 'Dowlaiswaram', uniqueName: 'dowlaiswaram'},
  //   settings: {
  //     notifications: true
  //   }
  // };


});
