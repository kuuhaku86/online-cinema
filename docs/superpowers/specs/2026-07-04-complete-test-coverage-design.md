# Design: Complete Test Coverage — Critical Paths

**Date**: 2026-07-04
**Order**: Backend → Frontend → Hate Speech Detector
**Depth**: Critical paths only
**Convention**: TDD (tests before any new implementation), conventional commits

---

## Background

- Backend has 10 unit test files + 3 e2e test files. Auth system (auth.service, users.service, strategies, e2e auth) is solid. Rooms, videos, messages, gateways, and guards have zero tests.
- Frontend has zero tests and zero testing infrastructure. 35 source files need coverage.
- Hate Speech Detector has zero tests. Single Flask `POST /analyze` endpoint.

## Approach

Service-by-service, backend first (already-configured Jest harness), then frontend infrastructure setup + tests, then hate-speech-detector. Critical paths only — thorough tests for every public method/endpoint, but not exhaustive edge-case coverage.

---

## Part 1: Backend

**Framework**: Jest + ts-jest (already configured), `Test.createTestingModule`, `@nestjs/websockets` testing utilities.

### 1A. RoomsService (`src/services/rooms.service.spec.ts`) — NEW
| Method | Cases |
|--------|-------|
| `createRoom` | success (returns room with shortCode), NotFoundException (video not found), InternalServerError (save failure) |
| `joinRoom` | success (returns populated room), NotFoundException (room not found), ConflictException (room already started) |
| `startRoom` | success (status updated to played), NotFoundException, ForbiddenException (not owner), BadRequestException (no video assigned) |
| `checkUserAccessToRoomAndVideo` | success (returns video entity), NotFoundException (wrong room/video combo), ForbiddenException (user not a participant) |

### 1B. RoomsController (`src/controllers/rooms.controller.spec.ts`) — NEW
| Endpoint | Cases |
|----------|-------|
| POST `/rooms` | success (201), NotFoundException propagation from service |
| POST `/rooms/:shortCode/join` | success, NotFoundException propagation, ConflictException propagation |
| POST `/rooms/:shortCode/start` | success, ForbiddenException propagation, BadRequestException propagation |

### 1C. VideosService (`src/services/videos.service.spec.ts`) — NEW
| Method | Cases |
|--------|-------|
| `handleUpload` | success (saves file, returns video entity), InternalServerError on file save failure |
| `getVideoStatus` | returns correct status object with video metadata |
| `getStreamDetail` | success (returns tokens and paths), NotFoundException (wrong room/video), ForbiddenException (not a participant) |

### 1D. VideosController — EXTEND existing
Add to existing `src/controllers/videos.controller.spec.ts`:
| Endpoint | Cases |
|----------|-------|
| GET `/videos` | returns video list from service |
| GET `/videos/status/:videoId` | returns status, NotFoundException |
| GET `/videos/stream-detail/:roomId/:videoId` | returns stream detail, NotFoundException, ForbiddenException |
| GET `/videos/stream/:token/:roomId/:videoId/:file` | streams file via res.sendFile, NotFoundException |

### 1E. MessagesService (`src/services/messages.service.spec.ts`) — NEW
| Method | Cases |
|--------|-------|
| `createMessage` | success (no hate speech — saves original content), success (hate speech detected — saves `******`), NotFoundException (room not found), NotFoundException (user not found) |
| `getMessage` | returns messages array for room, returns empty array for room with no messages |

### 1F. HateSpeechDetectorService (`src/services/hate-speech-detector.service.spec.ts`) — NEW
| Method | Cases |
|--------|-------|
| `detect` | returns `{ isHate: false }` for clean text, returns `{ isHate: true }` for hate speech, handles network error (returns `{ isHate: false }` or throws, depending on current behavior) |

### 1G. ChatGateway (`src/gateways/chat.gateway.spec.ts`) — NEW
| Handler | Cases |
|---------|-------|
| `handleConnection` | auth success (sets user on socket), auth failure (socket disconnects) |
| `handleJoinRoom` | success (joins socket.io room, loads history), invalid room (sends error event) |
| `handleMessage` | success (broadcasts to room, saves with hate speech check), not joined to a room (ignored or error) |

### 1H. RoomGateway (`src/gateways/room.gateway.spec.ts`) — NEW
| Handler | Cases |
|---------|-------|
| `handleConnection` | auth success, auth failure (disconnects) |
| `handleJoinRoom` | success (joins room, syncs status), invalid room (error) |
| `handleUpdateRoomStatus` | owner can update (broadcasts to room), non-owner forbidden, room not found |
| `handleDisconnect` | cleans up empty rooms, notifies other participants |

### 1I. WsAuthGuard (`src/auth/guards/ws-auth.guard.spec.ts`) — NEW
| Method | Cases |
|--------|-------|
| `canActivate` | valid token → true + sets user on socket, no token → false, invalid token → false, expired token → false |

### 1J. UrlTokenGuard (`src/auth/guards/url-token.guard.spec.ts`) — NEW
| Method | Cases |
|--------|-------|
| `canActivate` | valid stream token → true, missing token → false (throws ForbiddenException), invalid/expired token → false (throws ForbiddenException) |

### 1K. UsersController — EXTEND existing
Add to existing `src/controllers/users.controller.spec.ts`:
| Endpoint | Cases |
|----------|-------|
| PATCH `/users/:id` | success (own profile update), ForbiddenException (trying to update another user), NotFoundException (user not found), validation errors from Pipes |

### 1L. RedisHelper (`src/helpers/redis.helper.spec.ts`) — NEW
| Method | Cases |
|--------|-------|
| `getKey` | returns cached value, returns null on cache miss |
| `setKey` | sets value with TTL, handles Redis error gracefully |
| `deleteKey` | deletes key, handles Redis error gracefully |

---

## Part 2: Frontend

**Framework**: Vitest + React Testing Library + jsdom + `@testing-library/user-event`

### Phase 2A: Infrastructure setup (one-time)
- `npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom`
- Add `/// <reference types="vitest" />` and `test` block to `vite.config.ts` (`environment: "jsdom"`, `globals: true`, `setupFiles: ["./src/test/setup.ts"]`)
- Create `src/test/setup.ts` importing `@testing-library/jest-dom/vitest`
- Add `"test"`, `"test:watch"`, `"test:coverage"` scripts to `package.json`

### Phase 2B: Redux slices (pure logic, no DOM rendering needed)
| File | Test file | Focus |
|------|-----------|-------|
| `features/auth/authSlice.ts` | `features/auth/authSlice.test.ts` | Initial state, `login`/`register`/`logout` async thunks (fulfilled + rejected cases), `setUser`, `setTokens`, `getStoredAccessToken`, JWT decode edge cases |
| `features/user/userSlice.ts` | `features/user/userSlice.test.ts` | `updateProfile` thunk (fulfilled + rejected), `clearUpdateStatus` reducer |
| `features/video/videoSlice.ts` | `features/video/videoSlice.test.ts` | `setSelectedVideoId`, `clearSelectedVideoId`, selectors |
| `features/room/roomSlice.ts` | `features/room/roomSlice.test.ts` | `setSelectedRoom`, `clearSelectedRoom`, selectors |

### Phase 2C: Hooks (mock dependencies, test with `renderHook`)
| Hook | Test file | Focus |
|------|-----------|-------|
| `hooks/useAuth.ts` | `hooks/useAuth.test.ts` | Returns correct state from Redux, dispatch wrappers call correct thunks |
| `hooks/useChat.ts` | `hooks/useChat.test.ts` | Socket connect/disconnect lifecycle, sendMessage emits correct event, received messages append to list |
| `hooks/useRooms.ts` | `hooks/useRooms.test.ts` | `createRoom`/`joinRoom`/`startRoom` call APIs and return loading/error states |
| `hooks/useVideos.ts` | `hooks/useVideos.test.ts` | `uploadVideo` with progress, video status polling, stream detail fetching |

### Phase 2D: Services (API layer)
| File | Test file | Focus |
|------|-----------|-------|
| `services/apiClient.ts` | `services/apiClient.test.ts` | Request interceptor attaches auth token, response interceptor triggers refresh on 401, refresh token queue serializes concurrent requests |

### Phase 2E: Components (React Testing Library `render` + `screen` + `userEvent`)
| Component | Test file | Focus |
|-----------|-----------|-------|
| `components/LoginForm.tsx` | `components/LoginForm.test.tsx` | Renders email/password fields, submit calls signIn, shows error message, loading state disables button |
| `components/RegisterForm.tsx` | `components/RegisterForm.test.tsx` | Renders all fields, submit calls signUp, password mismatch error, success message on registration |
| `components/ProtectedRoute.tsx` | `components/ProtectedRoute.test.tsx` | Authenticated → renders Outlet children, unauthenticated → navigates to `/` |
| `components/ChatWindow.tsx` | `components/ChatWindow.test.tsx` | Renders messages list, sends message on input submit, shows own messages differently |
| `components/Modal.tsx` | `components/Modal.test.tsx` | Renders children when open, hidden when closed, calls onClose on overlay click |
| `components/NavigationBar.tsx` | `components/NavigationBar.test.tsx` | Shows login/register buttons when unauthenticated, shows profile/logout when authenticated, opens modals |

### Phase 2F: Pages (integration-level, render with providers)
| Page | Test file | Focus |
|------|-----------|-------|
| `pages/DashboardPage.tsx` | `pages/DashboardPage.test.tsx` | Renders create room form, join room form, navigates on create/join success |
| `pages/VideoSelectionPage.tsx` | `pages/VideoSelectionPage.test.tsx` | Renders upload area, video dropdown, start room button enabled only with video selected |
| `pages/RoomPage.tsx` | `pages/RoomPage.test.tsx` | Renders video player, chat window, room shortcode with copy button |

---

## Part 3: Hate Speech Detector

**Framework**: pytest, `unittest.mock.patch`

### Setup
- Add `pytest` to `requirements.txt`
- Create `test_app.py`

### test_app.py
| Category | Cases |
|----------|-------|
| Validation (no model needed) | Missing JSON body → 400, missing `text` key → 400, `text` not a string → 400, empty string → 400, whitespace only → 400 |
| Behavior (mock `isHate`) | Benign text → `{ isHate: false }` (200), hateful text → `{ isHate: true }` (200), model exception → 500 |
| Integration (real model, Docker-only) | Known benign phrases → `isHate: false`, known hate phrases → `isHate: true` (separate Make target `make test-hate-speech-detector-integration`) |

### Makefile additions
```makefile
test-hate-speech-detector:
	docker exec -it online-cinema-hate-speech-detector pytest /app/test_app.py
```

---

## Commit Plan

One commit per logical group, all following conventional commits:

1. `test: add backend unit tests for rooms, videos, messages, and hate-speech services`
2. `test: add backend unit tests for gateways and guards`
3. `test: extend backend controller tests (users PATCH, videos endpoints)`
4. `test: add redis helper unit tests`
5. `chore: set up frontend testing infrastructure with vitest`
6. `test: add frontend tests for redux slices and hooks`
7. `test: add frontend tests for services, components, and pages`
8. `test: add hate speech detector tests`

---

## Verification

After each commit:
- Backend: `make test-backend` — all tests must pass
- Backend E2E: `make test-backend-e2e` — existing e2e must still pass
- Frontend: `npm run test` inside container — all tests pass
- Hate Speech Detector: `make test-hate-speech-detector` — all tests pass
