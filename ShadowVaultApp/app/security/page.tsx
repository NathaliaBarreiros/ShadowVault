"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Shield,
  ArrowLeft,
  Zap,
  Send,
  Bot,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  Eye,
  Lock,
  Activity,
} from "lucide-react"
import Link from "next/link"

interface ChatMessage {
  id: string
  type: "user" | "ai"
  content: string
  timestamp: string
  actions?: Array<{
    id: string
    label: string
    type: "primary" | "secondary" | "destructive"
    completed?: boolean
  }>
}

interface SecurityThreat {
  id: string
  type: "breach" | "weak-password" | "suspicious-activity" | "outdated"
  severity: "high" | "medium" | "low"
  title: string
  description: string
  affectedAccounts: string[]
  timestamp: string
  status: "active" | "resolved" | "monitoring"
  aiAction?: string
}

export default function SecurityPage() {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      type: "ai",
      content:
        "Hello! I'm your AI security assistant. I've detected some security issues that need your attention. Your GitHub password was found in today's data breach. Would you like me to update it automatically?",
      timestamp: "2 minutes ago",
      actions: [
        { id: "update-github", label: "Update Password", type: "primary" },
        { id: "remind-later", label: "Remind Later", type: "secondary" },
      ],
    },
    {
      id: "2",
      type: "user",
      content: "Yes, please update it and make it stronger.",
      timestamp: "1 minute ago",
    },
    {
      id: "3",
      type: "ai",
      content:
        "Perfect! I've generated a new 16-character password with mixed case, numbers, and symbols. Your GitHub password has been updated successfully. Your security score increased from 92 to 94. I've also enabled 2FA for additional protection.",
      timestamp: "30 seconds ago",
      actions: [{ id: "view-password", label: "View New Password", type: "secondary", completed: true }],
    },
  ])

  const [newMessage, setNewMessage] = useState("")
  const [autoSettings, setAutoSettings] = useState({
    autoUpdate: true,
    breachMonitoring: true,
    weakPasswordAlerts: true,
    suspiciousActivityAlerts: true,
    autoBackup: true,
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const threats: SecurityThreat[] = [
    {
      id: "1",
      type: "breach",
      severity: "high",
      title: "Data Breach Detected",
      description: "GitHub password found in recent breach database",
      affectedAccounts: ["GitHub"],
      timestamp: "15 minutes ago",
      status: "resolved",
      aiAction: "Password automatically updated",
    },
    {
      id: "2",
      type: "weak-password",
      severity: "medium",
      title: "Weak Password Detected",
      description: "Amazon password strength below recommended threshold",
      affectedAccounts: ["Amazon"],
      timestamp: "1 hour ago",
      status: "active",
    },
    {
      id: "3",
      type: "suspicious-activity",
      severity: "low",
      title: "Unusual Access Pattern",
      description: "LinkedIn accessed from new location",
      affectedAccounts: ["LinkedIn"],
      timestamp: "3 hours ago",
      status: "monitoring",
      aiAction: "Monitoring for 24 hours",
    },
    {
      id: "4",
      type: "outdated",
      severity: "medium",
      title: "Password Age Alert",
      description: "Netflix password hasn't been changed in 6 months",
      affectedAccounts: ["Netflix"],
      timestamp: "1 day ago",
      status: "active",
    },
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  const sendMessage = () => {
    if (!newMessage.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: newMessage,
      timestamp: "Just now",
    }

    setChatMessages((prev) => [...prev, userMessage])
    setNewMessage("")

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content:
          "I understand your concern. Let me analyze your security posture and provide recommendations. Based on your current setup, I suggest enabling automatic password rotation for your financial accounts. Would you like me to set this up?",
        timestamp: "Just now",
        actions: [
          { id: "enable-rotation", label: "Enable Auto-Rotation", type: "primary" },
          { id: "learn-more", label: "Learn More", type: "secondary" },
        ],
      }
      setChatMessages((prev) => [...prev, aiResponse])
    }, 1500)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "text-red-600 bg-red-100"
      case "medium":
        return "text-orange-600 bg-orange-100"
      case "low":
        return "text-yellow-600 bg-yellow-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "active":
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      case "monitoring":
        return <Eye className="w-4 h-4 text-blue-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div className="flex items-center justify-center w-10 h-10 bg-accent rounded-lg">
                <Zap className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">AI Security Center</h1>
                <p className="text-sm text-muted-foreground">Intelligent threat protection</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-green-100 text-green-800">
                <Shield className="w-3 h-3 mr-1" />
                Protected
              </Badge>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* AI Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <Bot className="w-5 h-5 text-accent" />
                  AI Security Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.type === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {message.type === "ai" && (
                        <div className="flex-shrink-0 w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                          <Bot className="w-4 h-4 text-accent-foreground" />
                        </div>
                      )}
                      <div className={`max-w-[80%] ${message.type === "user" ? "order-first" : ""}`}>
                        <div
                          className={`p-3 rounded-lg ${
                            message.type === "user"
                              ? "bg-primary text-primary-foreground ml-auto"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                        </div>
                        {message.actions && (
                          <div className="flex gap-2 mt-2">
                            {message.actions.map((action) => (
                              <Button
                                key={action.id}
                                size="sm"
                                variant={action.type === "primary" ? "default" : "outline"}
                                className={action.completed ? "opacity-50" : ""}
                                disabled={action.completed}
                              >
                                {action.completed && <CheckCircle className="w-3 h-3 mr-1" />}
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">{message.timestamp}</p>
                      </div>
                      {message.type === "user" && (
                        <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask about your security..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Security Settings & Automation */}
          <div className="space-y-6">
            {/* Automation Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-card-foreground">Automation Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Auto-Update Passwords</p>
                    <p className="text-xs text-muted-foreground">Automatically update breached passwords</p>
                  </div>
                  <Switch
                    checked={autoSettings.autoUpdate}
                    onCheckedChange={(checked) => setAutoSettings((prev) => ({ ...prev, autoUpdate: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Breach Monitoring</p>
                    <p className="text-xs text-muted-foreground">Monitor dark web for breaches</p>
                  </div>
                  <Switch
                    checked={autoSettings.breachMonitoring}
                    onCheckedChange={(checked) => setAutoSettings((prev) => ({ ...prev, breachMonitoring: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Weak Password Alerts</p>
                    <p className="text-xs text-muted-foreground">Alert for passwords below threshold</p>
                  </div>
                  <Switch
                    checked={autoSettings.weakPasswordAlerts}
                    onCheckedChange={(checked) => setAutoSettings((prev) => ({ ...prev, weakPasswordAlerts: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Suspicious Activity</p>
                    <p className="text-xs text-muted-foreground">Monitor unusual access patterns</p>
                  </div>
                  <Switch
                    checked={autoSettings.suspiciousActivityAlerts}
                    onCheckedChange={(checked) =>
                      setAutoSettings((prev) => ({ ...prev, suspiciousActivityAlerts: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* AI Activity Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <Activity className="w-5 h-5 text-accent" />
                  AI Activity Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Passwords Updated</span>
                    <span className="text-sm font-bold text-primary">3</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Threats Blocked</span>
                    <span className="text-sm font-bold text-red-600">7</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Security Scans</span>
                    <span className="text-sm font-bold text-blue-600">12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Score Improvement</span>
                    <span className="text-sm font-bold text-green-600">+2</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Threat Monitoring */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  Threat Monitoring
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {threats.map((threat) => (
                    <div key={threat.id} className="flex items-start gap-4 p-4 rounded-lg border border-border">
                      <div className="flex-shrink-0 mt-1">{getStatusIcon(threat.status)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="text-sm font-semibold text-foreground">{threat.title}</h4>
                            <p className="text-sm text-muted-foreground">{threat.description}</p>
                          </div>
                          <Badge className={getSeverityColor(threat.severity)}>{threat.severity}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {threat.timestamp}
                          </span>
                          <span className="flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            {threat.affectedAccounts.join(", ")}
                          </span>
                          {threat.aiAction && (
                            <span className="flex items-center gap-1 text-accent">
                              <Zap className="w-3 h-3" />
                              {threat.aiAction}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
