(function (angular, _) {
    'use strict';

    var thisModule = angular.module('appDocuments',
        [
            // 3rd Party Modules
            'ui.router', 'ui.utils', 'ngResource', 'ngAria', 'ngCookies', 'ngSanitize', 'ngMessages',
            'ngMaterial', 'wu.masonry', 'LocalStorageModule', 'angularFileUpload', 'ngAnimate',
            // Application Configuration must go first
            'pipSampleConfig',
            // Modules from WebUI Framework
            'pipCommonRest', 'pipControls', 'pipDocuments', 'pipSelected',
            'pipDropdown', 'pipLayout', 'pipEntry',
            // testing data modules (have some data for example)
            // Error! Lost templates. Do not uncomment 'pipWebuiTests',
            // Sample Application Modules
            'appDocuments.Documents'
        ]
    );

    thisModule.controller('pipSampleController',
        function ($scope, $http, $rootScope, $state, $mdSidenav, pipTranslate, pipRest, pipToasts, pipSession,
            $mdTheming, $timeout) {

            $scope.serverUrl = 'http://alpha.pipservices.net';
            $scope.name = 'Sampler User';
            $scope.login = 'stas15';
            $scope.password = '123456';
           

            $scope.onSignin = function () {
                $scope.processing = true;
                pipRest.getResource('signin').call({
                    login: $scope.login,
                    password: $scope.password
                },
                    (data) => {
                        console.log('Session Opened', data);
                        pipRest.setHeaders({
                            'x-session-id': data.id
                        });
                        $http.defaults.headers.common['x-session-id'] = data.id;
                        console.log('headers', $http.defaults.headers.common['x-session-id']);
                        // $http.defaults.headers.common['session-id'] = sessionId;
                        let session = {
                            sessionId: data.id,
                            userId: data.user_id
                        }
                        pipSession.open(session);
                        $scope.processing = false;

                    },
                    (error) => {
                        $scope.processing = false;
                    });

            }

            $scope.selected = {};
            $timeout(function () {
                $scope.selected.pageIndex = _.findIndex($scope.pages, { state: $state.current.name });
                if ($scope.selected.pageIndex == -1) {
                    $scope.selected.pageIndex = 0;
                }
                $scope.selected.state = $scope.pages[$scope.selected.pageIndex].state;
            });

            $scope.onNavigationSelect = function (state) {
                $state.go(state);
                $scope.selected.pageIndex = _.findIndex($scope.pages, { state: state });
                if ($scope.selected.pageIndex == -1) {
                    $scope.selected.pageIndex = 0;
                }
                $scope.selected.state = $scope.pages[$scope.selected.pageIndex].state;
            };

            $scope.onDropdownSelect = function (state) {
                $scope.onNavigationSelect(state.state);
            };

            $scope.pages = [{
                state: 'document-list',
                title: 'Document list'
            }, {
                state: 'document-list-edit',
                title: 'Documnent list edit'
            }];

            $scope.isEntryPage = function () {
                return $state.current.name === 'signin' || $state.current.name === 'signup' ||
                    $state.current.name === 'recover_password' || $state.current.name === 'post_signup';
            };

            $scope.onSignin();

        }
    );

})(window.angular, window._);
