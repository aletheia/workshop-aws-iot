'use strict';
var response = require('cfn-response');
const AWS = require('aws-sdk');
const cognitoidentity = new AWS.CognitoIdentity();
const requestTypes = ['Create', 'Update', 'Delete'];
exports.handler = (event, context, callback) => {

    function createIdentityPool(poolId, iamRole) {
        var params = {
            AllowUnauthenticatedIdentities: true,
            IdentityPoolName: poolId
        };
        return cognitoidentity.createIdentityPool(params).promise()
            .then(data => {
                var setRoleParams = {
                    IdentityPoolId: data.IdentityPoolId,
                    Roles: {
                        authenticated: iamRole,
                        unauthenticated: iamRole
                    }
                }
                return cognitoidentity.setIdentityPoolRoles(setRoleParams).promise()
            })
    }

    function deleteIdentityPool(poolId) {
        var params = {
            IdentityPoolId: poolId
        };
        return cognitoidentity.deleteIdentityPool(params).promise()
    }
    console.log(`Performing operation ${event.RequestType} on Cognito Identity Pool ${event.LogicalResourceId}`);
    var handlePromise;
    switch (event.RequestType) {
        case 'Create':
            handlePromise = createIdentityPool(event.ResourceProperties.IdentityPoolName, event.ResourceProperties.IAMRole);
            break;
        case 'Delete':
            handlePromise = deleteIdentityPool(event.PhysicalResourceId,event.ResourceProperties.region);
            break;
        case 'Update':
            handlePromise = createIdentityPool(event.ResourceProperties.IdentityPoolName, event.ResourceProperties.IAMRole).then(() => deleteIdentityPool(event.PhysicalResourceId,event.ResourceProperties.region));
            break;
        default:
            handlePromise = Promise.reject(`Unkonwn method ${event.RequestType}`);
    }
    handlePromise
        .then(data => {
            response.send(event, context, response.SUCCESS, {
                IdentityPoolId: data.IdentityPoolId
            });
        })
        .catch(error => {
            response.send(event, context, response.FAILED, {
                message: error
            });
        });
}
