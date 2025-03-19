import { 
    Route53Client, 
    CreateHostedZoneCommand,
    ChangeResourceRecordSetsCommand,
    GetHostedZoneCommand,
    ListHostedZonesByNameCommand,
    HostedZone
} from "@aws-sdk/client-route-53";

const route53Client = new Route53Client({ region: 'us-west-2' });

async function setupRoute53ForDomain(domainName: string, s3WebsiteUrl: string) {
    try {
        // Step 1: Create a hosted zone
        console.log('Creating hosted zone for:', domainName);
        const hostedZoneId = await createHostedZone(domainName);
        
        // Step 2: Get the nameservers for the hosted zone
        console.log('Getting nameservers...');
        const nameservers = await getHostedZoneNameservers(hostedZoneId);
        
        // Step 3: Create A record for S3 website
        console.log('Creating A record for S3 website...');
        await createAliasRecord(domainName, s3WebsiteUrl, hostedZoneId);
        
        return {
            hostedZoneId,
            nameservers
        };
    } catch (error) {
        console.error('Error setting up Route 53:', error);
        throw error;
    }
}

async function createHostedZone(domainName: string): Promise<string> {
    // First check if hosted zone already exists
    const listCommand = new ListHostedZonesByNameCommand({
        DNSName: domainName
    });
    
    const existingZones = await route53Client.send(listCommand);
    
    if (existingZones.HostedZones && existingZones.HostedZones.length > 0) {
        const existingZone = existingZones.HostedZones.find(
            zone => zone.Name === `${domainName}.` || zone.Name === domainName
        );
        
        if (existingZone?.Id) {
            console.log('Hosted zone already exists');
            // Remove the /hostedzone/ prefix if it exists
            return existingZone.Id.replace('/hostedzone/', '');
        }
    }

    // Create new hosted zone if none exists
    const command = new CreateHostedZoneCommand({
        Name: domainName,
        CallerReference: String(Date.now()),
        HostedZoneConfig: {
            Comment: `Hosted zone for ${domainName}`
        }
    });

    const response = await route53Client.send(command);
    
    if (!response.HostedZone?.Id) {
        throw new Error('Failed to create hosted zone');
    }

    // Remove the /hostedzone/ prefix from the ID
    return response.HostedZone.Id.replace('/hostedzone/', '');
}

async function getHostedZoneNameservers(hostedZoneId: string): Promise<string[]> {
    const command = new GetHostedZoneCommand({
        Id: hostedZoneId
    });

    const response = await route53Client.send(command);
    
    if (!response.DelegationSet?.NameServers) {
        throw new Error('No nameservers found for hosted zone');
    }

    return response.DelegationSet.NameServers;
}

async function createAliasRecord(
    domainName: string, 
    s3WebsiteUrl: string, 
    hostedZoneId: string
) {
    // Extract the region and bucket name from S3 website URL
    const s3DomainName = s3WebsiteUrl.replace('http://', '');

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
                            DNSName: s3DomainName,
                            // S3 website hosted zone ID for us-west-2
                            HostedZoneId: 'Z3BJ6K6RIION7M',
                            EvaluateTargetHealth: false
                        }
                    }
                }
            ]
        }
    });

    try {
        await route53Client.send(command);
        console.log('Successfully created/updated A record');
    } catch (error) {
        console.error('Error creating A record:', error);
        throw error;
    }
}

// Main execution function
async function main() {
    const domainName = 'dandddiceroller.app';
    const s3WebsiteUrl = 'http://dandddice-roller-app-website.s3-website-us-west-2.amazonaws.com';

    try {
        console.log('Starting Route 53 setup...');
        
        const { hostedZoneId, nameservers } = await setupRoute53ForDomain(
            domainName,
            s3WebsiteUrl
        );
        
        console.log('\nRoute 53 setup completed successfully!');
        console.log('Hosted Zone ID:', hostedZoneId);
        console.log('\nIMPORTANT: Update your domain registrar with these nameservers:');
        nameservers.forEach((ns, index) => {
            console.log(`${index + 1}. ${ns}`);
        });
        
        console.log('\nNext steps:');
        console.log('1. Copy these nameservers to your domain registrar');
        console.log('2. Wait for DNS propagation (can take up to 48 hours)');
        console.log('3. Test your domain by visiting:', `http://${domainName}`);
        
    } catch (error) {
        console.error('Failed to complete Route 53 setup:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
        }
    }
}

// Run the process
main();
