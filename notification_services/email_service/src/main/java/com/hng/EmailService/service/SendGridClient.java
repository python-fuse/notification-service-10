package com.hng.EmailService.service;

import com.sendgrid.*;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class SendGridClient {

    private static final Logger log = LoggerFactory.getLogger(SendGridClient.class);
    private final SendGrid sendGrid;
    private final String fromEmail;

    public SendGridClient(@Value("${sendgrid.api-key}") String apiKey,
                          @Value("${sendgrid.from-email}") String fromEmail) {
        this.sendGrid = new SendGrid(apiKey);
        this.fromEmail = fromEmail;
        log.info("SendGrid client initialized with from email: {}", fromEmail);
    }

    @CircuitBreaker(name = "sendGridCircuit", fallbackMethod = "sendFallback")
    public boolean sendEmail(String toEmail, String subject, String bodyHtml) throws Exception {
        log.info("Attempting to send email to: {} with subject: {}", toEmail, subject);
        
        Email from = new Email(fromEmail);
        Email to = new Email(toEmail);
        Content content = new Content("text/html", bodyHtml);
        Mail mail = new Mail(from, subject, to, content);

        Request request = new Request();
        request.setMethod(Method.POST);
        request.setEndpoint("mail/send");
        request.setBody(mail.build());

        Response response = sendGrid.api(request);
        int status = response.getStatusCode();
        
        log.info("SendGrid response - Status: {}, Body: {}", status, response.getBody());
        
        if (status >= 200 && status < 300) {
            log.info("Email sent successfully to: {}", toEmail);
            return true;
        } else {
            log.error("SendGrid API returned error status: {} for email to: {}. Response body: {}", 
                     status, toEmail, response.getBody());
            return false;
        }
    }

    public boolean sendFallback(String toEmail, String subject, String bodyHtml, Throwable t) {
        log.error("Circuit breaker activated or error occurred for email to: {}. Error: {}", 
                 toEmail, t.getMessage(), t);
        // Circuit breaker open or fatal; return false to trigger retry/dead-letter logic upstream
        return false;
    }
}
