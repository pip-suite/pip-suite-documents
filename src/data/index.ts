import './Attachment';
import './BlobInfo';
import './DataPage';
import './DocumentDataService';
import './IDocumentDataService';

angular
    .module('pipDocuments.Data', [
        'pipDocumentData'
    ]);

export * from './Attachment';
export * from './BlobInfo';
export * from './DataPage';
export * from './IDocumentDataService';
