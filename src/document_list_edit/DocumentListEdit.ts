export let DefaultDocumentIcon: string = 'document';
import { Attachment, BlobInfo } from '../data';
import { IDocumentDataService } from '../data/IDocumentDataService';

let async = require('async');

const ConfigTranslations = (pipTranslate: pip.services.ITranslateService) => {
    if (pipTranslate) {
        (pipTranslate).setTranslations('en', {
            DOCUMENT_LIST_EDIT_TEXT: 'Click here to add a document',
            ERROR_TRANSACTION_IN_PROGRESS: 'Transaction is in progress. Please, wait until it\'s finished or abort'
        });
        (pipTranslate).setTranslations('ru', {
            DOCUMENT_LIST_EDIT_TEXT: 'Нажмите сюда, чтобы добавить документ',
            ERROR_TRANSACTION_IN_PROGRESS: 'Транзакция еще не завершена. Подождите окончания или прервите её'
        });
    }
}

export class DocumentListEditControl {
    uploading: number = 0;
    items: DocumentListEditItem[];
    reset: () => void;
    save: (successCallback?: (data: Attachment[]) => void, errorCallback?: (error: any) => void) => void;
    abort: () => void;
    error?: any;
}

export class DocumentUploadErrors {
    id: string;
    uri: string;
    name: string;
    error: any;
}

export class DocumentListEditItem {
    pin: number;
    id: string;
    name: string;
    uri?: string;
    uploading: boolean;
    uploaded: boolean;
    upload?: any;
    progress: number;
    file: any;
    state: string;
    error: any
}

{
    interface IDocumentListEditBindings {
        [key: string]: any;

        ngDisabled: any;
        pipCreated: any;
        pipChanged: any;
        documents: any;
        addedDocument: any;
        documentListText: any;
        documentListIcon: any;
        cancelDrag: any;
    }

    const DocumentListEditBindings: IDocumentListEditBindings = {
        ngDisabled: '&?',
        pipCreated: '&?',
        pipChanged: '&?',
        documents: '=?pipDocuments',
        addedDocument: '&?pipAddedDocument',
        documentListText: '<?pipDefaultText',
        documentListIcon: '<?pipDefaultIcon',
        cancelDrag: '<?pipCanselDrag'
    }

    class DocumentListEditChanges implements ng.IOnChangesObject, IDocumentListEditBindings {
        [key: string]: ng.IChangesObject<any>;
        // Not one way bindings
        ngDisabled: ng.IChangesObject<() => ng.IPromise<void>>;
        pipCreated: ng.IChangesObject<() => ng.IPromise<void>>;
        pipChanged: ng.IChangesObject<() => ng.IPromise<void>>;
        documents: ng.IChangesObject<Attachment[]>;
        addedDocument: ng.IChangesObject<() => boolean>;
        documentListText: ng.IChangesObject<string>;
        documentListIcon: ng.IChangesObject<string>;
        cancelDrag: ng.IChangesObject<() => boolean>;
    }

    class SenderEvent {
        sender: DocumentListEditControl;
    }

    class DocEvent {
        $event: SenderEvent;
        $control: DocumentListEditControl;
    }

    class DocumentStates {
        static Original: string = 'original';
        static Copied: string = 'copied';
        static Added: string = 'added';
        static Error: string = 'error';
        static Deleted: string = 'deleted';
    }

    class DocumentListEditController {
        private _pipTranslate: pip.services.ITranslateService;
        private _elementDocumentDrop: JQuery;
        private _itemPin: number = 0;
        private documentStartState: string;
        private loadedFiles: boolean

        private cancelQuery: any;

        public ngDisabled: () => boolean;
        public pipCreated: (params: DocEvent) => void;
        public pipChanged: (params: DocEvent) => void;
        public documents: Attachment[];
        public addedDocument: () => boolean;
        public cancelDrag: () => boolean;
        public documentListText: string;
        public documentListIcon: string;
        public iconError: string;

        public control: DocumentListEditControl;

        constructor(
            private $log: ng.ILogService,
            private $element: JQuery,
            private $injector: ng.auto.IInjectorService,
            private pipRest: pip.rest.IRestService,
            private $timeout: ng.ITimeoutService,
            private pipDocumentData: IDocumentDataService,
            private pipFileUpload: pip.files.IFileUploadService

        ) {
            "ngInject";

            this._pipTranslate = this.$injector.has('pipTranslate') ? <pip.services.ITranslateService>this.$injector.get('pipTranslate') : null;

            this._elementDocumentDrop = $element.children('.pip-document-drop');

            if (!this.documentListText) {
                this.documentListText = 'DOCUMENT_LIST_EDIT_TEXT';
            }
            if (!this.documentListIcon) {
                this.documentListIcon = 'document';
            }
            this.iconError = 'warn-circle';
            this.documentStartState = this.toBoolean(this.addedDocument) ? DocumentStates.Copied : DocumentStates.Original;

            this.control = {
                uploading: 0,
                items: this.getItems(),
                reset: () => {
                    this.resetDocument();
                },
                save: (successCallback?: (data: Attachment[]) => void, errorCallback?: (error: any) => void) => {
                    this.saveDocument(successCallback, errorCallback);
                },
                abort: () => {
                    this.onAbort();
                },
                error: null
            };

            this.control.reset();
            this.executeCallback();
            // Add class
            this.$element.addClass('pip-document-list-edit');
        }

        public $onChanges(changes: DocumentListEditChanges): void {
            if (changes.documents && changes.documents.currentValue) {
                if (!_.isEqual(this.documents, changes.documents.currentValue)) {
                    this.control.reset();
                }
            }
        }

        private toBoolean(value: any): boolean {
            if (value == null) {
                return false;
            }
            if (!value) {
                return false;
            }
            value = value.toString().toLowerCase();

            return value == '1' || value == 'true';
        }

        private getItems(): DocumentListEditItem[] {
            let items: DocumentListEditItem[] = [];
            let i: number;

            if (this.documents === null || this.documents.length === 0) {
                return items;
            }

            for (i = 0; i < this.documents.length; i++) {
                let item: DocumentListEditItem = {
                    pin: this._itemPin++,
                    id: this.documents[i].id,
                    name: this.documents[i].name,
                    uri: this.documents[i].uri,
                    uploading: false,
                    uploaded: false,
                    progress: 50,
                    file: null,
                    state: this.documentStartState,
                    error: null
                }
                items.push(item);
            }

            return items;
        }

        private setItems(): void {
            let item: DocumentListEditItem;
            let i: number;

            // Clean the array
            if (this.documents && this.documents.length > 0) {
                this.documents.splice(0, this.documents.length);
            }
            for (i = 0; i < this.control.items.length; i++) {
                item = this.control.items[i];

                if ((item.id || item.uri) && item.state != DocumentStates.Deleted) {
                    let newDoc: Attachment = {
                        id: item.id,
                        name: item.name,
                        uri: item.uri
                    };
                    this.documents.push(newDoc);
                }
            }
        }

        private getUploadErors(): DocumentUploadErrors[] {
            let errors: DocumentUploadErrors[] = [];

            _.each(this.control.items, (item: DocumentListEditItem) => {
                if (item.state == DocumentStates.Error || item.error) {
                    errors.push({
                        id: item.id,
                        uri: item.uri,
                        name: item.name,
                        error: item.error
                    })
                }
            });

            return errors;
        }

        public isDisabled(): boolean {
            if (this.control.uploading) {
                return true;
            }

            if (this.ngDisabled) {
                return this.ngDisabled();
            }

            return false;;
        }

        private resetDocument(): void {
            this.control.uploading = 0;
            this.control.items = this.getItems();
        }

        private deleteItem(item: DocumentListEditItem, callback: (error?: any) => void): void {
            // Avoid double transactions
            if (item.upload) {
                item.upload.abort();
                item.upload = null;
            }

            if (item.state !== DocumentStates.Deleted) { return; }

            // if attachment by uri
            this.removeItem(item);
            callback();
        }

        private saveDocument(successCallback?: (data: Attachment[]) => void, errorCallback?: (error: any) => void): void {
            let item: DocumentListEditItem;
            let onItemCallback: (error: any) => void;
            let i: number;

            if (this.control.uploading) {
                if (errorCallback) {
                    errorCallback('ERROR_TRANSACTION_IN_PROGRESS');
                }

                return;
            }

            this.cancelQuery = null;
            this.control.error = null;
            this.control.uploading = 0;

            let addedBlobCollection = [];
            let addedUrlCollection = [];

            _.each(this.control.items, (item) => {
                if (item.state == 'added') {
                    if (!item.uri) {
                        addedBlobCollection.push(item);
                    } else {
                        addedUrlCollection.push(item);
                    }
                }
            });


            let deletedCollection = _.filter(this.control.items, { state: 'deleted' });

            // process addedUrlCollection
            _.each(addedUrlCollection, (item) => {
                item.uploaded = true;
                item.uploading = false;
                item.progress = 0;
                item.upload = null;
                item.file = null;
                item.state = DocumentStates.Original;
            });

            if (!addedBlobCollection.length && !deletedCollection.length) {
                // do nothing
                if (addedUrlCollection.length > 0) {
                    this.setItems();
                }
                this.control.uploading = 0;
                if (successCallback) {
                    successCallback(this.documents);
                }

                return;
            }

            this.control.uploading = addedBlobCollection.length + deletedCollection.length;
            async.parallel([
                (callbackAll) => {
                    // add documents
                    _.each(addedBlobCollection, (item) => {
                        item.uploading = true;
                        item.progress = 0;
                    });
                    this.pipFileUpload.multiUpload(
                        this.pipDocumentData.postDocumentUrl(),
                        addedBlobCollection,
                        (index: number, data: BlobInfo, err: any) => {
                            let item = addedBlobCollection[index];
                            this.addItem(item, data, err);

                            if (err) {
                                this.control.error = true;
                            }
                        },
                        (index: number, state: pip.files.FileUploadState, progress: number) => {
                            // update item progress 
                            let item = addedBlobCollection[index];
                            item.progress = progress;
                        },
                        (error: any, result: any, res: any) => {
                            // reset upload abort
                            this.cancelQuery = null;
                            callbackAll();
                        },
                        (cancelQuery: any) => {
                            this.cancelQuery = cancelQuery;
                        },
                        false,
                        'pin'
                    );
                },
                (callbackAll) => {
                    // delete documents
                    if (deletedCollection.length) {
                        async.each(deletedCollection,
                            (item, callback) => {
                                this.deleteItem(item, (error: any) => { callback() });
                            },
                            (error, result) => {
                                callbackAll();
                            });
                    } else {
                        callbackAll();
                    }

                }
            ],
                // optional callback
                (error, results) => {
                    if (error && !this.control.error) {
                        this.control.error = error;
                    }
                    if (this.control.error) {

                        this.control.uploading = 0;
                        let errors = this.getUploadErors();
                        if (errorCallback) {
                            errorCallback(errors);
                        } else {
                            this.$log.error(this.control.error);
                        }
                    } else {
                        this.setItems();
                        this.control.uploading = 0;
                        if (successCallback) {
                            successCallback(this.documents);
                        }
                    }


                });

        }

        private addItem(oldItem: DocumentListEditItem, fileInfo: BlobInfo, error: any) {
            let itemIndex = _.findIndex(this.control.items, { pin: oldItem.pin });
            if (itemIndex < 0) return;
            if (error) {
                this.control.items[itemIndex].uploaded = false;
                this.control.items[itemIndex].uploading = false;
                this.control.items[itemIndex].progress = 0;
                this.control.items[itemIndex].upload = null;
                this.control.items[itemIndex].state = DocumentStates.Error;
                this.control.items[itemIndex].error = error;

            } else {
                if (fileInfo) {
                    this.control.items[itemIndex].id = fileInfo.id;
                    this.control.items[itemIndex].name = fileInfo.name;
                    this.control.items[itemIndex].uploaded = true;
                    this.control.items[itemIndex].state = DocumentStates.Original;
                } else {
                    this.control.items[itemIndex].uploaded = false;
                }
                this.control.items[itemIndex].uploading = false;
                this.control.items[itemIndex].progress = 0;
                this.control.items[itemIndex].upload = null;
                this.control.items[itemIndex].file = null;
                this.control.items[itemIndex].error = null;
            }
        }

        public onAbort(): void {
            let item: DocumentListEditItem;
            let i: number;

            for (i = 0; i < this.control.items.length; i++) {
                item = this.control.items[i];

                if (item.uploading) {
                    if (item.upload) {
                        item.upload.abort();
                    }

                    item.uploaded = false;
                    item.uploading = false;
                    item.progress = 0;
                    item.upload = null;
                }
            }

            // abort upload
            if (this.cancelQuery) {
                this.cancelQuery.resolve();
            }
            // Abort transaction
            this.control.uploading = 0;
            this.control.error = true;
        }

        // Visualization functions
        public filterItem(item: DocumentListEditItem): boolean {
            return item.state !== DocumentStates.Deleted;
        }

        // Process user actions
        public readItemLocally(url: string, file: any): void {

            let item: DocumentListEditItem = {
                pin: this._itemPin++,
                id: null,
                name: file ? file.name : url ? url.split('/').pop() : null,
                uri: !file && url ? url : null,
                uploading: false,
                uploaded: false,
                progress: 0,
                file: file ? file : null,
                state: DocumentStates.Added,
                error: null
            };

            this.control.items.push(item);

            this.onChange();
        }

        private removeItem(item: DocumentListEditItem): void {
            if (item.state === DocumentStates.Added || item.state === DocumentStates.Copied) {
                let index = _.findIndex(this.control.items, { pin: item.pin });
                if (index > -1) {
                    this.control.items.splice(index, 1);
                }
            } else {
                item.state = DocumentStates.Deleted;
            }
        }

        public onDelete(item: DocumentListEditItem): void {
            this.removeItem(item);

            this.onChange();
        }

        public onKeyDown($event: JQueryEventObject, item: DocumentListEditItem): void {
            if (item) {
                if ($event.keyCode === 46 || $event.keyCode === 8) {
                    this.removeItem(item);

                    this.onChange();
                }
            } else if ($event.keyCode === 13 || $event.keyCode === 32) {
                // !! Avoid clash with $apply()
                setTimeout(() => {
                    this._elementDocumentDrop.trigger('click');
                }, 0);
            }
        }

        // On change event
        public onChange() {
            if (this.pipChanged) {
                this.pipChanged({
                    $event: { sender: this.control },
                    $control: this.control
                });
            }
        }

        private executeCallback() {
            // Execute callback
            if (this.pipCreated) {
                this.pipCreated({
                    $event: { sender: this.control },
                    $control: this.control
                });
            }
        }
    }

    const documentListEdit: ng.IComponentOptions = {
        bindings: DocumentListEditBindings,
        templateUrl: 'document_list_edit/DocumentListEdit.html',
        controller: DocumentListEditController
    }

    angular
        .module("pipDocumentListEdit", ['ui.event', 'pipFocused', 'pipDocuments.Templates', 'pipFiles', 'DocumentUrlDialog'])
        .run(ConfigTranslations)
        .component('pipDocumentListEdit', documentListEdit);
}

