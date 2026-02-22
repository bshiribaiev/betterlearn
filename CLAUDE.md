# BetterLearn

## Code Standards
- Single Responsibility: every function/class does one thing only
- DRY: extract repeated logic immediately
- YAGNI: don't build abstractions until needed
- Small functions: ~20 lines max, rename/split if needs a comment
- Fail fast: validate inputs early, meaningful errors
- Meaningful names: no abbreviations, no `data`/`manager`
- Composition over inheritance
- Tests for all non-trivial logic

## Tech Stack
- **Backend:** Java 21, Spring Boot 3, Maven, Spring Security + JWT, Spring Data JPA, Flyway
- **Frontend:** Angular 19 (standalone components), Tailwind CSS
- **Database:** PostgreSQL 16
- **LLM:** Google Gemini 2.0 Flash
- **Dev:** Docker Compose (Postgres), native backend/frontend
- **Deploy:** AWS (later)

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Angular 19)                     │
│  ┌──────────┐  ┌──────────────┐  ┌───────────┐  ┌───────────┐  │
│  │  Auth     │  │  Dashboard   │  │ LeetCode  │  │   Quiz    │  │
│  │  Login    │  │  Due Today   │  │ Problem   │  │  Topic    │  │
│  │  Register │  │  Stats       │  │ List/Form │  │  Session  │  │
│  └──────────┘  └──────────────┘  │ Review    │  │  Results  │  │
│                                   └───────────┘  └───────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Core: AuthService, AuthInterceptor (JWT), AuthGuard      │  │
│  └────────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP (JSON) + JWT Bearer
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (Spring Boot 3 / Java 21)              │
│                                                                   │
│  ┌─────────────────── Security Filter Chain ──────────────────┐  │
│  │  JwtAuthFilter → SecurityContext                           │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ AuthController│  │LeetcodeCtrl  │  │ QuizController│          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         ▼                  ▼                  ▼                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ AuthService  │  │LeetcodeService│ │ QuizService  │          │
│  │ JwtService   │  └──────┬───────┘  └──────┬───────┘          │
│  └──────────────┘         │                  │                   │
│                           ▼                  ▼                   │
│                    ┌─────────────┐    ┌─────────────┐           │
│                    │ Sm2Service  │    │GeminiService│──────┐    │
│                    │ (pure algo) │    │(LLM client) │      │    │
│                    └─────────────┘    └─────────────┘      │    │
│                                                             │    │
│  ┌────────────────── Spring Data JPA ────────────────────┐ │    │
│  │ UserRepo │ LeetcodeRepo │ ReviewRepo │ QuizTopicRepo  │ │    │
│  └──────────┴──────────────┴────────────┴────────────────┘ │    │
└─────────────────────────────┬──────────────────────────────┘    │
                              │ JDBC                               │
                              ▼                                    │
┌─────────────────────────────────────────┐                       │
│         PostgreSQL 16                    │                       │
│  ┌───────┐ ┌──────────────┐ ┌────────┐ │                       │
│  │users  │ │leetcode_     │ │quiz_   │ │                       │
│  │       │ │problems      │ │topics  │ │                       │
│  └───────┘ │reviews       │ │sessions│ │                       │
│            └──────────────┘ └────────┘ │                       │
│  Managed by Flyway migrations          │                       │
└─────────────────────────────────────────┘                       │
                                                                   │
┌─────────────────────────────────────────┐                       │
│         Google Gemini API               │◄──────────────────────┘
│  Gemini 2.0 Flash                       │
│  Generates quiz questions (JSON)        │
└─────────────────────────────────────────┘
```

### Request Flow
```
User Action → Angular Component → Service (HTTP + JWT)
  → Spring Security Filter (validate JWT, set user context)
  → Controller (validate input, delegate)
  → Service (business logic, call Sm2Service/GeminiService)
  → Repository (JPA query)
  → PostgreSQL
  → Response bubbles back up
```

### Package Structure
Feature-based packages. Each feature owns its controller/service/repository/DTOs.

```
backend/src/main/java/com/betterlearn/
  config/       SecurityConfig, CorsConfig, GeminiConfig
  auth/         AuthController, AuthService, JwtService, DTOs
  user/         User entity, UserRepository
  leetcode/     LeetcodeProblem, LeetcodeReview, Controller, Service, DTOs
  quiz/         QuizTopic, QuizSession, Controller, Service, GeminiService, DTOs
  dashboard/    DashboardController, DashboardService
  srs/          Sm2Service (pure algorithm), Sm2Result record
  common/       GlobalExceptionHandler, BaseEntity

frontend/src/app/
  core/         interceptors/, guards/, services/auth.service.ts
  features/     auth/, dashboard/, leetcode/, quiz/
  shared/       navbar/, status-badge/, relative-date.pipe
```

## Database Tables
- `users` — email, password (bcrypt), display_name
- `leetcode_problems` — url, title, notes, SM-2 fields (easiness_factor, repetition, interval_days, next_review), status
- `leetcode_reviews` — problem_id, quality (0-5), reviewed_at
- `quiz_topics` — name, SM-2 fields, total_reviews
- `quiz_sessions` — topic_id, total/correct questions, quality, questions_json (JSONB)

## API Endpoints
### Auth
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`

### LeetCode
- `GET /api/leetcode` — all problems
- `GET /api/leetcode/due` — due today/overdue
- `POST /api/leetcode` — add problem
- `PUT /api/leetcode/{id}` — edit
- `DELETE /api/leetcode/{id}`
- `POST /api/leetcode/{id}/review` — Anki-style: Again(1)/Hard(2)/Good(3)/Easy(5)
- `GET /api/leetcode/{id}/history`

### Quiz
- `GET /api/quiz/topics`, `GET /api/quiz/topics/due`, `POST /api/quiz/topics`, `DELETE /api/quiz/topics/{id}`
- `POST /api/quiz/topics/{id}/generate?count=5` — generate via Gemini
- `POST /api/quiz/topics/{id}/submit` — submit answers, updates SM-2
- `GET /api/quiz/topics/{id}/sessions`

### Dashboard
- `GET /api/dashboard` — due counts + items from both modules

## SM-2 Algorithm
- quality < 3: reset interval=1, repetition=0
- quality >= 3: rep 1→1d, rep 2→6d, rep 3+→interval*EF
- EF: `EF + 0.1 - (5-q)*(0.08 + (5-q)*0.02)`, floor 1.3
- Status: learning (<7d) → review (7-20d) → mastered (21+d)
- LeetCode title: parsed from URL slug, user can override
- Quiz: default 5 questions, configurable

## Implementation Phases

### Phase 1: Skeleton + Auth
Backend:
- Spring Initializr: Web, Security, JPA, PostgreSQL, Flyway, Validation
- `docker-compose.dev.yml` with Postgres 16 on port 5433
- `application.yml` + `application-dev.yml` (datasource, JWT secret, Flyway)
- Flyway `V1__create_users.sql`
- `User` JPA entity, `UserRepository`
- `JwtService`: generate/validate tokens using jjwt, HMAC-SHA256, 24h expiry
- `AuthService`: register (bcrypt hash), login (verify hash), return JWT
- `AuthController`: POST `/api/auth/register`, POST `/api/auth/login`, GET `/api/auth/me`
- `SecurityConfig`: stateless sessions, permit `/api/auth/**`, authenticate `/api/**`, JWT filter
- `GlobalExceptionHandler` with `@ControllerAdvice`

Frontend:
- `ng new frontend --standalone --style=css --routing`
- Install + configure Tailwind CSS
- `auth.service.ts`: login/register HTTP calls, store JWT in localStorage, expose `isLoggedIn$`
- `auth.interceptor.ts`: attach `Authorization: Bearer` header
- `auth.guard.ts`: redirect to `/login` if no token
- `login.component` + `register.component` with reactive forms
- `navbar.component`: links to dashboard/leetcode/quiz, logout button
- `dashboard.component`: empty shell (placeholder)
- `proxy.conf.json`: proxy `/api` → `http://localhost:8080`

**Goal:** register → login → see empty dashboard

### Phase 2: LeetCode Tracker Core
Backend:
- Flyway `V2__create_leetcode_problems.sql`, `V3__create_leetcode_reviews.sql`
- `Sm2Service`: pure stateless SM-2 algorithm, returns `Sm2Result` record
- `Sm2ServiceTest`: unit tests for all quality levels, EF floor, reset on fail
- `LeetcodeProblem` + `LeetcodeReview` JPA entities
- `LeetcodeRepository`: findByUserId, findDueByUserId (next_review <= today)
- `LeetcodeService`: create (parse title from URL slug), update, delete, submitReview (calls Sm2Service, saves review log, updates problem)
- `LeetcodeController`: all 7 endpoints from API spec
- Ownership validation: ensure problem belongs to authenticated user

Frontend:
- `leetcode.service.ts`: HTTP calls for all endpoints
- `problem.model.ts`: TypeScript interfaces
- `problem-list.component`: table showing url, title, status, next review date, "Review" button
- `problem-form.component`: add form with URL input (auto-parses title), optional notes
- `review-dialog.component`: 4 Anki-style buttons (Again/Hard/Good/Easy), shows problem URL to open in new tab

**Goal:** replaces Notion table. Add problems, review them, see next dates auto-calculated.

### Phase 3: LeetCode Polish
Backend:
- `DashboardService.getLeetcodeDue()`: count + list of due items
- `LeetcodeRepository`: sort by status + next_review, overdue first

Frontend:
- `dashboard.component`: show due-today leetcode count + list with "Review" buttons
- Problem list: sort by next_review (overdue first), filter by status dropdown
- Edit problem: inline edit for title/notes
- Delete problem: confirm dialog
- Review history: expandable row or sub-page per problem showing past reviews + dates
- `status-badge.component`: colored pill (new=gray, learning=yellow, review=blue, mastered=green)
- `relative-date.pipe`: "due today", "overdue by 3d", "in 5 days"

**Goal:** polished daily-driver LeetCode tracker

### Phase 4: System Design Quiz
Backend:
- Flyway `V4__create_quiz_topics.sql`, `V5__create_quiz_sessions.sql`
- `GeminiConfig`: RestTemplate/WebClient bean with API key from `application.yml`
- `GeminiService`: build prompt requesting N multiple-choice questions as JSON, parse response, validate structure, retry on malformed JSON
- `QuizTopic` + `QuizSession` JPA entities
- `QuizService`: create topic, generate quiz (calls GeminiService), submit (derive quality from score %, call Sm2Service, save session)
- Quality mapping: 90-100%→5, 80-89%→4, 70-79%→3, 60-69%→2, 40-59%→1, 0-39%→0
- `QuizController`: all endpoints from API spec

Frontend:
- `quiz.service.ts`: HTTP calls
- `topic-list.component`: table of topics with status, next review, "Generate Quiz" button
- `quiz-session.component`: display questions one-by-one or all-at-once, radio buttons for options, submit button
- `quiz-results.component`: show score, correct/incorrect per question, next review date
- Dashboard integration: show quiz due-today count + list

**Goal:** full quiz module with LLM generation + spaced repetition

### Phase 5: Polish
- `DashboardController`: combined stats (total problems, topics, review streak, items mastered)
- Dashboard: stats cards at top, due items from both modules below
- Responsive: mobile-friendly table → card layout on small screens
- Loading spinners on all async operations
- Error toast/notification component for API failures
- `springdoc-openapi` dependency + Swagger UI at `/swagger-ui.html`

### Phase 6: Docker + Deploy
- `backend/Dockerfile`: multi-stage (Maven build → JRE runtime)
- `frontend/Dockerfile`: Angular build → nginx with `nginx.conf`
- `docker-compose.yml`: postgres + backend + frontend, env vars from `.env`
- `.env.example` with all required vars documented
- README: setup instructions, dev workflow, architecture overview

## Verification
1. `docker compose up` starts Postgres
2. `./mvnw spring-boot:run` on :8080
3. `ng serve` on :4200 with proxy
4. Register → login → add problem → review → next date updates
5. Add topic → generate quiz → take it → scheduling works
6. `./mvnw test` passes