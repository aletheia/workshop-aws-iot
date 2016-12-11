'use strict';

const https = require('https');
const url = require('url');
const AWS = require('aws-sdk');
const cognitoidentity = new AWS.CognitoIdentity();
const SUCCESS = 'SUCCESS';
const FAILED = 'FAILED';

const UNKNOWN = {
	Error: 'Unknown operation'
};
const requestTypes = [
	'Create',
	'Update',
	'Delete'
];

const handleIdentityPoolOperation = (event, context, callback) => {

    function respond(responseStatus, responseData, physicalResourceId) {
        const responseBody = JSON.stringify({
            Status: responseStatus,
            Reason: `See the details in CloudWatch Log Stream: ${context.logStreamName}`,
            PhysicalResourceId: physicalResourceId || context.logStreamName,
            StackId: event.StackId,
            RequestId: event.RequestId,
            LogicalResourceId: event.LogicalResourceId,
            Data: responseData
        });

        console.log('Response body:\n', responseBody);

        const parsedUrl = url.parse(event.ResponseURL);
        const options = {
            hostname: parsedUrl.hostname,
            port: 443,
            path: parsedUrl.path,
            method: 'PUT',
            headers: {
                'content-type': '',
                'content-length': responseBody.length
            }
        };

        return new Promise((resolve, reject) => {
                const request = https
                    .request(options, resolve);

                request.on('error', error => reject(`send(..) failed executing https.request(..): ${error}`));
                request.write(responseBody);
                request.end();
            })
            .then(() => callback(responseStatus === FAILED ? responseStatus : null, responseData))
            .catch(callback);
    }

    function createIdentityPool(poolId,iamRole) {
        var params = {
            AllowUnauthenticatedIdentities: true,
            IdentityPoolName: poolId
        };
        cognitoidentity.createIdentityPool(params).promise()
		    .then(data => {
		        var setRoleParams ={
		            IdentityPoolId:data.IdentityPoolId,
		            Roles: {
		                authenticated:iamRole,
		                unauthenticated:iamRole
		            }
		        }
		        return cognitoidentity.setIdentityPoolRoles(setRoleParams).promise()
		    })
		    .then(data => respond(SUCCESS, data, data.IdentityPoolId))
		    .catch(error => respond(FAILED, {message: error}));
    }

    function deleteIdentityPool(poolId){
      var params = {
          IdentityPoolId: poolId
      };
      cognitoidentity.deleteIdentityPool(params).promise()
      .then(data => respond(SUCCESS, data, data.IdentityPoolId))
      .catch(error => respond(FAILED, {message: error}));
    }


    console.log(`Performing operation ${event.RequestType} on Cognito Identity Pool ${event.LogicalResourceId}`);

    switch(event.RequestType) {
        case 'Create':
            createIdentityPool(event.ResourceProperties.IdentityPoolName,event.ResourceProperties.IAMRole);
        break;
        case 'Delete':
            deleteIdentityPool(event.PhysicalResourceId);
        break;
        case 'Update':
            createIdentityPool(event.ResourceProperties.IdentityPoolName,event.ResourceProperties.IAMRole);
            deleteIdentityPool(event.PhysicalResourceId);
        break;
        default:
            callback('Something went wrong');
  }
}



exports.handler = handleIdentityPoolOperation;
