document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('dataForm').addEventListener('submit', function(e) {
        e.preventDefault(); // Prevent the default form submission behavior

        // Extract values from the form fields
        var mturkId = document.getElementById('mturkId').value;
        var state = document.getElementById('state').value;
        var zipCode = document.getElementById('zipCode').value;
        var consent = document.querySelector('input[name="consent"]:checked').value;

        // Send the data to the Chrome extension's background script
        chrome.runtime.sendMessage({mturkId: mturkId, state: state, zipCode: zipCode, consent: consent}, function(response) {
            console.log('Response from background:', response ? response.status : 'No response');
            // Optional: Add additional logic based on the response from the background script
        });

        // Send data to Google Sheets via Apps Script Web App
        fetch('https://script.google.com/macros/s/AKfycby_ho8NTWgHYQCNgLovpLAbI3aMeJvKpZgw0t-Yq9V2SoGEmxTtceYNeOUHkCnAhrVA/exec', {
            method: 'POST',
            mode: 'no-cors', // To avoid CORS errors; note that this will prevent reading the response
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `consent=${encodeURIComponent(consent)}&state=${encodeURIComponent(state)}&mturkId=${encodeURIComponent(mturkId)}`
        })
        .then(() => {
            console.log('Data sent to Google Sheets successfully.');
            // Handle successful data transmission here
            window.close(); // Closes the form window after successful submission
        })
        .catch((error) => {
            console.error('Error sending data to Google Sheets:', error);
            // Handle errors here, such as showing an error message to the user
        });
    });
});
