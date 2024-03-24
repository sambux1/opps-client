rm *.zip

# build the chrome zip
cp manifest-chrome.json src/manifest.json
cd src/
zip -r ../chrome.zip ./*
rm manifest.json
cd ..

# build the firefox zip
cp manifest-firefox.json src/manifest.json
cd src/
zip -r ../firefox.zip ./*
rm manifest.json
cd ..