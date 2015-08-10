// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'starter.services'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleLightContent();
    }
  });
})
.config(function($stateProvider, $urlRouterProvider) {

  var user=Parse.User.current();
  if(user) {
    console.log("User exists in the session : " + user.get("username"));

    // Ionic uses AngularUI Router which uses the concept of states
    // Learn more here: https://github.com/angular-ui/ui-router
    // Set up the various states which the app can be in.
    // Each state's controller can be found in controllers.js
    $stateProvider

    // setup an abstract state for the tabs directive
      .state('tab', {
      url: "/tab",
      abstract: true,
      templateUrl: "templates/tabs.html"
    })

    // Each tab has its own nav history stack:

    .state('tab.dash', {
      url: '/dash',
      views: {
        'tab-dash': {
          templateUrl: 'templates/tab-dash.html',
          controller: 'ActivityCtrl'
        }
      }
    })

    .state('tab.post', {
      url: '/post',
      views: {
        'tab-dash': {
          templateUrl: 'templates/post-activity.html',
          controller: 'PostActivityCtrl'
        }
      }
    })

    .state('tab.regions', {
      url: '/regions',
      views: {
        'tab-region': {
          templateUrl: 'templates/region-list.html',
          controller: 'RegionListCtrl'
        }
      }
    })

    .state('tab.region', {
      url: '/region/{regionUniqueName}',
      views: {
        'tab-region': {
          templateUrl: 'templates/region-detail.html',
          controller: 'RegionDetailCtrl'
        }
      }
    })

    .state('tab.offices', {
      url: '/offices/{regionUniqueName}',
        views: {
          'tab-region': {
            templateUrl: 'templates/region-offices.html',
            controller: 'RegionDetailCtrl'
          }
        }
    })

    // .state('tab.account.settings', {
    //   url: '/settings',
    //   views: {
    //     "tab-account@tab": {
    //       templateUrl: 'templates/account-detail.html',
    //       controller: 'AccountDetailCtrl'              
    //     }
    //   }
    // })


    .state('tab.account', {
      url: '/account',
      views: {
        "tab-account": {
          templateUrl: 'templates/tab-account.html',
          controller: 'AccountCtrl'        
        }
      }
    });
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/tab/dash');
  } else {

    console.log("User session does not exists");

    $stateProvider
      .state('tab', {
      url: "/tab",
      abstract: true,
      templateUrl: "templates/tabs.html"
    })
    .state('tab.register', {
      url: '/register',
      views: {
        "tab-account": {
          templateUrl: 'templates/register.html',
          controller: 'RegisterCtrl'        
        }
      }
    });

    $urlRouterProvider.otherwise('/tab/register');
  }  

});
