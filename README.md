# The Online Privacy-Protected Synthesizer Client Plugin

The OPPS client plugin is a chrome extension which collects web browsing data in a privacy-preserving manner. All data collected is secret-shared and analyzed using secure multiparty computation. We only ever see a private encoding of your data, never your raw data itself.

### What Data Is Collected?
We collect a histogram of how many times users visit popular websites (popular defined as one of the ~500 most visited websites in the United States). We additionally track whether they were referred to a given website from one of the 9 most popular social media sites.

When a website is visited, we only track the top-level domain visited (e.g. google.com), rather than the full URL.

### Privacy Measures
All computation takes place using secure multiparty computation (MPC). MPC is a cryptographic technique which allows us to extract meaningful results from private data without ever seeing the underlying raw data. We only ever see a private encoding of your raw data, known as a secret sharing of your data.

For more information and frequently asked questions about MPC, see [here](https://cs-people.bu.edu/kaptchuk/pages/mpcfaq.html).
