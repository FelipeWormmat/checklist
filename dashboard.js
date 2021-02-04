angular.module("dashboardApp", [])

.config(function($httpProvider, $interpolateProvider) {
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken'; //add these lines to enable CSFR cookie in order to make post requests work
    $interpolateProvider.startSymbol('{[{').endSymbol('}]}');
})

.controller("DashboardCtrl", function($scope, $http) {

    //Auto hide navbar
    $("nav.navbar-fixed-top").autoHidingNavbar();

    $scope.welcome_message = "Sistema de Checklist";

    $scope.waitIt = 0;

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


    $scope.LoadChecklistsPage = function() {
        window.location.href = "/checklist_site/checklists/";

    };

    $scope.LoadDashboardPage = function() {
        window.location.href = "/checklist_site/dashboard/";
    };

    $scope.LoadTestsPage = function() {
        window.location.href = "/checklist_site/tests/";

    };

    $scope.LoadCheckoutPage = function() {
        window.location.href = "/checklist_site/checkout/";
    };

    $scope.LoadReportsPage = function() {
        window.location.href = "/checklist_site/reports/";
    };

    $scope.LoadRedCardsPage = function() {
        window.location.href = "/checklist_site/red_cards/";
    };
    $scope.LoadBoasPraticasPage = function() {
        window.location.href = "/checklist_site/boas_praticas/";
    };


    $scope.test_felipe = {
        serial_number: "",
        checklist_code: ""
    };



    $scope.test_junior = {
        checklist_name: "",
        good_practices_code: "",
        checklist_version: 0
    }; 


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
        checklist_version:0,
        test_good_practices_item:"",
        test_good_practices_code:"",
        test_good_practices_version:0
        
    };
    $scope.ClearTestModel = function(){

        $scope.test_felipe = {
            serial_number: "",
            checklist_code: ""
        };    
    }

    $scope.ClearTest2Model = function(){

    
        $scope.test_junior = {
            checklist_name: "",
            good_practices_code: "",
            checklist_version: 0
        };    
    }
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
            checklist_version:0,
            test_good_practices_item: "",
            test_good_practices_code:"",
            test_good_practices_version:0
        };
    }
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
            goodPractice:1,
            goodPracticesVersion: $scope.goodPracticesVersionFilter
        });

        url = "/checklist_site/tests_good_practices_get/"


        $scope.tests_list = [];

        console.log(request)

        $http.post(url, {request}).
        success(function(data, status, headers, config) {

            console.log(data);

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

    }

    // $scope.CreateTest2 = function(user_id) {
        
    //     var validation = 1;

    //     alert_user = document.getElementById("invalid_Test");
    //     alert_user.innerHTML = ""; 
    //     alert_user.style.display="none";

    //     if(($scope.test_model.checklist_code == "") || ($scope.test_model.checklist_code == undefined)){
    //         validation = 0;
    //         alert_user = document.getElementById("invalid_Test"); 
    //         alert_user.style.display="block";  
    //         alert_user.innerHTML += "<li>O Campo <b>Código do checklist</b> deve ser preenchido</li>";          
    //     }
        
    //     if (validation)
    //     {
    //         if(($scope.test_model.serial_number == "") || ($scope.test_model.serial_number == undefined)){
    //             validation = 0;
    //             alert_user = document.getElementById("invalid_Test");
    //             alert_user.style.display="block";
    //             alert_user.innerHTML += "<li>O Campo <b>Número de Série</b> deve ser preenchido</li>";
    //         }
    //     }
    //     //
    //     if (validation)
    //     {
    //         $http.get("/checklist_site/checklist_get_by_code/" + $scope.test_model.checklist_code +"/","").
    //         success(function(data, status, headers, config) {
    //             // this callback will be called asynchronously
    //             // when the response is available
    //             console.log("checklist_get_by_code")
    //             console.log(data);
    //             $scope.test_model.checklist_version = data[0].fields.version;

    //             if (/[a-z]/.test($scope.test_model.serial_number.toLowerCase())){
    //                 $scope.test_model.test_hex_serial_number = 1;
    //                 $scope.test_model.serial_number = $scope.test_model.serial_number.toUpperCase();
    //                 $scope.test_model.serial_number = parseInt($scope.test_model.serial_number, 16);
    //             }else {
    //                 $scope.test_model.test_hex_serial_number = 0;
    //             }

    //             $scope.test_model.status = $scope.test_model.test_status;
    //             $scope.test_model.hex_serial_number = $scope.test_model.test_hex_serial_number;

    //             $http.post("/checklist_site/test_save/", {test:$scope.test_model}).
    //             success(function(data, status, headers, config) {
    //                 // this callback will be called asynchronously
    //                 // when the response is available
    //                 $('#modalCreateTest').modal('hide');
    //                 $scope.ClearTestModel();
    //                 // $scope.GetAllTests(1);
    //                 //window.location.href = "/test/" + user_id + "/" + data[0].pk;

    //                 console.log(data)
    //             }).
    //             error(function(data, status, headers, config) {
    //                 alert(status + " - Error creating test");
    //                 $scope.ClearTestModel();
    //                 // called asynchronously if an error occurs
    //                 // or server returns response with an error status.
    //             });

    //         }).
    //         error(function(data, status, headers, config) {
    //             if(status == 404){
    //                 validation = 0;
    //                 alert_user = document.getElementById("invalid_Test");
    //                 alert_user.style.display="block";
    //                 alert_user.innerHTML += "<li>Não existe checklist com este código</li>";
    //             }else {
    //                 alert(status);
    //             }
    //             // called asynchronously if an error occurs
    //             // or server returns response with an error status.
    //         });
    //     }
    // };





    

    $scope.CreateTest2 = function(user_id) {
        console.log($scope.test_junior)
        var validation = 1;

        alert_user = document.getElementById("invalid_Test");
        alert_user.innerHTML = "";
        alert_user.style.display="none";

        if(($scope.test_junior.checklist_name == "") || ($scope.test_junior.checklist_name == undefined)){
            console.log('1');
            validation = 0;
            alert_user = document.getElementById("invalid_Test");
            alert_user.style.display="block";
            alert_user.innerHTML += "<li>O Campo <b>Código do checklist</b> deve ser preenchido</li>";
        }

        if (validation)
        {
            if(($scope.test_junior.good_practices_code == "") || ($scope.test_junior.good_practices_code == undefined)){
                console.log('2');
                validation = 0;
                alert_user = document.getElementById("invalid_Test");
                alert_user.style.display="block";
                alert_user.innerHTML += "<li>O Campo <b>Número de Série</b> deve ser preenchido</li>";
            }
        }
        if (validation)
        {
            if(($scope.test_junior.checklist_version == "") || ($scope.test_junior.checklist_version == undefined)){
                console.log('3');
                validation = 0;
                alert_user = document.getElementById("invalid_Test");
                alert_user.style.display="block";
                // alert_user.innerHTML += "<li>O Campo <b>Número de Série</b> deve ser preenchido</li>";
            }
        }
        //
        if (validation)
        {
            console.log("EBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")
            console.log($scope.test_junior)
            $http.post("/checklist_site/tests_good_practices_save/", {test:$scope.test_junior}).
            success(function(data, status, headers, config) {
                // this callback will be called asynchronously
                // when the response is available
                $('#modalCreate2Test').modal('hide');
                $scope.ClearTes2tModel();
                window.location.href = "/test/" + data[0].pk;

                console.log("UVAAAAAAAAAA")
            }).
            error(function(data, status, headers, config) {
                if(status == 404){
                    validation = 0;
                    alert_user = document.getElementById("invalid_Test");
                    alert_user.style.display="block";
                    alert_user.innerHTML += "<li>Não existe checklist com este código</li>";
                }else {
                    alert(status);
                }
                // called asynchronously if an error occurs
                // or server returns response with an error status.
            });
        }
    };

    $scope.CreateTest = function(user_id) {
        console.log($scope.test_felipe)
        var validation = 1;

        alert_user = document.getElementById("invalid_Test");
        alert_user.innerHTML = "";
        alert_user.style.display="none";

        if(($scope.test_felipe.checklist_code == "") || ($scope.test_felipe.checklist_code == undefined)){
            console.log('1');
            validation = 0;
            alert_user = document.getElementById("invalid_Test");
            alert_user.style.display="block";
            alert_user.innerHTML += "<li>O Campo <b>Item</b> deve ser preenchido</li>";
        }

        if (validation)
        {

            if(($scope.test_felipe.serial_number == "") || ($scope.test_felipe.serial_number == undefined)){
                console.log('vou te matarrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr');
                validation = 0;
                alert_user = document.getElementById("invalid_Test");
                alert_user.style.display="block";
                alert_user.innerHTML += "<li>O Campo <b>Códigos</b> deve ser preenchido</li>";
            }
        }
        //
        if (validation)
        {
            
            console.log("tesssst")
            $http.post("/checklist_site/test_save/", {test: $scope.test_felipe}).
            success(function(data, status, headers, config) {
                // when the response is available
                $('#modalCreateTest').modal('hide');
                $scope.ClearTestModel();
                window.location.href = "/test/" + data[0].pk;


            }).
            error(function(data, status, headers, config) {
                if(status == 404){
                    validation = 0;
                    alert_user = document.getElementById("invalid_Test");
                    alert_user.style.display="block";
                    alert_user.innerHTML += "<li>Não existe checklist com este código</li>";
                }else {
                    alert(status);
                }
                // called asynchronously if an error occurs
                // or server returns response with an error status.
            });
        }
    };
})