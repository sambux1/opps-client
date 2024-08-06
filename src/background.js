const pubkeys = [
  // PARTY 0 PUBLIC KEY (SAM)
  `-----BEGIN PUBLIC KEY-----
  MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuWKeSlMAKq+AD9eXO7Wz
  znxBjjKofwQT2x8Z2lpR/Nw4UhvCGtVWp14CvZbRwk1woqI3XAwug6YX6WOA2Jag
  91lNOC/y4lBea2e8FJUFiKGfjXa8X53n3ugx3Cba0E9WxE7yMTv0cPed2AqPhoXS
  oxvMozSWbGq0c3y2itCWuNWjfZTRywgA2Y/mRAG0NQMo+j9ZwOQhKL7BWIcI19gD
  9EcMSvSV0ZSbDJPdtqRkTN0+s3XZbhyU8dXhvUMpEWWY5ncceHAhvuUhxPetBFLq
  rI2hD6YPGFkYP8oPHzJmWb/gG3+4BwaGFlQ1XVNrmsbaVNJtmQugXSDAY+pK3W0/
  aQIDAQAB
  -----END PUBLIC KEY-----`,
  // PARTY 1 PUBLIC KEY (ELI)
  `-----BEGIN PUBLIC KEY-----
  MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAr9bJl7ns5emwQzk4Dl1N
  IigPyi9HLOrzq0EKrfDwI5ynJxMj3+infua1Rwh6Iv2LH4BbBwamsPnX9VLxTFU4
  VmdZK5Hq0WVXymsIx2NIpH6NOdW2bR6eHiOAEveeBileTdbYF3wpxC7ziKzH84pm
  Jxh3xDlbn5oJqDpuUPUL7vtyCBAWPpdYN9e7hQjsn3DCDzCXNzDP5rfzBYwTgGWg
  FCLHMLj+xxfZjbR0dP4gS0TMcTyrYkDxjT/qpeFxzix8zRu63Nmkr0G46Yswgxu7
  cgxBta1bTD1aalenL5uYZ/iFzkSpk3pOBKzvkxvaxDOxRi8L9x/H6mK7okefja7X
  6wIDAQAB
  -----END PUBLIC KEY-----`,
  // PARTY 2 PUBLIC KEY (MAYANK)
  `-----BEGIN PUBLIC KEY-----
  MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvfoNxQxyVBPLSbnzX/At
  J0/6bDSdC/lDUncyoA561fFKRRGS6ZNJ3vhf6IpH/Fexiw2XkmkEiF3odMplG0dm
  PsB2ubXxHD0MtWZMRLKqWFfuhcPbkrd+V50uiibvRgcyzdfKe2DSX0xe86qJSka4
  j4tGjMDUJnHRiQ+uZkFRXWa+UxycXgqhjZ8Z902ZyK3UnPf32/h1g5bjkTOj7xt1
  c8/N73H2zux+muvyQvmm8Bl+0j91GaLWpgi5t9WexMDr5G1H5GlLdUxgvCSKVT2T
  h4Pw9uCLxLlMvV/3rtRm5HLtg1I+GBcLHmITeyJhbmqZnfI1b3S83R5P17LNv55b
  9QIDAQAB
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
  // try 3 times in case it fails
  let attempts = 0;
  while (attempts < 3) {
    try {
      const response = await fetch(chrome.runtime.getURL(filePath));
      const data = await response.json();
      return data;
    } catch (error) {
      // I'm not sure what's causing this, so I just want to be aware of when it fails
      console.log('Error in loading data from JSON files:', error);
      attempts++;
    }
    
    return null;
  }
}

// initialize all data to zeroes, regardless of whether or not it already exists
async function resetData() {
  let historyData = {};
  let referralData = {};

  const top500UrlsData = await loadJSONData('topURLs.json');
  if (top500UrlsData === null) {
    return;
  }

  top500UrlsData.urls.forEach(url => {
      historyData[url] = {visitCount: 0};
      referralData[url] = {visitCount: 0};
  });
  
  browserAPI.storage.local.set({
    'historyData': historyData,
    'referralData': referralData
  }, () => {
    console.log('Reset the data');
  });
}

// Loads the top 500 URLs and social media domains, then initializes data structures
async function loadData() {
  // check if historyData and referralData already exist
  // loadData() is called more often than it needs to be by chrome, so we want to ignore it sometimes
  browserAPI.storage.local.get(['historyData', 'referralData']).then((result) => {
    // if either of them are undefined, define them
    // this should only happen at installation
    if ((result.historyData === undefined) || (result.referralData === undefined)) {
      resetData();
    }
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

async function isInTop500(url) {
  const topUrlsData = await loadJSONData('topURLs.json');
  if (topUrlsData === null) {
    return '';
  }
  let domain = topUrlsData['urls'].find(domain => url.includes(domain));
  
  if (domain === undefined) {
    return ''
  } else {
    return domain
  }
}

async function isSocialMediaReferral(url) {
  const socialMediaDomainsData = await loadJSONData('socialMediaDomains.json');
  if (socialMediaDomainsData === null) {
    return false;
  }
  let domain = socialMediaDomainsData['urls'].some(domain => url.includes(domain));
  
  if (domain === undefined) {
    return ''
  } else {
    return domain
  }
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
    isInTop500(domain).then((domainRet) => {
      if (domainRet != '') {
        // update the data and store
        // use try-catch block in case something bad happens while incrementing the visit count
        try {
          historyData[domainRet].visitCount += 1;
          browserAPI.storage.local.set({'historyData': historyData}).then(() => {
              console.log('History updated ->', domainRet, ':', historyData[domainRet].visitCount);
          });
        } catch (error) {
          console.log('Error in writing to history:', error, '| URL:', domainRet)
        }
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
    isSocialMediaReferral(initiatorDomain).then((initiatorDomainRet) => {
      if (initiatorDomainRet != '') {
        isInTop500(destinationDomain).then((destinationDomainRet) => {
          if (destinationDomainRet != '') {
            // update the data and store
            // use try-catch block in case something bad happens while incrementing the visit count
            try {
              referralData[destinationDomainRet].visitCount += 1;
              browserAPI.storage.local.set({'referralData': referralData}).then(() => {
                  console.log('Referrals updated ->', destinationDomainRet, ':', referralData[destinationDomainRet].visitCount);
              });
            } catch (error) {
              console.log('Error in writing to referrals:', error, '| URLs:', initiatorDomainRet, '->', destinationDomainRet)
            }
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
  if (details.reason == "install") {
    // Open the specified URL in a new window
    chrome.windows.create({ url: "form.html", type: "popup",
      height: 700,
      width: 600,
    });
  }
});

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
  if (visitCounts.length != 517) {
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
  if (referralCounts.length != 517) {
    console.log("ERROR: incorrect referralCounts length: " + referralCounts.length);
    return;
  }
  var secretSharedReferralCounts = secret_share(referralCounts, totalReferrals);
  const referralSharesCSV = convertSharesToCSV(secretSharedReferralCounts);

  // if no data, don't send
  if ((totalVisits == 0) && (totalReferrals == 0)) {
    return;
  }

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
  
  // send the datea to the https server
  try {
    await fetch('https://upload.op-ps-data.org', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(json_output, null, 0)
    });
  } catch(error) {
    console.log("Error in HTTPS send:", error)
  }
  
  resetData(); // reset data to all zeroes
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
  
  // Return true to indicate that responses are sent asynchronously
  // This is required when sendResponse is called outside of the current call stack
  return true;
});


// Initial load and schedule data transfer
loadData();
setupEventListeners();