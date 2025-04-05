import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { KMSClient, EncryptCommand} from "@aws-sdk/client-kms";

const config = {
    "region": "ap-south-1",
}

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const kmsClient = new KMSClient(config);

const tableName = process.env.tableName || "AuthServer";
const symmetricKeyId = process.env.keyId || "alias/PassManagerKey";

const createResponse = (statusCode, body) => {
    const responseBody = JSON.stringify(body);
    return {
        statusCode,
        headers: { "Content-Type": "application/json" },
        body: responseBody,
    };
};

export const signup = async (event) => {
    const { body } = event;
    const { username, password } = JSON.parse(body || "{}");

    if ( !username || !password) {
        return createResponse(409, { error: "Missing required attributes for the item: username, or password." });
    }

    const userId = username;

    try {

        const kmsCommand = new EncryptCommand({
            KeyId: symmetricKeyId,
            Plaintext: password,
            EncryptionContext: {
                "userId": userId,
                "purpose": "password-encryption",
            },
        });
        const kmsResponse = await kmsClient.send(kmsCommand);
        const encryptedPassword = Buffer.from(kmsResponse.CiphertextBlob).toString("base64");


        const dynamoCommand = new PutCommand({
            TableName: tableName,
            Item: {
            userId,
            password: encryptedPassword,
            },
            ConditionExpression: "attribute_not_exists(userId)",
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