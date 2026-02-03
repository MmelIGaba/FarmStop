# infrastructure/security.tf

# 1. "alb_sg" resource entirely. 

# 2. App Server Security Group (Updated for Single Server Mode)
resource "aws_security_group" "app_sg" {
  name        = "plaasstop-app-sg"
  description = "Security group for Single App Instance"
  vpc_id      = aws_vpc.main.id

  # Rule: Allow Traffic on Port 5000 from the Internet (CloudFront connects here)
  ingress {
    description = "NodeJS API Access"
    from_port   = 5000
    to_port     = 5000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Rule: Allow SSH for debugging
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

# 3. Database Security Group (Unchanged)
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

  # Temporary: Allow access from ANYWHERE for DBeaver setup
  ingress {
    description = "Postgres Public Access"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "plaasstop-db-sg"
  }
}