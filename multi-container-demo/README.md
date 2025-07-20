# AWS Elastic Beanstalk Multicontainer Demo (Docker + ECS + ECR)

This project demonstrates how to create a **multicontainer Docker** environment on AWS Elastic Beanstalk using images stored in **Amazon ECR**.

## Project Structure

```
multi-container-demo/
├── web/
│   ├── Dockerfile
│   └── index.html
├── worker/
│   ├── Dockerfile
│   └── worker.sh
└── Dockerrun.aws.json
```

## Requirements

- AWS CLI configured
- EB CLI installed
- Docker installed
- ECR and Elastic Beanstalk permissions

## Step by Step

### 1. Create repository in Amazon ECR

```bash
aws ecr create-repository --repository-name app
```

### 2. Login to ECR

```bash
aws ecr get-login-password --region sa-east-1 \
  | docker login --username AWS --password-stdin <account-id>.dkr.ecr.sa-east-1.amazonaws.com
```

### 3. Build and push images

```bash
# Web
docker build -t app:web ./web
docker tag app:web <account-id>.dkr.ecr.sa-east-1.amazonaws.com/app:web
docker push <account-id>.dkr.ecr.sa-east-1.amazonaws.com/app:web

# Worker
docker build -t app:worker ./worker
docker tag app:worker <account-id>.dkr.ecr.sa-east-1.amazonaws.com/app:worker
docker push <account-id>.dkr.ecr.sa-east-1.amazonaws.com/app:worker
```

### 4. Initialize Beanstalk project

```bash
eb init
```

- **Platform**: ECS running on 64bit Amazon Linux 2023
- **Configure SSH**: optional

### 5. Ensure ECR access permissions

```bash
aws iam attach-role-policy \
  --role-name aws-elasticbeanstalk-ec2-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly
```

### 6. Create environment

```bash
eb create multicontainer-env --elb-type application
```

### 7. Deploy updates

```bash
eb deploy
```

### 8. Check status and logs

```bash
eb health
eb logs
eb ssh
```

### 9. Terminate environment to avoid charges

```bash
eb terminate --force
```

## Notes

- The **web** container serves an HTML page via NGINX
- The **worker** container runs in the background and logs messages every 10 seconds
- Logs can be viewed with `eb logs` or `docker logs` via `eb ssh`

## Next Steps

After following this tutorial, you will have a multicontainer application running on AWS Elastic Beanstalk with containers managed by ECS and images