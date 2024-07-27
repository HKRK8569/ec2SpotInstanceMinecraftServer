import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeInstanceStatusCommand,
  RunInstancesCommand,
} from "@aws-sdk/client-ec2";

export const handler = async (event) => {
  const ec2Client = new EC2Client();
  const amiId = "<amiId>";
  const instanceParams = {
    MaxCount: 1,
    MinCount: 1,
    ImageId: amiId,
    InstanceType: "t3.large",
    KeyName: "<keyPareName>",
    EbsOptimized: true,
    NetworkInterfaces: [
      {
        AssociatePublicIpAddress: true,
        DeviceIndex: 0,
        Groups: ["sg-0dbad6b95b09b4876"],
      },
    ],
    TagSpecifications: [
      {
        ResourceType: "instance",
        Tags: [
          {
            Key: "Name",
            Value: "dire_wolf",
          },
        ],
      },
    ],
    IamInstanceProfile: {
      Arn: "<iamRole>",
    },
    InstanceMarketOptions: {
      MarketType: "spot",
    },
    PrivateDnsNameOptions: {
      HostnameType: "ip-name",
      EnableResourceNameDnsARecord: true,
      EnableResourceNameDnsAAAARecord: false,
    },
  };

  try {
    // ec2が既に起動しているかどうかの確認
    const amiDescribeInstancesData = await ec2Client.send(
      new DescribeInstancesCommand({
        Filters: [
          {
            Name: "image-id",
            Values: [amiId],
          },
        ],
      })
    );

    const instances = amiDescribeInstancesData.Reservations.reduce(
      (instanceList, reservation) => {
        instanceList.push(...reservation.Instances);
        return instanceList;
      },
      []
    );

    const instancesExist = instances.some((instance) => {
      return instance.State.Name !== "terminated";
    });

    if (instancesExist) {
      return {
        statusCode: 409,
        body: {
          message: "ec2はすでに起動しています。",
        },
      };
    }

    // ec2の起動
    const runInstancesData = await ec2Client.send(
      new RunInstancesCommand(instanceParams)
    );
    const instanceId = runInstancesData.Instances[0].InstanceId;

    const describeInstancesParams = {
      InstanceIds: [instanceId],
    };

    let instanceStatus = null;
    while (instanceStatus !== "running") {
      const describeInstanceStatusParams = { InstanceIds: [instanceId] };
      const describeInstanceStatusData = await ec2Client.send(
        new DescribeInstanceStatusCommand(describeInstanceStatusParams)
      );

      if (describeInstanceStatusData.InstanceStatuses.length > 0) {
        instanceStatus =
          describeInstanceStatusData.InstanceStatuses[0].InstanceState.Name;
      }

      if (instanceStatus !== "running") {
        await new Promise((resolve) => setTimeout(resolve, 10000)); // 10秒待機
      }
    }

    const describeInstancesData = await ec2Client.send(
      new DescribeInstancesCommand(describeInstancesParams)
    );

    console.log("EC2の起動に成功しました。");
    return {
      statusCode: 200,
      publicIpAddress:
        describeInstancesData.Reservations[0].Instances[0].PublicIpAddress,
    };
  } catch (e) {
    console.error("EC2の起動に失敗しました。");
    console.error(e);
    return {
      statusCode: 500,
      body: {
        message: "EC2の起動に失敗しました。",
      },
    };
  }
};
