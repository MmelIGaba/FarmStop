terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "plaasstop-tf-state-mmeli"
    key    = "prod/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = "us-east-1"
}

# --- IAM Role for EC2 SSM ---
resource "aws_iam_role" "ec2_ssm_role" {
  name = "plaasstop-ec2-ssm-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action    = "sts:AssumeRole",
      Principal = { Service = "ec2.amazonaws.com" },
      Effect    = "Allow"
    }]
  })
}

# Attach the managed SSM policy
resource "aws_iam_role_policy_attachment" "ssm_attach" {
  role       = aws_iam_role.ec2_ssm_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Instance Profile (bridge between EC2 and IAM Role)
resource "aws_iam_instance_profile" "ec2_ssm_profile" {
  name = "plaasstop-ec2-ssm-profile"
  role = aws_iam_role.ec2_ssm_role.name
}

# Output the instance profile name (so you can reference it in compute.tf)
output "ec2_ssm_profile_name" {
  value = aws_iam_instance_profile.ec2_ssm_profile.name
}