# infrastructure/security.tf

# 1. Load Balancer Security Group (The Front Door)
resource "aws_security_group" "alb_sg" {
  name        = "plaasstop-alb-sg"
  description = "Allow HTTP inbound traffic"
  vpc_id      = aws_vpc.main.id

  # Allow HTTP from anywhere
  ingress {
    description = "HTTP from Internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  

  # Allow all outbound traffic (so the ALB can talk to EC2)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "plaasstop-alb-sg"
  }
}

# 2. App Server Security Group (The Logic Layer)
resource "aws_security_group" "app_sg" {
  name        = "plaasstop-app-sg"
  description = "Security group for App Instances"
  vpc_id      = aws_vpc.main.id

  # Rule: Only allow traffic from the Load Balancer on port 5000
  ingress {
    description     = "Traffic from ALB"
    from_port       = 5000
    to_port         = 5000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  # Rule: Allow SSH only for debugging (We will lock this down later)
  # Ideally, you should replace "0.0.0.0/0" with your specific IP address
  ingress {
    description = "SSH from Anywhere"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] 
  }

  # Allow the server to download updates (npm install, yum update)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "plaasstop-app-sg"
  }
}

# 3. Database Security Group (The Vault)
resource "aws_security_group" "db_sg" {
  name        = "plaasstop-db-sg"
  description = "Security group for RDS Database"
  vpc_id      = aws_vpc.main.id

  # Rule: Only allow traffic from the App Server
  ingress {
    description     = "PostgreSQL from App Server"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app_sg.id]
  }
  
  # Also allow traffic from your local IP for initial setup/migration?
  # If you want to connect from your laptop, we need to add that here.
  # Let's keep it secure for now.

  tags = {
    Name = "plaasstop-db-sg"
  }
}
