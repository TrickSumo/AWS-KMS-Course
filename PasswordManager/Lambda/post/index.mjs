import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { KMSClient, EncryptCommand} from "@aws-sdk/client-kms";
import crypto from 'crypto';

const config = {
    "region": "ap-south-1",
}

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const kmcClient = new KMSClient(config);

const tableName = process.env.tableName || "PassManager";
const keyId = process.env.keyId || "alias/PassManagerKey";

const createResponse = (statusCode, body) => {
    const responseBody = JSON.stringify(body);
    return {
        statusCode,
        headers: { "Content-Type": "application/json" },
        body: responseBody,
    };
};

export const createPass = async (event) => {
    const { body } = event;
    const { site, username, password } = JSON.parse(body || "{}");
    const userId = event?.requestContext?.authorizer?.jwt?.claims?.sub;

    if (!site || !username || !password) {
        return createResponse(409, { error: "Missing required attributes for the item: site, username, or password." });
    }


    try {

        const kmsCommand = new EncryptCommand({
            KeyId: keyId,
            Plaintext: password,
            EncryptionContext: {
                "userId": userId,
                "purpose": "password-encryption",
            },
        });
        const kmsResponse = await kmcClient.send(kmsCommand);
        console.log("Encrypted kmsResponse:", kmsResponse);
        const encryptedPassword = Buffer.from(kmsResponse.CiphertextBlob).toString("base64");


        const dynamoCommand = new PutCommand({
            TableName: tableName,
            Item: {
            userId,
            passId: crypto.createHash('sha256').update(`${userId}-${site}-${username}`).digest('hex'),
            username,
            site,
            password: encryptedPassword,
            createdAt: new Date().toISOString(),
            },
            ConditionExpression: "attribute_not_exists(passId)",
        });


        const dynamoResponse = await docClient.send(dynamoCommand);
        return createResponse(201, { message: "Item Created Successfully!", dynamoResponse  });
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