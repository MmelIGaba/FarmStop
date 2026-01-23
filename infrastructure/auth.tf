# 1. The User Pool (Holds the users)
resource "aws_cognito_user_pool" "main" {
  name = "plaasstop-users"

  # Allow login via Email
  username_attributes = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = true
  }
}

# 2. The App Client (Allows React to talk to Cognito)
resource "aws_cognito_user_pool_client" "client" {
  name         = "plaasstop-react-client"
  user_pool_id = aws_cognito_user_pool.main.id

  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH"
  ]

  access_token_validity  = 1  # 1 Hour (Max is 24 hours)
  id_token_validity      = 1  # 1 Hour (Max is 24 hours)
  refresh_token_validity = 30 # 30 Days

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }
}

# 3. Outputs (We need these for the Frontend/Backend)
output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.main.id
}

output "cognito_client_id" {
  value = aws_cognito_user_pool_client.client.id
}
