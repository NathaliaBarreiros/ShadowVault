"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Shield, Mail, CheckCircle, Zap, Globe, Lock, ArrowRight, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"

interface SetupStep {
  id: string
  title: string
  description: string
  duration: number
  completed: boolean
}

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState<"welcome" | "signup" | "setup" | "complete">("welcome")
  const [email, setEmail] = useState("")
  const [setupProgress, setSetupProgress] = useState(0)
  const [currentSetupStep, setCurrentSetupStep] = useState(0)
  const router = useRouter()

  const setupSteps: SetupStep[] = [
    {
      id: "wallet",
      title: "Creating Secure Wallets",
      description: "Generating cryptographic keys with CDP",
      duration: 3000,
      completed: false,
    },
    {
      id: "contracts",
      title: "Deploying Zircuit Contracts",
      description: "Setting up your cross-chain vault",
      duration: 4000,
      completed: false,
    },
    {
      id: "ai",
      title: "Initializing AI Agent",
      description: "Configuring intelligent security monitoring",
      duration: 3000,
      completed: false,
    },
    {
      id: "networks",
      title: "Connecting Networks",
      description: "Establishing multi-chain infrastructure",
      duration: 3000,
      completed: false,
    },
    {
      id: "finalize",
      title: "Finalizing Setup",
      description: "Your ShadowVault is ready!",
      duration: 2000,
      completed: false,
    },
  ]

  const handleEmailSignup = async () => {
    if (!email || !email.includes("@")) return

    setCurrentStep("setup")

    // Simulate the setup process
    let totalProgress = 0
    const totalDuration = setupSteps.reduce((sum, step) => sum + step.duration, 0)

    for (let i = 0; i < setupSteps.length; i++) {
      setCurrentSetupStep(i)

      const step = setupSteps[i]
      const stepProgress = (step.duration / totalDuration) * 100

      // Animate progress for this step
      const startProgress = totalProgress
      const endProgress = totalProgress + stepProgress

      const animationDuration = step.duration
      const frameRate = 60
      const totalFrames = (animationDuration / 1000) * frameRate
      const progressPerFrame = stepProgress / totalFrames

      for (let frame = 0; frame < totalFrames; frame++) {
        await new Promise((resolve) => setTimeout(resolve, 1000 / frameRate))
        const currentProgress = startProgress + progressPerFrame * frame
        setSetupProgress(Math.min(currentProgress, endProgress))
      }

      totalProgress = endProgress
      step.completed = true
    }

    setSetupProgress(100)
    setCurrentStep("complete")
  }

  const handleGetStarted = () => {
    router.push("/")
  }

  if (currentStep === "welcome") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card/20 to-primary/5 flex items-center justify-center p-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center justify-center w-20 h-20 bg-primary rounded-2xl mb-4">
              <Shield className="w-12 h-12 text-primary-foreground" />
            </div>
          </div>

          <h1 className="text-5xl font-bold text-foreground mb-6">
            Welcome to <span className="text-primary">ShadowVault</span>
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            The revolutionary password manager that combines Web3 security with Web2 simplicity. Store once, access
            everywhere with AI-powered protection.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="border-primary/20">
              <CardContent className="p-6 text-center">
                <Globe className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Cross-Chain Access</h3>
                <p className="text-sm text-muted-foreground">
                  Access your passwords from any blockchain network with sub-200ms speed
                </p>
              </CardContent>
            </Card>

            <Card className="border-accent/20">
              <CardContent className="p-6 text-center">
                <Zap className="w-12 h-12 text-accent mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">AI Security</h3>
                <p className="text-sm text-muted-foreground">
                  Real-time threat detection and automated password updates
                </p>
              </CardContent>
            </Card>

            <Card className="border-secondary/20">
              <CardContent className="p-6 text-center">
                <Lock className="w-12 h-12 text-secondary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Zero Complexity</h3>
                <p className="text-sm text-muted-foreground">
                  Familiar password manager interface with revolutionary Web3 power
                </p>
              </CardContent>
            </Card>
          </div>

          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg"
            onClick={() => setCurrentStep("signup")}
          >
            Get Started - It Takes 30 Seconds
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          <p className="text-sm text-muted-foreground mt-4">
            No crypto knowledge required • No wallet setup • No gas fees
          </p>
        </div>
      </div>
    )
  }

  if (currentStep === "signup") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card/20 to-primary/5 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-primary rounded-xl mx-auto mb-4">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Create Your ShadowVault</CardTitle>
            <p className="text-muted-foreground">Enter your email to set up your secure vault in 30 seconds</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Button
                className="w-full bg-primary hover:bg-primary/90"
                size="lg"
                onClick={handleEmailSignup}
                disabled={!email || !email.includes("@")}
              >
                Create Secure Vault
                <Sparkles className="w-4 h-4 ml-2" />
              </Button>

              <div className="text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                  By continuing, you agree to our Terms of Service and Privacy Policy
                </p>
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-xs">
                    <Shield className="w-3 h-3 mr-1" />
                    Enterprise Security
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Globe className="w-3 h-3 mr-1" />
                    Multi-Chain
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Zap className="w-3 h-3 mr-1" />
                    AI Powered
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (currentStep === "setup") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card/20 to-primary/5 flex items-center justify-center p-6">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-primary rounded-xl mx-auto mb-4">
              <Shield className="w-8 h-8 text-primary-foreground animate-pulse" />
            </div>
            <CardTitle className="text-2xl">Setting Up Your Vault</CardTitle>
            <p className="text-muted-foreground">We're configuring your secure infrastructure behind the scenes</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground">Setup Progress</span>
                <span className="text-muted-foreground">{Math.round(setupProgress)}%</span>
              </div>
              <Progress value={setupProgress} className="h-3" />
            </div>

            <div className="space-y-4">
              {setupSteps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    index === currentSetupStep
                      ? "bg-primary/10 border border-primary/20"
                      : step.completed
                        ? "bg-green-50 border border-green-200"
                        : "bg-muted/50"
                  }`}
                >
                  <div className="flex-shrink-0">
                    {step.completed ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : index === currentSetupStep ? (
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-muted-foreground/30 rounded-full" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{step.title}</p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">This process typically takes 15-30 seconds</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (currentStep === "complete") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card/20 to-primary/5 flex items-center justify-center p-6">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center w-20 h-20 bg-green-100 rounded-2xl mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">Vault Ready!</CardTitle>
            <p className="text-muted-foreground">Your ShadowVault has been successfully configured</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-primary/5 rounded-lg">
                <Globe className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium">5 Networks</p>
                <p className="text-xs text-muted-foreground">Connected</p>
              </div>
              <div className="text-center p-4 bg-accent/5 rounded-lg">
                <Zap className="w-8 h-8 text-accent mx-auto mb-2" />
                <p className="text-sm font-medium">AI Agent</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Security Score</span>
                <span className="font-bold text-primary">85/100</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Cross-Chain Access</span>
                <Badge className="bg-green-100 text-green-800">Ready</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">AI Monitoring</span>
                <Badge className="bg-blue-100 text-blue-800">Active</Badge>
              </div>
            </div>

            <Button className="w-full bg-primary hover:bg-primary/90" size="lg" onClick={handleGetStarted}>
              Enter ShadowVault
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                You can now start adding passwords and enjoy revolutionary security
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
