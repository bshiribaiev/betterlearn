# BetterLearn

Spaced repetition app for LeetCode problems and system design quizzes. Uses SM-2 algorithm for scheduling, Gemini for quiz generation.

## Tech Stack

- **Backend:** Java 24, Spring Boot 3, Spring Security + JWT, Spring Data JPA, Flyway
- **Frontend:** Angular 19, Tailwind CSS
- **Database:** PostgreSQL 16
- **LLM:** Google Gemini 2.5 Flash

## Development Setup

```bash
# Start Postgres
docker compose -f docker-compose.dev.yml up -d

# Backend (port 8080)
cd backend
cp .env.example .env  # add your GEMINI_API_KEY
./mvnw spring-boot:run

# Frontend (port 4200, proxies /api to backend)
cd frontend
npm install
ng serve
```

## Production (Docker)

```bash
cp .env.example .env  # fill in all values
docker compose up --build
```

App available at `http://localhost:4200`. API docs at `http://localhost:4200/swagger-ui/index.html`.

## Project Structure

```
backend/src/main/java/com/betterlearn/
  auth/         Auth + JWT
  leetcode/     LeetCode problem tracker
  quiz/         Quiz module + Gemini integration
  dashboard/    Combined dashboard
  srs/          SM-2 algorithm
  config/       Security, CORS, Gemini config

frontend/src/app/
  core/         Interceptors, guards, auth service
  features/     auth/, dashboard/, leetcode/, quiz/
  shared/       Navbar, toast, pipes
```
