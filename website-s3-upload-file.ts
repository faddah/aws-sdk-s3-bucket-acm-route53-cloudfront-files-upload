import { 
    S3Client,
    CreateBucketCommand,
    PutBucketWebsiteCommand,
    PutObjectCommand,
    HeadObjectCommand
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import * as fs from 'fs';
import * as path from 'path';

const REGION = "us-west-2"; // Replace with your desired region
const BUCKET_NAME = "dandddice-roller-app-website"; // Replace with your desired bucket name
const LOCAL_FOLDER = "./website"; // Replace with the path to your local website files

const s3Client = new S3Client({ region: REGION });

async function createBucket() {
    try {
        await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
        console.log(`Bucket ${BUCKET_NAME} created successfully.`);
    } catch (err) {
        console.error("Error creating bucket:", err);
    }
}

async function configureBucketWebsite() {
    try {
        await s3Client.send(new PutBucketWebsiteCommand({
        Bucket: BUCKET_NAME,
        WebsiteConfiguration: {
            IndexDocument: { Suffix: "index.html" },
            ErrorDocument: { Key: "error.html" }
        }
        }));
        console.log(`S3 Bucket "${BUCKET_NAME}" is now created & configured for static website hosting.`);
    } catch (err) {
        console.error(`Error configuring S3 Bucket "${BUCKET_NAME}" for website hosting: ${err}`);
    }
}

async function uploadFile(filePath: string) {
    const fileStream = fs.createReadStream(filePath);
    const upload = new Upload({
        client: s3Client,
        params: {
        Bucket: BUCKET_NAME,
        Key: path.basename(filePath),
        Body: fileStream,
        ContentType: getContentType(filePath)
        }
    });

    try {
        await upload.done();
        console.log(`File ${filePath} uploaded successfully.`);
    } catch (err) {
        console.error(`Error uploading file ${filePath}:`, err);
    }
}

function getContentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
        case '.html': return 'text/html';
        case '.css': return 'text/css';
        case '.js': return 'application/javascript';
        case '.ts': return 'text/javascript';
        case '.jpg': case '.jpeg': return 'image/jpeg';
        case '.png': return 'image/png';
        case '.gif': return 'image/gif';
        case '.svg': return 'image/svg+xml';
        case '.ico': return 'image/x-icon';
        case '.json': return 'application/json';
        default: return 'application/octet-stream';
    }
}

async function updateFile(filePath: string, contentType: string) {
    const fileStream = fs.createReadStream(filePath);
    const upload = new Upload({
        client: s3Client,
        params: {
            Bucket: BUCKET_NAME,
            Key: path.basename(filePath),
            Body: fileStream,
            ContentType: contentType,
            // Optional: Set cache control to prevent caching issues
            CacheControl: 'no-cache'
        }
    });

    try {
        await upload.done();
        console.log(`The file ${filePath} was uploaded & updated successfully to S3 bucket, ${BUCKET_NAME}.`);
    } catch (err) {
        console.error(`Error updating the file ${filePath} to the S3 bucket, ${BUCKET_NAME}:`, err);
    }
}

async function verifyFileUpload(fileName: string) {
    try {
        const command = new HeadObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileName
        });
        await s3Client.send(command);
        
        console.log(`The file, ${fileName}, verification successful in S3 bucket, ${BUCKET_NAME}`);
    } catch (err) {
        console.error('The file verification in the S3 bucket, ${BUCKET_NAME}, failed:', err);
    }
}

async function uploadWebsiteFiles() {
    const files = fs.readdirSync(LOCAL_FOLDER);
    for (const file of files) {
        await uploadFile(path.join(LOCAL_FOLDER, file));
    }
}

async function main() {
    const faviconFilePath: string = './website/favicon.ico';
    // const HTMLFilePath: string = './website/index.html';
    // const counterTSFilePath: string = './website/counter.ts';
    // const counterJSFilePath: string = './website/counter.js';
    // const diceRollerTSFilePath: string = './website/diceRoller.ts';
    // const diceRollerJSFilePath: string = './website/diceRoller.js';
    // const diceRollResultIFTSFilePath: string = './website/diceRollResultIF.ts';
    // const diceRollResultIFJSFilePath: string = './website/diceRollResultIF.js';
    // const JSONFilePath: string = './website/package.json';
    const faviconFileType: string = 'image/x-icon';
    // const HTMLContentType: string = 'text/html';
    // const counterTSFileType: string = 'text/javascript';
    // const counterJSFileType: string = 'application/javascript';
    // const diceRollerTSFileType: string = 'text/javascript';
    // const diceRollerJSFileType: string = 'application/javascript';
    // const diceRollResultIFTSFileType: string = 'text/javascript';
    // const diceRollResultIFJSFileType: string = 'application/javascript';
    // const JSONContentType: string = 'application/json';
    const uploadArray: [ string[] ] = [
        [faviconFilePath, faviconFileType]
    ];
    for (let member of uploadArray) {
        await updateFile(member[0], member[1]);
    }
    // await updateFile(HTMLFilePath, 'text/html');
    // await updateFile(AVIFFilePath, 'image/avif');
    // await updateFile(JSONFilePath, 'application/json');
    // await createBucket();
    // await configureBucketWebsite();
    // await uploadWebsiteFiles();
    // console.log(`Dice Roller Website uploaded successfully to S3 Bucket, "${BUCKET_NAME}". You can access it at: http://${BUCKET_NAME}.s3-website-${REGION}.amazonaws.com`);
    // verifyFileUpload('index.html');
    // verifyFileUpload('counter.ts');
    // verifyFileUpload('counter.js');
    verifyFileUpload('favicon.ico');
    // verifyFileUpload('counter.js');
    // verifyFileUpload('diceRoller.ts');
    // verifyFileUpload('diceRoller.js');
    // verifyFileUpload('index.hmml');
    // verifyFileUpload('package.json');
    console.log(`Dice Roller Website uploaded the file, ${faviconFilePath}, successfully to S3 Bucket, "${BUCKET_NAME}". You can access it at: http://${BUCKET_NAME}.s3-website-${REGION}.amazonaws.com`);
    // console.log(`Dice Roller Website uploaded the file, ${counterTSFilePath}, successfully to S3 Bucket, "${BUCKET_NAME}". You can access it at: http://${BUCKET_NAME}.s3-website-${REGION}.amazonaws.com`);
    // console.log(`Dice Roller Website uploaded the file, ${counterJSFilePath}, successfully to S3 Bucket, "${BUCKET_NAME}". You can access it at: http://${BUCKET_NAME}.s3-website-${REGION}.amazonaws.com`);
    // console.log(`Dice Roller Website uploaded the file, ${diceRollerTSFilePath}, successfully to S3 Bucket, "${BUCKET_NAME}". You can access it at: http://${BUCKET_NAME}.s3-website-${REGION}.amazonaws.com`);
    // console.log(`Dice Roller Website uploaded the file, ${diceRollerJSFilePath}, successfully to S3 Bucket, "${BUCKET_NAME}". You can access it at: http://${BUCKET_NAME}.s3-website-${REGION}.amazonaws.com`);
    // console.log(`Dice Roller Website uploaded the file, ${counterJSFilePath}, successfully to S3 Bucket, "${BUCKET_NAME}". You can access it at: http://${BUCKET_NAME}.s3-website-${REGION}.amazonaws.com`);
    // console.log(`Dice Roller Website uploaded the file, ${diceRollerTSFilePath}, successfully to S3 Bucket, "${BUCKET_NAME}". You can access it at: http://${BUCKET_NAME}.s3-website-${REGION}.amazonaws.com`);
    // console.log(`Dice Roller Website uploaded the file, ${diceRollerJSFilePath}, successfully to S3 Bucket, "${BUCKET_NAME}". You can access it at: http://${BUCKET_NAME}.s3-website-${REGION}.amazonaws.com`);
}

main();