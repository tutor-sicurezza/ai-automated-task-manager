import { useState, useEffect } from 'react';
import { useKV } from '@/hooks/useKV';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Envelope, CheckCircle, XCircle, Info, Lightning, Gear, ChartBar, PaperPlaneTilt, Play, Warning } from '@phosphor-icons/react';
import { toast } from 'sonner';

interface SendGridConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
  replyToEmail?: string;
  provider: 'sendgrid' | 'resend';
  enabled: boolean;
  testEmail?: string;
}

interface EmailStats {
  sent: number;
  delivered: number;
  failed: number;
  lastSentAt?: string;
}

export function SendGridConfiguration() {
  const [config, setConfig] = useKV<SendGridConfig>('sendgrid-config', {
    apiKey: '',
    fromEmail: '',
    fromName: 'TaskFlow',
    provider: 'sendgrid',
    enabled: false,
  });

  const [stats, setStats] = useKV<EmailStats>('email-stats', {
    sent: 0,
    delivered: 0,
    failed: 0,
  });

  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const handleSave = () => {
    if (!config.fromEmail || !config.fromName) {
      toast.error('From email and name are required');
      return;
    }

    if (config.enabled && !config.apiKey) {
      toast.error('API key is required when email service is enabled');
      return;
    }

    setConfig((current) => ({ ...current }));
    toast.success('Email configuration saved successfully');
  };

  const handleTestConnection = async () => {
    if (!config.apiKey) {
      toast.error('Please enter an API key first');
      return;
    }

    setConnectionStatus('testing');

    try {
      const response = await fetch(`https://api.${config.provider === 'sendgrid' ? 'sendgrid' : 'resend'}.com/v3/user/profile`, {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
        },
      });

      if (response.ok) {
        setConnectionStatus('success');
        toast.success('Connection successful!');
      } else {
        setConnectionStatus('error');
        toast.error('Connection failed - Invalid API key');
      }
    } catch (error) {
      setConnectionStatus('error');
      toast.error('Connection failed - Network error');
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      toast.error('Please enter a test email address');
      return;
    }

    if (!config.apiKey || !config.enabled) {
      toast.error('Please configure and enable email service first');
      return;
    }

    setTesting(true);

    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: testEmail,
          subject: 'TaskFlow Test Email',
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #4F46E5;">TaskFlow Email Test</h1>
              <p>This is a test email from your TaskFlow application.</p>
              <p>If you're seeing this, your email configuration is working correctly!</p>
              <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="color: #6b7280; font-size: 14px;">
                Sent via ${config.provider === 'sendgrid' ? 'SendGrid' : 'Resend'} • ${new Date().toLocaleString()}
              </p>
            </div>
          `,
          textContent: `TaskFlow Email Test\n\nThis is a test email from your TaskFlow application.\nIf you're seeing this, your email configuration is working correctly!\n\nSent via ${config.provider === 'sendgrid' ? 'SendGrid' : 'Resend'} • ${new Date().toLocaleString()}`,
          from: `${config.fromName} <${config.fromEmail}>`,
          provider: config.provider,
          tenantId: 'test-tenant',
        }),
      });

      if (response.ok) {
        toast.success(`Test email sent to ${testEmail}`);
        setStats((current) => ({
          ...current,
          sent: current.sent + 1,
          delivered: current.delivered + 1,
          lastSentAt: new Date().toISOString(),
        }));
      } else {
        const error = await response.json();
        toast.error(`Failed to send test email: ${error.message || 'Unknown error'}`);
        setStats((current) => ({
          ...current,
          sent: current.sent + 1,
          failed: current.failed + 1,
        }));
      }
    } catch (error) {
      toast.error('Failed to send test email - Network error');
      setStats((current) => ({
        ...current,
        failed: current.failed + 1,
      }));
    } finally {
      setTesting(false);
    }
  };

  const deliveryRate = stats.sent > 0 ? ((stats.delivered / stats.sent) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Envelope size={24} className="text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Email Service Configuration</h2>
            <p className="text-sm text-muted-foreground">Configure SendGrid or Resend for email delivery</p>
          </div>
        </div>
        <Badge variant={config.enabled ? 'default' : 'secondary'}>
          {config.enabled ? 'Enabled' : 'Disabled'}
        </Badge>
      </div>

      <Tabs defaultValue="configuration" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="configuration">
            <Gear size={16} className="mr-2" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="testing">
            <Play size={16} className="mr-2" />
            Testing
          </TabsTrigger>
          <TabsTrigger value="statistics">
            <ChartBar size={16} className="mr-2" />
            Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configuration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Provider</CardTitle>
              <CardDescription>Choose your email delivery service</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select
                  value={config.provider}
                  onValueChange={(value: 'sendgrid' | 'resend') =>
                    setConfig((current) => ({ ...current, provider: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sendgrid">
                      <div className="flex items-center gap-2">
                        <Lightning size={16} />
                        SendGrid (Recommended)
                      </div>
                    </SelectItem>
                    <SelectItem value="resend">
                      <div className="flex items-center gap-2">
                        <Envelope size={16} />
                        Resend
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Alert>
                <Info size={16} />
                <AlertDescription className="text-sm">
                  {config.provider === 'sendgrid' ? (
                    <>
                      <strong>SendGrid:</strong> Offers 100 emails/day on free tier. Get your API key from{' '}
                      <a
                        href="https://app.sendgrid.com/settings/api_keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        SendGrid Dashboard
                      </a>
                    </>
                  ) : (
                    <>
                      <strong>Resend:</strong> Developer-friendly email API. Get your API key from{' '}
                      <a
                        href="https://resend.com/api-keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        Resend Dashboard
                      </a>
                    </>
                  )}
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="api-key"
                    type={showApiKey ? 'text' : 'password'}
                    value={config.apiKey}
                    onChange={(e) =>
                      setConfig((current) => ({ ...current, apiKey: e.target.value }))
                    }
                    placeholder={`Enter your ${config.provider === 'sendgrid' ? 'SendGrid' : 'Resend'} API key`}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? '🙈' : '👁️'}
                  </Button>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={connectionStatus === 'testing' || !config.apiKey}
                className="w-full"
              >
                {connectionStatus === 'testing' ? (
                  <>Testing Connection...</>
                ) : connectionStatus === 'success' ? (
                  <>
                    <CheckCircle size={16} className="mr-2 text-green-500" />
                    Connection Successful
                  </>
                ) : connectionStatus === 'error' ? (
                  <>
                    <XCircle size={16} className="mr-2 text-red-500" />
                    Connection Failed
                  </>
                ) : (
                  'Test Connection'
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sender Information</CardTitle>
              <CardDescription>Configure the sender details for your emails</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="from-name">From Name</Label>
                <Input
                  id="from-name"
                  value={config.fromName}
                  onChange={(e) =>
                    setConfig((current) => ({ ...current, fromName: e.target.value }))
                  }
                  placeholder="TaskFlow"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="from-email">From Email</Label>
                <Input
                  id="from-email"
                  type="email"
                  value={config.fromEmail}
                  onChange={(e) =>
                    setConfig((current) => ({ ...current, fromEmail: e.target.value }))
                  }
                  placeholder="notifications@yourdomain.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reply-to">Reply-To Email (Optional)</Label>
                <Input
                  id="reply-to"
                  type="email"
                  value={config.replyToEmail || ''}
                  onChange={(e) =>
                    setConfig((current) => ({ ...current, replyToEmail: e.target.value }))
                  }
                  placeholder="support@yourdomain.com"
                />
              </div>

              <Alert>
                <Warning size={16} />
                <AlertDescription className="text-sm">
                  Make sure your from email is verified with your email provider. Some providers require domain verification.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Service Status</CardTitle>
              <CardDescription>Enable or disable email notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    {config.enabled
                      ? 'Users will receive email notifications for tasks and updates'
                      : 'Email notifications are currently disabled'}
                  </p>
                </div>
                <Switch
                  checked={config.enabled}
                  onCheckedChange={(checked) =>
                    setConfig((current) => ({ ...current, enabled: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSave} className="w-full" size="lg">
            Save Configuration
          </Button>
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Send Test Email</CardTitle>
              <CardDescription>
                Send a test email to verify your configuration is working correctly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-email">Test Email Address</Label>
                <Input
                  id="test-email"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="your-email@example.com"
                />
              </div>

              <Button
                onClick={handleSendTestEmail}
                disabled={testing || !testEmail || !config.enabled}
                className="w-full"
                size="lg"
              >
                {testing ? (
                  <>Sending...</>
                ) : (
                  <>
                    <PaperPlaneTilt size={16} className="mr-2" />
                    Send Test Email
                  </>
                )}
              </Button>

              {!config.enabled && (
                <Alert>
                  <Info size={16} />
                  <AlertDescription>
                    Email service is currently disabled. Enable it in the Configuration tab to send test emails.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Setup Guide</CardTitle>
              <CardDescription>Follow these steps to configure your email service</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 list-decimal list-inside text-sm">
                <li>Create an account with {config.provider === 'sendgrid' ? 'SendGrid' : 'Resend'}</li>
                <li>Generate an API key with full access permissions</li>
                <li>Verify your sender email address or domain</li>
                <li>Enter your API key and sender details above</li>
                <li>Test the connection to verify everything is working</li>
                <li>Send a test email to confirm delivery</li>
                <li>Enable the email service when ready</li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Sent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.sent}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Delivered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{stats.delivered}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Failed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{stats.failed}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Delivery Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{deliveryRate}%</div>
              </CardContent>
            </Card>
          </div>

          {stats.lastSentAt && (
            <Card>
              <CardHeader>
                <CardTitle>Last Email Sent</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {new Date(stats.lastSentAt).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Email Usage</CardTitle>
              <CardDescription>Track your email sending volume</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Current Period</span>
                  <span className="font-medium">{stats.sent} emails</span>
                </div>
                {config.provider === 'sendgrid' && (
                  <div className="flex justify-between text-sm">
                    <span>Free Tier Limit</span>
                    <span className="font-medium">100/day</span>
                  </div>
                )}
                {config.provider === 'resend' && (
                  <div className="flex justify-between text-sm">
                    <span>Free Tier Limit</span>
                    <span className="font-medium">100/day</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
