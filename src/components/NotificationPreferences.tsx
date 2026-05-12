import { useState, useMemo } from 'react';
import { useKV } from '@github/spark/hooks';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Gear, EnvelopeSimple, Bell, ClockCountdown, User, ArrowsClockwise, FlagBanner, ChatCircle, CheckCircle, WarningCircle, Moon, SpeakerHigh, SpeakerX, Calendar, Package, ListChecks } from '@phosphor-icons/react';
import { NotificationPreferences as NotificationPreferencesType, NotificationType } from '@/lib/types';
import { playNotificationSound, getSoundDescription } from '@/lib/notificationSounds';
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
  emailSchedule: {
    digestEnabled: false,
    digestFrequency: 'daily',
    digestTime: '09:00',
    digestDays: [1, 2, 3, 4, 5],
    includeOnlyUnread: true,
    groupByTask: true,
    maxNotificationsPerDigest: 50,
  },
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '08:00',
  },
  soundEnabled: true,
  soundVolume: 0.3,
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

  const handleToggleSound = (checked: boolean) => {
    setPreferences((current) => ({
      ...(current || { ...defaultPreferences, userId }),
      soundEnabled: checked,
    }));
    toast.success(checked ? 'Notification sounds enabled' : 'Notification sounds muted');
  };

  const handleChangeVolume = (value: number[]) => {
    setPreferences((current) => ({
      ...(current || { ...defaultPreferences, userId }),
      soundVolume: value[0],
    }));
  };

  const handleTestSound = async (notificationType: NotificationType) => {
    await playNotificationSound(notificationType, currentPreferences.soundVolume);
    toast.success(`Playing ${getSoundDescription(notificationType)}`);
  };

  const handleToggleDigest = (checked: boolean) => {
    setPreferences((current) => ({
      ...(current || { ...defaultPreferences, userId }),
      emailSchedule: {
        ...(current?.emailSchedule || defaultPreferences.emailSchedule),
        digestEnabled: checked,
      },
    }));
    toast.success(checked ? 'Email digest enabled' : 'Email digest disabled');
  };

  const handleChangeDigestFrequency = (frequency: NotificationPreferencesType['emailSchedule']['digestFrequency']) => {
    setPreferences((current) => ({
      ...(current || { ...defaultPreferences, userId }),
      emailSchedule: {
        ...(current?.emailSchedule || defaultPreferences.emailSchedule),
        digestFrequency: frequency,
      },
    }));
    toast.success(`Digest frequency set to ${frequency}`);
  };

  const handleChangeDigestTime = (time: string) => {
    setPreferences((current) => ({
      ...(current || { ...defaultPreferences, userId }),
      emailSchedule: {
        ...(current?.emailSchedule || defaultPreferences.emailSchedule),
        digestTime: time,
      },
    }));
  };

  const handleToggleDigestDay = (day: number) => {
    setPreferences((current) => {
      const currentDays = current?.emailSchedule?.digestDays || defaultPreferences.emailSchedule.digestDays;
      const newDays = currentDays.includes(day)
        ? currentDays.filter(d => d !== day)
        : [...currentDays, day].sort((a, b) => a - b);
      
      return {
        ...(current || { ...defaultPreferences, userId }),
        emailSchedule: {
          ...(current?.emailSchedule || defaultPreferences.emailSchedule),
          digestDays: newDays,
        },
      };
    });
  };

  const handleToggleIncludeOnlyUnread = (checked: boolean) => {
    setPreferences((current) => ({
      ...(current || { ...defaultPreferences, userId }),
      emailSchedule: {
        ...(current?.emailSchedule || defaultPreferences.emailSchedule),
        includeOnlyUnread: checked,
      },
    }));
  };

  const handleToggleGroupByTask = (checked: boolean) => {
    setPreferences((current) => ({
      ...(current || { ...defaultPreferences, userId }),
      emailSchedule: {
        ...(current?.emailSchedule || defaultPreferences.emailSchedule),
        groupByTask: checked,
      },
    }));
  };

  const handleChangeMaxNotifications = (value: number[]) => {
    setPreferences((current) => ({
      ...(current || { ...defaultPreferences, userId }),
      emailSchedule: {
        ...(current?.emailSchedule || defaultPreferences.emailSchedule),
        maxNotificationsPerDigest: value[0],
      },
    }));
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
                  <Calendar className="w-4 h-4 text-teal-600" weight="fill" />
                  Email Digest Scheduling
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Configure scheduled email summaries of your notifications
                </p>
              </div>
              
              <div className="space-y-4 rounded-lg border p-4 bg-gradient-to-br from-teal-50/50 to-cyan-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="digest-enabled" className="text-sm font-medium">
                      Enable Email Digests
                    </Label>
                    {currentPreferences.emailSchedule.digestEnabled && (
                      <Badge variant="secondary" className="bg-teal-100 text-teal-700 border-teal-200 text-xs">
                        <Package className="w-3 h-3 mr-1" weight="fill" />
                        Active
                      </Badge>
                    )}
                  </div>
                  <Switch
                    id="digest-enabled"
                    checked={currentPreferences.emailSchedule.digestEnabled}
                    onCheckedChange={handleToggleDigest}
                  />
                </div>
                
                {currentPreferences.emailSchedule.digestEnabled && (
                  <>
                    <Separator className="bg-teal-200/50" />
                    
                    <div className="space-y-3">
                      <Label htmlFor="digest-frequency" className="text-sm font-medium">
                        Digest Frequency
                      </Label>
                      <Select
                        value={currentPreferences.emailSchedule.digestFrequency}
                        onValueChange={handleChangeDigestFrequency}
                      >
                        <SelectTrigger id="digest-frequency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">
                            <div className="flex flex-col items-start">
                              <span className="font-medium">Daily</span>
                              <span className="text-xs text-muted-foreground">
                                Receive digest every day
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value="weekly">
                            <div className="flex flex-col items-start">
                              <span className="font-medium">Weekly</span>
                              <span className="text-xs text-muted-foreground">
                                Once per week on selected days
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value="biweekly">
                            <div className="flex flex-col items-start">
                              <span className="font-medium">Bi-weekly</span>
                              <span className="text-xs text-muted-foreground">
                                Every two weeks
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value="monthly">
                            <div className="flex flex-col items-start">
                              <span className="font-medium">Monthly</span>
                              <span className="text-xs text-muted-foreground">
                                Once per month
                              </span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator className="bg-teal-200/50" />

                    <div className="space-y-3">
                      <Label htmlFor="digest-time" className="text-sm font-medium">
                        Delivery Time
                      </Label>
                      <input
                        id="digest-time"
                        type="time"
                        value={currentPreferences.emailSchedule.digestTime}
                        onChange={(e) => handleChangeDigestTime(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      />
                      <p className="text-xs text-muted-foreground">
                        Digests will be sent at {currentPreferences.emailSchedule.digestTime}
                      </p>
                    </div>

                    {(currentPreferences.emailSchedule.digestFrequency === 'weekly' || 
                      currentPreferences.emailSchedule.digestFrequency === 'biweekly') && (
                      <>
                        <Separator className="bg-teal-200/50" />
                        
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">
                            Days of Week
                          </Label>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { day: 0, label: 'Sun' },
                              { day: 1, label: 'Mon' },
                              { day: 2, label: 'Tue' },
                              { day: 3, label: 'Wed' },
                              { day: 4, label: 'Thu' },
                              { day: 5, label: 'Fri' },
                              { day: 6, label: 'Sat' },
                            ].map(({ day, label }) => (
                              <Button
                                key={day}
                                type="button"
                                variant={currentPreferences.emailSchedule.digestDays.includes(day) ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleToggleDigestDay(day)}
                                className="w-12"
                              >
                                {label}
                              </Button>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Select days to receive your digest
                          </p>
                        </div>
                      </>
                    )}

                    <Separator className="bg-teal-200/50" />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-lg border p-3 bg-background/50">
                        <div className="space-y-0.5">
                          <Label htmlFor="include-unread" className="text-sm font-medium">
                            Unread Only
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Include only unread notifications
                          </p>
                        </div>
                        <Switch
                          id="include-unread"
                          checked={currentPreferences.emailSchedule.includeOnlyUnread}
                          onCheckedChange={handleToggleIncludeOnlyUnread}
                        />
                      </div>

                      <div className="flex items-center justify-between rounded-lg border p-3 bg-background/50">
                        <div className="space-y-0.5">
                          <Label htmlFor="group-by-task" className="text-sm font-medium">
                            Group by Task
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Organize notifications by task
                          </p>
                        </div>
                        <Switch
                          id="group-by-task"
                          checked={currentPreferences.emailSchedule.groupByTask}
                          onCheckedChange={handleToggleGroupByTask}
                        />
                      </div>
                    </div>

                    <Separator className="bg-teal-200/50" />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="max-notifications" className="text-sm font-medium">
                          Max Notifications per Digest
                        </Label>
                        <span className="text-xs text-muted-foreground">
                          {currentPreferences.emailSchedule.maxNotificationsPerDigest}
                        </span>
                      </div>
                      <Slider
                        id="max-notifications"
                        min={10}
                        max={100}
                        step={10}
                        value={[currentPreferences.emailSchedule.maxNotificationsPerDigest]}
                        onValueChange={handleChangeMaxNotifications}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Limit the number of notifications included in each digest
                      </p>
                    </div>

                    <div className="text-xs bg-teal-50 border border-teal-200 rounded p-3 space-y-1">
                      <div className="font-medium text-teal-900 flex items-center gap-1">
                        <ListChecks className="w-3 h-3" weight="fill" />
                        Summary
                      </div>
                      <div className="text-teal-700">
                        You'll receive a {currentPreferences.emailSchedule.digestFrequency} digest at {currentPreferences.emailSchedule.digestTime}
                        {currentPreferences.emailSchedule.digestFrequency === 'weekly' && 
                          currentPreferences.emailSchedule.digestDays.length > 0 && (
                            <> on {currentPreferences.emailSchedule.digestDays.map(d => 
                              ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d]
                            ).join(', ')}</>
                          )}
                        {currentPreferences.emailSchedule.includeOnlyUnread && ', including only unread notifications'}
                        .
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
                  <SpeakerHigh className="w-4 h-4 text-blue-600" weight="fill" />
                  Notification Sounds
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Customize audio alerts for different notification types
                </p>
              </div>
              
              <div className="space-y-4 rounded-lg border p-4 bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="sound-enabled" className="text-sm font-medium">
                      Enable Notification Sounds
                    </Label>
                    {!currentPreferences.soundEnabled && (
                      <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200 text-xs">
                        <SpeakerX className="w-3 h-3 mr-1" weight="fill" />
                        Muted
                      </Badge>
                    )}
                  </div>
                  <Switch
                    id="sound-enabled"
                    checked={currentPreferences.soundEnabled}
                    onCheckedChange={handleToggleSound}
                  />
                </div>
                
                {currentPreferences.soundEnabled && (
                  <>
                    <Separator className="bg-blue-200/50" />
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="volume-slider" className="text-sm font-medium">
                          Volume
                        </Label>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(currentPreferences.soundVolume * 100)}%
                        </span>
                      </div>
                      <Slider
                        id="volume-slider"
                        min={0}
                        max={1}
                        step={0.1}
                        value={[currentPreferences.soundVolume]}
                        onValueChange={handleChangeVolume}
                        className="w-full"
                      />
                    </div>

                    <Separator className="bg-blue-200/50" />
                    
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-muted-foreground mb-2">
                        Test Notification Sounds
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {notificationTypes.slice(0, 6).map((type) => (
                          <Button
                            key={type.key}
                            variant="outline"
                            size="sm"
                            onClick={() => handleTestSound(type.key)}
                            className="h-auto py-2 px-3 text-left justify-start"
                          >
                            <div className="flex items-center gap-2 w-full">
                              {type.icon}
                              <div className="flex flex-col items-start flex-1">
                                <span className="text-xs font-medium">{type.label}</span>
                                <span className="text-[10px] text-muted-foreground">
                                  {getSoundDescription(type.key)}
                                </span>
                              </div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
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
