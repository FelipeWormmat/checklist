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

angular.module("testsApp", ['ngCookies', 'ui.bootstrap.contextMenu'])

.config(function($httpProvider, $interpolateProvider) {
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken'; //add these lines to enable CSFR cookie in order to make post requests work
    $interpolateProvider.startSymbol('{[{').endSymbol('}]}');
})

.controller("actionsController", function($scope, $http, $cookies, $window, $filter) {
    //Auto hide navbar
    $("nav.navbar-fixed-top").autoHidingNavbar();

    //// Autenticação de usuarios////
    $scope.logged_user = [];
    $scope.user_function = "";
    $scope.user_sector = "";


    $scope.Logout = function() {
        window.localStorage.clear();
        window.location.href = "/checklist_site/";
    }
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
    $scope.GetLoggedUser = function() {
        if (!$scope.getUserStorage()){
            $scope.Logout();
        }
        else{
            $scope.logged_user = [];
            $http.get("/checklist_site/user_edit_get/" + $scope.user_id +"/","").
            success(function(data, status, headers, config) {
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

    $scope.CheckUser = function(taskToDo){

        $http.post("/checklist_site/login_check/" + $scope.logged_user[0].user_id + "/" ,"").
        success(function(data, status, headers, config) {
            if (data[0].fields.logged)
            {
                if (taskToDo == "LoadUsersPage")
                    window.location.href = "/checklist_site/users/" + $scope.logged_user[0].user_id + "/";
                else if (taskToDo == "LoadChecklistsPage")
                    window.location.href = "/checklist_site/checklists/" + $scope.logged_user[0].user_id + "/";
                else if (taskToDo == "LoadNCHomePage")
                    window.location.href = "/sistema_rnc/home/" + $scope.logged_user[0].user_id + "/";
                else if (taskToDo == "LoadNCSPage")
                    window.location.href = "/sistema_rnc/list/" + $scope.logged_user[0].user_id + "/";
                else if (taskToDo == "LoadActionsPage")
                    window.location.href = "/sistema_rnc/actions/" + $scope.logged_user[0].user_id + "/";
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

    $scope.user_canEdit = function() {
        if ((($scope.user_function == "Supervisor") && ($scope.user_sector == "Qualidade")) || ($scope.user_function == "Administrador"))
            return 1;
        
        return 0;
    };

    $scope.LoadUsersPage = function() {
        window.location.href = "/checklist_site/users/";
    };

    $scope.LoadChecklistsPage = function() {
        window.location.href = "/checklist_site/checklists/";

    };

    $scope.LoadNCHomePage = function() {
        window.location.href = "/sistema_rnc/home/";

    };

    $scope.LoadNCSPage = function() {
        window.location.href = "/sistema_rnc/list/";

    };

    $scope.LoadActionsPage = function() {
        window.location.href = "/sistema_rnc/actions/";

    };
    //// Autenticação de usuarios////


    //// Pagination ////

    $scope.num_pages = 0
    $scope.current_page = 1;
    $scope.first_showed_page = 1;
    $scope.max_showed_values = 3;
    $scope.last_showed_page = $scope.max_showed_values;
    $scope.pagination_list = [];

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
            $scope.GetAllActions(page);
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
            $scope.GetAllActions(page);
        }
    };

    $scope.pageFirst = function(page) {
        $scope.last_showed_page = $scope.max_showed_values;
        $scope.first_showed_page = 1;
        $scope.pagination_list = [];
        $scope.GetAllActions(page);
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
        $scope.GetAllActions(page);
    }

    $scope.lastPageIsShowed = function() {
        if($scope.pagination_list[$scope.num_pages-1] != null)
            return $scope.pagination_list[$scope.num_pages-1].show;

        return false;
    };

    //// END PAGINATION ////


    $scope.actionModel = {
        id: "",
        // duration: "",
    };


    $scope.numberFilterText = ""
    $scope.yearFilterText = "";
    $scope.progressFilter = "";
    $scope.typeFilter = "";
    $scope.divisionFilter = "";
    $scope.dayFilterText = "";
    $scope.monthFilterText = "";
    $scope.reasonFilterText = "";
    $scope.howFilterText = "";
    $scope.yearNCFilterText = "";
    $scope.type = "";
    $scope.sortKey = "number";
    $scope.sortSign = "n";
    $scope.progressList = []
    $scope.types = []
    $scope.divisions = []
    $scope.noncs = []
    $scope.users = []
    $scope.isActionEditing = false;
    $scope.today = new Date();



    $scope.GetActions = function(page, nonc_id) {
        console.log("GetActions() nonc_id = " + nonc_id)
        $scope.loading = true;
        request = []
        $scope.nc = nonc_id;
        request.push({
            page: page,
            sortSign: $scope.sortSign,
            sortKey: $scope.sortKey,
            number: $scope.numberFilterText,
            yearNC: $scope.yearNCFilterText,
            day: $scope.dayFilterText,
            month: $scope.monthFilterText,
            year: $scope.yearFilterText,
            type: $scope.typeFilter,
            division: $scope.divisionFilter,
            progress: $scope.progressFilter,
            reason: $scope.reasonFilterText,
            how: $scope.howFilterText,
            nc: nonc_id,
        });

        url = "/sistema_rnc/action_list_by_nonc/"

        console.log("request: ",request)
        $http.post(url, {request}).
        success(function(data, status, headers, config) {
            console.log("data: ",data)
            $scope.loading = false;

            data_ncs = data['ncs'];

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
            $scope.actions = []
            $scope.current_page = page;

            for (i = 0; i < data_ncs.length; i++){
                $scope.actions.push({
                    id: data_ncs[i].id,
                    how: data_ncs[i].how,
                    deadline: data_ncs[i].deadline,
                    end_date: data_ncs[i].end_date,
                    reason: data_ncs[i].reason,
                    obs: data_ncs[i].obs,
                    now_date: data_ncs[i].now_date,
                    number: data_ncs[i].number,
                    year: data_ncs[i].year,
                    type: data_ncs[i].type,
                    division: data_ncs[i].division,
                    progress: data_ncs[i].progress,
                    user: data_ncs[i].user,
                    expanded: false,
                });
            }
        }).
        error(function(data, status, headers, config) {
            alert("Error getting tests");
            return 0;
            // called asynchronously if an error occurs
            // or server returns response with an error status.
        });

    };

    $scope.expandSelected=function(action){
        $scope.actions.forEach(function(action){
            action.expanded=false;
        })
        action.expanded=true;
      }

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
            $scope.sortKey = sortName;
        }
        $scope.SortItemsBy();
    }

    $scope.SortItemsBy = function() {
        $scope.last_showed_page = $scope.max_showed_values;
        $scope.first_showed_page = 1;
        $scope.pagination_list = [];
        $scope.GetActions(1, $scope.nc);
    }

    $scope.setFilterText = function() {
        $scope.last_showed_page = $scope.max_showed_values;
        $scope.first_showed_page = 1;
        $scope.pagination_list = [];
        $scope.GetActions(1, $scope.nc);
    }

    $scope.setSerialFilterText = function() {
        $scope.last_showed_page = $scope.max_showed_values;
        $scope.first_showed_page = 1;
        $scope.pagination_list = [];
        $scope.GetActions(1, $scope.nc);    }

    $scope.setDeadline = function(){
        // date = $scope.actionModel.deadline
        // $scope.actionModel.deadline = $filter('date')(date, 'yyyy-MM-dd');
        $scope.actionModel.deadline = new Date($scope.date)
        $scope.actionModel.deadline = $filter('date')($scope.actionModel.deadline, 'yyyy-MM-dd');
        console.log($scope.actionModel.deadline)
    }

    $scope.saveAction = function(){
        var invalid = false;
        console.log("Model: ", $scope.actionModel)
        console.log("actionForm",actionForm);

        if(!$scope.actionModel.obs){
            $scope.actionModel.obs = "";
        }
        if(!$scope.actionModel.reason){
            $scope.actionModel.reason = "";
        }
        if(!$scope.actionModel.type){
            var invalid = true;
        }
        if(!$scope.actionModel.division){
            var invalid = true;
        }
        if(!$scope.actionModel.how){
            var invalid = true;
        }
        if(!$scope.actionModel.user){
            var invalid = true;
        }
        if(!$scope.actionModel.progress){
            var invalid = true;
        }
        if(!$scope.actionModel.deadline){
            var invalid = true;
        }

        if(invalid == true){
            console.log(invalid);
            alert("Preencha todos os campos")
            return;
        }

        $scope.isRequesting = true;

        if ($scope.isActionEditing){
            updateAction()
            console.log($scope.actionModel)
        } else {
            createAction()
        }

    }

    createAction = function() {        
        $http.post("/sistema_rnc/action_save/", {action:$scope.actionModel}).
        success(function(data, status, headers, config) {
            $scope.GetActions(1, $scope.nc);
            $scope.date = "";
            $("#modalCreateAction").modal("hide");
            $scope.isRequesting = false;
        }).
        error(function(data, status, headers, config) {
            alert("Não foi possível criar a ação.")
            $scope.isRequesting = false;

        });
    };

    updateAction = function(){
        $http.post("/sistema_rnc/action_update/", {action:$scope.actionModel}).
        success(function(data, status, headers, config) {
            $scope.GetActions($scope.current_page, $scope.nc);
            $("#modalCreateAction").modal("hide");
            $scope.isRequesting = false;
        }).
        error(function(data, status, headers, config) {
            alert("Não foi possível modificar a ação.")
            $scope.isRequesting = false;

        });
    }

    $scope.deleteAction = function(action){
        $scope.isRequesting = true;
        $http.post("/sistema_rnc/action_delete/",{action:action})
        .success(function(data,status,headers,config){
            $scope.GetActions($scope.current_page, $scope.nc)
            $("#modalDeleteAction").modal("hide");
            $scope.isRequesting = false;

        })
        .error(function(){
            alert("Não foi possível deletar o RNC")
            $scope.isRequesting = false;

        })
    }

    $scope.closeAction = function(action){
        $scope.isRequesting = true;
        $http.post("/sistema_rnc/action_close/",{action:action})
        .success(function(data,status,headers,config){
            $scope.GetActions($scope.current_page, $scope.nc)
            $("#modalCloseAction").modal("hide");
            $scope.isRequesting = false;
        })
        .error(function(){
            alert("Não foi possível fechar o RNC")
            $scope.isRequesting = false;
        })
    }


    $scope.setActionModel = function(action){

        const [year, month, day] = action.deadline.split('-');

        $scope.isActionEditing = true;
        $scope.actionModel.id = action.id;
        $scope.actionModel.how = action.how;
        $scope.actionModel.progress = action.progress;
        $scope.actionModel.division = action.division;
        $scope.actionModel.obs = action.obs;
        $scope.actionModel.type = action.type;
        $scope.actionModel.reason = action.reason;
        $scope.actionModel.user = action.user;
        $scope.date = new Date(year,month-1,day)
        $scope.setDeadline()
    }


    $scope.clearActionModel = function(nc_id){
        $scope.isActionEditing = false;
        $scope.actionModel = {}
        $scope.date = "";
        $scope.actionModel.rnc = nc_id;
    }

    $scope.getProgress = function(){
        $http.get("/sistema_rnc/progress/")
        .success(function(data){
            console.log(data)

                for (i = 0; i < data.length; i++){
                    $scope.progressList.push({
                        id: data[i].pk,
                        description: data[i].fields.progress,
                    });
                }
            })
        .error(function(err){
            console.log("error in getProgress")
        })
    }
    $scope.getType = function(){
        $http.get("/sistema_rnc/type/")
        .success(function(data){

            for (i = 0; i < data.length; i++){
                $scope.types.push({
                    id: data[i].pk,
                    description: data[i].fields.description_type,
                });
            }

        })
        .error(function(err){
            console.log("error in getType")
        })
    }

    $scope.getDivisions = function(){
        $http.get("/sistema_rnc/division/")
        .success(function(data){

            for (i = 0; i < data.length; i++){
                $scope.divisions.push({
                    id: data[i].pk,
                    description: data[i].fields.description_division,
                });
            }

        })
        .error(function(err){
            console.log("error in getDivisions")
        })
    }

    $scope.getUsers = function(){
        console.log("Entrei no getUsers")
        $http.get("/checklist_site/users_get_all/")
        .success(function(data){
            for (i = 0; i < data.length; i++){
                if ((data[i].fields.user_funtion == "Administrator") || (data[i].fields.user_funtion == "Supervisor") || (data[i].fields.user_funtion == "Usuário")){
                $scope.users.push({
                    id: data[i].pk,
                    description: data[i].fields.user_name,
                    function: data[i].fields.user_funtion
                });
              }
            }
         })
        .error(function(err){
            console.log("error in getDivisions")
        })
    }

    $scope.getRnc = function(nc_id){
        $scope.actionModel.rnc = nc_id;
        request = []
        request.push({
            id: nc_id,
            whatever: "",
        })
        url = "/sistema_rnc/nc_get/";
        $http.post(url, {request})
        .success(function(data){
            $scope.rncNumber = data['number'];
            $scope.rncYear = data['year'];
        }).error(function(data, err){
            alert("Nao foi possível buscar a RNC")
        });

    }

    $scope.getUsers();
    $scope.getType();
    $scope.getProgress();
    $scope.getDivisions();

    /////// Context Menu ////////
})