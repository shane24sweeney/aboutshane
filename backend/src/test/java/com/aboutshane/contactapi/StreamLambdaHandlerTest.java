package com.aboutshane.contactapi;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

import com.amazonaws.services.lambda.runtime.Context;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

/**
 * The real Lambda entry point, given the event API Gateway (HTTP API, payload 2.0) sends. Checks
 * the JSON it writes back is what API Gateway expects, including base64 for binary bodies.
 */
class StreamLambdaHandlerTest {
    private static final ObjectMapper JSON = new ObjectMapper();

    @BeforeAll
    static void configure() {
        // What the SAM template sets in AWS; nothing is sent or stored by these requests.
        System.setProperty("app.contact.recipient", "owner@test.example");
        System.setProperty("aws.region", "us-east-1");
    }

    private static JsonNode invoke(String path) throws Exception {
        String event = """
                {"version":"2.0","routeKey":"$default","rawPath":"%s","rawQueryString":"",
                 "headers":{"accept":"*/*","host":"api.test.example"},
                 "requestContext":{"accountId":"1","apiId":"api","domainName":"api.test.example","domainPrefix":"api",
                   "http":{"method":"GET","path":"%s","protocol":"HTTP/1.1","sourceIp":"203.0.113.1","userAgent":"test"},
                   "requestId":"req-1","routeKey":"$default","stage":"$default","time":"22/Nov/2026:01:00:00 +0000","timeEpoch":1795309200000},
                 "isBase64Encoded":false}
                """.formatted(path, path);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        new StreamLambdaHandler().handleRequest(new ByteArrayInputStream(event.getBytes(StandardCharsets.UTF_8)), out, mock(Context.class));
        return JSON.readTree(out.toByteArray());
    }

    @Test
    void sendsThePdfBase64EncodedAndFlaggedSoApiGatewayDecodesIt() throws Exception {
        JsonNode response = invoke("/api/resume.pdf");
        assertThat(response.path("statusCode").asInt()).isEqualTo(200);
        // The exact field name API Gateway reads; "base64Encoded" would be ignored.
        assertThat(response.has("isBase64Encoded")).isTrue();
        assertThat(response.path("isBase64Encoded").asBoolean()).isTrue();
        byte[] pdf = Base64.getDecoder().decode(response.path("body").asText());
        assertThat(new String(pdf, 0, 5, StandardCharsets.US_ASCII)).isEqualTo("%PDF-");
    }

    @Test
    void sendsJsonAsPlainText() throws Exception {
        JsonNode response = invoke("/api/health");
        assertThat(response.path("statusCode").asInt()).isEqualTo(200);
        assertThat(response.path("isBase64Encoded").asBoolean()).isFalse();
        assertThat(JSON.readTree(response.path("body").asText()).path("status").asText()).isEqualTo("ok");
    }
}
