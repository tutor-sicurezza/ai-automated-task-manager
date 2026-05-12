# TaskFlow - Task Management System

A comprehensive collaborative task management system with AI-powered features, department management, role-based access control, and live email notifications.

## 🚀 Features

### Core Features
- ✅ Task creation, assignment, and tracking
- ✅ Bulk operations (status updates, assignments)
- ✅ Comments and activity history
- ✅ File attachments
- ✅ Advanced filtering and sorting

### Team & Organization
- ✅ User management with role-based permissions
- ✅ Department management with multi-department support
- ✅ Team performance analytics
- ✅ Department-wide announcements

### AI-Powered
- ✅ AI task assistant
- ✅ Intelligent auto-assignment
- ✅ Task duration estimates
- ✅ Performance insights

### Notifications
- ✅ In-app notifications with sound
- ✅ Desktop notifications (browser)
- ✅ **Live email delivery via SendGrid/Resend**
- ✅ Notification preferences per user
- ✅ Quiet hours support

### Admin Features
- ✅ Super admin system settings
- ✅ Role management (Super Admin, Department Admin, User)
- ✅ Email template customization
- ✅ **SendGrid email integration with SMTP**
- ✅ Email delivery analytics
- ✅ Data backup and restore
- ✅ Audit logging

## 📧 Email Integration

TaskFlow supports live email delivery through SendGrid or Resend for professional email notifications.

### Quick Setup (5 minutes)
1. Create free SendGrid account (100 emails/day)
2. Generate API key
3. Verify sender email
4. Configure in Super Admin Settings → Email
5. Test and enable

### Documentation
- **Quick Start**: See `SENDGRID_QUICKSTART.md`
- **Full Guide**: See `SENDGRID_INTEGRATION_GUIDE.md`
- **SMTP Setup**: See `SMTP_SETUP_GUIDE.md`

### Email Notifications
Users receive emails for:
- Task assignments and changes
- Comments and mentions
- Due date reminders
- Department announcements

## 🛠️ Setup & Configuration

### Environment Variables

```bash
# Required
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Email (Optional - configure in UI)
SENDGRID_API_KEY=your_sendgrid_key
# OR
RESEND_API_KEY=your_resend_key

# Application
APP_URL=https://your-domain.com
```

### Database Setup
See `DATABASE_SETUP_GUIDE.md` for Supabase configuration

### First Time Setup
1. Deploy the application
2. Log in and set your role to "super-admin"
3. Configure system settings
4. Set up email integration
5. Add departments and users
6. Start creating tasks!

## 👥 User Roles

### Super Admin
- Full system access
- Configure email integration
- Manage all users and departments
- View all analytics
- System-wide settings

### Department Admin
- Manage department members
- View department analytics
- Create department announcements
- Assign tasks within department

### User (Member)
- Create and manage own tasks
- View assigned tasks
- Comment and collaborate
- Receive notifications

## 📊 Analytics

- Task completion rates
- Workload distribution
- Department performance
- Individual productivity metrics
- Email delivery statistics

## 🔐 Security

- Role-based access control
- Audit logging
- Secure API endpoints
- Environment variable protection
- Session management

## 📱 Responsive Design

- Desktop-optimized interface
- Mobile-responsive layouts
- Touch-friendly controls
- Adaptive navigation

## 🎨 Customization

- Email template customization
- Theme configuration
- Notification preferences
- Department color coding

## 📚 Documentation

- `PRD.md` - Product requirements and features
- `SENDGRID_INTEGRATION_GUIDE.md` - Complete email setup guide
- `SENDGRID_QUICKSTART.md` - 5-minute setup guide
- `SMTP_SETUP_GUIDE.md` - Detailed SMTP configuration
- `DATABASE_SETUP_GUIDE.md` - Supabase setup
- `INTERNAL_DOCS_README.md` - Internal documentation
- `SECURITY_CHECKLIST.md` - Security guidelines

## 🐛 Troubleshooting

### Emails Not Sending
1. Check email service is enabled (System Settings → Email)
2. Verify API key is correct
3. Confirm sender email is verified
4. Check email statistics for errors

### Users Disappearing
- Data persists in Supabase
- Never cleared unless explicitly exported/imported
- Check database connection

### Permission Issues
- Verify user role in database
- Super admin role: `role = 'super-admin'`
- Check role management in settings

## 🔄 Data Management

### Backup
- Export all data as JSON
- Includes tasks, users, settings, logs
- Timestamped filenames

### Restore
- Import from previous backup
- Validates data format
- Overwrites existing data

### Clear Data
- Requires double confirmation
- Cannot be undone
- Use with caution

## 🚦 Going Live

1. ✅ Set up Supabase database
2. ✅ Configure environment variables
3. ✅ Set up SendGrid email
4. ✅ Verify DNS records (domain auth)
5. ✅ Configure system settings
6. ✅ Add departments and users
7. ✅ Test all features
8. ✅ Enable email notifications
9. ✅ Deploy to production

## 🤝 Support

For setup assistance:
1. Review relevant documentation
2. Check browser console for errors
3. Verify environment variables
4. Test email delivery
5. Review audit logs

## 📄 License

The Spark Template files and resources from GitHub are licensed under the terms of the MIT license, Copyright GitHub, Inc.

---

**Built with:** React, TypeScript, Tailwind CSS, shadcn/ui, Supabase, SendGrid
**AI Powered by:** OpenAI GPT-4
**Email Delivery:** SendGrid / Resend
