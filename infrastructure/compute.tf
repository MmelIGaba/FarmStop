# infrastructure/compute.tf

# 1. Get the latest Amazon Linux 2 AMI (The OS Image)
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-x86_64"]
    }
}

# 2.
resource "aws_launch_template" "app_lt" {
  name_prefix   = "plaasstop-lt-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = "t3.micro"

  # --- CRITICAL CHANGE ---
  # We removed "vpc_security_group_ids = ..." from here.
  # We moved it inside the network_interfaces block below.
  
  network_interfaces {
    associate_public_ip_address = true
    security_groups             = [aws_security_group.app_sg.id]
  }
  # -----------------------
  user_data = base64encode(<<-EOF
              #!/bin/bash
              dnf update -y
              
              # 1. Force Install Node.js 20 (Fixes EBADENGINE warnings)
              curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
              dnf install -y nodejs git postgresql15

              mkdir -p /var/www/plaasstop
              cd /var/www/plaasstop

              # 2. Clone Repo
              git clone -b dev https://github.com/MmelIGaba/FarmStop.git .

              cd backend
              npm install

              # 3. Inject Env Vars
              echo "DATABASE_URL=postgres://postgres:mysecretpassword@${aws_db_instance.default.address}:5432/plaasstop" > .env
              echo "PORT=5000" >> .env
              echo "FRONTEND_URL=http://plaasstop-frontend-mmeli.s3-website-us-east-1.amazonaws.com" >> .env

              npm install -g pm2
              pm2 start server.js
              pm2 save
              pm2 startup
              EOF
  )
  
  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "plaasstop-app-server"
    }
  }
}

# 3. Target Group (Groups the EC2s together)
resource "aws_lb_target_group" "app_tg" {
  name     = "plaasstop-tg"
  port     = 5000
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    path                = "/health/ready" # We will change this to /health/ready later
    matcher             = "200"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }
}

# 4. Auto Scaling Group (Creates the servers)
resource "aws_autoscaling_group" "app_asg" {
  name                = "plaasstop-asg"
  vpc_zone_identifier = [aws_subnet.public_subnet.id, aws_subnet.public_subnet_2.id]
  target_group_arns   = [aws_lb_target_group.app_tg.arn]
  
  desired_capacity = 2 # Start with 2 servers
  min_size         = 1
  max_size         = 3

  launch_template {
    id      = aws_launch_template.app_lt.id
    version = "$Latest"
  }
}

# 5. Load Balancer (The Public Entry Point)
resource "aws_lb" "main_alb" {
  name               = "plaasstop-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets = [aws_subnet.public_subnet.id, aws_subnet.public_subnet_2.id] # Needs 2 subnets usually

  tags = {
    Name = "plaasstop-alb"
  }
}

# 6. ALB Listener (Forward Port 80 to the Target Group)
resource "aws_lb_listener" "front_end" {
  load_balancer_arn = aws_lb.main_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app_tg.arn
  }
}

# 7. Output the Load Balancer URL
output "alb_dns_name" {
  value = aws_lb.main_alb.dns_name
}
