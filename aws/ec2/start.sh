#!/bin/bash

MINECRAFT_DIR="/home/ec2-user/minecraft/server/world" # Minecraftサーバーのディレクトリ
S3_BUCKET="s3://minecraft-server-bucket-20240714"   # S3バケット
S3_SAVE_PATH="saves/"             # S3内の保存パス

aws s3 sync ${S3_BUCKET}/${S3_SAVE_PATH} ${MINECRAFT_DIR}

cd /home/ec2-user/minecraft

bash /home/ec2-user/minecraft/start.sh
