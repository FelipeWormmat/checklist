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

angular.module("checkoutApp", ['ngCookies', 'ui.bootstrap.contextMenu', 'ui.toggle'])

.config(function($httpProvider, $interpolateProvider) {
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken'; //add these lines to enable CSFR cookie in order to make post requests work
    $interpolateProvider.startSymbol('{[{').endSymbol('}]}');
})

.controller("CheckoutCtrl", function($scope, $http, $cookies, $window) {

    //Auto hide navbar
    $("nav.navbar-fixed-top").autoHidingNavbar();

    $scope.welcome_message = "Checkout";
    $scope.historyMode = "Clientes";
    $scope.buttonState = true;
    $scope.limitTests = 0;

//// Métodos para Usuários ////
    $scope.logged_user = [];
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
    //// Métodos para Usuários ////

     //// Pagination ////

    $scope.num_pages = 0
    $scope.current_page = 1;
    $scope.first_showed_page = 1;
    $scope.max_showed_values = 3;
    $scope.last_showed_page = $scope.max_showed_values;
    $scope.pagination_list = [];

    $scope.currentTab = 2;
    $scope.pagePrevious = function(page) {
        if(page > 0){
             if(page < $scope.first_showed_page){

                for(i=0; i< $scope.num_pages; i++) {

                    if (((i+1)>= ($scope.first_showed_page -1)) && ((i+1) < (($scope.first_showed_page + $scope.max_showed_values)-1))) {
                        $scope.pagination_list[i].show = true;
                    }else {
                        $scope.pagination_list[i].show = false;
                    }
                }
                $scope.first_showed_page--;
                $scope.last_showed_page--;
            }

            $scope.pageClick(page);
        }
    };

    $scope.pageNext = function(page) {

        if(page <= $scope.num_pages){
            if(page > $scope.last_showed_page){

                for(i=0; i< $scope.num_pages; i++) {

                    if (((i+1)<= ($scope.last_showed_page + 1)) && ((i+1) > (($scope.last_showed_page - $scope.max_showed_values)+1))) {
                        $scope.pagination_list[i].show = true;
                    }else {
                        $scope.pagination_list[i].show = false;
                    }
                }
                $scope.last_showed_page++;
                $scope.first_showed_page++;
            }
            $scope.pageClick(page);
        }
    };

    $scope.pageFirst = function(page) {
        $scope.last_showed_page = $scope.max_showed_values;
        $scope.first_showed_page = 1;
        $scope.pagination_list = [];
        $scope.pageClick(page);
    };

    $scope.pageLast = function(page) {
        $scope.last_showed_page = $scope.num_pages;
        $scope.first_showed_page = $scope.num_pages - ($scope.max_showed_values - 1);

       for(i=0; i< $scope.num_pages; i++) {
            if (((i+1)>= ($scope.first_showed_page)) && ((i+1) < (($scope.last_showed_page+1)))) {
                $scope.pagination_list[i].show = true;
            }else {
                $scope.pagination_list[i].show = false;
            }
        }
        $scope.pageClick(page);
    }

    $scope.lastPageIsShowed = function() {
        if($scope.pagination_list[$scope.num_pages-1] != null)
            return $scope.pagination_list[$scope.num_pages-1].show;

        return false;
    };

    $scope.pageClick = function(page) {

        switch($scope.currentTab) {
            case 1:
                $scope.GetAllTests(page); break;
            case 2: break;
            case 3:
                $scope.GetCheckoutTests(page); break;
            case 4:
                $scope.GetCheckoutsWithTests(page); break;
        }
    }

    //// END PAGINATION ////

    //// Mátodos para Testes ////
    $scope.tests_list = [];
    $scope.tests_to_do_checkout = [];

    $scope.serialFilterText = "";
    $scope.filterText = "";
    $scope.nfFilterText = "";
    $scope.clientFilterText = "";
    $scope.codeFilterText = "";
    $scope.sortKey = "serial_number";
    $scope.sortSign = "p";

    $scope.test_model = {
        test_id: 0,
        test_serial_number: "",
        test_creation_date: "",
        test_status: "Novo",
        test_checklist_id: "",
        test_finish_date: "",
        test_checkout_id: "",
        test_committed: "",
        test_hex_serial_number: 0,
        checklist_name:"",
        checklist_code:"",
        checklist_version:0
    };

    $scope.SetSortKey = function(sortName) {
        console.log("sortKey")
        if(sortName == $scope.sortKey)
        {
            if ($scope.sortSign == "p")
                $scope.sortSign = "n";
            else
                $scope.sortSign = "p";
        }
        else
        {
            $scope.sortSign = "p";
            $scope.sortKey = sortName;
        }
        $scope.SortItemsBy();
    }

    $scope.SortItemsBy = function() {
        $scope.last_showed_page = $scope.max_showed_values;
        $scope.first_showed_page = 1;
        $scope.pagination_list = [];
        $scope.pageClick(1);
    }

    $scope.GetAllTests = function(page) {
        $scope.tests_list = [];
        $scope.showAjaxAnnimation = true;
        request = []

        request.push({
            page: page,
            sortSign: $scope.sortSign,
            sortKey: $scope.sortKey,
            filterText: $scope.filterText,
            serialFilterText: $scope.serialFilterText,
            codeFilterText: $scope.codeFilterText,
        });
        console.log(request)

        url = "/checklist_site/tests_get_for_checkout/";
        $scope.tests_list = [];

        $http.post(url, {request}).
        success(function(data, status, headers, config) {
            $scope.tests_list = [];

            data_tests = data['tests'];

            $scope.num_pages = data['num_pages'];

            if($scope.pagination_list.length == 0) {

                for(i=1; i<= $scope.num_pages; i++) {
                    p = {};
                    p.number = i;
                    if (i<=$scope.max_showed_values) {
                        p.show = true;
                    }else {
                        p.show = false;
                    }
                    $scope.pagination_list.push(p);
                }
            }

            $scope.current_page = page;

            for (i = 0; i < data_tests.length; i++){

                $scope.tests_list.push({
                    test_id: data_tests[i].test_id,
                    test_serial_number: $scope.ConvertSerialNumberToHex(data_tests[i].test_serial_number, data_tests[i].test_hex_serial_number),
                    test_creation_date: data_tests[i].test_creation_date,
                    test_status: data_tests[i].test_status,
                    test_checkout_id: data_tests[i].test_checkout_id,
                    test_finish_date: data_tests[i].test_finish_date,
                    test_checklist_id: data_tests[i].test_checklist_id,
                    test_committed: data_tests[i].test_committed,
                    test_hex_serial_number: data_tests[i].test_hex_serial_number,
                    checklist_name: data_tests[i].checklist_name,
                    checklist_code: data_tests[i].checklist_code,
                    checklist_version: data_tests[i].checklist_version,
                    checked: data_tests[i].checked
                });
            }
            console.log("all tests...");
            console.log($scope.tests_list);
            $scope.showAjaxAnnimation = false;

        }).
        error(function(data, status, headers, config) {
            alert("Error getting tests");
            return 0;
            // called asynchronously if an error occurs
            // or server returns response with an error status.
        });
    };

     $scope.GetTestsByCheckout = function(checkout_id) {
        $scope.showAjaxAnnimation = true;
        $scope.tests_by_checkout_list = [];
        url = "/checklist_site/tests_get_by_checkout/" + checkout_id + "/";

        $http.get(url, "").
        success(function(data, status, headers, config) {
            $scope.tests_by_checkout_list = [];

            data_tests = data['tests'];

            for (i = 0; i < data_tests.length; i++){

                $scope.tests_by_checkout_list.push({
                    test_id: data_tests[i].test_id,
                    test_serial_number: $scope.ConvertSerialNumberToHex(data_tests[i].test_serial_number, data_tests[i].test_hex_serial_number),
                    test_creation_date: data_tests[i].test_creation_date,
                    test_status: data_tests[i].test_status,
                    test_checkout_id: data_tests[i].test_checkout_id,
                    test_finish_date: data_tests[i].test_finish_date,
                    test_checklist_id: data_tests[i].test_checklist_id,
                    test_committed: data_tests[i].test_committed,
                    test_hex_serial_number: data_tests[i].test_hex_serial_number,
                    checklist_name: data_tests[i].checklist_name,
                    checklist_code: data_tests[i].checklist_code,
                    checklist_version: data_tests[i].checklist_version,
                    checked: data_tests[i].checked

                });
            }

            $scope.showAjaxAnnimation = false;

        }).
        error(function(data, status, headers, config) {
            alert("Error getting checkout tests");
            return 0;
            // called asynchronously if an error occurs
            // or server returns response with an error status.
        });
     };

    $scope.GetCheckoutTests = function(page) {
        $scope.tests_list = [];
        $scope.showAjaxAnnimation = true;

        request = []

        request.push({
            page: page,
            sortSign: $scope.sortSign,
            sortKey: $scope.sortKey,
            filterText: $scope.filterText,
            serialFilterText: $scope.serialFilterText,
            codeFilterText: $scope.codeFilterText,
            clientFilterText: $scope.clientFilterText,
            nfFilterText: $scope.nfFilterText
        });

        url = "/checklist_site/tests_get_checkout/";

        $http.post(url, {request}).
        success(function(data, status, headers, config) {
            $scope.tests_list = [];

            data_tests = data['tests'];

            $scope.num_pages = data['num_pages'];

            if($scope.pagination_list.length == 0) {

                for(i=1; i<= $scope.num_pages; i++) {
                    p = {};
                    p.number = i;
                    if (i<=$scope.max_showed_values) {
                        p.show = true;
                    }else {
                        p.show = false;
                    }
                    $scope.pagination_list.push(p);
                }
            }

            $scope.current_page = page;

            for (i = 0; i < data_tests.length; i++){

                $scope.tests_list.push({
                    test_id: data_tests[i].test_id,
                    test_serial_number: $scope.ConvertSerialNumberToHex(data_tests[i].test_serial_number, data_tests[i].test_hex_serial_number),
                    test_creation_date: data_tests[i].test_creation_date,
                    test_status: data_tests[i].test_status,
                    test_checkout_id: data_tests[i].test_checkout_id,
                    test_finish_date: data_tests[i].test_finish_date,
                    test_checklist_id: data_tests[i].test_checklist_id,
                    test_committed: data_tests[i].test_committed,
                    test_hex_serial_number: data_tests[i].test_hex_serial_number,
                    checklist_name: data_tests[i].checklist_name,
                    checklist_code: data_tests[i].checklist_code,
                    checklist_version: data_tests[i].checklist_version,
                    checked: data_tests[i].checked,
                    note: data_tests[i].checkout_note,
                    client: data_tests[i].checkout_client
                });
            }

            console.log("tests checkout...");
            console.log($scope.tests_list);
            $scope.showAjaxAnnimation = false;

        }).
        error(function(data, status, headers, config) {
            alert("Error getting checkout tests");
            return 0;
            // called asynchronously if an error occurs
            // or server returns response with an error status.
        });

    };

    $scope.GetCheckoutsWithTests = function(page) {
        $scope.checkouts_list = [];
        $scope.showAjaxAnnimation = true;
        request = []

        if ($scope.sortKey == "creation_date"){
            console.log("chegou aqui")
            $scope.sortKey = "creation_dateTime";
        }

        request.push({
            page: page,
            sortSign: $scope.sortSign,
            sortKey: $scope.sortKey,
            filterText: $scope.filterText
        });

        url = "/checklist_site/checkout_get_checkouts/";

        $http.post(url, {request})
        .success(function(data, status, headers, config) {
            $scope.checkouts_list = [];


            data_checkouts = data['checkouts'];

            $scope.num_pages = data['num_pages'];

            if($scope.pagination_list.length == 0) {

                for(i=1; i<= $scope.num_pages; i++) {
                    p = {};
                    p.number = i;
                    if (i<=$scope.max_showed_values) {
                        p.show = true;
                    }else {
                        p.show = false;
                    }

                    $scope.pagination_list.push(p);
                }
            }

            $scope.current_page = page;

            for(i=0; i<data_checkouts.length; i++) {
                $scope.checkouts_list.push({
                    id: data_checkouts[i].id,
                    client: data_checkouts[i].client,
                    creation_dateTime: data_checkouts[i].creation_dateTime,
                    user: data_checkouts[i].user,
                    note: data_checkouts[i].note,
                    amount: data_checkouts[i].amount_of_tests
                });
            }

            $scope.showAjaxAnnimation = false;

        }).
        error(function(data, status, headers, config) {
            alert("Error getting checkout tests");
            return 0;
            // called asynchronously if an error occurs
            // or server returns response with an error status.
        });
    }


 $scope.ConvertSerialNumberToHex = function(serial_number, hex_serial_number) {
    if (hex_serial_number) {
        return (parseInt(serial_number)).toString(16).toUpperCase();
    }
    return serial_number;
 };

 $scope.ClearTestModel = function() {

       $scope.test_model = {
            test_id: 0,
            test_serial_number: "",
            test_creation_date: "",
            test_status: "Novo",
            test_checklist_id: "",
            test_finish_date: "",
            test_checkout_id: "",
            test_committed: "",
            test_hex_serial_number: 0,
            checklist_name:"",
            checklist_code:"",
            checklist_version:0
        };
    };

    $scope.StartTest = function(test_id) {
        window.location.href = "/checklist_site/test/" + test_id;
    };

    $scope.StartTestNewTab = function(test_id)
    {
        window.open("/checklist_site/test/" + test_id,'_blank');
    };

    $scope.testToDelete = "";

    $scope.SetTestToDelete = function(test_id) {
        $scope.testToDelete = test_id;
    };

    $scope.DeleteTest = function() {
        $http.post("/checklist_site/test_delete/" + $scope.testToDelete + "/", "").
            success(function(data, status, headers, config) {
                // this callback will be called asynchronously
                // when the response is available
                $scope.ClearTestModel();
                $scope.SetPaginationTab(0);
                //window.location.href = "/test/" + user_id + "/" + data[0].pk;
            }).
            error(function(data, status, headers, config) {
                alert(status + " - Error creating test");
                $scope.ClearTestModel();
                // called asynchronously if an error occurs
                // or server returns response with an error status.
            });

    };

    $scope.TestsListCount = function() {
        return $scope.tests_list.length;
    };



    $scope.setFilterText = function(filterText) {
        $scope.filterText = filterText
        $scope.last_showed_page = $scope.max_showed_values;
        $scope.first_showed_page = 1;
        $scope.pagination_list = [];
        $scope.pageClick(1);
    };

    $scope.setSerialFilterText = function(serialFilterText) {
        $scope.serialFilterText = serialFilterText;
        $scope.last_showed_page = $scope.max_showed_values;
        $scope.first_showed_page = 1;
        $scope.pagination_list = [];
        $scope.pageClick(1);
    };

    $scope.setCodeFilterText = function(codeFilterText) {
        $scope.codeFilterText = codeFilterText
        $scope.last_showed_page = $scope.max_showed_values;
        $scope.first_showed_page = 1;
        $scope.pagination_list = [];
        $scope.pageClick(1);
    };

    $scope.setClientFilterText = function(clientFilterText) {
        $scope.clientFilterText = clientFilterText
        $scope.last_showed_page = $scope.max_showed_values;
        $scope.first_showed_page = 1;
        $scope.pagination_list = [];
        $scope.pageClick(1);
    };

    $scope.setNfFilterText = function(nfFilterText) {
        $scope.nfFilterText = nfFilterText
        $scope.last_showed_page = $scope.max_showed_values;
        $scope.first_showed_page = 1;
        $scope.pagination_list = [];
        $scope.pageClick(1);
    };

    $scope.clearFilters = function(){
        $scope.filterText = "";
        $scope.serialFilterText = "";
        $scope.codeFilterText = "";
        $scope.sortSign = "n";
        $scope.sortKey = "creation_date";
    }

    $scope.tabClick = function(tabItem){
        $scope.currentTab = tabItem;
        $scope.clearFilters()
        $scope.setFilterText("");
    }



    //// Métodos para Testes ////



    //// Metodos para checkout ////


    $scope.RunCheckout = function(checkout_note, checkout_client) {
        var tests_id = [];

        if ((checkout_client != "") && (checkout_client != undefined) && (checkout_note != "") && (checkout_note != undefined)) {
            $scope.showAjaxAnnimation = true;
            $scope.buttonState = false;
            for(i=0; i<$scope.tests_to_do_checkout.length; i++) {
                $scope.tests_to_do_checkout[i].test_status = "Checkout";
                tests_id.push($scope.tests_to_do_checkout[i].test_id);
            }
            console.log(tests_id)

            console.log($scope.tests_to_do_checkout);

            if($scope.tests_to_do_checkout.length > 0) {
                $http.post('/checklist_site/checkout_save/', {user_id:$scope.logged_user[0].user_id, client:checkout_client, note:checkout_note, tests:tests_id}).
                success(function(data, status, headers, config) {

                    $scope.checkout_client = "";
                    $scope.checkout_note = "";
                    $scope.showAjaxAnnimation = false;
                    $scope.buttonState = true;
                    $window.location.reload();
                }).
                error(function(data, status, headers, config) {
                    alert("Erro ao realizar checkout");
                    $scope.showAjaxAnnimation = false;
                    $scope.buttonState = true;
                });
            }
        }
    };

    $scope.testChecked = function(test) {

        if(test.checked) {
            $scope.limitTests = $scope.limitTests + 1

            if ($scope.limitTests <= 99999){
                $scope.tests_to_do_checkout.push({
                    test_id: test.test_id,
                    test_serial_number: test.test_serial_number,
                    test_creation_date: test.test_creation_date,
                    test_status: test.test_status,
                    test_checkout_id: test.test_checkout_id,
                    test_finish_date: test.test_finish_date,
                    test_checklist_id: test.test_checklist_id,
                    test_committed: test.test_committed,
                    test_hex_serial_number: test.test_serial_number,
                    checklist_name: test.checklist_name,
                    checklist_code: test.checklist_code,
                    checklist_version: test.checklist_version,
                    checked: true
                });

            } else {
                alert("Você passou do limite de 200 checkouts por nota")
                test.checked = false
                $scope.limitTests = $scope.limitTests - 1
            }

        } else {

            for(i=0;i<$scope.tests_to_do_checkout.length; i++) {
                if($scope.tests_to_do_checkout[i].test_id == test.test_id){
                    $scope.tests_to_do_checkout.splice(i,1);
                    $scope.limitTests = $scope.limitTests - 1
                }
            }
        }
    };
    $scope.containsInCheckoutList = function(test){

        for(i=0;i<$scope.tests_to_do_checkout.length; i++) {
            if($scope.tests_to_do_checkout[i].test_id == test.test_id){
                test.checked = true;
                break;
            } else {
                test.checked = false;
            }
        }
    }

    $scope.SetCheckout = function(checkout,index) {
        $scope.checkout_model = checkout;
        $scope.GetTestsByCheckout(checkout.id);
        $scope.index = index;
    };


    $scope.DeleteCheckout = function() {
        $http.post('/checklist_site/checkout_delete/', {checkout_id:$scope.checkout_model.id}).
        success(function(data, status, headers, config) {

            $scope.checkouts_list.splice($scope.index,1);

        }).
        error(function(data, status, headers, config) {
            alert(status + 'erro ao deletar');
        });
    };

    /////// Context Menu ////////
    $scope.menuOptions = function (sType) {
        if (sType == "test")
        {
            return [
                ['Abrir', function ($itemScope) {
                    $scope.StartTest($itemScope.test.test_id);

                }],
                ['Abrir em Nova Guia', function ($itemScope) {
                    $scope.StartTestNewTab($itemScope.test.test_id);

                }],
            ];
        }
        return [
            ['Abrir', function ($itemScope) {
                $scope.SetCheckout($itemScope.checkout,index);
                $("#modalViewCheckout").modal("show");

            }],
            ['Excluir', function ($itemScope) {
                $scope.SetCheckout($itemScope.checkout,$itemScope.$index);
                $("#modalConfirmDeleteCheckout").modal("show");

            }],
        ];
    };

})