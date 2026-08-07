// Jenkinsfile — Pipeline build + push (pas de déploiement auto pour l'instant)
// Les images sont construites depuis les Dockerfiles multi-stage (ils gèrent
// déjà npm ci + vite build), taguées par numéro de build, puis poussées sur Docker Hub.
pipeline {
    agent any

    environment {
        REGISTRY      = 'melek1919'
        BACKEND_IMAGE = "${REGISTRY}/bh-app-backend"
        FRONTEND_IMAGE = "${REGISTRY}/bh-app-frontend"
        IMAGE_TAG     = "${BUILD_NUMBER}"
        VITE_API_URL  = '/api'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build & tag images') {
            steps {
                sh "docker build -t ${BACKEND_IMAGE}:${IMAGE_TAG} -t ${BACKEND_IMAGE}:latest ./server"
                sh "docker build --build-arg VITE_API_URL=${VITE_API_URL} -t ${FRONTEND_IMAGE}:${IMAGE_TAG} -t ${FRONTEND_IMAGE}:latest ./client"
            }
        }

        stage('Push images (Docker Hub)') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'melek1919',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )
                ]) {
                    sh 'echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin'
                    sh "docker push ${BACKEND_IMAGE}:${IMAGE_TAG}"
                    sh "docker push ${BACKEND_IMAGE}:latest"
                    sh "docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}"
                    sh "docker push ${FRONTEND_IMAGE}:latest"
                }
            }
        }
    }

    post {
        always {
            sh 'docker logout'
        }
    }
}
