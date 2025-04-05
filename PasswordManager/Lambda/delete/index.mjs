import { DynamoDBDocumentClient, DeleteCommand} from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const tableName = process.env.tableName || "PassManager";

const createResponse = (statusCode, body) => {
    const responseBody = JSON.stringify(body);
    return {
        statusCode,
        headers: { "Content-Type": "application/json" },
        body: responseBody,
    };
};

export const deletePass = async (event) => {
    const { pathParameters } = event;
    const passId = pathParameters?.id;
    const userId = event?.requestContext?.authorizer?.jwt?.claims?.sub;

    if (!passId) {
        return createResponse(400, { error: "Missing required attributes for the item: passId." });
    }

    try {
        const command = new DeleteCommand({
            TableName: tableName,
            Key: {
                userId,
                passId
            },
            ReturnValues: "ALL_OLD"
        });
        const response = await docClient.send(command);

        if (response.Attributes) {
            return createResponse(200, { message: "Item deleted successfully" });
        } else {
            return createResponse(404, { error: "Item not found" });
        }

    }
    catch (err) {
        console.error("Error from DynamoDB:", err);
        return createResponse(500, { error: err.message });
    }

}