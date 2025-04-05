echo "Creating zip for SIGNUP Function"
cd ./signup
zip -r signup.zip ./*
mv signup.zip ../
cd ..

echo "Creating zip for Login Function"
cd ./login
zip -r login.zip ./*
mv login.zip ../
cd ..

echo "Success!"