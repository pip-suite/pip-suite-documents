// configured Rest resource
function configDocumentResources(pipRestProvider: pip.rest.IRestProvider) {
    pipRestProvider.registerPagedCollection('documents', '/api/1.0/blobs/:document_id',
        { blob_id: '@document_id' },
        {
            page: { method: 'GET', isArray: false },
            update: { method: 'PUT' }
        });
    pipRestProvider.registerResource('documentInfo', '/api/1.0/blobs/:document_id/info');
}

angular
    .module('pipDocuments.Rest')
    .config(configDocumentResources);


