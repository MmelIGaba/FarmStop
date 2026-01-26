# infrastructure/rds.tf

# 1. The Subnet Group (Where the DB lives)
resource "aws_db_subnet_group" "main" {
  name       = "plaasstop-db-subnet-group"
  subnet_ids = [aws_subnet.private_subnet.id, aws_subnet.private_subnet_2.id]

  tags = {
    Name = "plaasstop-db-subnet-group"
  }
}

# 2. The Database Instance
resource "aws_db_instance" "default" {
  allocated_storage      = 20
  db_name                = "plaasstop"
  engine                 = "postgres"
  engine_version         = "16.3" # Latest stable standard
  instance_class         = "db.t3.micro" # Free Tier Eligible
  username               = "postgres"
  password               = "mysecretpassword" 
  parameter_group_name   = "default.postgres16"
  skip_final_snapshot    = true # Don't backup when destroying (for learning)
  publicly_accessible    = true # Temporary: Allow laptop access for setup
  vpc_security_group_ids = [aws_security_group.db_sg.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  tags = {
    Name = "plaasstop-db"
  }
  monitoring_interval = 60             
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
}

resource "aws_iam_role" "rds_monitoring" {
  name = "plaasstop-rds-monitoring-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "monitoring.rds.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "rds_monitoring_policy" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# 3. Output the Hostname (We need this for our code!)
output "db_hostname" {
  value = aws_db_instance.default.address
}
