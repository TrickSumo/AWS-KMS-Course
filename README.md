# 🔐 # AWS-KMS-Course

# Symmetric Encryption Examples


## 📁 Encrypt/Decrypt Files Smaller Than 4KB

For files smaller than 4KB, you can directly use KMS without generating a data key.

```bash
echo "This is a small file" > myFile.txt

aws kms encrypt --key-id alias/learn --plaintext fileb://myFile.txt --output text --query CiphertextBlob --region ap-south-1 | base64 -d > myFile.encrypted

aws kms decrypt --ciphertext-blob fileb://myFile.encrypted --output text --query Plaintext --region ap-south-1 | base64 -d
```


## 📁 Encrypt/Decrypt Files Bigger Than 4KB

```bash
echo "This is a big file" > test.txt

aws kms generate-data-key --key-id alias/learn --key-spec AES_256 > data_key.json
jq -r '.Plaintext' data_key.json | base64 --decode > data_key_plaintext
jq -r '.CiphertextBlob' data_key.json | base64 -d > data_key_encrypted

openssl enc -aes-256-cbc -pbkdf2 -salt -in test.txt -out test.encrypted -pass file:data_key_plaintext
rm data_key_plaintext data_key.json

aws kms decrypt --ciphertext-blob fileb://data_key_encrypted --output text --query Plaintext --region ap-south-1 | base64 --decode > data_key_plaintext

openssl enc -d -aes-256-cbc -pbkdf2 -salt -in test.encrypted -out test.decrypted.txt -pass file:data_key_plaintext

```

---

# KMS Key Grant

```bash
aws kms create-grant \
    --key-id <your-key-id> \
    --grantee-principal <iam-user-arn> \
    --operations Decrypt \


aws kms list-grants --key-id <your-key-id>


aws kms revoke-grant \
  --key-id <your-key-id> \
  --grant-id <grant-id>
```

---

# Asymmetric Encryption Example - Create JWT

* Step 1: Create Base64-URL Encoded JWT Header & Payload



```bash
# Encode JSON to base64 (correcting assignment syntax)
JWT_HEADER=$(echo -n '{"alg":"RS256","typ":"JWT"}' | base64)
JWT_PAYLOAD=$(echo -n '{"sub": "1234567890", "name": "Rishi","iat": 1712222222}' | base64)

# Print encoded values
echo "JWT Header: $JWT_HEADER"
echo "JWT Payload: $JWT_PAYLOAD"

```
* Step 2: Create String to Sign
```
STRING_TO_SIGN="<JWT_HEADER>.<JWT_PAYLOAD_WITHOUT=>"
```

* Step 3: Hash the Data
```
HASHED_STRING=$(echo -n "$STRING_TO_SIGN" | openssl dgst -sha256 -binary | base64)
echo $HASHED_STRING
```

* Step 4: Sign with AWS KMS

```
SIGNATURE=$(aws kms sign \
  --key-id alias/jwtKey \
  --message "$HASHED_STRING" \
  --message-type DIGEST \
  --signing-algorithm RSASSA_PKCS1_V1_5_SHA_256 \
  --query 'Signature' \
  --output text | base64 --decode | base64 | tr '+/' '-_' | tr -d '=')
```

* Step 5: Generate JWT

```
JWT_FINAL="${STRING_TO_SIGN}.${SIGNATURE}"
echo "Final JWT: $JWT_FINAL"
```

---

# Serverless App Architecture

![image](https://github.com/user-attachments/assets/c7419f34-0f40-4579-95b1-2f2bae1c8c85)
![image](https://github.com/user-attachments/assets/4d43b563-8ba9-431f-8298-db416ce8baf7)

```
![image](https://github.com/user-attachments/assets/caa4134e-f1c6-4b3e-9bcd-c512260764c2)
![image](https://github.com/user-attachments/assets/58c3c221-ee28-4d64-b6a2-6add660d08d3)



