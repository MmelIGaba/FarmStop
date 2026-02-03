# infrastructure/compute.tf

# 1. Get the latest Amazon Linux 2 AMI
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-x86_64"]
  }
}

# 2. CREATE: Single "Free Tier" Server (Replaces ASG & ALB)
resource "aws_instance" "app_server" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = "t3.micro"

  # NETWORK: Put in Public Subnet so we don't need a NAT Gateway
  subnet_id                   = aws_subnet.public_subnet.id
  associate_public_ip_address = true
  vpc_security_group_ids      = [aws_security_group.app_sg.id]

  # Optional: Add SSH Key if you made one earlier
  # key_name = "my-laptop-key" 

  user_data = base64encode(<<-EOF
              #!/bin/bash
              dnf update -y
              curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
              dnf install -y nodejs git postgresql15
              
              mkdir -p /home/ec2-user/app
              chown ec2-user:ec2-user /home/ec2-user/app
              
              # Clone Logic
              git clone -b main https://github.com/MmelIGaba/FarmStop.git /home/ec2-user/app
              
              cd /home/ec2-user/app/backend
              npm install
              
              # Inject Env Vars
              echo "DATABASE_URL=postgres://postgres:mysecretpassword@${aws_db_instance.default.address}:5432/plaasstop" > .env
              echo "PORT=5000" >> .env
              
              # Allow CloudFront to talk to us
              echo "FRONTEND_URL=*" >> .env 
              
              echo "COGNITO_USER_POOL_ID=${aws_cognito_user_pool.main.id}" >> .env
              echo "COGNITO_CLIENT_ID=${aws_cognito_user_pool_client.client.id}" >> .env

              npm install -g pm2
              pm2 start server.js --name "farmstop-api"
              pm2 save
              pm2 startup
              EOF
  )

  tags = {
    Name = "plaasstop-free-server"
  }
}

# 3. OUTPUT: The Public DNS (CloudFront needs this!)
output "api_public_dns" {
  value = aws_instance.app_server.public_dns
}