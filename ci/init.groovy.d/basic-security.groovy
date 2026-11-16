#!groovy
import jenkins.model.*
import hudson.security.*

def instance = Jenkins.getInstance()

println "--> Configuring local CloudOps Jenkins security"
def hudsonRealm = new HudsonPrivateSecurityRealm(false)
hudsonRealm.createAccount("admin", "admin123")
instance.setSecurityRealm(hudsonRealm)

def strategy = new FullControlOnceLoggedInAuthorizationStrategy()
strategy.setAllowAnonymousRead(true)
instance.setAuthorizationStrategy(strategy)
instance.save()
println "--> Local admin user created successfully (username: admin, password: admin123)"
