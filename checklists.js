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



    $('.form').find('input, textarea').on('keyup blur focus', function (e) {
  
        var $this = $(this),
            label = $this.prev('label');
      
            if (e.type === 'keyup') {
                  if ($this.val() === '') {
                label.removeClass('active highlight');
              } else {
                label.addClass('active highlight');
              }
          } else if (e.type === 'blur') {
              if( $this.val() === '' ) {
                  label.removeClass('active highlight'); 
                  } else {
                  label.removeClass('highlight');   
                  }   
          } else if (e.type === 'focus') {
            
            if( $this.val() === '' ) {
                  label.removeClass('highlight'); 
                  } 
            else if( $this.val() !== '' ) {
                  label.addClass('highlight');
                  }
          }
      
      });
      
      $('.tab a').on('click', function (e) {
        
        e.preventDefault();
        
        $(this).parent().addClass('active');
        $(this).parent().siblings().removeClass('active');
        
        target = $(this).attr('href');
      
        $('.tab-content > div').not(target).hide();
        
        $(target).fadeIn(600);
        
      });


    






    var $currentContextMenu = null;

    // Add active class to the current button (highlight it)
    var header = document.getElementById("nav nav-taboa");
    var btns = header.getElementsByClassName("active");
    for (var i = 0; i < btns.length; i++) {
    btns[i].addEventListener("click", function() {
    var current = document.getElementsByClassName("active");
    current[0].className = current[0].className.replace(" active", "");
    this.className += " active";
    });
}

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

.controller("ChecklistsCtrl", function($scope, $http, $cookies) {
    //// Loggout user if window is closed
    //window._link_was_clicked = false;
    //
    //window.onbeforeunload = function(event) {
    //    if (window._link_was_clicked)
    //    {
    //        return; // abort beforeunload
    //    }
    //
    //
    //    return "O usuário " + $scope.logged_user[0].user_name + " ficará impossibilitado de entrar no sistema por 15 minutos.\r\nEfetue o Log Out do sistema.";
    //};
//
    //jQuery(document).on('click', 'a', function(event) {
    //    window._link_was_clicked = true;
    //});
    //
    //jQuery(document).on('click', 'button', function(event) {
    //    window._link_was_clicked = true;
    //});
    //// Loggout user if window is closed

    //Auto hide navbar
    $("nav.navbar-fixed-top").autoHidingNavbar();

    $scope.welcome_message = "Checklists";

    $scope.stepToEditIndex = 0;
    $scope.isStepEdit = false;
    $scope.showPreviousVersions = false;

    console.log($cookies.myFavorite);

    //Checklist

    $scope.checklists_list = [];
    $scope.checklistsToShow_list = [];

    $scope.checklist_model = {
        id: 0,
        name: "",
        code: "",
        version: "",
        user_id: 1,
        creation_date: null,
        steps: 0,
        goodPractices: 0,
    };

    $scope.num_pages = 0
    $scope.current_page = 1;
    $scope.first_showed_page = 1;
    $scope.max_showed_values = 3;
    $scope.last_showed_page = $scope.max_showed_values;
    $scope.pagination_list = [];
    $scope.logged_user = [];
    $scope.filterText = "";
    $scope.showAjaxAnnimation = false;
    $scope.page = 1;

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

    $scope.checklist_id_edit = '';
    $scope.checklist_id_delete = '';

    $scope.ClearChecklistModel = function() {
        $scope.ClearStepsList();
        $scope.checklist_model.id = 0;
        $scope.checklist_model.name = "";
        $scope.checklist_model.code = "";
        $scope.checklist_model.version = "1";
        $scope.checklist_model.user_id = 0;
        $scope.checklist_model.creation_date = null;
    };

    $scope.pagePrevious = function(page) {
        $scope.page = page;
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
            $scope.GetChecklistsWithPaginator(page);
        }
    };

    $scope.pageNext = function(page) {
        $scope.page = page;
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
            $scope.GetChecklistsWithPaginator(page);
        }
    };

    $scope.pageFirst = function(page) {
        $scope.page = page;
        $scope.last_showed_page = $scope.max_showed_values;
        $scope.first_showed_page = 1;
        $scope.pagination_list = [];
        $scope.GetChecklistsWithPaginator(page);
    };

    $scope.pageLast = function(page) {
        $scope.page = page;
        $scope.last_showed_page = $scope.num_pages;
        $scope.first_showed_page = $scope.num_pages - ($scope.max_showed_values - 1);

       for(i=0; i< $scope.num_pages; i++) {
            if (((i+1)>= ($scope.first_showed_page)) && ((i+1) < (($scope.last_showed_page+1)))) {
                $scope.pagination_list[i].show = true;
            }else {
                $scope.pagination_list[i].show = false;
            }
        }
        $scope.GetChecklistsWithPaginator(page);
    }

    $scope.lastPageIsShowed = function() {
        if($scope.pagination_list[$scope.num_pages-1] != null)
            return $scope.pagination_list[$scope.num_pages-1].show;

        return false;
    };

    $scope.changeShowPreviousVersions = function() {
        $scope.last_showed_page = $scope.max_showed_values;
        $scope.first_showed_page = 1;
        $scope.pagination_list = [];
        $scope.GetChecklistsWithPaginator(1);
    };

    $scope.findByFilterText = function() {
        $scope.last_showed_page = $scope.max_showed_values;
        $scope.first_showed_page = 1;
        $scope.pagination_list = [];
        $scope.GetChecklistsWithPaginator(1);
    };

    $scope.getAllCheckLists = function(){
        $scope.checklists_list = [];
        $http.get("/checklists_get_all/")
        .success(function(data, status, headers, config){
            $scope.checklists_list = data

        for (i = 0; i<$scope.checklists_list.length; i++){
            if ($scope.checklists_list[i].fields.code.match(/[a-z]/i)){
                $scope.checklists_list.splice(i,1);
            }

    }
    console.log($scope.checklists_list)

        }).error(function(data){

        });



    }

    $scope.GetChecklistsWithPaginator = function(page) {
        $scope.page = page;
        $scope.checklistsToShow_list = [];
        $scope.showAjaxAnnimation = true;


        if($scope.filterText != "") {
            url = "/checklists_get_with_filters/" + page + "/" + $scope.showPreviousVersions + "/" + $scope.filterText.split(' ').join('_') + "/";
        }else {
           url =  "/checklists_get_with_filters/" + page + "/" + $scope.showPreviousVersions + "/";
        }

        $http.get(url,"")
        .success(function(data, status, headers, config) {
            // this callback will be called asynchronously
            // when the response is available

            data_checklists = JSON.parse(data['checklists']);

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


            for (i = 0; i < data_checklists.length; i++)   {
                $scope.checklistsToShow_list.push({
                    id: data_checklists[i].pk,
                    name: data_checklists[i].fields.name,
                    version: data_checklists[i].fields.version,
                    user_id: data_checklists[i].fields.user_id,
                    creation_date: data_checklists[i].fields.creation_date,
                    code: data_checklists[i].fields.code,
                    old_version : data_checklists[i].fields.old_version,
                });
            }
            $scope.showAjaxAnnimation = false;
        }).
        error(function(data, status, headers, config) {
            $scope.showAjaxAnnimation = false;
        });
    };


    $scope.SetChecklistToEdit = function(checklist_id)  {
        $scope.checklist_id_edit = checklist_id;
        $http.get("/checklist_site/checklist_edit_get/" + $scope.checklist_id_edit+"/","").
        success(function(data, status, headers, config) {
            // this callback will be called asynchronously
            // when the response is available
            $scope.checklist_model.id = data[0].pk;
            $scope.checklist_model.name = data[0].fields.name;
            $scope.checklist_model.code = data[0].fields.code;
            $scope.checklist_model.version = parseInt(data[0].fields.version) + 1;
            $scope.checklist_model.user_id =data[0].fields.user_id;
            $scope.checklist_model.creation_date = data[0].fields.creation_date;
        }).
        error(function(data, status, headers, config) {
            alert("checklist - " + status);
            // called asynchronously if an error occurs
            // or server returns response with an error status.
        });

        $http.get("/checklist_site/steps_edit_get/" + $scope.checklist_id_edit+"/","").
        success(function(data, status, headers, config) {
            $scope.ClearStepsList();
            // this callback will be called asynchronously
            // when the response is available
            for (i = 0; i < data.length; i++)   {
                $scope.steps_list.push({
                    id: data[i].pk,
                    checklist_id: data[i].fields.checklist_id,
                    step_order: data[i].fields.step_order,
                    text: data[i].fields.text,
                    input_type: data[i].fields.input_type,
                    max_value: data[i].fields.max_value,
                    min_value: data[i].fields.min_value,
                    observation: data[i].fields.observation,
                    grand: data[i].fields.grand,
                });
            };
        }).
        error(function(data, status, headers, config) {
            alert("step - " + status);
            // called asynchronously if an error occurs
            // or server returns response with an error status.
        });

        $scope.SetButtonSaveOrEditOnHtml();
    };

    $scope.SetChecklistToDelete = function(checklist_id,index)  {
        $scope.checklist_id_delete = checklist_id;
        $scope.index = index;
    };

    $scope.DeleteChecklist = function()  {
        $http.post('/checklist_site/checklist_delete/'+$scope.checklist_id_delete+'/','').
        success(function(data, status, headers, config) {
            // this callback will be called asynchronously
            // when the response is available
            for(i = 0; i < $scope.checklistsToShow_list.length; i++)
            {
                if($scope.checklistsToShow_list[i].id == $scope.checklist_id_delete)
                {
                    $scope.checklistsToShow_list.splice(i, 1);
                    break;
                }
            }
        }).
        error(function(data, status, headers, config) {
            alert(status);
            // called asynchronously if an error occurs
            // or server returns response with an error status.
        });
    };

    $scope.SaveChecklist = function() {
        $scope.OrganizeSteps();

        if ($scope.checklist_model.goodPractices){
            $scope.checklist_model.code = $scope.checklist_model.name
        }
        $scope.OrganizeSteps();
        if ($scope.checklist_model.Steps){
            $scope.checklist_model.goodPractices = $scope.checklist_model.Product
        }
   
        $http.post("/checklist_site/checklist_save/", {checklist:$scope.checklist_model, steps:$scope.steps_list}).
            success(function(data, status, headers, config) {
                $scope.GetChecklistsWithPaginator($scope.page);
                //$scope.UpdateChecklistsList();
                $scope.ClearChecklistModel();
                $scope.ClearStepsModel();
                $scope.ClearStepsList();
            }).

            error(function(data, status, headers, config) {
                alert(status + ": Erro ao salvar checklist");
        });
    };

    $scope.changeGoodPractices = function(state){
        $scope.checklist_model.goodPractices = state;
    }

    $scope.changeSteps = function(state){
        $scope.checklist_model.steps = state;
    }


    $scope.ChecklistsListCount = function()
    {
        return $scope.checklistsToShow_list.length;
    }

    //$scope.GetAllChecklists();
    $scope.GetChecklistsWithPaginator(1);

    //Steps
    $scope.steps_list = {};
    $scope.step_model = {
        id: 0,
        checklist_id: 0,
        step_order: 0,
        text: "",
        input_type: "Texto",
        max_value: 0.0,
        min_value: 0.0,
        observation: "",
        grand: "Tensão (V)",
        textBefore: "",
    };

    $scope.ClearStepsModel = function() {
        $scope.step_model.id = 0;
        $scope.step_model.checklist_id = 0;
        $scope.step_model.step_order = 0;
        $scope.step_model.text = "";
        $scope.step_model.input_type = "Texto";
        $scope.step_model.max_value = 0.0;
        $scope.step_model.min_value = 0.0;
        $scope.step_model.observation = "";
        $scope.step_model.grand = "Tensão (V)";
        $scope.step_modeltextBefore = "";
    };

    $scope.ClearStepsList = function() {
        $scope.SetButtonSaveOrEditOnHtml();
        $scope.steps_list = [];
    }

    $scope.SetButtonSaveOrEditOnHtml = function() {
        console.log("$scope.step_model.id:",$scope.step_model.id)
        if ($scope.step_model.id > 1)
        {
            document.getElementById('btn_edit').style.display = "block"; // hide body div tag
            document.getElementById('btn_save').style.display = "none"; // hide body div tag
        }
        else
        {
            document.getElementById('btn_edit').style.display = "none"; // hide body div tag
            document.getElementById('btn_save').style.display = "block"; // hide body div tag
        }
    };



    $scope.changeStepPosition = function(stepOrder){
        temporaryStep = $scope.step_model
        $scope.steps_list.splice(stepOrder,1)
        $scope.steps_list.splice($scope.step_model.step_order-1,0,{
            checklist_id: $scope.step_model.checklist_id,
            step_order: $scope.step_model.step_order,
            text: $scope.step_model.text,
            input_type: $scope.step_model.input_type,
            max_value: $scope.step_model.max_value,
            min_value: $scope.step_model.min_value,
            observation: $scope.step_model.observation,
            grand: $scope.step_model.grand
        });
        $scope.OrganizeSteps();

    }


    


    $scope.SaveStep = function() {
        if ($scope.isStepEdit)
        {
            $scope.changeStepPosition($scope.steps_list[$scope.stepToEditIndex].step_order)
        }
        else
        {
            $scope.steps_list.push({
                id: $scope.step_model.id,
                checklist_id: $scope.step_model.checklist_id,
                step_order: $scope.steps_list.length,
                text: $scope.step_model.text,
                input_type: $scope.step_model.input_type,
                max_value: $scope.step_model.max_value,
                min_value: $scope.step_model.min_value,
                observation: $scope.step_model.observation,
                grand : $scope.step_model.grand,
            });
        }

        $scope.isStepEdit = false;
        // $scope.OrganizeSteps();
        $scope.ClearStepsModel();
        $scope.SetButtonSaveOrEditOnHtml();
    };

    $scope.OrganizeSteps = function() {
        for (i = 0; i < $scope.steps_list.length; i++)
        {
            $scope.steps_list[i].step_order = i;
        }
    };

    $scope.SetStepToEdit = function(step_text)
    {
        for (i = 0; i < $scope.steps_list.length; i++)
        {
            if (step_text == $scope.steps_list[i].text)
            {
                $scope.isStepEdit = true;
                $scope.stepToEditIndex = i;
                $scope.step_model.id = $scope.steps_list[i].id;
                $scope.step_model.checklist_id = $scope.steps_list[i].checklist_id;
                $scope.step_model.step_order = $scope.steps_list[i].step_order+1;
                $scope.step_model.text = $scope.steps_list[i].text;
                $scope.step_model.input_type = $scope.steps_list[i].input_type;
                $scope.step_model.max_value = $scope.steps_list[i].max_value;
                $scope.step_model.min_value = $scope.steps_list[i].min_value;
                $scope.step_model.observation = $scope.steps_list[i].observation;
                $scope.step_model.grand = $scope.steps_list[i].grand;
                $scope.step_model.textBefore = $scope.steps_list[i].text;
                break;
            }
        }

        $scope.SetButtonSaveOrEditOnHtml();
        //alert("Delete - " + step_id);
    }

    $scope.CancelStepEdit = function() {
        $scope.isStepEdit = false;
        $scope.ClearStepsModel();
        $scope.SetButtonSaveOrEditOnHtml();
    };

    $scope.SetStepToDelete = function(step_text)
    {
        for (i = 0; i < $scope.steps_list.length; i++)
        {
            if (step_text == $scope.steps_list[i].text)
            {
                $scope.step_model.id = $scope.steps_list[i].id;
                $scope.step_model.checklist_id = $scope.steps_list[i].checklist_id;
                $scope.step_model.step_order = $scope.steps_list[i].step_order;
                $scope.step_model.text = $scope.steps_list[i].text;
                $scope.step_model.input_type = $scope.steps_list[i].input_type;
                $scope.step_model.max_value = $scope.steps_list[i].max_value;
                $scope.step_model.min_value = $scope.steps_list[i].min_value;
                $scope.step_model.observation = $scope.steps_list[i].observation;
                $scope.step_model.grand = $scope.steps_list[i].grand;
                break;
            }
        }
    };

    $scope.DeleteStep = function(step_text) {
        for (i = 0; i < $scope.steps_list.length; i++)
        {
            if (step_text == $scope.steps_list[i].text)
            {
                $scope.steps_list.splice(i, 1);
                break;
            }
        }

        $scope.OrganizeSteps();
    };

    $scope.moveStepDown = function(step) {

        console.log(step)
        if (step >= $scope.steps_list.length - 1 ){
            console.log("retornou")
            return
        }
        temporaryStep = $scope.steps_list[step]
        $scope.steps_list[step] = $scope.steps_list[step+1]
        $scope.steps_list[step+1] = temporaryStep
        $scope.OrganizeSteps()
        $scope.step_model.step_order = step+2
    }

    $scope.moveStepUp = function(step) {
        //console.log(step)
        if (step <= 0 ){
            console.log("retornou")
            return
        }
        temporaryStep = $scope.steps_list[step]
        $scope.steps_list[step] = $scope.steps_list[step-1]
        $scope.steps_list[step-1] = temporaryStep
        $scope.OrganizeSteps();
        $scope.step_model.step_order = step
    }
    $scope.getAllCheckLists();
    /////// Context Menu ////////
    $scope.menuOptions = function (sType) {
        return [
            ['Abrir', function ($itemScope) {
                $scope.SetChecklistToEdit($itemScope.checklist.id);
                $("#modalNewChecklist").modal("show");

            }],
            ['Excluir', function ($itemScope) {
                $scope.SetChecklistToDelete($itemScope.checklist.id,$itemScope.$index);
                $("#modalConfirmDeleteChecklist").modal("show");

            }],
        ];
    };
})