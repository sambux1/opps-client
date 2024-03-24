document.getElementById('downloadButton').addEventListener('click', function() {
  chrome.runtime.getBackgroundPage(function(backgroundPage) {
    backgroundPage.downloadCSVFiles();
  });
});
