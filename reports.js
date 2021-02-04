angular.module('ui.bootstrap.contextMenu', [])

.directive('contextMenu', ["$parse", "$q", function ($parse, $q) {

    var contextMenus = [];

    var removeContextMenus = function (level) {
        while (contextMenus.length && (!level || contextMenus.length > level)) {
            contextMenus.pop().remove();
        }
        if (contextMenus.length == 0 && $currentContextMenu) {
            $currentContextMenu.remove();
        }
    };

    var $currentContextMenu = null;

    var renderContextMenu = function ($scope, event, options, model, level) {
        if (!level) { level = 0; }
        if (!$) { var $ = angular.element; }
        $(event.currentTarget).addClass('context');
        var $contextMenu = $('<div>');
        if ($currentContextMenu) {
            $contextMenu = $currentContextMenu;
        } else {
            $currentContextMenu = $contextMenu;
        }
        $contextMenu.addClass('dropdown clearfix');
        var $ul = $('<ul>');
        $ul.addClass('dropdown-menu');
        $ul.attr({ 'role': 'menu' });
        $ul.css({
            display: 'block',
            position: 'absolute',
            left: event.pageX + 'px',
            top: event.pageY + 'px',
            "z-index": 10000
        });
        angular.forEach(options, function (item, i) {
            var $li = $('<li>');
            if (item === null) {
                $li.addClass('divider');
            } else {
                var nestedMenu = angular.isArray(item[1])
                  ? item[1] : angular.isArray(item[2])
                  ? item[2] : angular.isArray(item[3])
                  ? item[3] : null;
                var $a = $('<a>');
                $a.css("padding-right", "8px");
                $a.attr({ tabindex: '-1', href: '#' });
                var text = typeof item[0] == 'string' ? item[0] : item[0].call($scope, $scope, event, model);
                $q.when(text).then(function (text) {
                    $a.text(text);
                    if (nestedMenu) {
                        $a.css("cursor", "default");
                        $a.append($('<strong style="font-family:monospace;font-weight:bold;float:right;">&gt;</strong>'));
                    }
                });
                $li.append($a);

                var enabled = angular.isFunction(item[2]) ? item[2].call($scope, $scope, event, model, text) : true;
                if (enabled) {
                    var openNestedMenu = function ($event) {
                        removeContextMenus(level + 1);
                        var ev = {
                            pageX: event.pageX + $ul[0].offsetWidth - 1,
                            pageY: $ul[0].offsetTop + $li[0].offsetTop - 3
                        };
                        renderContextMenu($scope, ev, nestedMenu, model, level + 1);
                    }
                    $li.on('click', function ($event) {
                        //$event.preventDefault();
                        $scope.$apply(function () {
                            if (nestedMenu) {
                                openNestedMenu($event);
                            } else {
                                $(event.currentTarget).removeClass('context');
                                removeContextMenus();
                                item[1].call($scope, $scope, event, model);
                            }
                        });
                    });

                    $li.on('mouseover', function ($event) {
                        $scope.$apply(function () {
                            if (nestedMenu) {
                                openNestedMenu($event);
                            }
                        });
                    });
                } else {
                    $li.on('click', function ($event) {
                        $event.preventDefault();
                    });
                    $li.addClass('disabled');
                }
            }
            $ul.append($li);
        });
        $contextMenu.append($ul);
        var height = Math.max(
            document.body.scrollHeight, document.documentElement.scrollHeight,
            document.body.offsetHeight, document.documentElement.offsetHeight,
            document.body.clientHeight, document.documentElement.clientHeight
        );
        $contextMenu.css({
            width: '100%',
            height: height + 'px',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 9999
        });
        $(document).find('body').append($contextMenu);
        $contextMenu.on("mousedown", function (e) {
            if ($(e.target).hasClass('dropdown')) {
                $(event.currentTarget).removeClass('context');
                removeContextMenus();
            }
        }).on('contextmenu', function (event) {
            $(event.currentTarget).removeClass('context');
            event.preventDefault();
            removeContextMenus(level);
        });
        $scope.$on("$destroy", function () {
            removeContextMenus();
        });

        contextMenus.push($ul);
    };
    return function ($scope, element, attrs) {
        element.on('contextmenu', function (event) {
            event.stopPropagation();
            $scope.$apply(function () {
                event.preventDefault();
                var options = $scope.$eval(attrs.contextMenu);
                var model = $scope.$eval(attrs.model);
                if (options instanceof Array) {
                    if (options.length === 0) { return; }
                    renderContextMenu($scope, event, options, model);
                } else {
                    throw '"' + attrs.contextMenu + '" not an array';
                }
            });
        });
    };
}]);

angular.module("checklistsApp", ['ngCookies', 'ui.bootstrap.contextMenu', 'ui.toggle'])

.config(function($httpProvider, $interpolateProvider) {
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken'; //add these lines to enable CSFR cookie in order to make post requests work
    $interpolateProvider.startSymbol('{[{').endSymbol('}]}');
})

.controller("HeadCtrl", function($scope) {
    $scope.page_title = "Sistema de Checklist - Checklists";
})

.filter('range', function() {
  return function(input, total) {
    total = parseInt(total);

    for (var i=0; i<total; i++) {
      input.push(i);
    }

    return input;
  };
})

.controller("ReportsCtrl", function($scope, $http, $cookies) {

    $("nav.navbar-fixed-top").autoHidingNavbar();
    
    $scope.welcome_message = "Relatórios";
    
    console.log($cookies.myFavorite);
    $scope.user_function = "";
    $scope.user_sector = "";

    $scope.Logout = function() {
        window.localStorage.clear();
        window.location.href = "/checklist_site/";
    };

    $scope.getUserStorage = function () {

        var user_logged_in = window.localStorage.getItem('user_logged_in');
        if (user_logged_in == null) {
            console.log("user not logged");
            return 0;
        }
        console.log(user_logged_in,"user logged!");
        $scope.user_id = user_logged_in;
        return 1;
    }
    $scope.GetLoggedUser = function() {

        console.log('user logged in:',$scope.user_logged_in);
        if($scope.getUserStorage() == 0)
        {
            $scope.Logout();
        }
        else{
            $scope.logged_user = [];
            $http.get("/checklist_site/user_edit_get/" + $scope.user_id +"/","").
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
                $scope.user_function = $scope.logged_user[0].user_function;
                $scope.user_sector = $scope.logged_user[0].user_sector;
            }).
            error(function(data, status, headers, config) {
                alert(status);
                // called asynchronously if an error occurs
                // or server returns response with an error status.
            });
        }
    };

    $scope.GetLoggedUser();
    $scope.CheckUser = function(taskToDo)   {
        
        $http.post("/checklist_site/login_check/" + $scope.logged_user[0].user_id + "/" ,"").
        success(function(data, status, headers, config) {
            if (data[0].fields.logged)
            {
                if (taskToDo == "LoadUsersPage")
                    window.location.href = "/checklist_site/users/" + $scope.logged_user[0].user_id + "/";
                else if (taskToDo == "LoadChecklistsPage")
                    window.location.href = "/checklist_site/checklists/" + $scope.logged_user[0].user_id + "/";  
                else if (taskToDo == "LoadDashboardPage")
                    window.location.href = "/checklist_site/ch_dashboard/" + $scope.logged_user[0].user_id + "/";
            }
            else
            {
                $scope.Logout($scope.logged_user[0].user_id);
                return 0;
            }
          // this callback will be called asynchronously
          // when the response is available

        }).
        error(function(data, status, headers, config) {
            alert("Error checking login data");
            return 0;
          // called asynchronously if an error occurs
          // or server returns response with an error status.
        });

    };

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

    $scope.LoadUsersPage = function() {
        window.location.href = "/checklist_site/users/";

    };

    $scope.LoadChecklistsPage = function() {
        window.location.href = "/checklist_site/checklists/";
    };

    $scope.LoadDashboardPage = function() {
        window.location.href = "/checklist_site/ch_dashboard/";

    };


    /** Repor reworker cousts */

    $scope.report_reworker_cousts = {}

    $scope.report_reworker_cousts.initDate = new Date();
    $scope.report_reworker_cousts.endDate = new Date();
    $scope.report_reworker_cousts.eng = 0;
    $scope.report_reworker_cousts.qua = 0;
    $scope.report_reworker_cousts.prod = 0;
    $scope.report_reworker_cousts.showReport = false;


    $scope.GenerateReportReworkerCousts = function() {

        $scope.report_reworker_cousts.eng = 0;
        $scope.report_reworker_cousts.qua = 0;
        $scope.report_reworker_cousts.prod = 0;
        $scope.report_reworker_cousts.showReport = false;
         
        url = "/checklist_site/redcard_get_reworker_cousts/"
        + $scope.report_reworker_cousts.initDate.yyyymmdd() 
        + "/" + $scope.report_reworker_cousts.endDate.yyyymmdd() + "/";

        $http.get(url, "").  
        success(function(data, status, headers, config) {

            $scope.report_reworker_cousts.eng = data.eng;
            $scope.report_reworker_cousts.qua = data.qua;
            $scope.report_reworker_cousts.prod = data.prod;
            $scope.report_reworker_cousts.showReport = true;        

        }).
        error(function(data, status, headers, config) {
            alert("Error getting tests");
            return 0;
            // called asynchronously if an error occurs
            // or server returns response with an error status.
        });
    };

    Date.prototype.yyyymmdd = function() {
        var mm = this.getMonth() + 1; // getMonth() is zero-based
        var dd = this.getDate();

        return [this.getFullYear(),
                '-',
                (mm>9 ? '' : '0') + mm,
                '-',
                (dd>9 ? '' : '0') + dd
                ].join('');
        };


    // $scope.GetAllTests = function(page) {

    //     if($scope.filterText != ""){
    //         if($scope.serialFilterText != "") {
    //             url = "/checklist_site/tests_get/" + page + "/" + $scope.sortKey + "/" + $scope.sortSign + "/" + $scope.filterText + "/" 
    // + $scope.serialFilterText + "/";
    //         } else {
    //             url = "/checklist_site/tests_get/" + page + "/" + $scope.sortKey + "/" + $scope.sortSign + "/" + $scope.filterText + "/";
    //         }
    //     } else if($scope.serialFilterText != "") {
    //         url = "/checklist_site/tests_get/" + page + "/" + $scope.sortKey + "/" + $scope.sortSign + "/" + "null/" + $scope.serialFilterText + "/";
    //     } else {
    //         url = "/checklist_site/tests_get/" + page + "/" + $scope.sortKey + "/" + $scope.sortSign + "/";
    //     }
    //     console.log('get all tests: ' + url);

    //     $scope.tests_list = [];

    //     $http.get(url, "").  
    //     success(function(data, status, headers, config) {

    //         console.log(data);

    //         data_tests = data['tests'];
            
    //         $scope.num_pages = data['num_pages'];

    //         if($scope.pagination_list.length == 0) {

    //             for(i=1; i<= $scope.num_pages; i++) {
    //                 p = {};
    //                 p.number = i;
    //                 if (i<=$scope.max_showed_values) {
    //                     p.show = true;
    //                 }else {
    //                     p.show = false;
    //                 }

    //                 $scope.pagination_list.push(p);
    //             }
    //         }
           
    //         $scope.current_page = page;

    //         for (i = 0; i < data_tests.length; i++){
    //             $scope.tests_list.push({
    //                 test_id: data_tests[i].test_id,
    //                 test_serial_number: $scope.ConvertSerialNumberToHex(data_tests[i].test_serial_number, data_tests[i].test_hex_serial_number),
    //                 test_creation_date: data_tests[i].test_creation_date,
    //                 test_status: data_tests[i].test_status,
    //                 test_checkout_id: data_tests[i].test_checkout_id,
    //                 test_finish_date: data_tests[i].test_test_finish_date,
    //                 test_checklist_id: data_tests[i].test_checklist_id,
    //                 test_committed: data_tests[i].test_committed,
    //                 test_hex_serial_number: data_tests[i].test_hex_serial_number,
    //                 checklist_name: data_tests[i].checklist_name,
    //                 checklist_code: data_tests[i].checklist_code,
    //                 checklist_version: data_tests[i].checklist_version
    //             });
    //         }
                        
    //         console.log(data);
    //     }).
    //     error(function(data, status, headers, config) {
    //         alert("Error getting tests");
    //         return 0;
    //         // called asynchronously if an error occurs
    //         // or server returns response with an error status.
    //     }); 
        
    // };    
    
    /** End Repor reworker cousts */
  
})