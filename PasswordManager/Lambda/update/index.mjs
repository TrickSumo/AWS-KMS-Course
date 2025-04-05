import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { KMSClient, EncryptCommand} from "@aws-sdk/client-kms";

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

export const updatePass = async (event) => {
    const { pathParameters } = event;
    const passId = pathParameters?.id;
    const userId = event?.requestContext?.authorizer?.jwt?.claims?.sub;

    const { body } = event;
    const { password } = JSON.parse(body || "{}");

    if (!passId || !password) {
        return createResponse(409, { error: "Missing required attributes for the item: passId or password." });
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


        let updateExpression = "SET password = :password";
        let expressionAttributeValues = {
            ":password": encryptedPassword
        };
        
        
        const command = new UpdateCommand({
            TableName: tableName,
            Key: {
                userId,
                passId
            },
            UpdateExpression: updateExpression,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: "ALL_NEW", // returns updated value as response
            ConditionExpression: "attribute_exists(passId)", // ensures the item exists before updating
        });

        const response = await docClient.send(command);
        console.log(response);
        return response;
    }
    catch (err) {
        console.error("Error:", err);
        return createResponse(500, { error: err.message });
    }

}