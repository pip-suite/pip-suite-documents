declare module pip.documents {


export class Attachment {
    constructor(id?: string, uri?: string, name?: string);
    id?: string;
    uri?: string;
    name?: string;
}

export class BlobInfo {
    constructor(id: string, group: string, name: string, size?: number, content_type?: string, create_time?: Date, expire_time?: Date, completed?: boolean);
    id: string;
    group: string;
    name: string;
    size: number;
    content_type: string;
    create_time: Date;
    expire_time: Date;
    completed: boolean;
}

export class DataPage<T> {
    constructor(data?: T[], total?: number);
    total: number;
    data: T[];
}


export class DocumentConfig {
    DocumentRoute: string;
}
export interface IDocumentDataService {
    DocumentRoute: string;
    getDocumentUrl(id: string): string;
    postDocumentUrl(): string;
    readDocuments(params: any, successCallback?: (data: DataPage<BlobInfo>) => void, errorCallback?: (error: any) => void): angular.IPromise<any>;
    readDocumentInfo(params: any, successCallback?: (data: BlobInfo) => void, errorCallback?: (error: any) => void): angular.IPromise<any>;
    readDocument(id: string, successCallback?: (data: BlobInfo) => void, errorCallback?: (error: any) => void): angular.IPromise<any>;
    deleteDocument(id: string, successCallback?: () => void, errorCallback?: (error: any) => void): void;
}
export interface IDocumentDataProvider extends ng.IServiceProvider {
    DocumentRoute: string;
}



export let DefaultDocumentIcon: string;
export class DocumentListEditControl {
    uploading: number;
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
    error: any;
}


export interface IDocumentUrlDialogService {
    show(successCallback?: (result: string) => void, cancelCallback?: () => void): any;
}

function configDocumentResources(pipRestProvider: pip.rest.IRestProvider): void;

function configFileResources(pipRestProvider: pip.rest.IRestProvider): void;


}
