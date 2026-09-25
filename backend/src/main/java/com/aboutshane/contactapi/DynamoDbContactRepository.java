package com.aboutshane.contactapi;

import java.time.Duration;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;

@Repository
public class DynamoDbContactRepository implements ContactRepository {
    /** Messages expire through DynamoDB TTL after this long. */
    static final Duration RETENTION = Duration.ofDays(365);

    private final DynamoDbClient dynamoDb;
    private final String tableName;

    public DynamoDbContactRepository(DynamoDbClient dynamoDb, @Value("${app.contact.table-name}") String tableName) {
        this.dynamoDb = dynamoDb;
        this.tableName = tableName;
    }

    @Override
    public void save(ContactMessage message) {
        dynamoDb.putItem(PutItemRequest.builder()
                .tableName(tableName)
                .item(Map.of(
                        "id", AttributeValue.fromS(message.id()),
                        "receivedAt", AttributeValue.fromS(message.receivedAt().toString()),
                        "name", AttributeValue.fromS(message.name()),
                        "email", AttributeValue.fromS(message.email()),
                        "message", AttributeValue.fromS(message.message()),
                        "expiresAt", AttributeValue.fromN(
                                Long.toString(message.receivedAt().plus(RETENTION).getEpochSecond()))))
                .conditionExpression("attribute_not_exists(id)")
                .build());
    }
}
