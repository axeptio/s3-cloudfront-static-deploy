# S3 cloudfront static deploy

Api node.js for rapid file deployment in an AWS S3 bucket with cloudFront invalidate, versioning and rollback.

## Installation

> npm install --save s3-cloudfront-static-deploy

Create a file for the credentials

Mac/Linux: 
> ~/.aws/credentials

Windows: 
> C:\Users\USERNAME\.aws\credentials

    [default]
    aws_access_key_id = your_access_key
    aws_secret_access_key = your_secret_key

For the moment you have to create and configure your bucket authorization and cloudfront from AWS

## API

All methods return a promise with datas or errors and they have callback event

### **putFile(bucket(string), filename(string), content(string), event(callback))**
Create or update a file in a bucket
### **invalidateFile(filename(string), distributionId(string), event(callback))**
Invalidate file in cloudfront for deploying
### **publishFile(bucket(string), filename(string), distributionId(string), event(callback))**
Create/update and invalidate file for cloudfront deploy
### **listFileVersions(bucket(string),filename(string), event(callback))**
List all versions of a file in a bucket
### **enableVersioning(bucket(string), isEnable(bool), event(callback))**
Enabled or suspended versionning of a bucket
### **rollbackFile(bucket(string),fileName(string),distributionId(string), event(callback))**
Mark deleted the lasted version of a file in a bucket and invalidate 

## Testing

you can test the deploying with sending a Json with random datas (words)

> Rename config.dist.json to config.dist

    {
    "myBucket": "your bucket name",
    "filename": "path and filename",
    "distributionId": "CloudFront distribution ID"
    }

> npm start