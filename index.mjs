import * as fs from "node:fs";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  PutCommand,
  DynamoDBDocumentClient,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const html = fs.readFileSync("index.html", { encoding: "utf8" });

/**
 * Returns an HTML page containing an interactive Web-based tutorial.
 * Visit the function URL to see it and learn how to build with lambda.
 */
export const handler = async (event) => {
  let modifiedHTML = dynamicForm(html, event.queryStringParameters);

  let params = {
    TableName: "formStore",
    KeyConditionExpression: "PK = :PK",
    ExpressionAttributeValues: {
      ":PK": "form",
    },
  };
  const commandList = new QueryCommand(params);
  const tableQuery = await docClient.send(commandList);

  modifiedHTML = dynamictable(modifiedHTML, tableQuery);

  if (event.queryStringParameters) {
    const command = new PutCommand({
      TableName: "formStore",
      Item: {
        PK: "form",
        SK: event.requestContext.requestId,
        form: event.queryStringParameters,
      },
    });

    const response = await docClient.send(command);
    console.log(response);
    return response;
  }

  const response = {
    statusCode: 200,
    headers: {
      "Content-Type": "text/html",
    },
    body: modifiedHTML,
  };
  return response;
};

function dynamicForm(html, queryStringParameters) {
  let formres = "";
  if (queryStringParameters) {
    Object.values(queryStringParameters).forEach((val) => {
      formres = formres + val + " ";
    });
  }
  return html.replace(
    "{formResults}",
    "<h4>Form Submission: " + formres + "</h4>"
  );
}

function dynamictable(html, tableQuery) {
  let table = "";
  if (tableQuery.Items.length > 0) {
    for (let i = 0; i < tableQuery.Items.length; i++) {
      table = table + "<li>" + JSON.stringify(tableQuery.Items[i]) + "</li>";
    }
    table = "<pre>" + table + "</pre>";
  }
  return html.replace("{table}", "<h4>DynamoDB:</h4>" + table);
}
