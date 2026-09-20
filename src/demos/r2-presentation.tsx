import type { LocalizationContext } from '../i18n/runtime';
import { localizationForEnv } from '../i18n/runtime';
import { routeUrl } from '../routing/application-routes';
import type { Env } from '../types';
import { browserAssetName } from '../ui/asset-map';
import type { DemoSection, DemoSectionOptions } from '../ui/demo-section';
import { DemoHeading, useDemoPresentationScope } from '../ui/demo-presentation-scope';
import { createReactDemoSection } from '../ui/react-demo-section';

function r2BrowserMessages(localization: LocalizationContext): Readonly<Record<string, string>> {
  const exact = (english: string) => localization.exact(english);
  return Object.freeze({
    text: exact('Text'),
    binary: exact('Binary'),
    file: exact('File'),
    fileRequired: exact('Choose a file before uploading.'),
    fileEmpty: exact('Choose a file that is not empty.'),
    fileTooLarge: exact('File exceeds the 5 MiB limit.'),
    objectLimit: exact('This sandbox already has 10 uploads.'),
    byteLimit: exact('This file would exceed the 20 MiB sandbox limit.'),
    fileMissing: exact('That file is no longer available.'),
    r2Unavailable: exact('R2 is temporarily unavailable.'),
    complete: exact('Complete'),
    failed: exact('Failed'),
    running: exact('Running'),
    ok: exact('OK'),
    error: exact('ERROR'),
    requestInFlight: exact('Request in flight…'),
    requestFailed: exact('Request failed'),
    networkError: exact('Network error'),
    unreadableResponse: exact('The request did not reach a readable response.'),
    object: exact('object'),
    objects: exact('objects'),
    browserUploaded: exact('Browser uploaded file'),
    workerAccepted: exact('Worker accepted size'),
    r2Stored: exact('R2 object stored under key'),
    metadataReturned: exact('Metadata returned'),
    appearedInInventory: exact('File appeared in visitor inventory'),
    inventoryConfirmed: exact('Confirmed in current list'),
    inventoryPending: exact('Inventory refresh pending'),
    selectedFile: exact('Selected file'),
    close: exact('Close'),
    loadingTextPreview: exact('Loading text preview…'),
    previewUnavailable: exact('Preview unavailable.'),
    yours: exact('Yours'),
    demo: exact('Demo'),
    viewing: exact('Viewing'),
    preview: exact('Preview'),
    delete: exact('Delete'),
    deleteQuestion: exact('Delete?'),
    confirm: exact('Confirm'),
    cancel: exact('Cancel'),
    confirmDeletion: exact('Confirm deletion of'),
    details: exact('Details'),
    internalKey: exact('Internal key'),
    mimeType: exact('MIME type'),
    ownership: exact('Ownership'),
    updated: exact('Updated'),
    download: exact('Download'),
    noFiles: exact('No files are visible yet.'),
    selectFile: exact('Select one file to begin.'),
    readyToUpload: exact('is ready to upload.'),
    downloading: exact('Downloading'),
    downloaded: exact('downloaded.'),
    downloadFailed: exact('Download failed — try again.'),
    uploading: exact('Uploading'),
    uploadingButton: exact('Uploading…'),
    uploadFile: exact('Upload file'),
    uploaded: exact('uploaded successfully.'),
    uploadFailed: exact('Upload failed — try again.'),
    refreshing: exact('Refreshing files…'),
    filesRefreshed: exact('Files refreshed.'),
    refreshFailed: exact('Unable to refresh files — try again.'),
    deleting: exact('Deleting'),
    deleted: exact('deleted.'),
    deleteFailed: exact('Delete failed — try again.'),
    resetting: exact('Resetting your sandbox…'),
    uploadsRemoved: exact('Your uploads were removed.'),
    resetFailed: exact('Reset failed — try again.'),
    sandboxReady: exact('Sandbox ready.'),
    loadFailed: exact('Unable to load files — try again.'),
    previewOf: exact('Preview of'),
    upload: exact('uploads'),
  });
}

function R2Presentation({ localization }: Readonly<{ localization: LocalizationContext }>) {
  const scope = useDemoPresentationScope();
  const exact = (english: string) => localization.exact(english);
  const sandboxHeading = scope.id('sandbox-heading');
  const requestHeading = scope.id('request-heading');

  return <>
    <section className="page-header lab-page-header">
      <DemoHeading level={1}>{exact('Cloudflare R2 Storage')}</DemoHeading>
      <p className="lede">{exact('Upload a file and inspect how its bytes and metadata move through the live stack.')}</p>
    </section>

    <section className="lab-grid r2-lab" aria-label={exact('R2 storage demonstration')}>
      <section className="panel r2-workspace" aria-labelledby={sandboxHeading}>
        <div className="r2-workspace-heading">
          <div><p className="eyebrow">{exact('Live storage workspace')}</p><DemoHeading level={2} id={sandboxHeading}>{exact('Your R2 sandbox')}</DemoHeading></div>
          <strong className="sandbox-usage" data-sandbox-usage="">{exact('Loading usage…')}</strong>
        </div>

        <div className="r2-upload-block">
          <form data-upload-form="" noValidate>
            <label className="drop-zone" data-drop-zone="">
              <input className="r2-file-input" name="file" type="file" data-file-input="" />
              <span className="drop-zone-icon" aria-hidden="true">↑</span>{' '}
              <strong className="drop-zone-title">{exact('Drop a file here')}</strong>{' '}
              <span>{exact('or')} <span className="browse-file">{exact('Browse files')}</span></span>{' '}
              <span className="drop-limit">{exact('5 MiB maximum')}</span>
            </label>{' '}
            <div className="file-selection" data-file-selection="" hidden>
              <div><strong data-selected-name="">{exact('No file selected')}</strong><span data-selected-meta="" /></div>
              <button className="icon-button" type="button" data-clear-selection="" aria-label={exact('Clear selected file')}>×</button>
            </div>
            <div className="upload-actions">
              <button className="button-primary" type="submit" data-upload-button="" disabled>{exact('Upload file')}</button>{' '}
              <p className="operation-status" role="status" aria-live="polite" data-operation-status="">{exact('Select one file to begin.')}</p>
            </div>
          </form>
          <ol className="r2-upload-evidence" data-upload-evidence="" aria-label={exact('Upload path evidence')} hidden />
        </div>

        <div className="r2-files-heading">
          <div><p className="eyebrow">{exact('Objects in this session')}</p><DemoHeading level={3}>{exact('Files')}</DemoHeading></div>
          <div className="file-count-actions"><button className="icon-button" type="button" data-refresh="" aria-label={exact('Refresh files')} title={exact('Refresh files')}>↻</button></div>
        </div>
        <div className="file-list" data-files=""><p className="file-list-empty">{exact('Loading R2 objects…')}</p></div>

        <div className="sandbox-reset">
          <div><strong>{exact('Finished exploring?')}</strong><span>{exact('Shared demo files stay in place.')}</span></div>
          <button className="danger-text-button" type="button" data-r2-reset="" disabled>{exact('Reset sandbox')}</button>
          <div className="reset-confirm" data-reset-confirm="" hidden>
            <span>{exact('Delete all of your uploads?')}</span>
            <button className="danger-button" type="button" data-confirm-reset="">{exact('Confirm reset')}</button>
            <button type="button" data-cancel-reset="">{exact('Cancel')}</button>
          </div>
        </div>
      </section>

      <aside className="r2-sidebar">
        <section className="panel live-request-card" aria-labelledby={requestHeading}>
          <div className="lab-heading"><div><p className="eyebrow">{exact('Live request')}</p><DemoHeading level={2} id={requestHeading}>{exact('Latest operation')}</DemoHeading></div><span className="request-state" data-live-state="">{exact('Waiting')}</span></div>{' '}
          <div className="live-request-summary">
            <div><span>{exact('Method')}</span><strong data-request-method="">—</strong></div>{' '}
            <div><span>{exact('Status')}</span><strong data-request-status="">—</strong></div>{' '}
            <div><span>{exact('Round trip')}</span><strong data-request-duration="">—</strong></div>
          </div>{' '}
          <p className="request-metrics" data-request-metrics="">{exact('Choose an action to inspect the live result.')}</p>{' '}
          <details className="r2-response-details"><summary>{exact('View response JSON')}</summary><pre data-r2-output="">{exact('No request yet.')}</pre></details>
        </section>
      </aside>
    </section>
  </>;
}

export function r2Section(env: Env, options: DemoSectionOptions = {}): DemoSection {
  const localization = localizationForEnv(env);
  const presentationPath = `${routeUrl('demos.index')}#r2`;
  const browserModule = routeUrl('operations.assets', { asset: browserAssetName('scripts.r2') });
  return createReactDemoSection(env, {
    key: 'r2',
    title: 'Cloudflare R2',
    defaultPresentationPath: presentationPath,
    browserModule,
    browserMessages: r2BrowserMessages(localization),
    children: <R2Presentation localization={localization} />,
  }, options);
}
