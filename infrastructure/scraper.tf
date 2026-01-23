# 1. ECR Repository (Where we store the Docker Image)
resource "aws_ecr_repository" "scraper_repo" {
  name = "plaasstop-scraper"
  force_delete = true
}

# 2. IAM Role (Permission for Lambda to run)
resource "aws_iam_role" "scraper_role" {
  name = "plaasstop_scraper_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

# Attach Basic Logging Policy
resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.scraper_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# 3. The Lambda Function
# NOTE: We can't deploy this until we push the Docker image once!
# For the first run, we define it, but it will fail if the image is missing.
resource "aws_lambda_function" "scraper" {
  function_name = "plaasstop-daily-scraper"
  role          = aws_iam_role.scraper_role.arn
  package_type  = "Image"
  # This points to the repo we created in step 1
  image_uri     = "${aws_ecr_repository.scraper_repo.repository_url}:latest"
  
  timeout       = 900 # 5 minutes max
  memory_size   = 128

  environment {
    variables = {
      # Terraform injects the DB URL automatically!
      DATABASE_URL = "postgres://postgres:mysecretpassword@${aws_db_instance.default.address}:5432/plaasstop"
    }
  }
}

# 4. The Schedule (EventBridge) - Runs every day at 3 AM UTC
resource "aws_cloudwatch_event_rule" "daily_scrape" {
  name        = "every-day-at-3am"
  description = "Triggers the scraper daily"
  schedule_expression = "cron(0 3 * * ? *)"
}

resource "aws_cloudwatch_event_target" "trigger_lambda" {
  rule      = aws_cloudwatch_event_rule.daily_scrape.name
  target_id = "run_scraper"
  arn       = aws_lambda_function.scraper.arn
}

resource "aws_lambda_permission" "allow_cloudwatch" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.scraper.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.daily_scrape.arn
}
