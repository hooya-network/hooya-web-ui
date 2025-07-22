(function () {
  var url = '${HOOYA_WEB_PROXY_URL}' || 'http://localhost:8532';
  if (
    url !== 'http://localhost:8532' &&
    !url.startsWith('http://') &&
    !url.startsWith('https://')
  ) {
    url = 'http://' + url;
  }
  window.__HOOYA_CONFIG__ = {
    HOOYA_WEB_PROXY_URL: url,
  };
})();
