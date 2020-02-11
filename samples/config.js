/**
 * @file Global configuration for sample application
 * @copyright Digital Living Software Corp. 2014-2016
 */

(function (angular) {
    'use strict';

    var thisModule = angular.module('pipSampleConfig', ['pipCommonRest', 'pipNav', 'pipDocuments']);

    // Configure application services before start
    thisModule.config(
        function ($mdThemingProvider, $stateProvider, $urlRouterProvider, pipAuthStateProvider, pipTranslateProvider,
            pipRestProvider, pipNavMenuProvider, pipActionsProvider, $mdIconProvider,
            pipDocumentDataProvider) {

            $mdIconProvider.iconSet('icons', 'images/icons.svg', 512);

            pipActionsProvider.globalSecondaryActions = [
                { name: 'global.signout', title: 'SIGNOUT', state: 'signout' }
            ];

            // String translations
            pipTranslateProvider.translations('en', {
                DOCUMENTS: 'Document controls',
                SIGNOUT: 'Sign out',
                DOCUMENT_LIST: 'Document List',
                COLLAPSED: 'Collapsed',
                DOCUMENT_LIST_EDIT: 'Document List Edit',
                WITH_ICON: 'with icon'
            });

            pipTranslateProvider.translations('ru', {
                DOCUMENTS: 'Document контролы',
                SIGNOUT: 'Выйти',
                DOCUMENT_LIST: 'Список документов',
                COLLAPSED: 'Раcкрытый',
                DOCUMENT_LIST_EDIT: 'Редактирования списка документов',
                WITH_ICON: 'с иконкой'
            });

            pipAuthStateProvider.unauthorizedState = 'signin';
            pipAuthStateProvider.signinState = 'signin';
            pipAuthStateProvider.signoutState = 'signin';
            pipAuthStateProvider.authorizedState = 'document-list';
            $urlRouterProvider.otherwise('/document-list');

            // example for set custom document route
            // pipDocumentDataProvider.DocumentRoute = '/api/1.0/aaaaa';

            pipAuthStateProvider
                .state('document-list', {
                    url: '/list',
                    controller: 'pipDocumentsController',
                    templateUrl: 'document_list_sample/document-list.html',
                    auth: true
                })
                .state('document-list-edit', {
                    url: '/list-edit',
                    controller: 'pipDocumentsController',
                    templateUrl: 'document_list_edit_sample/document-list-edit.html',
                    auth: true
                });

            $urlRouterProvider.otherwise('/document-list');

            // Configure REST API
            pipRestProvider.serverUrl = 'http://alpha.pipservices.net';

            // Configure navigation menu
            pipNavMenuProvider.sections = [
                {
                    links: [{ title: 'DOCUMENTS', url: '/document-list' }]
                },
                {
                    links: [{ title: 'SIGNOUT', url: '/signout' }]
                }
            ];
        }
    );

})(window.angular);
