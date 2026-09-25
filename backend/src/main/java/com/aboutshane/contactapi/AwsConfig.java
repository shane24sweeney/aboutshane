package com.aboutshane.contactapi;

import java.time.Clock;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.sesv2.SesV2Client;

@Configuration
public class AwsConfig {
    // Region and credentials come from the Lambda environment (AWS_REGION and the execution role).

    @Bean
    public DynamoDbClient dynamoDbClient() {
        return DynamoDbClient.builder().httpClientBuilder(UrlConnectionHttpClient.builder()).build();
    }

    @Bean
    public SesV2Client sesV2Client() {
        return SesV2Client.builder().httpClientBuilder(UrlConnectionHttpClient.builder()).build();
    }

    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }
}
