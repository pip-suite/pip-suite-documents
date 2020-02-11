import { BlobInfo } from './BlobInfo';
import { DataPage } from './DataPage';

export class DocumentConfig {
    public DocumentRoute: string;
}

export interface IDocumentDataService {
    DocumentRoute: string;

    getDocumentUrl(id: string): string;
    postDocumentUrl(): string

    readDocuments(params: any, successCallback?: (data: DataPage<BlobInfo>) => void, errorCallback?: (error: any) => void): angular.IPromise<any>
    readDocumentInfo(params: any, successCallback?: (data: BlobInfo) => void, errorCallback?: (error: any) => void): angular.IPromise<any>;
    readDocument(id: string, successCallback?: (data: BlobInfo) => void, errorCallback?: (error: any) => void): angular.IPromise<any>;
    deleteDocument(id: string, successCallback?: () => void, errorCallback?: (error: any) => void): void;
}


export interface IDocumentDataProvider extends ng.IServiceProvider {
    // bases document route string? sach as: '/api/1.0/blobs'
    DocumentRoute: string;
}
