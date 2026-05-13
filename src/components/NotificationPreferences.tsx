import { useState, useMemo } from 'react';
import { useKV } from '@github/spark/hooks';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
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


  emailNotificati
 

    task_due_soon: true,
    task_completed: true,
    task_priority_changed
  },
  emailSchedule: {
    digestFrequency: 'd
    digestDays: [1, 2, 
    groupByTask: true,
  },
    enabled: false,
    endTime: '08:00',
  soundEnabled: true,
};
cons
  { label: 'Early Bird (9 PM - 6 AM
  { label: 'Workin

  const now = new Date();
  const [startHour, star
  const start = startHour * 60 +
  
    return currentTime
    return currentTime >= start ||
}
export function
    `notification-p
  );

    
    ...preferences,
      ...defaultPre
  

    },
      ...defaultPreferences.enabledNotifications,
    }
  
    if (!currentPreferences.quietHours.enabled) return false;
  

      ...(current || { ...defaultPreferences, userId }),
    }));
  };
  const handleToggleNotificationType = (type: keyof NotificationP
      ...(current || { ...defaultPreferences, userId }),
        ...(current?.enabledNotifications 
      },
  
  const handleChange
      ...(current || { ...defaultPreferences, userId 
    }));
  };
  c
 

      },
    toast.success(checked ? 'Quiet hours enabled - notifications paused dur

    setPreferences((current) => ({
    
        [field]: value,


    setPreferences((curren
      quiet
        startTime: 
      },
    toast.success(`Quiet hours set: ${pres

    se
      enabledNoti
        task_reassigned: true,
        task_comment: true,
      
        task_status_changed
        mention: true,
    }));
  };
  };
  
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
                        .
                    </div>
                )}
            </div>
            <Separator />
            <div className="space-y-4">
                <h3 className="text-sm font-semibo
                  Notification 
                <p className
                </p>
              
                <div className="flex items-center justify-between
                    <Label htmlFor="sound-enabled" className="text-sm fon
                    </Label>
                      <Badge variant="secondar
                        Muted
                    )}
                  <Switch
                    checked={currentPreferences
                  />
                
                  <>
                    
                      <div clas
                          Vo
                        <span cla
                        </span>
                      <Sl
                    
                  

                      />

                    
                   
                      </div>
                        {notificationTypes.slice(0, 6).map((type) => (
                            key={type.key
                     
                            className="h-auto py-2 px-3 text-left 
                            <div className="flex items-center gap-2 w-full"
                    
                    
              
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <Separator />
            <div className="space-y-4">
                <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
                  Quiet Hours
                <p className="
                </p>
              
                <div cla
                    <Labe
                    </Label>
                      <Badge variant="secondary" className="bg-purple-100 te
                      </Badge>
                  </
                    id
                
                </div>
                {cur
                    <div className="pt-2 space-y-3">
                    
                      <div className="grid grid
                          <Button
                            variant="out
                            on
                          >
                              <span className="text-xs font-medium">{preset.labe
                            </div>
                       
                    </div>
                    <Separator className=
                    <div className="spac
                        Custom Time Ran
                      <div className="grid grid-cols
                          <Label htmlFor="start-time" className="text-x
                          </Label>
                            id="start-time"
                            value={currentPreferences.qu
                            className
                        </div>
                          <Label htmlFo
                          </Label>
                            id="end-time"
                            value={currentPreferences.quietHours.endTime}
                            className="flex h-9 w-full rounded-md border borde
                        </div>
                      <div className=
                        Notificati
                    </div>
                )}
            </div>
        </ScrollArea>
        <div className="flex justify-end gap-2 pt-4 border-t">
            Close
        </div>
    </Dialog>
}






























































































































































































































































































































































