import {
  EC2Client,
  DescribeInstancesCommand,
  TerminateInstancesCommand,
} from "@aws-sdk/client-ec2";

export const handler = async (event) => {
  const ec2Client = new EC2Client();
  const amiId = "<amiId>";
  const describeParams = {
    Filters: [
      {
        Name: "image-id",
        Values: [amiId],
      },
    ],
  };

  try {
    const describeCommand = new DescribeInstancesCommand(describeParams);
    const describeResponse = await ec2Client.send(describeCommand);

    const instanceIds = describeResponse.Reservations.reduce(
      (instanceIds, reservation) => {
        reservation.Instances.forEach((instance) => {
          instanceIds.push(instance.InstanceId);
        });
        return instanceIds;
      },
      []
    );

    if (instanceIds.length > 0) {
      const terminateParams = {
        InstanceIds: instanceIds,
      };

      const terminateCommand = new TerminateInstancesCommand(terminateParams);
      await ec2Client.send(terminateCommand);
      return {
        statusCode: 200,
      };
    } else {
      return {
        statusCode: 404,
        body: {
          message: "EC2が見つかりませんでした。",
        },
      };
    }
  } catch (e) {
    console.error("EC2の停止に失敗しました。");
    console.error(e);
    return {
      statusCode: 500,
      body: {
        message: "EC2の停止に失敗しました。",
      },
    };
  }
};
