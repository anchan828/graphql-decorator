npm run test

if [ "$?" -gt 0 ]; then
  exit 1
fi

cd examples/hello-world/

rm -rf node_modules package-lock.json
npm install
npm start

if [ "$?" -gt 0 ]; then
  exit 1
fi
cd ../../

cd examples/simple-crud

rm -rf node_modules package-lock.json
npm install
npm run print

if [ "$?" -gt 0 ]; then
  exit 1
fi
cd ../../

exit 0
