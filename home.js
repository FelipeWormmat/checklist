angular.module("homeNCApp", [])

.config(function($httpProvider, $interpolateProvider) {
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken'; //add these lines to enable CSFR cookie in order to make post requests work
    $interpolateProvider.startSymbol('{[{').endSymbol('}]}');
})

.controller("HomeNCCtrl", function($scope, $http) {

    //Auto hide navbar
    $("nav.navbar-fixed-top").autoHidingNavbar();

    $scope.welcome_message = "Sistema de Checklist";

    $scope.waitIt = 0;

    $scope.logged_user = [];

    $scope.user_function = "";

    $scope.GetLoggedUser = function(user_id) {
        $scope.logged_user = [];
        $http.get("/checklist_site/user_edit_get/" + user_id +"/","").
        success(function(data, status, headers, config) {
            // this callback will be called asynchronously
            // when the response is available
            $scope.logged_user.push({
                    user_id: data[0].pk,
                    user_name: data[0].fields.user_name,
                    user_sector: data[0].fields.user_sector,
                    user_function: data[0].fields.user_funtion,
                    user_username: data[0].fields.user_username,
                    user_password: data[0].fields.user_password,
                    user_confirm_password: data[0].fields.user_password,
                });

            $scope.CheckUser("");
        }).
        error(function(data, status, headers, config) {
            alert(status);
            // called asynchronously if an error occurs
            // or server returns response with an error status.
        });
    };

    $scope.Logout = function() {
        $http.post('/checklist_site/logout/','').
        success(function(data, status, headers, config) {
            // this callback will be called asynchronously
            // when the response is available
            // window.localStorage.setItem('user_logged_in');
            window.localStorage.clear();
            window.location.href = "/checklist_site/";
        }).
        error(function(data, status, headers, config) {
            // window.localStorage.setItem('user_logged_in');
            window.localStorage.clear();

            window.location.href = "/checklist_site/";
            // called asynchronously if an error occurs
            // or server returns response with an error status.
        });
    };

    $scope.GetLoggedUser = function(user_id) {
 
        console.log('user logged in:',$scope.user_logged_in);
        if($scope.getUserStorage() == 0)
        {
            $scope.Logout();
        }
        else{
        $scope.logged_user = [];
        $http.get("/checklist_site/user_edit_get/" + user_id +"/","").
        success(function(data, status, headers, config) {
            // this callback will be called asynchronously
            // when the response is available
            $scope.logged_user.push({
                    user_id: data[0].pk,
                    user_name: data[0].fields.user_name,
                    user_sector: data[0].fields.user_sector,
                    user_function: data[0].fields.user_funtion,
                    user_username: data[0].fields.user_username,
                    user_password: data[0].fields.user_password,
                    user_confirm_password: data[0].fields.user_password,
                });

            $scope.CheckUser("");
        }).
        error(function(data, status, headers, config) {
            alert(status);
            // called asynchronously if an error occurs
            // or server returns response with an error status.
        });
    }
    };
    $scope.CheckUser = function(taskToDo)   {
        $http.post("/checklist_site/login_check/" + $scope.logged_user[0].user_id + "/" ,"").
        success(function(data, status, headers, config) {
            $scope.user_function = $scope.logged_user[0].user_function
            if (data[0].fields.logged)
            {
                if (taskToDo == "LoadNCSPage")
                    window.location.href = "/sistema_rnc/list/" + $scope.logged_user[0].user_id + "/";
                else if (taskToDo == "LoadActionsPage")
                    window.location.href = "/sistema_rnc/actions/" + $scope.logged_user[0].user_id + "/";
                else if (taskToDo == "LoadNCReportPage")
                    window.location.href = "/sistema_rnc/rnc_report_home/" + $scope.logged_user[0].user_id + "/";                    
                else if (taskToDo == "LoadDashboardPage")
                    window.location.href = "/checklist_site/dashboard/" + $scope.logged_user[0].user_id + "/";                    
            }
            else
            {
                $scope.Logout($scope.logged_user[0].user_id);
                return 0;
            }

        }).
        error(function(data, status, headers, config) {
            alert("Error checking login data");
            return 0;
          // called asynchronously if an error occurs
          // or server returns response with an error status.
        });
    };

    $scope.getUserStorage = function () {

        var user_logged_in = window.localStorage.getItem('user_logged_in');
        if (!user_logged_in)  {
            console.log("user not logged");
            return 0;
        }
        console.log(user_logged_in,"user logged!");
        $scope.user_id = user_logged_in;
        return 1;
    }

    $scope.user_isAdmin = function() {
        if ($scope.user_function == "Administrador")
            return 1;
        return 0;
    }

    $scope.user_isSuper = function() {
        if (($scope.user_function == "Supervisor") || ($scope.user_function == "Administrador"))
            return 1;
        return 0;
    };

    $scope.LoadNCSPage = function() {
        // $scope.CheckUser("LoadNCSPage");
        window.location.href = "/sistema_rnc/list/";
    };

    $scope.LoadActionsPage = function() {
        window.location.href = "/sistema_rnc/actions/";

    };

    $scope.LoadDashboardPage = function() {
        window.location.href = "/checklist_site/dashboard/";
    };

    $scope.LoadNCReportPage = function() {
        window.location.href = "/sistema_rnc/rnc_report_home/";
    };

    $scope.getUserStorage();
    $scope.GetLoggedUser($scope.user_id);

})