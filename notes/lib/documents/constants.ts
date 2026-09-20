/* Shared by the browser (file picker, size checks) and the server: no imports, so it is safe in client bundles. */

/** File kinds the uploader accepts (checked by extension and by MIME). */
export const DOCUMENT_ACCEPT = '.pdf,.docx,.doc,.xlsx,.xls,.csv,.tsv,.txt,.md,.markdown,.rtf,.html,.htm,.json,.png,.jpg,.jpeg,.gif,.webp,.heic,.heif,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/*,image/*'
export const MAX_DOCUMENT_BYTES = 40 * 1024 * 1024
