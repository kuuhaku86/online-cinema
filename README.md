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