# infrastructure/vpc.tf

# 1. The VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "plaasstop-vpc"
  }
}

# 2. Public Subnet (For Load Balancer & Public Access)
resource "aws_subnet" "public_subnet" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "us-east-1a"
  map_public_ip_on_launch = true

  tags = {
    Name = "plaasstop-public-subnet"
  }
}

# 3. Private Subnet (For Database & App Server)
resource "aws_subnet" "private_subnet" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-east-1a"

  tags = {
    Name = "plaasstop-private-subnet"
  }
}

# 4. Internet Gateway (The door to the internet)
resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "plaasstop-igw"
  }
}

# 5. Route Table for Public Subnet
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.gw.id
  }

  tags = {
    Name = "plaasstop-public-rt"
  }
}

# 6. Associate Route Table with Public Subnet
resource "aws_route_table_association" "public_assoc" {
  subnet_id      = aws_subnet.public_subnet.id
  route_table_id = aws_route_table.public_rt.id
}

# 7. Second Private Subnet (Required for RDS Subnet Group)
resource "aws_subnet" "private_subnet_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = "us-east-1b" # Different AZ

  tags = {
    Name = "plaasstop-private-subnet-2"
  }
}

# 8. Allow Private Subnet 1 to access Internet (Temporary for Setup)
resource "aws_route_table_association" "private_assoc_1" {
  subnet_id      = aws_subnet.private_subnet.id
  route_table_id = aws_route_table.public_rt.id
}

# 9. Allow Private Subnet 2 to access Internet (Temporary for Setup)
resource "aws_route_table_association" "private_assoc_2" {
  subnet_id      = aws_subnet.private_subnet_2.id
  route_table_id = aws_route_table.public_rt.id
}

# 10. Second Public Subnet (Required for ALB)
resource "aws_subnet" "public_subnet_2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.4.0/24"
  availability_zone       = "us-east-1b" # Must be different AZ
  map_public_ip_on_launch = true

  tags = {
    Name = "plaasstop-public-subnet-2"
  }
}

# 11. Associate Route Table with Public Subnet 2
resource "aws_route_table_association" "public_assoc_2" {
  subnet_id      = aws_subnet.public_subnet_2.id
  route_table_id = aws_route_table.public_rt.id
}
