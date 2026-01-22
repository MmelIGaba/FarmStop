# 1. Create the S3 Bucket
resource "aws_s3_bucket" "frontend_bucket" {
  bucket = "plaasstop-frontend-mmeli" # MUST be globally unique. Change if taken.
  force_destroy = true
}

# 2. Configure Ownership Controls (Required for public access)
resource "aws_s3_bucket_ownership_controls" "frontend_controls" {
  bucket = aws_s3_bucket.frontend_bucket.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

# 3. Disable "Block Public Access" (Allow the world to see it)
resource "aws_s3_bucket_public_access_block" "frontend_access" {
  bucket = aws_s3_bucket.frontend_bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# 4. Add a Bucket Policy (Read-Only for everyone)
resource "aws_s3_bucket_policy" "public_read" {
  bucket = aws_s3_bucket.frontend_bucket.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.frontend_bucket.arn}/*"
      },
    ]
  })
  
  # Wait for the public access block to be disabled first
  depends_on = [aws_s3_bucket_public_access_block.frontend_access]
}

# 5. Enable Static Website Hosting
resource "aws_s3_bucket_website_configuration" "frontend_hosting" {
  bucket = aws_s3_bucket.frontend_bucket.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html" # Important for React Router!
  }
}

# 6. Output the Website URL
output "frontend_url" {
  value = aws_s3_bucket_website_configuration.frontend_hosting.website_endpoint
}
