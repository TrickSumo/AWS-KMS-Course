import { DynamoDBDocumentClient, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { KMSClient, DecryptCommand } from "@aws-sdk/client-kms";

const config = {
    "region": "ap-south-1",
}

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const kmsClient = new KMSClient(config);

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

export const getPass = async (event) => {
    const { pathParameters } = event;
    const passId = pathParameters?.id;
    const userId = event?.requestContext?.authorizer?.jwt?.claims?.sub;

    try {
        if (passId) {

            const command = new GetCommand({
                TableName: tableName,
                Key: {
                    userId,
                    passId
                }
            });
            const response = await docClient.send(command);

            if (!response.Item) {
                return createResponse(404, { error: "Item not found" });
            }

            const encryptedPassword = response.Item.password;
            const buffer = Buffer.from(encryptedPassword, "base64");
            
            const decryptCommand = new DecryptCommand({
                CiphertextBlob: buffer,
                KeyId: keyId,
                EncryptionContext: {
                    "userId": userId,
                    "purpose": "password-encryption",
                },
            });
            const kmsResponse = await kmsClient.send(decryptCommand);

            response.Item.password = Buffer.from(kmsResponse.Plaintext).toString("utf-8");

            return createResponse(200, response);
        }
        else {
            const command = new QueryCommand({
                TableName: tableName,
                KeyConditionExpression: "userId = :userId",
                ExpressionAttributeValues: {
                    ":userId": userId
                }
            });
            const response = await docClient.send(command);
            return createResponse(200, response);
        }

    }
    catch (err) {
        console.error("Error fetching data from DynamoDB:", err);
        return createResponse(500, { error: err.message });
    }

}