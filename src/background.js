const pubkeys = [
  // PARTY 0 PUBLIC KEY
  `-----BEGIN PUBLIC KEY-----
  MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtVYEQWrU6blfvEvFj+qN
  SKa6Pz6l9l+bGZddcS7tgIi5laU5EHMHmYs7WSsEwRVJKuDK9n6rnK/QnfxKSklY
  DGWso23TC261DC3/XYR+61q6wjgB4Ki14w0hZ2nl2CxBp2X0HgNq6P19QCr9/vV3
  XPNCh/LsxctT9H7hngBpQf+IZWvrk5fsR72lapCU5y46EcJDPe9E5+dDq+8cw/d6
  0IAzLBGa+67rLHPKaS29+mbJOTEVvV3FZbDdDxSrc4c62be3jNQiLrDIFxMglCaO
  SvILkOXxv2kJzixPR+Zzr4NAVb0//dcO/S1vjIRT/0LxybV1cVl9G22VvKhB/Ahq
  2wIDAQAB
  -----END PUBLIC KEY-----`,
  // PARTY 1 PUBLIC KEY
  `-----BEGIN PUBLIC KEY-----
  MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtVYEQWrU6blfvEvFj+qN
  SKa6Pz6l9l+bGZddcS7tgIi5laU5EHMHmYs7WSsEwRVJKuDK9n6rnK/QnfxKSklY
  DGWso23TC261DC3/XYR+61q6wjgB4Ki14w0hZ2nl2CxBp2X0HgNq6P19QCr9/vV3
  XPNCh/LsxctT9H7hngBpQf+IZWvrk5fsR72lapCU5y46EcJDPe9E5+dDq+8cw/d6
  0IAzLBGa+67rLHPKaS29+mbJOTEVvV3FZbDdDxSrc4c62be3jNQiLrDIFxMglCaO
  SvILkOXxv2kJzixPR+Zzr4NAVb0//dcO/S1vjIRT/0LxybV1cVl9G22VvKhB/Ahq
  2wIDAQAB
  -----END PUBLIC KEY-----`,
  // PARTY 2 PUBLIC KEY
  `-----BEGIN PUBLIC KEY-----
  MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtVYEQWrU6blfvEvFj+qN
  SKa6Pz6l9l+bGZddcS7tgIi5laU5EHMHmYs7WSsEwRVJKuDK9n6rnK/QnfxKSklY
  DGWso23TC261DC3/XYR+61q6wjgB4Ki14w0hZ2nl2CxBp2X0HgNq6P19QCr9/vV3
  XPNCh/LsxctT9H7hngBpQf+IZWvrk5fsR72lapCU5y46EcJDPe9E5+dDq+8cw/d6
  0IAzLBGa+67rLHPKaS29+mbJOTEVvV3FZbDdDxSrc4c62be3jNQiLrDIFxMglCaO
  SvILkOXxv2kJzixPR+Zzr4NAVb0//dcO/S1vjIRT/0LxybV1cVl9G22VvKhB/Ahq
  2wIDAQAB
  -----END PUBLIC KEY-----`
]


// Determines the appropriate browser API
function getBrowserAPI() {
  if (typeof browser !== 'undefined') {
      return browser; // For Firefox
  } else {
      return chrome; // For Chrome
  }
}

const browserAPI = getBrowserAPI();

// Asynchronously loads JSON data from local files
async function loadJSONData(filePath) {
  const response = await fetch(chrome.runtime.getURL(filePath));
  const data = await response.json();
  return data;
}

// Loads the top 500 URLs and social media domains, then initializes data structures
async function loadData() {
  let historyData = {};
  let referralData = {};

  const top500UrlsData = await loadJSONData('top500Urls.json');

  top500UrlsData.urls.forEach(url => {
      historyData[url] = {visitCount: 0};
      referralData[url] = {visitCount: 0};
  });

  browserAPI.storage.local.set({
    'historyData': historyData,
    'referralData': referralData
  }, () => {
    console.log('Loaded history and referral data');
  });
}

function init() {
  const now = new Date();
  browserAPI.storage.local.set({
    'lastSendTimestamp': JSON.stringify(now),
    'lastUpdateTimestamp': JSON.stringify(now)
  });
}

// close down the plugin if it is no longer 2024
function sunset() {
  browserAPI.management.uninstallSelf({ 
    showConfirmDialog: false
  });
}

// a function called on every event
// checks if it's time to send data
async function checkForSend() {
  const now = new Date();
  const utcYear = now.getUTCFullYear();

  // check for sunset
  if (utcYear > 2024) {
    sunset();
    return;
  }

  const currentMonth = now.getUTCMonth();
  const currentDay = now.getUTCDate();

  // get the hour of the last send timestamp
  browserAPI.storage.local.get(['lastSendTimestamp', 'lastUpdateTimestamp']).then((result) => {
    if ((result.lastSendTimestamp === undefined) || (result.lastUpdateTimestamp === undefined)) {
      init();
      return;
    }

    let timestamp = new Date(Date.parse(JSON.parse(result.lastSendTimestamp)));
    let timestampMonth = timestamp.getUTCMonth();
    let timestampDay = timestamp.getUTCDate();
    console.log('current, timestamp: ' + currentMonth + ' ' + currentDay + ' -- ' + timestampMonth + ' ' + timestampDay);
    if ((currentDay != timestampDay) || (currentMonth != timestampMonth)) {
      // initiate a send
      prepareAndSendData(result.lastUpdateTimestamp);
      browserAPI.storage.local.set({
        'lastSendTimestamp': JSON.stringify(now)
      });
    }
  });
}

function setupEventListeners() {
  browserAPI.history.onVisited.addListener(updateHistory);
  browserAPI.webRequest.onBeforeRequest.addListener(updateReferralData, { urls: ["<all_urls>"] }, ["blocking"]);
}

/*function isInTop500(url, historyData) {
  return Object.keys(historyData).some(domain => url.includes(domain));
}*/
async function isInTop500(url) {
  const top500UrlsData = await loadJSONData('top500Urls.json');
  return top500UrlsData['urls'].some(domain => url.includes(domain));
}

async function isSocialMediaReferral(url) {
  const socialMediaDomainsData = await loadJSONData('socialMediaDomains.json')
  return socialMediaDomainsData['urls'].some(domain => url.includes(domain));
}

// timestamp most recent history/referral update
async function timestampUpdate() {
  const now = new Date();
  browserAPI.storage.local.set({
    'lastUpdateTimestamp': JSON.stringify(now)
  });
}

async function updateHistory(historyItem) {
  await checkForSend();
  await timestampUpdate();

  // happens on installation, ignore
  if (historyItem.title == "Extension Data Form") {
    return;
  }

  const domain = new URL(historyItem.url).hostname;

  browserAPI.storage.local.get('historyData').then((result) => {
    let historyData = result.historyData;
    isInTop500(historyItem.url).then((valid) => {
      if (valid) {
        // update the data and store
        historyData[domain].visitCount += 1;
        browserAPI.storage.local.set({'historyData': historyData}).then(() => {
            console.log('History updated');
        });
      }
    });

  });
}

async function updateReferralData(initiator, destination) {
  await checkForSend();
  await timestampUpdate();

  if ((initiator === undefined) || (destination === undefined)) {
    return;
  }
  
  const initiatorDomain = new URL(initiator).hostname;
  const destinationDomain = new URL(destination).hostname;

  // check if a site is referring to itself and ignore
  if ((initiatorDomain.includes(destinationDomain)) || (destinationDomain.includes(initiatorDomain))) {
    return;
  }

  browserAPI.storage.local.get('referralData').then((result) => {
    let referralData = result.referralData;
    isSocialMediaReferral(initiatorDomain).then((initiatorValid) => {
      if (initiatorValid) {
        isInTop500(destinationDomain).then((destinationValid) => {
          if (destinationValid) {
            // update the data and store
            referralData[destinationDomain].visitCount += 1;
            browserAPI.storage.local.set({'referralData': referralData}).then(() => {
                console.log('Referrals updated');
            });
          }
        });
      }
    });
    
  });
}

function setupEventListeners() {
  browserAPI.history.onVisited.addListener(updateHistory);
  browserAPI.webRequest.onBeforeRequest.addListener(
    function(details) {
      if (details.type === "main_frame") {
        updateReferralData(details.initiator, details.url);
      }
    },
    { urls: ["<all_urls>"] }
  );
}

browserAPI.runtime.onInstalled.addListener(function(details) {
  // Open the specified URL in a new window
  chrome.windows.create({ url: "form.html", type: "popup",
    height: 700,
    width: 600,
  });
});

// Convert data to CSV format
function convertToCSV(data) {
  let csvContent = "URL,Visit Count\n";
  for (const [url, {visitCount}] of Object.entries(data)) {
      csvContent += `"${url}",${visitCount}\n`;
  }
  return csvContent;
}

function convertReferralToCSV() {
  let str = "Referral URL,Count\r\n"; // CSV Header for referral data
  Object.entries(referralData).forEach(([domain, count]) => {
    str += `${domain},${count}\r\n`;
  });
  return str;
}

// Download CSV files
function downloadCSVFiles() {
  checkForSend();
}

// Helper function to trigger download
function triggerDownload(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob); // Create a blob URL from the blob

  chrome.downloads.download({
      url: url,
      filename: filename,
      saveAs: true
  }, function(downloadId) {
      console.log('Download initiated for ', filename, ' with ID ', downloadId);
      URL.revokeObjectURL(url); // Clean up the blob URL after initiating the download
  });
}

// create a list of secret shares of the input array
function secret_share(dataArray, total) {
  // the fixed point precision to use in crypten
  const precision_bits = 16;
  var len = dataArray.length;
  var shares1 = new BigUint64Array(len);
  var shares2 = new BigUint64Array(len);
  var shares3 = new BigUint64Array(len);
  crypto.getRandomValues(shares1);
  crypto.getRandomValues(shares2);
  for (let i = 0; i < len; i++) {
    shares3[i] = 0n - shares1[i] - shares2[i];
    // calculate the value to be shared - the fraction of visits to a given site
    // start with number of visits to the site, divide by total visits
    // scale up to get a fixed point encoding of the fraction
    // do the scaling up first so information is not lost
    if (total == 0) {
      // can't divide by zero, just set the values to zero instead of computing them
      shares1[i] += BigInt(0); 
    } else {
      fraction = (dataArray[i] * 2**precision_bits) / total;
      int_fraction = Math.round(fraction);
      if (Number.isInteger(int_fraction)) {
        shares1[i] += BigInt(int_fraction); 
      } else {
        // ERROR - this shouldn't happen but we need to know if it does
        throw new Error('Value to secret share is not a number!');
      }
    }
  }
  return [shares1, shares2, shares3];
}

// takes as input 3 lists of secret shares
// creates 3 strings representing the CSV of each share
function convertSharesToCSV(shares) {
  output = Array(3);
  for (let i = 0; i < 3; i++) {
    let str = '';
    let array = shares[i];
    for (let j = 0; j < array.length; j++) {
      str += array[j] + ',';
    }
    output[i] = str;
  }

  return output;
}

// a function to get yesterday's date in the form "mm-dd-yy"
// depricated - we don't always want to send the day before, should be based on lastUpdateTimestamp
function getYesterdaysDate() {
  yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  day = yesterday.getDate();
  if (day < 10) {
    day = '0' + day;
  }
  month = yesterday.getMonth() + 1;
  if (month < 10) {
    month = '0' + month;
  }
  year = yesterday.getFullYear().toString().slice(2);

  output = month + '-' + day + '-' + year;
  return output;
}

function getDateString(timestamp) {
  month = timestamp.getUTCMonth() + 1;
  if (month < 10) {
    month = '0' + month
  }
  day = timestamp.getUTCDate();
  if (day < 10) {
    day = '0' + day
  }
  year = timestamp.getUTCFullYear().toString().slice(2);

  output = month + '-' + day + '-' + year;
  return output;
}

// helper function to encode an ArrayBuffer as a hex string for a compact representation
// https://stackoverflow.com/questions/40031688/javascript-arraybuffer-to-hex
function buf2hex(buffer) { // buffer is an ArrayBuffer
  return [...new Uint8Array(buffer)]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('');
}

function convertSharesCSVtoJSON(countsEncrypted, tag, stateOfResidence, zipCode,
                                date, totalVisits, totalReferrals) {
  json_output = {
    'date': date,
    'tag': tag,
    'state': stateOfResidence,
    'zipCode': zipCode,
    'totalVisits': totalVisits,
    'totalReferrals': totalReferrals,
    'shares': [
      {
        'destination_party': 0,
        'key_encrypted': buf2hex(countsEncrypted[0].key),
        'json_encrypted': buf2hex(countsEncrypted[0].json)
      },
      {
        'destination_party': 1,
        'key_encrypted': buf2hex(countsEncrypted[1].key),
        'json_encrypted':  buf2hex(countsEncrypted[1].json)
      },
      {
        'destination_party': 2,
        'key_encrypted':  buf2hex(countsEncrypted[2].key),
        'json_encrypted':  buf2hex(countsEncrypted[2].json)
      }
    ]
  }
  
  return json_output;
}

async function generate_daily_hash(mTurkID, date) {
  const encoder = new TextEncoder();
  const message = mTurkID + date;
  const data = encoder.encode(message);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return buf2hex(hash);
}

// copied from Mozilla example
// from https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
function str2ab(str) {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

async function aesEncrypt(json, party) {
  key = await crypto.subtle.generateKey(
    {
      name: "AES-CTR",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"],
  );

  counter = new Uint8Array(16);
  let enc = new TextEncoder();
  json_enc = enc.encode(json);
  json_ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-CTR",
      counter,
      length: 64,
    },
    key,
    json_enc
  );

  exported_key = await crypto.subtle.exportKey("raw", key);
  key_enc = await rsaEncrypt(new Uint8Array(exported_key), party);
  
  return new Promise((resolve) => {
    resolve({
      json: json_ciphertext,
      key: key_enc,
    })
  });
}

// the message is an AES key
// party determines which party's public key is used
async function rsaEncrypt(message, party) {
  pem = pubkeys[party];
  // fetch the part of the PEM string between header and footer
  const pemHeader = "-----BEGIN PUBLIC KEY-----";
  const pemFooter = "-----END PUBLIC KEY-----";
  const pemContents = pem.substring(
    pemHeader.length,
    pem.length - pemFooter.length - 1,
  );
  // base64 decode the string to get the binary data
  const binaryDerString = atob(pemContents);
  // convert from a binary string to an ArrayBuffer
  const binaryDer = str2ab(binaryDerString);

  key = await crypto.subtle.importKey(
    "spki",
    binaryDer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["encrypt"],
  )

  ciphertext = await crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    key,
    message
  )
  
  return ciphertext;
}

// the main function that handles data transmission once per day
async function prepareAndSendDataBody(historyData, referralData, mTurkID,
                                      stateOfResidence, zipCode, lastUpdateTimestamp) {
  // prepare the visit histogram
  var historyDataObjects = Object.values(historyData);
  var historyDataLength = historyDataObjects.length;
  var visitCounts = new Array(historyDataLength);
  var totalVisits = 0;
  for (let i = 0; i < historyDataLength; i++) {
    visitCounts[i] = historyDataObjects[i]["visitCount"];
    totalVisits += visitCounts[i];
  }
  console.log('Total visits: ' + totalVisits);
  // assert correct size
  if (visitCounts.length != 500) {
    console.log("ERROR: incorrect visitCount length: " + visitCounts.length);
    return;
  }
  var secretSharedVisitCounts = secret_share(visitCounts, totalVisits);
  const historySharesCSV = convertSharesToCSV(secretSharedVisitCounts);

  // prepare the referral histogram
  var referralDataObjects = Object.values(referralData);
  var referralDataLength = referralDataObjects.length;
  var referralCounts = new Array(referralDataLength);
  var totalReferrals = 0;
  for (let i = 0; i < referralDataLength; i++) {
    referralCounts[i] = referralDataObjects[i]["visitCount"];
    totalReferrals += referralCounts[i];
  }
  // assert correct size
  if (referralCounts.length != 500) {
    console.log("ERROR: incorrect referralCounts length: " + referralCounts.length);
    return;
  }
  var secretSharedReferralCounts = secret_share(referralCounts, totalReferrals);
  const referralSharesCSV = convertSharesToCSV(secretSharedReferralCounts);

  // combine the history and referral counts into a single JSON object
  combinedCountsEncrypted = new Array(3);
  for (let j = 0; j < 3; j++) {
    combinedJson = {
      'history_histogram_encrypted': historySharesCSV[j],
      'referral_histogram_encrypted': referralSharesCSV[j]
    }

    // encrypt the JSON string
    ret = await aesEncrypt(JSON.stringify(combinedJson), j)
    
    combinedCountsEncrypted[j] = {
      json: ret.json,
      key: ret.key
    };
  }

  const timestamp = new Date(Date.parse(JSON.parse(lastUpdateTimestamp)));
  date = getDateString(timestamp);
  
  daily_tag = await generate_daily_hash(mTurkID, date);

  json_output = convertSharesCSVtoJSON(combinedCountsEncrypted, daily_tag, stateOfResidence, zipCode,
                                        date, totalVisits, totalReferrals);
  console.log(JSON.stringify(json_output))
  
  // send the data to the websocket server
  websocket = new WebSocket("wss://op-ps-data.org:11243");
  websocket.onopen = function () {
    console.log('Sending data to webserver!');
    websocket.send(JSON.stringify(json_output, null, 0));
    loadData(); // reset data
  }
}

async function prepareAndSendData(lastUpdateTimestamp) {
  browserAPI.storage.local.get(['historyData', 'referralData', 'mTurkID',
                                          'stateOfResidence', 'zipCode', 'lastUpdateTimestamp']).then((result) => {
    let historyData = result.historyData;
    let referralData = result.referralData;
    let mTurkID = result.mTurkID;
    let stateOfResidence = result.stateOfResidence;
    let zipCode = result.zipCode;
    prepareAndSendDataBody(historyData, referralData, mTurkID, stateOfResidence, zipCode, lastUpdateTimestamp);
  });
}

function timeToMidnightUTC() {
  const now = new Date();
  const midnightUtc = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0);
  return midnightUtc.getTime() - now.getTime();
}

// this is triggered when the form is filled out upon installation
browserAPI.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  // Check for the MTurk ID and State submission
  if (request.mturkId && request.state) {
    init();

    console.log('Received MTurk ID: ' + request.mturkId);
    console.log('Received State: ' + request.state);
    console.log('Received ZIP: ' + request.zipCode);
    
    // Save the MTurk ID and State to local storage
    browserAPI.storage.local.set({
      'stateOfResidence': request.state,
      'mTurkID': request.mturkId,
      'zipCode': request.zipCode
    }, function() {
      console.log('State of residence and MTurk ID have been saved to local storage.');
      // Send a response back to the sender to confirm the data has been received and saved
      sendResponse({status: 'MTurk ID and State received and saved'});
    });
    
    // Must return true when using sendResponse asynchronously
    return true;
  }

  // Check if the action to download CSV files is requested
  if (request.action === "downloadCSVFiles") {
    downloadCSVFiles();
    // Send a response back to the sender to confirm the initiation of CSV file download
    sendResponse({status: 'Initiating download of CSV files'});
    // No need to return true here unless downloadCSVFiles is asynchronous and uses sendResponse
  }

  // Return true to indicate that responses are sent asynchronously
  // This is required when sendResponse is called outside of the current call stack
  return true;
});


// Initial load and schedule data transfer
loadData();
setupEventListeners();