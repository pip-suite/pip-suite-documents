import './document_url_dialog/DocumentUrlDialogService';
import './document_url_dialog/IDocumentUrlDialogService';
import './document_list/DocumentList';
import './document_list_edit/DocumentListEdit';
import './rest';
import './data';
import './add_documents/AddDocument';

angular
    .module('pipDocuments', [
        'DocumentUrlDialog',
        'pipAddDocument',        
        'pipDocuments.Rest',
        'pipDocuments.Data',
        'pipDocumentList',
        'pipDocumentListEdit'
    ]);

export * from './document_url_dialog/IDocumentUrlDialogService';
export * from './document_list/DocumentList';
export * from './document_list_edit/DocumentListEdit';
export * from './data';
