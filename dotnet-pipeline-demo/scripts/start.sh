#!/bin/bash
cd /home/ec2-user/productservice
nohup dotnet ProductService.dll > productservice.log 2>&1 &
echo "Application started."