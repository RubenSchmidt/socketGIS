/**
 * Created by rubenschmidt on 08.02.2016.
 */
socketGis.controller('loginController',
    ['$scope', '$location', 'AuthService',
        function ($scope, $location, AuthService) {

            $scope.login = function () {

                // initial values
                $scope.error = false;
                $scope.disabled = true;

                // call login from service
                AuthService.login($scope.loginForm.username, $scope.loginForm.password)
                    // handle success
                    .then(function (response) {
                        $location.path('/');

                        $scope.disabled = false;
                        $scope.loginForm = {};
                    }, function (response) {
                        $scope.error = true;
                        $scope.errorMessage = "Feil brukernavn eller passord";
                        $scope.disabled = false;
                        $scope.loginForm = {};
                    })
            };
}]);