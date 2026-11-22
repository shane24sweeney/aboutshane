package com.aboutshane.contactapi;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

import com.amazonaws.serverless.exceptions.ContainerInitializationException;
import com.amazonaws.serverless.proxy.internal.LambdaContainerHandler;
import com.amazonaws.serverless.proxy.model.AwsProxyResponse;
import com.amazonaws.serverless.proxy.model.HttpApiV2ProxyRequest;
import com.amazonaws.serverless.proxy.spring.SpringBootLambdaContainerHandler;
import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestStreamHandler;

/**
 * The Lambda entry point. It streams: the container reads API Gateway's event and writes the
 * response with its own JSON mapping, so binary bodies (GET /api/resume.pdf) go out base64-encoded
 * with {@code isBase64Encoded: true} and API Gateway decodes them. (Returning the response object
 * instead let Lambda's default serializer name that flag {@code base64Encoded}, which API Gateway
 * ignores, so the PDF arrived as base64 text.)
 */
public class StreamLambdaHandler implements RequestStreamHandler {
    private static final SpringBootLambdaContainerHandler<HttpApiV2ProxyRequest, AwsProxyResponse> handler;

    static {
        // API Gateway must base64-encode binary bodies, such as GET /api/resume.pdf.
        LambdaContainerHandler.getContainerConfig().addBinaryContentTypes("application/pdf");
        try {
            handler = SpringBootLambdaContainerHandler.getHttpApiV2ProxyHandler(ContactApiApplication.class);
        } catch (ContainerInitializationException exception) {
            throw new IllegalStateException("Unable to initialize the Spring application", exception);
        }
    }

    @Override
    public void handleRequest(InputStream input, OutputStream output, Context context) throws IOException {
        handler.proxyStream(input, output, context);
    }
}
