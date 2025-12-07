let uploadRequestsTotal = 0
let uploadErrorsTotal = 0

export function incUploadRequest() {
  uploadRequestsTotal++
}

export function incUploadError() {
  uploadErrorsTotal++
}

export function renderPrometheus() {
  const provider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase()
  const version = process.env.NEXT_PUBLIC_APP_VERSION || 'unknown'
  const uptime = process.uptime()
  return [
    '# HELP app_uptime_seconds Application uptime in seconds',
    '# TYPE app_uptime_seconds gauge',
    `app_uptime_seconds ${uptime.toFixed(0)}`,
    '# HELP app_build_info Build info',
    '# TYPE app_build_info gauge',
    `app_build_info{version="${version}"} 1`,
    '# HELP app_storage_provider Storage provider selected',
    '# TYPE app_storage_provider gauge',
    `app_storage_provider{provider="${provider}"} 1`,
    '# HELP app_upload_requests_total Total upload requests',
    '# TYPE app_upload_requests_total counter',
    `app_upload_requests_total ${uploadRequestsTotal}`,
    '# HELP app_upload_errors_total Total upload errors',
    '# TYPE app_upload_errors_total counter',
    `app_upload_errors_total ${uploadErrorsTotal}`
  ].join('\n')
}

