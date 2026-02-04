# QR Code Scanning Guide - Word of Covenant Church Mobile App

## Overview
The app supports QR code scanning for two main features:
1. **Attendance Tracking** - Members scan QR codes to mark their attendance at services
2. **First Timer Registration** - New visitors scan QR codes to register as first-timers

## How to Scan QR Codes

### Method 1: Scan Attendance (Regular Members)
1. **Open the App** and log in
2. **Navigate to Attendance Screen** in one of these ways:
   - Tap **"Attendance"** quick action button on Home screen (✅ icon)
   - Go to Profile → Scan Attendance
   - Or tap the Notifications icon if you received an attendance reminder

3. **Grant Camera Permission** (first time only)
   - The app will ask: "Allow access to camera?"
   - Tap **"Allow"** or **"OK"**

4. **Scan the QR Code**
   - Point your phone's camera at the QR code displayed on screen/projector
   - Keep the QR code within the frame shown on screen
   - The app will automatically scan when the code is detected
   - You'll see a success message: "Attendance marked successfully!"

5. **View Your Attendance**
   - After scanning, your attendance is recorded in the system
   - You can view your attendance history in Dashboard

### Method 2: Scan First Timer (For New Visitors)
1. **Open the App** and navigate to:
   - Profile → Scan First Timer
   - Or use the FirstTimerQR screen

2. **Grant Camera Permission** (if not already granted)

3. **Scan the QR Code** provided by church staff

4. **Fill Registration Form**
   - After scanning, you'll be taken to registration form
   - Enter: Full Name, Phone, Email, Address
   - Submit to complete registration

## For Church Admins: Generate QR Codes

### Generate Attendance QR Code
1. Go to **Profile → Generate QR Code**
2. Select:
   - **Event Type**: Sunday Service, Bible Study, Prayer Meeting, etc.
   - **Date**: Select the service date
   - **Time**: Select service time
3. Tap **"Generate QR Code"**
4. The QR code will appear on screen
5. **Display Options**:
   - Show on projector/screen for members to scan
   - Share via WhatsApp/Email to send to members
   - Save to device gallery

### View Attendance Reports
1. Go to **Profile → Attendance Report**
2. Select date range
3. View:
   - Total attendance count
   - List of members who attended
   - Download CSV report

## Troubleshooting

### Camera Not Working
**Problem**: Camera shows black screen or doesn't open
**Solution**:
1. Go to phone Settings → Apps → Word of Covenant Church
2. Tap **Permissions** → Camera
3. Select **Allow** or **While using the app**
4. Restart the app

### QR Code Not Scanning
**Problem**: Camera opens but doesn't scan the QR code
**Solution**:
1. **Check Lighting**: Ensure good lighting on the QR code
2. **Distance**: Move closer or farther from the QR code (10-30 cm is ideal)
3. **Focus**: Keep your phone steady for 2-3 seconds
4. **Clean Camera**: Wipe your phone's camera lens
5. **QR Code Size**: Make sure QR code is large enough and clear

### Permission Denied
**Problem**: App says "Camera permission denied"
**Solution**:
1. Go to Settings → Apps → Word of Covenant Church → Permissions
2. Enable Camera permission
3. Return to app and try again

### Scan Success but No Confirmation
**Problem**: QR code scanned but no success message
**Solution**:
1. Check your internet connection
2. Try scanning again
3. If problem persists, use Manual Attendance option:
   - Profile → Manual Attendance
   - Enter your details manually

## Alternative: Manual Attendance
If QR scanning isn't working, you can mark attendance manually:

1. Go to **Profile → Manual Attendance**
2. Select:
   - Event Type
   - Date
   - Time
3. Tap **"Submit Attendance"**
4. Wait for confirmation

## Technical Details

### Camera Requirements
- **Android**: Android 8.0+ with working rear camera
- **iOS**: iOS 13+ with working rear camera
- **Permissions**: Camera access required

### QR Code Format
- Type: QR Code (2D barcode)
- Data: JSON format containing:
  - `eventId`: Unique event identifier
  - `eventType`: Type of service
  - `date`: Service date
  - `time`: Service time

### Network Requirements
- Active internet connection (WiFi or Mobile Data)
- Server must be running and accessible
- Backend API: `http://localhost:5000/api/attendance`

## Features

### Attendance Tracking
✅ Real-time attendance marking
✅ Prevents duplicate check-ins
✅ Tracks timestamp of attendance
✅ Links to user profile
✅ Generates attendance reports

### First Timer Registration
✅ Quick registration via QR scan
✅ Captures contact information
✅ Notifies church admin
✅ Creates new member profile
✅ Sends welcome message

## Support
If you continue to have issues:
1. Contact Church IT Support
2. Use Help & Support in Profile menu
3. Call Church Office: [Add phone number]
4. Email: [Add support email]

---

**Last Updated**: January 25, 2026
**App Version**: 1.0.0
