import { DefaultDocumentIcon } from '../document_list_edit/DocumentListEdit';
import { Attachment } from '../data/Attachment';
import { IDocumentDataService } from '../data/IDocumentDataService';

const ConfigTranslations = (pipTranslate: pip.services.ITranslateService) => {
    if (pipTranslate) {
        (pipTranslate).setTranslations('en', {
            DOCUMENTS_ATTACHED: 'document(s) attached',
            ERROR_DOCUMENTS_LOADED: 'Error: <%= error_number %> document(s) are not loaded'
        });
        (pipTranslate).setTranslations('ru', {
            DOCUMENTS_ATTACHED: 'документов добавлено',
            ERROR_DOCUMENTS_LOADED: 'Ошибка: <%= error_number %> документ(ов) не загружено'
        });
    }
}

{

    interface DocumentListBindings {
        [key: string]: any;

        ngDisabled: any;
        documents: any;
        collapsable: any;
        pipDocumentIcon: any;
        rebind: any;
    }

    const DocumentListBindings: DocumentListBindings = {
        ngDisabled: '&?',
        documents: '<pipDocuments',
        collapsable: '<?pipCollapse',
        pipDocumentIcon: '<?pipDocumentIcon',
        rebind: '<?pipRebind'
    }

    class DocumentListChanges implements ng.IOnChangesObject, DocumentListBindings {
        [key: string]: ng.IChangesObject<any>;

        ngDisabled: ng.IChangesObject<() => ng.IPromise<void>>;
        documents: ng.IChangesObject<Attachment[]>;
        collapsable: ng.IChangesObject<boolean>;
        pipDocumentIcon: ng.IChangesObject<boolean>;
        rebind: ng.IChangesObject<boolean>;
    }

    class DocumentListController {
        private documentsContainer: JQuery;
        private up: JQuery;
        private down: JQuery;

        public ngDisabled: () => boolean;
        public collapsable: boolean;
        public pipDocumentIcon: boolean;
        public documents: Attachment[];
        public rebind: boolean;

        public showDocuments: boolean;
        public documentList: Attachment[];
        public documentListIcon: string = DefaultDocumentIcon;

        constructor(
            private $element: JQuery,
            private $attrs: ng.IAttributes,
            private pipTranslate: pip.services.ITranslateService,
            private $parse: ng.IParseService,
            private $scope: angular.IScope,
            private $timeout: ng.ITimeoutService,
            private pipDocumentData: IDocumentDataService,
            private pipRest: pip.rest.IRestService
        ) {
            "ngInject";

            // Add class
            this.$element.addClass('pip-document-list');
        }

        public $postLink() {
            this.documentsContainer = this.$element.children('.pip-documents-container');
            this.up = this.$element.find('.icon-up');
            this.down = this.$element.find('.icon-down');
            this.documents = this.documents || [];
            this.showDocuments = this.collapsable;

            if (!this.collapsable) {
                this.up.hide();
                this.documentsContainer.hide();
            } else {
                this.down.hide();
            }

            if (this.ngDisabled()) {
                this.up.hide();
                this.down.hide();
            }
        }

        public onDownload(item): void {
            let e = document.createEvent('MouseEvents');
            let a = document.createElement('a');

            a.href = this.pipDocumentData.getDocumentUrl(item.id);;
            a.dataset['downloadurl'] = ['undefined', a.download, a.href].join(':');
            e.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, true, false, false, false, 0, null);
            a.dispatchEvent(e);
        }

        public $onChanges(changes: DocumentListChanges) {
            if (this.toBoolean(this.rebind)) {
                if (changes.documents && changes.documents.currentValue) {
                    if (this.differentDocumentList(changes.documents.currentValue)) {
                        this.documents = changes.documents.currentValue;
                    }
                }
            }
        }

        public differentDocumentList(newList: Attachment[]): boolean {
            let i: number, obj: Attachment;

            if (!this.documents || newList) { return true; }
            if (this.documents.length !== newList.length) { return true; }

            for (i = 0; i < newList.length; i++) {
                obj = _.find(this.documents, { id: newList[i].id });

                if (obj === undefined) { return true; }
            }

            return false;
        }

        public onTitleClick(event: ng.IAngularEvent): void {
            if (event) { event.stopPropagation(); }

            if (this.$attrs.disabled) { return; }

            this.showDocuments = !this.showDocuments;
            this.up[this.showDocuments ? 'show' : 'hide']();
            this.down[!this.showDocuments ? 'show' : 'hide']();
            this.documentsContainer[this.showDocuments ? 'show' : 'hide']();
        }

        private toBoolean(value: any): boolean {
            if (value == null) return false;
            if (!value) return false;
            value = value.toString().toLowerCase();

            return value == '1' || value == 'true';
        }

    }

    const documentList: ng.IComponentOptions = {
        bindings: DocumentListBindings,
        templateUrl: 'document_list/DocumentList.html',
        controller: DocumentListController,
    }

    angular
        .module("pipDocumentList", ['pipFocused', 'pipDocuments.Templates'])
        .run(ConfigTranslations)
        .component('pipDocumentList', documentList);
}