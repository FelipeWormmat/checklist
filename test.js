angular.module("testApp", []).config(function($httpProvider, $interpolateProvider) {
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken'; //add these lines to enable CSFR cookie in order to make post requests work
    $interpolateProvider.startSymbol('{[{').endSymbol('}]}');
})

.controller("HeadCtrl", function($scope) {
    $scope.page_title = "Sistema de Checklist - Teste";
})

.controller("TestCtrl", function($scope, $http) {
    //Auto hide navbar
    $("nav.navbar-fixed-top").autoHidingNavbar();

    $scope.welcome_message = "";

    $scope.results_list = [];
    $scope.tests_list = [];
    $scope.checklists_list = [];
    $scope.closeButton = false
    $scope.wasteButton
    $scope.showAjaxAnnimation = false;

    $scope.result_model = {
        id: 0,
        step: 0,
        test: 0,
        user_id: "",
        success: false,
        result: 0,
        text_result: "",
        finish_dateTime: "",
        showIt: false,
        hideIt: true,
    };

    $scope.test_model = {
        id: 0,
        checklist_id: "",
        serial_number: "",
        creation_date: "",
        status: "Novo",
    };


    $scope.checklist_model = {
        id: 0,
        name: "",
        code: "",
        version: "",
        user_id: 1,
        creation_date: null,
        steps: [],
    };

    //Steps
    $scope.steps_list = [];
    $scope.step_model = {
        id: 0,
        checklist_id: 0,
        step_order: 0,
        text: "",
        input_type: "Valor",
        show_value: 0,
        max_value: 0.0,
        min_value: 0.0,
        observation: "",
        grand: "V",
    };

    $scope.redcards_list = [];
    $scope.redcard = {
        id: 0,
        step_id: 0,
        test_id: 0,
        user_id: 0,
        data: "",
        description:"",
        cause: "",
        time: "",
        custs: "",
        status: "",
        enable: false
    }

    $scope.submitRedcard = function() {
        $scope.redcard.test_id = $scope.test_id;
        $http.post("/checklist_site/test/redcard/" , {redcard:$scope.redcard}).
        then(successCallbackRC, errorCallbackRC);
    }
    function successCallbackRC(response) {
        $scope.ClearRedCardModel();
        $scope.RedcardGetAllByTest($scope.test_id);
    }

    function errorCallbackRC() {
        alert("Erro ao enviar redcard ao servidor");
    }


    $scope.setResultId = function(step_id){
        $scope.redcard.step = step_id;
    }

     $scope.RedcardGetAllByTest = function(test_id) {
         $http.get("/checklist_site/test/loadredcards" + "/" + test_id + "/","" ).
        success(function(data, status, headers, config) {


            $scope.redcards_list = [];
            for(i=0; i<data.length; i++){
                $scope.redcards_list.push({
                    id: data[i].pk,
                    step_id: data[i].fields.step,
                    test_id: data[i].fields.test,
                    user_id: data[i].fields.user,
                    data: data[i].fields.data,
                    description: data[i].fields.description,
                    cause: data[i].fields.cause,
                    time: parseInt(data[i].fields.time),
                    custs: data[i].fields.custs,
                    status: data[i].fields.status
                })
            }
            $scope.hasRedCard()
        }).
        error(function(data, status, headers, config) {
           alert('Erro ao acessar cartões vermelhos');
        });
    }

    $scope.GetRedcardStatus = function(step_id){

        for(i=0; i<$scope.redcards_list.length; i++) {
            if($scope.redcards_list[i].step_id == step_id){
                return $scope.redcards_list[i].status;
            }
        }
        return "Sem cartão";
    }

    $scope.SetRedcardToEdit = function(step) {
        $scope.ClearRedCardModel();
         for(i=0; i<$scope.redcards_list.length; i++) {
            if($scope.redcards_list[i].step_id == step.id){
                for(var prop in  $scope.redcards_list[i]) {
                    $scope.redcard[prop] = $scope.redcards_list[i][prop];
                }
            }
        }

        if($scope.redcard.step_id == 0){
            $scope.redcard.step_id = step.id;
        }

        $scope.redcard.enable = !$scope.results_list[step.step_order].success;

    }

     $scope.ClearRedCardModel = function() {
        $scope.toggle = false;
        $scope.redcard.id = 0;
        $scope.redcard.step_id = 0;
        $scope.redcard.test_id = 0;
        $scope.redcard.user_id = 0;
        $scope.redcard.data = "";
        $scope.redcard.description = "";
        $scope.redcard.cause = "";
        $scope.redcard.time = "";
        $scope.redcard.custs = "";
        $scope.redcard.status = "";
        $scope.redcard.description="";
        $scope.redcard.enable = false;
    };

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


    $scope.LoadDashboardPage = function() {
        window.location.href = "/checklist_site/ch_dashboard/";

    };

    $scope.LoadUsersPage = function() {
        window.location.href = "/checklist_site/users/";

    };

    $scope.LoadChecklistsPage = function() {
        window.location.href = "/checklist_site/checklists/";
    };

    $scope.LoadChecklists_Good_PracticesPage = function() {
        window.location.href = "/checklist_site/checklists_good_practices/";
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

    $scope.ClearStepsModel = function() {
        $scope.step_model.id = 0;
        $scope.step_model.checklist_id = 0;
        $scope.step_model.step_order = 0;
        $scope.step_model.text = "";
        $scope.step_model.input_type = "";
        $scope.step_model.max_value = 0.0;
        $scope.step_model.min_value = 0.0;
        $scope.step_model.observation = "";
        $scope.step_model.grand = "";
    };

    $scope.GetAllTests = function() {

        $scope.tests_list = [];
        $scope.showAjaxAnnimation = true;
        $http.get("/checklist_site/tests_get_all_for_test/","").
        success(function(data, status, headers, config) {
            // this callback will be called asynchronously
            // when the response is available
            data_tests = data['tests'];
            for (i = 0; i < data_tests.length; i++){

                $scope.tests_list.push({
                    test_id: data_tests[i].test_id,
                    test_serial_number: $scope.ConvertSerialNumberToHex(data_tests[i].test_serial_number, data_tests[i].test_hex_serial_number),
                    test_hex_serial_number: data_tests[i].test_hex_serial_number,
                    checklist_code: data_tests[i].checklist_code,
                    checklist_version: data_tests[i].checklist_version
                });
            }

            console.log(data_tests)
            $scope.showAjaxAnnimation = false;

        })
        .error(function(data, status, headers, config) {
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

    $scope.closeTest = function(){
        $http.get("/checklist_site/test_close/" + $scope.test_model.id + "/")
        .success(function(){
            console.log("test closed")
            $scope.test_model.status = "Sucesso"
            $scope.closeButton = false;
            $scope.wasteButton = false;
        })
        .error(function(){
            console.log("close test error")
        })
    }

    $scope.wasteTest = function(){
        $http.get("/checklist_site/test_waste/" + $scope.test_model.id + "/")
        .success(function(){
            console.log("test wasted")
            $scope.test_model.status = "Sucata"
            $scope.closeButton = false;
            $scope.wasteButton = false;
        })
        .error(function(){
            console.log("waste test error")
        })
    }

    $scope.GetTest = function(test_id) {
        $scope.test_id = test_id;
        $http.get("/checklist_site/test_get/" + test_id +"/","").
        success(function(data, status, headers, config) {
            // this callback will be called asynchronously
            // when the response is available

            //setting the test model
            $scope.test_model.id = data[0].pk;
            $scope.test_model.checklist_id = data[0].checklist_id;
            $scope.test_model.creation_date = data[0].fields.creation_date;
            $scope.test_model.serial_number = $scope.ConvertSerialNumberToHex(data[0].fields.serial_number, data[0].fields.hex_serial_number),
            $scope.test_model.status = data[0].fields.status;
            

            //setting the checklist model
            $scope.checklist_model.id = data[1].pk;
            $scope.checklist_model.name = data[1].fields.name;
            $scope.checklist_model.code = data[1].fields.code;
            
            $scope.checklist_model.creation_date = data[1].fields.creation_date;
            $scope.checklist_model.user_id = data[1].fields.user_id;
            $scope.checklist_model.good_practices = data[1].fields.good_practices;
            console.log($scope.checklist_model);

            if ($scope.checklist_model.good_practices){
                $scope.welcome_message = "Boas Praticas";
                $scope.checklist_model.version = data[0].fields.good_practices_version;
            } else {
                $scope.welcome_message = "Teste de Produto";
                $scope.checklist_model.version = data[1].fields.version;
            }
            //get Steps
            $http.get("/checklist_site/steps_edit_get/" + $scope.checklist_model.id +"/","").
            success(function(data, status, headers, config) {
                // this callback will be called asynchronously
                // when the response is available
                for (i = 0; i < data.length; i++)   {
                    var gran = data[i].fields.grand;
                    var isValue = 1;
                    gran = gran.substr(gran.length - 2, 1);
                    if (data[i].fields.input_type == "Valor")
                    {
                        isValue = 0;
                    }
                    $scope.steps_list.push({
                        id: data[i].pk,
                        checklist_id: data[i].fields.checklist_id,
                        step_order: data[i].fields.step_order,
                        text: data[i].fields.text,
                        input_type: data[i].fields.input_type,
                        max_value: data[i].fields.max_value,
                        min_value: data[i].fields.min_value,
                        observation: data[i].fields.observation,
                        show_value: isValue,
                        show_text: !isValue,
                        grand: gran,
                        committed: data[i].fields.committed,
                    });
                };

                // get Results
                $http.get("/checklist_site/results_get/" + $scope.test_model.id +"/","").
                success(function(data, status, headers, config) {
                    console.log(data);

                    for (i = 0; i < data.length; i++)
                    {
                         $scope.results_list.push({
                             id: data[i].pk,
                             step: data[i].fields.step,
                             test: data[i].fields.test,
                             user_id: data[i].fields.user_id,
                             user_name: data[i].fields.user_name.user_name,
                             success: data[i].fields.success,
                             result: data[i].fields.result,
                             text_result: data[i].fields.text_result,
                             finish_dateTime: data[i].fields.finish_dateTime,
                             showIt: false,
                             hideIt: true,
                         });
                    }


                    for (i = 0; i < $scope.steps_list.length; i++)
                    {
                        stepExists = false;
                        for (j = 0; j < $scope.results_list.length; j++)
                        {
                            if ($scope.steps_list[i].id == $scope.results_list[j].step)
                            {
                                stepExists = true;
                                break;
                            }
                        }

                        if (!stepExists)
                            $scope.steps_list[i].toDelete = true;
                    }

                    for (i = 0; i < $scope.steps_list.length; i++)
                    {
                        if ($scope.steps_list[i].toDelete)
                        {
                            $scope.steps_list.splice(i, 1);
                            i--;
                        }
                    }

                    console.log("test..");
                    console.log($scope.steps_list);
                    console.log("li..");
                    console.log($scope.results_list);

                    $scope.RedcardGetAllByTest(test_id);
                    $scope.getCheckBoxStatus()
                    $scope.hasRedCard()

                }).
                error(function(data, status, headers, config) {
                    alert("Results - " + status);
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                });
            }).
            error(function(data, status, headers, config) {
                alert("Steps - " + status);
                // called asynchronously if an error occurs
                // or server returns response with an error status.
            });
        }).
        error(function(data, status, headers, config) {
            alert("checklist - " + status);
            // called asynchronously if an error occurs
            // or server returns response with an error status.
        });
    };

    $scope.ResultChange = function(step_id) {

        for (i = 0; i < $scope.results_list.length; i++)
        {
            if ($scope.results_list[i].step == step_id)
            {
                console.log("Result Change, result step: ", $scope.results_list[i].success)
                if($scope.results_list[i].success){

                    var valid = 1
                    var i_temp = i;
                    $scope.results_list[i_temp].showIt = true;
                    $scope.results_list[i_temp].hideIt = false;

                    for (j = 0; j < $scope.steps_list.length; j++)
                    {
                        if ($scope.steps_list[j].id == step_id)
                        {
                            if($scope.steps_list[j].input_type == "Valor")
                            {
                                if($scope.results_list[i_temp].result >= $scope.steps_list[j].min_value)
                                {
                                    if ($scope.results_list[i_temp].result <= $scope.steps_list[j].max_value)
                                    {
                                        valid = 1;
                                    }
                                    else
                                    {
                                        valid = 0;
                                        $scope.results_list[i_temp].success = 0;
                                        $scope.results_list[i_temp].showIt = false;
                                        $scope.results_list[i_temp].hideIt = true;
                                    }
                                }
                                else
                                {
                                    valid = 0;
                                    $scope.results_list[i_temp].success = 0;
                                    $scope.results_list[i_temp].showIt = false;
                                    $scope.results_list[i_temp].hideIt = true;
                                }
                            }
                            else if (($scope.steps_list[j].input_type == "Anotar") || ($scope.steps_list[j].input_type == "Checklist"))
                            {
                                if ($scope.results_list[i_temp].text_result != undefined && $scope.results_list[i_temp].text_result != "")
                                {
                                    valid = 1;
                                }
                                else
                                {
                                    valid = 0;
                                    $scope.results_list[i_temp].success = 0;
                                    $scope.results_list[i_temp].showIt = false;
                                    $scope.results_list[i_temp].hideIt = true;
                                }
                            }
                        }
                    }

                    if (valid)
                    {

                        $http.post("/checklist_site/result_update/" + $scope.logged_user[0].user_id + "/", {result:$scope.results_list[i_temp]})
                        .success(function(data, status, headers, config) {
                            $scope.results_list[i_temp].showIt = false;
                            $scope.results_list[i_temp].hideIt = true;
                            // this callback will be called asynchronously
                            // when the response is available

                        })
                        .error(function(data, status, headers, config) {
                            alert(status + " - Error updating result");
                            $scope.results_list[i_temp].success = 0;
                            $scope.results_list[i_temp].showIt = false;
                            $scope.results_list[i_temp].hideIt = true;
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                        });
                    }
                 } else {
                    id = $scope.results_list[i].id
                    index = i
                    $http.post("/checklist_site/result_delete/" + id + "/", "")
                     .success(function(data){
                        console.log("result deleted")
                        $scope.results_list[index].user_name = "";
                     })
                    .error(function(data, status, headers, config){
                        console.log(status,headers,config)
                     });
                 }
                break;
            }
        }
        $scope.getCheckBoxStatus()
    }

    $scope.getCheckBoxStatus = function(){
        isSuccess = true
        $scope.results_list.forEach(result => {
            if (!result.success){
                isSuccess = false;
            }
        })
        if (($scope.test_model.status == "Sucesso") || ($scope.test_model.status == "Sucata") || ($scope.test_model.status == "Checkout" )){
            $scope.closeButton = false
        } else {
            $scope.closeButton = isSuccess;
        }
    }

    $scope.hasRedCard = function(){
        console.log("hasRedCard")
        hasRedCard = false
        $scope.redcards_list.forEach(redcard => {
            console.log(redcard.status)
            if (redcard.status != "Sem cartão"){
                hasRedCard = true;
            }
        })
        if (($scope.test_model.status == "Sucesso") || ($scope.test_model.status == "Sucata") ){
            $scope.wasteButton = false
        } else {
            $scope.wasteButton = hasRedCard;
        }
    }


})