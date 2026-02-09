data "aws_route53_zone" "main" {
  name         = "mmeligabriel.online"
  private_zone = false
}

# Look up the subnet you want to use
data "aws_subnet" "selected" {
  id = "subnet-09ec5f8e279acd9aa"
}

resource "aws_security_group" "backend_sg" {
  name        = "backend-sg"
  description = "Allow HTTP and HTTPS"
  vpc_id      = data.aws_subnet.selected.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "backend" {
  ami                  = "ami-024ee5112d03921e2"
  instance_type        = "t3.micro"
  iam_instance_profile = "plaasstop-ec2-ssm-profile"

  subnet_id              = data.aws_subnet.selected.id
  vpc_security_group_ids = [aws_security_group.backend_sg.id]

  tags = {
    Name = "FarmStop-Backend"
  }
}

resource "aws_route53_record" "api_record" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "api-farmstop.mmeligabriel.online"
  type    = "A"
  ttl     = 300
  records = [aws_instance.backend.public_ip]
}
