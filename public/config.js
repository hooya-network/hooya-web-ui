(function () {
  var url = '192.168.17.226:8532' || 'http://localhost:8532';
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
