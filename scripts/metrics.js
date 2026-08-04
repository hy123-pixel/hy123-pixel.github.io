(function () {
  'use strict';
  var BIN_URL = 'https://api.jsonbin.io/v3/b/6a71b520da38895dfeb7980a/latest';
  var UPDATE_URL = 'https://api.jsonbin.io/v3/b/6a71b520da38895dfeb7980a';
  var ACCESS_KEY = '$2a$10$yTBXM5nZDOpSchZImHUkq.YxPz0ZmkZc13w6jK63CvbOZ8D3eEL52';

  function readMetrics() {
    return fetch(BIN_URL, { headers: { 'X-Access-Key': ACCESS_KEY } })
      .then(function (response) { if (!response.ok) throw new Error('read ' + response.status); return response.json(); })
      .then(function (payload) { return payload.record || payload; });
  }
  function writeMetrics(record) {
    return fetch(UPDATE_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Access-Key': ACCESS_KEY },
      body: JSON.stringify(record)
    }).then(function (response) { if (!response.ok) throw new Error('write ' + response.status); return response.json(); });
  }
  function render(record) {
    document.querySelectorAll('[data-metric-total]').forEach(function (node) {
      node.textContent = Number(record.totalVisits || 0).toLocaleString('zh-CN');
    });
    document.querySelectorAll('[data-metric-days]').forEach(function (node) {
      var start = new Date(record.startedAt || '2026-08-04T00:00:00+08:00');
      node.textContent = Math.max(1, Math.floor((Date.now() - start.getTime()) / 86400000) + 1);
    });
    document.querySelectorAll('[data-metric-tool]').forEach(function (node) {
      var key = node.getAttribute('data-metric-tool');
      node.textContent = Number((record.tools || {})[key] || 0).toLocaleString('zh-CN');
    });
  }
  function update(mutator) {
    window.__metricsQueue = (window.__metricsQueue || Promise.resolve()).then(function () {
      return readMetrics().then(function (record) {
        record.tools = record.tools || {};
        record.startedAt = record.startedAt || '2026-08-04';
        mutator(record);
        return writeMetrics(record).then(function () { render(record); });
      });
    }).catch(function (error) { console.warn('[metrics]', error.message); });
    return window.__metricsQueue;
  }
  function once(key, mutator) {
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch (e) {}
    update(mutator);
  }
  once('hy123-site-visit', function (record) { record.totalVisits = Number(record.totalVisits || 0) + 1; });
  readMetrics().then(render).catch(function () {});

  var elementTools = {
    jsonInput: 'json', jsonFormat: 'json', jsonMinify: 'json',
    colorPicker: 'color', colorHex: 'color',
    baseInput: 'base64', baseEncode: 'base64', baseDecode: 'base64',
    urlInput: 'url', urlEncode: 'url', urlDecode: 'url',
    timestampInput: 'timestamp', timestampToDate: 'timestamp', dateToTimestamp: 'timestamp',
    textInput: 'text'
  };
  Object.keys(elementTools).forEach(function (id) {
    var node = document.getElementById(id);
    if (!node) return;
    var tool = elementTools[id];
    node.addEventListener('focus', function () {
      once('hy123-tool-' + tool, function (record) {
        record.tools[tool] = Number(record.tools[tool] || 0) + 1;
      });
    }, { once: true });
  });
}());
