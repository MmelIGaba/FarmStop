# infrastructure/compute.tf

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-x86_64"]
  }
}

resource "aws_launch_template" "app_lt" {
  name_prefix   = "plaasstop-lt-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = "t3.micro"

  network_interfaces {
    associate_public_ip_address = true
    security_groups             = [aws_security_group.app_sg.id]
  }

  # --- UPDATED USER DATA ---
  user_data = base64encode(<<-EOF
              #!/bin/bash
              dnf update -y
              
              # Install Node 20, Git, Postgres Client
              curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
              dnf install -y nodejs git postgresql15

              mkdir -p /home/ec2-user/app
              chown ec2-user:ec2-user /home/ec2-user/app
              
              # Clone Logic: Handle restarts vs fresh launches
              if [ -d "/home/ec2-user/app/.git" ]; then
                cd /home/ec2-user/app
                git pull origin main
              else
                git clone -b main https://github.com/MmelIGaba/FarmStop.git /home/ec2-user/app
              fi

              cd /home/ec2-user/app/backend
              npm install

              # Create .env file dynamically
              echo "DATABASE_URL=postgres://postgres:mysecretpassword@${aws_db_instance.default.address}:5432/plaasstop" > .env
              echo "PORT=5000" >> .env
              echo "FRONTEND_URL=https://farmstop.mmeligabriel.online" >> .env
              echo "COGNITO_USER_POOL_ID=${aws_cognito_user_pool.main.id}" >> .env
              echo "COGNITO_CLIENT_ID=${aws_cognito_user_pool_client.client.id}" >> .env

              npm install -g pm2
              pm2 start server.js --name "farmstop-api"
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

resource "aws_lb_target_group" "app_tg" {
  name     = "plaasstop-tg"
  port     = 5000
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    path                = "/health/ready"
    matcher             = "200"
    interval            = 60
    timeout             = 10
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
}

resource "aws_autoscaling_group" "app_asg" {
  name                = "plaasstop-asg" # Hardcoded name to make it easier to find
  vpc_zone_identifier = [aws_subnet.public_subnet.id, aws_subnet.public_subnet_2.id]
  target_group_arns   = [aws_lb_target_group.app_tg.arn]

  desired_capacity = 1
  min_size         = 1
  max_size         = 2

  launch_template {
    id      = aws_launch_template.app_lt.id
    version = "$Latest"
  }

  # Wait for instances to be healthy
  health_check_type         = "ELB"
  health_check_grace_period = 300
}

resource "aws_lb" "main_alb" {
  name               = "plaasstop-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = [aws_subnet.public_subnet.id, aws_subnet.public_subnet_2.id]

  tags = {
    Name = "plaasstop-alb"
  }
}

resource "aws_lb_listener" "front_end" {
  load_balancer_arn = aws_lb.main_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app_tg.arn
  }
}

output "alb_dns_name" {
  value = aws_lb.main_alb.dns_name
}

output "asg_name" {
  value = aws_autoscaling_group.app_asg.name
}

resource "aws_lb_listener" "https_listener" {
  load_balancer_arn = aws_lb.main_alb.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"

  # Use the SAME Wildcard Certificate
  certificate_arn = "arn:aws:acm:us-east-1:413048887333:certificate/c6e4c8d7-7978-4f0b-815e-8e981ed3efee"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app_tg.arn
  }
}