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

angular.module("boasPraticasApp", ['ngCookies', 'ui.bootstrap.contextMenu'])

.config(function($httpProvider, $interpolateProvider) {
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken'; //add these lines to enable CSFR cookie in order to make post requests work
    $interpolateProvider.startSymbol('{[{').endSymbol('}]}');
})

.controller("BoasPraticasController", function($scope, $http, $cookies, $window) {


    //Auto hide navbar
    $("nav.navbar-fixed-top").autoHidingNavbar();

    $scope.welcome_message = "Testes";

    //// Autenticação de usuarios////
    $scope.logged_user = [];
    $scope.serialFilterText = ""
    $scope.codeFilterText = ""
    $scope.filterText = ""
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
    //// Autenticação de usuarios////


    //// Pagination ////

    $scope.num_pages = 0
    $scope.current_page = 1;
    $scope.first_showed_page = 1;
    $scope.max_showed_values = 3;
    $scope.last_showed_page = $scope.max_showed_values;
    $scope.pagination_list = [];
    $scope.goodPracticesVersionFilter = "";
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
            $scope.GetAllTests(page);
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
            $scope.GetAllTests(page);
        }
    };

    $scope.pageFirst = function(page) {
        $scope.last_showed_page = $scope.max_showed_values;
        $scope.first_showed_page = 1;
        $scope.pagination_list = [];
        $scope.GetAllTests(page);
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
        $scope.GetAllTests(page);
    }

    $scope.lastPageIsShowed = function() {
        if($scope.pagination_list[$scope.num_pages-1] != null)
            return $scope.pagination_list[$scope.num_pages-1].show;

        return false;
    };

    //// END PAGINATION ////

    //// Métodos para testes /////
    $scope.tests_list = [];

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
        good_practices_code:"",
        checklist_version:0
    };


    $scope.GetAllTests = function(page) {

        request = []

        request.push({
            page: page,
            sortSign: $scope.sortSign,
            sortKey: $scope.sortKey,
            filterText: $scope.filterText,
            serialFilterText: $scope.serialFilterText,
            codeFilterText: $scope.codeFilterText,
            statusFilter: $scope.statusFilter,
            goodPractices:1,
            goodPracticesVersion: $scope.goodPracticesVersionFilter
        });

        url = "/checklist_site/tests_good_practices_get/"


        $scope.tests_list = [];

        console.log(request)

        $http.post(url, {request}).
        success(function(data, status, headers, config) {

            console.log("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");

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
                    test_finish_date: data_tests[i].test_test_finish_date,
                    test_checklist_id: data_tests[i].test_checklist_id,
                    test_committed: data_tests[i].test_committed,
                    test_hex_serial_number: data_tests[i].test_hex_serial_number,
                    checklist_name: data_tests[i].checklist_name,
                    checklist_code: data_tests[i].checklist_code,
                    checklist_version: data_tests[i].checklist_version,
                    good_practices_version: data_tests[i].good_practices_version
                });
            }

            console.log(data);
        }).
        error(function(data, status, headers, config) {
            alert("Error getting tests");
            return 0;
            // called asynchronously if an error occurs
            // or server returns response with an error status.
        });

    };

    $scope.ConvertSerialNumberToHex = function(serial_number, hex_serial_number) {
        if (hex_serial_number)
        {
            return (parseInt(serial_number)).toString(16).toUpperCase();
        }

        return serial_number;
    };

    $scope.CreateTest = function() {

        var validation = 1;

        alert_user = document.getElementById("invalid_Test");
        alert_user.innerHTML = "";
        alert_user.style.display="none";

        if(($scope.test_model.checklist_name == "") || ($scope.test_model.checklist_name == undefined)){
            console.log("1")
            validation = 0;
            alert_user = document.getElementById("invalid_Test");
            alert_user.style.display="block";
            alert_user.innerHTML += "<li>O Campo <b>Código do checklist</b> deve ser preenchido</li>";
        }

        if (validation)
        {
            if(($scope.test_junior.good_practices_code == "") || ($scope.test_junior.good_practices_code == undefined)){
                console.log("2")
                validation = 0;
                alert_user = document.getElementById("invalid_Test");
                alert_user.style.display="block";
                alert_user.innerHTML += "<li>O Campo <b>Número de Série</b> deve ser preenchido</li>";
            }
        }


        if (validation)
        {
            if(($scope.test_junior.checklist_version == "") || ($scope.test_junior.checklist_version == undefined)){
                console.log("3")
                validation = 0;
                alert_user = document.getElementById("invalid_Test");
                alert_user.style.display="block";
                alert_user.innerHTML += "<li>O Campo <b>Número de Série</b> deve ser preenchido</li>";
            }
        }


        //
        console.log("entreiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii vana")
        if (validation)
        {
        console.log(data)
            $http.post("/checklist_site/test_good_practices_save2/", {test:$scope.test_model}).
            success(function(data, status, headers, config) {
                // this callback will be called asynchronously
                // when the response is available
                $('#modalCreateTest').modal('hide');
                $scope.ClearTestModel();
                window.location.href = "/test/" + data[0].pk;


            }).
            error(function(data, status, headers, config) {
                if(status == 404){
                    validation = 0;
                    alert_user = document.getElementById("invalid_Test");
                    alert_user.style.display = "block";
                    alert_user.innerHTML += "<li>Não existe checklist com este código</li>";
                }else {
                    alert(status);
                }
                // called asynchronously if an error occurs
                // or server returns response with an error status.
            });
        }
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
    }

    $scope.StartTest = function(test_id) {
        window.location.href = "/checklist_site/test/" + test_id;
    };

    $scope.StartTestNewTab = function(test_id)
    {
        window.open("/checklist_site/test/" + test_id,'_blank');
    };

    $scope.testToDelete = "";

    $scope.SetTestToDelete = function(test_id,index) {
        $scope.testToDelete = test_id;
        $scope.index = index
    }

    $scope.DeleteTest = function() {
        $http.post("/checklist_site/test_delete/" + $scope.testToDelete + "/", "").
            success(function(data, status, headers, config) {

                $scope.tests_list.splice($scope.index,1);
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
    }

    $scope.serialFilterText = ""
    $scope.filterText = "";
    $scope.statusFilter = "";
    $scope.sortKey = "serial_number";
    $scope.sortSign = "p";
    $scope.SetSortKey = function(sortName) {

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
        $scope.GetAllTests(1);
    }

    $scope.setFilterText = function() {
        $scope.last_showed_page = $scope.max_showed_values;
        $scope.first_showed_page = 1;
        $scope.pagination_list = [];
        $scope.GetAllTests(1);
    }

    $scope.setSerialFilterText = function() {
        $scope.last_showed_page = $scope.max_showed_values;
        $scope.first_showed_page = 1;
        $scope.pagination_list = [];
        $scope.GetAllTests(1);
    }

    /////// Context Menu ////////
    $scope.menuOptions = function (test) {
        if ($scope.user_isSuper() && test.test_committed == -1)
        {
            return [
                ['Abrir', function ($itemScope) {
                    $scope.StartTest($itemScope.test.test_id);

                }],
                ['Abrir em Nova Guia', function ($itemScope) {
                    $scope.StartTestNewTab($itemScope.test.test_id);

                }],
                null, // Dividier
                ['Excluir', function ($itemScope) {
                    $scope.SetTestToDelete($itemScope.test.test_id,$itemScope.$index);
                    $("#modalConfirmDeleteTest").modal("show");
                }]
            ];
        }
        return [
            ['Abrir', function ($itemScope) {
                $scope.StartTest($itemScope.test.test_id);

            }],
            ['Abrir em Nova Guia', function ($itemScope) {
                $scope.StartTestNewTab($itemScope.test.test_id);

            }],
        ];
    };
})