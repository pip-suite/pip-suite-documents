import { IDocumentDataService, IDocumentDataProvider, DocumentConfig } from './IDocumentDataService';
import { BlobInfo } from './BlobInfo';
import { DataPage } from './DataPage';

class DocumentData implements IDocumentDataService {
    private RESOURCE: string = 'documents';
    private RESOURCE_INFO: string = 'documentsInfo';

    private PAGE_SIZE: number = 100;
    private PAGE_START: number = 0;
    private PAGE_TOTAL: boolean = true;

    constructor(
        private _config: DocumentConfig,
        private pipRest: pip.rest.IRestService,
        private pipFormat: pip.services.IFormat
    ) {
        "ngInject";

    }


    public get DocumentRoute(): string {
        return this._config.DocumentRoute;
    }

    public getDocumentUrl(id: string): string {
        return this.pipRest.serverUrl + this._config.DocumentRoute + '/' + id;
    }

    public postDocumentUrl(): string {
        return this.pipRest.serverUrl + this._config.DocumentRoute;
    }


    public readDocuments(params: any, successCallback?: (data: DataPage<BlobInfo>) => void, errorCallback?: (error: any) => void): angular.IPromise<any> {
        params = params || {};
        if (params.filter) {
            params.filer = this.pipFormat.filterToString(params.filer);
        }

        return this.pipRest.getResource(this.RESOURCE).page(params, successCallback, errorCallback);
    }

    public readDocumentInfo(params: any, successCallback?: (data: BlobInfo) => void, errorCallback?: (error: any) => void): angular.IPromise<any> {
        params = params || {};
        if (params.filter) {
            params.filer = this.pipFormat.filterToString(params.filer);
        }

        return this.pipRest.getResource(this.RESOURCE_INFO).get(params, successCallback, errorCallback);
    }

    public readDocument(id: string, successCallback?: (data: BlobInfo) => void, errorCallback?: (error: any) => void): angular.IPromise<any> {

        return this.pipRest.getResource(this.RESOURCE).get({
            blob_id: id
        }, successCallback, errorCallback);
    }

    public deleteDocument(id: string, successCallback?: () => void, errorCallback?: (error: any) => void): void {
        this.pipRest.getResource(this.RESOURCE).remove(
            { blob_id: id },
            null,
            successCallback,
            errorCallback
        );
    }
}


class DocumentDataProvider implements IDocumentDataProvider {
    private _service: IDocumentDataService;
    private _config: DocumentConfig;

    constructor(
        private pipRestProvider: pip.rest.IRestProvider
    ) {
        this._config = new DocumentConfig();

        this._config.DocumentRoute = '/api/1.0/blobs';
    }

    public get DocumentRoute(): string {
        return this._config.DocumentRoute;
    }

    public set DocumentRoute(value: string) {
        this._config.DocumentRoute = value;

        this.pipRestProvider.registerOperation('documents', this._config.DocumentRoute + '/:document_id');
        this.pipRestProvider.registerResource('documentInfo', this._config.DocumentRoute + '/:document_id/info');
    }

    public $get(
        pipRest: pip.rest.IRestService,
        pipFormat: pip.services.IFormat
    ) {
        "ngInject";

        if (this._service == null) {
            this._service = new DocumentData(this._config, pipRest, pipFormat);
        }

        return this._service;
    }

}


angular
    .module('pipDocumentData', ['pipRest', 'pipServices'])
    .provider('pipDocumentData', DocumentDataProvider);


