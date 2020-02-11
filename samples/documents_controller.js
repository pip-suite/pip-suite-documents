(function (angular) {
    'use strict';

    var thisModule = angular.module('appDocuments.Documents', []);

    thisModule.controller('pipDocumentsController',
        function ($scope, pipNavService, $timeout) {
            $timeout(function() {
                $('pre code').each(function(i, block) {
                    Prism.highlightElement(block);
                });
            });

            $scope.documents = [
                {
                    id: '0044191e68ba450180f2afed415deecc',
                    name: '7330.jpg'
                }, 
                {
                    id: '',
                    name: 'index.pdf',
                    uri: 'https://www.imf.org/external/pubs/ft/aa/rus/index.pdf'
                }
            ];
            $scope.documentList = null;

            $scope.onDocumentListChanged = function ($event) {
               console.log('onDocumentListChanged', $scope.documentList);
            };

            $scope.onDocumentListCreated = function ($event) {
                $scope.documentList = $event.sender;
            };

            $scope.onSaveDocumentsClick = function () {
                $scope.documentList.save(
                    // Success callback
                    function (data) {
                        $scope.documents = data;
                        console.log('$scope.documents save result', $scope.documents); // eslint-disable-line no-console
                    },
                    // Error callback
                    function (error) {
                        console.log('error', error);   // eslint-disable-line no-console
                    }
                );
            };

            $scope.onResetDocumentsClick = function () {
                $scope.documentList.reset();
            };

            // todo use pipNavService

            // pipAppBar.showTitleText('DOCUMENTS');
            // pipAppBar.showMenuNavIcon();
            // pipAppBar.showLanguage();
            // pipAppBar.hideShadow();
        }
    );

})(window.angular);
