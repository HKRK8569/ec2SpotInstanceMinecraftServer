import { Client, GatewayIntentBits } from "discord.js";
import { InvokeCommand, LambdaClient, LogType } from "@aws-sdk/client-lambda";
import "dotenv/config";

const token = process.env.DISCORD_BOT_TOKEN;
const lambdaClient = new LambdaClient({});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("messageCreate", async (message) => {
  if (message.content === "!start-dire-wolf") {
    message.channel.send("サーバーを起動中・・・");
    const params = {
      FunctionName: "minecraft_server_start",
      LogType: LogType.Tail,
    };
    const command = new InvokeCommand(params);
    try {
      const { Payload } = await lambdaClient.send(command);
      const result = Buffer.from(Payload).toString();

      const { statusCode, publicIpAddress } = JSON.parse(result);

      if (statusCode === 200) {
        message.channel.send(`サーバーを起動しました。\n${publicIpAddress}`);
        return;
      }
      if (statusCode === 409) {
        message.channel.send("サーバーは既に起動しています。");
        return;
      } else {
        message.channel.send("サーバーの起動に失敗しました。");
        return;
      }
    } catch (e) {
      console.log(e);
      message.channel.send("サーバーの起動に失敗しました。");
      return;
    }
  }
  if (message.content === "!stop-dire-wolf") {
    const params = {
      FunctionName: "minecraft_server_stop",
      LogType: LogType.Tail,
    };
    const command = new InvokeCommand(params);
    try {
      await lambdaClient.send(command);
      message.channel.send("サーバーを停止しました。");
      return;
    } catch {
      message.channel.send("サーバーの停止に失敗しました。");
      return;
    }
  }
});

client.login(token);
