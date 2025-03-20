var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { S3Client, CreateBucketCommand, PutBucketWebsiteCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import * as fs from 'fs';
import * as path from 'path';
const REGION = "us-west-2"; // Replace with your desired region
const BUCKET_NAME = "dandddice-roller-app-website"; // Replace with your desired bucket name
const LOCAL_FOLDER = "./website"; // Replace with the path to your local website files
const s3Client = new S3Client({ region: REGION });
function createBucket() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield s3Client.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
            console.log(`Bucket ${BUCKET_NAME} created successfully.`);
        }
        catch (err) {
            console.error("Error creating bucket:", err);
        }
    });
}
function configureBucketWebsite() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield s3Client.send(new PutBucketWebsiteCommand({
                Bucket: BUCKET_NAME,
                WebsiteConfiguration: {
                    IndexDocument: { Suffix: "index.html" },
                    ErrorDocument: { Key: "error.html" }
                }
            }));
            console.log(`S3 Bucket "${BUCKET_NAME}" is now created & configured for static website hosting.`);
        }
        catch (err) {
            console.error(`Error configuring S3 Bucket "${BUCKET_NAME}" for website hosting: ${err}`);
        }
    });
}
function uploadFile(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
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
            yield upload.done();
            console.log(`File ${filePath} uploaded successfully.`);
        }
        catch (err) {
            console.error(`Error uploading file ${filePath}:`, err);
        }
    });
}
function getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
        case '.html': return 'text/html';
        case '.css': return 'text/css';
        case '.js': return 'application/javascript';
        case '.jpg':
        case '.jpeg': return 'image/jpeg';
        case '.png': return 'image/png';
        case '.gif': return 'image/gif';
        case '.svg': return 'image/svg+xml';
        case '.ico': return 'image/x-icon';
        default: return 'application/octet-stream';
    }
}
function uploadWebsiteFiles() {
    return __awaiter(this, void 0, void 0, function* () {
        const files = fs.readdirSync(LOCAL_FOLDER);
        for (const file of files) {
            yield uploadFile(path.join(LOCAL_FOLDER, file));
        }
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        yield createBucket();
        yield configureBucketWebsite();
        yield uploadWebsiteFiles();
        console.log(`Dice Roller Website uploaded successfully to S3 Bucket, "${BUCKET_NAME}". You can access it at: http://${BUCKET_NAME}.s3-website-${REGION}.amazonaws.com`);
    });
}
main();
