import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { KMSClient, DecryptCommand, SignCommand } from "@aws-sdk/client-kms";
import crypto from "crypto";

const config = {
    "region": "ap-south-1",
}

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const kmsClient = new KMSClient(config);

const tableName = process.env.tableName || "AuthServer";
const symmetricKeyId = process.env.keyId || "alias/PassManagerKey";
const asymmetricKeyId = process.env.keyId || "alias/AuthServerKey";

const createResponse = (statusCode, body) => {
    const responseBody = JSON.stringify(body);
    return {
        statusCode,
        headers: { "Content-Type": "application/json" },
        body: responseBody,
    };
};

const base64UrlEncode = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url"); // Convert to Base64URL

export const login = async (event) => {
    const { body } = event;
    const { username, password } = JSON.parse(body || "{}");

    if (!username || !password) {
        return createResponse(409, { error: "Missing required attributes for the item: username, or password." });
    }

    const userId = username;

    try {

        const command = new GetCommand({
            TableName: tableName,
            Key: {
                userId,

            }
        });
        const response = await docClient.send(command);

        if (!response.Item) {
            return createResponse(404, { error: "User not found" });
        }

        const encryptedPassword = response.Item.password;
        const buffer = Buffer.from(encryptedPassword, "base64");

        const decryptCommand = new DecryptCommand({
            CiphertextBlob: buffer,
            KeyId: symmetricKeyId,
            EncryptionContext: {
                "userId": userId,
                "purpose": "password-encryption",
            },
        });
        const kmsResponse = await kmsClient.send(decryptCommand);
        const passwordFromDB = Buffer.from(kmsResponse.Plaintext).toString("utf-8");

        if (passwordFromDB !== password) {
            return createResponse(401, { error: "Invalid credentials" });
        }

        const header = {
            alg: "RS256",
            typ: "JWT"
        };

        const payload = {
            sub: userId,
            iat: Math.floor(Date.now() / 1000), // Current timestamp
            exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiration
        };

        const encodedHeader = base64UrlEncode(header);
        const encodedPayload = base64UrlEncode(payload);
        const signingInput = `${encodedHeader}.${encodedPayload}`;
        const hash = crypto.createHash("sha256").update(signingInput).digest();

        const signCommand = new SignCommand({
            KeyId: asymmetricKeyId, // Asymmetric key ID
            Message: hash,
            MessageType: "DIGEST",  // Must use DIGEST since we pre-hashed
            SigningAlgorithm: "RSASSA_PKCS1_V1_5_SHA_256"
        });
        const signResponse = await kmsClient.send(signCommand);

        const jwtSignature = Buffer.from(signResponse.Signature).toString("base64url");
        const jwtToken = `${encodedHeader}.${encodedPayload}.${jwtSignature}`;

        return createResponse(200, {
            message: "User logged in successfully",
            token: jwtToken,
        });
        
    }
    catch (err) {
        if (err.message === "The conditional request failed")
            return createResponse(409, { error: "Item already exists!" });
        else
            return createResponse(500, {
                error: "Internal Server Error!",
                message: err.message,
            });
    }

}