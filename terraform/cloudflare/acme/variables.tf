variable "email_address" {
  description = "Email address for ACME registration"
  type        = string
}

variable "domain_names" {
  description = "All domain names to be supported under this cert"
  type        = list(string)
}
