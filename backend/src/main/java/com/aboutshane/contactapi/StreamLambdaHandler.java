package com.aboutshane.contactapi;

import com.amazonaws.serverless.exceptions.ContainerInitializationException;
import com.amazonaws.serverless.proxy.model.AwsProxyResponse;
import com.amazonaws.serverless.proxy.model.HttpApiV2ProxyRequest;
import com.amazonaws.serverless.proxy.spring.SpringBootLambdaContainerHandler;
import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;

public class StreamLambdaHandler implements RequestHandler<HttpApiV2ProxyRequest, AwsProxyResponse> {
    private static final SpringBootLambdaContainerHandler<HttpApiV2ProxyRequest, AwsProxyResponse> handler;

    static {
        try {
            handler = SpringBootLambdaContainerHandler.getHttpApiV2ProxyHandler(ContactApiApplication.class);
        } catch (ContainerInitializationException exception) {
            throw new IllegalStateException("Unable to initialize the Spring application", exception);
        }
    }

    @Override
    public AwsProxyResponse handleRequest(HttpApiV2ProxyRequest request, Context context) {
        return handler.proxy(request, context);
    }
}