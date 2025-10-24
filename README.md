# Online Cinema

A full-stack online cinema platform built with a modern tech stack, designed for a seamless movie-watching experience. This project includes a backend service, a frontend application, a database, and a hate speech detection service for content moderation.

## Table of Contents
- [Online Cinema](#online-cinema)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Technologies Used](#technologies-used)
    - [Backend](#backend)
    - [Frontend](#frontend)
    - [Hate Speech Detector Service](#hate-speech-detector-service)
    - [Infrastructure](#infrastructure)
  - [Project Structure](#project-structure)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
    - [Running the Application](#running-the-application)
    - [Development Commands (using Makefile)](#development-commands-using-makefile)
  - [API Endpoints](#api-endpoints)
  - [Hate Speech Detection Service](#hate-speech-detection-service)
  - [Contributing](#contributing)
  - [License](#license)

## Features
- **User Authentication**: Secure user registration and login, likely with JWTs.
- **Real-time Messaging**: Users can send messages within movie rooms, with content moderation.
- **Hate Speech Moderation**: Messages are automatically scanned for hate speech and censored if detected.
- **Movie Streaming**: Watch movies directly on the platform (implied by "Online Cinema").
- **Robust Backend**: Built with a scalable NestJS framework, PostgreSQL database, and Redis for caching/session management.
- **Microservices Architecture**: Separate services for core backend logic and hate speech detection.

## Technologies Used

### Backend
- **NestJS**: A progressive Node.js framework for building efficient, reliable, and scalable server-side applications.
- **TypeScript**: Superset of JavaScript that compiles to plain JavaScript, providing type safety.
- **TypeORM**: An ORM (Object-Relational Mapper) for TypeScript and JavaScript, used for database interactions.
- **PostgreSQL**: A powerful, open-source object-relational database system for data storage.
- **Redis**: An in-memory data structure store, used as a database, cache, and message broker for enhanced performance.
- **Axios**: A promise-based HTTP client for making API requests.
- **JWT (JSON Web Tokens)**: Used for secure user authentication and authorization.

### Frontend
- **Vite**: A fast development build tool that provides a quick and optimized development experience.
- (Assumed modern JavaScript framework like React, Angular, or Vue.js for building interactive user interfaces.)

### Hate Speech Detector Service
- **Python**: The programming language used for the hate speech detection logic.
- (Likely a lightweight web framework like Flask or FastAPI for exposing the detection API.)

### Infrastructure
- **Docker**: A platform for developing, shipping, and running applications in containers.
- **Docker Compose**: A tool for defining and running multi-container Docker applications, simplifying service orchestration.

## Project Structure
- `backend/`: Contains the NestJS application, including API endpoints, business logic, and database models.
- `frontend/`: Houses the web client application, providing the user interface for the online cinema.
- `hate-speech-detector/`: A separate microservice dedicated to analyzing text for hate speech.
- `docker-compose.yaml`: Defines all services (backend, frontend, database, redis, hate speech detector) and their configurations for easy deployment.

## Getting Started

To get the Online Cinema platform up and running on your local machine, follow these steps.

### Prerequisites
- **Docker Desktop**: Ensure Docker and Docker Compose are installed and running on your system.
  - Install Docker

### Installation
1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/online-cinema.git
    cd online-cinema
    ```
2.  **Build and start the services**:
    This command will build the Docker images for all services (backend, frontend, hate-speech-detector) and start them, along with the PostgreSQL database and Redis cache.
    ```bash
    docker-compose up --build
    ```

### Running the Application
Once all services are up:
-   The **Backend API** will be accessible at `http://localhost:3000`.
-   The **Frontend Application** will be accessible at `http://localhost:5173`.
-   The **Hate Speech Detector Service** runs internally within the Docker network and is not directly exposed to the host, but can be accessed by the backend at `http://hate-speech-detector:5000`.

### Development Commands (using Makefile)
The project includes a `Makefile.mk` with convenient commands for development and management of the Docker Compose services. You can run these commands using `make <command-name>`.

-   **`make up`**: Starts all services in detached mode.
    ```bash
    make up
    ```
-   **`make down`**: Stops and removes all services, networks, and volumes created by `docker-compose`.
    ```bash
    make down
    ```
-   **`make restart`**: Stops, removes, and then restarts all services.
    ```bash
    make restart
    ```
-   **`make logs`**: Displays aggregated logs from all services in follow mode.
    ```bash
    make logs
    ```
-   **`make logs-hate-speech-detector`**: Displays logs specifically for the `hate-speech-detector` service.
    ```bash
    make logs-hate-speech-detector
    ```
-   **`make ps`**: Lists all running Docker Compose services.
    ```bash
    make ps
    ```
-   **`make build`**: Builds or rebuilds service images.
    ```bash
    make build
    ```
-   **`make rebuild`**: Stops, rebuilds, and restarts all services. Useful after making changes to `Dockerfile`s.
    ```bash
    make rebuild
    ```
-   **`make rebuild-backend`**: Rebuilds and restarts only the `backend` service.
    ```bash
    make rebuild-backend
    ```
-   **`make rebuild-hate-speech-detector`**: Rebuilds and restarts only the `hate-speech-detector` service.
    ```bash
    make rebuild-hate-speech-detector
    ```
-   **`make test-backend`**: Runs unit tests for the backend service.
    ```bash
    make test-backend
    ```
-   **`make test-backend-e2e`**: Runs end-to-end tests for the backend service.
    ```bash
    make test-backend-e2e
    ```
-   **`make ssh-backend`**: Opens a bash shell inside the `backend` container.
    ```bash
    make ssh-backend
    ```
-   **`make ssh-frontend`**: Opens a bash shell inside the `frontend` container.
    ```bash
    make ssh-frontend
    ```
-   **`make ssh-hate-speech-detector`**: Opens a bash shell inside the `hate-speech-detector` container.
    ```bash
    make ssh-hate-speech-detector
    ```
-   **`make create-migration-backend NAME=<migration_name>`**: Creates a new TypeORM migration file for the backend. Replace `<migration_name>` with a descriptive name.
    ```bash
    make create-migration-backend NAME=AddUsersTable
    ```
-   **`make run-migration-backend`**: Runs all pending TypeORM migrations for the backend.
    ```bash
    make run-migration-backend
    ```
-   **`make run-migration-rollback-backend`**: Reverts the last executed TypeORM migration for the backend.
    ```bash
    make run-migration-rollback-backend
    ```

## API Endpoints
The backend exposes various RESTful API endpoints. Key endpoints include:
-   **Authentication**: `/auth/register`, `/auth/login`, `/auth/refresh` (for user management).
-   **Messages**:
    -   `POST /messages`: Create a new message in a room. Content is moderated.
    -   `GET /messages/:roomId`: Retrieve all messages for a specific room.
-   **Movies**: (Assumed) Endpoints for browsing, searching, and retrieving movie details.
-   **Users**: (Assumed) Endpoints for user profile management.

## Hate Speech Detection Service
This dedicated microservice is crucial for maintaining a safe and respectful environment within the platform's chat features. It processes incoming messages from the backend to identify and censor hate speech.
-   **Internal Endpoint**: `http://hate-speech-detector:5000/analyze`
-   **Request Body**: `JSON { "text": "Your message content here." }`
-   **Response Body**: `JSON { "message": "Original or censored message.", "isHate": true/false }`

## Contributing
We welcome contributions to the Online Cinema project! If you'd like to contribute, please follow these steps:
1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Make your changes and ensure tests pass.
4.  Submit a pull request with a clear description of your changes.

## License
This project is licensed under the MIT License. See the `LICENSE` file for more details.