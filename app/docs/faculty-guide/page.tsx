import { DocsPageWrapper } from "@/components/DocsPageWrapper";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Faculty Guide - Faculty Doorcard System",
  description: "Complete user guide for faculty members using the Faculty Doorcard System. Learn how to create doorcards, manage office hours, and customize your profile.",
  keywords: ["faculty guide", "doorcard creation", "office hours", "profile management", "SMCCD"],
};

const facultyGuideContent = `
# Faculty Guide: Creating Your Digital Doorcard

*A simple guide to share your office hours with students*

---

## What You'll Learn

In 10 minutes, you'll know how to:
- Set up your profile 
- Create your first doorcard
- Add your office hours
- Share it with students

---

## Step 1: Set Up Your Profile (2 minutes)

When you first log in, you'll see a welcome popup. This is where you tell the system who you are.

### Choose How Students See Your Name

Pick the format that feels right to you:

| Format | Example |
|--------|---------|
| **Full Name** | Bryan Besnyi |
| **With Title** | Dr. Bryan Besnyi |
| **With Pronouns** | Dr. Bryan Besnyi (they/them) |
| **Short Form** | Dr. B Besnyi |

> **Tip**: Don't worry - you can change this anytime in your profile!

### Select Your Campus
- Skyline College
- College of San Mateo (CSM)  
- Cañada College

---

## Step 2: Create Your First Doorcard (3 minutes)

Think of a doorcard as your digital office door. Students will see it to find your office hours.

### Starting a New Doorcard

1. **Go to your dashboard** - you'll see it after logging in
2. **Click "Create New Doorcard"** - the big blue button
3. **Fill in your office number** - like "Building 5, Room 120" or just "Office 302"

That's it! Your name and campus are filled in automatically.

---

## Step 3: Add Your Office Hours (4 minutes)

This is where you tell students when you're available to help them.

### Adding Office Hours is Easy

1. **Click "Add Time Block"**
2. **Select your days** - check Monday, Wednesday, Friday (for example)
3. **Set your times** - like 2:00 PM to 4:00 PM
4. **Choose the type**:
   - **Office Hours** = when students can visit you
   - **Class Time** = when you're teaching (students see "unavailable")
   - **Meeting** = when you have appointments

### Example: Typical Office Hours Setup

\`\`\`
Monday & Wednesday: 1:00 PM - 3:00 PM (Office Hours)
Tuesday & Thursday: 10:00 AM - 11:30 AM (Class Time)
Friday: 2:00 PM - 3:00 PM (Office Hours)
\`\`\`

### Need Multiple Time Blocks?

No problem! You can add as many as you need:
- Different days
- Different times  
- Mix of office hours and class times

---

## Step 4: Publish & Share (1 minute)

### Make It Live for Students

1. **Preview your doorcard** - see how students will see it
2. **Click "Publish"** when you're happy with it
3. **Copy the link** and share it with your students

### Ways to Share Your Doorcard

- **Email the link** to your students
- **Post it on your course website**
- **Add it to your syllabus**
- **Share it in class announcements**

---

## Making Changes (Super Easy!)

Need to update your hours? No problem!

### Quick Updates
1. Go to your dashboard
2. Click "Edit" on your doorcard
3. Make your changes
4. Save - students see updates immediately!

### Draft vs. Published
- **Draft** = you're working on it (students can't see it)
- **Published** = live for students to view

---

## What Students See

When students visit your doorcard, they see:

- **Your office location**
- **Today's office hours**  
- **How to contact you**
- **Your website** (if you added one)
- **Your campus**

The design is clean and mobile-friendly - works great on phones!

---

## Pro Tips for Success

### Do This
- **Keep it simple** - students just need to know when to find you
- **Update regularly** - especially if your schedule changes
- **Be realistic** - only post hours you can actually keep
- **Check on mobile** - many students will view it on their phones

### Avoid This  
- **Overly complex schedules** - keep it straightforward
- **Forgetting to publish** - students can't see draft doorcards
- **Not updating** - outdated info frustrates students

---

## Need Help?

### Quick Fixes

**Can't log in?**
- Try your SMCCD username and password
- Contact your campus IT if still having trouble

**Changes not saving?**
- Make sure all required fields are filled in
- Try refreshing the page and trying again

**Students can't see your doorcard?**
- Check that it's published (not in draft mode)
- Make sure you shared the correct link

### Get Support
- **Campus IT Help Desk** - for login and technical issues
- **System Administrator** - for questions about features

---

## You're Ready!

That's it! You now know everything you need to create and manage your digital doorcard. Your students will appreciate having easy access to your office hours.

**Remember**: The goal is to make it simple for students to find you when they need help. Keep it straightforward, keep it updated, and you're all set!

---

*Questions? Contact your campus IT support team.*
`;

export default function FacultyGuidePage() {
  return (
    <DocsPageWrapper content={facultyGuideContent} showToc={true} />
  );
}