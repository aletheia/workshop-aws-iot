# AWS IoT Simulator

This one-page webapp is meant to simulate a fleet of Things in the context of [AWS IoT](https://aws.amazon.com/iot/).

![Simulator Screenshot](iot-simulation.png?raw=true)

## Context

Each Thing is a Drone, moving freely within a rectangular field and regularly sending data about its position, speed and environmental status.

The initial speed and direction of each Drone is randomized at startup. You can add more Drones by clicking on the top button, and destroy a Drone by double-clicking on it. If you simply click on a Drone, it will go into an "alarm" status (it will turn red and stop for a few seconds).

These browser-based interactions are supposed to represent local interactions and unexpected environmental changes, typically performed by local operators and external actors. The IoT system should react accordingly and design appropriate mechanism to adapt the overall behavior.

## Prerequisites

The simulation is based on the AWS IoT runtime environment. You will need to setup at least two AWS services:

* [Amazon Cognito](https://aws.amazon.com/cognito/): A Cognito Identity Pool is required for the JS SDK to authenticate and invoke AWS IoT APIs.
* [AWS IAM](https://aws.amazon.com/iam/): a valid IAM Role must be connected to the Cognito Identity Pool un-authenticated role.
* [AWS IoT](https://aws.amazon.com/iot/): an IoT project must be configured, although no actual Thing or Certificate needs to be defined for the simulation to work properly.

Specifically, you will need to configure the JS Client with the *Cognito Identity Pool ID* and the *IoT Custom Endpoint*.

You can find such parameters in the simulation/js/main.js file:

    var AWS_IOT_ENDPOINT = 'YOUR_IOT_CUSTOM_ENDPOINT';
    AWS.config.region = 'eu-west-1';
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: 'YOUR_COGNITO_IDENTITY_POOL_ID',
    });

Here is the basic IAM Role you may want to start from:

    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "iot:Connect",
                    "iot:Publish",
                    "iot:Subscribe",
                    "iot:Receive",
                    "iot:GetThingShadow",
                    "iot:UpdateThingShadow"
                ],
                "Resource": "*"
           }
        ]
    }

## How to run the simulation

You can launch a local Python webserver as follows:

    $ cd simulation
    $ ./run-simulation.sh

You can view the web simulator by visiting *http://localhost:8080/* in your browser.

## MQTT Topics Overview

The bidirectional communication between the fleet of Drones and AWS IoT is implemented via [Web Sockets and MQTT](http://docs.aws.amazon.com/iot/latest/developerguide/protocols.html).

Instead of using real IoT Things, the web simulator subscribes and publishes messages into custom MQTT Topics:

* *myapp/simulation/drones/{ID}*: each Drone will publish a new MQTT message every second, containing information about its position, speed, power, etc.
* *myapp/simulation/commands*: the IoT system can publish new messages into this topic to send commands back to the fleet of Drones. Commands can be sent to individual Drones (by ID) or to the whole fleet (ID="all").

Here are the supported commands:

* *Alarm command*: the receiving Drone goes into the "alarm" status.
* *Destroy command*: the receiving Drone quits the simulation.
* *Power command*: the receiving Drone updates its power to a given value.

Example of Alarm command:

    {
        "action": "alarm",
        "ID": "77efe8fa-f79b-a50d-c58f-90d16888ed6d"
    }

Example of Destroy command:

    {
        "action": "destroy",
        "ID": "77efe8fa-f79b-a50d-c58f-90d16888ed6d"
    }

Example of Power command:

    {
        "action": "power",
        "value": 5,
        "ID": "77efe8fa-f79b-a50d-c58f-90d16888ed6d"
    }

Example of a broadcast command (received by every Drone):

    {
        "action": "XXX",
        "ID": "all"
    }


## How to implement advanced Swarm mechanics

The goal of this simulator is to give a stable and visual sandbox to implement complex bidirectional mechanisms.

You can implement such logics with AWS IoT by using a combination of the following services:

* [AWS IoT Rules Engine](https://aws.amazon.com/iot/how-it-works/#rulesengine): You can define custom Rules by querying the incoming stream of MQTT messages with SQL-syntax in order to integrate other AWS services (DynamoDB, Lambda, SNS, SQS, Kinesis, S3, CloudWatch, Elasticsearch, etc.), or simply to publish new MQTT messages to other MQTT Topics.
* [Amazon Kinesis Firehose](https://aws.amazon.com/kinesis/firehose/): You can connect IoT to Kinesis Firehose to stream incoming messages to other services, such as Amazon S3, Redshift, Elasticsearch or Kinesis Analytics.
* [Amazon Kinesis Analytics](https://aws.amazon.com/kinesis/analytics/): You can implement custom aggregations and data manipulations with Kinesis Analytics, and then connect its output to a new Stream for further processing. Basically, you can run SQL-like queries on the input Stream and generate new data into a target Stream, eventually working on sliding or tumbling windows.
* [Amazon Kinesis Streams](https://aws.amazon.com/kinesis/streams/): You can use Kinesis Streams as intermediate buffers for your data, either raw or processed.
* [AWS Lambda](https://aws.amazon.com/lambda/): You can implement any custom integration with AWS Lambda, without managing any server or worrying about scaling your processing logic. You may want to connect Lambda directly with AWS IoT, or eventually pre-process and aggregate the raw data with Kinesis Analytics and then connect Lambda to the target Kinesis Stream.

