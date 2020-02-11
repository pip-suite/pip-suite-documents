import { IDocumentUrlDialogService } from '../document_url_dialog/IDocumentUrlDialogService';
declare let unescape: any;

const ConfigTranslations = (pipTranslateProvider: pip.services.ITranslateProvider) => {
    pipTranslateProvider.translations('en', {
        'FILE_DOCUMENTS': 'Upload document',
        'WEB_LINK': 'Use web link'
    });
    pipTranslateProvider.translations('ru', {
        'FILE_DOCUMENTS': 'Загрузить документ',
        'WEB_LINK': 'Вставить веб ссылка'
    });
}

{
    interface IAddDocumentScope extends angular.IScope {
        $document: any;
        onChange: any;
        multi: any;
        ngDisabled: any;
    }

    class AddDocumentsOnChangeParams {
        public url: string;
        public file: any;
    }

    class AddDocumentController {
        constructor(
            private $scope: IAddDocumentScope,
            private $element: JQuery,
            private $mdMenu,
            private $timeout: ng.ITimeoutService,
            private pipDocumentUrlDialog: IDocumentUrlDialogService
        ) {
            "ngInject";

        }

        public openMenu($mdOpenMenu): void {
            if (this.$scope.ngDisabled()) {
                return;
            }
            $mdOpenMenu();
        }

        private toBoolean(value: any): boolean {
            if (!value) { return false; }

            value = value.toString().toLowerCase();

            return value == '1' || value == 'true';
        }

        public isMulti(): boolean {
            if (this.$scope.multi !== undefined && this.$scope.multi !== null) {
                if (angular.isFunction(this.$scope.multi)) {
                    return this.toBoolean(this.$scope.multi());
                } else {
                    return this.toBoolean(this.$scope.multi);
                }
            } else {
                return true;
            }
        }

        public hideMenu(): void {
            this.$mdMenu.hide();
        }

        public addDocuments(documents: any): void {

            if (documents === undefined) { return; }

            if (Array.isArray(documents)) {
                documents.forEach((img) => {
                    if (this.$scope.onChange) {
                        let params: AddDocumentsOnChangeParams = { url: img.url, file: img.file };
                        this.$scope.onChange(params);
                    }
                });
            } else {
                if (this.$scope.onChange) {
                    let params: AddDocumentsOnChangeParams = { url: documents.url, file: documents.file };
                    this.$scope.onChange(params);
                }
            }

            if (this.$scope.$document === undefined || !Array.isArray(this.$scope.$document)) {
                return;
            }

            if (Array.isArray(documents)) {
                documents.forEach((img) => {
                    this.$scope.$document.push(img.url);
                });
            } else {
                this.$scope.$document.push(documents.url);
            }
        }

        // Process user actions
        public onFileChange($files: any): void {
            if ($files == null || $files.length == 0) { return; }

            $files.forEach((file) => {
                if (file.type.indexOf('image') > -1) {
                    this.$timeout(() => {
                        let fileReader = new FileReader();
                        fileReader.readAsDataURL(file);
                        fileReader.onload = (e) => {
                            this.$timeout(() => {
                                this.addDocuments({ url: null, file: file });
                            });
                        }
                    });
                }
            });

        }

        public onWebLinkClick(): void {
            this.pipDocumentUrlDialog.show((result) => {
                this.addDocuments({ url: result, file: null });
            });
        }

    }

    const AddDocument = function (): ng.IDirective {
        return {
            restrict: 'AC',
            scope: {
                $document: '=pipDocuments',
                onChange: '&pipChanged',
                multi: '&pipMulti',
                ngDisabled: '&'
            },
            transclude: true,
            templateUrl: 'add_documents/AddDocument.html',
            controller: AddDocumentController,
            controllerAs: 'vm'
        };
    }

    angular
        .module('pipAddDocument', ['DocumentUrlDialog'])
        .config(ConfigTranslations)
        .directive('pipAddDocument', AddDocument);
}
