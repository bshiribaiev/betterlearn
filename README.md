[![Contributors](https://img.shields.io/github/contributors/bshiribaiev/betterlearn.svg?style=for-the-badge)](https://github.com/bshiribaiev/betterlearn/graphs/contributors)
[![Stars](https://img.shields.io/github/stars/bshiribaiev/betterlearn.svg?style=for-the-badge)](https://github.com/bshiribaiev/betterlearn/stargazers)
[![Issues](https://img.shields.io/github/issues/bshiribaiev/betterlearn.svg?style=for-the-badge)](https://github.com/bshiribaiev/betterlearn/issues)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-blue?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/shiribaiev/)

<div align="center">
  <img src="frontend/public/favicon.svg" alt="BetterLearn" width="80" height="80"/>
  <h3>BetterLearn</h3>
  <p>Spaced repetition learning app with notes, AI-generated quizzes/flashcards, and LeetCode tracking.<br/>Built to actually retain what you study.</p>
  <a href="https://betterlearn.app" target="_blank">Visit</a> ·
  <a href="https://github.com/bshiribaiev/betterlearn/issues">Report Bug</a> ·
  <a href="https://github.com/bshiribaiev/betterlearn/issues">Request Feature</a>
</div>

<br/>

<div align="center">
  <img src="walkthrough.gif" alt="Walkthrough" width="700"/>
</div>

<details>
  <summary>Table of Contents</summary>

  - [About the Project](#about-the-project)
  - [Built With](#built-with)
  - [Architecture](#architecture)
  - [Getting Started](#getting-started)
  - [API](#api)
</details>

## About the Project

BetterLearn is a full-stack spaced repetition app that helps you retain what you study. Instead of cramming, it uses the SM-2 algorithm (same as Anki) to schedule reviews at optimal intervals.

- Take notes on any topic, and Gemini generates quizzes from your content
- Define terms in your notes and review them as flashcards
- Track LeetCode problems with automatic review scheduling
- Add vocabulary words with AI-generated definitions
- One dashboard shows everything due today across all modules

## Architecture

![System Architecture](system-architecture.png)

## Built With

* [![Angular](https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.dev/)
* [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
* [![Java](https://img.shields.io/badge/Java-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://openjdk.org/)
* [![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)](https://spring.io/projects/spring-boot)
* [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
* [![Google Gemini](https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
* [![AWS](https://img.shields.io/badge/AWS-232F3E?style=for-the-badge&logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)
* [![Flyway](https://img.shields.io/badge/Flyway-CC0200?style=for-the-badge&logo=flyway&logoColor=white)](https://flywaydb.org/)

## Getting Started

### Prerequisites

* Java 21+
* Node.js 18+
* Docker (for PostgreSQL)

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/bshiribaiev/betterlearn.git
   ```
2. Start PostgreSQL
   ```sh
   docker compose -f docker-compose.dev.yml up -d
   ```
3. Set up the backend
   ```sh
   cd backend
   cp .env.example .env    # fill in GEMINI_API_KEY, Google OAuth keys
   ./mvnw spring-boot:run
   ```
4. Set up the frontend
   ```sh
   cd frontend
   npm install
   npx ng serve
   ```
5. Open [http://localhost:4200](http://localhost:4200)

## API

| Module | Endpoints |
|--------|-----------|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `GET /api/auth/google` |
| LeetCode | `GET/POST /api/leetcode`, `POST /api/leetcode/:id/review`, `PATCH /api/leetcode/:id/reschedule` |
| Quiz | `GET/POST /api/quiz/topics`, `GET/POST /api/quiz/concepts`, `POST /api/quiz/topics/:id/generate`, `POST /api/quiz/topics/:id/submit` |
| Vocabulary | `GET/POST /api/vocabulary/topics/:id/words`, `POST /api/vocabulary/words/:id/review` |
| Dashboard | `GET /api/dashboard` |

## License

Distributed under the MIT License. See `LICENSE` for more information.
