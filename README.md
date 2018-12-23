# S3 cloudfront static deploy 

Simple node API for rapid file deployment (like JSON or other) in an AWS S3 bucket with cloudFront invalidate, versioning and rollback.

## :rocket: Installation 

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

## :gear: API 

### **enableVersioning(bucket(string), isEnabled(bool), event(callback))**

> Enabled or suspended versionning of a bucket.

Return promise with the status of the bucket versionning.

### **publishFile(bucket(string), filename(string), distributionId(string), content(Buffer, Typed Array, Blob, String, ReadableStream), event(callback))**

> Create/update and invalidate file for cloudfront deploying. (tested only with a JSON stringify)

returns a promise containing the return of putFile and invalidateFile.

### **rollbackFile(bucket(string),fileName(string),distributionId(string), event(callback))**

> Mark deleted the lasted version of a file in a bucket and invalidate on cloudfront.

returns a promise containing the return of deleteFile and invalidateFile.

### **listFileVersions(bucket(string),filename(string), event(callback))**

> List all versions of a file in a bucket.

returns a promise containing data.

### **putFile(bucket(string), filename(string), content(Buffer, Typed Array, Blob, String, ReadableStream), event(callback))**

> Create or update a file in a bucket. (tested only with a JSON stringify)

returns a promise containing data.

### **deleteFile(bucket(string), filename(string), event(callback))**

> Apply deleted mark on a last version of a file in a bucket.

returns a promise containing data.

### **invalidateFile(filename(string), distributionId(string), event(callback))**

> Invalidate file in cloudfront for deploying

returns a promise containing data.

## :eyes: Testing 

You can test the deploying with sending a Json with random data (words)

> Rename config.dist.json to config.json

    {
        "myBucket": "your bucket name",
        "filename": "path and filename on bucket",
        "distributionId": "cloudfront distribution ID"
    }

> npm start
