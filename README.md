# Job Alert Discord Bot

This project scrapes job listings from multiple websites (LinkedIn, Bayt, NaukriGulf, and Indeed) for job roles like "MERN Stack Developer" or "Full Stack Developer." The bot sends the latest job postings to a specified Discord channel at regular intervals.

## Features

- Scrapes job listings from popular job platforms:
  - LinkedIn
  - Bayt
  - NaukriGulf
  - Indeed
- Filters job postings by keywords such as "MERN", "React", "Node", "Full Stack", etc.
- Sends new job alerts to a Discord channel every 30 minutes.
- Utilizes a Cron job to schedule regular job check intervals.

## Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/job-alert-discord-bot.git
   cd job-alert-discord-bot
