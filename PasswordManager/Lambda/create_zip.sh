echo "Creating zip for GET Function"
cd ./get
zip -r get.zip ./*
mv get.zip ../
cd ..

echo "Creating zip for POST Function"
cd ./post
zip -r post.zip ./*
mv post.zip ../
cd ..

echo "Creating zip for UPDATE Function"
cd ./update
zip -r update.zip ./*
mv update.zip ../
cd ..

echo "Creating zip for DELETE Function"
cd ./delete
zip -r delete.zip ./*
mv delete.zip ../
cd ..
echo "Success!"