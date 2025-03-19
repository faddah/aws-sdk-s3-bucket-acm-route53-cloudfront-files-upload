import { 
    ACMClient, 
    RequestCertificateCommand, 
    DescribeCertificateCommand,
    CertificateStatus,
    ListCertificatesCommand,
    CertificateSummary
} from "@aws-sdk/client-acm";

import {
    Route53Client,
    ChangeResourceRecordSetsCommand,
    ListHostedZonesByNameCommand
} from "@aws-sdk/client-route-53";

// Initialize clients - Note: ACM must be in us-east-1 for CloudFront
const acmClient = new ACMClient({ region: 'us-east-1' });
const route53Client = new Route53Client({ region: 'us-east-1' });

// Fix: Update the listCertificates function to use CertificateSummaryList
async function listCertificates(): Promise<CertificateSummary[]> {
    const command = new ListCertificatesCommand({});
    const response = await acmClient.send(command);
    return response.CertificateSummaryList || [];
}

async function requestAndValidateCertificate(domainName: string) {
    try {
        // Step 1: Request the certificate
        console.log('Requesting certificate for:', domainName);
        const certificateArn = await requestCertificate(domainName);
        
        // Step 2: Get validation records
        console.log('Getting validation records...');
        const validationRecords = await getValidationRecords(certificateArn);
        
        // Step 3: Create DNS validation records
        console.log('Creating DNS validation records...');
        await createDNSValidationRecords(validationRecords);
        
        // Step 4: Wait for validation
        console.log('Waiting for certificate validation...');
        await waitForCertificateValidation(certificateArn);
        
        return certificateArn;
    } catch (error) {
        console.error('Error in certificate request and validation:', error);
        throw error;
    }
}

async function requestCertificate(domainName: string): Promise<string> {
    const command = new RequestCertificateCommand({
        DomainName: domainName,
        ValidationMethod: 'DNS',
        SubjectAlternativeNames: [`*.${domainName}`], // Includes wildcard for subdomains
        Tags: [
            {
                Key: 'Name',
                Value: `${domainName}-certificate`
            }
        ]
    });

    const response = await acmClient.send(command);
    
    if (!response.CertificateArn) {
        throw new Error('Failed to get Certificate ARN');
    }

    return response.CertificateArn;
}

async function getValidationRecords(certificateArn: string) {
    let validationRecords;
    
    // Poll until validation records are available
    for (let i = 0; i < 10; i++) {
        const command = new DescribeCertificateCommand({
            CertificateArn: certificateArn
        });

        const response = await acmClient.send(command);
        
        if (response.Certificate?.DomainValidationOptions?.[0]?.ResourceRecord) {
            validationRecords = response.Certificate.DomainValidationOptions;
            break;
        }

        // Wait 5 seconds before trying again
        await new Promise(resolve => setTimeout(resolve, 5000));
    }

    if (!validationRecords) {
        throw new Error('Failed to get validation records');
    }

    return validationRecords;
}

async function createDNSValidationRecords(validationRecords: any[]) {
    // Get the hosted zone ID
    const hostedZoneCommand = new ListHostedZonesByNameCommand({});
    const hostedZonesResponse = await route53Client.send(hostedZoneCommand);
    
    if (!hostedZonesResponse.HostedZones?.[0]) {
        throw new Error('No hosted zones found');
    }

    const hostedZoneId = hostedZonesResponse.HostedZones[0].Id;

    // Create DNS records for validation
    for (const record of validationRecords) {
        if (!record.ResourceRecord) continue;

        const { Name, Value, Type } = record.ResourceRecord;

        const command = new ChangeResourceRecordSetsCommand({
            HostedZoneId: hostedZoneId,
            ChangeBatch: {
                Changes: [
                    {
                        Action: 'UPSERT',
                        ResourceRecordSet: {
                            Name,
                            Type,
                            TTL: 300,
                            ResourceRecords: [{ Value }]
                        }
                    }
                ]
            }
        });

        await route53Client.send(command);
    }
}

async function waitForCertificateValidation(certificateArn: string) {
    // Wait for up to 30 minutes for validation
    for (let i = 0; i < 60; i++) {
        const command = new DescribeCertificateCommand({
            CertificateArn: certificateArn
        });

        const response = await acmClient.send(command);
        
        const status = response.Certificate?.Status;
        
        if (status === 'ISSUED') {
            console.log('Certificate has been validated and issued');
            return;
        } else if (status === 'FAILED') {
            throw new Error('Certificate validation failed');
        }

        // Wait 30 seconds before checking again
        console.log(`Certificate status: ${status}. Waiting 30 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 30000));
    }

    throw new Error('Certificate validation timed out');
}

// Usage example
async function main() {
    const domainName = 'dandddiceroller.app'; // Replace with your domain

    try {
        console.log('Starting certificate request and validation process...');
        
        // Optional: List existing certificates before requesting new one
        const existingCerts = await listCertificates();
        console.log('Existing certificates:', existingCerts.length);
        
        const certificateArn = await requestAndValidateCertificate(domainName);
        
        console.log('\nCertificate process completed successfully!');
        console.log('Certificate ARN:', certificateArn);
        console.log('\nImportant notes:');
        console.log('1. DNS propagation may take up to 48 hours');
        console.log('2. The certificate is now ready to use with CloudFront');
        
    } catch (error) {
        console.error('Failed to complete certificate process:', error);
    }
}

// Run the process
main();
