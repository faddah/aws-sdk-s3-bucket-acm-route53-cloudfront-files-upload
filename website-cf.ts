import { 
    CloudFrontClient, 
    CreateDistributionCommand,
    CreateOriginAccessControlCommand,
    OriginAccessControlConfig,
    UpdateDistributionCommand
} from "@aws-sdk/client-cloudfront";

import {
    Route53Client,
    ChangeResourceRecordSetsCommand
} from "@aws-sdk/client-route-53";

const cloudFrontClient = new CloudFrontClient({ region: 'us-west-2' });
const route53Client = new Route53Client({ region: 'us-west-2' });

async function setupCloudFrontDistribution(
    domainName: string,
    bucketName: string,
    certificateArn: string
) {
    try {
        // Step 1: Create Origin Access Control
        console.log('Creating Origin Access Control...');
        const oacId = await createOriginAccessControl(bucketName);

        // Step 2: Create CloudFront Distribution
        console.log('Creating CloudFront distribution...');
        const distribution = await createDistribution(
            domainName,
            bucketName,
            certificateArn,
            oacId
        );

        // Step 3: Update Route 53 record
        console.log('Updating Route 53 record...');
        await updateRoute53Record(
            domainName,
            distribution.DomainName || '',
            'Z08852783A6SW1XVIIGQU' // Your hosted zone ID
        );

        return distribution;
    } catch (error) {
        console.error('Error setting up CloudFront:', error);
        throw error;
    }
}

async function createOriginAccessControl(bucketName: string): Promise<string> {
    const oacConfig: OriginAccessControlConfig = {
        Name: `${bucketName}-OAC`,
        OriginAccessControlOriginType: 's3',
        SigningBehavior: 'always',
        SigningProtocol: 'sigv4'
    };

    const command = new CreateOriginAccessControlCommand({
        OriginAccessControlConfig: oacConfig
    });

    const response = await cloudFrontClient.send(command);
    
    if (!response.OriginAccessControl?.Id) {
        throw new Error('Failed to create Origin Access Control');
    }

    return response.OriginAccessControl.Id;
}

async function createDistribution(
    domainName: string,
    bucketName: string,
    certificateArn: string,
    oacId: string
) {
    const command = new CreateDistributionCommand({
        DistributionConfig: {
            CallerReference: String(Date.now()),
            Aliases: {
                Quantity: 1,
                Items: [domainName]
            },
            DefaultRootObject: 'index.html',
            Origins: {
                Quantity: 1,
                Items: [
                    {
                        Id: 'S3Origin',
                        DomainName: `${bucketName}.s3.amazonaws.com`,
                        OriginAccessControlId: oacId,
                        S3OriginConfig: {
                            OriginAccessIdentity: ''
                        }
                    }
                ]
            },
            DefaultCacheBehavior: {
                TargetOriginId: 'S3Origin',
                ViewerProtocolPolicy: 'redirect-to-https',
                AllowedMethods: {
                    Quantity: 2,
                    Items: ['GET', 'HEAD'],
                    CachedMethods: {
                        Quantity: 2,
                        Items: ['GET', 'HEAD']
                    }
                },
                ForwardedValues: {
                    QueryString: false,
                    Cookies: {
                        Forward: 'none'
                    }
                },
                MinTTL: 0,
                DefaultTTL: 86400,
                MaxTTL: 31536000,
                Compress: true
            },
            Enabled: true,
            Comment: `Distribution for ${domainName}`,
            ViewerCertificate: {
                ACMCertificateArn: certificateArn,
                SSLSupportMethod: 'sni-only',
                MinimumProtocolVersion: 'TLSv1.2_2021'
            },
            HttpVersion: 'http2',
            PriceClass: 'PriceClass_100'
        }
    });

    const response = await cloudFrontClient.send(command);
    
    if (!response.Distribution) {
        throw new Error('Failed to create CloudFront distribution');
    }

    return response.Distribution;
}

async function updateRoute53Record(
    domainName: string,
    distributionDomain: string,
    hostedZoneId: string
) {
    const command = new ChangeResourceRecordSetsCommand({
        HostedZoneId: hostedZoneId,
        ChangeBatch: {
            Changes: [
                {
                    Action: 'UPSERT',
                    ResourceRecordSet: {
                        Name: domainName,
                        Type: 'A',
                        AliasTarget: {
                            DNSName: distributionDomain,
                            HostedZoneId: 'Z2FDTNDATAQYW2', // CloudFront's hosted zone ID
                            EvaluateTargetHealth: false
                        }
                    }
                }
            ]
        }
    });

    await route53Client.send(command);
}

// Main execution function
async function main() {
    const domainName = 'dandddiceroller.app';
    const bucketName = 'dandddice-roller-app-website';
    const certificateArn = 'arn:aws:acm:us-east-1:415740581749:certificate/e74a8ffd-4993-4ed3-98a1-34bbd7206a16';

    try {
        console.log('Starting CloudFront setup...');
        
        const distribution = await setupCloudFrontDistribution(
            domainName,
            bucketName,
            certificateArn
        );
        
        console.log('\nCloudFront setup completed successfully!');
        console.log('Distribution Domain Name:', distribution.DomainName);
        console.log('Distribution ID:', distribution.Id);
        
        console.log('\nImportant notes:');
        console.log('1. CloudFront distribution deployment can take up to 30 minutes');
        console.log('2. Your website will be available at:', `https://${domainName}`);
        console.log('3. The distribution is configured to redirect HTTP to HTTPS');
        
    } catch (error) {
        console.error('Failed to complete CloudFront setup:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
        }
    }
}

// Run the process
main();
