import { useState, useMemo } from 'react';
import { useKV } from '@github/spark/hooks';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Gear, EnvelopeSimple, Bell, ClockCountdown, User, ArrowsClockwise, FlagBanner, ChatCircle, CheckCircle, WarningCircle, Moon } from '@phosphor-icons/react';
import { NotificationPreferences as NotificationPreferencesType } from '@/lib/types';
import { toast } from 'sonner';

interface NotificationPreferencesProps {
  userId: string;
}

const defaultPreferences: Omit<NotificationPreferencesType, 'userId'> = {
  emailNotifications: true,
  enabledNotifications: {
    task_assigned: true,
    task_reassigned: true,
    task_updated: true,
    task_comment: true,
    task_due_soon: true,
    task_overdue: true,
    task_completed: true,
    task_status_changed: true,
    task_priority_changed: true,
    mention: true,
  },
  notificationFrequency: 'instant',
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '08:00',
  },
};

const quietHoursPresets = [
  { label: 'Standard Sleep (10 PM - 7 AM)', start: '22:00', end: '07:00' },
  { label: 'Early Bird (9 PM - 6 AM)', start: '21:00', end: '06:00' },
  { label: 'Night Owl (12 AM - 9 AM)', start: '00:00', end: '09:00' },
  { label: 'Working Hours (6 PM - 9 AM)', start: '18:00', end: '09:00' },
];

function isInQuietHours(startTime: string, endTime: string): boolean {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  const start = startHour * 60 + startMin;
  const end = endHour * 60 + endMin;
  
  if (start < end) {
    return currentTime >= start && currentTime < end;
  } else {
    return currentTime >= start || currentTime < end;
  }
}

export function NotificationPreferences({ userId }: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useKV<NotificationPreferencesType>(
    `notification-preferences-${userId}`,
    { ...defaultPreferences, userId }
  );
  const [open, setOpen] = useState(false);

  const currentPreferences = preferences || { ...defaultPreferences, userId };
  
  const inQuietHours = useMemo(() => {
    if (!currentPreferences.quietHours.enabled) return false;
    return isInQuietHours(currentPreferences.quietHours.startTime, currentPreferences.quietHours.endTime);
  }, [currentPreferences.quietHours]);

  const handleToggleEmailNotifications = (checked: boolean) => {
    setPreferences((current) => ({
      ...(current || { ...defaultPreferences, userId }),
      emailNotifications: checked,
    }));
    toast.success(checked ? 'Email notifications enabled' : 'Email notifications disabled');
  };

  const handleToggleNotificationType = (type: keyof NotificationPreferencesType['enabledNotifications'], checked: boolean) => {
    setPreferences((current) => ({
      ...(current || { ...defaultPreferences, userId }),
      enabledNotifications: {
        ...(current?.enabledNotifications || defaultPreferences.enabledNotifications),
        [type]: checked,
      },
    }));
  };

  const handleChangeFrequency = (frequency: NotificationPreferencesType['notificationFrequency']) => {
    setPreferences((current) => ({
      ...(current || { ...defaultPreferences, userId }),
      notificationFrequency: frequency,
    }));
    toast.success(`Notification frequency set to ${frequency}`);
  };

  const handleToggleQuietHours = (checked: boolean) => {
    setPreferences((current) => ({
      ...(current || { ...defaultPreferences, userId }),
      quietHours: {
        ...(current?.quietHours || defaultPreferences.quietHours),
        enabled: checked,
      },
    }));
    toast.success(checked ? 'Quiet hours enabled - notifications paused during sleep times' : 'Quiet hours disabled');
  };

  const handleChangeQuietHours = (field: 'startTime' | 'endTime', value: string) => {
    setPreferences((current) => ({
      ...(current || { ...defaultPreferences, userId }),
      quietHours: {
        ...(current?.quietHours || defaultPreferences.quietHours),
        [field]: value,
      },
    }));
  };

  const handleApplyPreset = (preset: typeof quietHoursPresets[0]) => {
    setPreferences((current) => ({
      ...(current || { ...defaultPreferences, userId }),
      quietHours: {
        enabled: true,
        startTime: preset.start,
        endTime: preset.end,
      },
    }));
    toast.success(`Quiet hours set: ${preset.label}`);
  };

  const handleEnableAll = () => {
    setPreferences((current) => ({
      ...(current || { ...defaultPreferences, userId }),
      enabledNotifications: {
        task_assigned: true,
        task_reassigned: true,
        task_updated: true,
        task_comment: true,
        task_due_soon: true,
        task_overdue: true,
        task_completed: true,
        task_status_changed: true,
        task_priority_changed: true,
        mention: true,
      },
    }));
    toast.success('All notification types enabled');
  };

  const handleDisableAll = () => {
    setPreferences((current) => ({
      ...(current || { ...defaultPreferences, userId }),
      enabledNotifications: {
        task_assigned: false,
        task_reassigned: false,
        task_updated: false,
        task_comment: false,
        task_due_soon: false,
        task_overdue: false,
        task_completed: false,
        task_status_changed: false,
        task_priority_changed: false,
        mention: false,
      },
    }));
    toast.success('All notification types disabled');
  };

  const notificationTypes = [
    {
      key: 'task_assigned' as const,
      label: 'Task Assigned',
      description: 'When a task is assigned to you',
      icon: <User className="w-4 h-4 text-blue-500" weight="fill" />,
    },
    {
      key: 'task_reassigned' as const,
      label: 'Task Reassigned',
      description: 'When a task is reassigned to you',
      icon: <User className="w-4 h-4 text-blue-500" weight="fill" />,
    },
    {
      key: 'task_updated' as const,
      label: 'Task Updated',
      description: 'When a task you\'re involved with is updated',
      icon: <Bell className="w-4 h-4 text-indigo-500" weight="fill" />,
    },
    {
      key: 'task_comment' as const,
      label: 'Task Comment',
      description: 'When someone comments on your task',
      icon: <ChatCircle className="w-4 h-4 text-teal-500" weight="fill" />,
    },
    {
      key: 'task_due_soon' as const,
      label: 'Task Due Soon',
      description: 'When a task is due within 24 hours',
      icon: <ClockCountdown className="w-4 h-4 text-amber-500" weight="fill" />,
    },
    {
      key: 'task_overdue' as const,
      label: 'Task Overdue',
      description: 'When a task passes its due date',
      icon: <WarningCircle className="w-4 h-4 text-destructive" weight="fill" />,
    },
    {
      key: 'task_completed' as const,
      label: 'Task Completed',
      description: 'When your task is marked as complete',
      icon: <CheckCircle className="w-4 h-4 text-green-500" weight="fill" />,
    },
    {
      key: 'task_status_changed' as const,
      label: 'Status Changed',
      description: 'When a task status changes',
      icon: <ArrowsClockwise className="w-4 h-4 text-purple-500" weight="fill" />,
    },
    {
      key: 'task_priority_changed' as const,
      label: 'Priority Changed',
      description: 'When a task priority is modified',
      icon: <FlagBanner className="w-4 h-4 text-orange-500" weight="fill" />,
    },
    {
      key: 'mention' as const,
      label: 'Mentions',
      description: 'When you\'re mentioned in a comment',
      icon: <ChatCircle className="w-4 h-4 text-pink-500" weight="fill" />,
    },
  ];

  const allEnabled = Object.values(currentPreferences.enabledNotifications).every(v => v === true);
  const allDisabled = Object.values(currentPreferences.enabledNotifications).every(v => v === false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          {inQuietHours && (
            <div className="absolute -top-1 -right-1">
              <Moon className="h-3 w-3 text-purple-600" weight="fill" />
            </div>
          )}
          <Gear className="h-5 w-5" weight="fill" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gear className="h-5 w-5" weight="fill" />
            Notification Preferences
            {inQuietHours && (
              <Badge variant="secondary" className="ml-2 bg-purple-100 text-purple-700 border-purple-200">
                <Moon className="w-3 h-3 mr-1" weight="fill" />
                Quiet Hours Active
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Control when and how you receive notifications
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
                  <EnvelopeSimple className="w-4 h-4" weight="fill" />
                  Email Notifications
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Receive notifications via email
                </p>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/50">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications" className="text-sm font-medium">
                    Enable Email Notifications
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Get notified via email about task updates
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={currentPreferences.emailNotifications}
                  onCheckedChange={handleToggleEmailNotifications}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
                    <Bell className="w-4 h-4" weight="fill" />
                    Notification Types
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Choose which events trigger notifications
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEnableAll}
                    disabled={allEnabled}
                  >
                    Enable All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDisableAll}
                    disabled={allDisabled}
                  >
                    Disable All
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {notificationTypes.map((type) => (
                  <div
                    key={type.key}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-0.5">
                        {type.icon}
                      </div>
                      <div className="space-y-0.5 flex-1">
                        <Label
                          htmlFor={`notification-${type.key}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {type.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {type.description}
                        </p>
                      </div>
                    </div>
                    <Switch
                      id={`notification-${type.key}`}
                      checked={currentPreferences.enabledNotifications[type.key]}
                      onCheckedChange={(checked) => handleToggleNotificationType(type.key, checked)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
                  <ClockCountdown className="w-4 h-4" weight="fill" />
                  Notification Frequency
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Control how often you receive notifications
                </p>
              </div>
              <div className="rounded-lg border p-4 bg-muted/50">
                <Label htmlFor="frequency" className="text-sm font-medium mb-2 block">
                  Delivery Frequency
                </Label>
                <Select
                  value={currentPreferences.notificationFrequency}
                  onValueChange={handleChangeFrequency}
                >
                  <SelectTrigger id="frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instant">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Instant</span>
                        <span className="text-xs text-muted-foreground">
                          Get notified immediately
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="daily">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Daily Digest</span>
                        <span className="text-xs text-muted-foreground">
                          Once per day summary
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="weekly">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Weekly Digest</span>
                        <span className="text-xs text-muted-foreground">
                          Once per week summary
                        </span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
                  <Moon className="w-4 h-4 text-purple-600" weight="fill" />
                  Quiet Hours
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Pause notifications during specific hours (like sleep times)
                </p>
              </div>
              
              <div className="space-y-4 rounded-lg border p-4 bg-gradient-to-br from-purple-50/50 to-blue-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="quiet-hours" className="text-sm font-medium">
                      Enable Quiet Hours
                    </Label>
                    {inQuietHours && (
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
                        Active Now
                      </Badge>
                    )}
                  </div>
                  <Switch
                    id="quiet-hours"
                    checked={currentPreferences.quietHours.enabled}
                    onCheckedChange={handleToggleQuietHours}
                  />
                </div>
                
                {currentPreferences.quietHours.enabled && (
                  <>
                    <div className="pt-2 space-y-3">
                      <div className="text-xs font-medium text-muted-foreground">
                        Quick Presets
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {quietHoursPresets.map((preset) => (
                          <Button
                            key={preset.label}
                            variant="outline"
                            size="sm"
                            onClick={() => handleApplyPreset(preset)}
                            className="h-auto py-2 px-3 text-left justify-start"
                          >
                            <div className="flex flex-col items-start w-full">
                              <span className="text-xs font-medium">{preset.label.split('(')[0].trim()}</span>
                              <span className="text-xs text-muted-foreground">{preset.start} - {preset.end}</span>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>

                    <Separator className="bg-purple-200/50" />

                    <div className="space-y-3">
                      <div className="text-xs font-medium text-muted-foreground">
                        Custom Time Range
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="start-time" className="text-xs">
                            Start Time
                          </Label>
                          <input
                            id="start-time"
                            type="time"
                            value={currentPreferences.quietHours.startTime}
                            onChange={(e) => handleChangeQuietHours('startTime', e.target.value)}
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="end-time" className="text-xs">
                            End Time
                          </Label>
                          <input
                            id="end-time"
                            type="time"
                            value={currentPreferences.quietHours.endTime}
                            onChange={(e) => handleChangeQuietHours('endTime', e.target.value)}
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground bg-purple-50 border border-purple-200 rounded p-2">
                        <Moon className="w-3 h-3 inline mr-1" weight="fill" />
                        Notifications will be paused from {currentPreferences.quietHours.startTime} to {currentPreferences.quietHours.endTime}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
